import { openRouterClient } from './ai/openrouter-client.js';
import logger from './logger.js';

export type UserIntent = 'CHAT' | 'CONSULT';

export class IntentRouter {
  
  /**
   * Classify user message into CHAT (Casual) or CONSULT (Business/Legal)
   */
  async classify(message: string): Promise<UserIntent> {
    // Quick Keyword Check (Optimization)
    // If user mentions specific heavy keywords, skip LLM and go straight to CONSULT
    const heavyKeywords = ['pt pma', 'kitas', 'tax', 'pajak', 'legal', 'hukum', 'license', 'izin', 'biaya', 'cost', 'price', 'harga'];
    if (heavyKeywords.some(k => message.toLowerCase().includes(k))) {
      logger.info(`🚦 [ROUTER] Keyword detected -> CONSULT`);
      return 'CONSULT';
    }

    // LLM Classification
    const prompt = `
    CLASSIFY the user intent.
    
    - "CONSULT": User asks about Business, Law, Tax, Visa, Company Setup, Regulations, Costs, Definitions.
    - "CHAT": User says Hello, asks "How are you", talks about Weather, Traffic, Food, Life, or General Chit-chat.
    
    Input: "${message}"
    
    Return ONLY one word: "CONSULT" or "CHAT".
    `;

    try {
      const decision = await openRouterClient.chat({
        model: 'mistralai/mistral-7b-instruct', // Fast & Cheap
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 5,
        temperature: 0
      });

      const cleanDecision = decision.trim().toUpperCase().replace(/[^A-Z]/g, '');
      
      if (cleanDecision.includes('CONSULT')) {
        logger.info(`🚦 [ROUTER] LLM decided -> CONSULT`);
        return 'CONSULT';
      }
      
      logger.info(`🚦 [ROUTER] LLM decided -> CHAT`);
      return 'CHAT';

    } catch (error) {
      logger.warn(`⚠️ [ROUTER] Classification failed, defaulting to CONSULT for safety.`);
      return 'CONSULT';
    }
  }
}

export const intentRouter = new IntentRouter();
