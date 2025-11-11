// 🎮 Gamification Engine - Core Logic

import {
  UserProfile,
  UserLevel,
  Quest,
  Badge,
  BadgeType,
  QuestDifficulty,
  Achievement,
  LEVEL_THRESHOLDS,
  XP_REWARDS,
  STREAK_BONUSES
} from '../types/gamification';

export class GamificationEngine {
  /**
   * Calculate user level based on total XP
   */
  static calculateLevel(totalXp: number): UserLevel {
    if (totalXp >= LEVEL_THRESHOLDS[UserLevel.LEGEND].min) {
      return UserLevel.LEGEND;
    }
    if (totalXp >= LEVEL_THRESHOLDS[UserLevel.MASTER].min) {
      return UserLevel.MASTER;
    }
    if (totalXp >= LEVEL_THRESHOLDS[UserLevel.EXPERT].min) {
      return UserLevel.EXPERT;
    }
    if (totalXp >= LEVEL_THRESHOLDS[UserLevel.EXPLORER].min) {
      return UserLevel.EXPLORER;
    }
    return UserLevel.ROOKIE;
  }

  /**
   * Calculate XP needed for next level
   */
  static calculateXpToNextLevel(currentLevel: UserLevel, currentXp: number): number {
    const levelKeys = Object.keys(LEVEL_THRESHOLDS) as UserLevel[];
    const currentIndex = levelKeys.indexOf(currentLevel);

    if (currentIndex === levelKeys.length - 1) {
      return 0; // Max level reached
    }

    const nextLevel = levelKeys[currentIndex + 1];
    return LEVEL_THRESHOLDS[nextLevel].min - currentXp;
  }

  /**
   * Calculate XP reward with streak bonus
   */
  static calculateXpReward(baseXp: number, streak: number): number {
    let multiplier = 1.0;

    // Apply streak bonus
    const streakKeys = Object.keys(STREAK_BONUSES).map(Number).sort((a, b) => b - a);
    for (const threshold of streakKeys) {
      if (streak >= threshold) {
        multiplier = STREAK_BONUSES[threshold as keyof typeof STREAK_BONUSES];
        break;
      }
    }

    return Math.floor(baseXp * multiplier);
  }

  /**
   * Award XP to user and check for level up
   */
  static awardXp(profile: UserProfile, xp: number): {
    newProfile: UserProfile;
    leveledUp: boolean;
    newLevel?: UserLevel;
    xpAwarded: number;
  } {
    const oldLevel = profile.level;
    const xpAwarded = this.calculateXpReward(xp, profile.streak);
    const newTotalXp = profile.totalXp + xpAwarded;
    const newLevel = this.calculateLevel(newTotalXp);
    const leveledUp = newLevel !== oldLevel;

    const updatedProfile: UserProfile = {
      ...profile,
      xp: profile.xp + xpAwarded,
      totalXp: newTotalXp,
      level: newLevel,
      xpToNextLevel: this.calculateXpToNextLevel(newLevel, newTotalXp),
      stats: {
        ...profile.stats,
        totalXpEarned: profile.stats.totalXpEarned + xpAwarded
      }
    };

    return {
      newProfile: updatedProfile,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      xpAwarded
    };
  }

  /**
   * Complete a quest and award rewards
   */
  static completeQuest(profile: UserProfile, quest: Quest): {
    newProfile: UserProfile;
    rewards: {
      xp: number;
      badges?: Badge[];
      levelUp?: boolean;
    };
  } {
    // Award XP
    const { newProfile, leveledUp, xpAwarded } = this.awardXp(profile, quest.xpReward);

    // Update quest stats
    newProfile.stats.questsCompleted++;
    if (quest.type === 'daily') {
      newProfile.stats.dailyQuestsCompleted++;
    }
    if (quest.type === 'team') {
      newProfile.stats.teamQuestsCompleted++;
    }

    // Remove from active quests
    newProfile.activeQuests = newProfile.activeQuests.filter(q => q.id !== quest.id);
    newProfile.completedQuests++;

    // Check for new badges
    const newBadges = this.checkBadgeEligibility(newProfile);

    return {
      newProfile: {
        ...newProfile,
        badges: [...newProfile.badges, ...newBadges]
      },
      rewards: {
        xp: xpAwarded,
        badges: newBadges.length > 0 ? newBadges : undefined,
        levelUp: leveledUp
      }
    };
  }

  /**
   * Update streak - call this daily
   */
  static updateStreak(profile: UserProfile, wasActiveToday: boolean): UserProfile {
    if (!wasActiveToday) {
      // Streak broken
      return {
        ...profile,
        streak: 0
      };
    }

    const newStreak = profile.streak + 1;
    return {
      ...profile,
      streak: newStreak,
      longestStreak: Math.max(newStreak, profile.longestStreak)
    };
  }

  /**
   * Check badge eligibility based on stats
   */
  static checkBadgeEligibility(profile: UserProfile): Badge[] {
    const newBadges: Badge[] = [];
    const existingBadgeTypes = profile.badges.map(b => b.type);

    // First Steps - Complete first quest
    if (!existingBadgeTypes.includes(BadgeType.FIRST_STEPS) && profile.completedQuests >= 1) {
      newBadges.push(this.createBadge(BadgeType.FIRST_STEPS));
    }

    // Data Detective - Analyze 50 documents
    if (!existingBadgeTypes.includes(BadgeType.DATA_DETECTIVE) && profile.stats.questsCompleted >= 50) {
      newBadges.push(this.createBadge(BadgeType.DATA_DETECTIVE));
    }

    // Speed Runner - Complete 5 quests in one day
    if (!existingBadgeTypes.includes(BadgeType.SPEED_RUNNER) && profile.stats.averageQuestsPerDay >= 5) {
      newBadges.push(this.createBadge(BadgeType.SPEED_RUNNER));
    }

    // Team Player - Complete 3 team quests
    if (!existingBadgeTypes.includes(BadgeType.TEAM_PLAYER) && profile.stats.teamQuestsCompleted >= 3) {
      newBadges.push(this.createBadge(BadgeType.TEAM_PLAYER));
    }

    // Perfect Week - 7 day streak
    if (!existingBadgeTypes.includes(BadgeType.PERFECT_WEEK) && profile.streak >= 7) {
      newBadges.push(this.createBadge(BadgeType.PERFECT_WEEK));
    }

    return newBadges;
  }

  /**
   * Create badge object
   */
  private static createBadge(type: BadgeType): Badge {
    const badgeDefinitions: Record<BadgeType, { name: string; description: string; icon: string; rarity: Badge['rarity'] }> = {
      [BadgeType.FIRST_STEPS]: {
        name: 'First Steps',
        description: 'Complete your first quest',
        icon: '🔰',
        rarity: 'common'
      },
      [BadgeType.DATA_DETECTIVE]: {
        name: 'Data Detective',
        description: 'Complete 50 quests',
        icon: '🔍',
        rarity: 'rare'
      },
      [BadgeType.CHAT_MASTER]: {
        name: 'Chat Master',
        description: 'Have 100 conversations with ZANTARA',
        icon: '💬',
        rarity: 'rare'
      },
      [BadgeType.SPEED_RUNNER]: {
        name: 'Speed Runner',
        description: 'Complete 5 quests in one day',
        icon: '🚀',
        rarity: 'epic'
      },
      [BadgeType.TEAM_PLAYER]: {
        name: 'Team Player',
        description: 'Complete 3 team quests',
        icon: '🤝',
        rarity: 'rare'
      },
      [BadgeType.AI_WHISPERER]: {
        name: 'AI Whisperer',
        description: 'Successfully train the RAG system',
        icon: '🧠',
        rarity: 'epic'
      },
      [BadgeType.CRISIS_MANAGER]: {
        name: 'Crisis Manager',
        description: 'Handle an urgent event successfully',
        icon: '🚨',
        rarity: 'legendary'
      },
      [BadgeType.PERFECT_WEEK]: {
        name: 'Perfect Week',
        description: 'Maintain a 7-day streak',
        icon: '⭐',
        rarity: 'epic'
      },
      [BadgeType.EARLY_BIRD]: {
        name: 'Early Bird',
        description: 'Complete quests before 9 AM for 7 days',
        icon: '🌅',
        rarity: 'rare'
      },
      [BadgeType.NIGHT_OWL]: {
        name: 'Night Owl',
        description: 'Complete quests after 10 PM for 7 days',
        icon: '🦉',
        rarity: 'rare'
      }
    };

    const def = badgeDefinitions[type];
    return {
      id: `badge_${type}_${Date.now()}`,
      type,
      name: def.name,
      description: def.description,
      icon: def.icon,
      rarity: def.rarity,
      unlockedAt: new Date()
    };
  }

  /**
   * Calculate success rate
   */
  static calculateSuccessRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  /**
   * Get leaderboard position
   */
  static calculateRank(userXp: number, allUsersXp: number[]): number {
    const sorted = [...allUsersXp].sort((a, b) => b - a);
    return sorted.indexOf(userXp) + 1;
  }

  /**
   * Generate recommended quests based on user level and stats
   */
  static generateRecommendedQuests(profile: UserProfile, availableQuests: Quest[]): Quest[] {
    const levelWeights = {
      [UserLevel.ROOKIE]: { easy: 0.7, medium: 0.3, hard: 0, legendary: 0 },
      [UserLevel.EXPLORER]: { easy: 0.4, medium: 0.5, hard: 0.1, legendary: 0 },
      [UserLevel.EXPERT]: { easy: 0.2, medium: 0.5, hard: 0.3, legendary: 0 },
      [UserLevel.MASTER]: { easy: 0.1, medium: 0.3, hard: 0.5, legendary: 0.1 },
      [UserLevel.LEGEND]: { easy: 0, medium: 0.2, hard: 0.5, legendary: 0.3 }
    };

    const weights = levelWeights[profile.level];

    // Filter and score quests
    const scoredQuests = availableQuests
      .filter(q => !profile.activeQuests.find(aq => aq.id === q.id))
      .map(quest => {
        let score = 0;

        // Difficulty match
        score += weights[quest.difficulty] * 100;

        // Favorite category boost
        if (quest.category === profile.stats.favoriteCategory) {
          score += 20;
        }

        // Daily quest priority
        if (quest.type === 'daily') {
          score += 15;
        }

        return { quest, score };
      })
      .sort((a, b) => b.score - a.score);

    return scoredQuests.slice(0, 5).map(sq => sq.quest);
  }
}
