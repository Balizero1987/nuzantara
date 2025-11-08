# Bug Fix & Optimization Templates

Quick reference templates for rapid bug fixes, error handling patterns, and performance optimizations in the NUZANTARA-FLY codebase.

---

## 📋 Table of Contents

1. [Bug Fix Templates](#bug-fix-templates)
2. [Error Handling Patterns](#error-handling-patterns)
3. [Performance Optimization Templates](#performance-optimization-templates)

---

## 🐛 Bug Fix Templates

### Template 1: API Handler Error Fix

**Use Case:** Fixing errors in API route handlers with proper error context and logging.

```typescript
// apps/backend-ts/src/routes/api/your-route.ts
import { Request, Response } from 'express';
import logger from '../../services/logger.js';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../../utils/errors.js';
import { ok, err } from '../../utils/response.js';
import { ZodError } from 'zod';

export async function yourHandler(req: Request, res: Response) {
  try {
    // Extract request context
    const requestId = (req as any).requestId || `req_${Date.now()}`;
    
    // Input validation
    const { param1, param2 } = req.body;
    if (!param1) {
      throw new BadRequestError('param1 is required');
    }

    // Your business logic here
    const result = await someAsyncOperation(param1, param2);

    return res.status(200).json(ok(result));
    
  } catch (e: any) {
    // Enhanced error logging with context
    const requestId = (req as any).requestId || 'unknown';
    const errorContext = {
      requestId,
      endpoint: req.path,
      method: req.method,
      params: JSON.stringify(req.body).substring(0, 500),
      userAgent: req.get('user-agent'),
      ip: req.ip,
      apiKey: req.get('x-api-key')?.substring(0, 8) + '...' || 'none',
      timestamp: new Date().toISOString()
    };

    logger.error(`🔥 Handler Error [${requestId}] ${req.path}:`, {
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 5).join('\n'),
      ...errorContext
    });

    // Handle specific error types
    if (e instanceof ZodError) return res.status(400).json(err('INVALID_PAYLOAD'));
    if (e instanceof BadRequestError) return res.status(400).json(err(e.message));
    if (e instanceof UnauthorizedError) return res.status(401).json(err(e.message));
    if (e instanceof ForbiddenError) return res.status(403).json(err(e.message));

    // Log critical errors for investigation
    if (req.path.includes('ai.') || req.path.includes('memory.') || req.path.includes('identity.')) {
      logger.error(`🚨 Critical handler failure: ${req.path}`, {
        errorType: e.constructor.name,
        errorMessage: e.message,
        ...errorContext
      });
    }

    return res.status(500).json(err(e?.message || "Internal Error"));
  }
}
```

### Template 2: Database Query Error Fix

**Use Case:** Fixing database connection and query errors with circuit breaker pattern.

```typescript
// apps/backend-ts/src/services/your-db-service.ts
import { getDatabasePool } from './connection-pool.js';
import { dbCircuitBreaker } from './circuit-breaker.js';
import logger from './logger.js';
import { InternalServerError } from '../utils/errors.js';

export async function safeDatabaseQuery<T>(
  query: string,
  params: any[] = []
): Promise<T> {
  return dbCircuitBreaker.execute(
    async () => {
      const pool = getDatabasePool();
      const startTime = Date.now();
      
      try {
        const result = await pool.query(query, params);
        const duration = Date.now() - startTime;
        
        logger.debug(`Query executed in ${duration}ms: ${query.substring(0, 50)}...`);
        return result.rows as T;
        
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error(`Query failed after ${duration}ms: ${error.message}`, {
          query: query.substring(0, 100),
          errorCode: error.code,
          errorDetail: error.detail
        });
        throw new InternalServerError(`Database query failed: ${error.message}`);
      }
    },
    async () => {
      logger.warn('Database circuit breaker is OPEN, using fallback');
      throw new InternalServerError('Database service temporarily unavailable');
    }
  );
}
```

### Template 3: External API Call Error Fix

**Use Case:** Fixing external API calls with retry logic and circuit breaker.

```typescript
// apps/backend-ts/src/services/your-external-api.ts
import { externalApiCircuitBreaker } from './circuit-breaker.js';
import logger from './logger.js';
import { InternalServerError } from '../utils/errors.js';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
}

export async function callExternalAPIWithRetry<T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2
  } = options;

  return externalApiCircuitBreaker.execute(
    async () => {
      let lastError: Error | null = null;
      let currentDelay = retryDelay;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await apiCall();
          
          if (attempt > 0) {
            logger.info(`External API call succeeded on attempt ${attempt + 1}`);
          }
          
          return result;
          
        } catch (error: any) {
          lastError = error;
          
          if (attempt < maxRetries) {
            logger.warn(`External API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${currentDelay}ms...`, {
              error: error.message,
              statusCode: error.response?.status
            });
            
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay *= backoffMultiplier;
          }
        }
      }

      logger.error(`External API call failed after ${maxRetries + 1} attempts`);
      throw new InternalServerError(`External API call failed: ${lastError?.message || 'Unknown error'}`);
    },
    async () => {
      logger.warn('External API circuit breaker is OPEN');
      throw new InternalServerError('External API service temporarily unavailable');
    }
  );
}
```

### Template 4: Frontend Error Handling Fix

**Use Case:** Fixing frontend errors with proper user feedback and error reporting.

```javascript
// apps/webapp/js/your-component.js
import errorHandler from './core/error-handler.js';

export async function yourAsyncFunction(params) {
  try {
    // Your async operation
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    // Report to error handler with context
    errorHandler.report(error, {
      type: 'api_call_failed',
      endpoint: '/api/endpoint',
      params: params,
      timestamp: new Date().toISOString()
    });

    // Re-throw if needed for component handling
    throw error;
  }
}
```

### Template 5: Rate Limit Error Fix

**Use Case:** Handling rate limit errors gracefully with user feedback.

```typescript
// apps/backend-ts/src/middleware/your-rate-limit.ts
import rateLimit from 'express-rate-limit';
import logger from '../services/logger.js';
import type { Request, Response } from 'express';

export function getRateLimitKey(req: Request): string {
  const userId = req.header('x-user-id');
  if (userId) return `user:${userId}`;

  const apiKey = req.header('x-api-key');
  if (apiKey) return `key:${apiKey.substring(0, 12)}`;

  return `anonymous`;
}

export const yourRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // requests per window
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: getRateLimitKey,

  handler: (req: Request, res: Response) => {
    const identifier = getRateLimitKey(req);
    logger.warn(`🚨 Rate limit exceeded for ${identifier} on ${req.path}`);
    
    // Audit log (async import to avoid circular dependency)
    import('../services/audit-service.js').then(({ auditService }) => {
      auditService.logRateLimitViolation({
        userId: req.header('x-user-id') || undefined,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        endpoint: req.path,
        limit: 20,
        window: 60
      });
    }).catch(err => logger.error('[RateLimit] Failed to log audit:', err));

    res.setHeader('Retry-After', '60');
    res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait 1 minute before trying again.',
      retryAfter: 60
    });
  },

  skip: (req: Request) => {
    const apiKey = req.header('x-api-key');
    const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
    return internalKeys.includes(apiKey || '');
  }
});
```

---

## 🛡️ Error Handling Patterns

### Pattern 1: Structured Error Handling in Handlers

**Best Practice:** Use custom error classes and consistent error responses.

```typescript
// apps/backend-ts/src/handlers/your-handler.ts
import { BadRequestError, UnauthorizedError, ForbiddenError, InternalServerError } from '../utils/errors.js';
import logger from '../services/logger.js';

export async function yourHandler(params: any) {
  // 1. Input Validation
  if (!params?.requiredField) {
    throw new BadRequestError('requiredField is required');
  }

  // 2. Authentication Check
  if (!params.userId) {
    throw new UnauthorizedError('Authentication required');
  }

  // 3. Authorization Check
  if (!hasPermission(params.userId, 'action')) {
    throw new ForbiddenError('Insufficient permissions');
  }

  try {
    // 4. Business Logic with Error Context
    const result = await performOperation(params);
    return result;
    
  } catch (error: any) {
    // 5. Log with Context
    logger.error('Handler operation failed', {
      handler: 'yourHandler',
      params: JSON.stringify(params).substring(0, 500),
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 10).join('\n')
    });

    // 6. Re-throw or Transform Error
    if (error instanceof BadRequestError || 
        error instanceof UnauthorizedError || 
        error instanceof ForbiddenError) {
      throw error; // Re-throw known errors
    }

    // 7. Wrap Unknown Errors
    throw new InternalServerError(`Operation failed: ${error.message}`);
  }
}
```

### Pattern 2: Error Middleware for Express

**Best Practice:** Centralized error handling middleware.

```typescript
// apps/backend-ts/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.js';
import { ZodError } from 'zod';
import { BadRequestError, UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { err } from '../utils/response.js';

export function errorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = (req as any).requestId || 'unknown';
  
  // Enhanced error context
  const errorContext = {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  };

  // Log error with context
  logger.error(`🔥 Unhandled Error [${requestId}]:`, {
    error: error.message,
    stack: error.stack?.split('\n').slice(0, 10).join('\n'),
    ...errorContext
  });

  // Handle specific error types
  if (error instanceof ZodError) {
    return res.status(400).json(err('INVALID_PAYLOAD'));
  }
  
  if (error instanceof BadRequestError) {
    return res.status(400).json(err(error.message));
  }
  
  if (error instanceof UnauthorizedError) {
    return res.status(401).json(err(error.message));
  }
  
  if (error instanceof ForbiddenError) {
    return res.status(403).json(err(error.message));
  }

  // Default to 500
  return res.status(500).json(err(error.message || 'Internal Server Error'));
}
```

### Pattern 3: Frontend Error Boundary

**Best Practice:** React-like error boundary pattern for JavaScript.

```javascript
// apps/webapp/js/utils/error-boundary.js
export class ErrorBoundary {
  constructor(callback) {
    this.callback = callback;
    this.handleError = this.handleError.bind(this);
  }

  handleError(error, errorInfo = {}) {
    const enrichedError = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      ...errorInfo,
      timestamp: new Date().toISOString()
    };

    if (this.callback) {
      this.callback(enrichedError);
    }

    // Report to error handler
    if (window.ZANTARA_ERROR_HANDLER) {
      window.ZANTARA_ERROR_HANDLER.report(error, errorInfo);
    }

    return enrichedError;
  }

  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleError(error, {
          function: fn.name || 'anonymous',
          arguments: args
        });
      }
    };
  }
}

// Usage:
const boundary = new ErrorBoundary((error) => {
  console.error('Boundary caught error:', error);
});

const safeFunction = boundary.wrap(async (params) => {
  // Your code here
});
```

### Pattern 4: Async Error Wrapper

**Best Practice:** Utility to wrap async functions with error handling.

```typescript
// apps/backend-ts/src/utils/async-wrapper.ts
import logger from '../services/logger.js';
import { InternalServerError } from './errors.js';

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      logger.error(`Error in ${context || fn.name}:`, {
        error: error.message,
        stack: error.stack,
        args: JSON.stringify(args).substring(0, 500)
      });

      // Re-throw known errors
      if (error instanceof BadRequestError ||
          error instanceof UnauthorizedError ||
          error instanceof ForbiddenError) {
        throw error;
      }

      // Wrap unknown errors
      throw new InternalServerError(
        `Error in ${context || fn.name}: ${error.message}`
      );
    }
  }) as T;
}

// Usage:
export const safeHandler = asyncHandler(
  async (params: any) => {
    // Your handler logic
  },
  'yourHandler'
);
```

---

## ⚡ Performance Optimization Templates

### Template 1: Caching Strategy

**Use Case:** Add caching to expensive operations.

```typescript
// apps/backend-ts/src/services/cache-service.ts
import logger from './logger.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Usage:
const queryCache = new SimpleCache<any>(300000); // 5 minutes

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = queryCache.get(key);
  if (cached) {
    logger.debug(`Cache hit for key: ${key}`);
    return cached as T;
  }

  logger.debug(`Cache miss for key: ${key}`);
  const data = await fetcher();
  queryCache.set(key, data, ttl);
  return data;
}
```

### Template 2: Connection Pooling

**Use Case:** Optimize database/external API connections.

```typescript
// apps/backend-ts/src/services/pool-manager.ts
import logger from './logger.js';

interface PoolConfig {
  maxConnections: number;
  minConnections?: number;
  idleTimeout?: number;
}

class ConnectionPool<T> {
  private connections: T[] = [];
  private inUse: Set<T> = new Set();
  private config: Required<PoolConfig>;
  private factory: () => Promise<T>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(factory: () => Promise<T>, config: PoolConfig) {
    this.factory = factory;
    this.config = {
      maxConnections: config.maxConnections,
      minConnections: config.minConnections || Math.floor(config.maxConnections / 2),
      idleTimeout: config.idleTimeout || 30000
    };
    
    this.startCleanup();
  }

  async acquire(): Promise<T> {
    // Return existing idle connection
    const idle = this.connections.find(conn => !this.inUse.has(conn));
    if (idle) {
      this.inUse.add(idle);
      return idle;
    }

    // Create new connection if under limit
    if (this.connections.length < this.config.maxConnections) {
      const conn = await this.factory();
      this.connections.push(conn);
      this.inUse.add(conn);
      return conn;
    }

    // Wait for connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const available = this.connections.find(conn => !this.inUse.has(conn));
        if (available) {
          clearInterval(checkInterval);
          this.inUse.add(available);
          resolve(available);
        }
      }, 100);
    });
  }

  release(connection: T): void {
    this.inUse.delete(connection);
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      if (this.connections.length > this.config.minConnections) {
        const idle = this.connections.filter(conn => !this.inUse.has(conn));
        if (idle.length > this.config.minConnections) {
          const toRemove = idle.slice(0, idle.length - this.config.minConnections);
          toRemove.forEach(conn => {
            this.connections = this.connections.filter(c => c !== conn);
          });
          logger.debug(`Pool cleanup: removed ${toRemove.length} idle connections`);
        }
      }
    }, this.config.idleTimeout);
  }

  getStats() {
    return {
      total: this.connections.length,
      inUse: this.inUse.size,
      idle: this.connections.length - this.inUse.size,
      max: this.config.maxConnections
    };
  }

  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    // Close all connections (implement based on your connection type)
    this.connections = [];
    this.inUse.clear();
  }
}

// Usage:
const dbPool = new ConnectionPool(
  async () => {
    // Create database connection
    return await createConnection();
  },
  {
    maxConnections: 20,
    minConnections: 5,
    idleTimeout: 30000
  }
);
```

### Template 3: Request Batching

**Use Case:** Batch multiple requests to reduce overhead.

```typescript
// apps/backend-ts/src/services/batch-processor.ts
import logger from './logger.js';

interface BatchItem<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  data: any;
}

class BatchProcessor<T, R> {
  private batch: BatchItem<R>[] = [];
  private batchSize: number;
  private maxWait: number;
  private timer?: NodeJS.Timeout;
  private processor: (items: T[]) => Promise<R[]>;

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 10,
    maxWait: number = 50
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.maxWait = maxWait;
  }

  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.batch.push({
        resolve,
        reject,
        data: item
      });

      // Process if batch is full
      if (this.batch.length >= this.batchSize) {
        this.processBatch();
        return;
      }

      // Schedule processing after maxWait
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processBatch();
        }, this.maxWait);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }

    try {
      const items = currentBatch.map(item => item.data);
      const results = await this.processor(items);

      // Resolve all promises
      currentBatch.forEach((item, index) => {
        if (results[index] !== undefined) {
          item.resolve(results[index]);
        } else {
          item.reject(new Error('Batch processor returned incomplete results'));
        }
      });

      logger.debug(`Batch processed: ${items.length} items`);
      
    } catch (error: any) {
      // Reject all promises
      currentBatch.forEach(item => {
        item.reject(error);
      });

      logger.error('Batch processing failed:', error);
    }
  }

  async flush(): Promise<void> {
    await this.processBatch();
  }
}

// Usage:
const embeddingBatchProcessor = new BatchProcessor(
  async (texts: string[]) => {
    // Batch process embeddings
    return await getEmbeddingsBatch(texts);
  },
  10, // batch size
  50  // max wait (ms)
);

export async function getEmbedding(text: string): Promise<number[]> {
  return await embeddingBatchProcessor.add(text);
}
```

### Template 4: Debounce/Throttle Utilities

**Use Case:** Reduce frequency of expensive operations.

```typescript
// apps/backend-ts/src/utils/throttle.ts

/**
 * Throttle function calls - execute at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastExecuted = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastExecuted >= interval) {
      lastExecuted = now;
      fn.apply(this, args);
    } else {
      // Schedule execution for end of interval
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        lastExecuted = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, interval - (now - lastExecuted));
    }
  };
}

/**
 * Debounce function calls - execute only after delay since last call
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

// Usage:
const throttledLog = throttle((message: string) => {
  logger.info(message);
}, 1000); // Log at most once per second

const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300); // Wait 300ms after last keystroke
```

### Template 5: Performance Monitoring Decorator

**Use Case:** Monitor function performance automatically.

```typescript
// apps/backend-ts/src/utils/performance-monitor.ts
import logger from '../services/logger.js';

interface PerformanceMetrics {
  name: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();

  record(name: string, duration: number): void {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      };
      this.metrics.set(name, metric);
    }

    metric.count++;
    metric.totalTime += duration;
    metric.avgTime = metric.totalTime / metric.count;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
  }

  getMetrics(name?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (name) {
      return this.metrics.get(name) || {
        name,
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: 0,
        maxTime: 0
      };
    }
    return new Map(this.metrics);
  }

  logMetrics(): void {
    logger.info('Performance Metrics:', Object.fromEntries(this.metrics));
  }

  reset(): void {
    this.metrics.clear();
  }
}

const perfMonitor = new PerformanceMonitor();

/**
 * Decorator to monitor async function performance
 */
export function monitorPerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        
        perfMonitor.record(metricName, duration);
        
        // Log slow operations
        if (duration > 1000) {
          logger.warn(`Slow operation detected: ${metricName} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        perfMonitor.record(metricName, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

// Usage:
class MyService {
  @monitorPerformance('MyService.fetchData')
  async fetchData(id: string) {
    // Your code here
  }
}
```

### Template 6: Lazy Loading Pattern

**Use Case:** Load resources only when needed.

```typescript
// apps/backend-ts/src/utils/lazy-loader.ts

class LazyLoader<T> {
  private loader: () => Promise<T>;
  private value: T | null = null;
  private promise: Promise<T> | null = null;

  constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }

  async get(): Promise<T> {
    if (this.value !== null) {
      return this.value;
    }

    if (this.promise) {
      return this.promise;
    }

    this.promise = this.loader().then(value => {
      this.value = value;
      this.promise = null;
      return value;
    });

    return this.promise;
  }

  reset(): void {
    this.value = null;
    this.promise = null;
  }

  isLoaded(): boolean {
    return this.value !== null;
  }
}

// Usage:
const heavyServiceLoader = new LazyLoader(async () => {
  // Expensive initialization
  return await initializeHeavyService();
});

export async function getHeavyService() {
  return await heavyServiceLoader.get();
}
```

---

## 📝 Quick Reference Checklist

### Before Fixing a Bug:
- [ ] Reproduce the issue consistently
- [ ] Check error logs for context
- [ ] Identify error type (validation, auth, system, etc.)
- [ ] Review similar error handling patterns in codebase
- [ ] Add appropriate logging with context

### When Implementing Error Handling:
- [ ] Use custom error classes (BadRequestError, UnauthorizedError, etc.)
- [ ] Include request context (requestId, endpoint, user info)
- [ ] Log errors with structured data
- [ ] Return appropriate HTTP status codes
- [ ] Provide user-friendly error messages
- [ ] Handle circuit breaker states
- [ ] Consider retry logic for transient errors

### When Optimizing Performance:
- [ ] Measure before and after (baseline metrics)
- [ ] Identify bottlenecks (database, network, CPU)
- [ ] Consider caching strategies
- [ ] Implement connection pooling
- [ ] Use batching for multiple operations
- [ ] Add performance monitoring
- [ ] Test under load
- [ ] Monitor metrics after deployment

---

## 🔗 Related Files

- Error Classes: `apps/backend-ts/src/utils/errors.ts`
- Circuit Breaker: `apps/backend-ts/src/services/circuit-breaker.ts`
- Connection Pool: `apps/backend-ts/src/services/connection-pool.ts`
- Rate Limiting: `apps/backend-ts/src/middleware/rate-limit.ts`
- Frontend Error Handler: `apps/webapp/js/core/error-handler.js`
- Performance Optimizer: `apps/backend-rag/backend/services/performance_optimizer.py`

---

**Last Updated:** 2025-01-02
**Maintained By:** NUZANTARA-FLY Development Team

