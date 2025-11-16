import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  costPer1M: { input: number; output: number };
  contextWindow: number;
  capabilities: string[];
  priority: number;
}

export const AI_MODELS: Record<string, AIModel> = {
  // FREE MODELS
  DEEPSEEK_R1: {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 Distill Qwen',
    provider: 'DeepSeek',
    costPer1M: { input: 0, output: 0 },
    contextWindow: 32768,
    capabilities: ['analysis', 'extraction', 'reasoning'],
    priority: 1
  },

  GLM_AIR: {
    id: 'zhipu/glm-4-air',
    name: 'GLM 4 Air',
    provider: 'Zhipu',
    costPer1M: { input: 0, output: 0 },
    contextWindow: 128000,
    capabilities: ['translation', 'summarization'],
    priority: 2
  },

  // ULTRA LOW COST
  GEMINI_FLASH: {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Experimental',
    provider: 'Google',
    costPer1M: { input: 0, output: 0 },
    contextWindow: 1048576,
    capabilities: ['synthesis', 'creative', 'multimodal'],
    priority: 3
  },

  // BACKUP MODELS (Still very cheap)
  QWEN_QWQ: {
    id: 'qwen/qwq-32b-preview',
    name: 'Qwen QwQ 32B',
    provider: 'Qwen',
    costPer1M: { input: 0.18, output: 0.18 },
    contextWindow: 32768,
    capabilities: ['analysis', 'reasoning', 'code'],
    priority: 4
  },

  LLAMA_3_1: {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    costPer1M: { input: 0.06, output: 0.06 },
    contextWindow: 131072,
    capabilities: ['general', 'extraction'],
    priority: 5
  }
};

export class OpenRouterClient extends EventEmitter {
  private api: AxiosInstance;
  private apiKey: string;
  private totalCost: number = 0;
  private modelUsage: Map<string, { count: number; cost: number }> = new Map();

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;

    this.api = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://balizero.com',
        'X-Title': 'Bali Zero Journal'
      }
    });
  }

  async complete(
    prompt: string,
    model: AIModel = AI_MODELS.DEEPSEEK_R1,
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      jsonMode?: boolean;
    } = {}
  ): Promise<{ content: string; model: string; cost: number }> {
    const startTime = Date.now();

    try {
      console.log(`🤖 Using ${model.name} (${model.costPer1M.input === 0 ? 'FREE' : `$${model.costPer1M.input}/1M`})`);

      const messages = [];

      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const requestBody: any = {
        model: model.id,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4000,
      };

      // Add JSON mode if requested and model supports it
      if (options.jsonMode && model.capabilities.includes('json')) {
        requestBody.response_format = { type: 'json_object' };
      }

      const response = await this.api.post('/chat/completions', requestBody);

      const content = response.data.choices[0].message.content;
      const usage = response.data.usage;

      // Calculate cost
      const inputCost = (usage.prompt_tokens / 1_000_000) * model.costPer1M.input;
      const outputCost = (usage.completion_tokens / 1_000_000) * model.costPer1M.output;
      const totalCost = inputCost + outputCost;

      // Track usage
      this.totalCost += totalCost;
      const modelStats = this.modelUsage.get(model.id) || { count: 0, cost: 0 };
      modelStats.count++;
      modelStats.cost += totalCost;
      this.modelUsage.set(model.id, modelStats);

      // Emit metrics
      this.emit('completion', {
        model: model.name,
        duration: Date.now() - startTime,
        tokens: usage.total_tokens,
        cost: totalCost
      });

      return {
        content,
        model: model.name,
        cost: totalCost
      };

    } catch (error: any) {
      console.error(`❌ ${model.name} failed:`, error.response?.data || error.message);
      throw error;
    }
  }

  async completeWithFallback(
    prompt: string,
    options: any = {},
    modelPriority?: AIModel[]
  ): Promise<{ content: string; model: string; cost: number }> {
    const models = modelPriority || Object.values(AI_MODELS).sort((a, b) => a.priority - b.priority);

    for (const model of models) {
      try {
        return await this.complete(prompt, model, options);
      } catch (error) {
        console.warn(`⚠️ ${model.name} failed, trying next model...`);
        continue;
      }
    }

    throw new Error('All AI models failed');
  }

  getUsageStats() {
    const stats: any[] = [];

    for (const [modelId, usage] of this.modelUsage.entries()) {
      const model = Object.values(AI_MODELS).find(m => m.id === modelId);
      stats.push({
        model: model?.name || modelId,
        requests: usage.count,
        cost: usage.cost.toFixed(4),
        isFree: model?.costPer1M.input === 0
      });
    }

    return {
      totalCost: this.totalCost.toFixed(4),
      modelStats: stats
    };
  }
}

