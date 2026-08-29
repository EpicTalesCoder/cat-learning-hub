import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishRoomUpdate } from '@/lib/redis'
import { getIO } from '@/lib/socket'

// GET /api/rooms/[id] — room detail + active members (within 2 minutes)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        where: {
          lastSeen: {
            gte: new Date(Date.now() - 2 * 60 * 1000), // Only active in last 2 minutes
          },
        },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { lastSeen: 'desc' },
      },
    },
  })

  if (!room) {
    return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 })
  }

  // Check access for private rooms (check if user was ever a member)
  if (room.isPrivate) {
    const isMember = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: id, userId: session.user.id } },
    })
    if (!isMember) {
      return NextResponse.json({ error: 'Phòng riêng tư' }, { status: 403 })
    }
  }

  return NextResponse.json({ room })
}

// POST /api/rooms/[id] — join room
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const room = await prisma.room.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  })

  if (!room) {
    return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 })
  }

  // Count only active members (within 2 minutes)
  const since = new Date(Date.now() - 2 * 60 * 1000)
  const activeCount = await prisma.roomMember.count({
    where: { roomId: id, lastSeen: { gte: since } },
  })

  if (activeCount >= room.maxMembers) {
    return NextResponse.json({ error: 'Phòng đã đầy' }, { status: 409 })
  }

  const member = await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: id, userId: session.user.id } },
    create: { roomId: id, userId: session.user.id },
    update: { lastSeen: new Date() },
    include: { user: { select: { id: true, name: true } } },
  })

  // Publish member joined event to Redis
  await publishRoomUpdate(id, {
    event: 'member-joined',
    userId: session.user.id,
    userName: session.user.name,
    timestamp: new Date(),
  })

  // Broadcast via WebSocket
  getIO()?.to(`room:${id}`).emit('member-joined', {
    userId: session.user.id,
    userName: session.user.name,
    timestamp: new Date(),
  })

  return NextResponse.json({ ok: true, member })
}

