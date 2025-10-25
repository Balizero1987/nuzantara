/**
 * Master Handler Loader
 *
 * Imports all module registries to trigger auto-registration
 * Call this once at app startup to register all 136+ handlers
 */

import logger from '../services/logger.js';
import { globalRegistry } from './handler-registry.js';

/**
 * Load all handler modules
 * This triggers auto-registration in each module
 */
export async function loadAllHandlers() {
  logger.info('🔄 Loading all handler modules...');

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

    // PRIORITY 5: Memory handlers removed (Firestore deprecated - using Python memory)
    // await import('../handlers/memory/registry.js');

    // Identity (3 handlers)
    await import('../handlers/identity/registry.js');

    // RAG (4 handlers)
    await import('../handlers/rag/registry.js');

    // Maps (3 handlers)
    await import('../handlers/maps/registry.js');

    // Intel (5 handlers - news & scraping)
    await import('../handlers/intel/registry.js');

    // DevAI removed - now using ZANTARA-ONLY mode

    const stats = globalRegistry.getStats();
    logger.info('✅ Handler loading complete:');
    logger.info(`   📊 Total handlers: ${stats.totalHandlers}`);
    logger.info(`   📦 Modules loaded: ${Object.keys(stats.modules).length}`);
    logger.info(`   📦 Module breakdown:`, stats.modules);

    return stats;
  } catch (error) {
    logger.error('❌ Error loading handlers:', error);
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

/**
 * Auto-execute handler loading when this module is imported
 * This ensures all handlers are registered at app startup
 */
loadAllHandlers().catch(err => {
  logger.error('❌ Critical: Handler loading failed:', err);
  process.exit(1);
});
