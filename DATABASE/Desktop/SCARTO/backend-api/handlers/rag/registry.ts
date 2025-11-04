/**
 * RAG System Module Registry
 * Python backend integration
 */

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

  console.log('✅ RAG handlers registered');
}

registerRAGHandlers();
