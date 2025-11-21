/**
 * Internal Service Registry
 *
 * Eliminates self-recursion by registering internal handlers
 * instead of external HTTP service calls
 */

import logger from '../logger.js';

export interface InternalHandler {
  (params: any, context?: any): Promise<any>;
}

export class InternalServiceRegistry {
  private handlers: Map<string, InternalHandler> = new Map();
  private static instance: InternalServiceRegistry;

  static getInstance(): InternalServiceRegistry {
    if (!InternalServiceRegistry.instance) {
      InternalServiceRegistry.instance = new InternalServiceRegistry();
    }
    return InternalServiceRegistry.instance;
  }

  /**
   * Register internal handler
   */
  registerHandler(name: string, handler: InternalHandler): void {
    this.handlers.set(name, handler);
    logger.info(`✅ Registered internal handler: ${name}`);
  }

  /**
   * Execute internal handler directly (no HTTP calls)
   */
  async executeHandler(name: string, params: any, context?: any): Promise<any> {
    const handler = this.handlers.get(name);

    if (!handler) {
      throw new Error(`Internal handler not found: ${name}`);
    }

    try {
      logger.debug(`🔧 Executing internal handler: ${name}`, { params });
      const result = await handler(params, context);
      logger.debug(`✅ Internal handler completed: ${name}`);
      return result;
    } catch (error) {
      logger.error(`❌ Internal handler failed: ${name}`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if handler exists
   */
  hasHandler(name: string): boolean {
    return this.handlers.has(name);
  }

  /**
   * Get all registered handlers
   */
  getHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers (for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Export singleton
export const internalServiceRegistry = InternalServiceRegistry.getInstance();
