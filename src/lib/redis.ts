import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (redisClient) return redisClient

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })

  redisClient.on('error', (err) => console.error('[Redis Error]', err))
  redisClient.on('connect', () => console.log('[Redis] Connected'))

  try {
    await redisClient.connect()
  } catch (err) {
    console.error('[Redis] Connection failed:', err)
    redisClient = null
    throw err
  }

  return redisClient
}

export async function publishRoomUpdate(roomId: string, data: any) {
  try {
    const client = await getRedisClient()
    await client.publish(`room:${roomId}`, JSON.stringify(data))
  } catch (err) {
    console.error(`[Redis] Failed to publish to room:${roomId}:`, err)
  }
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
