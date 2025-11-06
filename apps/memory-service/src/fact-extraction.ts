/**
 * FACT EXTRACTION ENGINE
 *
 * Automatically extracts important facts from conversations
 * and stores them in collective_memory for team-wide use.
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Pool } from 'pg';

export interface ConversationMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ExtractedFact {
  memory_key: string;
  memory_type: string;
  content: string;
  importance_score: number; // 0-1
  tags: string[];
  source: string; // session_id or user_id
  confidence: number; // 0-1
}

export interface ExtractionConfig {
  openaiApiKey: string;
  model: string;
  temperature: number;
  minConfidence: number; // Don't save facts below this confidence
  minImportance: number; // Don't save facts below this importance
}

const DEFAULT_CONFIG: ExtractionConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4',
  temperature: 0.2, // Low temperature for consistent extraction
  minConfidence: 0.7,
  minImportance: 0.6,
};

export class FactExtractor {
  private postgres: Pool;
  private config: ExtractionConfig;

  constructor(postgres: Pool, config?: Partial<ExtractionConfig>) {
    this.postgres = postgres;
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.openaiApiKey) {
      console.warn('⚠️  OpenAI API key not configured - fact extraction disabled');
    }
  }

  /**
   * Extract facts from a conversation segment
   */
  async extractFactsFromConversation(messages: ConversationMessage[]): Promise<ExtractedFact[]> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (messages.length < 2) {
      console.log('⏭️  Too few messages for fact extraction');
      return [];
    }

    try {
      // Format conversation for AI
      const conversationText = messages
        .map((msg) => {
          const role = msg.message_type === 'user' ? 'User' : 'Assistant';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');

      // Create extraction prompt
      const prompt = `You are a fact extraction system for an Indonesian business and legal advisory service.

Analyze the following conversation and extract ONLY important, actionable facts that should be remembered for future interactions.

EXTRACTION CRITERIA:
1. Client preferences (business structure, timeline, budget)
2. Specific requirements (visa type, company type, legal needs)
3. Important patterns (common questions, pain points)
4. Business rules or regulations mentioned
5. Verified information (dates, costs, timelines)

DO NOT extract:
- Generic greetings or small talk
- Uncertain or hypothetical information
- Information already well-documented in standard documents

For each fact, provide:
- memory_type: category (e.g., "client_preference", "visa_rule", "business_pattern", "legal_requirement")
- content: clear, concise fact statement
- importance_score: 0-1 (how important is this to remember?)
- confidence: 0-1 (how confident are we this is accurate?)
- tags: relevant keywords
- reason: why this fact is important

Conversation:
${conversationText}

Return JSON array of extracted facts:`;

      // Call OpenAI
      // eslint-disable-next-line no-undef
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
                'You are a fact extraction system. Return only valid JSON in this exact format: {"facts": [...]}',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.config.temperature,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse response
      const parsed = JSON.parse(content);
      const facts = parsed.facts || parsed.extracted_facts || [];

      console.log(`📊 GPT-4 returned ${facts.length} facts before filtering`);
      if (facts.length > 0) {
        console.log(`📋 Sample fact: ${JSON.stringify(facts[0])}`);
      }

      // Filter by confidence and importance
      const filteredFacts: ExtractedFact[] = facts
        .filter(
          (fact: any) =>
            fact.confidence >= this.config.minConfidence &&
            fact.importance_score >= this.config.minImportance
        )
        .map((fact: any) => ({
          memory_key: this.generateMemoryKey(fact.content, fact.memory_type),
          memory_type: fact.memory_type,
          content: fact.content,
          importance_score: fact.importance_score,
          tags: fact.tags || [],
          source: messages[0].session_id,
          confidence: fact.confidence,
        }));

      console.log(
        `✅ Extracted ${filteredFacts.length} facts after filtering (min confidence: ${this.config.minConfidence}, min importance: ${this.config.minImportance})`
      );
      return filteredFacts;
    } catch (error) {
      console.error('❌ Fact extraction error:', error);
      throw error;
    }
  }

  /**
   * Generate unique memory key from content
   */
  private generateMemoryKey(content: string, type: string): string {
    // Create a hash-like key from content
    const hash = content
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 50);
    const timestamp = Date.now().toString(36);
    return `${type}_${hash}_${timestamp}`;
  }

  /**
   * Store extracted fact in collective_memory
   */
  async storeFact(fact: ExtractedFact, createdBy: string): Promise<void> {
    try {
      await this.postgres.query(
        `INSERT INTO collective_memory
         (memory_key, memory_type, content, importance_score, created_by, tags, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (memory_key) DO UPDATE
         SET access_count = collective_memory.access_count + 1,
             last_accessed = NOW(),
             updated_at = NOW()`,
        [
          fact.memory_key,
          fact.memory_type,
          fact.content,
          fact.importance_score,
          createdBy,
          fact.tags,
          JSON.stringify({
            confidence: fact.confidence,
            source: fact.source,
            extraction_date: new Date().toISOString(),
          }),
        ]
      );

      console.log(`💾 Stored fact: ${fact.memory_key}`);
    } catch (error) {
      console.error('❌ Failed to store fact:', error);
      throw error;
    }
  }

  /**
   * Store multiple facts in batch
   */
  async storeFactsBatch(facts: ExtractedFact[], createdBy: string): Promise<number> {
    let stored = 0;
    for (const fact of facts) {
      try {
        await this.storeFact(fact, createdBy);
        stored++;
      } catch (error) {
        console.error(`Failed to store fact ${fact.memory_key}:`, error);
      }
    }
    return stored;
  }

  /**
   * Search for similar facts to avoid duplicates
   */
  async findSimilarFacts(content: string): Promise<any[]> {
    try {
      // Simple similarity check using content matching
      const words = content
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);

      if (words.length === 0) return [];

      const result = await this.postgres.query(
        `SELECT *,
         (SELECT COUNT(*) FROM unnest(string_to_array(lower(content), ' '))
          WHERE unnest = ANY($1::text[])) as match_count
         FROM collective_memory
         WHERE importance_score > 0.5
         ORDER BY match_count DESC
         LIMIT 5`,
        [words]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to find similar facts:', error);
      return [];
    }
  }

  /**
   * Extract and store facts from recent messages in a session
   */
  async processSession(sessionId: string, userId: string): Promise<number> {
    try {
      console.log(`🔍 Processing session ${sessionId} for fact extraction...`);

      // Get recent messages from session
      const result = await this.postgres.query(
        `SELECT * FROM conversation_history
         WHERE session_id = $1
         ORDER BY timestamp DESC
         LIMIT 20`,
        [sessionId]
      );

      const messages = result.rows;

      if (messages.length < 2) {
        console.log('⏭️  Not enough messages for extraction');
        return 0;
      }

      // Extract facts
      const facts = await this.extractFactsFromConversation(messages);

      if (facts.length === 0) {
        console.log('ℹ️  No significant facts extracted');
        return 0;
      }

      // Store facts
      const stored = await this.storeFactsBatch(facts, userId);

      console.log(`✅ Processed session ${sessionId}: ${stored} facts stored`);
      return stored;
    } catch (error) {
      console.error(`❌ Failed to process session ${sessionId}:`, error);
      return 0;
    }
  }

  /**
   * Get collective memories for a user or session
   */
  async getRelevantMemories(context: string, limit = 10): Promise<any[]> {
    try {
      // Extract keywords from context
      const keywords = context
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 10);

      const result = await this.postgres.query(
        `SELECT *,
         (SELECT COUNT(*) FROM unnest(tags) WHERE unnest = ANY($1::text[])) as tag_matches
         FROM collective_memory
         WHERE importance_score > 0.6
         ORDER BY tag_matches DESC, importance_score DESC, access_count DESC
         LIMIT $2`,
        [keywords, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get relevant memories:', error);
      return [];
    }
  }
}
