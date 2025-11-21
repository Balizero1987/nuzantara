# ZANTARA Unified Logging System Standards Guide

## Overview

This guide defines the logging standards and best practices for the ZANTARA v3 Ω codebase. Following these standards ensures consistent, searchable, and performant logging across all modules.

## Architecture

### Core Components

1. **Unified Logger** (`src/logging/unified-logger.ts`)
   - Single logger interface across all modules
   - Structured logging with consistent schema
   - Multiple output transports (console, file, Grafana Loki)

2. **Correlation Middleware** (`src/logging/correlation-middleware.ts`)
   - Request correlation tracking
   - Automatic context extraction
   - Request timing and lifecycle logging

3. **Performance Logger** (`src/logging/performance-logger.ts`)
   - Performance monitoring with minimal overhead
   - Automatic threshold-based alerting
   - Memory and operation tracking

## Log Levels

### Hierarchy (highest to lowest priority)
- **ERROR** (0): System errors, exceptions, failures
- **WARN** (1): Warning conditions, potential issues
- **INFO** (2): Important business events, state changes
- **HTTP** (3): HTTP request/response logging
- **DEBUG** (4): Detailed debugging information
- **TRACE** (5): Fine-grained tracing information

### Usage Guidelines

```typescript
// ERROR: System failures that require attention
logger.error('Database connection failed', error, {
  correlationId,
  database: 'postgresql'
});

// WARN: Potential issues that don't stop execution
logger.warn('Rate limit approaching', {
  userId,
  currentRate: 95,
  limit: 100
});

// INFO: Important business events
logger.info('User registration completed', {
  userId,
  email,
  registrationSource
});

// HTTP: Request/response logging (handled by middleware)
logger.http('GET /api/users', { correlationId, userId });

// DEBUG: Detailed troubleshooting information
logger.debug('Cache lookup performed', {
  key,
  hit: true,
  duration: 2
});

// TRACE: Very detailed execution flow
logger.trace('Entering function', {
  function: 'calculateTax',
  parameters
});
```

## Structured Logging Schema

### Standard Log Entry Structure

```typescript
{
  level: LogLevel,
  message: string,
  timestamp: string,
  context: {
    correlationId: string,    // Always included when available
    userId?: string,          // User identifier
    requestId?: string,       // Request identifier
    sessionId?: string,       // Session identifier
    service: string,          // Service name
    handler?: string,         // Handler/function name
    method?: string,          // HTTP method
    url?: string,            // Request URL
    userAgent?: string,       // Client user agent
    ip?: string,             // Client IP
    duration?: number,       // Operation duration in ms
    errorCode?: string,      // Error code
    type: string             // Log entry type
  },
  metrics?: {
    timestamp: number,
    memoryUsage: NodeJS.MemoryUsage,
    cpuUsage?: NodeJS.CpuUsage
  },
  error?: {
    name: string,
    message: string,
    stack?: string,
    code?: string
  },
  service: string,
  version: string,
  environment: string
}
```

### Required Fields
- **level**: Log level (ERROR, WARN, INFO, HTTP, DEBUG, TRACE)
- **message**: Human-readable message
- **timestamp**: ISO 8601 timestamp
- **service**: Service name
- **type**: Log entry category for filtering

### Recommended Fields
- **correlationId**: For request tracing
- **userId**: For user-specific operations
- **duration**: For performance tracking
- **errorCode**: For error categorization

## Log Entry Types

Use standardized types for consistent filtering:

```typescript
// Request/Response
type = 'request_start' | 'request_end' | 'response_error'

// Performance
type = 'performance_start' | 'performance_end' | 'performance_slow' | 'performance_normal'

// Business Events
type = 'business_event' | 'user_action' | 'state_change'

// Security
type = 'security_event' | 'authentication' | 'authorization' | 'suspicious_activity'

// Database
type = 'database_query' | 'database_slow' | 'database_error' | 'database_connection'

// External Services
type = 'api_call' | 'api_error' | 'cache_operation' | 'cache_miss'

// System
type = 'system_startup' | 'system_shutdown' | 'configuration_change' | 'health_check'
```

## Context Standards

### Correlation Context
Always include correlation context when available:

```typescript
const context = {
  correlationId: req.correlationId,
  requestId: req.requestId,
  userId: req.user?.id,
  sessionId: req.sessionId,
  service: 'nuzantara-backend',
  handler: 'zantara-unified',
  method: req.method,
  url: req.url
};
```

### Business Context
Include relevant business information:

```typescript
const businessContext = {
  businessType: 'restaurant',
  location: 'bali',
  ownership: 'foreign',
  operation: 'kbli_lookup',
  kblis: ['56101', '56102']
};
```

### Performance Context
Include performance metrics:

```typescript
const performanceContext = {
  duration: 1250,
  memoryUsage: process.memoryUsage(),
  operation: 'vector_search',
  resultCount: 15,
  cacheHit: false
};
```

## Performance Guidelines

### Minimize Performance Impact

1. **Use appropriate log levels**
   - Production: INFO and above
   - Development: DEBUG and TRACE available
   - Avoid DEBUG/TRACE in hot paths

2. **Lazy evaluation**
   ```typescript
   // Bad: Always performs string concatenation
   logger.debug(`User ${user.id} performed ${action} on ${resource.id}`);

   // Good: Use contextual logging
   logger.debug('User action performed', { userId: user.id, action, resourceId: resource.id });
   ```

3. **Batch operations**
   ```typescript
   // For multiple operations, consider batch logging
   const results = await Promise.all(operations);
   logger.info('Batch operation completed', {
     operationCount: operations.length,
     successCount: results.filter(r => r.success).length
   });
   ```

### Performance Thresholds

- **FAST**: < 100ms (debug level)
- **NORMAL**: < 500ms (debug level)
- **SLOW**: < 1000ms (warn level)
- **VERY_SLOW**: < 5000ms (error level)
- **CRITICAL**: ≥ 5000ms (error level)

## Integration Patterns

### Express.js Application

```typescript
import correlationMiddleware from './logging/correlation-middleware.js';
import { performanceMiddleware } from './logging/performance-logger.js';

// Apply middleware
app.use(correlationMiddleware());
app.use(performanceMiddleware());

// In handlers
export async function zantaraUnifiedQuery(req: CorrelatedRequest, res: Response) {
  const logger = createRequestLogger(req);

  logger.info('Processing unified query', {
    domain: req.body.domain,
    query: req.body.query
  });

  // Your handler logic...

  logger.info('Query processed successfully', {
    resultCount: results.length,
    duration: Date.now() - req.startTime
  });
}
```

### Database Operations

```typescript
import { trackDatabaseQuery } from './logging/performance-logger.js';

export async function findUser(id: string, context: LogContext) {
  const startTime = Date.now();

  try {
    const user = await database.users.findById(id);
    const duration = Date.now() - startTime;

    trackDatabaseQuery(`findById:users`, context, duration);

    logger.info('User found', {
      ...context,
      userId: id,
      found: !!user
    });

    return user;
  } catch (error) {
    const duration = Date.now() - startTime;

    trackDatabaseQuery(`findById:users`, context, duration);

    logger.error('User lookup failed', error, {
      ...context,
      userId: id
    });

    throw error;
  }
}
```

### External API Calls

```typescript
import { withPerformanceTracking } from './logging/performance-logger.js';

export async function callExternalAPI(endpoint: string, data: any, context: LogContext) {
  return withPerformanceTracking(
    `external_api_${endpoint}`,
    context,
    async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return response.json();
    },
    { endpoint, dataSize: JSON.stringify(data).length }
  );
}
```

## Error Logging Standards

### Structured Error Logging

```typescript
// Always include error object and context
logger.error('Operation failed', error, {
  correlationId,
  operation: 'kbli_lookup',
  userId,
  businessType,
  errorCode: 'KBLI_LOOKUP_FAILED',
  recoverable: true
});
```

### Error Categories

Use standard error codes for consistency:

```typescript
const ERROR_CODES = {
  // Database
  DATABASE_CONNECTION_FAILED: 'DB_CONN_FAILED',
  DATABASE_QUERY_FAILED: 'DB_QUERY_FAILED',
  DATABASE_TIMEOUT: 'DB_TIMEOUT',

  // Authentication/Authorization
  AUTHENTICATION_FAILED: 'AUTH_FAILED',
  AUTHORIZATION_DENIED: 'AUTH_DENIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Business Logic
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // External Services
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_API_TIMEOUT: 'EXTERNAL_API_TIMEOUT',

  // System
  MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};
```

## Migration Guidelines

### From console.log

```typescript
// Before
console.log('User logged in:', user.email);
console.error('Database error:', error.message);

// After
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  type: 'user_action',
  action: 'login'
});

logger.error('Database operation failed', error, {
  operation: 'user_login',
  userId: user.id,
  errorCode: 'DB_LOGIN_FAILED'
});
```

### From existing logger

```typescript
// Before
logger.info(`Processing request for ${businessType}`);
logger.error('Failed to process', error);

// After
logger.info('Processing business request', {
  businessType,
  operation: 'business_analysis',
  type: 'business_event'
});

logger.error('Business processing failed', error, {
  businessType,
  operation: 'business_analysis',
  errorCode: 'BUSINESS_PROCESSING_FAILED'
});
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Error Rate**: ERROR level logs per minute
2. **Response Time**: Duration from performance logs
3. **Throughput**: HTTP logs per minute
4. **Memory Usage**: From performance metrics
5. **External Service Health**: API call success rates

### Alert Thresholds

- **Error Rate**: > 5% of total logs
- **Average Response Time**: > 2 seconds
- **Memory Usage**: > 80% of available memory
- **Failed API Calls**: > 10% failure rate

## Security Considerations

### Sensitive Data Handling

```typescript
// Sanitize sensitive information
const sanitizedContext = {
  userId: user.id,
  email: user.email, // OK in internal logs
  password: '[REDACTED]', // Never log passwords
  apiKey: '[REDACTED]', // Never log API keys
  creditCard: '[REDACTED]' // Never log payment info
};
```

### Security Event Logging

```typescript
// Log security events with appropriate severity
logger.logSecurityEvent('Multiple failed login attempts', 'high', {
  userId: user.id,
  ip: req.ip,
  attempts: 5,
  timeframe: '5 minutes'
});

logger.logSecurityEvent('Suspicious API access pattern', 'medium', {
  userId: user.id,
  pattern: 'rapid_requests',
  requestsPerMinute: 120,
  threshold: 60
});
```

## Testing

### Unit Testing Log Messages

```typescript
import { logger } from '../src/logging/unified-logger.js';

// Mock logger for testing
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

jest.mock('../src/logging/unified-logger.js', () => ({
  logger: mockLogger
}));

// Test logging behavior
test('should log user registration', () => {
  registerUser(userData);

  expect(mockLogger.info).toHaveBeenCalledWith(
    'User registration completed',
    expect.objectContaining({
      userId: expect.any(String),
      email: expect.any(String),
      type: 'business_event'
    })
  );
});
```

## Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL=info                    # Minimum log level
ENABLE_METRICS=true              # Enable performance metrics
GRAFANA_LOKI_URL=https://logs.example.com
GRAFANA_LOKI_USER=nuzantara
GRAFANA_API_KEY=your-api-key

# Service Information
SERVICE_NAME=nuzantara-backend
SERVICE_VERSION=3.0.0
NODE_ENV=production
```

### Configuration Override

```typescript
import { logger, LogLevel } from './logging/unified-logger.js';

// Dynamic configuration
if (process.env.DEBUG_MODE === 'true') {
  logger.setLevel(LogLevel.DEBUG);
}

// Feature-specific logging
const featureLogger = logger.child({
  feature: 'advanced-analytics',
  version: '2.1.0'
});
```

## Best Practices Summary

1. **Always use structured logging** with context objects
2. **Include correlation IDs** for request tracing
3. **Use appropriate log levels** based on severity
4. **Add performance tracking** for significant operations
5. **Never log sensitive data** (passwords, tokens, PII)
6. **Use standard error codes** for consistency
7. **Log security events** with appropriate severity
8. **Test logging behavior** in unit tests
9. **Monitor key metrics** and set up alerts
10. **Keep log messages concise** but informative

Following these standards ensures that ZANTARA's logging system provides valuable insights for debugging, monitoring, and business intelligence while maintaining optimal performance.