/**
 * CONVERSATION SUMMARIZATION SERVICE
 *
 * Summarizes long conversation histories to reduce token consumption
 * while maintaining context and key information.
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */ // fetch is built-in in Node 18+

import { Pool } from 'pg';

export interface ConversationMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ConversationSummary {
  session_id: string;
  summary_text: string;
  message_count: number;
  start_timestamp: Date;
  end_timestamp: Date;
  topics: string[];
  key_decisions?: string[];
  important_facts?: string[];
}

export interface SummarizationConfig {
  // When to trigger summarization
  messageThreshold: number; // Summarize when > this many messages
  keepRecentCount: number; // Always keep this many recent messages unsummarized

  // How to summarize
  summaryMaxLength: number; // Max words in summary
  chunkSize: number; // Summarize in chunks of N messages

  // OpenAI config
  openaiApiKey: string;
  model: string;
  temperature: number;
}

const DEFAULT_CONFIG: SummarizationConfig = {
  messageThreshold: 7, // TEMP: Lowered from 50 for testing (triggers when > 7 messages)
  keepRecentCount: 2, // TEMP: Lowered from 10 for testing (keep last 2, summarize the rest)
  summaryMaxLength: 500,
  chunkSize: 20,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4',
  temperature: 0.3, // Low temperature for consistent summaries
};

export class ConversationSummarizer {
  private postgres: Pool;
  private config: SummarizationConfig;

  constructor(postgres: Pool, config?: Partial<SummarizationConfig>) {
    this.postgres = postgres;
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.openaiApiKey) {
      console.warn('⚠️  OpenAI API key not configured - summarization disabled');
    }
  }

  /**
   * Check if a conversation needs summarization
   */
  async needsSummarization(sessionId: string): Promise<boolean> {
    try {
      const result = await this.postgres.query(
        `SELECT COUNT(*) as count
         FROM conversation_history
         WHERE session_id = $1`,
        [sessionId]
      );

      const messageCount = parseInt(result.rows[0]?.count || '0');
      return messageCount > this.config.messageThreshold;
    } catch (error) {
      console.error('❌ Failed to check summarization need:', error);
      return false;
    }
  }

  /**
   * Get messages that need to be summarized (old messages)
   */
  async getMessagesToSummarize(sessionId: string): Promise<ConversationMessage[]> {
    try {
      // Get all messages except the most recent N
      const result = await this.postgres.query(
        `SELECT *
         FROM conversation_history
         WHERE session_id = $1
         ORDER BY timestamp ASC
         OFFSET 0
         LIMIT (
           SELECT GREATEST(0, COUNT(*) - $2)
           FROM conversation_history
           WHERE session_id = $1
         )`,
        [sessionId, this.config.keepRecentCount]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get messages to summarize:', error);
      return [];
    }
  }

  /**
   * Check if summary already exists for this session
   */
  async getSummary(sessionId: string): Promise<ConversationSummary | null> {
    try {
      const result = await this.postgres.query(
        `SELECT
           session_id,
           summary_content as summary_text,
           source_message_count as message_count,
           created_at as start_timestamp,
           created_at as end_timestamp,
           topics
         FROM memory_summaries
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to get summary:', error);
      return null;
    }
  }

  /**
   * Generate summary using OpenAI
   */
  async generateSummary(messages: ConversationMessage[]): Promise<{
    summary: string;
    topics: string[];
    keyDecisions: string[];
    importantFacts: string[];
  }> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Format messages for the prompt
      const conversationText = messages
        .map((msg) => {
          const role = msg.message_type === 'user' ? 'User' : 'Assistant';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');

      // Create summarization prompt
      const prompt = `You are summarizing a conversation between a user and an AI assistant about Indonesian business, legal, and immigration matters.

Please provide:
1. A concise summary (max ${this.config.summaryMaxLength} words) highlighting the main topics discussed and key information exchanged
2. A list of main topics (3-5 topics)
3. Key decisions or conclusions reached (if any)
4. Important facts mentioned that should be remembered

Conversation to summarize:
${conversationText}

Please respond in this JSON format:
{
  "summary": "Your concise summary here...",
  "topics": ["topic1", "topic2", "topic3"],
  "keyDecisions": ["decision1", "decision2"],
  "importantFacts": ["fact1", "fact2", "fact3"]
}`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content:
                'You are a conversation summarizer. Provide concise, accurate summaries in JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.config.temperature,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);

      return {
        summary: parsed.summary || '',
        topics: parsed.topics || [],
        keyDecisions: parsed.keyDecisions || [],
        importantFacts: parsed.importantFacts || [],
      };
    } catch (error) {
      console.error('❌ Failed to generate summary:', error);
      throw error;
    }
  }

  /**
   * Store summary in database
   */
  async storeSummary(sessionId: string, summary: ConversationSummary): Promise<void> {
    try {
      await this.postgres.query(
        `INSERT INTO memory_summaries
         (session_id, user_id, summary_date, summary_content, source_message_count, topics, metadata)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6)
         ON CONFLICT (session_id, summary_date) DO UPDATE
         SET summary_content = EXCLUDED.summary_content,
             source_message_count = EXCLUDED.source_message_count,
             topics = EXCLUDED.topics,
             metadata = EXCLUDED.metadata`,
        [
          sessionId,
          summary.session_id, // Using session_id as user_id for now
          summary.summary_text,
          summary.message_count,
          summary.topics,
          JSON.stringify({
            key_decisions: summary.key_decisions,
            important_facts: summary.important_facts,
            start_timestamp: summary.start_timestamp,
            end_timestamp: summary.end_timestamp,
          }),
        ]
      );

      console.log(`✅ Summary stored for session ${sessionId}`);
    } catch (error) {
      console.error('❌ Failed to store summary:', error);
      throw error;
    }
  }

  /**
   * Main method: Summarize a conversation
   */
  async summarizeConversation(sessionId: string): Promise<ConversationSummary | null> {
    try {
      console.log(`📝 Starting summarization for session ${sessionId}...`);

      // Check if summarization is needed
      const needsSummarization = await this.needsSummarization(sessionId);
      if (!needsSummarization) {
        console.log(`ℹ️  Session ${sessionId} doesn't need summarization yet`);
        return null;
      }

      // Get messages to summarize
      const messages = await this.getMessagesToSummarize(sessionId);
      if (messages.length === 0) {
        console.log(`ℹ️  No messages to summarize for session ${sessionId}`);
        return null;
      }

      console.log(`📊 Summarizing ${messages.length} messages...`);

      // Generate summary
      const generated = await this.generateSummary(messages);

      // Create summary object
      const summary: ConversationSummary = {
        session_id: sessionId,
        summary_text: generated.summary,
        message_count: messages.length,
        start_timestamp: messages[0].timestamp,
        end_timestamp: messages[messages.length - 1].timestamp,
        topics: generated.topics,
        key_decisions: generated.keyDecisions,
        important_facts: generated.importantFacts,
      };

      // Store summary
      await this.storeSummary(sessionId, summary);

      console.log(`✅ Summarization complete for session ${sessionId}`);
      return summary;
    } catch (error) {
      console.error(`❌ Summarization failed for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get conversation with summary (for context)
   */
  async getConversationWithSummary(
    sessionId: string,
    limit: number = 10
  ): Promise<{
    summary: ConversationSummary | null;
    recentMessages: ConversationMessage[];
    hasMore: boolean;
  }> {
    try {
      // Get summary
      const summary = await this.getSummary(sessionId);

      // Get recent messages
      const result = await this.postgres.query(
        `SELECT *
         FROM conversation_history
         WHERE session_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [sessionId, limit]
      );

      // Check if there are more messages
      const countResult = await this.postgres.query(
        `SELECT COUNT(*) as count
         FROM conversation_history
         WHERE session_id = $1`,
        [sessionId]
      );

      const totalMessages = parseInt(countResult.rows[0]?.count || '0');
      const hasMore = totalMessages > limit;

      return {
        summary,
        recentMessages: result.rows.reverse(),
        hasMore,
      };
    } catch (error) {
      console.error('❌ Failed to get conversation with summary:', error);
      throw error;
    }
  }

  /**
   * Format conversation context with summary
   */
  formatContextWithSummary(
    summary: ConversationSummary | null,
    recentMessages: ConversationMessage[]
  ): string {
    let context = '';

    if (summary) {
      context += '=== Previous Conversation Summary ===\n';
      context += `${summary.summary_text}\n\n`;

      if (summary.topics && summary.topics.length > 0) {
        context += `Topics discussed: ${summary.topics.join(', ')}\n`;
      }

      if (summary.important_facts && summary.important_facts.length > 0) {
        context += `\nImportant facts:\n`;
        summary.important_facts.forEach((fact) => {
          context += `- ${fact}\n`;
        });
      }

      if (summary.key_decisions && summary.key_decisions.length > 0) {
        context += `\nKey decisions:\n`;
        summary.key_decisions.forEach((decision) => {
          context += `- ${decision}\n`;
        });
      }

      context += '\n=== End of Summary ===\n\n';
    }

    if (recentMessages.length > 0) {
      context += '=== Recent Messages ===\n';
      recentMessages.forEach((msg) => {
        const role = msg.message_type === 'user' ? 'User' : 'Assistant';
        context += `${role}: ${msg.content}\n\n`;
      });
      context += '=== End of Recent Messages ===\n';
    }

    return context;
  }
}
