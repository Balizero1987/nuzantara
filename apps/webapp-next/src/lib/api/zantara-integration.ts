/**
 * ZANTARA Integration Service
 *
 * Integrates all backend services into a unified interface for the chatbot:
 * - ConversationsService: Persistent conversation storage
 * - MemoryService: Semantic memory search
 * - CRM Services: Client context awareness
 * - AgenticFunctions: Advanced AI capabilities
 */

import { client } from './client';
import { authAPI } from './auth';
import type { SaveConversationRequest } from './generated/models/SaveConversationRequest';
import type { ConversationHistoryResponse } from './generated/models/ConversationHistoryResponse';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface ZantaraSession {
  sessionId: string;
  userEmail: string;
  startedAt: string;
  lastActivity: string;
  messageCount: number;
  crmClientId?: number;
  crmClientName?: string;
  activeJourneys?: Array<{
    journeyId: string;
    type: string;
    progress: number;
  }>;
  complianceAlerts?: Array<{
    type: string;
    severity: string;
    dueDate: string;
  }>;
}

export interface ZantaraContext {
  session: ZantaraSession;
  recentMemories?: Array<{
    content: string;
    relevance: number;
    type: string;
  }>;
  crmContext?: {
    clientId: number;
    clientName: string;
    status: string;
    practices?: Array<{
      id: number;
      type: string;
      status: string;
    }>;
    recentInteractions?: Array<{
      type: string;
      summary: string;
      date: string;
    }>;
  };
  agentsStatus?: {
    available: string[];
    activeJourneys: number;
    pendingAlerts: number;
  };
}

// Session ID generator
const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `zantara_${timestamp}_${randomPart}`;
};

// Get or create session ID
const getSessionId = (): string => {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    let sessionId = globalThis.localStorage.getItem('zantara_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      globalThis.localStorage.setItem('zantara_session_id', sessionId);
    }
    return sessionId;
  }
  return generateSessionId();
};

/**
 * ZANTARA Integration API
 * Unified interface for all backend services
 */
export const zantaraAPI = {
  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Initialize or restore a ZANTARA session
   */
  async initSession(): Promise<ZantaraSession> {
    const user = authAPI.getUser();
    const userEmail = user?.email || 'anonymous';
    const sessionId = getSessionId();

    const session: ZantaraSession = {
      sessionId,
      userEmail,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    // Try to load CRM context for this user
    try {
      const crmInfo = await this.getCRMContext(userEmail);
      if (crmInfo) {
        session.crmClientId = crmInfo.clientId;
        session.crmClientName = crmInfo.clientName;
      }
    } catch (error) {
      console.warn('[Zantara] Could not load CRM context:', error);
    }

    // Try to load active journeys
    try {
      const agentsStatus = await this.getAgentsStatus();
      if (agentsStatus?.activeJourneys) {
        session.activeJourneys = agentsStatus.activeJourneys;
      }
    } catch (error) {
      console.warn('[Zantara] Could not load agents status:', error);
    }

    return session;
  },

  /**
   * Clear current session and start fresh
   */
  clearSession(): void {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.removeItem('zantara_session_id');
      globalThis.localStorage.removeItem('zantara_conversation');
    }
  },

  // ========================================
  // CONVERSATIONS SERVICE
  // ========================================

  /**
   * Save conversation to backend PostgreSQL
   * Also auto-populates CRM with extracted client/practice data
   */
  async saveConversation(
    messages: ChatMessage[],
    metadata?: Record<string, unknown>
  ): Promise<{
    success: boolean;
    conversationId?: number;
    messagesSaved?: number;
    crm?: {
      processed: boolean;
      clientId?: number;
      practiceId?: number;
      interactionId?: number;
    };
  }> {
    const user = authAPI.getUser();
    if (!user?.email) {
      console.warn('[Zantara] No user email, skipping conversation save');
      return { success: false };
    }

    try {
      const request: SaveConversationRequest = {
        user_email: user.email,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || new Date().toISOString(),
          ...m.metadata,
        })),
        session_id: getSessionId(),
        metadata: {
          source: 'webapp',
          version: 'v8.2',
          ...metadata,
        },
      };

      const response = await client.conversations.saveConversationApiBaliZeroConversationsSavePost({
        requestBody: request,
      });

      console.log('[Zantara] Conversation saved:', response);
      return {
        success: true,
        conversationId: response.conversation_id,
        messagesSaved: response.messages_saved,
        crm: response.crm,
      };
    } catch (error) {
      console.error('[Zantara] Failed to save conversation:', error);
      return { success: false };
    }
  },

  /**
   * Load conversation history from backend
   */
  async loadConversationHistory(
    limit: number = 50,
    sessionId?: string
  ): Promise<ChatMessage[]> {
    const user = authAPI.getUser();
    if (!user?.email) {
      return [];
    }

    try {
      const response: ConversationHistoryResponse = await client.conversations
        .getConversationHistoryApiBaliZeroConversationsHistoryGet({
          userEmail: user.email,
          limit,
          sessionId: sessionId || getSessionId(),
        });

      if (response.messages) {
        return response.messages.map((m: Record<string, unknown>) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as string,
          timestamp: m.timestamp as string,
          metadata: m.metadata as Record<string, unknown>,
        }));
      }
      return [];
    } catch (error) {
      console.error('[Zantara] Failed to load conversation history:', error);
      return [];
    }
  },

  /**
   * Clear conversation history
   */
  async clearConversationHistory(sessionId?: string): Promise<boolean> {
    const user = authAPI.getUser();
    if (!user?.email) {
      return false;
    }

    try {
      await client.conversations.clearConversationHistoryApiBaliZeroConversationsClearDelete({
        userEmail: user.email,
        sessionId: sessionId || getSessionId(),
      });
      return true;
    } catch (error) {
      console.error('[Zantara] Failed to clear conversation history:', error);
      return false;
    }
  },

  /**
   * Get conversation statistics
   */
  async getConversationStats(): Promise<Record<string, unknown> | null> {
    const user = authAPI.getUser();
    if (!user?.email) {
      return null;
    }

    try {
      return await client.conversations.getConversationStatsApiBaliZeroConversationsStatsGet({
        userEmail: user.email,
      });
    } catch (error) {
      console.error('[Zantara] Failed to get conversation stats:', error);
      return null;
    }
  },

  // ========================================
  // MEMORY SERVICE
  // ========================================

  /**
   * Search semantic memories relevant to a query
   */
  async searchMemories(
    queryText: string,
    userId?: string,
    limit: number = 5
  ): Promise<Array<{ content: string; relevance: number; type: string }>> {
    try {
      // First generate embedding for the query
      const embedResponse = await client.memory.generateEmbeddingApiMemoryEmbedPost({
        requestBody: {
          text: queryText,
        },
      });

      if (!embedResponse.embedding) {
        return [];
      }

      // Then search with the embedding
      const searchResponse = await client.memory.searchMemoriesSemanticApiMemorySearchPost({
        requestBody: {
          query_embedding: embedResponse.embedding,
          limit,
          metadata_filter: userId ? { userId } : null,
        },
      });

      if (searchResponse.results) {
        return searchResponse.results.map((r: Record<string, unknown>) => ({
          content: r.document as string,
          relevance: r.score as number,
          type: (r.metadata as Record<string, unknown>)?.type as string || 'general',
        }));
      }
      return [];
    } catch (error) {
      console.error('[Zantara] Failed to search memories:', error);
      return [];
    }
  },

  /**
   * Store a new memory from conversation
   */
  async storeMemory(
    content: string,
    type: string = 'conversation',
    entities: string[] = []
  ): Promise<boolean> {
    const user = authAPI.getUser();
    if (!user?.email) {
      return false;
    }

    try {
      // Generate embedding
      const embedResponse = await client.memory.generateEmbeddingApiMemoryEmbedPost({
        requestBody: {
          text: content,
        },
      });

      if (!embedResponse.embedding) {
        return false;
      }

      // Store memory
      await client.memory.storeMemoryVectorApiMemoryStorePost({
        requestBody: {
          id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          document: content,
          embedding: embedResponse.embedding,
          metadata: {
            userId: user.email,
            type,
            timestamp: new Date().toISOString(),
            entities: entities.join(','),
          },
        },
      });

      return true;
    } catch (error) {
      console.error('[Zantara] Failed to store memory:', error);
      return false;
    }
  },

  /**
   * Get memory service statistics
   */
  async getMemoryStats(): Promise<Record<string, unknown> | null> {
    try {
      return await client.memory.getMemoryStatsApiMemoryStatsGet();
    } catch (error) {
      console.error('[Zantara] Failed to get memory stats:', error);
      return null;
    }
  },

  // ========================================
  // CRM SERVICES
  // ========================================

  /**
   * Get CRM context for a user (by email)
   */
  async getCRMContext(email: string): Promise<{
    clientId: number;
    clientName: string;
    status: string;
    practices?: Array<{ id: number; type: string; status: string }>;
    recentInteractions?: Array<{ type: string; summary: string; date: string }>;
  } | null> {
    try {
      const clientResponse = await client.crmClients.getClientByEmailApiCrmClientsByEmailEmailGet({
        email,
      });

      if (!clientResponse || !clientResponse.id) {
        return null;
      }

      // Get full client summary
      const summary = await client.crmClients.getClientSummaryApiCrmClientsClientIdSummaryGet({
        clientId: clientResponse.id,
      });

      return {
        clientId: clientResponse.id,
        clientName: clientResponse.full_name || email,
        status: clientResponse.status || 'active',
        practices: summary?.practices?.map((p: Record<string, unknown>) => ({
          id: p.id as number,
          type: p.practice_type as string,
          status: p.status as string,
        })),
        recentInteractions: summary?.recent_interactions?.map((i: Record<string, unknown>) => ({
          type: i.type as string,
          summary: i.summary as string,
          date: i.created_at as string,
        })),
      };
    } catch (error) {
      // Client not found is expected for new users
      console.log('[Zantara] No CRM client found for email:', email);
      return null;
    }
  },

  /**
   * Log an interaction with the chatbot to CRM
   */
  async logCRMInteraction(
    clientId: number,
    summary: string,
    type: string = 'chat'
  ): Promise<boolean> {
    const user = authAPI.getUser();
    if (!user?.email) {
      return false;
    }

    try {
      await client.crmInteractions.createInteractionApiCrmInteractionsPost({
        requestBody: {
          client_id: clientId,
          interaction_type: type,
          summary: `${summary} (Notes: Automated log from ZANTARA chat session)`,
          team_member: user.email,
        },
      });
      return true;
    } catch (error) {
      console.error('[Zantara] Failed to log CRM interaction:', error);
      return false;
    }
  },

  /**
   * Get CRM statistics overview
   */
  async getCRMStats(): Promise<Record<string, unknown> | null> {
    try {
      return await client.crmClients.getClientsStatsApiCrmClientsStatsOverviewGet();
    } catch (error) {
      console.error('[Zantara] Failed to get CRM stats:', error);
      return null;
    }
  },

  // ========================================
  // AGENTIC FUNCTIONS
  // ========================================

  /**
   * Get status of all agentic functions
   */
  async getAgentsStatus(): Promise<{
    available: string[];
    activeJourneys: Array<{ journeyId: string; type: string; progress: number }>;
    pendingAlerts: number;
  } | null> {
    try {
      const status = await client.agenticFunctions.getAgentsStatusApiAgentsStatusGet();
      return {
        available: status.agents_available || [],
        activeJourneys: status.active_journeys || [],
        pendingAlerts: status.pending_alerts || 0,
      };
    } catch (error) {
      console.error('[Zantara] Failed to get agents status:', error);
      return null;
    }
  },

  /**
   * Create a new client journey
   */
  async createJourney(
    clientId: string,
    journeyType: string
  ): Promise<{ journeyId: string; steps: Array<{ id: string; name: string }> } | null> {
    try {
      const response = await client.agenticFunctions.createClientJourneyApiAgentsJourneyCreatePost({
        requestBody: {
          client_id: clientId,
          journey_type: journeyType,
        },
      });
      return {
        journeyId: response.journey_id,
        steps: response.steps || [],
      };
    } catch (error) {
      console.error('[Zantara] Failed to create journey:', error);
      return null;
    }
  },

  /**
   * Get compliance alerts for a client
   */
  async getComplianceAlerts(
    clientId?: string,
    severity?: string
  ): Promise<Array<{
    type: string;
    severity: string;
    dueDate: string;
    description: string;
  }>> {
    try {
      const response = await client.agenticFunctions.getComplianceAlertsApiAgentsComplianceAlertsGet({
        clientId: clientId || null,
        severity: severity || null,
      });
      return (response.alerts || []).map((a: Record<string, unknown>) => ({
        type: a.type as string,
        severity: a.severity as string,
        dueDate: a.due_date as string,
        description: a.description as string,
      }));
    } catch (error) {
      console.error('[Zantara] Failed to get compliance alerts:', error);
      return [];
    }
  },

  /**
   * Calculate dynamic pricing for a service
   */
  async calculatePricing(
    serviceType: string,
    complexity: string = 'standard',
    urgency: string = 'normal'
  ): Promise<{
    basePrice: number;
    finalPrice: number;
    breakdown: Record<string, number>;
  } | null> {
    try {
      const response = await client.agenticFunctions.calculateDynamicPricingApiAgentsPricingCalculatePost({
        serviceType,
        complexity,
        urgency,
      });
      return {
        basePrice: response.base_price,
        finalPrice: response.final_price,
        breakdown: response.breakdown || {},
      };
    } catch (error) {
      console.error('[Zantara] Failed to calculate pricing:', error);
      return null;
    }
  },

  /**
   * Cross-oracle synthesis search
   */
  async crossOracleSearch(
    query: string,
    domains: string[] = ['tax', 'legal', 'visa', 'property']
  ): Promise<{
    synthesizedAnswer: string;
    sources: Array<{ domain: string; content: string; relevance: number }>;
  } | null> {
    try {
      const response = await client.agenticFunctions.crossOracleSynthesisApiAgentsSynthesisCrossOraclePost({
        query,
        domains,
      });
      return {
        synthesizedAnswer: response.synthesized_answer || '',
        sources: response.sources || [],
      };
    } catch (error) {
      console.error('[Zantara] Failed to perform cross-oracle search:', error);
      return null;
    }
  },

  // ========================================
  // UNIFIED CONTEXT BUILDER
  // ========================================

  /**
   * Build complete ZANTARA context for a chat message
   * This enriches the chat with all available backend data
   */
  async buildContext(currentMessage: string): Promise<ZantaraContext> {
    const session = await this.initSession();

    // Parallel fetch for performance
    const [memories, crmContext, agentsStatus] = await Promise.all([
      this.searchMemories(currentMessage, session.userEmail, 3).catch(() => []),
      session.userEmail !== 'anonymous'
        ? this.getCRMContext(session.userEmail).catch(() => null)
        : Promise.resolve(null),
      this.getAgentsStatus().catch(() => null),
    ]);

    const context: ZantaraContext = {
      session,
      ...(memories.length > 0 ? { recentMemories: memories } : {}),
      ...(crmContext ? { crmContext } : {}),
      ...(agentsStatus ? {
        agentsStatus: {
          available: agentsStatus.available,
          activeJourneys: agentsStatus.activeJourneys.length,
          pendingAlerts: agentsStatus.pendingAlerts,
        }
      } : {}),
    };

    return context;
  },

  /**
   * Post-process a completed conversation turn
   * Saves to backend and extracts memories
   */
  async postProcessTurn(
    userMessage: string,
    assistantMessage: string,
    allMessages: ChatMessage[]
  ): Promise<void> {
    // Save conversation in background
    this.saveConversation(allMessages).catch(console.error);

    // Extract and store important memories (if message seems significant)
    if (assistantMessage.length > 200) {
      const summary = assistantMessage.substring(0, 500);
      this.storeMemory(
        `User asked: "${userMessage.substring(0, 100)}..." - ZANTARA responded with information about: ${summary}`,
        'conversation_summary'
      ).catch(console.error);
    }
  },
};

export default zantaraAPI;
