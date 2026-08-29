'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import io, { Socket } from 'socket.io-client'
import {
  ArrowLeft,
  Users,
  Play,
  Pause,
  RotateCcw,
  Globe,
  Lock,
  Cat,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn, formatTimer, generateAvatar } from '@/lib/utils'

interface Member {
  userId: string
  user: { id: string; name: string }
  lastSeen: string
}

interface Room {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  owner: { id: string; name: string }
  members: Member[]
}

type TimerMode = 'pomodoro' | 'free'
type TimerState = 'idle' | 'running' | 'paused' | 'break'

const POMODORO_WORK = 25 * 60
const POMODORO_BREAK = 5 * 60

interface RoomPageProps {
  params: { id: string }
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id } = params
  const { data: session } = useSession()
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Socket.IO
  const socketRef = useRef<Socket | null>(null)

  // Timer state
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [seconds, setSeconds] = useState(POMODORO_WORK)
  const [elapsed, setElapsed] = useState(0) // seconds elapsed (for "free" mode display)
  const [pomodoroCount, setPomodoroCount] = useState(0)

  // Session tracking
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartRef = useRef<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(undefined, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id)
    })

    // Listen for member joined
    socket.on('member-joined', (data: any) => {
      console.log('[Socket.IO] Member joined:', data)
      // Refresh members from server
      fetchRoomMembers()
    })

    // Listen for member left
    socket.on('member-left', (data: any) => {
      console.log('[Socket.IO] Member left:', data)
      fetchRoomMembers()
    })

    // Listen for member active (heartbeat)
    socket.on('member-active', (data: any) => {
      console.log('[Socket.IO] Member active:', data)
      fetchRoomMembers()
    })

    socket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected')
    })

    socket.on('error', (error) => {
      console.error('[Socket.IO] Error:', error)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [])

  // Fetch room members
  const fetchRoomMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${id}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.room.members)
      }
    } catch (err) {
      console.error('[Fetch] Error fetching members:', err)
    }
  }, [id])

  // Load room
  useEffect(() => {
    async function load() {
      try {
        // Join room first
        const joinRes = await fetch(`/api/rooms/${id}`, { method: 'POST' })
        if (!joinRes.ok) {
          setError('Phòng không tồn tại hoặc bạn không có quyền vào')
          setLoading(false)
          return
        }

        const res = await fetch(`/api/rooms/${id}`)
        if (!res.ok) {
          setError('Phòng không tồn tại hoặc bạn không có quyền vào')
          setLoading(false)
          return
        }
        const data = await res.json()
        setRoom(data.room)
        setMembers(data.room.members)

        // Emit join-room event to Socket.IO
        if (socketRef.current && session?.user?.id) {
          socketRef.current.emit('join-room', id, session.user.id)
        }

        // Start study session
        const sessRes = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: id }),
        })
        if (sessRes.ok) {
          const sessData = await sessRes.json()
          sessionIdRef.current = sessData.session.id
          sessionStartRef.current = new Date()
        }
      } catch (err) {
        console.error('[Load] Error:', err)
        setError('Lỗi kết nối')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, session])

  // Presence heartbeat (every 30s)
  useEffect(() => {
    async function ping() {
      try {
        const res = await fetch(`/api/rooms/${id}/presence`, { method: 'PATCH' })
        if (res.ok) {
          const data = await res.json()
          setMembers(data.members)
        }
      } catch (err) {
        console.error('[Heartbeat] Error:', err)
      }
    }
    ping()
    heartbeatRef.current = setInterval(ping, 30_000)
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [id])

  // End study session on leave
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !sessionStartRef.current) return
    try {
      const durationMinutes = Math.floor(
        (Date.now() - sessionStartRef.current.getTime()) / 60_000
      )
      await fetch(`/api/sessions/${sessionIdRef.current}/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes }),
      })
    } catch (err) {
      console.error('[EndSession] Error:', err)
    }
  }, [])

  useEffect(() => {
    return () => {
      endSession()
      // Emit leave-room event
      if (socketRef.current && session?.user?.id) {
        socketRef.current.emit('leave-room', id, session.user.id)
      }
    }
  }, [endSession, id, session])

  // Auto-start countdown when entering break
  useEffect(() => {
    if (timerState === 'break') {
      setSeconds(POMODORO_BREAK)
    }
  }, [timerState])

  // Timer interval
  useEffect(() => {
    if (timerState !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      if (mode === 'pomodoro') {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setPomodoroCount((c) => c + 1)
            setTimerState('break')
            return POMODORO_BREAK
          }
          return s - 1
        })
      } else {
        setElapsed((e) => e + 1)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timerState, mode])

  function startTimer() {
    if (mode === 'free') setElapsed(0)
    setTimerState('running')
  }

  function pauseTimer() {
    setTimerState('paused')
  }

  function resetTimer() {
    setTimerState('idle')
    setSeconds(mode === 'pomodoro' ? POMODORO_WORK : 0)
    setElapsed(0)
  }

  function switchMode(newMode: TimerMode) {
    setMode(newMode)
    setTimerState('idle')
    setSeconds(newMode === 'pomodoro' ? POMODORO_WORK : 0)
    setElapsed(0)
  }

  function handleLeave() {
    endSession()
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-65px)] items-center justify-center">
        <div className="text-center">
          <Cat className="mx-auto mb-4 h-12 w-12 animate-pulse text-brand" />
          <p className="text-gray-400">Đang vào phòng học...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex h-[calc(100vh-65px)] flex-col items-center justify-center gap-4">
        <p className="text-gray-400">{error || 'Không tìm thấy phòng'}</p>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          ← Quay lại
        </Button>
      </div>
    )
  }

  const displayTime =
    mode === 'pomodoro' ? formatTimer(seconds) : formatTimer(elapsed)

  const pomodoroProgress =
    mode === 'pomodoro'
      ? ((POMODORO_WORK - seconds) / POMODORO_WORK) * 100
      : 0

  const isBreak = timerState === 'break'

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col lg:flex-row">
      {/* Main timer area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        {/* Back button + room info */}
        <div className="flex w-full max-w-md items-center gap-3">
          <button
            onClick={handleLeave}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-semibold text-white">{room.name}</h1>
              {room.isPrivate ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
              ) : (
                <Globe className="h-3.5 w-3.5 shrink-0 text-green-400" />
              )}
            </div>
            {room.description && (
              <p className="truncate text-xs text-gray-500">{room.description}</p>
            )}
          </div>
        </div>

        {/* Mode switch */}
        <div className="flex rounded-xl bg-surface-card border border-surface-border p-1">
          {(['pomodoro', 'free'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                'rounded-lg px-5 py-2 text-sm font-medium transition-all',
                mode === m
                  ? 'bg-brand text-white shadow'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {m === 'pomodoro' ? '🍅 Pomodoro' : '⏱ Tự do'}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <svg className="absolute h-64 w-64 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#2a2a38"
              strokeWidth="3"
            />
            {mode === 'pomodoro' && (
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isBreak ? '#22c55e' : '#7c3aed'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - pomodoroProgress / 100)}`}
                className="transition-all duration-1000"
              />
            )}
          </svg>

          {/* Timer display */}
          <div className="flex h-56 w-56 flex-col items-center justify-center rounded-full border border-surface-border bg-surface-card">
            {isBreak && (
              <p className="mb-1 text-xs font-medium text-green-400 uppercase tracking-widest">
                Nghỉ giải lao
              </p>
            )}
            <div
              className={cn(
                'font-mono text-5xl font-bold tabular-nums',
                timerState === 'running'
                  ? isBreak
                    ? 'text-green-400'
                    : 'text-white'
                  : 'text-gray-400'
              )}
            >
              {displayTime}
            </div>
            {mode === 'pomodoro' && pomodoroCount > 0 && (
              <div className="mt-2 flex items-center gap-1">
                {[...Array(Math.min(pomodoroCount, 4))].map((_, i) => (
                  <span key={i} className="text-lg">🍅</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="rounded-xl border border-surface-border bg-surface-card p-3 text-gray-400 hover:text-white hover:border-brand/30 transition-all"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={timerState === 'running' ? pauseTimer : startTimer}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all',
              timerState === 'running'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                : 'bg-brand hover:bg-brand-dark shadow-brand/30'
            )}
          >
            {timerState === 'running' ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 translate-x-0.5" />
            )}
          </button>

          <div className="w-11" /> {/* spacer */}
        </div>

        {/* Status */}
        {timerState === 'running' && !isBreak && (
          <div className="flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm text-brand-light">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-light" />
            Đang học...
          </div>
        )}
        {timerState === 'idle' && (
          <p className="text-sm text-gray-500">Nhấn ▶ để bắt đầu focus</p>
        )}
      </div>

      {/* Sidebar — Members */}
      <div className="w-full border-t border-surface-border bg-surface-card lg:w-72 lg:border-t-0 lg:border-l">
        <div className="p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-300">
            <Users className="h-4 w-4" />
            Đang trong phòng
            <span className="ml-auto rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-light font-medium">
              {members.length}
            </span>
          </div>

          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">Chưa ai online</p>
            ) : (
              members.map((member) => {
                const isYou = member.userId === session?.user?.id
                return (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5"
                  >
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-light">
                        {generateAvatar(member.user.name)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-card bg-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {member.user.name}
                        {isYou && (
                          <span className="ml-1 text-xs text-gray-500">(bạn)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {room.owner.id === member.userId ? 'Chủ phòng' : 'Thành viên'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Room info */}
          <div className="mt-6 border-t border-surface-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-600">
              Thông tin phòng
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Chủ phòng</span>
                <span className="text-gray-300">{room.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Loại phòng</span>
                <span className={room.isPrivate ? 'text-yellow-400' : 'text-green-400'}>
                  {room.isPrivate ? 'Riêng tư' : 'Công khai'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
