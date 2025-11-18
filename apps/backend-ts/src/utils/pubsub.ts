/**
 * Redis Pub/Sub Wrapper for NUZANTARA
 *
 * Enables real-time features:
 * - User notifications
 * - AI job queue
 * - Cache invalidation
 * - Live chat
 * - Analytics events
 */

import Redis from 'ioredis';
import { logger } from '../logging/unified-logger.js';

const redisUrl = process.env.REDIS_URL;

// Configure Redis with proper TLS support for Upstash
function getRedisConfig(url: string) {
  const config: any = {
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.warn(`Redis retry limit reached (${times} attempts) - disabling further retries`);
        return null; // Stop after 3 retries
      }
      return Math.min(times * 100, 2000);
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // ← CRITICAL: Don't connect immediately
    enableOfflineQueue: false,
    connectTimeout: 10000,
  };

  // Check if URL requires TLS (Upstash or rediss://)
  if (url.includes('upstash.io') || url.startsWith('rediss://')) {
    config.tls = {
      rejectUnauthorized: false, // Required for Upstash Redis
    };
  }

  return config;
}

// Safely create Redis connections with error handling
function createRedisClient(url: string, label: string): Redis | null {
  try {
    const client = new Redis(url, getRedisConfig(url));

    client.on('error', (err) => {
      logger.error(`Redis ${label} error:`, err);
      // Don't crash - just log
    });

    client.on('connect', () => {
      logger.info(`Redis ${label} connected`);
    });

    client.on('close', () => {
      logger.warn(`Redis ${label} connection closed`);
    });

    // Try to connect, but don't block startup
    client.connect().catch((err) => {
      logger.error(`Redis ${label} connection failed:`, err);
      logger.warn(`Continuing without Redis ${label} - pub/sub features limited`);
    });

    return client;
  } catch (error: any) {
    logger.error(`Failed to create Redis ${label} client:`, error);
    return null;
  }
}

// Only create Redis connections if REDIS_URL is configured
export const redis = redisUrl ? createRedisClient(redisUrl, 'publisher') : null;

// Subscriber connection (dedicated)
const subscriberRedis = redisUrl ? createRedisClient(redisUrl, 'subscriber') : null;

// Log if Redis is disabled
if (!redisUrl) {
  logger.warn('⚠️  REDIS_URL not configured - pub/sub features disabled');
}

/**
 * Channel names (centralized)
 */
export const CHANNELS = {
  // User notifications
  USER_NOTIFICATIONS: 'user:notifications',

  // AI processing
  AI_JOBS: 'ai:jobs',
  AI_RESULTS: 'ai:results',

  // Cache management
  CACHE_INVALIDATE: 'cache:invalidate',

  // Live chat
  CHAT_MESSAGES: 'chat:messages',

  // Analytics
  ANALYTICS_EVENTS: 'analytics:events',

  // System events
  SYSTEM_EVENTS: 'system:events',
} as const;

/**
 * Type-safe message interfaces
 */
export interface UserNotification {
  userId: number;
  type: 'ai_response_ready' | 'document_processed' | 'error' | 'info';
  title: string;
  message: string;
  data?: any;
}

export interface AIJob {
  id: string;
  type: 'haiku_query' | 'llama_inference' | 'embedding_generation';
  userId: number;
  payload: any;
  priority?: 'low' | 'normal' | 'high';
  timestamp: number;
}

export interface AIResult {
  jobId: string;
  userId: number;
  status: 'success' | 'error';
  result?: any;
  error?: string;
  processingTime: number;
}

export interface CacheInvalidation {
  pattern: string;
  reason?: string;
}

export interface ChatMessage {
  roomId: string;
  userId: number;
  username: string;
  message: string;
  timestamp: number;
}

export interface AnalyticsEvent {
  event: string;
  userId?: number;
  data: Record<string, any>;
  timestamp: number;
}

/**
 * PubSub Service
 */
export class PubSubService {
  /**
   * Publish a message to a channel
   */
  static async publish<T = any>(channel: string, data: T): Promise<number> {
    if (!redis) {
      logger.warn(`Pub/sub disabled - cannot publish to ${channel}`);
      return 0;
    }
    try {
      const payload = JSON.stringify(data);
      const receivers = await redis.publish(channel, payload);
      logger.debug(`Published to ${channel}: ${receivers} receivers`);
      return receivers;
    } catch (error) {
      logger.error(`Failed to publish to ${channel}:`, error as Error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel with typed handler
   */
  static subscribe<T = any>(channel: string, handler: (data: T) => void | Promise<void>): void {
    if (!subscriberRedis) {
      logger.warn(`Pub/sub disabled - cannot subscribe to ${channel}`);
      return;
    }
    subscriberRedis.subscribe(channel, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${channel}:`, err);
        return;
      }
      logger.info(`Subscribed to channel: ${channel}`);
    });

    subscriberRedis.on('message', async (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message) as T;
          await handler(data);
        } catch (error) {
          logger.error(`Error handling message from ${channel}:`, error as Error);
        }
      }
    });
  }

  /**
   * Subscribe to multiple channels with pattern matching
   */
  static psubscribe<T = any>(
    pattern: string,
    handler: (channel: string, data: T) => void | Promise<void>
  ): void {
    if (!subscriberRedis) {
      logger.warn(`Pub/sub disabled - cannot psubscribe to ${pattern}`);
      return;
    }
    subscriberRedis.psubscribe(pattern, (err) => {
      if (err) {
        logger.error(`Failed to psubscribe to ${pattern}:`, err);
        return;
      }
      logger.info(`Pattern subscribed: ${pattern}`);
    });

    subscriberRedis.on('pmessage', async (_pattern, ch, message) => {
      try {
        const data = JSON.parse(message) as T;
        await handler(ch, data);
      } catch (error) {
        logger.error(`Error handling pattern message from ${ch}:`, error as Error);
      }
    });
  }

  /**
   * Unsubscribe from a channel
   */
  static async unsubscribe(channel: string): Promise<void> {
    if (!subscriberRedis) {
      return;
    }
    await subscriberRedis.unsubscribe(channel);
    logger.info(`Unsubscribed from ${channel}`);
  }

  /**
   * Graceful shutdown
   */
  static async disconnect(): Promise<void> {
    if (redis) {
      await redis.quit();
    }
    if (subscriberRedis) {
      await subscriberRedis.quit();
    }
    if (redis || subscriberRedis) {
      logger.info('Redis pub/sub connections closed');
    }
  }
}

/**
 * Convenience methods for common use cases
 */

/**
 * Notify a specific user
 */
export async function notifyUser(notification: UserNotification): Promise<void> {
  await PubSubService.publish(
    `${CHANNELS.USER_NOTIFICATIONS}:${notification.userId}`,
    notification
  );
}

/**
 * Queue an AI job
 */
export async function queueAIJob(job: AIJob): Promise<void> {
  await PubSubService.publish(CHANNELS.AI_JOBS, job);
}

/**
 * Publish AI result
 */
export async function publishAIResult(result: AIResult): Promise<void> {
  await PubSubService.publish(`${CHANNELS.AI_RESULTS}:${result.userId}`, result);
}

/**
 * Invalidate cache pattern
 */
export async function invalidateCache(pattern: string, reason?: string): Promise<void> {
  await PubSubService.publish(CHANNELS.CACHE_INVALIDATE, {
    pattern,
    reason,
    timestamp: Date.now(),
  });
}

/**
 * Send chat message to room
 */
export async function sendChatMessage(message: ChatMessage): Promise<void> {
  await PubSubService.publish(`${CHANNELS.CHAT_MESSAGES}:${message.roomId}`, message);
}

/**
 * Track analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await PubSubService.publish(CHANNELS.ANALYTICS_EVENTS, {
    ...event,
    timestamp: event.timestamp || Date.now(),
  });
}

// Cleanup on process exit
process.on('SIGINT', async () => {
  await PubSubService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await PubSubService.disconnect();
  process.exit(0);
});
