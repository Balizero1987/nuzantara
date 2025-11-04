/**
 * Master Handler Loader
 *
 * Imports all module registries to trigger auto-registration
 * Call this once at app startup to register all 136+ handlers
 */

import { globalRegistry } from './handler-registry.js';

/**
 * Load all handler modules
 * This triggers auto-registration in each module
 */
export async function loadAllHandlers() {
  console.log('🔄 Loading all handler modules...');

  try {
    // Google Workspace (8+ handlers)
    await import('../handlers/google-workspace/registry.js');

    // AI Services (10+ handlers)
    await import('../handlers/ai-services/registry.js');

    // Bali Zero (15+ handlers)
    await import('../handlers/bali-zero/registry.js');

    // ZANTARA (20+ handlers)
    await import('../handlers/zantara/registry.js');

    // Communication (10+ handlers)
    await import('../handlers/communication/registry.js');

    // Analytics (15+ handlers)
    await import('../handlers/analytics/registry.js');

    // Memory (4 handlers)
    await import('../handlers/memory/registry.js');

    // Identity (3 handlers)
    await import('../handlers/identity/registry.js');

    // RAG (4 handlers)
    await import('../handlers/rag/registry.js');

    // Maps (3 handlers)
    await import('../handlers/maps/registry.js');

    const stats = globalRegistry.getStats();
    console.log('✅ Handler loading complete:');
    console.log(`   📊 Total handlers: ${stats.totalHandlers}`);
    console.log(`   📦 Modules loaded: ${Object.keys(stats.modules).length}`);
    console.log(`   📦 Module breakdown:`, stats.modules);

    return stats;
  } catch (error) {
    console.error('❌ Error loading handlers:', error);
    throw error;
  }
}

/**
 * Get all registered handlers as a map
 * For backward compatibility with router.ts
 */
export function getAllHandlers() {
  return globalRegistry.toHandlersMap();
}
