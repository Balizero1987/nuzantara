/**
 * RAG System Module Registry
 * Python backend integration
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import {
  ragQuery,
  baliZeroChat,
  ragSearch,
  ragHealth
} from './rag.js';

export function registerRAGHandlers() {
  // RAG handlers
  globalRegistry.registerModule('rag', {
    'query': ragQuery,
    'bali.zero.chat': baliZeroChat,
    'search': ragSearch,
    'health': ragHealth
  }, { requiresAuth: true, description: 'RAG + Python backend' });

  logger.info('✅ RAG handlers registered');
}

registerRAGHandlers();
