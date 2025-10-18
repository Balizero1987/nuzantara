/**
 * ZANTARA Handler Registry - Scalable Handler Management
 *
 * Replaces manual registration with auto-discovery pattern
 * Supports 136 → 500+ handlers without code changes
 *
 * Architecture: Module-Functional structure
 * - handlers/google-workspace/*.ts
 * - handlers/bali-zero/*.ts
 * - handlers/ai-services/*.ts
 * - handlers/zantara/*.ts
 */
import logger from '../services/logger.js';
/**
 * Central Handler Registry
 *
 * Features:
 * - Auto-registration on import
 * - Dependency injection support
 * - Middleware chains
 * - Performance metrics
 * - Handler versioning
 */
export class HandlerRegistry {
    handlers = new Map();
    callCounts = new Map();
    options;
    constructor(options = {}) {
        this.options = {
            enableLogging: true,
            enableMetrics: true,
            ...options
        };
    }
    /**
     * Register a handler
     *
     * Usage:
     * ```ts
     * registry.register({
     *   key: 'gmail.send',
     *   handler: sendEmail,
     *   module: 'google-workspace',
     *   requiresAuth: true
     * });
     * ```
     */
    register(metadata) {
        if (this.handlers.has(metadata.key)) {
            if (this.options.enableLogging) {
                logger.warn(`⚠️  Handler '${metadata.key}' already registered, overwriting`);
            }
        }
        this.handlers.set(metadata.key, metadata);
        this.callCounts.set(metadata.key, 0);
        if (this.options.enableLogging) {
            logger.info(`✅ Registered handler: ${metadata.key} (module: ${metadata.module})`);
        }
    }
    /**
     * Bulk register handlers from module
     *
     * Usage:
     * ```ts
     * registry.registerModule('google-workspace', {
     *   'gmail.send': sendEmail,
     *   'gmail.list': listEmails,
     *   'drive.upload': uploadFile
     * });
     * ```
     */
    registerModule(moduleName, handlers, options = {}) {
        for (const [key, handler] of Object.entries(handlers)) {
            this.register({
                key: `${moduleName}.${key}`,
                handler,
                module: moduleName,
                ...options
            });
        }
    }
    /**
     * Get handler by key
     */
    get(key) {
        return this.handlers.get(key);
    }
    /**
     * Check if handler exists
     */
    has(key) {
        return this.handlers.has(key);
    }
    /**
     * Execute handler with metrics
     */
    async execute(key, params, req) {
        const metadata = this.handlers.get(key);
        if (!metadata) {
            throw new Error(`handler_not_found: ${key}`);
        }
        if (metadata.deprecated) {
            logger.warn(`⚠️  Handler '${key}' is deprecated`);
        }
        // Increment call count
        if (this.options.enableMetrics) {
            this.callCounts.set(key, (this.callCounts.get(key) || 0) + 1);
        }
        // Execute with error handling
        try {
            const startTime = Date.now();
            const result = await metadata.handler(params, req);
            const duration = Date.now() - startTime;
            if (this.options.enableLogging && duration > 1000) {
                logger.warn(`⏱️  Slow handler: ${key} took ${duration}ms`);
            }
            return result;
        }
        catch (error) {
            if (this.options.enableLogging) {
                logger.error(`❌ Handler error: ${key}`, error.message);
            }
            throw error;
        }
    }
    /**
     * List all registered handlers
     */
    list() {
        return Array.from(this.handlers.keys()).sort();
    }
    /**
     * Get handlers by module
     */
    listByModule(moduleName) {
        return Array.from(this.handlers.entries())
            .filter(([_, metadata]) => metadata.module === moduleName)
            .map(([key, _]) => key)
            .sort();
    }
    /**
     * Get registry statistics
     */
    getStats() {
        const modules = new Map();
        for (const metadata of Array.from(this.handlers.values())) {
            modules.set(metadata.module, (modules.get(metadata.module) || 0) + 1);
        }
        return {
            totalHandlers: this.handlers.size,
            modules: Object.fromEntries(modules),
            topHandlers: Array.from(this.callCounts.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([key, count]) => ({ key, count }))
        };
    }
    /**
     * Export handlers map for backward compatibility with router.ts
     */
    toHandlersMap() {
        const map = {};
        for (const [key, metadata] of Array.from(this.handlers.entries())) {
            map[key] = metadata.handler;
        }
        return map;
    }
}
// Global registry instance
export const globalRegistry = new HandlerRegistry({
    enableLogging: process.env.NODE_ENV !== 'production',
    enableMetrics: true
});
/**
 * Decorator for auto-registration (TypeScript 5.0+)
 *
 * Usage:
 * ```ts
 * @Handler('gmail.send', { module: 'google-workspace' })
 * export async function sendEmail(params: any) {
 *   // ...
 * }
 * ```
 */
export function Handler(key, options = {}) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        // Register on module load
        globalRegistry.register({
            key,
            handler: originalMethod,
            module: options.module || 'unknown',
            ...options
        });
        return descriptor;
    };
}
