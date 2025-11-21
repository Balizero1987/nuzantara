/**
 * ChromaDB Connection Pooling
 *
 * Manages ChromaDB client connections with health checks and circuit breakers
 */

import logger from './logger.js';
import { dbCircuitBreaker } from './circuit-breaker.js';

// Dynamic import to avoid TypeScript compilation issues with chromadb
// @ts-ignore - ChromaDB types are not well-defined, we'll handle this at runtime
let ChromaClient: any = null;

export class ChromaDBPool {
  private client: any = null;
  private url: string;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy: boolean = true;
  private lastHealthCheck: number = 0;

  constructor(url?: string) {
    this.url = url || process.env.CHROMADB_URL || 'http://localhost:8000';
  }

  /**
   * Initialize ChromaDB client
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import to avoid TypeScript compilation issues
      if (!ChromaClient) {
        const chromadbModule = await import('chromadb');
        ChromaClient = chromadbModule.ChromaClient;
      }

      this.client = new ChromaClient({
        path: this.url,
      });

      // Test connection
      await this.healthCheck();

      logger.info(`✅ ChromaDB client initialized: ${this.url}`);
      this.startHealthChecks();
    } catch (error: any) {
      logger.error(`❌ Failed to initialize ChromaDB client: ${error.message}`);
      this.isHealthy = false;
      throw error;
    }
  }

  /**
   * Get ChromaDB client
   */
  getClient(): any {
    if (!this.client) {
      throw new Error('ChromaDB client not initialized');
    }

    if (!this.isHealthy) {
      throw new Error('ChromaDB is not healthy');
    }

    return this.client;
  }

  /**
   * Execute operation with circuit breaker
   */
  async execute<T>(operation: (client: any) => Promise<T>): Promise<T> {
    const client = this.getClient();

    return dbCircuitBreaker.execute(
      async () => {
        return operation(client);
      },
      async () => {
        throw new Error('ChromaDB circuit breaker is OPEN');
      }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Simple health check - try to list collections
      await this.client.heartbeat();
      this.isHealthy = true;
      this.lastHealthCheck = Date.now();
      return true;
    } catch (error: any) {
      logger.error(`❌ ChromaDB health check failed: ${error.message}`);
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
    }, 60000); // Every 60 seconds
  }

  /**
   * Close the client
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    // ChromaDB client doesn't need explicit close
    this.client = null;
    logger.info('ChromaDB client closed');
  }

  /**
   * Check if client is healthy
   */
  isClientHealthy(): boolean {
    return this.isHealthy;
  }

  /**
   * Get last health check time
   */
  getLastHealthCheck(): number {
    return this.lastHealthCheck;
  }
}

// Singleton instance
let chromaPool: ChromaDBPool | null = null;

/**
 * Initialize ChromaDB pool
 */
export async function initializeChromaDBPool(url?: string): Promise<ChromaDBPool> {
  if (chromaPool) {
    return chromaPool;
  }

  chromaPool = new ChromaDBPool(url);
  await chromaPool.initialize();
  return chromaPool;
}

/**
 * Get ChromaDB pool
 */
export function getChromaDBPool(): ChromaDBPool {
  if (!chromaPool) {
    throw new Error('ChromaDB pool not initialized. Call initializeChromaDBPool() first.');
  }
  return chromaPool;
}
