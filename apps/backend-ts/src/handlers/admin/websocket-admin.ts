/**
 * WebSocket Admin Handlers
 * Monitor and manage WebSocket connections
 */

import { ok, err } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { getWebSocketServer } from '../../services/websocket-server.js';

/**
 * Get WebSocket server stats
 */
export async function websocketStats(_params: any) {
  const wsServer = getWebSocketServer();

  if (!wsServer) {
    return ok({
      enabled: false,
      message: 'WebSocket server not initialized'
    });
  }

  const stats = wsServer.getStats();

  return ok({
    enabled: true,
    ...stats,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast message to a channel (admin only)
 */
export async function websocketBroadcast(params: any) {
  const { channel, data, excludeClientId } = params;

  if (!channel || !data) {
    throw new BadRequestError('channel and data are required');
  }

  const wsServer = getWebSocketServer();

  if (!wsServer) {
    return err('WebSocket server not initialized');
  }

  wsServer.broadcast(channel, data, excludeClientId);

  return ok({
    broadcast: true,
    channel,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send message to specific user
 */
export async function websocketSendToUser(params: any) {
  const { userId, channel, data } = params;

  if (!userId || !channel || !data) {
    throw new BadRequestError('userId, channel, and data are required');
  }

  const wsServer = getWebSocketServer();

  if (!wsServer) {
    return err('WebSocket server not initialized');
  }

  wsServer.sendToUser(userId, channel, data);

  return ok({
    sent: true,
    userId,
    channel,
    timestamp: new Date().toISOString()
  });
}
