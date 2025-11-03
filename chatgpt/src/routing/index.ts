/**
 * Unified Routing System with Guardrails and Analytics
 * 
 * @module routing
 */

// Core router
export {
  registerRoutes,
  defineRoutes,
  getRouteRegistry,
  getRouteAnalytics,
  resetRouterState,
  schemas,
  zQuery,
  zParams,
  zBody,
  zResponse,
} from './unified-router.js';

export type {
  HTTPMethod,
  Handler,
  ValidationSchemas,
  RouteDefinition,
  RouterOptions,
} from './unified-router.js';

// Route Registry
export { RouteRegistry, ConflictType } from './route-registry.js';

export type {
  RouteConflict,
  RouteInfo,
  RegistryStats,
} from './route-registry.js';

// Route Analytics
export { RouteAnalytics } from './route-analytics.js';

export type {
  RequestTiming,
  RouteAnalyticsData,
  RequestMetadata,
  AnalyticsSummary,
} from './route-analytics.js';
