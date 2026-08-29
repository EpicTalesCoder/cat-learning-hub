import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'

let io: Server | null = null

export function getSocketIO(httpServer?: HTTPServer): Server {
  if (io) return io

  if (!httpServer) {
    throw new Error('HTTP server required for Socket.IO initialization')
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  // Connection handler
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] User connected: ${socket.id}`)

    // Subscribe to room updates
    socket.on('join-room', (roomId: string, userId: string) => {
      socket.join(`room:${roomId}`)
      console.log(`[Socket.IO] ${userId} joined room ${roomId}`)

      // Broadcast to all clients in room except sender
      socket.broadcast.to(`room:${roomId}`).emit('member-joined', {
        roomId,
        userId,
        timestamp: new Date(),
      })
    })

    socket.on('leave-room', (roomId: string, userId: string) => {
      socket.leave(`room:${roomId}`)
      console.log(`[Socket.IO] ${userId} left room ${roomId}`)

      io?.to(`room:${roomId}`).emit('member-left', {
        roomId,
        userId,
        timestamp: new Date(),
      })
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.id}`)
    })
  })

  return io
}

export function broadcastToRoom(roomId: string, event: string, data: any) {
  if (!io) return
  io.to(`room:${roomId}`).emit(event, data)
}

export function getIO(): Server | null {
  return io
}
