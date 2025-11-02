/**
 * ZANTARA Unified Logging System - Integration Example
 *
 * This file demonstrates how to integrate the unified logging system
 * into existing ZANTARA handlers and middleware.
 */

import express from 'express';
import {
  logger,
  correlationMiddleware,
  performanceMiddleware,
  withPerformanceTracking,
  trackDatabaseQuery,
  trackApiCall,
  LogContext
} from './index.js';

// Initialize Express app
const app = express();

// Apply logging middleware
app.use(express.json());
app.use(correlationMiddleware());
app.use(performanceMiddleware());

// Example: Enhanced handler with structured logging
export async function zantaraUnifiedQueryEnhanced(req: any, res: any) {
  // Extract correlation context
  const context: LogContext = {
    correlationId: req.correlationId,
    userId: req.user?.id,
    handler: 'zantara-unified-enhanced',
    domain: req.body?.domain || 'all',
    query: req.body?.query
  };

  // Log request start
  logger.info('Processing unified query request', {
    ...context,
    type: 'request_processing',
    bodySize: JSON.stringify(req.body).length
  });

  try {
    // Business logic with performance tracking
    const result = await withPerformanceTracking(
      'unified_query_execution',
      context,
      async () => {
        // Simulate database query with tracking
        const dbStartTime = Date.now();

        // Your existing business logic here
        const mockResult = {
          query: req.body?.query,
          domain: req.body?.domain,
          results: { data: 'sample data' },
          processing_time: '< 2s'
        };

        const dbDuration = Date.now() - dbStartTime;
        trackDatabaseQuery('unified_query_lookup', context, dbDuration);

        return mockResult;
      },
      {
        domain: req.body?.domain,
        queryLength: req.body?.query?.length || 0,
        operation: 'knowledge_base_search'
      }
    );

    // Log successful response
    logger.info('Unified query completed successfully', {
      ...context,
      type: 'request_success',
      resultCount: Object.keys(result.results || {}).length,
      totalDuration: Date.now() - req.startTime
    });

    res.json({ success: true, data: result });

  } catch (error) {
    // Enhanced error logging
    logger.error('Unified query failed', error as Error, {
      ...context,
      type: 'request_error',
      errorCode: 'UNIFIED_QUERY_FAILED',
      recoverable: true,
      duration: Date.now() - req.startTime
    });

    res.status(500).json({
      success: false,
      error: 'Query processing failed',
      correlationId: req.correlationId
    });
  }
}

// Example: API call with tracking
export async function callExternalServiceWithLogging(
  service: string,
  endpoint: string,
  data: any,
  context: LogContext
) {
  return withPerformanceTracking(
    `external_api_${service}`,
    context,
    async () => {
      const startTime = Date.now();

      try {
        // Make API call
        const response = await fetch(`https://${service}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const duration = Date.now() - startTime;

        // Track the API call
        trackApiCall(service, endpoint, context, duration, response.ok);

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return response.json();

      } catch (error) {
        const duration = Date.now() - startTime;

        // Track failed API call
        trackApiCall(service, endpoint, context, duration, false);

        // Log the error with context
        logger.error('External API call failed', error as Error, {
          ...context,
          type: 'api_error',
          service,
          endpoint,
          duration,
          errorCode: 'EXTERNAL_API_ERROR'
        });

        throw error;
      }
    },
    {
      service,
      endpoint,
      requestSize: JSON.stringify(data).length
    }
  );
}

// Example: Business event logging
export function logBusinessEvent(
  event: string,
  data: any,
  userId?: string,
  context?: LogContext
) {
  logger.info(`Business event: ${event}`, {
    ...context,
    type: 'business_event',
    event,
    data,
    userId,
    timestamp: new Date().toISOString()
  });
}

// Example: Security event logging
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context: LogContext,
  details?: any
) {
  logger.logSecurityEvent(event, severity, {
    ...context,
    type: 'security_event',
    details,
    timestamp: new Date().toISOString()
  });
}

// Example: Cache operation with logging
export async function getCachedDataWithLogging(
  key: string,
  fetcher: () => Promise<any>,
  context: LogContext
): Promise<any> {
  const startTime = Date.now();

  // Try to get from cache (simulated)
  const cachedData = null; // await cache.get(key);

  if (cachedData) {
    const duration = Date.now() - startTime;

    logger.debug('Cache hit', {
      ...context,
      type: 'cache_hit',
      key,
      duration
    });

    return cachedData;
  }

  // Cache miss - fetch data
  const data = await fetcher();
  const duration = Date.now() - startTime;

  // Store in cache (simulated)
  // await cache.set(key, data, { ttl: 3600 });

  logger.debug('Cache miss and fetch', {
    ...context,
    type: 'cache_miss',
    key,
    duration,
    dataSize: JSON.stringify(data).length
  });

  return data;
}

// Example route usage
app.post('/api/zantara/unified', zantaraUnifiedQueryEnhanced);

// Example middleware for authentication logging
export function authenticationMiddleware() {
  return (req: any, res: any, next: any) => {
    const context: LogContext = {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Log authentication attempt
    const token = req.headers.authorization;

    if (token) {
      logger.info('Authentication attempt', {
        ...context,
        type: 'authentication_attempt',
        hasToken: true,
        tokenLength: token.length
      });

      // Validate token (simulated)
      try {
        const user = { id: 'user123', email: 'user@example.com' }; // await validateToken(token);
        req.user = user;

        logger.info('Authentication successful', {
          ...context,
          type: 'authentication_success',
          userId: user.id
        });

        next();
      } catch (error) {
        logSecurityEvent('Authentication failed', 'medium', context, {
          reason: (error as Error).message
        });

        res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      logSecurityEvent('Missing authentication token', 'low', context);
      res.status(401).json({ error: 'Authentication required' });
    }
  };
}

// Example error handling middleware
export function errorLoggingMiddleware() {
  return (error: Error, req: any, res: any, next: any) => {
    const context: LogContext = {
      correlationId: req.correlationId,
      userId: req.user?.id,
      method: req.method,
      url: req.url,
      handler: 'error_handler'
    };

    logger.error('Unhandled error in request', error, {
      ...context,
      type: 'unhandled_error',
      errorCode: 'UNHANDLED_EXCEPTION',
      userAgent: req.get('User-Agent'),
      body: req.body
    });

    res.status(500).json({
      error: 'Internal server error',
      correlationId: req.correlationId
    });
  };
}

// Complete example usage
export function setupLoggingExample(app: express.Application) {
  // Apply middleware
  app.use(authenticationMiddleware());

  // Apply error handling last
  app.use(errorLoggingMiddleware());

  // Example of logging business events
  app.post('/api/users/register', async (req: any, res: any) => {
    const context: LogContext = {
      correlationId: req.correlationId,
      userId: req.user?.id,
      handler: 'user_registration'
    };

    try {
      const { email, name } = req.body;

      // Log registration attempt
      logBusinessEvent('user_registration_started', {
        email,
        name
      }, req.user?.id, context);

      // Simulate user creation
      const user = await withPerformanceTracking(
        'user_creation',
        context,
        async () => {
          // Your user creation logic here
          return { id: 'user123', email, name, createdAt: new Date() };
        }
      );

      // Log successful registration
      logBusinessEvent('user_registration_completed', {
        userId: user.id,
        email: user.email
      }, user.id, context);

      res.json({ success: true, user });

    } catch (error) {
      logger.error('User registration failed', error as Error, {
        ...context,
        type: 'registration_error',
        errorCode: 'USER_REGISTRATION_FAILED',
        email: req.body.email
      });

      res.status(400).json({ error: 'Registration failed' });
    }
  });
}

// Export the setup function
export default setupLoggingExample;