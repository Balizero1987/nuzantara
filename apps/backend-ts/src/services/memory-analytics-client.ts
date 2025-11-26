/**
 * MEMORY ANALYTICS CLIENT
 *
 * Client library for fetching Memory Service analytics
 */

/* eslint-disable no-undef */ // fetch is built-in in Node 1dynamicValue

import logger from './logger.js';

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'https://nuzantara-memory.fly.dev';

export interface ComprehensiveAnalytics {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  uniqueUsers: number;
  messagesLast24h: number;
  sessionsLast24h: number;
  avgConversationLength: number;
  longestConversation: number;
  avgMessagesPerSession: number;
  cacheHitRate: number;
  avgResponseTime: number;
  memoryHitRate: number;
  avgHistoryRetrieved: number;
  dailyStats: Array<{
    date: string;
    sessions: number;
    messages: number;
    users: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    requests: number;
  }>;
}

export interface RealTimeMetrics {
  messagesPerMinute: number;
  retrievalsPerMinute: number;
  activeSessions: number;
  timestamp: string;
}

export class MemoryAnalyticsClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || MEMORY_SERVICE_URL;
  }

  /**
   * Get comprehensive analytics
   */
  async getComprehensiveAnalytics(days: number = 7): Promise<ComprehensiveAnalytics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/comprehensive?days=${days}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; analytics: ComprehensiveAnalytics; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      return data.analytics;
    } catch (error) {
      logger.error('❌ Failed to fetch comprehensive analytics:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/realtime`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; realtime: RealTimeMetrics; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch real-time metrics');
      }

      return data.realtime;
    } catch (error) {
      logger.error('❌ Failed to fetch real-time metrics:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Trigger daily aggregation
   */
  async aggregateDailyStats(date?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/aggregate-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; date: string; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to aggregate daily stats');
      }

      logger.info(`✅ Daily stats aggregated for ${data.date}`);
    } catch (error) {
      logger.error('❌ Failed to aggregate daily stats:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Clean old analytics events
   */
  async cleanOldEvents(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analytics/clean-old-events`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; deleted_count: number; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to clean old events');
      }

      logger.info(`✅ Cleaned ${data.deleted_count} old events`);
      return data.deleted_count;
    } catch (error) {
      logger.error('❌ Failed to clean old events:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get basic stats (legacy endpoint)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getBasicStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stats`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { success: boolean; stats: any; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      return data.stats;
    } catch (error) {
      logger.error('❌ Failed to fetch basic stats:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get health summary
   */
  async getHealthSummary(): Promise<{
    status: 'healthy' | 'warning' | 'unhealthy';
    metrics: ComprehensiveAnalytics;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const analytics = await this.getComprehensiveAnalytics(1); // Last 24h

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check cache health
      if (analytics.cacheHitRate < 0.4) {
        issues.push('Low cache hit rate');
        recommendations.push('Consider increasing Redis TTL or cache size');
      }

      // Check memory usage
      if (analytics.memoryHitRate < 0.3) {
        issues.push('Low memory usage rate');
        recommendations.push('Users may not be using conversation context effectively');
      }

      // Check activity
      if (analytics.messagesLast24h === 0) {
        issues.push('No activity in last 24 hours');
        recommendations.push('Check if service is accessible');
      }

      const status = issues.length === 0 ? 'healthy' : issues.length <= 2 ? 'warning' : 'unhealthy';

      return {
        status,
        metrics: analytics,
        issues,
        recommendations,
      };
    } catch (_error) {
       
      return {
        status: 'unhealthy',
        metrics: {} as ComprehensiveAnalytics,
        issues: ['Failed to fetch analytics'],
        recommendations: ['Check Memory Service connectivity'],
      };
    }
  }
}

// Export singleton instance
export const memoryAnalyticsClient = new MemoryAnalyticsClient();
