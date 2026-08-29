import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: id, userId: session.user.id } },
    create: { roomId: id, userId: session.user.id },
    update: { lastSeen: new Date() },
  })

  // Return members active in last 2 minutes
  const since = new Date(Date.now() - 2 * 60 * 1000)
  const members = await prisma.roomMember.findMany({
    where: { roomId: id, lastSeen: { gte: since } },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json({ members })
}

