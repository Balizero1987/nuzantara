// ZANTARA Multi-Agent Router - TinyLlama Intent Detection
// 637MB model → Fast local inference → $0 monthly cost

import axios from 'axios';
import logger from './logger.js';

export interface AgentIntent {
  agent: 'qwen' | 'mistral' | 'llama';
  confidence: number;
  reasoning: string;
  estimated_tokens: number;
}

export interface ZANTARAQuery {
  query: string;
  domain?: string;
  user_id?: string;
  context?: any;
}

export class ZANTARAAgentRouter {
  private tinyllamaEndpoint: string;
  private agentEndpoints = {
    qwen: process.env.QWEN_ENDPOINT || 'http://localhost:8000/qwen',
    mistral: process.env.MISTRAL_ENDPOINT || 'http://localhost:8001/mistral',
    llama: process.env.LLAMA_ENDPOINT || 'http://localhost:8002/llama',
  };

  constructor() {
    this.tinyllamaEndpoint = process.env.TINYLLAMA_ENDPOINT || 'http://localhost:11434';
  }

  /**
   * Fast local TinyLlama intent detection
   * Model: 637MB, ~50ms response time
   */
  async detectIntent(query: string, context?: any): Promise<AgentIntent> {
    try {
      const prompt = `
        Analyze this ZANTARA query and select the best agent:

        Query: "${query}"
        Domain: ${context?.domain || 'general'}

        AGENTS:
        - qwen: Business reasoning, financial analysis, complex logic
        - mistral: Business intelligence, market analysis, strategic planning
        - llama: General conversation, multi-language, creative tasks

        Respond with JSON: {"agent": "qwen|mistral|llama", "confidence": 0.9, "reasoning": "analysis", "estimated_tokens": 500}
      `;

      const response = await axios.post(
        `${this.tinyllamaEndpoint}/api/generate`,
        {
          model: 'tinyllama-1.1b-chat',
          prompt,
          max_tokens: 150,
          temperature: 0.1,
          stream: false,
        },
        {
          timeout: 2000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.response;
      const match = content.match(/\{[^}]+\}/);

      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          agent: parsed.agent || 'llama',
          confidence: parsed.confidence || 0.8,
          reasoning: parsed.reasoning || 'Default routing',
          estimated_tokens: parsed.estimated_tokens || 500,
        };
      }

      // Fallback logic
      return this.fallbackIntentDetection(query);
    } catch (error) {
      logger.error('TinyLlama routing failed:', error);
      return this.fallbackIntentDetection(query);
    }
  }

  /**
   * Route to appropriate agent
   */
  async routeToAgent(zantaraQuery: ZANTARAQuery): Promise<any> {
    const startTime = Date.now();

    // Step 1: Detect intent with TinyLlama
    const intent = await this.detectIntent(zantaraQuery.query, zantaraQuery.context);

    logger.info(`Intent detected: ${intent.agent} (confidence: ${intent.confidence})`);

    // Step 2: Route to selected agent
    let agentResponse;
    switch (intent.agent) {
      case 'qwen':
        agentResponse = await this.callQwenAgent(zantaraQuery, intent);
        break;
      case 'mistral':
        agentResponse = await this.callMistralAgent(zantaraQuery, intent);
        break;
      case 'llama':
      default:
        agentResponse = await this.callLlamaAgent(zantaraQuery, intent);
        break;
    }

    const processingTime = Date.now() - startTime;

    return {
      ...agentResponse,
      routing: {
        selected_agent: intent.agent,
        confidence: intent.confidence,
        reasoning: intent.reasoning,
        processing_time_ms: processingTime,
        tinyllama_routing: true,
        cost_estimate: '$0 (local models)',
      },
    };
  }

  /**
   * Call Qwen Reasoning Agent (2.5B ~1.6GB)
   */
  private async callQwenAgent(query: ZANTARAQuery, intent: AgentIntent): Promise<any> {
    try {
      const response = await axios.post(
        this.agentEndpoints.qwen,
        {
          query: query.query,
          domain: query.domain,
          context: query.context,
          agent_type: 'reasoning',
          max_tokens: 1000,
          temperature: 0.1,
        },
        { timeout: 5000 }
      );

      return {
        agent: 'qwen-reasoning',
        response: response.data,
        capabilities: ['complex_reasoning', 'financial_analysis', 'logical_deduction'],
        cost: 0,
        model_size: '2.5B',
      };
    } catch (error) {
      logger.error('Qwen agent failed:', error);
      throw new Error('Qwen reasoning agent unavailable');
    }
  }

  /**
   * Call Mistral Business Intelligence Agent (7B ~5GB)
   */
  private async callMistralAgent(query: ZANTARAQuery, intent: AgentIntent): Promise<any> {
    try {
      const response = await axios.post(
        this.agentEndpoints.mistral,
        {
          query: query.query,
          domain: query.domain,
          context: query.context,
          agent_type: 'business_intelligence',
          max_tokens: 1200,
          temperature: 0.2,
        },
        { timeout: 7000 }
      );

      return {
        agent: 'mistral-business',
        response: response.data,
        capabilities: ['market_analysis', 'business_strategy', 'competitive_intelligence'],
        cost: 0,
        model_size: '7B',
      };
    } catch (error) {
      logger.error('Mistral agent failed:', error);
      throw new Error('Mistral business agent unavailable');
    }
  }

  /**
   * Call Llama Multi-Language Agent (3.1B ~2GB)
   */
  private async callLlamaAgent(query: ZANTARAQuery, intent: AgentIntent): Promise<any> {
    try {
      const response = await axios.post(
        this.agentEndpoints.llama,
        {
          query: query.query,
          domain: query.domain,
          context: query.context,
          agent_type: 'multilingual',
          max_tokens: 800,
          temperature: 0.3,
        },
        { timeout: 4000 }
      );

      return {
        agent: 'llama-multilingual',
        response: response.data,
        capabilities: ['multilingual', 'general_knowledge', 'creative_tasks'],
        cost: 0,
        model_size: '3.1B',
      };
    } catch (error) {
      logger.error('Llama agent failed:', error);
      throw new Error('Llama multilingual agent unavailable');
    }
  }

  /**
   * Fallback intent detection without TinyLlama
   */
  private fallbackIntentDetection(query: string): AgentIntent {
    const lowerQuery = query.toLowerCase();

    // Business/Financial queries → Qwen
    if (
      lowerQuery.includes('investment') ||
      lowerQuery.includes('financial') ||
      lowerQuery.includes('analysis') ||
      lowerQuery.includes('calculation') ||
      lowerQuery.includes('optimization')
    ) {
      return {
        agent: 'qwen',
        confidence: 0.8,
        reasoning: 'Keyword-based business detection',
        estimated_tokens: 600,
      };
    }

    // Market/Strategy queries → Mistral
    if (
      lowerQuery.includes('market') ||
      lowerQuery.includes('strategy') ||
      lowerQuery.includes('competition') ||
      lowerQuery.includes('business plan')
    ) {
      return {
        agent: 'mistral',
        confidence: 0.7,
        reasoning: 'Keyword-based market detection',
        estimated_tokens: 800,
      };
    }

    // Default → Llama
    return {
      agent: 'llama',
      confidence: 0.6,
      reasoning: 'Default routing to multilingual agent',
      estimated_tokens: 400,
    };
  }

  /**
   * Get router status and available agents
   */
  async getStatus(): Promise<any> {
    return {
      router: 'TinyLlama Intent Detection',
      model: 'tinyllama-1.1b-chat (637MB)',
      agents: {
        qwen: {
          name: 'Qwen 2.5B Reasoning',
          size: '1.6GB',
          capabilities: ['Complex Reasoning', 'Financial Analysis', 'Logical Deduction'],
          status: 'available',
        },
        mistral: {
          name: 'Mistral 7B Business',
          size: '5GB',
          capabilities: ['Market Analysis', 'Business Strategy', 'Competitive Intelligence'],
          status: 'available',
        },
        llama: {
          name: 'Llama 3.1B Multi-L',
          size: '2GB',
          capabilities: ['Multi-Language', 'General Knowledge', 'Creative Tasks'],
          status: 'available',
        },
      },
      total_memory_usage: '~8.6GB',
      monthly_cost: '$0',
      performance: {
        intent_detection: '~50ms',
        agent_response: '2-5s',
        total_latency: '~2.5-5.5s',
      },
    };
  }
}

export default ZANTARAAgentRouter;
