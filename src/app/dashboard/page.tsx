'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Users, Lock, Globe, ArrowRight, Cat } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface Room {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  ownerId: string
  owner: { id: string; name: string }
  _count: { members: number }
  maxMembers: number
  createdAt: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  async function fetchRooms() {
    setLoading(true)
    try {
      const res = await fetch(`/api/rooms?search=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setRooms(data.rooms)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function joinRoom(roomId: string) {
    await fetch(`/api/rooms/${roomId}`, { method: 'POST' })
    router.push(`/rooms/${roomId}`)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Chào, {session?.user?.name?.split(' ').pop()} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-400">Chọn một phòng học hoặc tạo phòng mới</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Tạo phòng mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm phòng học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-surface-border bg-surface-card py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
        />
      </div>

      {/* Rooms grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-surface-card" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Cat className="mb-4 h-16 w-16 text-gray-700" />
          <h3 className="mb-2 text-lg font-semibold text-gray-400">
            {search ? 'Không tìm thấy phòng nào' : 'Chưa có phòng học nào'}
          </h3>
          <p className="mb-6 text-sm text-gray-600">
            {search ? 'Thử tìm với từ khóa khác' : 'Hãy tạo phòng học đầu tiên của bạn!'}
          </p>
          {!search && (
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo phòng ngay
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              currentUserId={session?.user?.id ?? ''}
              onJoin={joinRoom}
            />
          ))}
        </div>
      )}

      {/* Create room modal */}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchRooms()
          }}
        />
      )}
    </div>
  )
}

function RoomCard({
  room,
  currentUserId,
  onJoin,
}: {
  room: Room
  currentUserId: string
  onJoin: (id: string) => void
}) {
  const isOwner = room.ownerId === currentUserId
  const isFull = room._count.members >= room.maxMembers

  return (
    <Card hover className="flex flex-col" onClick={() => onJoin(room.id)}>
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
            <Cat className="h-5 w-5 text-brand-light" />
          </div>
          <div className="flex items-center gap-1.5">
            {room.isPrivate ? (
              <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">
                <Lock className="h-3 w-3" /> Riêng tư
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                <Globe className="h-3 w-3" /> Công khai
              </span>
            )}
            {isOwner && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-light">
                Của bạn
              </span>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-white line-clamp-1">{room.name}</h3>
        {room.description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">{room.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>
              {room._count.members}/{room.maxMembers}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onJoin(room.id)
            }}
            disabled={isFull}
            className={cn(
              'flex items-center gap-1 text-sm font-medium transition-colors',
              isFull
                ? 'cursor-not-allowed text-gray-600'
                : 'text-brand-light hover:text-white'
            )}
          >
            {isFull ? 'Phòng đầy' : 'Vào học'}
            {!isFull && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 20,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Tạo phòng thất bại')
        setLoading(false)
        return
      }

      // Go directly to the room
      router.push(`/rooms/${data.room.id}`)
    } catch {
      setError('Lỗi kết nối. Thử lại nhé!')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="animate-fade-in w-full max-w-md rounded-2xl border border-surface-border bg-surface-card shadow-2xl">
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-white">Tạo phòng học mới</h2>
          <p className="mt-1 text-sm text-gray-400">Vào phòng là bắt đầu học thôi!</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <Input
            label="Tên phòng"
            placeholder="Ví dụ: Luyện IELTS 7.0, Code React mỗi tối..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Mô tả (tuỳ chọn)</label>
            <textarea
              placeholder="Mô tả ngắn về phòng học..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={200}
              rows={2}
              className="w-full resize-none rounded-xl border border-surface-border bg-surface px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.isPrivate}
                  onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
                />
                <div
                  className={cn(
                    'h-6 w-11 rounded-full transition-colors',
                    form.isPrivate ? 'bg-brand' : 'bg-surface-border'
                  )}
                />
                <div
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    form.isPrivate ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {form.isPrivate ? 'Phòng riêng tư' : 'Phòng công khai'}
                </div>
                <div className="text-xs text-gray-500">
                  {form.isPrivate ? 'Chỉ ai có link mới vào được' : 'Mọi người đều thấy'}
                </div>
              </div>
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" isLoading={loading} className="flex-1">
              Tạo & vào phòng
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

