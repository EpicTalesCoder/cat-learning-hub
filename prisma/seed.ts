import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample users
  const hash = await bcrypt.hash('password123', 12)

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { name: 'Alice Nguyễn', email: 'alice@example.com', passwordHash: hash },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { name: 'Bob Trần', email: 'bob@example.com', passwordHash: hash },
  })

  // Create sample rooms
  const room1 = await prisma.room.upsert({
    where: { inviteCode: 'ielts-7-public' },
    update: {},
    create: {
      name: 'Luyện IELTS 7.0 🎯',
      description: 'Cùng nhau ôn thi IELTS mỗi tối từ 20:00',
      isPrivate: false,
      inviteCode: 'ielts-7-public',
      ownerId: alice.id,
      members: { create: { userId: alice.id } },
    },
  })

  const room2 = await prisma.room.upsert({
    where: { inviteCode: 'react-learn-public' },
    update: {},
    create: {
      name: 'React & TypeScript 💻',
      description: 'Học React, Next.js và TypeScript từ cơ bản đến nâng cao',
      isPrivate: false,
      inviteCode: 'react-learn-public',
      ownerId: bob.id,
      members: { create: { userId: bob.id } },
    },
  })

  await prisma.room.upsert({
    where: { inviteCode: 'quiet-study-public' },
    update: {},
    create: {
      name: 'Phòng học yên tĩnh 🤫',
      description: 'Không nói chuyện, chỉ tập trung học',
      isPrivate: false,
      inviteCode: 'quiet-study-public',
      ownerId: alice.id,
      members: { create: { userId: alice.id } },
    },
  })

  console.log('✅ Seeded successfully!')
  console.log('  Users: alice@example.com, bob@example.com (password: password123)')
  console.log(`  Rooms: ${room1.name}, ${room2.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

