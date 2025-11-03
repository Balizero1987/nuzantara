/**
 * Example: Complete Error Handling Setup
 * 
 * Demonstrates a production-ready Express application with unified error handling
 */

import express from 'express';
import {
  setupErrorHandling,
  asyncHandler,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  DatabaseError,
  ExternalServiceError,
  getDefaultErrorHandler,
} from '../errors/index.js';

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup error handling middleware
const { requestContext, timeout, notFound, errorRateLimit, errorHandler } = setupErrorHandling({
  requestTimeout: 30000, // 30 seconds
  maxErrorsPerMinute: 10, // Rate limit per IP
});

// Apply request context early (generates request IDs)
app.use(requestContext);
app.use(timeout);

// ============================================================================
// ROUTES WITH ERROR HANDLING EXAMPLES
// ============================================================================

// Example 1: Validation Error
app.post('/users', asyncHandler(async (req, res) => {
  const { email, name, age } = req.body;

  // Input validation
  if (!email || !name) {
    throw new ValidationError('Missing required fields', undefined, {
      required: ['email', 'name'],
      received: Object.keys(req.body),
    });
  }

  if (age && (age < 18 || age > 120)) {
    throw new ValidationError('Invalid age', undefined, {
      field: 'age',
      value: age,
      constraints: 'Must be between 18 and 120',
    });
  }

  // Simulate user creation
  const user = { id: Date.now(), email, name, age };
  res.status(201).json({ success: true, data: user });
}));

// Example 2: Not Found Error
app.get('/users/:id', asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Simulate database lookup
  const user = await findUserById(userId);

  if (!user) {
    throw new NotFoundError(`User with ID ${userId}`);
  }

  res.json({ success: true, data: user });
}));

// Example 3: Authentication Error
app.get('/profile', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new AuthenticationError('Missing authentication token');
  }

  // Simulate token verification
  const user = await verifyToken(token);

  if (!user) {
    throw new AuthenticationError('Invalid or expired token');
  }

  res.json({ success: true, data: user });
}));

// Example 4: Database Error
app.get('/posts', asyncHandler(async (req, res) => {
  try {
    // Simulate database query
    const posts = await fetchPostsFromDatabase();
    res.json({ success: true, data: posts });
  } catch (error) {
    // Wrap database errors
    throw new DatabaseError(
      'Failed to fetch posts from database',
      {
        requestId: (req as Express.Request & { id?: string }).id,
        path: req.path,
        timestamp: new Date(),
      },
      error as Error,
    );
  }
}));

// Example 5: External Service Error
app.post('/payments', asyncHandler(async (req, res) => {
  const { amount, currency, cardToken } = req.body;

  if (!amount || !currency || !cardToken) {
    throw new ValidationError('Missing payment details', undefined, {
      required: ['amount', 'currency', 'cardToken'],
    });
  }

  try {
    // Simulate payment gateway call
    const payment = await processPayment({ amount, currency, cardToken });
    res.json({ success: true, data: payment });
  } catch (error) {
    // Wrap external service errors
    throw new ExternalServiceError(
      'PaymentGateway',
      'Payment processing failed',
      {
        additionalData: { amount, currency },
      },
      error as Error,
    );
  }
}));

// Example 6: Health check endpoint (no error handling needed)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Example 7: Error metrics endpoint
app.get('/metrics/errors', (_req, res) => {
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
      nonOperational: metrics.nonOperationalErrors,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      lastError: metrics.lastError
        ? {
            message: metrics.lastError.message,
            category: metrics.lastError.category,
            severity: metrics.lastError.severity,
            timestamp: metrics.lastError.timestamp.toISOString(),
          }
        : null,
    },
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE (must be last)
// ============================================================================

// 404 handler for unmatched routes
app.use(notFound);

// Error rate limiting
app.use(errorRateLimit);

// Global error handler
app.use(errorHandler);

// ============================================================================
// MOCK FUNCTIONS (for demonstration purposes)
// ============================================================================

async function findUserById(id: string): Promise<{ id: number; name: string; email: string } | null> {
  // Simulate database lookup
  if (id === '1') {
    return { id: 1, name: 'John Doe', email: 'john@example.com' };
  }
  return null;
}

async function verifyToken(token: string): Promise<{ id: number; name: string } | null> {
  // Simulate token verification
  if (token === 'valid-token') {
    return { id: 1, name: 'John Doe' };
  }
  return null;
}

async function fetchPostsFromDatabase(): Promise<Array<{ id: number; title: string }>> {
  // Simulate database query
  // Randomly fail 10% of the time for demonstration
  if (Math.random() < 0.1) {
    throw new Error('Database connection timeout');
  }

  return [
    { id: 1, title: 'First Post' },
    { id: 2, title: 'Second Post' },
  ];
}

async function processPayment(details: {
  amount: number;
  currency: string;
  cardToken: string;
}): Promise<{ id: string; status: string; amount: number }> {
  // Simulate payment processing
  // Randomly fail 20% of the time for demonstration
  if (Math.random() < 0.2) {
    throw new Error('Payment gateway timeout');
  }

  return {
    id: `pay_${Date.now()}`,
    status: 'succeeded',
    amount: details.amount,
  };
}

// ============================================================================
// START SERVER
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Error metrics: http://localhost:${PORT}/metrics/errors`);
    console.log(`💚 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
