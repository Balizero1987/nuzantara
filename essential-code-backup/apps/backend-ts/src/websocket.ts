/**
 * WebSocket Server for Real-Time Features
 *
 * Bridges Redis pub/sub to WebSocket clients
 * Enables real-time notifications without polling
 */

import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from './services/logger.js';
import { PubSubService, CHANNELS, UserNotification, AIResult } from './utils/pubsub.js';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.WEBAPP_URL || 'https://zantara.balizero.com',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  logger.info('WebSocket server initializing...');

  // Authentication middleware
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return next(new Error('Authentication required'));
    }
    socket.data.userId = userId;
    next();
  });

  // Connection handling
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`User ${userId} connected via WebSocket`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Real-time connection established',
      userId,
      timestamp: Date.now(),
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User ${userId} disconnected: ${reason}`);
    });

    // Handle ping (keep-alive)
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle room joining (for chat)
    socket.on('join-room', (roomId: string) => {
      socket.join(`room:${roomId}`);
      logger.info(`User ${userId} joined room ${roomId}`);
      socket.emit('room-joined', { roomId });
    });

    // Handle room leaving
    socket.on('leave-room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      logger.info(`User ${userId} left room ${roomId}`);
    });
  });

  // Bridge Redis pub/sub to WebSocket
  setupRedisBridge(io);

  logger.info('✅ WebSocket server ready');

  return io;
}

/**
 * Bridge Redis pub/sub events to WebSocket clients
 */
function setupRedisBridge(io: Server) {
  // User notifications
  PubSubService.psubscribe<UserNotification>(
    `${CHANNELS.USER_NOTIFICATIONS}:*`,
    (_channel, notification) => {
      const userId = notification.userId;
      io.to(`user:${userId}`).emit('notification', notification);
      logger.debug(`Notification sent to user ${userId}`);
    }
  );

  // AI results
  PubSubService.psubscribe<AIResult>(`${CHANNELS.AI_RESULTS}:*`, (_channel, result) => {
    const userId = result.userId;
    io.to(`user:${userId}`).emit('ai-result', result);
    logger.debug(`AI result sent to user ${userId}`);
  });

  // Chat messages
  PubSubService.psubscribe(`${CHANNELS.CHAT_MESSAGES}:*`, (channel, message: any) => {
    const roomId = channel.split(':')[2];
    io.to(`room:${roomId}`).emit('chat-message', message);
    logger.debug(`Chat message sent to room ${roomId}`);
  });

  // System events (broadcast to all)
  PubSubService.subscribe(CHANNELS.SYSTEM_EVENTS, (event: any) => {
    io.emit('system-event', event);
    logger.debug('System event broadcasted');
  });

  logger.info('✅ Redis → WebSocket bridge established');
}

/**
 * Graceful shutdown
 */
export async function closeWebSocket(io: Server): Promise<void> {
  return new Promise((resolve) => {
    io.close(() => {
      logger.info('WebSocket server closed');
      resolve();
    });
  });
}
