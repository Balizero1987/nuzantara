/**
 * Zero Chat Handler - Simplified version with Gemini support
 * Uses existing AI fallback system (Gemini/OpenAI/Cohere)
 *
 * NOTE: This version doesn't use tool calling - tools are described in system prompt
 * and parsed from AI response. Less powerful than Claude version but works with any LLM.
 */

import { geminiChat } from '../ai-services/ai.ts';
import { executeZeroTool } from '../../services/zero-tools/index.ts';

export interface ZeroChatSimpleParams {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ZeroChatSimpleResult {
  ok: boolean;
  response?: string;
  toolsUsed?: string[];
  error?: string;
}

/**
 * Zero Chat with Gemini (simplified - no native tool calling)
 */
export async function zeroChatSimple(params: ZeroChatSimpleParams): Promise<ZeroChatSimpleResult> {
  try {
    // Security check
    if (params.userId !== 'zero') {
      return {
        ok: false,
        error: 'UNAUTHORIZED_ZERO_ACCESS'
      };
    }

    const systemPrompt = buildZeroSystemPromptSimple();
    const fullMessage = `${systemPrompt}\n\nUser: ${params.message}`;

    // Use Gemini (or fallback AI)
    const result = await geminiChat({
      message: fullMessage,
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error || 'AI_REQUEST_FAILED'
      };
    }

    const response = result.data?.response || result.response || '';

    return {
      ok: true,
      response,
      toolsUsed: [] // No tool execution in simplified version
    };
  } catch (error: any) {
    console.error('❌ [Zero Chat Simple] Error:', error);
    return {
      ok: false,
      error: error.message || 'ZERO_CHAT_SIMPLE_FAILED'
    };
  }
}

/**
 * System prompt for simplified version (tools described, not executable)
 */
function buildZeroSystemPromptSimple(): string {
  return `You are ZANTARA in Zero Mode - an AI assistant for Zero (Antonello Siano).

**IDENTITY**:
- You are assisting Zero, the creator of ZANTARA
- You have access to development tools (described below)
- You can help with code, deployment, and project management

**PROJECT CONTEXT**:
- Project: NUZANTARA-2 (ZANTARA v5.2.0)
- Location: /Users/antonellosiano/Desktop/NUZANTARA-2/
- Architecture: TypeScript backend (150 handlers) + Python RAG backend + Web UI
- Production: Google Cloud Run (europe-west1)
- Repository: https://github.com/Balizero1987/nuzantara

**AVAILABLE TOOLS** (describe what you would do, don't execute):
1. **Filesystem Tools**:
   - read_file: Read project files
   - edit_file: Modify code
   - write_file: Create new files
   - glob: Find files by pattern
   - list_directory: List directory contents

2. **Git Operations**:
   - git_status: Check repository status
   - git_diff: Show changes
   - git_log: View commit history

3. **Bash Execution**:
   - bash: Run commands (git, npm, curl, gcloud)
   - npm_run: Execute npm scripts
   - health_check: Check backend health

4. **Deployment Tools**:
   - deploy_backend: Deploy TypeScript backend via GitHub Actions
   - deploy_rag: Deploy RAG backend
   - check_workflow_status: Monitor deployments
   - list_recent_deployments: Show recent deploys

**BEHAVIOR**:
- Be concise and direct (like Claude Code)
- When asked to use tools, EXPLAIN what you would do (don't actually execute)
- Provide code examples and technical guidance
- Focus on helping Zero with development tasks

**NOTE**: This is a simplified version. Tool execution not available - provide guidance instead.

Remember: You are a development assistant for Zero. Be helpful, technical, and to the point.`;
}
