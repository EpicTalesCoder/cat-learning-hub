import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  name: z.string().min(2, 'Tên phòng tối thiểu 2 ký tự').max(80),
  description: z.string().max(200).optional(),
  isPrivate: z.boolean().optional().default(false),
  maxMembers: z.number().int().min(2).max(50).optional().default(20),
})

// GET /api/rooms — list public rooms + rooms user is a member of
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const rooms = await prisma.room.findMany({
    where: {
      AND: [
        {
          OR: [
            { isPrivate: false },
            { members: { some: { userId: session.user.id } } },
            { ownerId: session.user.id },
          ],
        },
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { description: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ]
          : []),
      ],
    },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ rooms })
}

// POST /api/rooms — create a new room
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { name, description, isPrivate, maxMembers } = parsed.data

    const room = await prisma.room.create({
      data: {
        name,
        description,
        isPrivate,
        maxMembers,
        ownerId: session.user.id,
        members: {
          create: { userId: session.user.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({ room }, { status: 201 })
  } catch (err) {
    console.error('[rooms POST]', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
