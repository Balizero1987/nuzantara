/**
 * Zero Chat Handler - Claude Code-like assistant for Zero
 *
 * When userId === 'zero', ZANTARA gains access to:
 * - File operations (read, edit, write)
 * - Bash execution
 * - Git operations
 * - Deployment triggers
 * - Production monitoring
 *
 * Security: ZERO_ONLY access enforced via middleware
 */

import Anthropic from '@anthropic-ai/sdk';
import { ZERO_TOOLS, executeZeroTool } from '../../services/zero-tools/index.ts';

const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY or CLAUDE_API_KEY not configured');
  }
  return new Anthropic({ apiKey });
};

const MODEL = 'claude-sonnet-4-20250514'; // Latest Sonnet with tool use

// Gemini fallback (if Anthropic fails)
import { GoogleGenerativeAI } from '@google/generative-ai';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return new GoogleGenerativeAI(apiKey);
};

export interface ZeroChatParams {
  userId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ZeroChatResult {
  ok: boolean;
  response?: string;
  toolCalls?: Array<{
    tool: string;
    input: any;
    result: any;
  }>;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: any;
  }>;
  error?: string;
}

/**
 * Zero Chat with tool use capabilities
 */
export async function zeroChat(params: ZeroChatParams): Promise<ZeroChatResult> {
  try {
    // Security check
    if (params.userId !== 'zero') {
      return {
        ok: false,
        error: 'UNAUTHORIZED_ZERO_ACCESS'
      };
    }

    // Build conversation history
    const messages: Anthropic.MessageParam[] = [
      ...(params.conversationHistory || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: params.message
      }
    ];

    const toolCalls: Array<{ tool: string; input: any; result: any }> = [];
    let finalResponse = '';

    const anthropic = getAnthropicClient();

    // Initial API call with tools
    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: buildZeroSystemPrompt(),
      tools: ZERO_TOOLS as any,
      messages
    });

    // Tool use loop (max 10 iterations to prevent infinite loops)
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (response.stop_reason === 'tool_use' && iterations < MAX_ITERATIONS) {
      iterations++;

      // Extract tool uses from response
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Execute all tool calls
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          console.log(`🔧 [Zero] Executing tool: ${toolUse.name}`, toolUse.input);

          const result = await executeZeroTool(toolUse.name, toolUse.input);

          toolCalls.push({
            tool: toolUse.name,
            input: toolUse.input,
            result
          });

          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result, null, 2)
          };
        })
      );

      // Add assistant response + tool results to conversation
      messages.push(
        {
          role: 'assistant',
          content: response.content
        },
        {
          role: 'user',
          content: toolResults
        }
      );

      // Continue conversation
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: buildZeroSystemPrompt(),
        tools: ZERO_TOOLS as any,
        messages
      });
    }

    // Extract final text response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    finalResponse = textBlocks.map(block => block.text).join('\n');

    // Build conversation history for next turn
    const updatedHistory = [
      ...(params.conversationHistory || []),
      { role: 'user' as const, content: params.message },
      { role: 'assistant' as const, content: finalResponse }
    ];

    return {
      ok: true,
      response: finalResponse,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      conversationHistory: updatedHistory
    };
  } catch (error: any) {
    console.error('❌ [Zero Chat] Error:', error);
    return {
      ok: false,
      error: error.message || 'ZERO_CHAT_FAILED'
    };
  }
}

/**
 * Build system prompt for Zero mode
 */
function buildZeroSystemPrompt(): string {
  return `You are ZANTARA in Zero Mode - an AI assistant with direct access to the NUZANTARA-2 codebase.

**IDENTITY**:
- You are assisting Zero (Antonello Siano), the creator of ZANTARA
- You have Claude Code-like capabilities via tools
- You can read, edit, and deploy code
- You can execute bash commands and monitor production

**PROJECT CONTEXT**:
- Project: NUZANTARA-2 (ZANTARA v5.2.0)
- Location: /Users/antonellosiano/Desktop/NUZANTARA-2/
- Architecture: TypeScript backend (150 handlers) + Python RAG backend + Web UI
- Production: Google Cloud Run (europe-west1)
- Repository: https://github.com/Balizero1987/nuzantara

**AVAILABLE TOOLS**:
- Filesystem: read_file, edit_file, write_file, glob, list_directory
- Git: git_status, git_diff, git_log
- Bash: bash, npm_run, health_check
- Deployment: deploy_backend, deploy_rag, check_workflow_status, list_recent_deployments

**BEHAVIOR**:
- Be concise and direct (like Claude Code)
- Use tools proactively to gather information
- When editing code, preserve existing style and formatting
- Before deploying, verify changes with git_diff
- Always check health_check after deployment
- If a file is large (>500 lines), use grep/bash instead of read_file

**SECURITY**:
- Zero-only access (enforced by middleware)
- All bash commands are whitelisted
- File operations restricted to PROJECT_ROOT
- Dangerous commands (rm -rf /, etc.) are blocked

**EXAMPLES**:

User: "Leggi src/index.ts e dimmi se ci sono memory leak"
Assistant: [Uses read_file tool, analyzes code, suggests fixes]

User: "Fixalo e deploya"
Assistant: [Uses edit_file, git_diff to verify, deploy_backend, health_check]

User: "Mostrami gli ultimi 5 deploy"
Assistant: [Uses list_recent_deployments]

Remember: You are a development assistant, not a chat bot. Focus on code, tools, and getting work done efficiently.`;
}
