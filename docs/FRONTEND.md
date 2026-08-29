# Tài liệu triển khai Frontend — Cat Learning Hub

> Mô tả kiến trúc frontend, cấu trúc thư mục, quy ước component, quản lý state và tích hợp realtime. Tham chiếu chéo: [API.md](API.md), [BACKEND.md](BACKEND.md), [DEPLOYMENT.md](DEPLOYMENT.md).

## 1. Công nghệ

| Thành phần | Lựa chọn |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS Variables (theme tokens) |
| State client | Zustand |
| State server | TanStack React Query v5 |
| Form | React Hook Form + Zod |
| Realtime | Socket.IO client |
| Icons / UI | lucide-react, component tự viết (không dùng UI kit nặng) |
| Chart | Recharts (thống kê dashboard) |

## 2. Cấu trúc thư mục

```text
apps/web/
├── src/
│   ├── app/                        # App Router
│   │   ├── (marketing)/            # landing, pricing — public
│   │   ├── (auth)/login /register
│   │   ├── (app)/                  # vùng đã đăng nhập, layout có navbar
│   │   │   ├── dashboard/
│   │   │   ├── goals/
│   │   │   ├── groups/[groupId]/
│   │   │   ├── rooms/[roomId]/
│   │   │   ├── leaderboard/
│   │   │   ├── rewards/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── providers.tsx           # QueryClient, socket, theme
│   ├── components/
│   │   ├── ui/                     # Button, Input, Modal, Card, Badge...
│   │   ├── layout/                 # Navbar, Sidebar, AppShell
│   │   ├── dashboard/              # StatCard, WeeklyPlan, StreakFlame
│   │   ├── goals/
│   │   ├── groups/
│   │   ├── rooms/                  # FocusTimer, RoomChat, MemberList
│   │   └── shared/                 # EmptyState, ErrorBoundary, Pagination
│   ├── features/                   # logic theo domain (hooks + api + store)
│   │   ├── auth/
│   │   ├── goals/
│   │   ├── sessions/
│   │   ├── checkins/
│   │   ├── groups/
│   │   └── leaderboard/
│   ├── lib/
│   │   ├── api.ts                  # axios instance + refresh token interceptor
│   │   ├── socket.ts               # singleton socket client
│   │   ├── query-keys.ts
│   │   └── utils/                  # date, format, xp
│   ├── hooks/                      # useTimer, usePresence, useNotification
│   ├── stores/                     # zustand stores
│   └── types/                      # types khớp response API
├── public/
├── tailwind.config.ts
├── next.config.mjs
└── .env.example
```

Nguyên tắc: `app/` chỉ là lớp routing mỏng; UI và logic nằm trong `components/` + `features/`.

## 3. Routing & trang chính

| Route | Công dụng | Auth |
|---|---|---|
| `/` | Landing: hero, tính năng, CTA | Public |
| `/login`, `/register` | Auth | Public |
| `/dashboard` | Thống kê hôm nay, kế hoạch tuần, nhắc check-in | Required |
| `/goals` | CRUD mục tiêu, tiến độ | Required |
| `/groups`, `/groups/[id]` | Danh sách / chi tiết nhóm, thành viên, tiến độ nhóm | Required |
| `/rooms/[id]` | Study room: timer, chat, presence | Required |
| `/leaderboard` | Xếp hạng tuần/tháng, theo nhóm | Required |
| `/rewards` | Reward pool, lịch sử payout | Required |
| `/settings` | Profile, avatar, timezone, notification | Required |

Middleware (`middleware.ts`) redirect user chưa đăng nhập từ `(app)` sang `/login?next=...`.

## 4. Quản lý state

### 4.1 Server state — React Query

- Mọi dữ liệu từ API đều qua React Query, **không** fetch trong `useEffect`.
- Query keys chuẩn hóa tại `query-keys.ts`:

```ts
export const qk = {
  me: ['me'],
  goals: (filter?: GoalFilter) => ['goals', filter],
  group: (id: string) => ['groups', id],
  leaderboard: (scope: 'week' | 'month') => ['leaderboard', scope],
}
```

- Mutation thành công → `queryClient.invalidateQueries` theo key liên quan.
- `staleTime` mặc định 30s; realtime event chủ động `invalidate` (xem §6).

### 4.2 Client state — Zustand

Chỉ dùng cho state cục bộ UI: `useAuthStore` (user hiện tại), `useTimerStore` (focus timer), `useUiStore` (sidebar, theme).

## 5. Tích hợp API

`lib/api.ts` — axios instance:

- Base URL từ `NEXT_PUBLIC_API_URL`.
- Request interceptor gắn `Authorization: Bearer <accessToken>`.
- Response interceptor 401 → gọi `/auth/refresh` (một lần, có lock tránh race), retry request; thất bại → logout.
- Types response khớp 1:1 với [API.md](API.md).

## 6. Realtime (Socket.IO)

`lib/socket.ts` khởi tạo singleton sau khi login:

```ts
useEffect(() => {
  const socket = getSocket()
  socket.on('goal:updated', () => qc.invalidateQueries({ queryKey: qk.goals() }))
  socket.on('leaderboard:update', () => qc.invalidateQueries({ queryKey: qk.leaderboard('week') }))
  socket.on('chat:message', appendChat)
  return () => socket.off()
}, [])
```

Trong `/rooms/[id]`:

- `room:join` khi vào trang, `room:leave` khi unmount.
- FocusTimer đồng bộ qua `timer:sync` — ai đang chạy, còn lại bao lâu.
- Presence hiển thị chấm xanh theo `presence:list` + sự kiện join/leave.

## 7. Component quy ước

- Component file đặt tên `PascalCase.tsx`; một component chính mỗi file.
- Props định nghĩa bằng `type`, không `interface` dài dòng; không export default cho component nội bộ.
- Dùng semantic token Tailwind: `bg-surface`, `text-muted`, `border-subtle` — định nghĩa trong `tailwind.config.ts`, hỗ trợ dark mode qua `class="dark"`.
- Mọi danh sách hiển thị skeleton khi `isLoading`, `EmptyState` khi rỗng, thông báo lỗi qua toast.
- Form: React Hook Form + Zod schema dùng chung cho cả validate client và type.

## 8. Trải nghiệm then chốt

### Dashboard

- `StatCard` (buổi học hôm nay, phút focus, streak, XP) — dữ liệu `/sessions/today` + `/users/me`.
- `WeeklyPlan`: barra tiến độ từng ngày; đỏ khi tụt sau schedule.
- Nhắc check-in nổi bật nếu đã học nhưng chưa check-in.

### Study room

- FocusTimer: chế độ Pomodoro (25/5) và tự do; chạy cục bộ, sync định kỳ 30s.
- RoomChat: autoscroll, tối đa 100 tin giữ trong bộ nhớ.
- MemberList: avatar + trạng thái (đang focus / online / offline).

### Leaderboard

- Tab tuần / tháng / theo nhóm; podium top 3; tự cập nhật khi nhận `leaderboard:update`.

## 9. Hiệu năng & SEO

- Landing dùng SSG; các trang `(app)` là client component — không cần SEO.
- `next/image` cho mọi ảnh; avatar lưu size 96px và 256px.
- Code splitting tự động theo route; chart chỉ load khi vào dashboard.
- Core Web Vitals mục tiêu: LCP < 2.5s, CLS < 0.1.

## 10. Kiểm thử & lint

```bash
npm run lint          # ESLint + Prettier
npm run typecheck     # tsc --noEmit
npm run build         # kiểm tra build production
npm run test          # Vitest cho utils/hooks
```

Quy tắc merge: lint + typecheck + build phải xanh trước khi vào `main`.
