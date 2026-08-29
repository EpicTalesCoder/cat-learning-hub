import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publishRoomUpdate } from '@/lib/redis'
import { getIO } from '@/lib/socket'

// PATCH /api/rooms/[id]/presence — update lastSeen (heartbeat)
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Update current user's lastSeen
  const memberRecord = await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: id, userId: session.user.id } },
    create: { roomId: id, userId: session.user.id },
    update: { lastSeen: new Date() },
    include: { user: { select: { id: true, name: true } } },
  })

  // Publish to Redis for real-time updates
  await publishRoomUpdate(id, {
    event: 'member-active',
    userId: session.user.id,
    userName: memberRecord.user.name,
    timestamp: new Date(),
  })

  // Broadcast via WebSocket
  getIO()?.to(`room:${id}`).emit('member-active', {
    userId: session.user.id,
    userName: memberRecord.user.name,
    timestamp: new Date(),
  })

  // Clean up members inactive for more than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await prisma.roomMember.deleteMany({
    where: {
      roomId: id,
      lastSeen: { lt: thirtyDaysAgo },
    },
  })

  // Return members active in last 2 minutes
  const since = new Date(Date.now() - 2 * 60 * 1000)
  const members = await prisma.roomMember.findMany({
    where: { roomId: id, lastSeen: { gte: since } },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ members })
}

