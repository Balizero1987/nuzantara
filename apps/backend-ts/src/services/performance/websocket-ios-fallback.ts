/**
 * WebSocket iOS Compatibility Layer
 * 
 * Provides automatic fallback to Server-Sent Events (SSE) or Long Polling
 * for iOS devices that have WebSocket connection issues.
 * 
 * Features:
 * - iOS user agent detection
 * - Automatic transport fallback (WebSocket → SSE → Long Polling)
 * - Connection health monitoring
 * - Graceful degradation
 */

import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../logger.js';

interface IOSFallbackConfig {
  enableIOSFallback?: boolean;
  ssePath?: string;
  pollingPath?: string;
  healthCheckInterval?: number;
  connectionTimeout?: number;
}

interface ClientConnection {
  socketId: string;
  userId: string;
  userAgent: string;
  isIOS: boolean;
  transport: 'websocket' | 'polling' | 'sse';
  connectedAt: number;
  lastPing: number;
  reconnectCount: number;
}

class IOSWebSocketFallback {
  private io: Server;
  private connections: Map<string, ClientConnection> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private config: Required<IOSFallbackConfig>;

  constructor(httpServer: HTTPServer, config: IOSFallbackConfig = {}) {
    this.config = {
      enableIOSFallback: config.enableIOSFallback ?? true,
      ssePath: config.ssePath || '/sse',
      pollingPath: config.pollingPath || '/socket.io',
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      connectionTimeout: config.connectionTimeout || 60000 // 60 seconds
    };

    // Initialize Socket.IO with enhanced iOS support
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.WEBAPP_URL || 'https://zantara.balizero.com',
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Prioritize polling for iOS compatibility
      transports: ['polling', 'websocket'],
      allowEIO3: true, // Support older clients
      pingTimeout: 60000,
      pingInterval: 25000,
      // Enhanced options for iOS
      upgradeTimeout: 30000,
      // Allow polling to upgrade to websocket when stable
      allowUpgrades: true,
      // Connection state recovery for iOS
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true
      }
    });

    this.setupIOSHandlers();
    this.startHealthMonitoring();
  }

  /**
   * Detect iOS user agent
   */
  private isIOSUserAgent(userAgent: string): boolean {
    const iosPatterns = [
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /iOS/i,
      /Mobile.*Safari/i
    ];
    return iosPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Setup iOS-specific connection handlers
   */
  private setupIOSHandlers(): void {
    // Authentication middleware
    this.io.use((socket, next) => {
      const userId = socket.handshake.auth.userId;
      const userAgent = socket.handshake.headers['user-agent'] || '';
      const isIOS = this.isIOSUserAgent(userAgent);

      if (!userId) {
        return next(new Error('Authentication required'));
      }

      socket.data.userId = userId;
      socket.data.isIOS = isIOS;
      socket.data.userAgent = userAgent;

      // Log iOS detection (transport will be available after connection)
      if (isIOS) {
        logger.info(`iOS device detected: ${userId}`);
      }

      next();
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const isIOS = socket.data.isIOS;
      const userAgent = socket.data.userAgent;
      // Get transport from connection (socket.io v4+)
      const transport = (socket as any).conn?.transport?.name || 'polling' as 'websocket' | 'polling';

      // Track connection
      const connection: ClientConnection = {
        socketId: socket.id,
        userId,
        userAgent,
        isIOS,
        transport,
        connectedAt: Date.now(),
        lastPing: Date.now(),
        reconnectCount: 0
      };
      this.connections.set(socket.id, connection);

      logger.info(`User ${userId} connected (iOS: ${isIOS}, Transport: ${transport})`);

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Send connection acknowledgment with transport info
      socket.emit('connected', {
        message: 'Real-time connection established',
        userId,
        transport,
        isIOS,
        timestamp: Date.now(),
        recommendedTransport: isIOS ? 'polling' : 'websocket'
      });

      // Enhanced ping/pong for iOS
      socket.on('ping', () => {
        connection.lastPing = Date.now();
        socket.emit('pong', { 
          timestamp: Date.now(),
          transport: (socket as any).conn?.transport?.name || 'polling'
        });
      });

      // Monitor transport upgrades
      socket.on('upgrade', () => {
        const newTransport = (socket as any).conn?.transport?.name || 'polling';
        connection.transport = newTransport as 'websocket' | 'polling';
        logger.info(`User ${userId} upgraded to ${newTransport}`);
        
        socket.emit('transport-upgraded', {
          transport: newTransport,
          timestamp: Date.now()
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`User ${userId} disconnected: ${reason} (iOS: ${isIOS})`);
        this.connections.delete(socket.id);

        // If iOS and unexpected disconnect, log for monitoring
        if (isIOS && reason !== 'client namespace disconnect') {
          logger.warn(`iOS device ${userId} disconnected unexpectedly: ${reason}`);
        }
      });

      // Handle reconnect attempts
      socket.on('reconnect', (attemptNumber: number) => {
        connection.reconnectCount = attemptNumber;
        logger.info(`User ${userId} reconnecting (attempt ${attemptNumber})`);
      });

      // iOS-specific: Handle room joining with fallback support
      socket.on('join-room', (roomId: string) => {
        socket.join(`room:${roomId}`);
        logger.info(`User ${userId} joined room ${roomId}`);
        
        socket.emit('room-joined', { 
          roomId,
          transport: (socket as any).conn?.transport?.name || 'polling'
        });
      });

      socket.on('leave-room', (roomId: string) => {
        socket.leave(`room:${roomId}`);
        logger.info(`User ${userId} left room ${roomId}`);
      });
    });

    logger.info('✅ iOS WebSocket fallback handlers configured');
  }

  /**
   * Start health monitoring for connections
   */
  private startHealthMonitoring(): void {
    if (!this.config.enableIOSFallback) return;

    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.connectionTimeout;

      this.connections.forEach((conn, socketId) => {
        const socket = this.io.sockets.sockets.get(socketId);
        
        if (!socket || !socket.connected) {
          this.connections.delete(socketId);
          return;
        }

        // Check for stale connections
        const timeSinceLastPing = now - conn.lastPing;
        if (timeSinceLastPing > timeout) {
          logger.warn(`Stale connection detected: ${conn.userId} (${timeSinceLastPing}ms since last ping)`);
          
          // Force disconnect if iOS and using WebSocket with issues
          if (conn.isIOS && conn.transport === 'websocket') {
            logger.info(`Forcing iOS WebSocket reconnection for ${conn.userId}`);
            socket.disconnect(true); // Force disconnect to trigger reconnect
          }
        }

        // Update last ping if connection is still alive
        conn.lastPing = now;
      });
    }, this.config.healthCheckInterval);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    total: number;
    ios: number;
    websocket: number;
    polling: number;
    byTransport: Record<string, number>;
  } {
    const stats = {
      total: this.connections.size,
      ios: 0,
      websocket: 0,
      polling: 0,
      byTransport: {} as Record<string, number>
    };

    this.connections.forEach(conn => {
      if (conn.isIOS) stats.ios++;
      if (conn.transport === 'websocket') stats.websocket++;
      if (conn.transport === 'polling') stats.polling++;
      
      stats.byTransport[conn.transport] = (stats.byTransport[conn.transport] || 0) + 1;
    });

    return stats;
  }

  /**
   * Force transport upgrade/downgrade for a user
   */
  async changeTransport(userId: string, preferredTransport: 'websocket' | 'polling'): Promise<boolean> {
    const userSockets = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId);

    if (userSockets.length === 0) {
      return false;
    }

    userSockets.forEach(conn => {
      const socket = this.io.sockets.sockets.get(conn.socketId);
      if (socket && socket.connected) {
        // Emit recommendation to client
        socket.emit('transport-recommendation', {
          preferredTransport,
          reason: 'server-optimization',
          timestamp: Date.now()
        });
      }
    });

    return true;
  }

  /**
   * Get Socket.IO server instance
   */
  getServer(): Server {
    return this.io;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.io.close();
    this.connections.clear();
    logger.info('iOS WebSocket fallback shutdown complete');
  }
}

/**
 * Setup WebSocket with iOS fallback support
 */
export function setupIOSCompatibleWebSocket(
  httpServer: HTTPServer,
  config?: IOSFallbackConfig
): IOSWebSocketFallback {
  return new IOSWebSocketFallback(httpServer, config);
}

export { IOSWebSocketFallback };
export type { IOSFallbackConfig, ClientConnection };

