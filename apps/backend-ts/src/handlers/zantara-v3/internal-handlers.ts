/**
 * Internal Handlers for v3 Ω Endpoints
 *
 * Eliminates self-recursion by providing direct handler functions
 * that can be called internally without HTTP overhead
 */

import { zantaraUnifiedQuery } from './zantara-unified.js';
import { zantaraCollectiveIntelligence } from './zantara-collective.js';
import { zantaraEcosystemAnalysis } from './zantara-ecosystem.js';
import { internalServiceRegistry } from '../../services/architecture/internal-service-registry.js';
import logger from '../../services/logger.js';

/**
 * Adapter to convert Express handler to internal handler
 */
function expressToInternal(expressHandler: any) {
  return async (params: any, _context?: any) => {
    try {
      // Create mock req/res for Express handler compatibility
      const mockRes = {
        json: (data: any) => data,
        status: (_code: number) => mockRes,
        headersSent: false,
      };

      const mockReq = {
        body: { params },
        headers: {},
        query: {},
        ip: '127.0.0.1',
      };

      // Call Express handler
      const result = await expressHandler(mockReq, mockRes);
      return result || mockRes.json?.({ ok: false, error: 'Handler returned no response' });
    } catch (error) {
      logger.error('Internal handler adapter error:', error);
      return { ok: false, error: error.message };
    }
  };
}

/**
 * Register all v3 Ω handlers as internal services
 */
export function registerV3InternalHandlers(): void {
  logger.info('🔧 Registering v3 Ω internal handlers...');

  // Register unified handler
  const unifiedInternal = expressToInternal(zantaraUnifiedQuery);
  internalServiceRegistry.registerHandler('unified', unifiedInternal);

  // Register collective handler
  const collectiveInternal = expressToInternal(zantaraCollectiveIntelligence);
  internalServiceRegistry.registerHandler('collective', collectiveInternal);

  // Register ecosystem handler
  const ecosystemInternal = expressToInternal(zantaraEcosystemAnalysis);
  internalServiceRegistry.registerHandler('ecosystem', ecosystemInternal);

  logger.info(
    `✅ Registered ${internalServiceRegistry.getHandlers().length} v3 Ω internal handlers`
  );
}

/**
 * Get handler performance metrics
 */
export function getHandlerMetrics(): { [key: string]: any } {
  return {
    registeredHandlers: internalServiceRegistry.getHandlers(),
    registrationStatus: 'active',
    selfRecursionFixed: true,
  };
}
