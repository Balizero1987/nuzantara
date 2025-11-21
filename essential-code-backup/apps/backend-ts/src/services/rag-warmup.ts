/**
 * RAG Backend Warmup Service
 *
 * Keeps RAG backend alive by pinging health endpoint every 10 minutes.
 * Prevents 502 errors caused by Fly.io cold starts.
 */

import logger from './logger.js';

// Fallback to hardcoded URL if env var not set (Fly.io sometimes doesn't pass it immediately)
const RAG_URL =
  process.env.RAG_BACKEND_URL || process.env.FLY_RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';

const WARMUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const WARMUP_TIMEOUT = 5000; // 5 seconds

interface WarmupStats {
  totalAttempts: number;
  successfulPings: number;
  failedPings: number;
  lastPingTime: Date | null;
  lastStatus: 'success' | 'failed' | 'pending';
  averageResponseTime: number;
  consecutiveFailures: number;
}

class RAGWarmupService {
  private stats: WarmupStats = {
    totalAttempts: 0,
    successfulPings: 0,
    failedPings: 0,
    lastPingTime: null,
    lastStatus: 'pending',
    averageResponseTime: 0,
    consecutiveFailures: 0,
  };

  private intervalId: NodeJS.Timeout | null = null;
  private responseTimes: number[] = [];
  private isRunning = false;

  async ping(): Promise<boolean> {
    this.stats.totalAttempts++;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT);

      const response = await fetch(`${RAG_URL}/health`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NUZANTARA-Warmup-Service/1.0',
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      if (this.responseTimes.length > 20) {
        this.responseTimes.shift(); // Keep last 20
      }

      const avgResponseTime =
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
      this.stats.averageResponseTime = Math.round(avgResponseTime);

      if (response.ok) {
        this.stats.successfulPings++;
        this.stats.lastStatus = 'success';
        this.stats.lastPingTime = new Date();
        this.stats.consecutiveFailures = 0;

        logger.info(
          `✅ RAG backend warmed up (${responseTime}ms, success rate: ${this.getSuccessRate()}%)`
        );
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      this.stats.failedPings++;
      this.stats.lastStatus = 'failed';
      this.stats.lastPingTime = new Date();
      this.stats.consecutiveFailures++;

      const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
      logger.warn(
        `⚠️ RAG warmup failed: ${errorMsg} (consecutive failures: ${this.stats.consecutiveFailures})`
      );

      // Alert if too many consecutive failures
      if (this.stats.consecutiveFailures >= 3) {
        logger.error(
          `🚨 RAG backend appears to be down (${this.stats.consecutiveFailures} consecutive failures)`
        );
      }

      return false;
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('⚠️ RAG warmup service already running');
      return;
    }

    this.isRunning = true;

    // Immediate ping on startup
    this.ping().catch((err) => {
      logger.error('Initial RAG warmup ping failed:', err);
    });

    // Then every WARMUP_INTERVAL
    this.intervalId = setInterval(() => {
      this.ping().catch((err) => {
        logger.error('Scheduled RAG warmup ping failed:', err);
      });
    }, WARMUP_INTERVAL);

    logger.info(
      `🔥 RAG warmup service started (interval: ${WARMUP_INTERVAL / 1000}s, target: ${RAG_URL})`
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info('🛑 RAG warmup service stopped');
    }
  }

  getStats(): WarmupStats {
    return { ...this.stats };
  }

  getSuccessRate(): number {
    if (this.stats.totalAttempts === 0) return 0;
    return Math.round((this.stats.successfulPings / this.stats.totalAttempts) * 100 * 100) / 100;
  }

  getHealthStatus(): {
    healthy: boolean;
    isRunning: boolean;
    uptime: number;
    successRate: number;
    avgResponseTime: number;
    lastPing: string | null;
    status: string;
  } {
    const successRate = this.getSuccessRate();

    let status = 'unknown';
    if (this.stats.consecutiveFailures >= 3) {
      status = 'critical';
    } else if (this.stats.consecutiveFailures >= 1) {
      status = 'degraded';
    } else if (this.stats.lastStatus === 'success') {
      status = 'healthy';
    }

    return {
      healthy: this.stats.lastStatus === 'success' && this.stats.consecutiveFailures === 0,
      isRunning: this.isRunning,
      uptime: successRate,
      successRate,
      avgResponseTime: this.stats.averageResponseTime,
      lastPing: this.stats.lastPingTime ? this.stats.lastPingTime.toISOString() : null,
      status,
    };
  }

  // Manual trigger for testing
  async triggerPing(): Promise<{ success: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    try {
      const success = await this.ping();
      return {
        success,
        responseTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const ragWarmupService = new RAGWarmupService();

// Convenience exports
export function startRAGWarmup() {
  ragWarmupService.start();
}

export function stopRAGWarmup() {
  ragWarmupService.stop();
}

export function getRAGWarmupStats() {
  return ragWarmupService.getStats();
}

export function getRAGHealthStatus() {
  return ragWarmupService.getHealthStatus();
}

export function triggerRAGPing() {
  return ragWarmupService.triggerPing();
}
