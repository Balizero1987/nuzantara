// ZANTARA Handlers Loader v1.0
// Frontend utility to load and manage handlers registry

const HANDLERS_REGISTRY_CACHE_KEY = 'zantara_handlers_registry';
const CACHE_TTL = 3600000; // 1 hour
const BASE_URL = 'https://nuzantara-rag.fly.dev';

/**
 * Load handlers registry from backend API
 */
export async function loadHandlersRegistry() {
  console.log('[HandlersLoader] Loading handlers registry...');

  try {
    const response = await fetch(`${BASE_URL}/api/handlers/list`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to load handlers');
    }

    // Cache in localStorage with TTL
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
      version: '1.0'
    };

    localStorage.setItem(HANDLERS_REGISTRY_CACHE_KEY, JSON.stringify(cacheData));

    console.log(`[HandlersLoader] Loaded ${data.total} handlers successfully`);
    console.log(`[HandlersLoader] Categories: ${Object.keys(data.categories).join(', ')}`);

    return data;

  } catch (error) {
    console.error('[HandlersLoader] Failed to load handlers:', error);

    // Try to return cached data if available
    const cached = getCachedHandlersRegistry();
    if (cached) {
      console.log('[HandlersLoader] Using cached registry as fallback');
      return cached;
    }

    throw error;
  }
}

/**
 * Get cached handlers registry
 */
export function getHandlersRegistry() {
  try {
    const cached = localStorage.getItem(HANDLERS_REGISTRY_CACHE_KEY);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    // Check TTL
    if (Date.now() - parsed.timestamp > parsed.ttl) {
      console.log('[HandlersLoader] Cache expired');
      localStorage.removeItem(HANDLERS_REGISTRY_CACHE_KEY);
      return null;
    }

    console.log(`[HandlersLoader] Using cached registry (${Math.round((Date.now() - parsed.timestamp) / 1000)}s old)`);
    return parsed.data;

  } catch (error) {
    console.error('[HandlersLoader] Error reading cache:', error);
    return null;
  }
}

/**
 * Clear handlers registry cache
 */
export function clearHandlersCache() {
  localStorage.removeItem(HANDLERS_REGISTRY_CACHE_KEY);
  console.log('[HandlersLoader] Cache cleared');
}

/**
 * Format handlers for ZANTARA's system prompt
 */
export function formatHandlersForZantara(handlersData) {
  if (!handlersData || !handlersData.handlers) {
    return {
      system_context: "No handlers available",
      handlers_list: [],
      available_tools: 0
    };
  }

  const handlers = handlersData.handlers;
  const categories = handlersData.categories;

  // Build system context
  let systemContext = `
## AVAILABLE TOOLS (${handlersData.total} handlers)

You have autonomous access to these handlers. When you need specific data, call them directly using this format:
CALL_HANDLER[handler_name](param1, param2, param3)

### CRITICAL: ZANTARA v3 Ω Core Handlers
These are your primary intelligence endpoints - USE THESE FIRST:

`;

  // Add ZANTARA core handlers first
  const zantaraHandlers = Object.entries(handlers)
    .filter(([name, config]) => config.category === 'zantara_core')
    .sort((a, b) => a[0].localeCompare(b[0]));

  zantaraHandlers.forEach(([name, config]) => {
    systemContext += `
**${name}**: ${config.description}
Usage: CALL_HANDLER[${name}](${config.params.join(', ')})
Examples: ${config.examples?.map(ex => ex.call).join(' | ') || 'N/A'}

`;
  });

  // Add other handlers by category
  const otherCategories = Object.entries(categories)
    .filter(([catName]) => catName !== 'zantara_core')
    .sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a[1].priority] - priority[b[1].priority];
    });

  otherCategories.forEach(([catName, catInfo]) => {
    const catHandlers = Object.entries(handlers)
      .filter(([name, config]) => config.category === catName)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (catHandlers.length > 0) {
      systemContext += `
### ${catInfo.name} (${catInfo.priority} priority)
${catInfo.description}

`;

      catHandlers.forEach(([name, config]) => {
        systemContext += `
**${name}**: ${config.description}
Usage: CALL_HANDLER[${name}](${config.params.join(', ')})
Examples: ${config.examples?.map(ex => ex.call).join(' | ') || 'N/A'}

`;
      });
    }
  });

  systemContext += `
## EXECUTION PATTERN

1. **Always try ZANTARA core handlers first** - they provide unified access to all knowledge
2. Use specific handlers for detailed, real-time data
3. Chain multiple handlers for complex queries
4. Include relevant parameters for accurate results

## ERROR HANDLING

If a handler fails, try alternative approaches:
- Use zantara_unified_query with broader parameters
- Try related handlers in the same category
- Fall back to general knowledge if all handlers fail

Remember: You are ZANTARA v3 Ω - these handlers extend your intelligence capabilities.
`;

  // Format handlers list for quick reference
  const handlersList = Object.entries(handlers).map(([name, config]) => ({
    name,
    description: config.description,
    category: config.category,
    params: config.params,
    backend: config.backend,
    priority: categories[config.category]?.priority || 'medium',
    example: config.examples?.[0]?.call || `CALL_HANDLER[${name}](${config.params.join(', ')})`
  }));

  return {
    system_context: systemContext,
    handlers_list: handlersList,
    available_tools: handlersData.total,
    categories: Object.keys(categories),
    statistics: handlersData.statistics,
    timestamp: new Date().toISOString()
  };
}

/**
 * Execute a handler via the API
 */
export async function executeHandler(handlerName, params = {}) {
  console.log(`[HandlersLoader] Executing handler: ${handlerName}`, params);

  try {
    const response = await fetch(`${BASE_URL}/api/handlers/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handler_name: handlerName,
        params: params,
        timeout: 30
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[HandlersLoader] Handler ${handlerName} executed successfully`);

    return result;

  } catch (error) {
    console.error(`[HandlersLoader] Handler ${handlerName} execution failed:`, error);
    throw error;
  }
}

/**
 * Execute multiple handlers in parallel
 */
export async function executeHandlersBatch(calls) {
  console.log(`[HandlersLoader] Executing ${calls.length} handlers in parallel`);

  try {
    const response = await fetch(`${BASE_URL}/api/handlers/batch-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calls: calls.map(call => ({
          handler_name: call.handlerName,
          params: call.params || {},
          timeout: call.timeout || 30
        })),
        timeout: 30
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const results = await response.json();
    console.log(`[HandlersLoader] Batch execution completed: ${results.length} results`);

    return results;

  } catch (error) {
    console.error('[HandlersLoader] Batch execution failed:', error);
    throw error;
  }
}

/**
 * Get handlers by category
 */
export function getHandlersByCategory(handlersData, categoryName) {
  if (!handlersData || !handlersData.handlers) {
    return [];
  }

  return Object.entries(handlersData.handlers)
    .filter(([name, config]) => config.category === categoryName)
    .map(([name, config]) => ({ name, ...config }));
}

/**
 * Search handlers by name or description
 */
export function searchHandlers(handlersData, query) {
  if (!handlersData || !handlersData.handlers || !query) {
    return [];
  }

  const searchQuery = query.toLowerCase();

  return Object.entries(handlersData.handlers)
    .filter(([name, config]) =>
      name.toLowerCase().includes(searchQuery) ||
      config.description.toLowerCase().includes(searchQuery) ||
      config.category.toLowerCase().includes(searchQuery)
    )
    .map(([name, config]) => ({ name, ...config }));
}

/**
 * Validate handler parameters
 */
export function validateHandlerParams(handlerConfig, params) {
  const requiredParams = handlerConfig.params || [];
  const missingParams = requiredParams.filter(param => !(param in params));

  return {
    valid: missingParams.length === 0,
    missing: missingParams,
    provided: Object.keys(params)
  };
}