/**
 * Audit Middleware for Express
 * 
 * Automatically logs requests for audit trail
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/unified-logger.js';
import { auditTrail, AuditEventType } from '../services/audit-trail.js';
import { featureFlags, FeatureFlag } from '../services/feature-flags.js';

/**
 * Audit middleware for critical endpoints
 */
export function auditMiddleware(
  eventType: AuditEventType,
  options: {
    logSuccess?: boolean;
    logFailure?: boolean;
    includeBody?: boolean;
  } = {}
) {
  const {
    logSuccess = true,
    logFailure = true,
    includeBody = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if audit trail is enabled
    if (!featureFlags.isEnabled(FeatureFlag.ENABLE_AUDIT_TRAIL)) {
      return next();
    }

    // Capture response
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function (body: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Determine result
      const result = statusCode >= 200 && statusCode < 300
        ? 'success'
        : statusCode >= 400 && statusCode < 500
        ? 'failure'
        : 'error';

      // Log based on options
      if ((result === 'success' && logSuccess) || (result !== 'success' && logFailure)) {
        const metadata: any = {
          statusCode,
          duration,
        };

        if (includeBody && req.body && typeof req.body === 'object') {
          // Don't log sensitive data
          const safeBody = { ...req.body };
          if (safeBody.password) safeBody.password = '[REDACTED]';
          if (safeBody.token) safeBody.token = '[REDACTED]';
          if (safeBody.apiKey) safeBody.apiKey = '[REDACTED]';
          metadata.requestBody = safeBody;
        }

        auditTrail.logRequest(req, eventType, result, metadata).catch((err) => {
          // Don't break the request if audit fails
          logger.error('Audit logging failed:', err);
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Audit middleware for authentication events
 */
export const auditAuth = auditMiddleware(AuditEventType.AUTH_LOGIN, {
  logSuccess: true,
  logFailure: true,
});

/**
 * Audit middleware for data access
 */
export const auditDataAccess = auditMiddleware(AuditEventType.DATA_READ, {
  logSuccess: true,
  logFailure: true,
});

/**
 * Audit middleware for data modifications
 */
export const auditDataModification = auditMiddleware(AuditEventType.DATA_WRITE, {
  logSuccess: true,
  logFailure: true,
  includeBody: true,
});

/**
 * Audit middleware for admin actions
 */
export const auditAdmin = auditMiddleware(AuditEventType.ADMIN_ACTION, {
  logSuccess: true,
  logFailure: true,
  includeBody: true,
});


