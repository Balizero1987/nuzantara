/**
 * DYNAMIC HANDLERS LIST
 *
 * Generates a concise list of all available handlers
 * for inclusion in AI system prompts.
 *
 * This gives ZANTARA awareness of what it can do.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Handle both ESM and CommonJS (Jest) environments
const getFilename = () => {
  if (typeof __filename !== 'undefined') return __filename; // CommonJS/Jest
  return fileURLToPath(import.meta.url); // ESM
};

const getDirname = () => {
  if (typeof __dirname !== 'undefined') return __dirname; // CommonJS/Jest
  return dirname(getFilename()); // ESM
};

const _currentFilename = getFilename();
const currentDirname = getDirname();

interface HandlerInfo {
  key: string;
  category: string;
  description: string;
}

let cachedHandlersList: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Extract handlers from router.ts with descriptions
 */
function extractHandlers(): HandlerInfo[] {
  // Try .ts first (dev), then .js (production)
  const routerPathTS = join(currentDirname, '../router.ts');
  const routerPathJS = join(currentDirname, '../router.ts');

  let routerPath = routerPathTS;
  try {
    readFileSync(routerPathTS, 'utf-8');
  } catch {
    routerPath = routerPathJS;
  }

  const content = readFileSync(routerPath, 'utf-8');

  const handlers: HandlerInfo[] = [];

  // Extract handler blocks with JSDoc
  const handlerBlockRegex = /\/\*\*[\s\S]*?@handler\s+([a-z.]+)[\s\S]*?@description\s+(.*?)(?=@|\*\/)/g;
  let match;

  while ((match = handlerBlockRegex.exec(content)) !== null) {
    const key = match[1];
    const description = match[2]?.trim().replace(/\s+/g, ' ').slice(0, 100) || '';
    const category = key?.split('.')[0] || 'unknown';

    handlers.push({ key: key || '', category, description });
  }

  // Also extract simple handlers (without JSDoc) from handlers object
  const simpleHandlerRegex = /"([a-z.]+)":\s*\w+/g;
  while ((match = simpleHandlerRegex.exec(content)) !== null) {
    const key = match[1];
    if (key && !handlers.find(h => h.key === key)) {
      const category = key.split('.')[0] || 'unknown';
      handlers.push({ key, category, description: '' });
    }
  }

  return handlers.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Generate concise handlers list for system prompt
 */
export function getHandlersList(): string {
  // Check cache
  const now = Date.now();
  if (cachedHandlersList && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedHandlersList;
  }

  try {
    const handlers = extractHandlers();

    // Group by category
    const byCategory = new Map<string, HandlerInfo[]>();
    for (const h of handlers) {
      if (!byCategory.has(h.category)) {
        byCategory.set(h.category, []);
      }
      byCategory.get(h.category)!.push(h);
    }

    // Generate concise list
    let list = `## Available Handlers (${handlers.length})\n\n`;

    for (const [category, catHandlers] of Array.from(byCategory.entries()).sort()) {
      list += `**${category}** (${catHandlers.length}): `;
      list += catHandlers.map(h => h.key).join(', ');
      list += '\n\n';
    }

    list += `\nTo use a handler, respond with a tool call or mention it in your response.\n`;
    list += `Example: "I can help with that using the drive.upload handler"\n`;

    cachedHandlersList = list;
    cacheTimestamp = now;

    return list;
  } catch (error) {
    console.error('[handlers-list] Error generating list:', error);
    return 'Handlers list temporarily unavailable';
  }
}

/**
 * Get detailed info about a specific handler
 */
export function getHandlerInfo(handlerKey: string): string | null {
  try {
    const handlers = extractHandlers();
    const handler = handlers.find(h => h.key === handlerKey);

    if (!handler) return null;

    let info = `## ${handler.key}\n\n`;
    if (handler.description) {
      info += `${handler.description}\n\n`;
    }
    info += `Category: ${handler.category}\n`;

    return info;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a handler exists
 */
export function handlerExists(handlerKey: string): boolean {
  try {
    const handlers = extractHandlers();
    return handlers.some(h => h.key === handlerKey);
  } catch (error) {
    return false;
  }
}
