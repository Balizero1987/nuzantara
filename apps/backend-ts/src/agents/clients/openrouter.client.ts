/**
 * OpenRouter API Client
 * Handles communication with Qwen3 Coder 480B, DeepSeek V3.1, MiniMax M2
 */

import type { AgentConfig, AgentMessage, AgentResponse } from '../types/agent.types.js';

export class OpenRouterClient {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(config: AgentConfig) {
    this.apiKey = config.apiKey;
  }

  async chat(params: {
    model: string;
    messages: AgentMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }): Promise<AgentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nuzantara-backend.fly.dev',
          'X-Title': 'ZANTARA Agentic System'
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature ?? 0.3,
          max_tokens: params.maxTokens ?? 4000,
          stream: params.stream ?? false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          content: data.choices[0].message.content,
          finishReason: data.choices[0].finish_reason
        },
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Qwen3 Coder 480B - Specialized for code generation
   */
  async qwen3Coder(messages: AgentMessage[], options?: { temperature?: number }): Promise<AgentResponse> {
    return this.chat({
      model: 'qwen/qwen-2.5-coder-32b-instruct', // Using 32B instead of 480B (not available yet)
      messages,
      temperature: options?.temperature ?? 0.2,
      maxTokens: 8000
    });
  }

  /**
   * DeepSeek V3.1 - Specialized for reasoning and agentic workflows
   */
  async deepseekV3(messages: AgentMessage[], options?: { thinking?: boolean }): Promise<AgentResponse> {
    // Add thinking mode instruction if requested
    if (options?.thinking && messages[0]?.role === 'system') {
      messages[0].content += '\n\nUse chain-of-thought reasoning. Think step-by-step before providing the final answer.';
    }

    return this.chat({
      model: 'deepseek/deepseek-chat',
      messages,
      temperature: 0.3,
      maxTokens: 8000
    });
  }

  /**
   * MiniMax M2 - Specialized for tool use and agentic workflows
   */
  async minimaxM2(messages: AgentMessage[]): Promise<AgentResponse> {
    return this.chat({
      model: 'minimax/minimax-01', // Using available model
      messages,
      temperature: 0.4,
      maxTokens: 6000
    });
  }
}
