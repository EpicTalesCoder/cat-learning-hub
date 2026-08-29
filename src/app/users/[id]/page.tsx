import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Users } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDuration, generateAvatar } from '@/lib/utils'

export default async function UserProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          sessions: true,
        },
      },
    },
  })

  if (!user) notFound()

  const totalMinutes = await prisma.studySession.aggregate({
    where: { userId: user.id },
    _sum: { durationMinutes: true },
  })

  const totalStudyMinutes = totalMinutes._sum.durationMinutes ?? 0
  const isCurrentUser = session.user.id === user.id

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-gray-300 transition-colors hover:border-brand/40 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
        {isCurrentUser && (
          <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-light">
            Đây là bạn
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-xl shadow-black/10">
        <div className="border-b border-surface-border bg-gradient-to-r from-brand/15 via-transparent to-transparent p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/20 text-2xl font-bold text-brand-light">
              {generateAvatar(user.name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="mt-1 text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-gray-400">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Buổi học</span>
            </div>
            <p className="text-2xl font-bold text-white">{user._count.sessions}</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-gray-400">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Thời gian</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatDuration(Math.floor(totalStudyMinutes / 60))}</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-gray-400">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Phòng</span>
            </div>
            <p className="text-2xl font-bold text-white">{user._count.memberships}</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-gray-400">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Tham gia</span>
            </div>
            <p className="text-lg font-bold text-white">
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
