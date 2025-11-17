/**
 * Zero Tools Security Layer
 * Provides enhanced security, audit logging, and protection for Zero Tools
 */

import { logger } from './logger.js';
import path from 'path';
import fs from 'fs/promises';

/**
 * Protected files that cannot be edited via Zero Tools
 */
const PROTECTED_FILES = [
  '.env',
  '.env.production',
  '.env.local',
  'service-account.json',
  'credentials.json',
  'secrets.yaml',
  'firebase-adminsdk.json',
  '.npmrc',
  '.git/config',
];

/**
 * Protected paths that cannot be accessed
 */
const PROTECTED_PATHS = ['/etc', '/root', '/sys', '/proc', '~/.ssh'];

/**
 * Dangerous bash commands that are blocked
 */
const BLOCKED_COMMANDS = [
  'rm -rf',
  'rm -fr',
  'sudo',
  'chmod 777',
  'chmod -R 777',
  '> /dev/sda',
  'dd if=',
  'mkfs',
  'kill -9',
  'killall',
  'reboot',
  'shutdown',
  'halt',
  'poweroff',
  'init 0',
  ':(){:|:&};:',
];

/**
 * Environment configuration
 */
export enum Environment {
  DEV = 'dev',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export interface EnvironmentConfig {
  deploy: 'auto' | 'manual_approval';
  database: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}

const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  [Environment.DEV]: {
    deploy: 'auto',
    database: 'dev_db',
    risk: 'low',
    requiresApproval: false,
  },
  [Environment.STAGING]: {
    deploy: 'auto',
    database: 'staging_db',
    risk: 'medium',
    requiresApproval: false,
  },
  [Environment.PRODUCTION]: {
    deploy: 'manual_approval',
    database: 'prod_db',
    risk: 'high',
    requiresApproval: true,
  },
};

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  tool: string;
  action: string;
  params: any;
  result: 'success' | 'error' | 'blocked';
  errorMessage?: string;
  ipAddress?: string;
  sessionId?: string;
  environment?: Environment;
}

/**
 * Security validation result
 */
export interface SecurityValidation {
  allowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Zero Tools Security Service
 */
export class ZeroToolsSecurity {
  private static instance: ZeroToolsSecurity;
  private auditLog: AuditLogEntry[] = [];
  private readonly PROJECT_ROOT: string;

  private constructor() {
    // Set project root - adjust based on your setup
    this.PROJECT_ROOT = process.env.PROJECT_ROOT || '/workspace/nuzantara';
  }

  static getInstance(): ZeroToolsSecurity {
    if (!ZeroToolsSecurity.instance) {
      ZeroToolsSecurity.instance = new ZeroToolsSecurity();
    }
    return ZeroToolsSecurity.instance;
  }

  /**
   * Validate userId for Zero Tools access
   */
  validateUser(userId: string): SecurityValidation {
    if (userId !== 'zero') {
      return {
        allowed: false,
        reason: 'Zero tools available only for userId=zero',
        severity: 'high',
      };
    }

    return { allowed: true };
  }

  /**
   * Validate file path for read/write operations
   */
  validateFilePath(filePath: string): SecurityValidation {
    // Check if file is protected
    const fileName = path.basename(filePath);
    if (PROTECTED_FILES.includes(fileName)) {
      return {
        allowed: false,
        reason: `File ${fileName} is protected and cannot be modified via Zero Tools`,
        severity: 'critical',
      };
    }

    // Resolve full path
    const fullPath = path.resolve(this.PROJECT_ROOT, filePath);

    // Check if path is outside project root
    if (!fullPath.startsWith(this.PROJECT_ROOT)) {
      return {
        allowed: false,
        reason: 'Path outside project root not allowed',
        severity: 'critical',
      };
    }

    // Check if path is in protected directories
    for (const protectedPath of PROTECTED_PATHS) {
      if (fullPath.startsWith(protectedPath)) {
        return {
          allowed: false,
          reason: `Access to ${protectedPath} is not allowed`,
          severity: 'critical',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate bash command
   */
  validateBashCommand(command: string): SecurityValidation {
    const commandLower = command.toLowerCase().trim();

    // Check for blocked commands
    for (const blocked of BLOCKED_COMMANDS) {
      if (commandLower.includes(blocked.toLowerCase())) {
        return {
          allowed: false,
          reason: `Dangerous command "${blocked}" is not allowed`,
          severity: 'critical',
        };
      }
    }

    // Check for command injection attempts
    if (this.containsCommandInjection(command)) {
      return {
        allowed: false,
        reason: 'Potential command injection detected',
        severity: 'critical',
      };
    }

    return { allowed: true };
  }

  /**
   * Detect command injection attempts
   */
  private containsCommandInjection(command: string): boolean {
    const injectionPatterns = [
      /;\s*rm/,
      /&&\s*rm/,
      /\|\s*rm/,
      /`.*rm/,
      /\$\(.*rm/,
      />\s*\/dev\//,
    ];

    return injectionPatterns.some((pattern) => pattern.test(command));
  }

  /**
   * Validate deployment request
   */
  async validateDeployment(
    environment: Environment,
    userId: string,
    approvalToken?: string
  ): Promise<SecurityValidation> {
    const config = ENVIRONMENT_CONFIGS[environment];

    if (config.requiresApproval && !approvalToken) {
      return {
        allowed: false,
        reason: `${environment} deployment requires manual approval. Request approval first.`,
        severity: 'high',
      };
    }

    if (approvalToken && !(await this.verifyApprovalToken(approvalToken, environment))) {
      return {
        allowed: false,
        reason: 'Invalid or expired approval token',
        severity: 'high',
      };
    }

    return { allowed: true };
  }

  /**
   * Verify approval token for production deployments
   */
  private async verifyApprovalToken(token: string, environment: Environment): Promise<boolean> {
    // TODO: Implement approval token verification
    // Could use:
    // - JWT tokens with expiration
    // - Database lookups
    // - Slack approval workflows
    // For now, return true for testing
    return true;
  }

  /**
   * Log audit entry
   */
  async logAudit(entry: AuditLogEntry): Promise<void> {
    // Add to in-memory log
    this.auditLog.push(entry);

    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Log to console
    logger.info('Zero Tools Audit', {
      timestamp: entry.timestamp,
      userId: entry.userId,
      tool: entry.tool,
      action: entry.action,
      result: entry.result,
      environment: entry.environment,
    });

    // TODO: Save to database for persistence
    // await this.saveAuditToDatabase(entry);

    // Send alert for critical actions
    if (entry.result === 'blocked' || entry.tool === 'deploy_backend') {
      await this.sendSecurityAlert(entry);
    }
  }

  /**
   * Send security alert (Slack, email, etc.)
   */
  private async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // TODO: Implement Slack/Discord/Email notifications
    logger.warn('🚨 Security Alert', {
      tool: entry.tool,
      action: entry.action,
      userId: entry.userId,
      result: entry.result,
    });

    // Example Slack integration:
    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     text: `🚨 Zero Tool Alert: ${entry.userId} used ${entry.tool} - ${entry.result}`,
    //     attachments: [{
    //       color: entry.result === 'blocked' ? 'danger' : 'warning',
    //       fields: [
    //         { title: 'Tool', value: entry.tool, short: true },
    //         { title: 'Result', value: entry.result, short: true },
    //         { title: 'Timestamp', value: entry.timestamp.toISOString() }
    //       ]
    //     }]
    //   })
    // });
  }

  /**
   * Get audit log
   */
  getAuditLog(filters?: {
    userId?: string;
    tool?: string;
    result?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLogEntry[] {
    let filtered = [...this.auditLog];

    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter((e) => e.userId === filters.userId);
      }
      if (filters.tool) {
        filtered = filtered.filter((e) => e.tool === filters.tool);
      }
      if (filters.result) {
        filtered = filtered.filter((e) => e.result === filters.result);
      }
      if (filters.startDate) {
        filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);
      }
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalActions: number;
    blocked: number;
    errors: number;
    success: number;
    byTool: Record<string, number>;
    byUser: Record<string, number>;
    recentBlocked: AuditLogEntry[];
  } {
    const stats = {
      totalActions: this.auditLog.length,
      blocked: 0,
      errors: 0,
      success: 0,
      byTool: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      recentBlocked: [] as AuditLogEntry[],
    };

    for (const entry of this.auditLog) {
      // Count by result
      if (entry.result === 'blocked') stats.blocked++;
      else if (entry.result === 'error') stats.errors++;
      else if (entry.result === 'success') stats.success++;

      // Count by tool
      stats.byTool[entry.tool] = (stats.byTool[entry.tool] || 0) + 1;

      // Count by user
      stats.byUser[entry.userId] = (stats.byUser[entry.userId] || 0) + 1;

      // Collect recent blocked
      if (entry.result === 'blocked') {
        stats.recentBlocked.push(entry);
      }
    }

    // Keep only 10 most recent blocked
    stats.recentBlocked = stats.recentBlocked.slice(-10).reverse();

    return stats;
  }

  /**
   * Create approval token for production deployment
   */
  async createApprovalToken(
    userId: string,
    environment: Environment,
    expiresIn: number = 3600
  ): Promise<string> {
    // TODO: Implement JWT or database-based token system
    // For now, return a simple token
    const token = `approval_${environment}_${userId}_${Date.now()}`;

    logger.info('Approval token created', {
      userId,
      environment,
      token,
      expiresIn,
    });

    return token;
  }

  /**
   * Clear old audit logs (cleanup)
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const beforeCount = this.auditLog.length;
    this.auditLog = this.auditLog.filter((entry) => entry.timestamp >= cutoffDate);
    const removed = beforeCount - this.auditLog.length;

    logger.info(`Cleared ${removed} audit log entries older than ${daysToKeep} days`);

    return removed;
  }
}

// Export singleton instance
export const zeroToolsSecurity = ZeroToolsSecurity.getInstance();
