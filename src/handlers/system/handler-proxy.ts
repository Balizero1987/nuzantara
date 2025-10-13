/**
 * HANDLER PROXY
 * Allows RAG backend to execute TypeScript handlers via HTTP
 */

import { ok, err } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";

/**
 * Execute a handler by key with provided params
 * This is used by the RAG backend to execute TypeScript handlers
 *
 * @param params.handler_key - Handler to execute (e.g., "gmail.send")
 * @param params.handler_params - Parameters to pass to the handler
 * @param req - Express request (for auth context)
 */
export async function executeHandler(params: any, req?: any) {
  const { handler_key, handler_params = {} } = params;

  if (!handler_key) {
    throw new BadRequestError("handler_key is required");
  }

  // Dynamically import router to get handlers registry
  const { getHandler } = await import("../../router.js");

  const handler = await getHandler(handler_key);

  if (!handler) {
    return err(`Handler '${handler_key}' not found`);
  }

  try {
    // Execute the handler with provided params
    const result = await handler(handler_params, req);

    return ok({
      handler: handler_key,
      executed: true,
      result
    });
  } catch (error: any) {
    return err(`Handler execution failed: ${error.message}`);
  }
}

/**
 * Batch execute multiple handlers
 * Useful for orchestrating complex workflows
 */
export async function executeBatchHandlers(params: any, req?: any) {
  const { handlers = [] } = params;

  if (!Array.isArray(handlers) || handlers.length === 0) {
    throw new BadRequestError("handlers array is required");
  }

  const results = [];

  for (const handlerDef of handlers) {
    try {
      const result = await executeHandler(
        {
          handler_key: handlerDef.key,
          handler_params: handlerDef.params || {}
        },
        req
      );
      results.push(result);
    } catch (error: any) {
      results.push(err(`Handler '${handlerDef.key}' failed: ${error.message}`));
    }
  }

  return ok({
    executed: results.length,
    results
  });
}
