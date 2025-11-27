/**
 * Audit Trail System for Critical Operations
 *
 * Logs all critical operations for compliance and security
 * GDPR-compliant with data retention policies
 */

import logger from './logger.js';
import type { Request } from 'express';
import { getDatabasePool } from './connection-pool.js';

export enum AuditEventType {
  // Authentication
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILED = 'auth_failed',
  AUTH_TOKEN_REFRESH = 'auth_token_refresh',

  // Data access
  DATA_READ = 'data_read',
  DATA_WRITE = 'data_write',
  DATA_DELETE = 'data_delete',
  DATA_EXPORT = 'data_export',

  // Administrative
  ADMIN_ACTION = 'admin_action',
  CONFIG_CHANGE = 'config_change',
  FEATURE_FLAG_CHANGE = 'feature_flag_change',

  // System operations
  CIRCUIT_BREAKER_OPEN = 'circuit_breaker_open',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  ERROR_EVENT = 'error_event',

  // GDPR-related
  DATA_ACCESS_REQUEST = 'data_access_request',
  DATA_DELETION_REQUEST = 'data_deletion_request',
  CONSENT_UPDATE = 'consent_update',
}

export interface AuditEvent {
  id?: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  resourceId?: string;
  resourceType?: string;
  action?: string;
  result: 'success' | 'failure' | 'error';
  errorMessage?: string;
  metadata?: Record<string, any>;
  gdprRelevant: boolean;
  retentionDays?: number; // Custom retention, defaults to policy
}

class AuditTrailService {
  private enabled: boolean = true;
  private dbTableCreated: boolean = false;

  constructor() {
    this.enabled = process.env.ENABLE_AUDIT_TRAIL === 'true';
  }

  /**
   * Log an audit event
   */
  async log(
    event: Omit<AuditEvent, 'timestamp' | 'gdprRelevant' | 'retentionDays'>
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const fullEvent: AuditEvent = {
        ...event,
        timestamp: new Date(),
        gdprRelevant: this.isGDPRRelevant(event.eventType),
        retentionDays: this.getRetentionDays(event.eventType),
      };

      // Log to console
      logger.info(
        `📋 AUDIT [${event.eventType}]: ${event.action || 'N/A'} - User: ${event.userId || 'anonymous'} - Result: ${event.result}`
      );

      // Store in database
      await this.storeEvent(fullEvent);
    } catch (error: any) {
      // Don't throw - audit failures shouldn't break the app
      logger.error(`Failed to log audit event: ${error.message}`);
    }
  }

  /**
   * Log from Express request
   */
  async logRequest(
    req: Request,
    eventType: AuditEventType,
    result: 'success' | 'failure' | 'error',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      userId: req.header('x-user-id') || undefined,
      ipAddress: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.header('user-agent') || undefined,
      endpoint: req.path,
      method: req.method,
      result,
      metadata,
      action: `${req.method} ${req.path}`,
    });
  }

  /**
   * Check if event type is GDPR relevant
   */
  private isGDPRRelevant(eventType: AuditEventType): boolean {
    const gdprRelevantTypes = [
      AuditEventType.DATA_READ,
      AuditEventType.DATA_WRITE,
      AuditEventType.DATA_DELETE,
      AuditEventType.DATA_EXPORT,
      AuditEventType.DATA_ACCESS_REQUEST,
      AuditEventType.DATA_DELETION_REQUEST,
      AuditEventType.CONSENT_UPDATE,
      AuditEventType.AUTH_LOGIN,
    ];

    return gdprRelevantTypes.includes(eventType);
  }

  /**
   * Get retention days based on event type
   */
  private getRetentionDays(eventType: AuditEventType): number {
    // GDPR requires minimum retention periods
    const retentionPolicies: Partial<Record<AuditEventType, number>> = {
      [AuditEventType.AUTH_LOGIN]: 90, // 3 months
      [AuditEventType.AUTH_LOGOUT]: 90,
      [AuditEventType.AUTH_FAILED]: 90,
      [AuditEventType.AUTH_TOKEN_REFRESH]: 90,
      [AuditEventType.DATA_READ]: 365, // 1 year
      [AuditEventType.DATA_WRITE]: 365,
      [AuditEventType.DATA_ACCESS_REQUEST]: 1095, // 3 years
      [AuditEventType.DATA_DELETION_REQUEST]: 1095, // 3 years
      [AuditEventType.DATA_DELETE]: 1095, // 3 years
      [AuditEventType.DATA_EXPORT]: 365, // 1 year
      [AuditEventType.CONSENT_UPDATE]: 1095, // 3 years
      [AuditEventType.ADMIN_ACTION]: 730, // 2 years
      [AuditEventType.CONFIG_CHANGE]: 365, // 1 year
      [AuditEventType.FEATURE_FLAG_CHANGE]: 365,
      [AuditEventType.RATE_LIMIT_EXCEEDED]: 30, // 30 days
      [AuditEventType.CIRCUIT_BREAKER_OPEN]: 30, // 30 days
      [AuditEventType.ERROR_EVENT]: 90,
    };

    return retentionPolicies[eventType] || 90; // Default: 90 days
  }

  /**
   * Store event in database
   */
  private async storeEvent(event: AuditEvent): Promise<void> {
    try {
      // Ensure table exists
      await this.ensureTableExists();

      const pool = getDatabasePool();
      if (!pool) {
        logger.warn('Audit trail: Database pool not available, skipping event storage');
        return;
      }
      await pool.query(
        `INSERT INTO audit_events (
          timestamp, event_type, user_id, ip_address, user_agent,
          endpoint, method, resource_id, resource_type, action,
          result, error_message, metadata, gdpr_relevant, retention_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          event.timestamp,
          event.eventType,
          event.userId || null,
          event.ipAddress || null,
          event.userAgent || null,
          event.endpoint || null,
          event.method || null,
          event.resourceId || null,
          event.resourceType || null,
          event.action || null,
          event.result,
          event.errorMessage || null,
          event.metadata ? JSON.stringify(event.metadata) : null,
          event.gdprRelevant,
          event.retentionDays || 90,
        ]
      );
    } catch (error: any) {
      // If database is not available, just log
      logger.warn(`Audit trail database storage failed: ${error.message}`);
    }
  }

  /**
   * Ensure audit table exists
   */
  private async ensureTableExists(): Promise<void> {
    if (this.dbTableCreated) {
      return;
    }

    try {
      const pool = getDatabasePool();
      if (!pool) {
        logger.warn('Audit trail: Database pool not available, cannot create table');
        return;
      }
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_events (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          event_type VARCHAR(100) NOT NULL,
          user_id VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent TEXT,
          endpoint VARCHAR(500),
          method VARCHAR(10),
          resource_id VARCHAR(255),
          resource_type VARCHAR(100),
          action VARCHAR(500),
          result VARCHAR(20) NOT NULL,
          error_message TEXT,
          metadata JSONB,
          gdpr_relevant BOOLEAN NOT NULL DEFAULT FALSE,
          retention_days INTEGER NOT NULL DEFAULT 90,
          INDEX idx_timestamp (timestamp),
          INDEX idx_event_type (event_type),
          INDEX idx_user_id (user_id),
          INDEX idx_gdpr_relevant (gdpr_relevant)
        )
      `);
      this.dbTableCreated = true;
      logger.info('✅ Audit trail table created/verified');
    } catch (error: any) {
      logger.error(`Failed to create audit table: ${error.message}`);
    }
  }

  /**
   * Query audit events (with GDPR compliance)
   */
  async queryEvents(filters: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    gdprRelevant?: boolean;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      await this.ensureTableExists();
      const pool = getDatabasePool();
      if (!pool) {
        logger.warn('Audit trail: Database pool not available');
        return [];
      }

      let query = 'SELECT * FROM audit_events WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.userId);
      }

      if (filters.eventType) {
        query += ` AND event_type = $${paramIndex++}`;
        params.push(filters.eventType);
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      if (filters.gdprRelevant !== undefined) {
        query += ` AND gdpr_relevant = $${paramIndex++}`;
        params.push(filters.gdprRelevant);
      }

      query += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const result = await pool.query(query, params);
      return result.rows.map(this.mapRowToEvent);
    } catch (error: any) {
      logger.error(`Failed to query audit events: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean up old audit events based on retention policy
   */
  async cleanupOldEvents(): Promise<number> {
    try {
      await this.ensureTableExists();
      const pool = getDatabasePool();
      if (!pool) {
        logger.warn('Audit trail: Database pool not available');
        return 0;
      }

      const result = await pool.query(`
        DELETE FROM audit_events
        WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days
      `);

      const deleted = result.rowCount || 0;
      if (deleted > 0) {
        logger.info(`🧹 Cleaned up ${deleted} old audit events`);
      }

      return deleted;
    } catch (error: any) {
      logger.error(`Failed to cleanup audit events: ${error.message}`);
      return 0;
    }
  }

  /**
   * Map database row to AuditEvent
   */
  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.id.toString(),
      timestamp: new Date(row.timestamp),
      eventType: row.event_type as AuditEventType,
      userId: row.user_id || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      endpoint: row.endpoint || undefined,
      method: row.method || undefined,
      resourceId: row.resource_id || undefined,
      resourceType: row.resource_type || undefined,
      action: row.action || undefined,
      result: row.result as 'success' | 'failure' | 'error',
      errorMessage: row.error_message || undefined,
      metadata: row.metadata || undefined,
      gdprRelevant: row.gdpr_relevant,
      retentionDays: row.retention_days,
    };
  }
}

// Singleton instance
export const auditTrail = new AuditTrailService();

// Schedule cleanup job (daily)
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      auditTrail.cleanupOldEvents().catch((err) => {
        logger.error(`Audit cleanup job failed: ${err.message}`);
      });
    },
    24 * 60 * 60 * 1000
  ); // Daily
}
