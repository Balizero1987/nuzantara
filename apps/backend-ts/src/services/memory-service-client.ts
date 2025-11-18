/**
 * NUZANTARA Memory Service Client
 *
 * Client for the standalone Memory Service microservice
 * Handles all conversation memory, session management, and collective intelligence
 */

/* eslint-disable no-undef */
import { logger } from '../logging/unified-logger.js';

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'https://nuzantara-memory.fly.dev';

export interface MemorySession {
  session_id: string;
  user_id: string;
  member_name: string;
  metadata?: Record<string, any>;
}

export interface ConversationMessage {
  session_id: string;
  user_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  model_used?: string;
  metadata?: Record<string, any>;
}

export interface CollectiveMemory {
  memory_key: string;
  memory_type: string;
  content: string;
  importance_score?: number;
  created_by: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UserFact {
  user_id: string;
  fact_type: string;
  fact_content: string;
  confidence?: number;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Memory Service Client
 */
export class MemoryServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = MEMORY_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Create or update a session
   */
  async createSession(session: MemorySession): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('✅ Session created in Memory Service:', {
        session_id: session.session_id,
        user_id: session.user_id,
      });

      return data;
    } catch (error) {
      logger.error('❌ Failed to create session in Memory Service:', error as Error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/session/${sessionId}`);

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('❌ Failed to get session from Memory Service:', error as Error);
      throw error;
    }
  }

  /**
   * Store a conversation message
   */
  async storeMessage(message: ConversationMessage): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversation/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Memory Service store message error:', {
          status: response.status,
          errorText,
        } as any);
        const error: any = new Error(`Memory Service error: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      logger.debug('💾 Message stored in Memory Service:', {
        session_id: message.session_id,
        type: message.message_type,
      });

      return data;
    } catch (error) {
      logger.error('❌ Failed to store message in Memory Service:', error as Error);
      // Don't throw - memory storage shouldn't break chat flow
      return { success: false, error };
    }
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId: string, limit: number = 50): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversation/${sessionId}?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data: any = await response.json();
      logger.debug('📖 Retrieved conversation history:', {
        session_id: sessionId,
        count: data.messages?.length || 0,
        source: data.source,
      });

      return data;
    } catch (error) {
      logger.error('❌ Failed to get conversation history from Memory Service:', error as Error);
      return { success: true, messages: [], source: 'error' };
    }
  }

  /**
   * Get conversation with summary (for long conversations)
   * Returns summary of old messages + recent messages
   */
  async getConversationWithSummary(sessionId: string, limit: number = 10): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversation/${sessionId}/with-summary?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data: any = await response.json();
      logger.debug('📖 Retrieved conversation with summary:', {
        session_id: sessionId,
        has_summary: !!data.summary,
        recent_count: data.recentMessages?.length || 0,
        has_more: data.hasMore,
      });

      return data;
    } catch (error) {
      logger.error('❌ Failed to get conversation with summary from Memory Service:', error as Error);
      // Fallback to regular history if summary endpoint fails
      return this.getConversationHistory(sessionId, limit);
    }
  }

  /**
   * Store collective memory (shared knowledge)
   */
  async storeCollectiveMemory(memory: CollectiveMemory): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/memory/collective/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memory),
      });

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('🧠 Collective memory stored:', { memory_key: memory.memory_key });

      return data;
    } catch (error) {
      logger.error('❌ Failed to store collective memory:', error as Error);
      return { success: false, error };
    }
  }

  /**
   * Search collective memory
   */
  async searchCollectiveMemory(query: string, memoryType?: string): Promise<any> {
    try {
      let url = `${this.baseUrl}/api/memory/collective/search?q=${encodeURIComponent(query)}`;
      if (memoryType) {
        url += `&type=${encodeURIComponent(memoryType)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data: any = await response.json();
      logger.debug('🔍 Collective memory search results:', {
        query,
        count: data.results?.length || 0,
      });

      return data;
    } catch (error) {
      logger.error('❌ Failed to search collective memory:', error as Error);
      return { success: true, results: [] };
    }
  }

  /**
   * Store user fact
   */
  async storeUserFact(fact: UserFact): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/memory/fact/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fact),
      });

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('📝 User fact stored:', { user_id: fact.user_id, fact_type: fact.fact_type });

      return data;
    } catch (error) {
      logger.error('❌ Failed to store user fact:', error as Error);
      return { success: false, error };
    }
  }

  /**
   * Get user facts
   */
  async getUserFacts(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/memory/fact/${userId}`);

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      const data: any = await response.json();
      logger.debug('📋 Retrieved user facts:', {
        user_id: userId,
        count: data.facts?.length || 0,
      });

      return data;
    } catch (error) {
      logger.error('❌ Failed to get user facts:', error as Error);
      return { success: true, facts: [] };
    }
  }

  /**
   * Get Memory Service statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stats`);

      if (!response.ok) {
        throw new Error(`Memory Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('❌ Failed to get Memory Service stats:', error as Error);
      return { success: false, error };
    }
  }

  /**
   * Check Memory Service health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch (error) {
      logger.warn('⚠️  Memory Service health check failed:', error as any);
      return false;
    }
  }
}

// Export singleton instance
export const memoryServiceClient = new MemoryServiceClient();

export default memoryServiceClient;
