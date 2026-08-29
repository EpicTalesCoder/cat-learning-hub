# Cat Learning Hub

Nền tảng học tập cộng đồng — đăng nhập, tạo phòng, vào phòng là học.

## Stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** — dark purple theme
- **Prisma** + PostgreSQL (Neon / Supabase / Railway)
- **NextAuth.js** — email + password auth
- Deploy **Vercel** (frontend + API routes)

## Cài đặt local

### 1. Clone & cài dependencies

```bash
npm install
```

### 2. Chuẩn bị database

Tạo database PostgreSQL miễn phí tại [neon.tech](https://neon.tech) hoặc [supabase.com](https://supabase.com).

Copy file `.env.example` → `.env.local`:

```bash
cp .env.example .env.local
```

Điền vào `.env.local`:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="chạy: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Tạo bảng + seed data

```bash
# Push schema lên database
npx prisma db push

# (Tuỳ chọn) Seed dữ liệu mẫu
npm run db:seed
```

### 4. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## Deploy lên Vercel

### 1. Push code lên GitHub

```bash
git add .
git commit -m "initial setup"
git push
```

### 2. Import vào Vercel

1. Vào [vercel.com/new](https://vercel.com/new)
2. Import repo này
3. Thêm Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Connection string PostgreSQL của bạn |
| `NEXTAUTH_SECRET` | Random string (openssl rand -base64 32) |
| `NEXTAUTH_URL` | URL production của bạn (e.g. https://cat-learning.vercel.app) |

4. Click **Deploy** — done!

---

## Luồng sử dụng

1. **Đăng ký** tại `/register`
2. **Đăng nhập** tại `/login`
3. **Dashboard** `/dashboard` — xem danh sách phòng công khai
4. **Tạo phòng** — click "Tạo phòng mới", điền tên, click "Tạo & vào phòng"
5. **Vào phòng học** — nhấn ▶ bắt đầu timer (Pomodoro 25 phút hoặc tự do)
6. **Xem ai đang online** trong sidebar bên phải

## Cấu trúc dự án

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/page.tsx        # Đăng nhập
│   ├── register/page.tsx     # Đăng ký
│   ├── dashboard/page.tsx    # Danh sách phòng
│   ├── rooms/[id]/page.tsx   # Phòng học (timer + presence)
│   └── api/                  # API Routes
│       ├── auth/             # NextAuth + Register
│       ├── rooms/            # CRUD phòng + presence
│       └── sessions/         # Ghi lại buổi học
├── components/
│   ├── ui/                   # Button, Input, Card
│   └── layout/               # Navbar
└── lib/
    ├── prisma.ts             # Prisma client
    ├── auth.ts               # NextAuth config
    └── utils.ts              # Utility functions
```
