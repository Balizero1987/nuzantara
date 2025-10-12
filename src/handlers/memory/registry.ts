/**
 * Memory & Persistence Module Registry
 */

import { globalRegistry } from '../../core/handler-registry.js';
import { memorySave, memorySearch, memoryRetrieve } from './memory-firestore.js';
import { autoSaveConversation } from './conversation-autosave.js';
import type { HandlerFunction } from '../../core/handler-registry.js';
import { userMemorySave, userMemoryRetrieve, userMemoryList, userMemoryLogin } from './user-memory.js';

export function registerMemoryHandlers() {
  // Firestore memory handlers
  globalRegistry.registerModule('memory', {
    'save': memorySave as any,
    'search': memorySearch as any,
    'retrieve': memoryRetrieve as any,
    'user.memory.save': userMemorySave as any,
    'user.memory.retrieve': userMemoryRetrieve as any,
    'user.memory.list': userMemoryList as any,
    'user.memory.login': userMemoryLogin as any,
  } as any, { requiresAuth: true, description: 'Firestore persistence' });

  // Conversation autosave
  // Adapt autosave signature (req, prompt, response, handler, metadata?)
  const autoSaveAdapter: HandlerFunction = async (params: any, req?: any) => {
    return autoSaveConversation(
      req,
      params?.prompt ?? '',
      params?.response ?? '',
      params?.handler ?? 'unknown',
      params?.metadata
    );
  };

  globalRegistry.registerModule('memory', {
    'conversation.autosave': autoSaveAdapter
  }, { requiresAuth: true, description: 'Auto-save conversations' });

  console.log('✅ Memory handlers registered');
}

registerMemoryHandlers();
