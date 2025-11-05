/**
 * MEMORY SERVICE ANALYTICS MODULE
 *
 * Tracks and provides insights on memory usage, performance, and effectiveness
 */

/* eslint-disable no-console */ // Console statements appropriate for analytics module
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Pool } from 'pg';
import Redis from 'ioredis';

export interface AnalyticsData {
  // Usage Metrics
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  uniqueUsers: number;
  messagesLast24h: number;
  sessionsLast24h: number;

  // Conversation Metrics
  avgConversationLength: number;
  longestConversation: number;
  avgMessagesPerSession: number;

  // Performance Metrics
  cacheHitRate: number;
  avgResponseTime: number;

  // Memory Effectiveness
  memoryHitRate: number; // % of requests that retrieved history
  avgHistoryRetrieved: number; // Average messages retrieved per request

  // Time-based Metrics
  dailyStats: DailyStats[];
  hourlyDistribution: HourlyDistribution[];
}

export interface DailyStats {
  date: string;
  sessions: number;
  messages: number;
  users: number;
}

export interface HourlyDistribution {
  hour: number;
  requests: number;
}

export interface MemoryAnalyticsEvent {
  event_type: 'conversation_retrieve' | 'message_store' | 'cache_hit' | 'cache_miss';
  session_id: string;
  user_id?: string;
  metadata?: any;
  timestamp?: Date;
}

export class MemoryAnalytics {
  private postgres: Pool;
  private redis: Redis | null;

  constructor(postgres: Pool, redis: Redis | null) {
    this.postgres = postgres;
    this.redis = redis;
  }

  /**
   * Initialize analytics tables
   */
  async initialize() {
    console.log('🔧 Initializing analytics tables...');

    try {
      // Analytics events table
      await this.postgres.query(`
        CREATE TABLE IF NOT EXISTS memory_analytics_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          event_type VARCHAR(100) NOT NULL,
          session_id VARCHAR(255),
          user_id VARCHAR(255),
          metadata JSONB DEFAULT '{}'::jsonb,
          timestamp TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create index for faster queries
      await this.postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_timestamp
        ON memory_analytics_events(timestamp);
      `);

      await this.postgres.query(`
        CREATE INDEX IF NOT EXISTS idx_analytics_event_type
        ON memory_analytics_events(event_type);
      `);

      // Daily aggregations table
      await this.postgres.query(`
        CREATE TABLE IF NOT EXISTS memory_analytics_daily (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date DATE UNIQUE NOT NULL,
          total_sessions INTEGER DEFAULT 0,
          total_messages INTEGER DEFAULT 0,
          unique_users INTEGER DEFAULT 0,
          cache_hits INTEGER DEFAULT 0,
          cache_misses INTEGER DEFAULT 0,
          avg_conversation_length REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('✅ Analytics tables initialized!');
    } catch (error) {
      console.error('❌ Analytics initialization failed:', error);
      throw error;
    }
  }

  /**
   * Track an analytics event
   */
  async trackEvent(event: MemoryAnalyticsEvent) {
    try {
      await this.postgres.query(
        `INSERT INTO memory_analytics_events (event_type, session_id, user_id, metadata)
         VALUES ($1, $2, $3, $4)`,
        [event.event_type, event.session_id, event.user_id, event.metadata || {}]
      );
    } catch (error) {
      console.error('⚠️  Failed to track analytics event:', error);
      // Don't throw - analytics failures shouldn't break core functionality
    }
  }

  /**
   * Get comprehensive analytics data
   */
  async getAnalytics(days: number = 7): Promise<AnalyticsData> {
    try {
      // Basic usage metrics
      const usageStats = await this.postgres.query(`
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(DISTINCT CASE WHEN last_active > NOW() - INTERVAL '24 hours'
            THEN session_id END) as active_sessions,
          (SELECT COUNT(*) FROM conversation_history) as total_messages,
          (SELECT COUNT(DISTINCT user_id) FROM conversation_history) as unique_users,
          (SELECT COUNT(*) FROM conversation_history
            WHERE timestamp > NOW() - INTERVAL '24 hours') as messages_last_24h,
          (SELECT COUNT(DISTINCT session_id) FROM conversation_history
            WHERE timestamp > NOW() - INTERVAL '24 hours') as sessions_last_24h
        FROM memory_sessions
      `);

      // Conversation metrics
      const conversationStats = await this.postgres.query(`
        SELECT
          AVG(message_count) as avg_conversation_length,
          MAX(message_count) as longest_conversation,
          AVG(message_count) as avg_messages_per_session
        FROM (
          SELECT session_id, COUNT(*) as message_count
          FROM conversation_history
          GROUP BY session_id
        ) conversation_counts
      `);

      // Cache hit rate (from analytics events)
      const cacheStats = await this.postgres.query(`
        SELECT
          COUNT(CASE WHEN event_type = 'cache_hit' THEN 1 END) as cache_hits,
          COUNT(CASE WHEN event_type = 'cache_miss' THEN 1 END) as cache_misses
        FROM memory_analytics_events
        WHERE timestamp > NOW() - INTERVAL '24 hours'
      `);

      const cacheHits = parseInt(cacheStats.rows[0]?.cache_hits || 0);
      const cacheMisses = parseInt(cacheStats.rows[0]?.cache_misses || 0);
      const totalCacheRequests = cacheHits + cacheMisses;
      const cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0;

      // Memory hit rate (% of requests that retrieved history)
      const memoryStats = await this.postgres.query(`
        SELECT
          AVG(CAST((metadata->>'messages_retrieved')::text AS INTEGER)) as avg_retrieved
        FROM memory_analytics_events
        WHERE event_type = 'conversation_retrieve'
          AND timestamp > NOW() - INTERVAL '24 hours'
          AND metadata->>'messages_retrieved' IS NOT NULL
      `);

      const avgHistoryRetrieved = parseFloat(memoryStats.rows[0]?.avg_retrieved || 0);

      // Memory hit rate: % of sessions that actually used history
      const memoryHitStats = await this.postgres.query(`
        SELECT
          COUNT(DISTINCT session_id) as sessions_with_history
        FROM memory_analytics_events
        WHERE event_type = 'conversation_retrieve'
          AND timestamp > NOW() - INTERVAL '24 hours'
          AND CAST((metadata->>'messages_retrieved')::text AS INTEGER) > 0
      `);

      const sessionsWithHistory = parseInt(memoryHitStats.rows[0]?.sessions_with_history || 0);
      const totalSessions = parseInt(usageStats.rows[0]?.sessions_last_24h || 1);
      const memoryHitRate = totalSessions > 0 ? sessionsWithHistory / totalSessions : 0;

      // Daily stats (last N days)
      const dailyStats = await this.postgres.query(`
        SELECT
          DATE(timestamp) as date,
          COUNT(DISTINCT session_id) as sessions,
          COUNT(*) as messages,
          COUNT(DISTINCT user_id) as users
        FROM conversation_history
        WHERE timestamp > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `);

      // Hourly distribution (last 24 hours)
      const hourlyStats = await this.postgres.query(`
        SELECT
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) as requests
        FROM memory_analytics_events
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      `);

      return {
        // Usage Metrics
        totalSessions: parseInt(usageStats.rows[0]?.total_sessions || 0),
        activeSessions: parseInt(usageStats.rows[0]?.active_sessions || 0),
        totalMessages: parseInt(usageStats.rows[0]?.total_messages || 0),
        uniqueUsers: parseInt(usageStats.rows[0]?.unique_users || 0),
        messagesLast24h: parseInt(usageStats.rows[0]?.messages_last_24h || 0),
        sessionsLast24h: parseInt(usageStats.rows[0]?.sessions_last_24h || 0),

        // Conversation Metrics
        avgConversationLength: parseFloat(conversationStats.rows[0]?.avg_conversation_length || 0),
        longestConversation: parseInt(conversationStats.rows[0]?.longest_conversation || 0),
        avgMessagesPerSession: parseFloat(conversationStats.rows[0]?.avg_messages_per_session || 0),

        // Performance Metrics
        cacheHitRate: cacheHitRate,
        avgResponseTime: 0, // TODO: implement response time tracking

        // Memory Effectiveness
        memoryHitRate: memoryHitRate,
        avgHistoryRetrieved: avgHistoryRetrieved,

        // Time-based Metrics
        dailyStats: dailyStats.rows.map((row) => ({
          date: row.date,
          sessions: parseInt(row.sessions),
          messages: parseInt(row.messages),
          users: parseInt(row.users),
        })),

        hourlyDistribution: hourlyStats.rows.map((row) => ({
          hour: parseInt(row.hour),
          requests: parseInt(row.requests),
        })),
      };
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics (last 5 minutes)
   */
  async getRealTimeMetrics() {
    try {
      const metrics = await this.postgres.query(`
        SELECT
          COUNT(CASE WHEN event_type = 'message_store' THEN 1 END) as messages_5min,
          COUNT(CASE WHEN event_type = 'conversation_retrieve' THEN 1 END) as retrievals_5min,
          COUNT(DISTINCT session_id) as active_sessions_5min
        FROM memory_analytics_events
        WHERE timestamp > NOW() - INTERVAL '5 minutes'
      `);

      return {
        messagesPerMinute: parseInt(metrics.rows[0]?.messages_5min || 0) / 5,
        retrievalsPerMinute: parseInt(metrics.rows[0]?.retrievals_5min || 0) / 5,
        activeSessions: parseInt(metrics.rows[0]?.active_sessions_5min || 0),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to get real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Aggregate daily stats (run once per day via cron)
   */
  async aggregateDailyStats(date?: Date) {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    try {
      const stats = await this.postgres.query(
        `
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          COUNT(*) as total_messages,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(session_message_count) as avg_conversation_length
        FROM (
          SELECT
            session_id,
            user_id,
            COUNT(*) as session_message_count
          FROM conversation_history
          WHERE DATE(timestamp) = $1
          GROUP BY session_id, user_id
        ) daily_data
      `,
        [dateStr]
      );

      const cacheStats = await this.postgres.query(
        `
        SELECT
          COUNT(CASE WHEN event_type = 'cache_hit' THEN 1 END) as cache_hits,
          COUNT(CASE WHEN event_type = 'cache_miss' THEN 1 END) as cache_misses
        FROM memory_analytics_events
        WHERE DATE(timestamp) = $1
      `,
        [dateStr]
      );

      await this.postgres.query(
        `
        INSERT INTO memory_analytics_daily
        (date, total_sessions, total_messages, unique_users, cache_hits, cache_misses, avg_conversation_length)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (date) DO UPDATE
        SET total_sessions = EXCLUDED.total_sessions,
            total_messages = EXCLUDED.total_messages,
            unique_users = EXCLUDED.unique_users,
            cache_hits = EXCLUDED.cache_hits,
            cache_misses = EXCLUDED.cache_misses,
            avg_conversation_length = EXCLUDED.avg_conversation_length,
            updated_at = NOW()
      `,
        [
          dateStr,
          stats.rows[0]?.total_sessions || 0,
          stats.rows[0]?.total_messages || 0,
          stats.rows[0]?.unique_users || 0,
          cacheStats.rows[0]?.cache_hits || 0,
          cacheStats.rows[0]?.cache_misses || 0,
          stats.rows[0]?.avg_conversation_length || 0,
        ]
      );

      console.log(`✅ Daily stats aggregated for ${dateStr}`);
    } catch (error) {
      console.error('❌ Failed to aggregate daily stats:', error);
      throw error;
    }
  }

  /**
   * Clean old analytics events (keep last 30 days)
   */
  async cleanOldEvents() {
    try {
      const result = await this.postgres.query(`
        DELETE FROM memory_analytics_events
        WHERE timestamp < NOW() - INTERVAL '30 days'
      `);

      console.log(`✅ Cleaned ${result.rowCount} old analytics events`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Failed to clean old events:', error);
      throw error;
    }
  }
}
