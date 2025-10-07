/**
 * HANDLERS INTROSPECTION
 * Exposes complete handler registry for RAG backend tool use
 */

import { ok } from "../../utils/response.js";

/**
 * Handler metadata extracted from JSDoc comments in router.ts
 */
import { HANDLER_REGISTRY, HandlerMetadata } from './handler-metadata.js';

/**
 * Get all handlers metadata
 */
export async function getAllHandlers() {
  return ok({
    total: Object.keys(HANDLER_REGISTRY).length,
    handlers: HANDLER_REGISTRY,
    categories: getCategories()
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
function getCategories() {
  const categories = new Set(Object.values(HANDLER_REGISTRY).map(h => h.category));
  return Array.from(categories).sort();
}

/**
 * Generate Anthropic tool definitions for all handlers
 */
export async function getAnthropicToolDefinitions() {
  const tools = Object.values(HANDLER_REGISTRY).map(handler => {
    // Clean properties: remove 'required' field (it goes in separate array)
    const properties: Record<string, any> = {};
    if (handler.params) {
      for (const [key, value] of Object.entries(handler.params)) {
        properties[key] = {
          type: value.type,
          description: value.description
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
          .filter(([_, meta]) => meta.required)
          .map(([name, _]) => name)
      }
    };
  });

  return ok({
    total: tools.length,
    tools
  });
}
