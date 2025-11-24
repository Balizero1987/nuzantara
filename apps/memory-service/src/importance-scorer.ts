/**
 * IMPORTANCE SCORING ENGINE
 *
 * Intelligent scoring of memory items based on:
 * - Initial importance (from extraction)
 * - Recency (decay over time)
 * - Access frequency (reinforcement)
 * - Cross-references (connectedness)
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Pool } from 'pg';

export class ImportanceScorer {
  private postgres: Pool;

  constructor(postgres: Pool) {
    this.postgres = postgres;
  }

  /**
   * Calculate initial importance score for a new fact
   * Uses heuristics + optionally AI (though FactExtractor already uses AI)
   */
  calculateInitialScore(content: string, type: string, metadata: any = {}): number {
    let score = 0.5; // Base score

    // Type multipliers
    const multipliers: Record<string, number> = {
      'client_preference': 1.2,
      'legal_requirement': 1.5, // Critical
      'deadline': 1.4,
      'contact_info': 1.3,
      'general_fact': 0.9
    };

    if (multipliers[type]) {
      score *= multipliers[type];
    }

    // Length heuristic (very short or very long facts might be less useful)
    if (content.length < 10) score *= 0.8;
    if (content.length > 500) score *= 0.9;

    // Cap at 1.0
    return Math.min(1.0, score);
  }

  /**
   * Recalibrate scores for all memories
   * Decays old memories, boosts frequently accessed ones
   */
  async recalibrateScores(): Promise<void> {
    console.log('⚖️  Starting importance score recalibration...');

    try {
      // 1. Decay: Reduce score of memories not accessed in 30 days
      await this.postgres.query(`
        UPDATE collective_memory
        SET importance_score = importance_score * 0.95
        WHERE last_accessed < NOW() - INTERVAL '30 days'
        AND importance_score > 0.2
      `);

      // 2. Reinforcement: Boost score of memories accessed recently (last 7 days)
      await this.postgres.query(`
        UPDATE collective_memory
        SET importance_score = LEAST(1.0, importance_score * 1.1)
        WHERE last_accessed > NOW() - INTERVAL '7 days'
        AND access_count > 5
      `);

      // 3. Pruning: Mark very low score memories as 'archived' (optional)
      // For now we just log count
      const lowScoreResult = await this.postgres.query(`
        SELECT COUNT(*) as count FROM collective_memory WHERE importance_score < 0.1
      `);
      console.log(`ℹ️  Found ${lowScoreResult.rows[0].count} low-importance memories`);

      console.log('✅ Score recalibration complete');
    } catch (error) {
      console.error('❌ Failed to recalibrate scores:', error);
      throw error;
    }
  }

  /**
   * Get highly important memories for a specific context/tag
   */
  async getTopMemories(tag: string, limit: number = 5): Promise<any[]> {
    const result = await this.postgres.query(`
      SELECT * FROM collective_memory
      WHERE $1 = ANY(tags)
      ORDER BY importance_score DESC
      LIMIT $2
    `, [tag, limit]);
    return result.rows;
  }
}
