import { Router, Request, Response } from 'express';

const router = Router();

interface HealthCheck {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  timestamp: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, 'healthy' | 'unhealthy' | 'unknown'>;
  version?: string;
  environment?: string;
}

// Helper function to check service health with timeout
async function checkServiceHealth(
  name: string,
  checkFn: () => Promise<boolean>,
  timeout: number = 5000
): Promise<'healthy' | 'unhealthy'> {
  try {
    const result = await Promise.race([
      checkFn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
    return result ? 'healthy' : 'unhealthy';
  } catch (error) {
    console.error(`Health check failed for ${name}:`, error);
    return 'unhealthy';
  }
}

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const checks: HealthCheck = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: Date.now(),
    status: 'healthy',
    services: {},
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check Redis (if available)
  if (process.env.REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      checks.services.redis = await checkServiceHealth('redis', async () => {
        const result = await redis.ping();
        await redis.quit();
        return result === 'PONG';
      });
    } catch (error) {
      checks.services.redis = 'unhealthy';
    }
  }

  // Check Database (if Prisma is available)
  try {
    // Try to import prisma client if it exists
    const prismaPath = require.resolve('@prisma/client', { paths: [process.cwd()] });
    if (prismaPath) {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      checks.services.database = await checkServiceHealth('database', async () => {
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        return true;
      });
    }
  } catch (error) {
    // Prisma not available or check failed
    checks.services.database = 'unknown';
  }

  // Check ChromaDB (if available)
  if (process.env.CHROMA_DB_PATH) {
    checks.services.chromadb = 'unknown'; // Placeholder - would need actual ChromaDB client
  }

  // Determine overall status
  const serviceStatuses = Object.values(checks.services);
  const hasUnhealthy = serviceStatuses.some(s => s === 'unhealthy');
  const allHealthy = serviceStatuses.every(s => s === 'healthy' || s === 'unknown');

  if (hasUnhealthy) {
    checks.status = serviceStatuses.filter(s => s === 'healthy').length > 0 ? 'degraded' : 'unhealthy';
  } else if (allHealthy) {
    checks.status = 'healthy';
  }

  const statusCode = checks.status === 'healthy' ? 200 :
                     checks.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(checks);
});

/**
 * GET /health/ready
 * Readiness check - determines if the service can accept traffic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  const checks = {
    ready: true,
    timestamp: Date.now(),
    checks: {} as Record<string, boolean>,
  };

  // Check critical services
  if (process.env.REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      const result = await redis.ping();
      checks.checks.redis = result === 'PONG';
      await redis.quit();
    } catch {
      checks.checks.redis = false;
    }
  }

  checks.ready = Object.values(checks.checks).every(v => v);

  res.status(checks.ready ? 200 : 503).json(checks);
});

/**
 * GET /health/live
 * Liveness check - determines if the service is alive
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Get the global prometheus register if it exists
    const prometheusRegister = (global as any).prometheusRegister;

    if (!prometheusRegister) {
      return res.status(404).json({
        error: 'Prometheus metrics not initialized',
        hint: 'Call initMonitoring() before starting the server'
      });
    }

    res.set('Content-Type', prometheusRegister.contentType);
    const metrics = await prometheusRegister.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /health/redis
 * Detailed Redis health check
 */
router.get('/health/redis', async (req: Request, res: Response) => {
  if (!process.env.REDIS_URL) {
    return res.status(404).json({ error: 'Redis not configured' });
  }

  try {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(process.env.REDIS_URL);

    const start = Date.now();
    const pingResult = await redis.ping();
    const latency = Date.now() - start;

    const info = await redis.info('server');
    await redis.quit();

    res.json({
      healthy: pingResult === 'PONG',
      latency,
      info: info.split('\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {} as Record<string, string>),
    });
  } catch (error) {
    res.status(503).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/database
 * Detailed database health check
 */
router.get('/health/database', async (req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    await prisma.$disconnect();

    res.json({
      healthy: true,
      latency,
      provider: 'postgresql',
    });
  } catch (error) {
    res.status(503).json({
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
