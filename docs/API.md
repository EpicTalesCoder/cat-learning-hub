# Tài liệu API — Cat Learning Hub

> Đặc tả REST API và sự kiện WebSocket. Base URL production: `https://api.catlearninghub.vn/v1`.

## 1. Quy ước chung

### 1.1 Authentication

Gắn header cho mọi request (trừ route public):

```text
Authorization: Bearer <accessToken>
```

- Access token TTL 15 phút; refresh token TTL 7 ngày.
- Token hết hạn → `401` với `code: AUTH_TOKEN_EXPIRED` → client refresh rồi retry.

### 1.2 Format response

Thành công:

```json
{ "success": true, "data": { } }
```

Danh sách (phân trang `?page=1&limit=20`, tối đa 100):

```json
{ "success": true, "data": [ ], "meta": { "page": 1, "limit": 20, "total": 87 } }
```

Lỗi:

```json
{ "success": false, "error": { "code": "GOAL_NOT_FOUND", "message": "Mục tiêu không tồn tại", "details": {} } }
```

Mã HTTP: `200` OK, `201` Created, `400` validate, `401` chưa đăng nhập, `403` không đủ quyền, `404` không tồn tại, `409` xung đột, `429` rate limit.

### 1.3 Quy ước khác

- Thời gian trả về ISO 8601 UTC: `"2026-08-29T15:00:00Z"`.
- ID là chuỗi cuid.

## 2. Auth

### POST /auth/register — Public

```json
{ "email": "user@example.com", "password": "secret123", "name": "Mi Lo" }
```

→ `201`:

```json
{ "success": true, "data": { "user": { "id": "clx...", "email": "user@example.com" }, "accessToken": "...", "refreshToken": "..." } }
```

Lỗi: `AUTH_EMAIL_TAKEN` (409), `VALIDATION_ERROR` (400).

### POST /auth/login — Public

```json
{ "email": "user@example.com", "password": "secret123" }
```

→ `200`: giống register. Lỗi: `AUTH_INVALID_CREDENTIALS` (401).

### POST /auth/refresh — Public

```json
{ "refreshToken": "..." }
```

→ `200`: cặp token mới (refresh cũ bị revoke).

### POST /auth/logout

→ `204`. Revoke refresh token hiện tại.

## 3. Users & Profile

### GET /users/me

→ `200`:

```json
{ "success": true, "data": { "id": "clx...", "name": "Mi Lo", "email": "user@example.com", "avatarUrl": null, "level": 3, "xp": 1240, "streak": { "currentDays": 5, "longestDays": 21 }, "timezone": "Asia/Ho_Chi_Minh" } }
```

### PATCH /users/me

```json
{ "name": "Mi Lo", "avatarUrl": "https://cdn.../avatar.png", "timezone": "Asia/Ho_Chi_Minh" }
```

### GET /users/me/achievements

→ danh sách achievement đã mở kèm `unlockedAt`.

## 4. Groups

### GET /groups?search=&page=

→ `200`: danh sách group công khai hoặc user là thành viên.

### POST /groups

```json
{ "name": "IELTS 7.0 Club", "description": "Nhóm luyện IELTS mỗi tối", "topic": "IELTS", "isPrivate": false }
```

→ `201`: object Group gồm `inviteCode`.

### GET /groups/:id

→ group + `members` (userId, name, avatar, role, streak) + thống kê nhóm (tổng phút tuần này).

### POST /groups/:id/invite

```json
{ "email": "friend@example.com" }
```

→ `201` tạo invite; hệ thống gửi email chứa link `https://app.../invite/{token}`.

### POST /groups/join — Public (cần auth, dùng token invite)

```json
{ "token": "inv_..." }
```

→ `200` khi vào nhóm thành công. Lỗi: `GROUP_INVITE_EXPIRED` (410).

### DELETE /groups/:id/members/:userId

Rời nhóm (self) hoặc đuổi thành viên (cần OWNER/ADMIN).

## 5. Goals

### GET /goals?status=&groupId=&page=

### POST /goals

```json
{ "title": "Học React 10 giờ/tuần", "targetType": "MINUTES_PER_WEEK", "targetValue": 600, "deadline": "2026-09-30T00:00:00Z", "groupId": null }
```

→ `201`:

```json
{ "success": true, "data": { "id": "clo...", "title": "Học React 10 giờ/tuần", "status": "IN_PROGRESS", "progress": 0, "targetType": "MINUTES_PER_WEEK", "targetValue": 600, "deadline": "2026-09-30T00:00:00Z" } }
```

### PATCH /goals/:id

Các trường: `title`, `targetValue`, `deadline`, `status` (cho phép `PAUSED`).

### POST /goals/:id/complete

Đánh dấu hoàn thành thủ công → `status: COMPLETED`, +50 XP.

## 6. Sessions (focus)

### POST /sessions/start

```json
{ "goalId": "clo...", "groupId": null, "roomId": null }
```

→ `201`:

```json
{ "success": true, "data": { "id": "cls...", "startedAt": "2026-08-29T14:00:00Z" } }
```

### POST /sessions/:id/end

```json
{ "endedAt": "2026-08-29T14:52:00Z" }
```

→ `200`: session kèm `durationMinutes: 52`, `xpEarned: 10`, `goalProgress: 24.5`.

Lỗi: `SESSION_ALREADY_ENDED` (409).

### GET /sessions/today

→ tổng phút hôm nay, số buổi, phân bổ theo goal.

## 7. Check-ins

### POST /checkins

```json
{ "sessionId": "cls...", "note": "Hoàn thành bài 3-4", "evidenceUrl": "https://s3.../photo.jpg" }
```

→ `201`: check-in `status: PENDING`.

### GET /checkins?status=PENDING&groupId=

Danh sách check-in (dùng cho moderator duyệt).

### POST /checkins/:id/review — MODERATOR/ADMIN

```json
{ "action": "APPROVE" | "REJECT", "comment": "Ảnh chưa rõ" }
```

→ `200` khi APPROVE trả kèm `xpEarned: 10`, `streak: { "currentDays": 6 }`.

## 8. Commitments & Rewards

### POST /commitments

```json
{ "goalId": "clo...", "groupId": "clg...", "rewardPoolId": "clp...", "amount": 100, "ruleType": "MIN_SESSIONS_PER_WEEK", "rule": "Tối thiểu 5 buổi/tuần", "startDate": "2026-09-01", "endDate": "2026-09-07" }
```

→ `201`: commitment `status: ACTIVE`.

### GET /commitments?status=

### GET /reward-pools?groupId=

→ thông tin pool: `totalAmount`, `status`, danh sách payout gần nhất.

### POST /reward-pools/:id/distribute — ADMIN

→ `200`: danh sách payout đã tạo theo điều kiện pool.

## 9. Leaderboard & Gamification

### GET /leaderboard?scope=week|month&groupId=

→ `200`:

```json
{ "success": true, "data": [ { "rank": 1, "userId": "clx...", "name": "Mi Lo", "avatarUrl": null, "xp": 980, "minutes": 1240 }, { "rank": 2, "...": "..." } ] }
```

### GET /achievements — Public

Catalog achievement toàn hệ thống.

## 10. Notifications

### GET /notifications?unreadOnly=true

### POST /notifications/mark-read

```json
{ "ids": ["cln..."] }
```

→ `204`.

## 11. Storage

### POST /storage/presign

```json
{ "contentType": "image/jpeg", "kind": "checkin" | "avatar" }
```

→ `201`:

```json
{ "success": true, "data": { "uploadUrl": "https://s3.../presigned", "fileUrl": "https://cdn.../checkin/xxx.jpg" } }
```

Client PUT file trực tiếp lên `uploadUrl`, sau đó dùng `fileUrl` trong check-in / profile.

## 12. Sự kiện WebSocket (Socket.IO)

Kết nối: `wss://api.catlearninghub.vn/socket.io/` + auth handshake `{ token: "<accessToken>" }`.

### Client → Server

| Event | Payload | Mô tả |
|---|---|---|
| `room:join` | `{ roomId }` | Vào room, nhận presence + chat gần nhất |
| `room:leave` | `{ roomId }` | Rời room |
| `timer:start` | `{ roomId, sessionId, mode: "pomodoro" \| "free", durationMin }` | Bắt đầu focus trước nhóm |
| `timer:stop` | `{ roomId, sessionId }` | Dừng timer |
| `chat:message` | `{ roomId, text }` | Gửi tin nhắn trong room |

### Server → Client

| Event | Payload | Mô tả |
|---|---|---|
| `presence:list` | `{ roomId, users: [{ userId, name, avatarUrl, isFocusing }] }` | Khi vừa join room |
| `presence:update` | `{ roomId, userId, action: "join" \| "leave" }` | Thành viên vào/ra |
| `timer:sync` | `{ roomId, userId, sessionId, endsAt }` | Đồng bộ timer đang chạy |
| `chat:message` | `{ roomId, message: { id, userId, name, text, createdAt } }` | Tin nhắn mới |
| `goal:updated` | `{ goalId }` | Tiến độ goal thay đổi → client invalidate |
| `leaderboard:update` | `{ scope, groupId? }` | Bảng xếp hạng thay đổi |
| `notification:new` | `{ id, type, title, body }` | Thông báo mới |

## 13. Phiên bản & thay đổi API

- API versioning qua URL prefix `/v1`; thay đổi breaking tạo `/v2` và giữ `/v1` tối thiểu 6 tháng.
- Mọi thay đổi endpoint cần cập nhật tài liệu này trong cùng PR.
