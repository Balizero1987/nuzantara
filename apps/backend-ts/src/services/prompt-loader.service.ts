/**
 * Dynamic Prompt Loader Service
 * Loads appropriate ZANTARA prompt based on user level detection
 */

import fs from 'fs/promises';
import { logger } from '../logging/unified-logger.js';
import path from 'path';
import crypto from 'crypto';

export interface UserContext {
  userId?: string;
  email?: string;
  historyLength?: number;
  previousQueries?: string[];
  language?: string;
  location?: string;
}

export enum UserLevel {
  LEVEL_0 = 0, // Public/Transactional
  LEVEL_1 = 1, // Curious Seeker
  LEVEL_2 = 2, // Conscious Practitioner
  LEVEL_3 = 3, // Initiated Brother/Sister
}

export class PromptLoaderService {
  private promptCache: Map<string, string> = new Map();
  private userLevelCache: Map<string, UserLevel> = new Map();

  // Level detection patterns
  private levelPatterns = {
    level3: [
      /guénon/i,
      /sub rosa/i,
      /akang/i,
      /karuhun/i,
      /sang hyang kersa/i,
      /hermetic/i,
      /kabbalah/i,
      /initiated/i,
    ],
    level2: [
      /spiritual practice/i,
      /consciousness/i,
      /jung/i,
      /alchemy/i,
      /philosophy/i,
      /taleb/i,
      /thiel/i,
      /clean architecture/i,
    ],
    level1: [
      /balance/i,
      /meaning/i,
      /culture/i,
      /wisdom/i,
      /mindfulness/i,
      /deeper/i,
      /philosophy/i,
    ],
  };

  /**
   * Detect user level based on query and context
   */
  detectUserLevel(query: string, context?: UserContext): UserLevel {
    // Check if we have cached level for this user
    if (context?.userId) {
      const cachedLevel = this.userLevelCache.get(context.userId);
      if (cachedLevel !== undefined) {
        // Allow level progression based on query
        const detectedLevel = this.analyzeQuery(query);
        if (detectedLevel > cachedLevel) {
          // User is asking deeper questions - allow progression
          this.userLevelCache.set(context.userId, detectedLevel);
          return detectedLevel;
        }
        return cachedLevel;
      }
    }

    // Analyze query for level indicators
    const level = this.analyzeQuery(query);

    // Cache the level if we have userId
    if (context?.userId) {
      this.userLevelCache.set(context.userId, level);
    }

    return level;
  }

  /**
   * Analyze query content to determine appropriate level
   */
  private analyzeQuery(query: string): UserLevel {
    const lowerQuery = query.toLowerCase();

    // Check for Level 3 patterns (highest priority)
    if (this.levelPatterns.level3.some((pattern) => pattern.test(query))) {
      return UserLevel.LEVEL_3;
    }

    // Check for Level 2 patterns
    if (this.levelPatterns.level2.some((pattern) => pattern.test(query))) {
      return UserLevel.LEVEL_2;
    }

    // Check for Level 1 patterns
    if (this.levelPatterns.level1.some((pattern) => pattern.test(query))) {
      return UserLevel.LEVEL_1;
    }

    // Default to Level 0
    return UserLevel.LEVEL_0;
  }

  /**
   * Load appropriate prompt based on user level
   */
  async loadPrompt(level: UserLevel): Promise<string> {
    const cacheKey = `prompt_level_${level}`;

    // Check cache
    const cached = this.promptCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let promptContent: string;

    switch (level) {
      case UserLevel.LEVEL_0:
        // Use compact prompt for Level 0
        promptContent = await this.loadPromptFile('SYSTEM_PROMPT_COMPACT.md');
        break;

      case UserLevel.LEVEL_1:
        // Load Level 1 specific prompt
        promptContent = await this.loadLevel1Prompt();
        break;

      case UserLevel.LEVEL_2:
        // Load Level 2 specific prompt
        promptContent = await this.loadLevel2Prompt();
        break;

      case UserLevel.LEVEL_3:
        // Load full prompt for Level 3
        promptContent = await this.loadPromptFile('SYSTEM_PROMPT.md');
        break;

      default:
        promptContent = await this.loadPromptFile('SYSTEM_PROMPT_COMPACT.md');
    }

    // Cache the prompt
    this.promptCache.set(cacheKey, promptContent);

    return promptContent;
  }

  /**
   * Load prompt file from disk
   */
  private async loadPromptFile(filename: string): Promise<string> {
    const promptPath = path.join(__dirname, '..', 'config', 'prompts', filename);

    try {
      return await fs.readFile(promptPath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to load prompt file ${filename}:`, error);
      // Fallback to basic prompt
      return this.getBasicPrompt();
    }
  }

  /**
   * Generate Level 1 prompt (subset of full prompt)
   */
  private async loadLevel1Prompt(): Promise<string> {
    // For now, use compact with additional wisdom
    const compact = await this.loadPromptFile('SYSTEM_PROMPT_COMPACT.md');

    const level1Addition = `

## LEVEL 1: CURIOUS SEEKER MODE

### Enhanced Capabilities
- Provide thoughtful, encouraging responses
- Reference accessible philosophy and wisdom
- Indonesian cultural insights (gotong royong, etc.)
- Practical wisdom from popular books
- Gentle expansion of horizons

### Tone Adjustment
- More thoughtful than Level 0
- Encourage deeper questions naturally
- Balance practical with philosophical
- Use accessible metaphors

### Knowledge Access
- Haruki Murakami, Carl Sagan references OK
- Basic mindfulness and wellness concepts
- Indonesian cultural wisdom
- Light coding concepts if relevant
`;

    return compact + level1Addition;
  }

  /**
   * Generate Level 2 prompt (expanded capabilities)
   */
  private async loadLevel2Prompt(): Promise<string> {
    const level1 = await this.loadLevel1Prompt();

    const level2Addition = `

## LEVEL 2: CONSCIOUS PRACTITIONER MODE

### Advanced Capabilities
- Peer-to-peer intellectual discourse
- Full literature corpus access
- Philosophy and spiritual traditions
- Advanced technical discussions
- Business wisdom and strategy
- Jungian and alchemical metaphors

### Tone Adjustment
- Intellectual rigor with warmth
- Assume high capacity for complexity
- Reference multiple traditions
- Balance high concepts with action

### Knowledge Access
- Borges, García Márquez, Pessoa
- Eastern philosophy (Tao, Gita, Buddhism)
- Peter Thiel, Nassim Taleb insights
- Clean Architecture, ML concepts
- Jung and practical esotericism
`;

    return level1 + level2Addition;
  }

  /**
   * Basic fallback prompt
   */
  private getBasicPrompt(): string {
    return `You are ZANTARA, Bali Zero's AI assistant.
Help with visa, company setup, tax, and legal services in Bali.
Be professional, warm, and helpful.
Provide accurate information and cite sources.
When uncertain, refer to the Bali Zero team.`;
  }

  /**
   * Get dynamic prompt for a specific query
   */
  async getDynamicPrompt(
    query: string,
    context?: UserContext
  ): Promise<{
    prompt: string;
    level: UserLevel;
    metadata: any;
  }> {
    const level = this.detectUserLevel(query, context);
    const prompt = await this.loadPrompt(level);

    return {
      prompt,
      level,
      metadata: {
        userId: context?.userId,
        detectedLevel: level,
        queryLength: query.length,
        language: context?.language || 'en',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Clear caches (useful for updates)
   */
  clearCaches(): void {
    this.promptCache.clear();
    this.userLevelCache.clear();
    logger.info('Prompt caches cleared');
  }

  /**
   * Get user's current level
   */
  getUserLevel(userId: string): UserLevel | undefined {
    return this.userLevelCache.get(userId);
  }

  /**
   * Manually set user level (for testing or admin override)
   */
  setUserLevel(userId: string, level: UserLevel): void {
    this.userLevelCache.set(userId, level);
  }
}

// Singleton instance
export const promptLoader = new PromptLoaderService();
