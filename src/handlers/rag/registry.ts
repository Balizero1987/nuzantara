/**
 * RAG System Module Registry
 * Python backend integration
 */

import { globalRegistry } from '../../core/handler-registry.ts';
import {
  ragQuery,
  baliZeroChat,
  ragSearch,
  ragHealth
} from './rag.ts';

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
