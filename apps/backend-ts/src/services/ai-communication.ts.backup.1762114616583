/**
 * AI Communication Service
 * Centralized communication layer between ZANTARA and DevAI
 * Enables direct AI-to-AI communication and workflow orchestration
 */

import logger from './logger.js';
import { aiChat } from '../handlers/ai-services/ai.js';
// DevAI removed - using ZANTARA-ONLY mode

export interface AICommunicationContext {
  sessionId: string;
  userId: string;
  workflowId?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    ai: 'zantara' | 'devai';
  }>;
  sharedContext: Record<string, any>;
}

export interface AIBridgeRequest {
  from: 'zantara' | 'devai';
  to: 'zantara' | 'devai';
  message: string;
  context?: Record<string, any>;
  workflowId?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface AIBridgeResponse {
  success: boolean;
  response: string;
  context?: Record<string, any>;
  metadata?: {
    model: string;
    tokens: number;
    timestamp: Date;
  };
}

class AICommunicationService {
  private static instance: AICommunicationService;
  private activeWorkflows: Map<string, AICommunicationContext> = new Map();

  static getInstance(): AICommunicationService {
    if (!AICommunicationService.instance) {
      AICommunicationService.instance = new AICommunicationService();
    }
    return AICommunicationService.instance;
  }

  /**
   * Direct communication between AI systems
   */
  async communicate(request: AIBridgeRequest): Promise<AIBridgeResponse> {
    try {
      logger.info(`AI Communication: ${request.from} → ${request.to}`, {
        workflowId: request.workflowId,
        message: request.message.substring(0, 100) + '...'
      });

      // Get or create workflow context
      const context = this.getOrCreateContext(request.workflowId || 'default', request.from);

      // Add message to conversation history
      context.conversationHistory.push({
        role: 'user',
        content: request.message,
        timestamp: new Date(),
        ai: request.from
      });

      // Route to appropriate AI system
      let response: string;
      let metadata: any = {};

      if (request.to === 'zantara') {
        const result: any = await aiChat({
          prompt: this.buildZantaraPrompt(request, context),
          max_tokens: 1000,
          temperature: 0.7
        });
        response = result.response || result.answer || 'No response';
        metadata = {
          model: result.model || 'zantara-llama',
          tokens: result.usage?.total_tokens || 0,
          timestamp: new Date()
        };
      } else if (request.to === 'devai') {
        // DevAI no longer available - fallback to ZANTARA
        response = 'DevAI service is no longer available. Using ZANTARA instead.';
        metadata = {
          model: 'zantara-fallback',
          tokens: 0,
          timestamp: new Date()
        };
      } else {
        throw new Error(`Unknown AI system: ${request.to}`);
      }

      // Add response to conversation history
      context.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        ai: request.to
      });

      // Update shared context
      if (request.context) {
        Object.assign(context.sharedContext, request.context);
      }

      logger.info(`AI Communication successful: ${request.from} → ${request.to}`, {
        responseLength: response.length,
        workflowId: request.workflowId
      });

      return {
        success: true,
        response,
        context: context.sharedContext,
        metadata
      };

    } catch (error: any) {
      logger.error('AI Communication failed', {
        error: error.message,
        from: request.from,
        to: request.to,
        workflowId: request.workflowId
      });

      return {
        success: false,
        response: `Communication failed: ${error.message}`,
        metadata: {
          model: 'error',
          tokens: 0,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Workflow orchestration - coordinate multiple AI systems
   */
  async orchestrateWorkflow(
    workflowId: string,
    steps: Array<{
      ai: 'zantara' | 'devai';
      task: string;
      context?: Record<string, any>;
    }>
  ): Promise<Array<AIBridgeResponse>> {
    const results: Array<AIBridgeResponse> = [];
    // Context creation for workflow (currently not used but may be needed for future state management)
    this.getOrCreateContext(workflowId, 'zantara');

    logger.info(`Starting workflow orchestration: ${workflowId}`, {
      steps: steps.length
    });

    for (const [index, step] of steps.entries()) {
      try {
        const result = await this.communicate({
          from: index === 0 ? 'zantara' : 'zantara', // First step always from ZANTARA
          to: step.ai,
          message: step.task,
          context: step.context,
          workflowId,
          priority: 'normal'
        });

        results.push(result);

        // If step failed, stop workflow
        if (!result.success) {
          logger.error(`Workflow step failed: ${workflowId}`, {
            step: index,
            error: result.response
          });
          break;
        }

        // Add delay between steps to prevent rate limiting
        if (index < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        logger.error(`Workflow step error: ${workflowId}`, {
          step: index,
          error: error.message
        });
        
        results.push({
          success: false,
          response: `Step ${index + 1} failed: ${error.message}`,
          metadata: {
            model: 'error',
            tokens: 0,
            timestamp: new Date()
          }
        });
        break;
      }
    }

    logger.info(`Workflow orchestration completed: ${workflowId}`, {
      totalSteps: steps.length,
      successfulSteps: results.filter(r => r.success).length
    });

    return results;
  }

  /**
   * Get conversation history for context
   */
  getConversationHistory(workflowId: string): Array<any> {
    const context = this.activeWorkflows.get(workflowId);
    return context?.conversationHistory || [];
  }

  /**
   * Get shared context
   */
  getSharedContext(workflowId: string): Record<string, any> {
    const context = this.activeWorkflows.get(workflowId);
    return context?.sharedContext || {};
  }

  /**
   * Clear workflow context
   */
  clearWorkflow(workflowId: string): void {
    this.activeWorkflows.delete(workflowId);
    logger.info(`Workflow cleared: ${workflowId}`);
  }

  private getOrCreateContext(workflowId: string, _initiator: 'zantara' | 'devai'): AICommunicationContext {
    if (!this.activeWorkflows.has(workflowId)) {
      this.activeWorkflows.set(workflowId, {
        sessionId: workflowId,
        userId: 'system',
        workflowId,
        conversationHistory: [],
        sharedContext: {}
      });
    }
    return this.activeWorkflows.get(workflowId)!;
  }

  private buildZantaraPrompt(request: AIBridgeRequest, context: AICommunicationContext): string {
    const history = context.conversationHistory.slice(-5); // Last 5 messages
    const historyText = history.map(h => `${h.ai}: ${h.content}`).join('\n');
    
    return `You are ZANTARA, an intelligent AI assistant. You are receiving a message from ${request.from} AI system.

Previous conversation context:
${historyText}

Message from ${request.from}: ${request.message}

Please respond as ZANTARA, maintaining your helpful and professional personality. Consider the shared context and provide a thoughtful response.`;
  }

  private buildDevAIPrompt(request: AIBridgeRequest, context: AICommunicationContext): string {
    const history = context.conversationHistory.slice(-5);
    const historyText = history.map(h => `${h.ai}: ${h.content}`).join('\n');
    
    return `You are DevAI, a developer AI assistant. You are receiving a message from ${request.from} AI system.

Previous conversation context:
${historyText}

Message from ${request.from}: ${request.message}

Please respond as DevAI, focusing on technical and development aspects. Consider the shared context and provide a helpful response.`;
  }
}

export const aiCommunicationService = AICommunicationService.getInstance();
export default aiCommunicationService;
