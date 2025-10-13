/**
 * DevAI Handler Registry
 * Registers all DevAI (Qwen 2.5 Coder) handlers
 */

import { 
  analyzeCode, 
  fixBugs, 
  reviewCode, 
  explainCode, 
  generateTests, 
  suggestRefactoring,
  devaiChat 
} from './devai-qwen.js';
import { globalRegistry } from '../../core/handler-registry.js';

export const devaiHandlers = {
  // Core chat
  'devai.chat': devaiChat,
  
  // Task-specific
  'devai.analyze': analyzeCode,
  'devai.fix': fixBugs,
  'devai.review': reviewCode,
  'devai.explain': explainCode,
  'devai.generate-tests': generateTests,
  'devai.refactor': suggestRefactoring
};

// Auto-register into global registry for system introspection/tooling
try {
  for (const [key, handler] of Object.entries(devaiHandlers)) {
    globalRegistry.register({
      key,
      handler: handler as any,
      module: 'devai',
      description: 'DevAI code assistant handler'
    });
  }
} catch {
  // no-op if registry not available at import time
}

export default devaiHandlers;
