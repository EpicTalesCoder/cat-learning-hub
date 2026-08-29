import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/sessions/[id]/end
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { durationMinutes } = await req.json()

  const updated = await prisma.studySession.updateMany({
    where: { id, userId: session.user.id },
    data: {
      endedAt: new Date(),
      durationMinutes: Math.floor(durationMinutes),
    },
  })

  return NextResponse.json({ ok: updated.count > 0 })
}

