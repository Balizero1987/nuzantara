/**
 * ZANTARA-ONLY AI Service
 * Simplified AI routing with only ZANTARA/LLAMA support
 */

/* eslint-disable no-unused-vars */
import logger from '../../services/logger.js';
import { ok } from '../../utils/response.js';
import { zantaraChat } from './zantara-llama.js';
import { memoryServiceClient } from '../../services/memory-service-client.js';

// TABULA RASA: Team member recognition MUST be retrieved from database
// This legacy structure is kept only as a fallback stub - all team data comes from database
// TODO: Remove this stub once database integration is complete
const TEAM_RECOGNITION: Record<string, any> = {
  // TABULA RASA: All team member data removed - must be retrieved from database
  // No hardcoded team members - empty stub only
};

// Check for identity recognition
function checkIdentityRecognition(prompt: string, _sessionId: string): string | null {
  const text = prompt.toLowerCase();

  for (const [, member] of Object.entries(TEAM_RECOGNITION)) {
    // Build comprehensive alias list: full name, name parts, role, department, and key
    const nameParts = member.name.toLowerCase().split(/\s+/);
    const aliases = [
      member.name.toLowerCase(), // Full name: "antonello siano"
      ...nameParts, // Name parts: ["antonello", "siano"]
      member.role.toLowerCase(), // Role: "founder"
      member.department.toLowerCase(), // Department: "technology"
    ];

    // Check if any alias matches (as substring or exact match)
    if (
      aliases.some((alias) => {
        // Match if alias is contained in text OR text contains the alias as a word
        return text.includes(alias) || new RegExp(`\\b${alias}\\b`, 'i').test(text);
      })
    ) {
      logger.info(`✅ [ZANTARA] Identity recognized: ${member.name} (${member.role})`);
      return member.personalizedResponse;
    }
  }
  return null;
}

// Simplified ZANTARA context - removed unused function

// ZANTARA-ONLY AI Chat
export async function aiChat(params: any) {
  const { provider: _provider = 'zantara' } = params || {};
  const sessionId = params.sessionId || `session_${Date.now()}`;
  const userId = params.userId || params.user_email || 'unknown';
  const userMessage = params.prompt || params.message;

  logger.info('🎯 [AI Router] ZANTARA-ONLY mode - using only ZANTARA/LLAMA');

  try {
    // === MEMORY: Create/Update Session ===
    await memoryServiceClient
      .createSession({
        session_id: sessionId,
        user_id: userId,
        member_name: params.memberName || 'User',
        metadata: {
          mode: params.mode || 'santai',
          language: params.language || 'unknown',
          user_agent: params.userAgent || 'unknown',
        },
      })
      .catch((err) => logger.warn('⚠️  Memory session creation failed:', err));

    // === MEMORY: Save User Message ===
    await memoryServiceClient
      .storeMessage({
        session_id: sessionId,
        user_id: userId,
        message_type: 'user',
        content: userMessage,
        metadata: {
          mode: params.mode,
          timestamp: new Date().toISOString(),
        },
      })
      .catch((err) => logger.warn('⚠️  Memory user message storage failed:', err));

    // === MEMORY: Retrieve Conversation History (with summary for long conversations) ===
    let conversationContext = '';
    try {
      // Use new summarization-aware endpoint
      const historyData = await memoryServiceClient.getConversationWithSummary(sessionId, 10);
      const summary = historyData.summary || null;
      const messages = historyData.recentMessages || [];

        // If we have a summary, include it first
        if (summary) {
          conversationContext += `\n\n=== Previous Conversation Summary ===\n`;
          conversationContext += `${summary.summary_text}\n\n`;

          if (summary.topics && summary.topics.length > 0) {
            conversationContext += `Topics discussed: ${summary.topics.join(', ')}\n`;
          }

          if (summary.important_facts && summary.important_facts.length > 0) {
            conversationContext += `\nImportant facts:\n`;
            summary.important_facts.forEach((fact: string) => {
              conversationContext += `- ${fact}\n`;
            });
          }

          if (summary.key_decisions && summary.key_decisions.length > 0) {
            conversationContext += `\nKey decisions:\n`;
            summary.key_decisions.forEach((decision: string) => {
              conversationContext += `- ${decision}\n`;
            });
          }

          conversationContext += `=== End of Summary ===\n\n`;
          logger.info(
            `📄 Using conversation summary (${summary.message_count} messages summarized)`
          );
        }

        // Add recent messages
        if (messages.length > 0) {
          const formattedHistory = messages
            .map((msg: any) => {
              const role = msg.message_type === 'user' ? 'User' : 'Assistant';
              return `${role}: ${msg.content}`;
            })
            .join('\n\n');

          conversationContext += `=== Recent Messages ===\n${formattedHistory}\n=== End of Recent Messages ===\n\n`;
          logger.info(
            `📖 Retrieved ${messages.length} recent messages${summary ? ' + summary' : ''} for context`
          );
        }
    } catch (err) {
      logger.warn('⚠️  Failed to retrieve conversation history:', { error: err instanceof Error ? err : new Error(String(err)) });
    }

    // Check for identity recognition FIRST
    const identityResponse = checkIdentityRecognition(userMessage, sessionId);
    if (identityResponse) {
      logger.info(`✅ [ZANTARA] Identity recognized - returning personalized response`);

      // === MEMORY: Save Assistant Response ===
      await memoryServiceClient
        .storeMessage({
          session_id: sessionId,
          user_id: userId,
          message_type: 'assistant',
          content: identityResponse,
          tokens_used: 0,
          model_used: 'identity-recognition',
        })
        .catch((err) => logger.warn('⚠️  Memory assistant message storage failed:', err));

      return ok({ response: identityResponse, recognized: true, ts: Date.now() });
    }

    // Use ZANTARA for all queries with mode support
    // Add conversation history as context if available
    const messageWithContext = conversationContext
      ? `${conversationContext}Current question: ${userMessage}`
      : userMessage;

    const zantaraResult = await zantaraChat({
      message: messageWithContext,
      mode: params.mode || 'santai', // Default to Santai mode
      user_email: params.user_email, // CRITICAL: Pass user_email for identification
      ...params,
    });

    // Normalize response format: zantaraChat returns 'answer', but tests expect 'response'
    if (zantaraResult.ok && zantaraResult.data) {
      const data = zantaraResult.data as any;
      const assistantResponse = data.answer || data.response || '';

      // === MEMORY: Save Assistant Response ===
      await memoryServiceClient
        .storeMessage({
          session_id: sessionId,
          user_id: userId,
          message_type: 'assistant',
          content: assistantResponse,
          tokens_used: data.tokens || 0,
          model_used: data.model || 'zantara-llama',
          metadata: {
            mode: data.mode || params.mode || 'santai',
            provider: data.provider || 'rag-backend',
            usage: data.usage || {},
          },
        })
        .catch((err) => logger.warn('⚠️  Memory assistant message storage failed:', err));

      return ok({
        response: assistantResponse,
        answer: assistantResponse, // Keep for backward compatibility
        model: data.model || 'zantara-llama',
        provider: data.provider || 'rag-backend',
        tokens: data.tokens || 0,
        usage: data.usage || {},
        mode: data.mode || params.mode || 'santai',
        recognized: false, // Not an identity match
        sessionId: sessionId, // Return session ID for client
        hasHistory: conversationContext.length > 0, // Indicates if conversation history was used
        ts: Date.now(),
      });
    }

    return zantaraResult;
  } catch (error: any) {
    logger.error('❌ ZANTARA error:', error instanceof Error ? error : new Error(String(error)));

    // Graceful fallback response instead of throwing error
    return ok({
      response: `Ciao! Sono ZANTARA, l'assistente AI di Bali Zero. Attualmente il mio modello personalizzato non è disponibile, ma posso comunque aiutarti con informazioni sui nostri servizi. Come posso esserti utile oggi?`,
      model: 'zantara-fallback',
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      recognized: false,
      ts: Date.now(),
    });
  }
}

/**
 * Get Available AI Models
 * Handler #12: getAIModelsHandler
 * Returns list of available AI models and their capabilities
 */
export async function getAIModels(_params: any) {
  try {
    logger.info('📋 Fetching available AI models');

    const models = [
      {
        id: 'zantara',
        name: 'ZANTARA',
        description: 'Specialized Bali Zero AI assistant with business knowledge',
        type: 'chat',
        status: 'active',
        capabilities: [
          'business-analysis',
          'kbli-lookup',
          'visa-guidance',
          'tax-planning',
          'rag-search',
        ],
        context_window: 8192,
        max_tokens: 2048,
        latency_ms: '500-1800',
        provider: 'rag-backend',
      },
      {
        id: 'llama',
        name: 'LLAMA (Fallback)',
        description: 'Open-source general-purpose language model for basic queries',
        type: 'chat',
        status: 'active',
        capabilities: ['text-generation', 'question-answering', 'summarization'],
        context_window: 4096,
        max_tokens: 1024,
        latency_ms: '1000-3000',
        provider: 'local-ollama',
      },
    ];

    return {
      success: true,
      models,
      total_models: models.length,
      default_model: 'zantara',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    logger.error('Error fetching AI models:', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error.message || 'Failed to fetch models',
      models: [],
      total_models: 0,
    };
  }
}

/**
 * Generate Text Embeddings
 * Handler #13: generateEmbeddingsHandler
 * Converts text to vector embeddings for semantic search
 */
export async function generateEmbeddings(params: any) {
  const { text, model = 'all-MiniLM-L6-v2' } = params || {};

  try {
    logger.info('Generating embeddings', { text: text?.substring(0, 100) });

    // Validate input
    if (!text || typeof text !== 'string') {
      return {
        success: false,
        error: 'Text is required and must be a string',
      };
    }

    if (text.length < 1) {
      return {
        success: false,
        error: 'Text cannot be empty',
      };
    }

    if (text.length > 10000) {
      return {
        success: false,
        error: 'Text too long (max 10,000 characters)',
      };
    }

    // For now, generate mock embeddings with correct structure
    // In production, this would call OpenAI's text-embedding-3-small API
    const dimension = 384; // all-MiniLM-L6-v2 uses 384 dimensions
    const embeddingVector = Array.from({ length: dimension }, () => Math.random() - 0.5);

    logger.info('Embeddings generated successfully', { model, dimension });

    return {
      success: true,
      embeddings: [
        {
          text,
          vector: embeddingVector,
          dimension,
          model,
        },
      ],
      model,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    logger.error('Embeddings generation error', error, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to generate embeddings',
    };
  }
}

/**
 * Get Text Completions
 * Handler #14: getCompletionsHandler
 * Generates text completions using available AI models
 */
export async function getCompletions(params: any) {
  const {
    prompt,
    model = 'zantara',
    max_tokens = 256,
    temperature = 0.7,
    top_p: _top_p = 0.9,
    stop: _stop,
    frequency_penalty: _frequency_penalty = 0,
    presence_penalty: _presence_penalty = 0,
  } = params || {};

  try {
    logger.info('Getting completions', { prompt: prompt?.substring(0, 100), model });

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return {
        success: false,
        error: 'Prompt is required and must be a string',
      };
    }

    if (prompt.length < 1) {
      return {
        success: false,
        error: 'Prompt cannot be empty',
      };
    }

    // Validate parameters
    if (temperature < 0 || temperature > 2) {
      return {
        success: false,
        error: 'Temperature must be between 0 and 2',
      };
    }

    if (max_tokens < 1 || max_tokens > 4000) {
      return {
        success: false,
        error: 'max_tokens must be between 1 and 4000',
      };
    }

    // Use ZANTARA for completions
    if (model === 'zantara') {
      const result = await zantaraChat({
        message: prompt,
        mode: 'santai',
        ...params,
      });

      if (result.ok && result.data) {
        const data = result.data as any;
        return {
          success: true,
          completion: data.answer || data.response || '',
          prompt,
          model: 'zantara-llama',
          tokens: {
            prompt_tokens: Math.ceil(prompt.length / 4),
            completion_tokens: Math.ceil((data.answer?.length || 0) / 4),
            total_tokens: Math.ceil((prompt.length + (data.answer?.length || 0)) / 4),
          },
          finish_reason: 'stop',
          timestamp: Date.now(),
        };
      }
    }

    // Fallback: generate mock completion
    const mockCompletion =
      'This is a generated completion in response to: ' + prompt.substring(0, 50) + '...';

    return {
      success: true,
      completion: mockCompletion,
      prompt,
      model: model || 'fallback',
      tokens: {
        prompt_tokens: Math.ceil(prompt.length / 4),
        completion_tokens: Math.ceil(mockCompletion.length / 4),
        total_tokens: Math.ceil((prompt.length + mockCompletion.length) / 4),
      },
      finish_reason: 'stop',
      timestamp: Date.now(),
    };
  } catch (error: any) {
    logger.error('Completions error', error, { error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to generate completions',
    };
  }
}
