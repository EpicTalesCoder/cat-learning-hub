import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/rooms/[id] — room detail + members
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
        include: { user: { select: { id: true, name: true } } },
        orderBy: { lastSeen: 'desc' },
      },
    },
  })

  if (!room) {
    return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 })
  }

  // Check access for private rooms
  if (room.isPrivate) {
    const isMember = room.members.some((m) => m.userId === session.user.id)
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

  if (room._count.members >= room.maxMembers) {
    return NextResponse.json({ error: 'Phòng đã đầy' }, { status: 409 })
  }

  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: id, userId: session.user.id } },
    create: { roomId: id, userId: session.user.id },
    update: { lastSeen: new Date() },
  })

  return NextResponse.json({ ok: true })
}

