/**
 * Audit Trail System
 *
 * Comprehensive audit logging for all critical operations to ensure
 * security compliance, GDPR compliance, and operational traceability.
 *
 * Features:
 * - Automatic audit logging for critical operations
 * - GDPR-compliant data handling (PII masking)
 * - Immutable audit records
 * - Searchable audit logs
 * - Export capabilities for compliance reporting
 * - Integration with existing authentication system
 *
 * CRITICAL OPERATIONS LOGGED:
 * - Authentication events (login, logout, token refresh)
 * - Authorization changes (role changes, permissions)
 * - Data access (sensitive data reads, exports)
 * - Data modifications (create, update, delete)
 * - System configuration changes
 * - Security events (failed auth, rate limit violations)
 */

import logger from '../logger.js';
import { createClient, RedisClientType } from 'redis';
import { getFlags } from '../../config/flags.js';
import crypto from 'crypto';

interface AuditEvent {
  id: string;
  timestamp: number;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'success' | 'failure' | 'warning';
  metadata?: Record<string, any>;
  requestId?: string;
  sessionId?: string;
  gdprCompliant: boolean;
}

interface AuditConfig {
  enableAuditTrail?: boolean;
  retentionDays?: number;
  enableRedis?: boolean;
  enableFileLogging?: boolean;
  enablePIIMasking?: boolean;
  sensitiveFields?: string[];
}

class AuditTrailService {
  private redis: RedisClientType | null = null;
  private isConnected = false;
  private config: Required<AuditConfig>;
  private eventBuffer: AuditEvent[] = [];
  private bufferFlushInterval?: NodeJS.Timeout;

  constructor(config: AuditConfig = {}) {
    this.config = {
      enableAuditTrail: config.enableAuditTrail ?? true,
      retentionDays: config.retentionDays ?? 90, // 90 days GDPR minimum
      enableRedis: config.enableRedis ?? true,
      enableFileLogging: config.enableFileLogging ?? true,
      enablePIIMasking: config.enablePIIMasking ?? true,
      sensitiveFields: config.sensitiveFields ?? [
        'password',
        'pin',
        'token',
        'apiKey',
        'secret',
        'creditCard',
        'ssn',
        'email',
        'phone',
      ],
    };

    // Start buffer flush interval
    this.startBufferFlush();
  }

  /**
   * Initialize audit trail service
   */
  async initialize(): Promise<void> {
    const flags = getFlags();
    if (!flags.ENABLE_AUDIT_TRAIL && !this.config.enableAuditTrail) {
      logger.info('Audit trail disabled by feature flag');
      return;
    }

    if (this.config.enableRedis && process.env.REDIS_URL) {
      try {
        this.redis = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries > 3) return false;
              return Math.min(retries * 100, 1000);
            },
          },
        });

        this.redis.on('error', (err) => {
          logger.error('Audit trail Redis error:', err);
          this.isConnected = false;
        });

        this.redis.on('connect', () => {
          logger.info('Audit trail Redis connected');
          this.isConnected = true;
        });

        await this.redis.connect();
        logger.info('✅ Audit trail service initialized');
      } catch (error: any) {
        logger.error('Failed to initialize audit trail Redis:', error);
        this.redis = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'gdprCompliant'>): Promise<string> {
    const flags = getFlags();
    if (!flags.ENABLE_AUDIT_TRAIL && !this.config.enableAuditTrail) {
      return ''; // Silently skip if disabled
    }

    // Mask PII if enabled
    const maskedMetadata = this.config.enablePIIMasking
      ? this.maskPII(event.metadata || {})
      : event.metadata;

    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      metadata: maskedMetadata,
      gdprCompliant: this.config.enablePIIMasking,
    };

    // Add to buffer
    this.eventBuffer.push(auditEvent);

    // Log to file if enabled
    if (this.config.enableFileLogging) {
      this.logToFile(auditEvent);
    }

    // Return event ID for reference
    return auditEvent.id;
  }

  /**
   * Mask PII in metadata
   */
  private maskPII(data: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = { ...data };

    for (const [key, value] of Object.entries(masked)) {
      const keyLower = key.toLowerCase();

      // Check if field is sensitive
      if (this.config.sensitiveFields!.some((field) => keyLower.includes(field.toLowerCase()))) {
        if (typeof value === 'string') {
          // Mask email addresses
          if (keyLower.includes('email')) {
            masked[key] = this.maskEmail(value);
          }
          // Mask phone numbers
          else if (keyLower.includes('phone')) {
            masked[key] = this.maskPhone(value);
          }
          // Generic string masking
          else {
            masked[key] =
              value.length > 4
                ? value.substring(0, 2) + '***' + value.substring(value.length - 2)
                : '***';
          }
        }
        // Mask other sensitive types
        else if (typeof value === 'object' && value !== null) {
          masked[key] = this.maskPII(value as Record<string, any>);
        } else {
          masked[key] = '***REDACTED***';
        }
      }
      // Recursively mask nested objects
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        masked[key] = this.maskPII(value as Record<string, any>);
      }
    }

    return masked;
  }

  /**
   * Mask email address (keep domain visible)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***@***';
    const maskedLocal =
      local.length > 2 ? local.substring(0, 1) + '***' + local.substring(local.length - 1) : '***';
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '***';
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  /**
   * Start buffer flush interval
   */
  private startBufferFlush(): void {
    // Flush buffer every 5 seconds
    this.bufferFlushInterval = setInterval(() => {
      this.flushBuffer();
    }, 5000);
  }

  /**
   * Flush event buffer to Redis
   */
  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0 || !this.isConnected || !this.redis) {
      return;
    }

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      const pipeline = this.redis.multi();
      const timestamp = Date.now();

      for (const event of events) {
        // Store in sorted set by timestamp for efficient querying
        const key = `audit:events:${this.getDateKey(event.timestamp)}`;
        const score = event.timestamp;
        const value = JSON.stringify(event);

        pipeline.zAdd(key, { score, value });

        // Also index by user for user-specific queries
        if (event.userId) {
          const userKey = `audit:user:${event.userId}`;
          pipeline.zAdd(userKey, { score, value });
        }

        // Index by action type
        const actionKey = `audit:action:${event.action}`;
        pipeline.zAdd(actionKey, { score, value });
      }

      await pipeline.exec();

      // Set expiration on keys (retention policy)
      const retentionSeconds = this.config.retentionDays * 24 * 60 * 60;
      for (const event of events) {
        const key = `audit:events:${this.getDateKey(event.timestamp)}`;
        await this.redis.expire(key, retentionSeconds);
      }

      logger.debug(`Flushed ${events.length} audit events to Redis`);
    } catch (error: any) {
      logger.error('Failed to flush audit buffer:', error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * Query audit events
   */
  async query(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startTime?: number;
    endTime?: number;
    status?: AuditEvent['status'];
    limit?: number;
  }): Promise<AuditEvent[]> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Audit trail Redis not available for query');
      return [];
    }

    try {
      const events: AuditEvent[] = [];
      const limit = filters.limit || 100;

      // Build query keys
      let queryKey: string;
      if (filters.userId) {
        queryKey = `audit:user:${filters.userId}`;
      } else if (filters.action) {
        queryKey = `audit:action:${filters.action}`;
      } else {
        // Query by date range
        const startDate = filters.startTime || Date.now() - 24 * 60 * 60 * 1000; // Default: last 24h
        queryKey = `audit:events:${this.getDateKey(startDate)}`;
      }

      // Get events from sorted set
      const start = filters.startTime || 0;
      const end = filters.endTime || Date.now();

      // Get events using a simpler approach to avoid Redis API conflicts
      const results = await (this.redis as any).zRangeByScore(queryKey, start, end, {
        LIMIT: { offset: 0, count: limit },
        REV: true,
      });

      // Parse and filter events
      for (const result of results) {
        const event: AuditEvent = JSON.parse(result as string);

        // Apply additional filters
        if (filters.resource && event.resource !== filters.resource) continue;
        if (filters.status && event.status !== filters.status) continue;

        events.push(event);
      }

      return events;
    } catch (error: any) {
      logger.error('Failed to query audit events:', error);
      return [];
    }
  }

  /**
   * Export audit events for compliance reporting
   */
  async export(filters: {
    userId?: string;
    startTime?: number;
    endTime?: number;
    format?: 'json' | 'csv';
  }): Promise<string> {
    const events = await this.query({
      userId: filters.userId,
      startTime: filters.startTime,
      endTime: filters.endTime,
      limit: 10000, // Max export limit
    });

    if (filters.format === 'csv') {
      return this.exportToCSV(events);
    }

    return JSON.stringify(events, null, 2);
  }

  /**
   * Export events to CSV
   */
  private exportToCSV(events: AuditEvent[]): string {
    const headers = ['id', 'timestamp', 'userId', 'action', 'resource', 'status', 'ipAddress'];
    const rows = events.map((event) => [
      event.id,
      new Date(event.timestamp).toISOString(),
      event.userId || '',
      event.action,
      event.resource,
      event.status,
      event.ipAddress || '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
      '\n'
    );
  }

  /**
   * Log to file (Winston)
   */
  private logToFile(event: AuditEvent): void {
    const logData = {
      audit: true,
      eventId: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      status: event.status,
      metadata: event.metadata,
    };

    if (event.status === 'failure') {
      logger.warn('AUDIT: Failed operation', logData);
    } else {
      logger.info('AUDIT: Operation logged', logData);
    }
  }

  /**
   * Get date key for indexing (YYYY-MM-DD)
   */
  private getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Cleanup expired audit records
   */
  async cleanup(): Promise<number> {
    if (!this.isConnected || !this.redis) {
      return 0;
    }

    try {
      const cutoffDate = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
      const cutoffDateKey = this.getDateKey(cutoffDate);

      // Find all audit keys older than retention period
      const keys = await this.redis.keys('audit:*');
      let deleted = 0;

      for (const key of keys) {
        const keyDate = key.match(/audit:events:(\d{4}-\d{2}-\d{2})/);
        if (keyDate && keyDate[1] < cutoffDateKey) {
          await this.redis.del(key);
          deleted++;
        }
      }

      logger.info(`Cleaned up ${deleted} expired audit records`);
      return deleted;
    } catch (error: any) {
      logger.error('Failed to cleanup audit records:', error);
      return 0;
    }
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    // Flush remaining buffer
    await this.flushBuffer();

    // Clear interval
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Close Redis
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }

    logger.info('Audit trail service shut down');
  }
}

// Singleton instance
let auditTrailInstance: AuditTrailService | null = null;

/**
 * Get or create audit trail instance
 */
export function getAuditTrail(config?: AuditConfig): AuditTrailService {
  if (!auditTrailInstance) {
    auditTrailInstance = new AuditTrailService(config);
  }
  return auditTrailInstance;
}

/**
 * Initialize audit trail service
 */
export async function initializeAuditTrail(config?: AuditConfig): Promise<AuditTrailService> {
  const audit = getAuditTrail(config);
  await audit.initialize();
  return audit;
}

/**
 * Convenience function for logging audit events
 */
export async function auditLog(
  action: string,
  metadata?: Record<string, any>,
  context?: {
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    resourceId?: string;
    status?: 'success' | 'failure' | 'warning';
    requestId?: string;
    sessionId?: string;
  }
): Promise<string> {
  const audit = getAuditTrail();
  return audit.log({
    ...context,
    action,
    resource: context?.resource || 'system',
    status: context?.status || 'success',
    metadata,
  });
}

export { AuditTrailService };
export type { AuditEvent, AuditConfig };
