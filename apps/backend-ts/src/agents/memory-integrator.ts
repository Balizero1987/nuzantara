/**
 * MEMORY-INTEGRATOR Agent
 * Automatically integrates session memory into existing handlers
 *
 * Stack: DeepSeek V3.1 (code understanding + modification)
 * ROI: Standardizes memory integration across all handlers
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DeepSeekClient } from './clients/deepseek.client.js';
import type { MemoryIntegrationRequest, MemoryIntegrationResult } from './types/agent.types.js';

export class MemoryIntegrator {
  constructor(private deepseek: DeepSeekClient) {}

  async integrate(request: MemoryIntegrationRequest): Promise<MemoryIntegrationResult> {
    console.log('[MemoryIntegrator] Starting integration:', request.handlerPath);

    // Step 1: Read existing handler
    const handlerCode = await this.readHandler(request.handlerPath);
    console.log('[MemoryIntegrator] Handler read, analyzing...');

    // Step 2: Analyze and modify code with DeepSeek
    const modifiedCode = await this.modifyHandler(handlerCode, request);
    console.log('[MemoryIntegrator] Handler modified');

    // Step 3: Write back to file
    await this.writeHandler(request.handlerPath, modifiedCode);
    console.log('[MemoryIntegrator] Handler written');

    return {
      modifiedCode,
      changes: this.detectChanges(handlerCode, modifiedCode),
      success: true
    };
  }

  /**
   * Read handler file
   */
  private async readHandler(handlerPath: string): Promise<string> {
    const baseDir = '/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-ts';
    const fullPath = path.join(baseDir, handlerPath);

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read handler at ${fullPath}: ${error.message}`);
    }
  }

  /**
   * Modify handler to integrate memory
   */
  private async modifyHandler(
    handlerCode: string,
    request: MemoryIntegrationRequest
  ): Promise<string> {
    const response = await this.deepseek.thinkingChat([
      {
        role: 'system',
        content: `You are a code refactoring expert. Your task is to integrate conversation memory into an existing TypeScript handler.

Requirements:
1. Add import: import { memoryServiceClient } from '../../services/memory-service-client.js';
2. At the start of the function, retrieve conversation history:
   const history = await memoryServiceClient.getConversationHistory({ session_id: ${request.sessionIdField}, user_id: ${request.userIdField}, limit: 20 });
3. Format history for LLM context (if needed)
4. After generating the response, store both user message and assistant response:
   await memoryServiceClient.storeMessage({ session_id, user_id, message_type: 'user', content: userQuery });
   await memoryServiceClient.storeMessage({ session_id, user_id, message_type: 'assistant', content: assistantResponse });
5. Preserve all existing error handling
6. Maintain code style and formatting
7. Do NOT change the function signature or return type

Return ONLY the complete modified TypeScript code, no explanations.`
      },
      {
        role: 'user',
        content: `Handler code:\n\n${handlerCode}\n\nIntegrate memory using sessionId field: "${request.sessionIdField}" and userId field: "${request.userIdField}"`
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to modify handler: ' + response.error);
    }

    return this.cleanCode(response.data.content);
  }

  /**
   * Write modified handler back to file
   */
  private async writeHandler(handlerPath: string, code: string): Promise<void> {
    const baseDir = '/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-ts';
    const fullPath = path.join(baseDir, handlerPath);

    // Create backup
    const backupPath = `${fullPath}.backup`;
    const originalCode = await fs.readFile(fullPath, 'utf-8');
    await fs.writeFile(backupPath, originalCode, 'utf-8');

    // Write modified code
    await fs.writeFile(fullPath, code, 'utf-8');

    console.log(`[MemoryIntegrator] Backup saved: ${backupPath}`);
  }

  /**
   * Detect what changed between original and modified code
   */
  private detectChanges(original: string, modified: string): string[] {
    const changes: string[] = [];

    if (!original.includes('memoryServiceClient') && modified.includes('memoryServiceClient')) {
      changes.push('Added memoryServiceClient import');
    }

    if (!original.includes('getConversationHistory') && modified.includes('getConversationHistory')) {
      changes.push('Added conversation history retrieval');
    }

    if (!original.includes('storeMessage') && modified.includes('storeMessage')) {
      changes.push('Added message storage');
    }

    const originalLines = original.split('\n').length;
    const modifiedLines = modified.split('\n').length;
    changes.push(`Lines: ${originalLines} → ${modifiedLines} (${modifiedLines - originalLines >= 0 ? '+' : ''}${modifiedLines - originalLines})`);

    return changes;
  }

  /**
   * Clean code output
   */
  private cleanCode(code: string): string {
    return code
      .replace(/```typescript\n?/g, '')
      .replace(/```ts\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }
}
