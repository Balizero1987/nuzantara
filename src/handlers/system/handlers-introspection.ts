/**
 * HANDLERS INTROSPECTION
 * Exposes complete handler registry for RAG backend tool use
 */

import { ok } from "../../utils/response.js";

/**
 * Handler metadata extracted from JSDoc comments in router.ts (DEPRECATED - used as fallback only)
 */
import { HANDLER_REGISTRY } from './handler-metadata.js';

/**
 * Dynamic handler registry (auto-loaded from modules)
 */
import { globalRegistry } from '../../core/handler-registry.js';

/**
 * Get all handlers metadata
 * Uses dynamic globalRegistry (auto-loaded) + static HANDLER_REGISTRY (fallback)
 */
export async function getAllHandlers() {
  // Get handlers from dynamic registry
  const dynamicHandlers = globalRegistry.list();

  // Merge with static registry for backward compatibility
  const mergedHandlers: Record<string, any> = { ...HANDLER_REGISTRY };

  // Add dynamic handlers that aren't in static registry
  for (const handlerKey of dynamicHandlers) {
    if (!mergedHandlers[handlerKey]) {
      const metadata = globalRegistry.get(handlerKey);
      if (metadata) {
        mergedHandlers[handlerKey] = {
          key: handlerKey,
          category: metadata.module,
          description: metadata.description || `Handler from ${metadata.module} module`,
          params: {},
          returns: "Dynamic handler - check implementation for details"
        };
      }
    }
  }

  return ok({
    total: Object.keys(mergedHandlers).length,
    handlers: mergedHandlers,
    categories: getCategories(mergedHandlers),
    sources: {
      static: Object.keys(HANDLER_REGISTRY).length,
      dynamic: dynamicHandlers.length,
      merged: Object.keys(mergedHandlers).length
    }
  });
}

/**
 * Get handlers by category
 */
export async function getHandlersByCategory(params: { category: string }) {
  const filtered = Object.values(HANDLER_REGISTRY).filter(
    h => h.category === params.category
  );

  return ok({
    category: params.category,
    count: filtered.length,
    handlers: filtered
  });
}

/**
 * Get handler details
 */
export async function getHandlerDetails(params: { key: string }) {
  const handler = HANDLER_REGISTRY[params.key];

  if (!handler) {
    return {
      ok: false,
      error: `Handler '${params.key}' not found`
    };
  }

  return ok(handler);
}

/**
 * Get all categories
 */
function getCategories(handlersMap: Record<string, any>) {
  const categories = new Set(Object.values(handlersMap).map((h: any) => h.category));
  return Array.from(categories).sort();
}

/**
 * Generate Anthropic tool definitions for all handlers
 * Uses merged registry (dynamic + static)
 */
export async function getAnthropicToolDefinitions() {
  // Get merged handlers (dynamic + static)
  const allHandlersResponse = await getAllHandlers();
  const allHandlers = allHandlersResponse.data.handlers;

  const tools = Object.values(allHandlers).map((handler: any) => {
    // Clean properties: remove 'required' field (it goes in separate array)
    const properties: Record<string, any> = {};
    if (handler.params) {
      for (const [key, value] of Object.entries(handler.params)) {
        const paramMeta = value as any;
        properties[key] = {
          type: paramMeta.type || 'string',
          description: paramMeta.description || ''
        };
      }
    }

    return {
      name: handler.key.replace(/\./g, '_'), // Anthropic doesn't allow dots in tool names
      description: handler.description,
      input_schema: {
        type: "object",
        properties,
        required: Object.entries(handler.params || {})
          .filter(([_, meta]: any) => meta.required)
          .map(([name, _]) => name)
      }
    };
  });

  return ok({
    total: tools.length,
    tools,
    sources: allHandlersResponse.data.sources
  });
}
