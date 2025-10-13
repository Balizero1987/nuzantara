/**
 * Memory & Persistence Module Registry
 */

import { globalRegistry } from '../../core/handler-registry.js';
import { memorySave, memorySearch, memoryRetrieve } from './memory-firestore.js';
import { autoSaveConversation } from './conversation-autosave.js';

export function registerMemoryHandlers() {
  // Firestore memory handlers
  globalRegistry.registerModule('memory', {
    'save': memorySave,
    'search': memorySearch,
    'retrieve': memoryRetrieve
  }, { requiresAuth: true, description: 'Firestore persistence' });

  // Conversation autosave
  globalRegistry.registerModule('memory', {
    'conversation.autosave': autoSaveConversation
  }, { requiresAuth: true, description: 'Auto-save conversations' });

  console.log('✅ Memory handlers registered');
}

registerMemoryHandlers();
