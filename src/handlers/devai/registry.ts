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

export default devaiHandlers;

