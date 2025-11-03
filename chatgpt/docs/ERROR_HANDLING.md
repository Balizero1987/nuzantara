# Unified Error Handling System

A comprehensive error handling solution for Express.js applications with centralized error processing, consistent responses, error classification, and enhanced logging.

## Features

- ✅ **Centralized Error Processing** - Single point of error handling with consistent formatting
- ✅ **Error Classification** - 11 predefined error categories with automatic HTTP status mapping
- ✅ **Severity Levels** - 4 severity levels (LOW, MEDIUM, HIGH, CRITICAL) for prioritization
- ✅ **Enhanced Logging** - Structured logging with context enrichment
- ✅ **Metrics Collection** - Real-time error rate tracking and performance monitoring
- ✅ **Request Context** - Automatic request ID generation and context injection
- ✅ **Async Support** - Built-in async error wrapper for route handlers
- ✅ **Type Safety** - Full TypeScript support with strict typing
- ✅ **Extensible** - Easy to customize with custom loggers and metrics collectors

## Table of Contents

- [Quick Start](#quick-start)
- [Error Types](#error-types)
- [Middleware Setup](#middleware-setup)
- [Usage Examples](#usage-examples)
- [Error Metrics](#error-metrics)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)

## Quick Start

### 1. Setup Error Handling Middleware

```typescript
import express from 'express';
import { setupErrorHandling } from './errors/middleware.js';

const app = express();

// Body parsers
app.use(express.json());

// Setup error handling (early in middleware chain)
const { requestContext, timeout, notFound, errorHandler } = setupErrorHandling({
  requestTimeout: 30000, // 30 seconds
  maxErrorsPerMinute: 10, // Rate limit
});

// Apply request context middleware
app.use(requestContext);
app.use(timeout);

// ... Your routes here ...

// Apply error middleware (must be last)
app.use(notFound);
app.use(errorHandler);

app.listen(3000);
```

### 2. Use in Route Handlers

```typescript
import { asyncHandler } from './errors/middleware.js';
import { NotFoundError, ValidationError } from './errors/types.js';

// Automatic async error catching
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json(user);
}));

// Validation errors
app.post('/users', asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  
  if (!email || !name) {
    throw new ValidationError('Missing required fields', undefined, {
      fields: ['email', 'name'],
    });
  }
  
  const user = await createUser({ email, name });
  res.status(201).json(user);
}));
```

## Error Types

### Available Error Classes

All error classes automatically set appropriate HTTP status codes and severity levels:

```typescript
import {
  ValidationError,        // 400 - LOW severity
  AuthenticationError,    // 401 - MEDIUM severity
  AuthorizationError,     // 403 - MEDIUM severity
  NotFoundError,          // 404 - LOW severity
  ConflictError,          // 409 - LOW severity
  RateLimitError,         // 429 - MEDIUM severity
  ApplicationError,       // 500 - CRITICAL severity (base class)
  ExternalServiceError,   // 502 - HIGH severity
  DatabaseError,          // 503 - CRITICAL severity
  TimeoutError,           // 504 - HIGH severity
  NetworkError,           // 503 - HIGH severity
} from './errors/types.js';
```

### Creating Custom Errors

```typescript
import { ApplicationError, ErrorCategory } from './errors/types.js';

// Using base class with custom category
throw new ApplicationError(
  'Custom business logic error',
  ErrorCategory.INTERNAL,
  {
    code: 'CUSTOM_ERROR',
    context: {
      userId: req.userId,
      requestId: req.id,
      timestamp: new Date(),
    },
  }
);

// Using specialized error classes
throw new ValidationError('Invalid email format', undefined, {
  field: 'email',
  value: email,
  expected: 'valid email address',
});

throw new NotFoundError('Product');

throw new ExternalServiceError('PaymentGateway', 'Connection timeout');

throw new DatabaseError('Connection pool exhausted', undefined, originalError);
```

## Middleware Setup

### Individual Middleware Components

```typescript
import {
  errorHandlerMiddleware,
  asyncHandler,
  requestContextMiddleware,
  notFoundHandler,
  requestTimeoutMiddleware,
  errorRateLimitMiddleware,
} from './errors/middleware.js';

// Request context (generates unique IDs)
app.use(requestContextMiddleware());

// Request timeout protection
app.use(requestTimeoutMiddleware(15000)); // 15 seconds

// ... Your routes ...

// 404 handler for unmatched routes
app.use(notFoundHandler());

// Error rate limiting
app.use(errorRateLimitMiddleware(5)); // Max 5 errors/min per IP

// Global error handler
app.use(errorHandlerMiddleware());
```

### Custom Error Handler Configuration

```typescript
import { UnifiedErrorHandler } from './errors/unified-error-handler.js';
import { errorHandlerMiddleware } from './errors/middleware.js';

const customHandler = new UnifiedErrorHandler({
  includeStackTrace: process.env.NODE_ENV !== 'production',
  enableLogging: true,
  enableMetrics: true,
  logger: (error, context) => {
    // Custom logger integration (e.g., Winston, Pino)
    logger.error({
      message: error.message,
      category: error.category,
      context,
    });
  },
  metricsCollector: (error, context, duration) => {
    // Custom metrics integration (e.g., Prometheus, DataDog)
    metrics.recordError({
      category: error.category,
      severity: error.severity,
      duration,
    });
  },
});

app.use(errorHandlerMiddleware(customHandler));
```

## Usage Examples

### Database Operations

```typescript
app.get('/products/:id', asyncHandler(async (req, res) => {
  try {
    const product = await db.products.findById(req.params.id);
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    res.json(product);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new DatabaseError('Database connection failed', undefined, error);
    }
    throw error;
  }
}));
```

### External API Calls

```typescript
app.post('/payment', asyncHandler(async (req, res) => {
  try {
    const payment = await paymentGateway.charge(req.body);
    res.json(payment);
  } catch (error) {
    throw new ExternalServiceError(
      'PaymentGateway',
      'Payment processing failed',
      {
        additionalData: {
          amount: req.body.amount,
          currency: req.body.currency,
        },
      },
      error
    );
  }
}));
```

### Authentication & Authorization

```typescript
// Authentication middleware
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new AuthenticationError('Missing authentication token');
  }
  
  const user = await verifyToken(token);
  if (!user) {
    throw new AuthenticationError('Invalid or expired token');
  }
  
  req.userId = user.id;
  next();
});

// Authorization middleware
const requireAdmin = asyncHandler(async (req, res, next) => {
  const user = await getUserById(req.userId);
  
  if (!user.isAdmin) {
    throw new AuthorizationError('Admin access required');
  }
  
  next();
});
```

### Rate Limiting

```typescript
const rateLimiter = new Map<string, number[]>();

const checkRateLimit = (ip: string, maxRequests: number, windowMs: number) => {
  const now = Date.now();
  const timestamps = rateLimiter.get(ip) || [];
  
  const recentRequests = timestamps.filter(ts => now - ts < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    throw new RateLimitError(`Rate limit exceeded: ${maxRequests} requests per ${windowMs}ms`);
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
};
```

## Error Metrics

### Accessing Metrics

```typescript
import { getDefaultErrorHandler } from './errors/unified-error-handler.js';

// Get error handler instance
const errorHandler = getDefaultErrorHandler();

// Get comprehensive metrics
const metrics = errorHandler.getMetrics();

console.log({
  totalErrors: metrics.totalErrors,
  errorsByCategory: metrics.errorsByCategory,
  errorsBySeverity: metrics.errorsBySeverity,
  criticalErrors: metrics.criticalErrors,
  operationalErrors: metrics.operationalErrors,
  averageResponseTime: metrics.averageResponseTime,
  lastError: metrics.lastError,
});

// Get error rate for specific category
const validationErrorRate = errorHandler.getErrorRate('validation', 5); // Last 5 minutes
console.log(`Validation errors per minute: ${validationErrorRate}`);
```

### Metrics Endpoint

```typescript
app.get('/metrics/errors', (req, res) => {
  const errorHandler = getDefaultErrorHandler();
  const metrics = errorHandler.getMetrics();
  
  res.json({
    timestamp: new Date().toISOString(),
    metrics: {
      total: metrics.totalErrors,
      byCategory: metrics.errorsByCategory,
      bySeverity: metrics.errorsBySeverity,
      critical: metrics.criticalErrors,
      operational: metrics.operationalErrors,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      lastError: metrics.lastError,
    },
  });
});
```

## Migration Guide

### From Express Default Error Handler

**Before:**
```typescript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

**After:**
```typescript
import { errorHandlerMiddleware } from './errors/middleware.js';

app.use(errorHandlerMiddleware());
```

### From Custom Error Classes

**Before:**
```typescript
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

throw new NotFoundError('User not found');
```

**After:**
```typescript
import { NotFoundError } from './errors/types.js';

throw new NotFoundError('User'); // Automatically formatted: "Resource not found: User"
```

### From Manual Try-Catch

**Before:**
```typescript
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

**After:**
```typescript
import { asyncHandler } from './errors/middleware.js';

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);
}));
```

## Best Practices

### 1. Use Appropriate Error Types

```typescript
// ✅ Good
throw new ValidationError('Invalid email format');
throw new NotFoundError('User');
throw new DatabaseError('Connection failed');

// ❌ Avoid
throw new Error('Something went wrong');
throw new ApplicationError('Error', ErrorCategory.INTERNAL);
```

### 2. Include Context

```typescript
// ✅ Good - includes helpful context
throw new ValidationError('Invalid input', undefined, {
  fields: ['email', 'password'],
  received: req.body,
});

// ❌ Avoid - missing context
throw new ValidationError('Invalid input');
```

### 3. Preserve Error Causes

```typescript
// ✅ Good - preserves original error
try {
  await externalAPI.call();
} catch (error) {
  throw new ExternalServiceError('API', 'Call failed', undefined, error);
}

// ❌ Avoid - loses original error information
try {
  await externalAPI.call();
} catch (error) {
  throw new ExternalServiceError('API', 'Call failed');
}
```

### 4. Use asyncHandler for Async Routes

```typescript
// ✅ Good - automatic error catching
app.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));

// ❌ Avoid - manual try-catch everywhere
app.get('/data', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
```

### 5. Monitor Critical Errors

```typescript
// Setup monitoring for critical errors
const handler = new UnifiedErrorHandler({
  metricsCollector: (error, context, duration) => {
    if (isCriticalError(error)) {
      // Alert on-call team
      alerting.sendCritical({
        error: error.message,
        category: error.category,
        context,
      });
    }
  },
});
```

### 6. Environment-Specific Configuration

```typescript
const handler = new UnifiedErrorHandler({
  // Show stack traces only in development
  includeStackTrace: process.env.NODE_ENV !== 'production',
  
  // Enable detailed logging
  enableLogging: true,
  
  // Collect metrics
  enableMetrics: true,
  
  // Use production logger in production
  logger: process.env.NODE_ENV === 'production'
    ? productionLogger
    : developmentLogger,
});
```

## API Reference

### Error Types

#### `ApplicationError`
Base error class for all application errors.

```typescript
new ApplicationError(
  message: string,
  category: ErrorCategory,
  options?: {
    code?: string;
    severity?: ErrorSeverity;
    statusCode?: number;
    context?: ErrorContext;
    isOperational?: boolean;
    cause?: Error;
  }
)
```

#### Specialized Errors

All specialized errors extend `ApplicationError` with predefined categories and status codes:

- `ValidationError(message, context?, details?)` - 400
- `AuthenticationError(message?, context?)` - 401
- `AuthorizationError(message?, context?)` - 403
- `NotFoundError(resource, context?)` - 404
- `ConflictError(message, context?)` - 409
- `RateLimitError(message?, context?)` - 429
- `ExternalServiceError(service, message, context?, cause?)` - 502
- `DatabaseError(message, context?, cause?)` - 503
- `TimeoutError(operation, timeoutMs, context?)` - 504
- `NetworkError(message, context?, cause?)` - 503

### Middleware

#### `errorHandlerMiddleware(handler?)`
Global error handling middleware.

#### `asyncHandler(fn)`
Wraps async route handlers to catch errors automatically.

#### `requestContextMiddleware()`
Adds request ID and timing to requests.

#### `notFoundHandler()`
Handles 404 errors for unmatched routes.

#### `requestTimeoutMiddleware(timeoutMs?)`
Terminates requests exceeding timeout (default: 30000ms).

#### `errorRateLimitMiddleware(maxErrorsPerMinute?)`
Rate limits error responses per IP (default: 10/min).

#### `setupErrorHandling(options?)`
Convenience function to setup all middleware.

### UnifiedErrorHandler

#### `processError(error, req?): ErrorResponse`
Process an error and return standardized response.

#### `getMetrics(): ErrorMetrics`
Get current error metrics.

#### `getErrorRate(category, windowMinutes?): number`
Get error rate for a specific category.

#### `resetMetrics(): void`
Reset all metrics (useful for testing).

### Type Guards

#### `isApplicationError(error): boolean`
Check if error is an ApplicationError instance.

#### `isOperationalError(error): boolean`
Check if error is operational (expected).

#### `isCriticalError(error): boolean`
Check if error has CRITICAL severity.

## Testing

Run the error handling tests:

```bash
npm test -- errors
```

All 40 tests should pass:
- 19 tests for error types and classification
- 21 tests for error handler logic and metrics

---

**Built with ❤️ for Zantara Project**
