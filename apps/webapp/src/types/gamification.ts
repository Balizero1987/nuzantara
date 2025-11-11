// 🎮 Gamification System Types

export enum UserLevel {
  ROOKIE = 'Rookie',
  EXPLORER = 'Explorer',
  EXPERT = 'Expert',
  MASTER = 'Master',
  LEGEND = 'Legend'
}

export enum BadgeType {
  FIRST_STEPS = 'first_steps',
  DATA_DETECTIVE = 'data_detective',
  CHAT_MASTER = 'chat_master',
  SPEED_RUNNER = 'speed_runner',
  TEAM_PLAYER = 'team_player',
  AI_WHISPERER = 'ai_whisperer',
  CRISIS_MANAGER = 'crisis_manager',
  PERFECT_WEEK = 'perfect_week',
  EARLY_BIRD = 'early_bird',
  NIGHT_OWL = 'night_owl'
}

export enum QuestDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  LEGENDARY = 'legendary'
}

export enum QuestType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  SINGLE = 'single',
  TEAM = 'team',
  EVENT = 'event'
}

export enum QuestCategory {
  MONITORING = 'monitoring',
  ANALYSIS = 'analysis',
  CONFIGURATION = 'configuration',
  OPTIMIZATION = 'optimization',
  LEARNING = 'learning',
  COLLABORATION = 'collaboration'
}

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
  rewards: {
    xp: number;
    badges?: BadgeType[];
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  type: QuestType;
  category: QuestCategory;
  xpReward: number;
  progress: number;
  total: number;
  completed: boolean;
  dueDate?: Date;
  requirements?: string[];
  steps?: QuestStep[];
  teamSize?: number; // For team quests
}

export interface QuestStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  level: UserLevel;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  streak: number;
  longestStreak: number;
  badges: Badge[];
  achievements: Achievement[];
  activeQuests: Quest[];
  completedQuests: number;
  joinedAt: Date;
  lastActive: Date;
  stats: UserStats;
}

export interface UserStats {
  questsCompleted: number;
  dailyQuestsCompleted: number;
  teamQuestsCompleted: number;
  totalXpEarned: number;
  badgesUnlocked: number;
  daysActive: number;
  averageQuestsPerDay: number;
  favoriteCategory: QuestCategory;
  successRate: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  level: UserLevel;
  xp: number;
  badges: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface DailyChallenge {
  id: string;
  date: Date;
  quests: Quest[];
  bonusXp: number;
  completed: boolean;
}

export interface TeamQuest extends Quest {
  teamId: string;
  teamName: string;
  participants: Array<{
    userId: string;
    username: string;
    role: string;
    progress: number;
  }>;
  teamProgress: number;
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  severity: 'info' | 'warning' | 'urgent';
  xpReward: number;
  badgeReward?: BadgeType;
  expiresAt: Date;
  accepted: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'xp_boost' | 'hint' | 'exclusive_quest' | 'collaboration';
  duration?: number; // in minutes
  multiplier?: number;
  active: boolean;
  activatedAt?: Date;
}

export interface Notification {
  id: string;
  type: 'quest_complete' | 'level_up' | 'badge_unlock' | 'event' | 'team' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Level thresholds
export const LEVEL_THRESHOLDS = {
  [UserLevel.ROOKIE]: { min: 0, max: 500 },
  [UserLevel.EXPLORER]: { min: 500, max: 1500 },
  [UserLevel.EXPERT]: { min: 1500, max: 3500 },
  [UserLevel.MASTER]: { min: 3500, max: 7500 },
  [UserLevel.LEGEND]: { min: 7500, max: Infinity }
};

// XP rewards by difficulty
export const XP_REWARDS = {
  [QuestDifficulty.EASY]: 20,
  [QuestDifficulty.MEDIUM]: 50,
  [QuestDifficulty.HARD]: 100,
  [QuestDifficulty.LEGENDARY]: 250
};

// Streak bonuses
export const STREAK_BONUSES = {
  3: 1.1,  // +10%
  7: 1.25, // +25%
  14: 1.5, // +50%
  30: 2.0  // +100%
};
