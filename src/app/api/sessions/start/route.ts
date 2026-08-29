import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/sessions/start
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { roomId } = await req.json()

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      roomId,
      startedAt: new Date(),
    },
  })

  return NextResponse.json({ session: studySession }, { status: 201 })
}

