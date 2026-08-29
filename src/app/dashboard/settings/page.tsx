'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  User,
  Bell,
  Shield,
  Palette,
  BookOpen,
  Sparkles,
  Check,
  Camera,
} from 'lucide-react'

const quickActions = [
  {
    title: 'Thông tin cá nhân',
    description: 'Cập nhật tên, ảnh đại diện và thông tin cơ bản.',
    icon: User,
    accent: 'text-brand-light bg-brand/10',
  },
  {
    title: 'Thông báo',
    description: 'Quản lý email, nhắc nhở và cảnh báo học tập.',
    icon: Bell,
    accent: 'text-yellow-400 bg-yellow-500/10',
  },
  {
    title: 'Bảo mật',
    description: 'Đổi mật khẩu, thiết lập xác minh 2 bước.',
    icon: Shield,
    accent: 'text-green-400 bg-green-500/10',
  },
  {
    title: 'Giao diện',
    description: 'Tùy chỉnh màu sắc, chế độ tối và bố cục.',
    icon: Palette,
    accent: 'text-purple-400 bg-purple-500/10',
  },
]

const featureBlocks = [
  {
    title: 'Học tập cá nhân',
    description: 'Theo dõi tiến độ, mục tiêu và lịch học của bạn.',
    icon: BookOpen,
    status: 'Đang phát triển',
  },
  {
    title: 'Lời nhắc thông minh',
    description: 'Nhận nhắc nhở theo thời gian học và lịch hẹn.',
    icon: Sparkles,
    status: 'Sắp ra mắt',
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-brand-light">Cài đặt</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Thông tin người dùng</h1>
        </div>
        <Button variant="secondary">Lưu thay đổi</Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Hồ sơ cá nhân</h2>
                <p className="mt-1 text-sm text-gray-400">Quản lý thông tin cơ bản của bạn</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl border border-surface-border bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
                <Camera className="h-4 w-4" />
                Đổi ảnh
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Họ và tên</label>
                <input
                  defaultValue="Nguyễn Văn A"
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-white outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Email</label>
                <input
                  defaultValue="nguyenvana@example.com"
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-white outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-gray-400">Giới thiệu</label>
                <textarea
                  rows={4}
                  defaultValue="Mình đang học để cải thiện kỹ năng làm việc nhóm và quản lý thời gian."
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2.5 text-white outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Tổng quan</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-3">
              <span className="text-sm text-gray-400">Trạng thái</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-2.5 py-1 text-xs text-green-400">
                <Check className="h-3.5 w-3.5" /> Hoạt động
              </span>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface px-4 py-3">
              <p className="text-sm text-gray-400">Số phòng đã tham gia</p>
              <p className="mt-2 text-3xl font-bold text-white">12</p>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface px-4 py-3">
              <p className="text-sm text-gray-400">Danh hiệu</p>
              <p className="mt-2 text-lg font-semibold text-brand-light">Học viên tích cực</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(({ title, description, icon: Icon, accent }) => (
          <Card key={title} hover className="h-full">
            <CardContent className="pt-6">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {featureBlocks.map(({ title, description, icon: Icon, status }) => (
          <Card key={title} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand-light">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-gray-400">{description}</p>
                  </div>
                </div>
                <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs text-brand-light">
                  {status}
                </span>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
