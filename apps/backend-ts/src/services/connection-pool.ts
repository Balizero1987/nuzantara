/**
 * Enhanced Database Connection Pooling
 * 
 * Manages connection pools for PostgreSQL and ChromaDB
 * with health checks, circuit breakers, and metrics
 */

import logger from './logger.js';
import { dbCircuitBreaker } from './circuit-breaker.js';

export interface PoolMetrics {
  total: number;
  idle: number;
  waiting: number;
  active: number;
  max: number;
  min: number;
}

export interface PoolConfig {
  connectionString?: string;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseConnectionPool {
  private pool: any = null; // Pool type from pg package (optional dependency)
  private config: PoolConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy: boolean = true;

  constructor(config: PoolConfig) {
    this.config = {
      ...config,
      max: config.max || 20,
      min: config.min || 5,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
    };
  }

  /**
   * Initialize connection pool
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import of pg module (optional dependency)
      // @ts-ignore - pg is optional dependency
      const pg = await import('pg');
      const Pool = pg.Pool;
      
      this.pool = new Pool(this.config);

      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error(`❌ PostgreSQL pool error: ${err.message}`);
        this.isHealthy = false;
        // Note: Circuit breaker failure tracking happens in query execution
      });

      // Handle connection events
      this.pool.on('connect', () => {
        logger.debug('✅ New PostgreSQL connection established');
        this.isHealthy = true;
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      logger.info(`✅ PostgreSQL connection pool initialized: min=${this.config.min}, max=${this.config.max}`);

      // Start health checks
      this.startHealthChecks();
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        logger.warn('⚠️ PostgreSQL (pg) module not found. Database pooling disabled. Install pg package to enable.');
        this.isHealthy = false;
        // Don't throw - allow app to continue without pooling
        return;
      }
      logger.error(`❌ Failed to initialize PostgreSQL pool: ${error.message}`);
      this.isHealthy = false;
      throw error;
    }
  }

  /**
   * Get a connection from the pool
   */
  async getConnection() {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    // Check circuit breaker state before attempting connection
    if (dbCircuitBreaker.getState() === 'OPEN') {
      throw new Error('Database circuit breaker is OPEN');
    }

    try {
      const client = await this.pool.connect();
      // On success, circuit breaker will be notified via query method
      return client;
    } catch (error) {
      // On failure, circuit breaker will be notified via query method
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('Connection pool not initialized');
    }

    return dbCircuitBreaker.execute(
      async () => {
        const start = Date.now();
        try {
          const result = await this.pool!.query(text, params);
          const duration = Date.now() - start;
          logger.debug(`Query executed in ${duration}ms: ${text.substring(0, 50)}...`);
          return result;
        } catch (error: any) {
          const duration = Date.now() - start;
          logger.error(`Query failed after ${duration}ms: ${error.message}`);
          throw error;
        }
      },
      async () => {
        throw new Error('Database circuit breaker is OPEN');
      }
    );
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics | null {
    if (!this.pool) return null;

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
      active: this.pool.totalCount - this.pool.idleCount,
      max: this.config.max || 20,
      min: this.config.min || 5,
    };
  }

  /**
   * Check pool health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isHealthy = true;
      return true;
    } catch (error: any) {
      logger.error(`❌ Health check failed: ${error.message}`);
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
    }, 30000); // Every 30 seconds
  }

  /**
   * Close the pool
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      await this.pool.end();
      logger.info('PostgreSQL connection pool closed');
    }
  }

  /**
   * Check if pool is healthy
   */
  isPoolHealthy(): boolean {
    return this.isHealthy;
  }
}

// Singleton instance
let dbPool: DatabaseConnectionPool | null = null;

/**
 * Initialize database connection pool
 */
export async function initializeDatabasePool(): Promise<DatabaseConnectionPool> {
  if (dbPool) {
    return dbPool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  dbPool = new DatabaseConnectionPool({
    connectionString: databaseUrl,
      max: Number.parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: Number.parseInt(process.env.DB_POOL_MIN || '5', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  await dbPool.initialize();
  return dbPool;
}

/**
 * Get database connection pool
 */
export function getDatabasePool(): DatabaseConnectionPool {
  if (!dbPool) {
    throw new Error('Database pool not initialized. Call initializeDatabasePool() first.');
  }
  return dbPool;
}

