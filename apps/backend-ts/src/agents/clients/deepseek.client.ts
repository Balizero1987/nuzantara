/**
 * DeepSeek Direct API Client (Fallback)
 * Official DeepSeek API when OpenRouter is unavailable
 */

import type { AgentConfig, AgentMessage, AgentResponse } from '../types/agent.types.js';

export class DeepSeekClient {
  private apiKey: string;
  private baseURL = 'https://api.deepseek.com/v1';

  constructor(config: AgentConfig) {
    this.apiKey = config.apiKey;
  }

  async chat(params: {
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: params.messages,
          temperature: params.temperature ?? 0.3,
          max_tokens: params.maxTokens ?? 4096, // DeepSeek max is 8192, use 4096 as safe default
          stream: params.stream ?? false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
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
   * Chat with thinking mode enabled
   */
  async thinkingChat(messages: AgentMessage[]): Promise<AgentResponse> {
    // Enable chain-of-thought reasoning
    if (messages[0]?.role === 'system') {
      messages[0].content += '\n\n<thinking>\nUse step-by-step reasoning. Break down the problem, analyze each component, and explain your thought process before providing the solution.\n</thinking>';
    }

    return this.chat({
      messages,
      temperature: 0.3,
      maxTokens: 8000 // DeepSeek max is 8192
    });
  }
}
