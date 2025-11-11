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
  NIGHT_OWL = 'night_owl',
  // Intelligence & Architecture badges
  SYSTEM_EXPLORER = 'system_explorer',
  RAG_MASTER = 'rag_master',
  PROMPT_ENGINEER = 'prompt_engineer',
  DATA_ARCHITECT = 'data_architect',
  SYSTEM_INTELLIGENCE = 'system_intelligence',
  JUNIOR_ARCHITECT = 'junior_architect',
  ARCHITECT = 'architect',
  TEACHER = 'teacher'
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
  COLLABORATION = 'collaboration',
  INTELLIGENCE = 'intelligence', // System understanding
  ARCHITECTURE = 'architecture'  // System design
}

export enum LearningTrack {
  BUSINESS = 'business',           // Daily work tasks
  INTELLIGENCE = 'intelligence',   // System understanding
  ARCHITECT = 'architect'          // System design & contribution
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
  // Learning layers
  learningTrack?: LearningTrack;
  intelligenceLayer?: IntelligenceLayer;
  unlocks?: string[]; // Quest IDs that unlock after completing this
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

// === INTELLIGENCE & LEARNING SYSTEM ===

export interface IntelligenceLayer {
  didYouKnow: string;               // Fun fact about what happened
  technicalExplanation: string;     // How the system works
  deepDive?: DeepDive;              // Optional deep technical content
  relatedConcepts?: string[];       // Related topics to explore
  unlockQuest?: string;             // Quest ID that gets unlocked
}

export interface DeepDive {
  title: string;
  sections: DeepDiveSection[];
  visualAid?: string;               // ASCII diagram or visual representation
  practicalExample?: string;        // Real-world example
  furtherReading?: string[];        // Links or quest IDs
}

export interface DeepDiveSection {
  heading: string;
  content: string;
  code?: string;                    // Code example if applicable
}

export interface SystemKnowledge {
  userId: string;
  conceptsLearned: LearnedConcept[];
  intelligenceLevel: number;        // 0-100
  architectPoints: number;          // Points toward architect track
  teachingScore: number;            // How much they've taught others
}

export interface LearnedConcept {
  id: string;
  name: string;
  category: 'rag' | 'agents' | 'nlp' | 'architecture' | 'integration' | 'performance';
  learnedAt: Date;
  masteryLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  questsCompleted: string[];        // Quest IDs related to this concept
}

export interface TeachingContent {
  topic: string;
  explanation: string;
  examples: string[];
  interactiveDemo?: boolean;
  quiz?: TeachingQuiz;
}

export interface TeachingQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// System concepts that can be learned
export const SYSTEM_CONCEPTS = {
  // RAG & Knowledge
  RAG_BASICS: {
    id: 'rag_basics',
    name: 'RAG (Retrieval Augmented Generation)',
    description: 'How ZANTARA finds and uses information from 25K+ documents',
    requiredLevel: UserLevel.ROOKIE
  },
  SEMANTIC_SEARCH: {
    id: 'semantic_search',
    name: 'Semantic Search',
    description: 'Understanding meaning, not just keywords',
    requiredLevel: UserLevel.EXPLORER
  },
  VECTOR_EMBEDDINGS: {
    id: 'vector_embeddings',
    name: 'Vector Embeddings',
    description: 'How text becomes searchable math',
    requiredLevel: UserLevel.EXPERT
  },
  CHROMADB: {
    id: 'chromadb',
    name: 'ChromaDB Vector Database',
    description: 'Where and how knowledge is stored',
    requiredLevel: UserLevel.EXPERT
  },

  // Agents & AI
  MULTI_AGENT: {
    id: 'multi_agent',
    name: 'Multi-Agent Architecture',
    description: 'Immigration, Health, Revenue, Memory - how they work together',
    requiredLevel: UserLevel.EXPLORER
  },
  LLAMA_VS_CLAUDE: {
    id: 'llama_vs_claude',
    name: 'Llama 4 Scout vs Claude Haiku',
    description: 'When and why ZANTARA switches models',
    requiredLevel: UserLevel.EXPERT
  },
  NLP_PIPELINE: {
    id: 'nlp_pipeline',
    name: 'NLP Pipeline',
    description: 'Entity extraction, intent classification, sentiment analysis',
    requiredLevel: UserLevel.EXPERT
  },

  // Architecture & Performance
  PERSISTENT_MEMORY: {
    id: 'persistent_memory',
    name: 'Persistent Memory System',
    description: 'How ZANTARA remembers conversations and learns',
    requiredLevel: UserLevel.EXPLORER
  },
  REDIS_CACHE: {
    id: 'redis_cache',
    name: 'Redis Caching',
    description: 'Why responses are fast (60-80% cache hit rate)',
    requiredLevel: UserLevel.EXPERT
  },
  CIRCUIT_BREAKER: {
    id: 'circuit_breaker',
    name: 'Circuit Breaker Pattern',
    description: 'System resilience and failure handling',
    requiredLevel: UserLevel.MASTER
  },

  // Integration
  GOOGLE_WORKSPACE: {
    id: 'google_workspace',
    name: 'Google Workspace Integration',
    description: 'Drive, Calendar, Sheets, Gmail integration',
    requiredLevel: UserLevel.EXPLORER
  },
  API_DESIGN: {
    id: 'api_design',
    name: 'API Architecture',
    description: '50+ REST endpoints, design patterns',
    requiredLevel: UserLevel.MASTER
  }
};

// Learning paths that guide users through concepts
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  track: LearningTrack;
  concepts: string[];               // Concept IDs in order
  quests: string[];                 // Quest IDs in order
  finalBadge: BadgeType;
  estimatedTime: string;            // e.g., "2 weeks"
}

export const LEARNING_PATHS: Record<string, LearningPath> = {
  RAG_MASTER_PATH: {
    id: 'rag_master_path',
    name: 'RAG Mastery',
    description: 'Become an expert in how ZANTARA finds and uses knowledge',
    track: LearningTrack.INTELLIGENCE,
    concepts: ['rag_basics', 'semantic_search', 'vector_embeddings', 'chromadb'],
    quests: ['quest_rag_intro', 'quest_rag_training', 'quest_rag_deep_dive', 'quest_rag_optimization'],
    finalBadge: BadgeType.RAG_MASTER,
    estimatedTime: '2 weeks'
  },
  ARCHITECT_PATH: {
    id: 'architect_path',
    name: 'System Architect',
    description: 'Understand system architecture and contribute to design',
    track: LearningTrack.ARCHITECT,
    concepts: ['multi_agent', 'persistent_memory', 'redis_cache', 'circuit_breaker', 'api_design'],
    quests: ['quest_architecture_map', 'quest_design_review', 'quest_propose_improvement'],
    finalBadge: BadgeType.ARCHITECT,
    estimatedTime: '1 month'
  },
  PROMPT_ENGINEER_PATH: {
    id: 'prompt_engineer_path',
    name: 'Prompt Engineering',
    description: 'Master the art of asking ZANTARA perfect questions',
    track: LearningTrack.INTELLIGENCE,
    concepts: ['llama_vs_claude', 'nlp_pipeline'],
    quests: ['quest_prompt_basics', 'quest_advanced_prompting', 'quest_prompt_optimization'],
    finalBadge: BadgeType.PROMPT_ENGINEER,
    estimatedTime: '1 week'
  }
};
