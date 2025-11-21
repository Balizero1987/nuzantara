/**
 * ZANTARA Vector Adapter — Qdrant (standby)
 */
// Commenting out Qdrant dependency for now - package not installed
// import { QdrantClient } from "@qdrant/js-client-rest";
import logger from '../logger';

export default function qdrantStore() {
  logger.warn('⚠️ Qdrant not available - package not installed');

  return {
    name: 'qdrant',
    async ping() {
      logger.info('❌ Qdrant store disabled - package not installed');
      return false;
    },
    async similaritySearch() {
      logger.warn('Qdrant similarity search disabled - fallback to memory store');
      return [];
    },
  };
}

// Legacy fallback function
export function qdrantLegacyStore() {
  logger.warn('⚠️ Qdrant backend in standby mode — no active operations');

  return {
    name: 'qdrant-legacy',
    async ping() {
      logger.info('❌ Qdrant legacy disabled - package not installed');
      return false;
    },
    async similaritySearch() {
      logger.warn('Qdrant legacy similarity search disabled');
      return [];
    },
  };
}
