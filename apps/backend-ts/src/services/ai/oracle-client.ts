import logger from '../logger.js';

export interface OracleChatParams {
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Client for Zantara Jaksel hosted on Oracle Cloud (Ollama/vLLM)
 */
export class OracleClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Default to local tunnel if env not set
    this.baseUrl = process.env.ORACLE_LLM_URL || 'http://168.110.196.106:11434/v1';
    this.apiKey = process.env.ORACLE_LLM_KEY || 'ollama'; // Ollama doesn't enforce keys usually
  }

  /**
   * Chat with Zantara Jaksel
   */
  async chat(params: OracleChatParams): Promise<string> {
    try {
      logger.info(`🔮 [ORACLE] Calling Zantara Jaksel at ${this.baseUrl}...`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'zantara', // Model name on Ollama
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.max_tokens || 500,
          stream: false // For now non-streaming for simplicity in logic
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Oracle API Error: ${response.status} ${errText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from Oracle LLM');
      }

      logger.info('✅ [ORACLE] Response received');
      return content;

    } catch (error: any) {
      logger.error(`❌ [ORACLE] Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Oracle is alive
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try listing models or a fast ping
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  }
}

export const oracleClient = new OracleClient();
