/**
 * DevAI Handler Registry
 * Registers all DevAI (Qwen 2.5 Coder) handlers
 */
import { analyzeCode, fixBugs, reviewCode, explainCode, generateTests, suggestRefactoring, devaiChat } from './devai-qwen.js';
import { devaiCallZantara, devaiOrchestrateWorkflow, devaiDevelopmentWorkflow, devaiGetConversationHistory, devaiGetSharedContext, devaiClearWorkflow } from './devai-bridge.js';
import { devaiWarmup } from './devai-warmup.js';
export const devaiHandlers = {
    // Core chat
    'devai.chat': devaiChat,
    // Warm-up (keeps RunPod workers alive)
    'devai.warmup': devaiWarmup,
    // Task-specific
    'devai.analyze': analyzeCode,
    'devai.fix': fixBugs,
    'devai.review': reviewCode,
    'devai.explain': explainCode,
    'devai.generate-tests': generateTests,
    'devai.refactor': suggestRefactoring,
    // DevAI Bridge handlers for AI communication
    'devai.call-zantara': devaiCallZantara,
    'devai.orchestrate': devaiOrchestrateWorkflow,
    'devai.workflow': devaiDevelopmentWorkflow,
    'devai.history': devaiGetConversationHistory,
    'devai.context': devaiGetSharedContext,
    'devai.clear': devaiClearWorkflow
};
export default devaiHandlers;
