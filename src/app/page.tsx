import Link from 'next/link'
import { BookOpen, Users, Timer, Trophy, ArrowRight, Cat } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const features = [
  {
    icon: BookOpen,
    title: 'Tạo phòng học',
    desc: 'Mở phòng học của riêng bạn, đặt tên và mô tả chủ đề học tập.',
  },
  {
    icon: Users,
    title: 'Học cùng nhau',
    desc: 'Mời bạn bè hoặc tham gia phòng công khai. Cùng nhau tập trung hơn.',
  },
  {
    icon: Timer,
    title: 'Focus timer',
    desc: 'Đồng hồ Pomodoro và tự do ngay trong phòng. Theo dõi thời gian học.',
  },
  {
    icon: Trophy,
    title: 'Xem tiến độ',
    desc: 'Biết ai đang online trong phòng, cùng nhau chịu trách nhiệm.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Cat className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">Cat Learning Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Bắt đầu miễn phí</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm text-brand-light">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-light animate-pulse-slow" />
            Cộng đồng học tập trực tuyến
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Học cùng nhau
            <br />
            <span className="bg-gradient-to-r from-brand to-purple-400 bg-clip-text text-transparent">
              hiệu quả hơn
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-gray-400">
            Tạo phòng học, vào phòng là bắt đầu học. Đơn giản vậy thôi —
            không cần lịch phức tạp, không cần check-in camera.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Tạo phòng ngay
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating stats */}
        <div className="mt-20 grid grid-cols-3 gap-6 text-center">
          {[
            { value: '100%', label: 'Miễn phí' },
            { value: '∞', label: 'Phòng học' },
            { value: '🐱', label: 'Vui vẻ' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-brand-light">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold">Đơn giản. Hiệu quả.</h2>
          <p className="mb-16 text-center text-gray-400">
            Mọi thứ bạn cần để tạo thói quen học tập tốt hơn.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-surface-border bg-surface-card p-6 transition-all hover:border-brand/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                  <Icon className="h-5 w-5 text-brand-light" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-xl">
          <div className="mb-4 text-5xl">🐱</div>
          <h2 className="mb-4 text-3xl font-bold">Sẵn sàng học thôi?</h2>
          <p className="mb-8 text-gray-400">
            Đăng ký miễn phí, tạo phòng và bắt đầu học ngay hôm nay.
          </p>
          <Link href="/register">
            <Button size="lg">
              Tạo tài khoản miễn phí
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border px-6 py-8 text-center text-sm text-gray-600">
        <p>© 2026 Cat Learning Hub. Học tập mỗi ngày 🐱</p>
      </footer>
    </div>
  )
}

