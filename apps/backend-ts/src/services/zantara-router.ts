import { intentRouter } from './intent-router.js';
import { oracleClient } from './ai/oracle-client.js';
import { zantaraChat } from '../handlers/ai-services/zantara-llama.js'; // Legacy RAG handler
import { memoryServiceClient } from './memory-service-client.js';
import logger from './logger.js';

export interface ZantaraRequest {
  message: string;
  user_email?: string;
  session_id?: string;
}

export class ZantaraRouter {
  
  /**
   * Main entry point for Zantara Chat
   * Routes between "Nongkrong" (Chat) and "Daging" (Consulting) modes
   */
  async handleRequest(req: ZantaraRequest) {
    const { message, user_email = 'guest' } = req;
    
    // 1. Retrieve Memory Context (Used for both modes)
    let memoryContext = '';
    try {
      if (user_email !== 'guest') {
        const memoryResult = await memoryServiceClient.getUserFacts(user_email);
        const facts = memoryResult.facts || [];
        if (facts.length > 0) {
          memoryContext = facts.map((f: any) => `- ${f.fact_content}`).join('\n');
          logger.debug(`🧠 Loaded ${facts.length} facts for ${user_email}`);
        }
      }
    } catch (e) {
      logger.warn('⚠️ Memory retrieval failed, proceeding without memory.');
    }

    // 2. Classify Intent
    const intent = await intentRouter.classify(message);
    logger.info(`🚦 [ZANTARA ROUTER] Intent: ${intent} | User: ${user_email}`);

    if (intent === 'CHAT') {
      // --- MODE 1: NONGKRONG (Direct to Oracle) ---
      return this.handleChatMode(message, memoryContext);
    } else {
      // --- MODE 2: CONSULTING (RAG + Style Transfer) ---
      return this.handleConsultingMode(message, user_email, memoryContext);
    }
  }

  /**
   * MODE 1: Pure Chat (Fast, Cheap, Personable)
   * Uses Zantara Jaksel model on Oracle Cloud directly.
   */
  private async handleChatMode(message: string, memoryContext: string) {
    logger.info('💬 [MODE] Entering CHAT mode (Oracle Direct)');
    
    const systemPrompt = `
    You are ZANTARA, a Senior Legal Consultant in Jakarta (SCBD).
    
    CONTEXT (User Facts):
    ${memoryContext}
    
    STYLE GUIDE:
    - Speak "Bahasa Jaksel" (Indo mixed with English terms like "Basically", "Which is").
    - Be chill, friendly, and professional. Like a smart colleague.
    - NO Balinese terms (No Bli, No Suksma).
    - If the user asks a specific legal question you don't know, say: "Sebentar, gue cek regulasi resminya dulu ya." (Do not hallucinate laws).
    `;

    const response = await oracleClient.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.8, // Higher creativity for chat
      max_tokens: 300
    });

    return {
      response: response,
      mode: 'chat',
      source: 'oracle-direct'
    };
  }

  /**
   * MODE 2: Consulting (Accurate, RAG-backed)
   * Uses Python RAG to get facts, then Oracle to rewrite in style.
   */
  private async handleConsultingMode(message: string, user_email: string, memoryContext: string) {
    logger.info('⚖️ [MODE] Entering CONSULTING mode (RAG + Style Transfer)');

    // Step A: Get Raw Facts from RAG (Gemini Flash via Python Backend)
    // We use the existing zantaraChat handler which calls the Python RAG
    let ragResponse;
    try {
      const ragResult = await zantaraChat({
        message: message,
        user_email: user_email,
        mode: 'pikiran' // Force deep reasoning in RAG
      });
      // zantaraChat returns an ApiSuccess object { ok: true, data: { answer: ... } }
      // We need to extract the actual text
      ragResponse = ragResult.data?.answer || "Maaf, sistem RAG sedang busy.";
    } catch (error) {
      logger.error('❌ RAG Backend failed, falling back to Oracle Direct');
      return this.handleChatMode(message, memoryContext);
    }

    // Step B: Style Transfer using Oracle (Zantara Jaksel)
    // Takes the boring legal answer and makes it "Jaksel"
    logger.info('🎨 [STYLE] Transferring style via Oracle...');
    
    const stylePrompt = `
    TASK: Rewrite the following legal advice into "Bahasa Jaksel" style (SCBD Consultant).
    
    RAW LEGAL INFO:
    "${ragResponse}"
    
    USER CONTEXT:
    ${memoryContext}
    
    GUIDELINES:
    - Keep all legal facts (prices, laws, dates) EXACTLY as they are.
    - Change the tone to: Professional, Chill, Smart.
    - Use terms like: "Basically", "Compliance", "Issue", "Strict", "Make sure".
    - Do not use lists unless necessary. Make it conversational.
    `;

    const styledResponse = await oracleClient.chat({
      messages: [
        { role: 'system', content: "You are a Style Transfer Engine. You rewrite text into Jakarta Business Slang." },
        { role: 'user', content: stylePrompt }
      ],
      temperature: 0.4, // Lower temperature for factual consistency
      max_tokens: 600
    });

    return {
      response: styledResponse,
      mode: 'consulting',
      source: 'rag-oracle-hybrid',
      original_fact: ragResponse // Optional: keep for debugging
    };
  }
}

export const zantaraRouter = new ZantaraRouter();