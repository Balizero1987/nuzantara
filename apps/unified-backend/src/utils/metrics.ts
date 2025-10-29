import { redis } from './redis';
import { db } from './database';

interface Metrics {
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
  };
  redis: {
    connected: boolean;
    usedMemory?: string;
  };
  database: {
    connected: boolean;
  };
  requests: {
    total: number;
    success: number;
    errors: number;
  };
}

let requestMetrics = {
  total: 0,
  success: 0,
  errors: 0
};

export function incrementRequestMetric(type: 'success' | 'error') {
  requestMetrics.total++;
  if (type === 'success') {
    requestMetrics.success++;
  } else {
    requestMetrics.errors++;
  }
}

export async function collectMetrics(): Promise<Metrics> {
  const metrics: Metrics = {
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    redis: {
      connected: false
    },
    database: {
      connected: false
    },
    requests: { ...requestMetrics }
  };

  // Check Redis
  try {
    await redis.ping();
    metrics.redis.connected = true;
    const info = await redis.info('memory');
    const match = info.match(/used_memory_human:(.+)/);
    if (match) {
      metrics.redis.usedMemory = match[1].trim();
    }
  } catch (error) {
    metrics.redis.connected = false;
  }

  // Check Database
  try {
    await db.$queryRaw`SELECT 1`;
    metrics.database.connected = true;
  } catch (error) {
    metrics.database.connected = false;
  }

  return metrics;
}
