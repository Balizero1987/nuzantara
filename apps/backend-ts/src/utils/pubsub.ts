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
import logger from '../services/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Publisher connection (reuse main connection)
export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  lazyConnect: false
});

// Subscriber connection (dedicated)
const subscriberRedis = new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  lazyConnect: false
});

redis.on('connect', () => logger.info('Redis publisher connected'));
redis.on('error', (error) => logger.error('Redis publisher error:', error));

subscriberRedis.on('connect', () => logger.info('Redis subscriber connected'));
subscriberRedis.on('error', (error) => logger.error('Redis subscriber error:', error));

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
  SYSTEM_EVENTS: 'system:events'
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
    try {
      const payload = JSON.stringify(data);
      const receivers = await redis.publish(channel, payload);
      logger.debug(`Published to ${channel}: ${receivers} receivers`);
      return receivers;
    } catch (error) {
      logger.error(`Failed to publish to ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel with typed handler
   */
  static subscribe<T = any>(
    channel: string,
    handler: (data: T) => void | Promise<void>
  ): void {
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
          logger.error(`Error handling message from ${channel}:`, error);
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
    subscriberRedis.psubscribe(pattern, (err) => {
      if (err) {
        logger.error(`Failed to psubscribe to ${pattern}:`, err);
        return;
      }
      logger.info(`Pattern subscribed: ${pattern}`);
    });

    subscriberRedis.on('pmessage', async (pattern, ch, message) => {
      try {
        const data = JSON.parse(message) as T;
        await handler(ch, data);
      } catch (error) {
        logger.error(`Error handling pattern message from ${ch}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from a channel
   */
  static async unsubscribe(channel: string): Promise<void> {
    await subscriberRedis.unsubscribe(channel);
    logger.info(`Unsubscribed from ${channel}`);
  }

  /**
   * Graceful shutdown
   */
  static async disconnect(): Promise<void> {
    await redis.quit();
    await subscriberRedis.quit();
    logger.info('Redis pub/sub connections closed');
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
  await PubSubService.publish(
    `${CHANNELS.AI_RESULTS}:${result.userId}`,
    result
  );
}

/**
 * Invalidate cache pattern
 */
export async function invalidateCache(pattern: string, reason?: string): Promise<void> {
  await PubSubService.publish(CHANNELS.CACHE_INVALIDATE, {
    pattern,
    reason,
    timestamp: Date.now()
  });
}

/**
 * Send chat message to room
 */
export async function sendChatMessage(message: ChatMessage): Promise<void> {
  await PubSubService.publish(
    `${CHANNELS.CHAT_MESSAGES}:${message.roomId}`,
    message
  );
}

/**
 * Track analytics event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await PubSubService.publish(CHANNELS.ANALYTICS_EVENTS, {
    ...event,
    timestamp: event.timestamp || Date.now()
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
