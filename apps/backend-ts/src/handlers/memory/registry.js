/**
 * Memory & Persistence Module Registry
 */
import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { memorySave, memorySearch, memoryRetrieve } from './memory-firestore.js';
import { autoSaveConversation } from './conversation-autosave.js';
import { userMemorySave, userMemoryRetrieve, userMemoryList, userMemoryLogin } from './user-memory.js';
export function registerMemoryHandlers() {
    // Firestore memory handlers
    globalRegistry.registerModule('memory', {
        'save': memorySave,
        'search': memorySearch,
        'retrieve': memoryRetrieve,
        'user.memory.save': userMemorySave,
        'user.memory.retrieve': userMemoryRetrieve,
        'user.memory.list': userMemoryList,
        'user.memory.login': userMemoryLogin,
    }, { requiresAuth: true, description: 'Firestore persistence' });
    // Conversation autosave
    // Adapt autosave signature (req, prompt, response, handler, metadata?)
    const autoSaveAdapter = async (params, req) => {
        return autoSaveConversation(req, params?.prompt ?? '', params?.response ?? '', params?.handler ?? 'unknown', params?.metadata);
    };
    globalRegistry.registerModule('memory', {
        'conversation.autosave': autoSaveAdapter
    }, { requiresAuth: true, description: 'Auto-save conversations' });
    logger.info('✅ Memory handlers registered');
}
registerMemoryHandlers();
