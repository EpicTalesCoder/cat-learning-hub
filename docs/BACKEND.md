# Tài liệu triển khai Backend — Cat Learning Hub

> Mô tả kiến trúc backend, cấu trúc module, logic nghiệp vụ và quy ước code. Tham chiếu chéo: [DATABASE.md](DATABASE.md), [API.md](API.md), [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Công nghệ

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | NestJS 10 + TypeScript | Kiến trúc module rõ ràng, DI sẵn |
| ORM | Prisma | Migration, type-safe query |
| Database | PostgreSQL 15 | Xem [DATABASE.md](DATABASE.md) |
| Cache | Redis 7 | Leaderboard, presence, rate-limit |
| Realtime | Socket.IO (gateway của NestJS) | Chat, presence, timer sync |
| Queue | BullMQ (Redis) | Cron evaluation, email/push |
| Auth | JWT access + refresh token, Argon2 | |
| Storage | AWS S3 / Cloudflare R2 | presigned URL cho client upload |
| Validation | Zod hoặc class-validator + ValidationPipe | |
| Test | Jest + Supertest | unit + e2e |

## 2. Cấu trúc thư mục

```text
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── decorators/        # @CurrentUser, @Roles
│   │   ├── filters/           # http-exception.filter
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/      # transform, logging
│   │   └── pipes/             # validation
│   ├── config/                # env validation, typed config
│   ├── prisma/                # PrismaService, PrismaModule
│   ├── redis/                 # RedisService
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── groups/
│   │   ├── goals/
│   │   ├── sessions/
│   │   ├── checkins/
│   │   ├── commitments/
│   │   ├── rewards/
│   │   ├── gamification/      # XP, streak, achievement, leaderboard
│   │   ├── notifications/
│   │   ├── realtime/          # Socket.IO gateway
│   │   └── storage/           # S3 presigned
│   └── jobs/                  # BullMQ processors + cron
├── test/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── Dockerfile
└── .env.example
```

Mỗi module gồm: `controller.ts`, `service.ts`, `dto/`, `*.spec.ts`. Service không chứa logic HTTP; controller không chứa logic nghiệp vụ.

## 3. Auth

### 3.1 Đăng ký / đăng nhập

- `POST /auth/register`: validate email + password (tối thiểu 8 ký tự), hash bằng argon2, tạo `User` + `Streak` rỗng.
- `POST /auth/login`: verify → trả `accessToken` (TTL 15 phút) + `refreshToken` (TTL 7 ngày, lưu jti vào Redis `session:{userId}`).
- `POST /auth/refresh`: rotate refresh token, revoke jti cũ.
- `POST /auth/logout`: xóa jti khỏi Redis.

### 3.2 Guards

- `JwtAuthGuard` áp dụng toàn cục (mặc định), route public đánh dấu `@Public()`.
- `RolesGuard` kết hợp `@Roles('ADMIN')` cho các endpoint quản trị.
- `GroupRoleGuard` kiểm tra quyền trong nhóm (OWNER/ADMIN/MEMBER) trước khi cho phép sửa nhóm, duyệt check-in.

## 4. Module nghiệp vụ chính

### 4.1 Sessions & Focus timer

```text
POST /sessions/start  → tạo Session(endedAt=null), trả sessionId
POST /sessions/:id/end → tính durationMinutes, focusScore, cập nhật Goal.progress,
                         +XP (1 XP / 5 phút), ghi leaderboard ZSET
```

- Nếu client mất kết nối: job "close orphan sessions" chạy mỗi 5 phút, đóng session treo quá 30 phút.
- Session được tính "verified" chỉ khi có CheckIn APPROVED.

### 4.2 Check-in & verification

- User tạo check-in kèm `evidenceUrl` (upload trực tiếp lên S3 qua presigned URL, server chỉ nhận URL).
- Trạng thái `PENDING → APPROVED / REJECTED` do ADMIN/MODERATOR nhóm duyệt.
- Khi APPROVED: +10 XP, cập nhật `Streak` (logic theo timezone user), kiểm tra achievement mới.

### 4.3 Commitment engine (job hàng ngày)

Cron `0 5 0 * * *` (00:05 hàng ngày):

1. Lấy các `Commitment` ACTIVE có `endDate <= now` hoặc kết thúc chu kỳ tuần.
2. Tính chỉ số theo `ruleType`:
   - `MIN_SESSIONS_PER_WEEK`: đếm Session verified trong tuần
   - `MIN_MINUTES_PER_WEEK`: tổng durationMinutes
   - `DAILY_CHECKIN`: có CheckIn APPROVED mỗi ngày trong khoảng
3. Đạt → `COMPLETED`, ghi `Payout` vào RewardPool; vi phạm → `VIOLATED`, áp `penalty` (trừ điểm).
4. Gửi Notification tương ứng.

### 4.4 Gamification

- `GamificationService.awardXp(userId, amount, reason)` — điểm tập trung, dễ test.
- Leveling: `level = floor(sqrt(xp / 100)) + 1`.
- Leaderboard: tổng hợp từ event XP ghi vào Redis ZSET `leaderboard:week:{weekKey}` và `leaderboard:group:{groupId}`; cron reset tuần mới mỗi thứ 2 00:00.
- Achievement: bảng catalog trong DB; check sau mỗi sự kiện XP/streak (idempotent bằng unique `[userId, achievementId]`).

### 4.5 Realtime (Socket.IO)

Namespace mặc định `/`, JWT auth qua handshake:

```text
room:join { roomId }        → server join socket vào room:{roomId}, ghi presence Redis
room:leave { roomId }
timer:start / timer:sync    → broadcast trạng thái timer cho cả room
chat:message { roomId, text }  → broadcast + lưu DB (bảng ChatMessage)
presence:list               → trả danh sách online từ Redis
leaderboard:update          → push khi ZSET thay đổi
```

Xem chi tiết payload trong [API.md §5](API.md).

### 4.6 Notifications

- BullMQ queue `notification`: gửi in-app (ghi DB) + push FCM (nếu user có device token) + email SendGrid (chỉ reminder quan trọng).
- Job reminder: mỗi ngày 19:00 (timezone user), nhắc user chưa check-in.

## 5. Xử lý lỗi & response chuẩn

```json
{
  "success": false,
  "error": { "code": "GOAL_NOT_FOUND", "message": "Mục tiêu không tồn tại", "details": {} }
}
```

- `HttpExceptionFilter` bọc mọi lỗi theo format trên; lỗi không xác định log full stack, trả `INTERNAL_ERROR`.
- Mã lỗi theo format `{MODULE}_{REASON}`, ví dụ: `AUTH_INVALID_CREDENTIALS`, `GROUP_NOT_MEMBER`, `COMMITMENT_ALREADY_ENDED`.
- Phân trang chuẩn: `?page=1&limit=20` → trả `{ data, meta: { page, limit, total } }`.

## 6. Rate limiting & bảo mật

- `ThrottlerGuard`: 100 req/phút/IP cho route thường, 5 req/phút cho auth (chống brute-force).
- Helmet, CORS whitelist (chỉ frontend domain), `trust proxy` nếu chạy sau proxy.
- Mọi query Prisma lấy theo `userId` từ token — không tin `userId` từ body.
- Upload: presigned URL giới hạn content-type `image/*`, max 5 MB.

## 7. Testing

| Loại | Phạm vi | Công cụ |
|---|---|---|
| Unit | Service (XP, streak, commitment evaluation) | Jest, mock Prisma |
| Integration | Controller + DB test (docker) | Supertest |
| E2E | Luồng: register → group → session → check-in → reward | Supertest |

Lệnh chạy:

```bash
npm run lint
npm run test
npm run test:e2e
```

## 8. Biến môi trường

Xem danh sách đầy đủ trong `.env.example`:

```text
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
S3_ENDPOINT= / S3_BUCKET= / S3_ACCESS_KEY= / S3_SECRET_KEY=
FCM_SERVER_KEY=
SENDGRID_API_KEY=
PORT=4000
CORS_ORIGIN=https://app.catlearninghub.vn
```

Validate env lúc startup (throw nếu thiếu) — dùng `@nestjs/config` + schema Zod.
