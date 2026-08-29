# Cat Learning Hub

Nền tảng học tập cộng đồng tập trung vào tính kỷ luật, trách nhiệm và động lực học tập: study room, goal tracking, commitment/stake, reward pool và gamification.

## Mục lục tài liệu

### Tổng quan

- [Tổng quan dự án](docs/PROJECT_IMPLEMENTATION.md) — vấn đề, người dùng, tính năng MVP, kế hoạch phát triển, KPI

### Tài liệu kỹ thuật

- [Thiết kế Database](docs/DATABASE.md) — schema Prisma, ERD, Redis, migration & seeding
- [Triển khai Backend](docs/BACKEND.md) — kiến trúc NestJS, module nghiệp vụ, auth, jobs, testing
- [Triển khai Frontend](docs/FRONTEND.md) — cấu trúc Next.js, state management, realtime, UI quy ước
- [Tài liệu API](docs/API.md) — REST endpoints, response chuẩn, sự kiện WebSocket
- [Hướng dẫn Deployment](docs/DEPLOYMENT.md) — Docker, CI/CD, Vercel/Railway, giám sát, checklist launch

## Mối quan hệ tài liệu

```text
PROJECT_IMPLEMENTATION.md   ← định hướng sản phẩm (đọc trước)
        │
        ├── DATABASE.md     ← schema là nguồn sự thật của dữ liệu
        │        │
        ├── BACKEND.md      ← module nghiệp vụ dựa trên schema
        │        │
        ├── API.md          ← contract giữa backend và frontend
        │        │
        ├── FRONTEND.md     ← consuming API + realtime
        │
        └── DEPLOYMENT.md   ← đưa toàn bộ lên production
```
