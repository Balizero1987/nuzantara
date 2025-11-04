import express, { type Request, type Response, type NextFunction, type Router } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { RouteRegistry } from './route-registry.js';
import { RouteAnalytics, type RequestMetadata } from './route-analytics.js';

// Core handler pattern: business logic returns a value; the router sends it if not already sent
export type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'all';

export type Handler<
  Params = Record<string, unknown>,
  Query = Record<string, unknown>,
  Body = unknown,
  Result = unknown,
> = (ctx: {
  req: Request<Params, unknown, Body, Query>;
  res: Response;
  next: NextFunction;
}) => Promise<Result | void> | Result | void;

export type ValidationSchemas = {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
  response?: ZodTypeAny;
};

export type RouteDefinition = {
  method: HTTPMethod;
  path: string;
  handler: Handler<any, any, any, any>;
  name?: string; // optional identifier for metrics
  middlewares?: Array<express.RequestHandler>;
  validate?: ValidationSchemas;
};

/**
 * Router configuration options
 */
export interface RouterOptions {
  enableRegistry?: boolean; // Enable conflict detection (default: true)
  enableAnalytics?: boolean; // Enable performance tracking (default: true)
  strictMode?: boolean; // Throw on conflicts (default: false, warns instead)
}

/**
 * Global router state (singleton pattern)
 */
class RouterState {
  private static instance: RouterState;
  readonly registry: RouteRegistry;
  readonly analytics: RouteAnalytics;

  private constructor() {
    this.registry = new RouteRegistry();
    this.analytics = new RouteAnalytics();
  }

  static getInstance(): RouterState {
    if (!RouterState.instance) {
      RouterState.instance = new RouterState();
    }
    return RouterState.instance;
  }

  reset(): void {
    this.registry.clear();
    this.analytics.clear();
  }
}

export function defineRoutes<T extends RouteDefinition[]>(...routes: T): T {
  return routes;
}

function validationMiddleware(schemas?: ValidationSchemas): express.RequestHandler | null {
  if (!schemas) return null;
  return (req, res, next) => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).validatedParams = parsed;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).validatedQuery = parsed;
      }
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).validatedBody = parsed;
      }
      next();
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in (err as any)) {
        return res.status(400).json({ error: 'ValidationError', details: (err as any).issues });
      }
      next(err);
    }
  };
}

function responseValidationWrapper(
  handler: RouteDefinition['handler'],
  respSchema?: ZodTypeAny,
  routeDef?: RouteDefinition,
  enableAnalytics = true
): express.RequestHandler {
  return (req, res, next) => {
    const startTime = Date.now();
    let statusCode = 200;
    let hadError = false;

    // Override res.status to capture status code
    const originalStatus = res.status.bind(res);
    res.status = (code: number) => {
      statusCode = code;
      return originalStatus(code);
    };

    Promise.resolve(handler({ req, res, next }))
      .then((result) => {
        if (res.headersSent) {
          // Record analytics if enabled
          if (enableAnalytics && routeDef) {
            const duration = Date.now() - startTime;
            const state = RouterState.getInstance();
            const metadata: RequestMetadata = {
              method: routeDef.method,
              path: routeDef.path,
              statusCode,
              duration,
              timestamp: Date.now(),
              error: hadError,
            };
            state.analytics.recordRequest(metadata);
          }
          return;
        }

        if (result === undefined) {
          res.status(204).end();
          statusCode = 204;
        } else if (respSchema) {
          const parsed = respSchema.parse(result);
          res.json(parsed);
        } else {
          res.json(result as unknown as object);
        }

        // Record analytics
        if (enableAnalytics && routeDef) {
          const duration = Date.now() - startTime;
          const state = RouterState.getInstance();
          const metadata: RequestMetadata = {
            method: routeDef.method,
            path: routeDef.path,
            statusCode,
            duration,
            timestamp: Date.now(),
            error: hadError,
          };
          state.analytics.recordRequest(metadata);
        }
      })
      .catch((err) => {
        hadError = true;
        statusCode = res.statusCode || 500;

        // Record error analytics
        if (enableAnalytics && routeDef) {
          const duration = Date.now() - startTime;
          const state = RouterState.getInstance();
          const metadata: RequestMetadata = {
            method: routeDef.method,
            path: routeDef.path,
            statusCode,
            duration,
            timestamp: Date.now(),
            error: true,
          };
          state.analytics.recordRequest(metadata);
        }

        next(err);
      });
  };
}

/**
 * Process and log route conflicts
 */
function processRouteConflicts(registry: RouteRegistry, strictMode: boolean): void {
  const conflicts = registry.getConflicts();
  if (conflicts.length === 0) return;

  const errors = conflicts.filter((c) => c.severity === 'error');
  const warnings = conflicts.filter((c) => c.severity === 'warning');

  if (warnings.length > 0) {
    console.warn('⚠️  Route registration warnings:');
    for (const warning of warnings) {
      console.warn(`   ${warning.message}`);
    }
  }

  if (errors.length > 0) {
    const message = errors.map((e) => e.message).join('\n');
    if (strictMode) {
      throw new Error(`Route registration errors:\n${message}`);
    }
    console.error('❌ Route registration errors:');
    for (const error of errors) {
      console.error(`   ${error.message}`);
    }
  }
}

/**
 * Log successful route registration
 */
function logRegistrationSuccess(registry: RouteRegistry): void {
  const stats = registry.getStats();
  const methodCounts = Object.entries(stats.routesByMethod)
    .map(([method, count]) => `${count} ${method}`)
    .join(', ');
  console.log(`✅ Registered ${stats.totalRoutes} routes: ${methodCounts}`);
}

// Build an Express Router from route definitions with minimal overhead
export function registerRoutes(
  defs: RouteDefinition[] | Record<string, RouteDefinition[]>,
  options: RouterOptions = {}
): Router {
  const { enableRegistry = true, enableAnalytics = true, strictMode = false } = options;

  const router = express.Router({ strict: true, caseSensitive: true, mergeParams: true });
  const list: RouteDefinition[] = Array.isArray(defs) ? defs : Object.values(defs).flat();
  const state = RouterState.getInstance();

  // Register routes with conflict detection
  if (enableRegistry) {
    state.registry.registerMany(list);
    processRouteConflicts(state.registry, strictMode);
    logRegistrationSuccess(state.registry);
  }

  // Build Express router
  for (const def of list) {
    const method = def.method.toLowerCase() as Lowercase<HTTPMethod>;
    const validateMw = validationMiddleware(def.validate);
    const chain = [
      ...(def.middlewares ?? []),
      ...(validateMw ? [validateMw] : []),
      responseValidationWrapper(def.handler, def.validate?.response, def, enableAnalytics),
    ];

    const registrar = (router as unknown as Record<string, Function | undefined>)[method];
    if (!registrar) throw new Error(`Unsupported method: ${method}`);
    registrar.call(router, def.path, ...chain);
  }

  return router;
}

// Common Zod helpers for reuse by handlers
export const zQuery = <T extends ZodTypeAny>(schema: T) => schema;
export const zParams = <T extends ZodTypeAny>(schema: T) => schema;
export const zBody = <T extends ZodTypeAny>(schema: T) => schema;
export const zResponse = <T extends ZodTypeAny>(schema: T) => schema;

export const schemas = { z, zQuery, zParams, zBody, zResponse };

/**
 * Get the global route registry
 */
export function getRouteRegistry(): RouteRegistry {
  return RouterState.getInstance().registry;
}

/**
 * Get the global route analytics
 */
export function getRouteAnalytics(): RouteAnalytics {
  return RouterState.getInstance().analytics;
}

/**
 * Reset global router state (useful for testing)
 */
export function resetRouterState(): void {
  RouterState.getInstance().reset();
}
