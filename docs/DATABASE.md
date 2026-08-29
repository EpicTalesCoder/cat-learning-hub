# Tài liệu thiết kế Database — Cat Learning Hub

> Tài liệu này mô tả chi tiết schema database, mối quan hệ giữa các bảng, chỉ mục và chiến lược migration. Là nguồn tham chiếu cho [BACKEND.md](BACKEND.md) và [API.md](API.md).

## 1. Tổng quan

- **DBMS:** PostgreSQL 15+
- **ORM:** Prisma
- **Cache / queue:** Redis (session, leaderboard, rate-limit)
- **Storage:** S3-compatible (ảnh check-in, avatar) — không lưu blob trong DB

## 2. Sơ đồ thực thể (ERD)

```text
User ─┬─< Membership >─ Group ─┬─< Goal
      │              │         ├─< Session
      │              │         └─< RewardPool
      ├─< Goal                │
      ├─< Session             └─< GroupInvite
      ├─< CheckIn
      ├─< Commitment ──────> RewardPool
      ├─< Notification
      ├─< Achievement >──── Achievement (catalog)
      └─< Streak
```

Quy ước:

- Khóa chính: `id String @id @default(cuid())`
- Thời gian: lưu `UTC` dưới dạng `timestamptz` (Prisma `DateTime`)
- Xóa mềm: các bảng chính có `deletedAt DateTime?`

## 3. Schema chi tiết (Prisma)

### 3.1 User

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String?
  name         String
  avatarUrl    String?
  role         UserRole  @default(MEMBER)
  level        Int       @default(1)
  xp           Int       @default(0)
  timezone     String    @default("Asia/Ho_Chi_Minh")
  isVerified   Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  memberships   Membership[]
  goals         Goal[]
  sessions      Session[]
  checkIns      CheckIn[]
  commitments   Commitment[]
  notifications Notification[]
  achievements  UserAchievement[]
  streak        Streak?

  @@index([email])
  @@index([xp(sort: Desc)])
}
```

Enum:

```prisma
enum UserRole {
  MEMBER
  MODERATOR
  ADMIN
}
```

### 3.2 Group & Membership

```prisma
model Group {
  id          String     @id @default(cuid())
  name        String
  description String?
  topic       String?
  isPrivate   Boolean    @default(false)
  inviteCode  String     @unique @default(cuid())
  ownerId     String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  owner      User          @relation(fields: [ownerId], references: [id])
  members    Membership[]
  goals      Goal[]
  sessions   Session[]
  rewardPool RewardPool?
  invites    GroupInvite[]

  @@index([ownerId])
  @@index([inviteCode])
}

model Membership {
  id        String        @id @default(cuid())
  userId    String
  groupId   String
  role      GroupRole     @default(MEMBER)
  status    MemberStatus  @default(ACTIVE)
  joinedAt  DateTime      @default(now())

  user  User  @relation(fields: [userId], references: [id])
  group Group @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
  @@index([groupId, status])
}

enum GroupRole {
  OWNER
  ADMIN
  MEMBER
}

enum MemberStatus {
  ACTIVE
  BANNED
  LEFT
}
```

### 3.3 Goal

```prisma
model Goal {
  id          String     @id @default(cuid())
  userId      String
  groupId     String?
  title       String
  description String?
  targetType  TargetType @default(MINUTES_PER_WEEK)
  targetValue Int        @default(300) // phút/tuần hoặc số buổi
  deadline    DateTime?
  status      GoalStatus @default(IN_PROGRESS)
  progress    Float      @default(0)   // 0..100
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user        User         @relation(fields: [userId], references: [id])
  group       Group?       @relation(fields: [groupId], references: [id])
  sessions    Session[]
  commitments Commitment[]

  @@index([userId, status])
  @@index([groupId, status])
  @@index([deadline])
}

enum TargetType {
  MINUTES_PER_WEEK
  SESSIONS_PER_WEEK
  TOTAL_MINUTES
  CUSTOM
}

enum GoalStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
  PAUSED
}
```

### 3.4 Session

```prisma
model Session {
  id              String    @id @default(cuid())
  userId          String
  groupId         String?
  goalId          String?
  roomId          String?
  startedAt       DateTime
  endedAt         DateTime?
  durationMinutes Int       @default(0)
  focusScore      Float?    // tỉ lệ thời gian giữ focus
  verified        Boolean   @default(false)
  createdAt       DateTime  @default(now())

  user    User   @relation(fields: [userId], references: [id])
  group   Group? @relation(fields: [groupId], references: [id])
  goal    Goal?  @relation(fields: [goalId], references: [id])
  checkIn CheckIn?

  @@index([userId, startedAt(sort: Desc)])
  @@index([groupId, startedAt(sort: Desc)])
}
```

### 3.5 CheckIn

```prisma
model CheckIn {
  id          String          @id @default(cuid())
  userId      String
  sessionId   String          @unique
  note        String?
  evidenceUrl String?         // link S3 (ảnh / file)
  status      CheckInStatus   @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime        @default(now())

  user    User    @relation(fields: [userId], references: [id])
  session Session @relation(fields: [sessionId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([status])
}

enum CheckInStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### 3.6 Commitment

```prisma
model Commitment {
  id           String           @id @default(cuid())
  userId       String
  groupId      String?
  goalId       String?
  rewardPoolId String?
  amount       Int              @default(0) // đơn vị: điểm hoặc coin
  rule         String           // mô tả rule: "học >= 5 buổi/tuần"
  ruleType     CommitmentRule
  penalty      String?
  status       CommitmentStatus @default(ACTIVE)
  startDate    DateTime
  endDate      DateTime
  createdAt    DateTime         @default(now())

  user       User        @relation(fields: [userId], references: [id])
  group      Group?      @relation(fields: [groupId], references: [id])
  goal       Goal?       @relation(fields: [goalId], references: [id])
  rewardPool RewardPool? @relation(fields: [rewardPoolId], references: [id])

  @@index([userId, status])
  @@index([endDate])
}

enum CommitmentRule {
  MIN_SESSIONS_PER_WEEK
  MIN_MINUTES_PER_WEEK
  DAILY_CHECKIN
  DEADLINE_GOAL
}

enum CommitmentStatus {
  ACTIVE
  COMPLETED
  VIOLATED
  CANCELLED
}
```

### 3.7 RewardPool

```prisma
model RewardPool {
  id        String   @id @default(cuid())
  groupId   String?  @unique
  name      String
  totalAmount Int    @default(0)
  status    PoolStatus @default(OPEN)
  closesAt  DateTime?
  createdAt DateTime @default(now())

  group       Group        @relation(fields: [groupId], references: [id])
  commitments Commitment[]
  payouts     Payout[]

  @@index([status])
}

enum PoolStatus {
  OPEN
  DISTRIBUTING
  CLOSED
}

model Payout {
  id           String   @id @default(cuid())
  rewardPoolId String
  userId       String
  amount       Int
  reason       String
  createdAt    DateTime @default(now())

  rewardPool RewardPool @relation(fields: [rewardPoolId], references: [id])

  @@index([rewardPoolId])
}
```

### 3.8 Streak

```prisma
model Streak {
  id           String   @id @default(cuid())
  userId       String   @unique
  currentDays  Int      @default(0)
  longestDays  Int      @default(0)
  lastCheckIn  DateTime?
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}
```

### 3.9 Achievement & UserAchievement

```prisma
model Achievement {
  id       String @id @default(cuid())
  code     String @unique // e.g. STREAK_7
  name     String
  iconUrl  String
  xpReward Int    @default(0)

  users UserAchievement[]
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String
  unlockedAt    DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id])
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
}
```

### 3.10 Notification

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  data      Json?            // payload thêm: goalId, groupId...
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, isRead, createdAt(sort: Desc)])
}

enum NotificationType {
  REMINDER
  CHECKIN_APPROVED
  CHECKIN_REJECTED
  GOAL_DEADLINE
  COMMITMENT_VIOLATED
  REWARD_RECEIVED
  LEADERBOARD
  SYSTEM
}
```

### 3.11 GroupInvite

```prisma
model GroupInvite {
  id        String    @id @default(cuid())
  groupId   String
  email     String
  token     String    @unique
  status    InviteStatus @default(PENDING)
  expiresAt DateTime
  createdAt DateTime  @default(now())

  group Group @relation(fields: [groupId], references: [id])

  @@index([email])
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
}
```

## 4. Chiến lược Redis

| Key pattern | Kiểu | Mục đích | TTL |
|---|---|---|---|
| `session:{userId}` | string (JWT jti) | Logout / revoke token | 7 ngày |
| `leaderboard:week:{weekKey}` | ZSET | XP leaderboard tuần | 8 ngày |
| `leaderboard:group:{groupId}` | ZSET | XP trong nhóm | vĩnh viễn (cron reset) |
| `room:{roomId}:presence` | SET | User online trong room | — |
| `ratelimit:{ip}:{route}` | counter | Rate limit API | 1 phút |

Leaderboard tính từ `Session.durationMinutes` + XP event, tổng hợp bằng cron job mỗi 5 phút và ghi vào ZSET.

## 5. Quy tắc nghiệp vụ liên quan dữ liệu

1. **XP:** +10 XP / check-in được duyệt, +1 XP / 5 phút focus, +50 XP / hoàn thành goal. Cập nhật `User.xp` và leveling: `level = floor(sqrt(xp / 100)) + 1`.
2. **Streak:** tăng 1 khi có check-in được duyệt trong ngày (theo `User.timezone`); reset về 0 nếu bỏ lỡ 1 ngày.
3. **Commitment evaluation:** cron chạy lúc 00:05 mỗi ngày, quét `Commitment` có `endDate < now` hoặc theo chu kỳ tuần → chuyển `COMPLETED` / `VIOLATED`, ghi `Payout` nếu đạt.
4. **Progress goal:** `progress` được tính lại từ tổng `Session.durationMinutes` trong tuần, không cập nhật trực tiếp từ client.

## 6. Migration & seeding

```bash
npx prisma migrate dev --name init      # tạo migration trong dev
npx prisma migrate deploy               # áp dụng trong production
npx prisma db seed                      # seed dữ liệu mẫu
```

Seed tối thiểu:

- 5 user mẫu (1 admin, 1 moderator, 3 member)
- 2 group công khai, 1 group riêng
- Catalog `Achievement` (STREAK_3, STREAK_7, STREAK_30, FIRST_GOAL, NIGHT_OWL...)
- 1 reward pool mẫu với 3 commitment

## 7. Backup & bảo mật

- Backup tự động hằng ngày (managed PostgreSQL: Supabase/Railway), retention 7 ngày
- Không lưu mật khẩu dạng plain — chỉ `passwordHash` (argon2)
- Ảnh check-in đặt trong S3 bucket private, truy cập qua presigned URL có TTL 15 phút
- Các bảng chứa dữ liệu nhạy cảm (`User`, `CheckIn`) áp dụng xóa mềm + chính sách GDPR (xóa vĩnh viễn sau 30 ngày kể từ `deletedAt`)
