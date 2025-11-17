/**
 * Security Audit Handlers
 * API endpoints for Zero Tools security monitoring and audit logs
 */

import { zeroToolsSecurity } from '../../services/zero-tools-security.js';

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(params: {
  userId?: string;
  tool?: string;
  result?: 'success' | 'error' | 'blocked';
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const filters: any = { ...params };

  // Convert date strings to Date objects
  if (params.startDate) {
    filters.startDate = new Date(params.startDate);
  }
  if (params.endDate) {
    filters.endDate = new Date(params.endDate);
  }

  const logs = zeroToolsSecurity.getAuditLog(filters);

  return {
    ok: true,
    logs,
    count: logs.length,
    filters: params,
  };
}

/**
 * Get security statistics
 */
export async function getSecurityStats() {
  const stats = zeroToolsSecurity.getSecurityStats();

  return {
    ok: true,
    stats,
    summary: {
      totalActions: stats.totalActions,
      successRate:
        stats.totalActions > 0
          ? Math.round((stats.success / stats.totalActions) * 100)
          : 0,
      blockedActions: stats.blocked,
      errorActions: stats.errors,
    },
  };
}

/**
 * Request deployment approval (for production)
 */
export async function requestDeploymentApproval(params: {
  userId: string;
  environment: 'dev' | 'staging' | 'production';
  reason?: string;
}) {
  const { userId, environment, reason } = params;

  // Create approval token (expires in 1 hour)
  const token = await zeroToolsSecurity.createApprovalToken(userId, environment as any, 3600);

  // Log the request
  await zeroToolsSecurity.logAudit({
    timestamp: new Date(),
    userId,
    tool: 'deployment_approval',
    action: `request_approval_${environment}`,
    params: { environment, reason },
    result: 'success',
  });

  return {
    ok: true,
    approvalToken: token,
    expiresIn: 3600,
    environment,
    message: `Approval token generated for ${environment} deployment`,
    instructions:
      'Use this token in your deployment request within 1 hour. Token format: -t <token>',
  };
}

/**
 * Get protected files list
 */
export async function getProtectedFiles() {
  return {
    ok: true,
    protectedFiles: [
      '.env',
      '.env.production',
      '.env.local',
      'service-account.json',
      'credentials.json',
      'secrets.yaml',
      'firebase-adminsdk.json',
      '.npmrc',
      '.git/config',
    ],
    protectedPaths: ['/etc', '/root', '/sys', '/proc', '~/.ssh'],
    note: 'These files and paths cannot be accessed via Zero Tools for security',
  };
}

/**
 * Get blocked commands list
 */
export async function getBlockedCommands() {
  return {
    ok: true,
    blockedCommands: [
      'rm -rf',
      'rm -fr',
      'sudo',
      'chmod 777',
      '> /dev/sda',
      'dd if=',
      'mkfs',
      'kill -9',
      'killall',
      'reboot',
      'shutdown',
    ],
    note: 'These commands are blocked to prevent system damage',
  };
}

/**
 * Clean old audit logs
 */
export async function cleanOldLogs(params: { daysToKeep?: number }) {
  const daysToKeep = params.daysToKeep || 30;

  const removed = await zeroToolsSecurity.clearOldLogs(daysToKeep);

  return {
    ok: true,
    removed,
    daysToKeep,
    message: `Cleared ${removed} audit log entries older than ${daysToKeep} days`,
  };
}

/**
 * Export handlers
 */
export const securityAuditHandlers = {
  'security.audit.logs': getAuditLogs,
  'security.audit.stats': getSecurityStats,
  'security.deployment.request-approval': requestDeploymentApproval,
  'security.protected-files': getProtectedFiles,
  'security.blocked-commands': getBlockedCommands,
  'security.audit.clean': cleanOldLogs,
};
