/**
 * OpenRouter Unified AI Client
 *
 * Provides access to 50+ AI models via single API
 * Supports free models: Llama 3.3, DeepSeek, Qwen, Mistral
 *
 * Safety Features:
 * - Rate limiting (max calls per hour)
 * - Circuit breaker (stops on high error rate)
 * - Retry logic with exponential backoff
 * - Cost tracking and budget limits
 */

import axios, { AxiosError } from 'axios';
import logger from '../logger.js';

export type OpenRouterModel =
  | 'meta-llama/llama-3.3-70b-instruct' // FREE - Best for refactoring, 128k context
  | 'deepseek/deepseek-coder' // FREE - Best for code review
  | 'qwen/qwen-2.5-72b-instruct' // FREE - Best for test generation
  | 'mistralai/mistral-7b-instruct' // FREE - Fast for chat
  | 'anthropic/claude-3.5-haiku' // $0.25/M - Fast, economical
  | 'anthropic/claude-3.5-sonnet' // $3/M - Premium quality
  | 'openai/gpt-4-turbo'; // $2.50/M - General purpose

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequest {
  model: OpenRouterModel;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RateLimitState {
  callsThisHour: number;
  hourStartTime: number;
  errorCount: number;
  lastErrorTime: number;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  // ANTI-LOOP: Rate limiting
  private maxCallsPerHour = 100;
  private rateLimitState: RateLimitState = {
    callsThisHour: 0,
    hourStartTime: Date.now(),
    errorCount: 0,
    lastErrorTime: 0
  };

  // ANTI-LOOP: Circuit breaker
  private circuitBreakerThreshold = 0.2; // 20% error rate
  private circuitBreakerCooldown = 5 * 60 * 1000; // 5 minutes
  private isCircuitOpen = false;
  private circuitOpenTime = 0;

  // ANTI-LOOP: Budget tracking
  private dailyBudget = 1.0; // $1/day max
  private costToday = 0;
  private budgetResetTime = Date.now();

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  /**
   * Send a chat completion request with safety checks
   */
  async chat(request: OpenRouterRequest): Promise<string> {
    // ANTI-LOOP: Check circuit breaker
    if (this.isCircuitOpen) {
      const cooldownRemaining = this.circuitBreakerCooldown - (Date.now() - this.circuitOpenTime);
      if (cooldownRemaining > 0) {
        throw new Error(`Circuit breaker open. Retry in ${Math.ceil(cooldownRemaining / 1000)}s`);
      }
      // Reset circuit
      this.isCircuitOpen = false;
      this.rateLimitState.errorCount = 0;
      logger.info('Circuit breaker reset');
    }

    // ANTI-LOOP: Check rate limit
    this.checkRateLimit();

    // ANTI-LOOP: Check budget
    this.checkBudget(request.model);

    const { model, messages, temperature = 0.7, max_tokens = 2000, top_p = 1 } = request;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post<OpenRouterResponse>(
          `${this.baseUrl}/chat/completions`,
          {
            model,
            messages,
            temperature,
            max_tokens,
            top_p
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'HTTP-Referer': 'https://nuzantara.com',
              'X-Title': 'Nuzantara AI Platform',
              'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds
          }
        );

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenRouter');
        }

        // Track usage and cost
        if (response.data.usage) {
          const cost = this.estimateCost(model, response.data.usage);
          this.costToday += cost;

          logger.debug('OpenRouter API usage', {
            model,
            tokens: response.data.usage.total_tokens,
            cost,
            costToday: this.costToday
          });
        }

        // Success - increment rate limit counter
        this.rateLimitState.callsThisHour++;

        return content;

      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;

        // Track error
        this.rateLimitState.errorCount++;
        this.rateLimitState.lastErrorTime = Date.now();

        // ANTI-LOOP: Check if we should open circuit breaker
        const errorRate = this.rateLimitState.errorCount / this.rateLimitState.callsThisHour;
        if (errorRate > this.circuitBreakerThreshold && this.rateLimitState.callsThisHour > 10) {
          this.isCircuitOpen = true;
          this.circuitOpenTime = Date.now();
          logger.error('🚨 Circuit breaker opened due to high error rate', {
            errorRate: `${(errorRate * 100).toFixed(1)}%`,
            errorCount: this.rateLimitState.errorCount,
            totalCalls: this.rateLimitState.callsThisHour
          });
          throw new Error('Circuit breaker opened - too many errors');
        }

        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.error?.message || error.message;

          logger.warn(`OpenRouter API error (attempt ${attempt}/${this.maxRetries})`, {
            status,
            message: errorMessage,
            model
          });

          // Don't retry on client errors (4xx) except rate limit
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw new Error(`OpenRouter API error: ${errorMessage}`);
          }

          // Retry on rate limit or server errors
          if (!isLastAttempt && (status === 429 || (status && status >= 500))) {
            await this.sleep(this.retryDelay * attempt * 2); // Exponential backoff
            continue;
          }
        }

        if (isLastAttempt) {
          throw error;
        }
      }
    }

    throw new Error('OpenRouter API request failed after max retries');
  }

  /**
   * ANTI-LOOP: Check rate limit
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const hourElapsed = now - this.rateLimitState.hourStartTime;

    // Reset counter every hour
    if (hourElapsed > 60 * 60 * 1000) {
      this.rateLimitState.callsThisHour = 0;
      this.rateLimitState.hourStartTime = now;
      this.rateLimitState.errorCount = 0;
    }

    // Check limit
    if (this.rateLimitState.callsThisHour >= this.maxCallsPerHour) {
      const minutesUntilReset = Math.ceil((60 * 60 * 1000 - hourElapsed) / 1000 / 60);
      throw new Error(
        `Rate limit exceeded: ${this.maxCallsPerHour} calls/hour. Reset in ${minutesUntilReset} minutes.`
      );
    }
  }

  /**
   * ANTI-LOOP: Check daily budget
   */
  private checkBudget(model: OpenRouterModel): void {
    const now = Date.now();
    const dayElapsed = now - this.budgetResetTime;

    // Reset budget every day
    if (dayElapsed > 24 * 60 * 60 * 1000) {
      this.costToday = 0;
      this.budgetResetTime = now;
    }

    // Check budget
    if (this.costToday >= this.dailyBudget) {
      const hoursUntilReset = Math.ceil((24 * 60 * 60 * 1000 - dayElapsed) / 1000 / 60 / 60);
      logger.error('🚨 Daily budget exceeded', {
        spent: `$${this.costToday.toFixed(2)}`,
        budget: `$${this.dailyBudget}`,
        resetIn: `${hoursUntilReset}h`
      });
      throw new Error(
        `Daily budget exceeded: $${this.costToday.toFixed(2)}/$${this.dailyBudget}. Reset in ${hoursUntilReset}h.`
      );
    }
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async *streamChat(request: OpenRouterRequest): AsyncIterable<string> {
    // ANTI-LOOP: Apply same safety checks
    this.checkRateLimit();
    this.checkBudget(request.model);

    const { model, messages, temperature = 0.7, max_tokens = 2000 } = request;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://nuzantara.com',
            'X-Title': 'Nuzantara AI Platform',
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 120000 // 2 minutes for streaming
        }
      );

      this.rateLimitState.callsThisHour++;
      yield* this.parseSSE(response.data);

    } catch (error) {
      this.rateLimitState.errorCount++;
      if (error instanceof AxiosError) {
        logger.error('OpenRouter streaming error', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message
        });
      }
      throw error;
    }
  }

  /**
   * Parse Server-Sent Events stream
   */
  private async *parseSSE(stream: any): AsyncIterable<string> {
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }

  /**
   * Select optimal model for task
   */
  selectOptimalModel(
    task: 'code-review' | 'refactoring' | 'testing' | 'prediction' | 'chat' | 'documentation'
  ): OpenRouterModel {
    const modelMap: Record<string, OpenRouterModel> = {
      'code-review': 'deepseek/deepseek-coder', // FREE, specialized
      'refactoring': 'meta-llama/llama-3.3-70b-instruct', // FREE, powerful
      'testing': 'qwen/qwen-2.5-72b-instruct', // FREE, precise
      'prediction': 'anthropic/claude-3.5-haiku', // $0.25/M, fast
      'chat': 'mistralai/mistral-7b-instruct', // FREE, fast
      'documentation': 'meta-llama/llama-3.3-70b-instruct' // FREE, good for text
    };

    return modelMap[task];
  }

  /**
   * Estimate cost for API call (for monitoring)
   */
  private estimateCost(
    model: OpenRouterModel,
    usage: { prompt_tokens: number; completion_tokens: number }
  ): number {
    // Cost per million tokens (approximate)
    const costs: Record<string, { prompt: number; completion: number }> = {
      'meta-llama/llama-3.3-70b-instruct': { prompt: 0, completion: 0 },
      'deepseek/deepseek-coder': { prompt: 0, completion: 0 },
      'qwen/qwen-2.5-72b-instruct': { prompt: 0, completion: 0 },
      'mistralai/mistral-7b-instruct': { prompt: 0, completion: 0 },
      'anthropic/claude-3.5-haiku': { prompt: 0.25, completion: 1.25 },
      'anthropic/claude-3.5-sonnet': { prompt: 3, completion: 15 },
      'openai/gpt-4-turbo': { prompt: 2.5, completion: 10 }
    };

    const modelCosts = costs[model] || { prompt: 0, completion: 0 };

    return (
      (usage.prompt_tokens / 1_000_000) * modelCosts.prompt +
      (usage.completion_tokens / 1_000_000) * modelCosts.completion
    );
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.chat({
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats() {
    return {
      callsThisHour: this.rateLimitState.callsThisHour,
      maxCallsPerHour: this.maxCallsPerHour,
      errorCount: this.rateLimitState.errorCount,
      errorRate: this.rateLimitState.callsThisHour > 0
        ? this.rateLimitState.errorCount / this.rateLimitState.callsThisHour
        : 0,
      circuitBreakerOpen: this.isCircuitOpen,
      costToday: this.costToday,
      dailyBudget: this.dailyBudget,
      budgetRemaining: this.dailyBudget - this.costToday
    };
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();
