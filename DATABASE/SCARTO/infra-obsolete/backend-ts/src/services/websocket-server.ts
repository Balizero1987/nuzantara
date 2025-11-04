/**
 * ZANTARA WebSocket Server
 * Real-time bidirectional communication for:
 * - Live chat with ZANTARA AI
 * - Team collaboration notifications
 * - Document processing status updates
 * - Analytics dashboard live updates
 */

import logger from './logger.js';
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface WebSocketClient extends WebSocket {
  clientId: string;
  userId?: string;
  userRole?: string;
  subscriptions: Set<string>; // channels: 'chat', 'notifications', 'analytics', 'documents'
  lastPing: number;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'message' | 'ping' | 'pong';
  channel?: string;
  data?: any;
  clientId?: string;
  timestamp?: string;
}

export class ZantaraWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private channels: Map<string, Set<string>> = new Map(); // channel -> clientIds
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server, path: string = '/ws') {
    this.wss = new WebSocketServer({
      server,
      path,
      clientTracking: true
    });

    this.initialize();
  }

  private initialize() {
    logger.info('🔌 WebSocket Server initializing on /ws');

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws as WebSocketClient, req);
    });

    // Start heartbeat (ping every 30s)
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, 30000);

    logger.info('✅ WebSocket Server ready');
  }

  private handleConnection(client: WebSocketClient, req: IncomingMessage) {
    const clientId = this.generateClientId();
    client.clientId = clientId;
    client.subscriptions = new Set();
    client.lastPing = Date.now();

    this.clients.set(clientId, client);

    logger.info(`🔗 Client connected: ${clientId} (${this.clients.size} active)`);

    // Extract user info from query params (if authenticated)
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const userIdParam = url.searchParams.get('userId');
    const roleParam = url.searchParams.get('role');
    
    if (userIdParam) client.userId = userIdParam;
    if (roleParam) client.userRole = roleParam;

    // Send welcome message
    this.sendToClient(client, {
      type: 'message',
      channel: 'system',
      data: {
        message: 'Connected to ZANTARA WebSocket',
        clientId,
        timestamp: new Date().toISOString()
      }
    });

    // Handle messages
    client.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    // Handle disconnect
    client.on('close', () => {
      this.handleDisconnect(client);
    });

    // Handle errors
    client.on('error', (error) => {
      logger.error(`❌ WebSocket error (${clientId}):`, error);
    });
  }

  private handleMessage(client: WebSocketClient, data: Buffer) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          if (message.channel) {
            this.subscribe(client, message.channel);
          }
          break;

        case 'unsubscribe':
          if (message.channel) {
            this.unsubscribe(client, message.channel);
          }
          break;

        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(client, { type: 'pong', timestamp: new Date().toISOString() });
          break;

        case 'message':
          // Forward message to channel subscribers
          if (message.channel) {
            this.broadcast(message.channel, message.data, client.clientId);
          }
          break;

        default:
          logger.warn(`⚠️ Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('❌ Error handling WebSocket message:', error);
      this.sendToClient(client, {
        type: 'message',
        channel: 'error',
        data: { error: 'Invalid message format' }
      });
    }
  }

  private handleDisconnect(client: WebSocketClient) {
    logger.info(`🔌 Client disconnected: ${client.clientId}`);

    // Remove from all channels
    for (const channel of client.subscriptions) {
      this.unsubscribe(client, channel);
    }

    // Remove from clients map
    this.clients.delete(client.clientId);
  }

  private subscribe(client: WebSocketClient, channel: string) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }

    this.channels.get(channel)!.add(client.clientId);
    client.subscriptions.add(channel);

    logger.info(`✅ Client ${client.clientId} subscribed to ${channel}`);

    this.sendToClient(client, {
      type: 'message',
      channel: 'system',
      data: { message: `Subscribed to ${channel}` }
    });
  }

  private unsubscribe(client: WebSocketClient, channel: string) {
    if (this.channels.has(channel)) {
      this.channels.get(channel)!.delete(client.clientId);
    }

    client.subscriptions.delete(channel);

    logger.info(`✅ Client ${client.clientId} unsubscribed from ${channel}`);
  }

  /**
   * Broadcast message to all clients subscribed to a channel
   */
  public broadcast(channel: string, data: any, excludeClientId?: string) {
    if (!this.channels.has(channel)) {
      return;
    }

    const subscribers = this.channels.get(channel)!;
    const message: WebSocketMessage = {
      type: 'message',
      channel,
      data,
      timestamp: new Date().toISOString()
    };

    let sent = 0;
    for (const clientId of subscribers) {
      if (clientId === excludeClientId) continue;

      const client = this.clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
        sent++;
      }
    }

    logger.info(`📡 Broadcast to ${channel}: ${sent}/${subscribers.size} clients`);
  }

  /**
   * Send message to specific client
   */
  public sendToUser(userId: string, channel: string, data: any) {
    let sent = 0;

    for (const [_clientId, client] of this.clients.entries()) {
      if (client.userId === userId && client.subscriptions.has(channel)) {
        this.sendToClient(client, {
          type: 'message',
          channel,
          data,
          timestamp: new Date().toISOString()
        });
        sent++;
      }
    }

    if (sent === 0) {
      logger.warn(`⚠️ User ${userId} not found or not subscribed to ${channel}`);
    }
  }

  private sendToClient(client: WebSocketClient, message: WebSocketMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Heartbeat: ping all clients, remove dead ones
   */
  private heartbeat() {
    const now = Date.now();
    const timeout = 60000; // 60s timeout

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastPing > timeout) {
        logger.info(`⏱️ Client ${clientId} timed out (no ping for ${timeout}ms)`);
        client.terminate();
        this.clients.delete(clientId);
      } else if (client.readyState === WebSocket.OPEN) {
        // Send ping
        client.ping();
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stats
   */
  public getStats() {
    return {
      activeClients: this.clients.size,
      channels: Array.from(this.channels.keys()).map(channel => ({
        name: channel,
        subscribers: this.channels.get(channel)!.size
      })),
      clients: Array.from(this.clients.values()).map(c => ({
        clientId: c.clientId,
        userId: c.userId,
        subscriptions: Array.from(c.subscriptions),
        lastPing: c.lastPing
      }))
    };
  }

  /**
   * Shutdown
   */
  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const client of this.clients.values()) {
      client.close();
    }

    this.wss.close();
    logger.info('🔌 WebSocket Server shut down');
  }
}

// Export singleton instance (will be initialized by index.ts)
let wsServer: ZantaraWebSocketServer | null = null;

export function initializeWebSocketServer(server: Server): ZantaraWebSocketServer {
  if (!wsServer) {
    wsServer = new ZantaraWebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): ZantaraWebSocketServer | null {
  return wsServer;
}
