/**
 * Admin: Handler Registry Diagnostics
 *
 * Provides insights into registered handlers
 * Useful for debugging and monitoring
 */

import { globalRegistry } from "../../core/handler-registry.js";
import { ok } from "../../utils/response.js";

/**
 * GET /admin/handlers/list
 * List all registered handlers
 */
export async function listAllHandlers(_params: any, _req?: any) {
  const handlers = globalRegistry.list();

  return ok({
    total: handlers.length,
    handlers: handlers
  });
}

/**
 * GET /admin/handlers/stats
 * Get registry statistics
 */
export async function getHandlerStats(_params: any, _req?: any) {
  const stats = globalRegistry.getStats();

  return ok({
    ...stats,
    timestamp: new Date().toISOString()
  });
}

/**
 * GET /admin/handlers/module/:module
 * List handlers in a specific module
 */
export async function listModuleHandlers(params: any, _req?: any) {
  const { module } = params;

  if (!module) {
    return ok({
      error: "Module name required",
      availableModules: Object.keys(globalRegistry.getStats().modules)
    });
  }

  const handlers = globalRegistry.listByModule(module);

  return ok({
    module,
    total: handlers.length,
    handlers
  });
}

/**
 * GET /admin/handlers/search
 * Search handlers by keyword
 */
export async function searchHandlers(params: any, _req?: any) {
  const { query = '' } = params;

  if (!query) {
    return ok({
      error: "Search query required",
      example: "/admin/handlers/search?query=gmail"
    });
  }

  const allHandlers = globalRegistry.list();
  const matches = allHandlers.filter(h => h.toLowerCase().includes(query.toLowerCase()));

  return ok({
    query,
    total: matches.length,
    matches
  });
}

// Auto-register admin handlers
globalRegistry.registerModule('admin', {
  'list': listAllHandlers,
  'stats': getHandlerStats,
  'module': listModuleHandlers,
  'search': searchHandlers
}, {
  requiresAuth: true,  // Admin only
  version: '1.0'
});
