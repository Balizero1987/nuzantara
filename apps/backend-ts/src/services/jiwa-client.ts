/**
 * JIWA Client - TypeScript client for Ibu Nuzantara Soul Service
 *
 * This client connects the FLAN-T5 router system with the JIWA soul reading
 * and response infusion service.
 */

import axios, { AxiosInstance } from 'axios';
import logger from './logger.js';

// Types for JIWA service
export interface SoulReading {
  primary_need: string;
  emotional_tone: string;
  urgency_level: number;
  protection_needed: boolean;
  hidden_pain?: string;
  strength_detected?: string;
  maternal_guidance: string;
  cultural_context: Record<string, any>;
  blessing_type?: string;
}

export interface InfusedResponse {
  infused_response: string;
  maternal_warmth: number;
  blessing_added: boolean;
  cultural_elements: string[];
}

export interface JiwaStatus {
  heart: {
    heartbeats: number;
    souls_touched: number;
    protections_activated: number;
    community_strength: number;
    current_emotion: string;
  };
  middleware: {
    requests_processed: number;
    souls_touched: number;
    protections_activated: number;
    blessings_given: number;
  };
  status: string;
  message: string;
}

export class JiwaClient {
  private client: AxiosInstance;
  private isHealthy: boolean = false;

  constructor(baseURL: string = 'http://localhost:8001') {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check health on initialization
    this.checkHealth();
  }

  /**
   * Check if JIWA service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      this.isHealthy = response.data.status === 'healthy';
      logger.info(`💗 JIWA Service: ${this.isHealthy ? 'Connected' : 'Not available'}`);
      return this.isHealthy;
    } catch (error) {
      logger.warn(`⚠️ JIWA Service not available: ${error instanceof Error ? error.message : String(error)}`);
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Read the soul of a user's query
   *
   * @param query - The user's message to analyze
   * @param userId - Optional user ID for personalization
   * @param context - Optional context about the conversation
   * @param language - Language preference (id/en)
   * @returns Soul reading with emotional and need analysis
   */
  async readSoul(
    query: string,
    userId: string = 'anonymous',
    context?: Record<string, any>,
    language: string = 'id'
  ): Promise<SoulReading | null> {
    if (!this.isHealthy) {
      await this.checkHealth();
      if (!this.isHealthy) return null;
    }

    try {
      const response = await this.client.post('/read-soul', {
        query,
        user_id: userId,
        context,
        language,
      });

      logger.info(
        `📖 Soul read: ${response.data.emotional_tone} - Urgency ${response.data.urgency_level}/10`
      );
      return response.data;
    } catch (error) {
      logger.error(`❌ Soul reading failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Infuse a response with JIWA (Indonesian soul)
   *
   * @param response - The technical response to enhance
   * @param soulReading - The soul reading data
   * @param language - Language for infusion
   * @param addBlessing - Whether to add a blessing
   * @returns Infused response with maternal warmth
   */
  async infuseResponse(
    response: string,
    soulReading: SoulReading | Record<string, any>,
    language: string = 'id',
    addBlessing: boolean = true
  ): Promise<InfusedResponse | null> {
    if (!this.isHealthy) {
      await this.checkHealth();
      if (!this.isHealthy) return null;
    }

    try {
      const result = await this.client.post('/infuse-response', {
        response,
        soul_reading: soulReading,
        language,
        add_blessing: addBlessing,
      });

      logger.info(`💫 Response infused with warmth: ${result.data.maternal_warmth}`);
      return result.data;
    } catch (error) {
      logger.error(`❌ Response infusion failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Activate protection for a user in distress
   *
   * @param userId - User to protect
   * @param threatType - Type of threat (fraud/legal/emotional/emergency)
   * @returns Protection details
   */
  async activateProtection(userId: string, threatType: string): Promise<any> {
    if (!this.isHealthy) {
      await this.checkHealth();
      if (!this.isHealthy) return null;
    }

    try {
      const response = await this.client.post('/protect-user', null, {
        params: { user_id: userId, threat_type: threatType },
      });

      logger.warn('🛡️ Protection activated for ${userId}: ${response.data.protection_id}');
      return response.data;
    } catch (error) {
      logger.error('❌ Protection activation failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Get JIWA system status
   */
  async getStatus(): Promise<JiwaStatus | null> {
    try {
      const response = await this.client.get('/jiwa-status');
      return response.data;
    } catch (error) {
      logger.error('❌ Failed to get JIWA status:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Process a complete query with soul reading and infusion
   *
   * @param query - User query
   * @param response - Technical response from router/Haiku
   * @param userId - User ID
   * @param language - Language preference
   * @returns Enhanced response with JIWA infusion
   */
  async processWithJiwa(
    query: string,
    response: string,
    userId: string = 'anonymous',
    language: string = 'id'
  ): Promise<string> {
    // Read the soul first
    const soulReading = await this.readSoul(query, userId, {}, language);

    if (!soulReading) {
      // JIWA not available, return original response
      logger.info('⚠️ JIWA not available, returning original response');
      return response;
    }

    // Check if protection is needed
    if (soulReading.protection_needed && soulReading.urgency_level >= 8) {
      await this.activateProtection(
        userId,
        soulReading.primary_need.includes('fraud')
          ? 'fraud'
          : soulReading.primary_need.includes('legal')
            ? 'legal'
            : soulReading.primary_need.includes('emergency')
              ? 'emergency'
              : 'emotional'
      );
    }

    // Infuse the response with JIWA
    const infused = await this.infuseResponse(
      response,
      soulReading,
      language,
      soulReading.emotional_tone === 'sad' || soulReading.emotional_tone === 'desperate'
    );

    if (!infused) {
      // Infusion failed, return with basic enhancement
      const prefix = soulReading.urgency_level >= 8 ? '⚠️ [URGENT] ' : '';
      return prefix + response;
    }

    return infused.infused_response;
  }
}

// Singleton instance
let jiwaClient: JiwaClient | null = null;

/**
 * Get or create JIWA client instance
 */
export function getJiwaClient(baseURL?: string): JiwaClient {
  if (!jiwaClient) {
    jiwaClient = new JiwaClient(baseURL);
  }
  return jiwaClient;
}

/**
 * Middleware function for Express to add JIWA to requests
 */
export function jiwaMiddleware() {
  const client = getJiwaClient();

  return async (req: any, _res: any, next: any) => {
    // Attach JIWA client to request
    req.jiwa = client;

    // Add helper function for easy processing
    req.processWithJiwa = async (query: string, response: string) => {
      const userId = req.user?.id || req.session?.userId || 'anonymous';
      const language = req.headers['accept-language']?.substring(0, 2) || 'id';

      return await client.processWithJiwa(query, response, userId, language);
    };

    next();
  };
}

export default JiwaClient;
