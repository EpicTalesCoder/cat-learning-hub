# Tài liệu triển khai (Deployment) — Cat Learning Hub

> Hướng dẫn setup môi trường, Docker, CI/CD và vận hành production. Tham chiếu chéo: [BACKEND.md](BACKEND.md), [FRONTEND.md](FRONTEND.md), [DATABASE.md](DATABASE.md).

## 1. Kiến trúc triển khai

```text
                    ┌─────────────┐
   Users ──► Cloudflare CDN / WAF
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  Vercel (Next.js)      Railway / Render / ECS (NestJS API)
        │                       │
        │            ┌──────────┼──────────┐
        ▼            ▼          ▼          ▼
   S3 / R2      PostgreSQL    Redis     BullMQ workers
                (Supabase)  (Upstash)   (chạy cùng API)
```

Lựa chọn theo ngân sách:

| Môi trường | Frontend | Backend | DB | Redis |
|---|---|---|---|---|
| Dev / MVP | Vercel free | Railway ~$5 | Supabase free | Upstash free |
| Production | Vercel Pro | Railway / Render / ECS 2 instance | Managed PG + read replica | Managed Redis |

## 2. Environments

| Env | Frontend domain | API domain | DB |
|---|---|---|---|
| dev | localhost:3000 | localhost:4000 | docker compose |
| staging | staging-app.catlearninghub.vn | staging-api.catlearninghub.vn | supabase staging |
| production | app.catlearninghub.vn | api.catlearninghub.vn | managed PG |

Biến môi trường quản lý qua dashboard của từng platform (không commit `.env`). Danh sách biến: [BACKEND.md §8](BACKEND.md) và `.env.example` của từng app.

## 3. Docker (backend)

`apps/api/Dockerfile` (multi-stage):

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci && npx prisma generate

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app ./
COPY src ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

Docker compose cho dev (`docker-compose.yml` ở repo root):

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: cat
      POSTGRES_PASSWORD: cat
      POSTGRES_DB: catlearning
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

## 4. CI/CD (GitHub Actions)

Workflow `.github/workflows/ci.yml` chạy khi mở PR:

```text
jobs:
  web:  lint → typecheck → build  (apps/web)
  api:  lint → test → test:e2e (docker compose PG/Redis) → build (apps/api)
```

Workflow `deploy.yml` khi push vào `main`:

1. Chạy lại CI
2. `web`: deploy qua Vercel CLI / GitHub integration
3. `api`: build image → push registry → Railway/Render auto-deploy (hoặc ECS `aws ecs update-service`)
4. `prisma migrate deploy` chạy trong container khởi động
5. Rollback: revert commit → deploy lại bản trước (giữ migration tương thích ngược)

## 5. Triển khai từng phần

### 5.1 Frontend trên Vercel

1. Import repo, chọn `apps/web`, framework preset Next.js.
2. Cấu hình env: `NEXT_PUBLIC_API_URL=https://api.catlearninghub.vn/v1`, `NEXT_PUBLIC_SOCKET_URL=https://api.catlearninghub.vn`.
3. Preview deployments cho mỗi PR; production cho `main`.
4. Domain: thêm `app.catlearninghub.vn`, trỏ CNAME sang Vercel.

### 5.2 Backend trên Railway / Render

1. Tạo service từ Docker image hoặc GitHub repo (root `apps/api`).
3. Gắn env theo [BACKEND.md §8](BACKEND.md); health check path `/health`.
3. WebSocket: Railway/Render hỗ trợ sẵn; nếu dùng ALB/nginx phải bật upgrade header.
4. Scale: tối thiểu 2 instance production; Socket.IO dùng Redis adapter để multiprocess.

### 5.3 Database

- Supabase / Railway PG; giữ connection string trong secret manager.
- Migration chạy tự động khi container khởi động (xem Dockerfile).
- Enable PITR backup; cảnh báo disk > 80%.

### 5.4 Redis

- Upstash / Railway Redis; chú ý Upstash free có limit request — đủ cho MVP.
- Nếu API chạy nhiều instance: bật `@socket.io/redis-adapter`.

## 6. Domain, TLS & CDN

- DNS quản lý tại Cloudflare, bật proxy (cam vàng) cho cả frontend và API.
- TLS: Cloudflare edge certificate + Full (strict) về origin.
- Cache: chỉ cache static assets (`/_next/static/*`, ảnh CDN); **không** cache `/api/*` và WebSocket.

## 7. Giám sát & vận hành

| Hạng mục | Công cụ | Cảnh báo khi |
|---|---|---|
| Uptime | Better Stack / UptimeRobot (`/health` mỗi 1 phút) | 2 lần fail liên tiếp |
| Logs | Platform logs + Sentry | error rate tăng |
| Error tracking | Sentry (web + api) | lỗi mới phát hành |
| DB | Supabase dashboard | connection > 80%, disk > 80% |
| Job queue | BullMQ metrics (bull-board) | queue stuck / retry tăng |

`GET /health` trả `{ status: "ok", db: true, redis: true }` — check cả kết nối phụ thuộc.

## 8. Checklist trước launch

- [ ] `.env` production đầy đủ, không còn secret mặc định
- [ ] CORS whitelist đúng domain production
- [ ] Rate limit bật cho `/auth/*`
- [ ] Sentry DSN cấu hình cả web + api
- [ ] Backup DB tự động + test restore
- [ ] Seed catalog achievement + admin user
- [ ] SSL Labs grade A, Cloudflare WAF bật
- [ ] Runbook: cách rollback FE/BE, rotate JWT secret, xử lý DB failover

## 9. Khởi động dự án local

```bash
# 1. Clone và cài dependencies
npm install

# 2. Chạy PostgreSQL + Redis
docker compose up -d

# 3. Backend
cp apps/api/.env.example apps/api/.env
npx prisma migrate dev && npx prisma db seed
npm run dev            # apps/api → localhost:4000

# 4. Frontend
cp apps/web/.env.example apps/web/.env.local
npm run dev            # apps/web → localhost:3000
```
