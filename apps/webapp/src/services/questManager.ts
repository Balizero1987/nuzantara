// 📜 Quest Manager - Quest Generation and Management

import {
  Quest,
  QuestDifficulty,
  QuestType,
  QuestCategory,
  QuestStep,
  DailyChallenge,
  TeamQuest,
  UserLevel
} from '../types/gamification';

export class QuestManager {
  /**
   * Generate daily quests
   */
  static generateDailyQuests(date: Date = new Date()): Quest[] {
    const dailyQuests: Quest[] = [
      {
        id: `daily_health_${date.toISOString().split('T')[0]}`,
        title: 'System Health Check',
        description: 'Review health status of all agents and verify they are operational',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.DAILY,
        category: QuestCategory.MONITORING,
        xpReward: 20,
        progress: 0,
        total: 4,
        completed: false,
        steps: [
          { id: '1', title: 'Check Immigration Agent', description: 'Verify status and logs', completed: false, order: 1 },
          { id: '2', title: 'Check Health Agent', description: 'Review health metrics', completed: false, order: 2 },
          { id: '3', title: 'Check Revenue Agent', description: 'Analyze revenue data', completed: false, order: 3 },
          { id: '4', title: 'Check Memory Service', description: 'Verify memory usage', completed: false, order: 4 }
        ]
      },
      {
        id: `daily_feedback_${date.toISOString().split('T')[0]}`,
        title: 'User Feedback Review',
        description: 'Read and categorize 5 user feedback messages',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.DAILY,
        category: QuestCategory.ANALYSIS,
        xpReward: 30,
        progress: 0,
        total: 5,
        completed: false
      },
      {
        id: `daily_chat_${date.toISOString().split('T')[0]}`,
        title: 'ZANTARA Conversation',
        description: 'Have a conversation with ZANTARA to learn system features',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.DAILY,
        category: QuestCategory.LEARNING,
        xpReward: 25,
        progress: 0,
        total: 1,
        completed: false
      }
    ];

    return dailyQuests;
  }

  /**
   * Generate quest library categorized by difficulty and type
   */
  static getQuestLibrary(): Quest[] {
    return [
      // === EASY QUESTS ===
      {
        id: 'quest_immigration_inspect',
        title: 'Inspect Immigration Agent',
        description: 'Check the Immigration Agent status, review logs, and verify response times',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.SINGLE,
        category: QuestCategory.MONITORING,
        xpReward: 50,
        progress: 0,
        total: 3,
        completed: false,
        steps: [
          { id: '1', title: 'View Agent Status', description: 'Check if agent is online', completed: false, order: 1 },
          { id: '2', title: 'Review Recent Logs', description: 'Check for any errors', completed: false, order: 2 },
          { id: '3', title: 'Test Response Time', description: 'Measure API latency', completed: false, order: 3 }
        ]
      },
      {
        id: 'quest_revenue_report',
        title: 'Generate Revenue Report',
        description: 'Extract revenue data and create a summary report',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.SINGLE,
        category: QuestCategory.ANALYSIS,
        xpReward: 50,
        progress: 0,
        total: 1,
        completed: false
      },
      {
        id: 'quest_rag_search',
        title: 'RAG System Search',
        description: 'Perform 5 different searches using the RAG system to understand its capabilities',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.SINGLE,
        category: QuestCategory.LEARNING,
        xpReward: 40,
        progress: 0,
        total: 5,
        completed: false
      },
      {
        id: 'quest_dashboard_tour',
        title: 'Dashboard Exploration',
        description: 'Explore all dashboard sections and understand each widget',
        difficulty: QuestDifficulty.EASY,
        type: QuestType.SINGLE,
        category: QuestCategory.LEARNING,
        xpReward: 35,
        progress: 0,
        total: 6,
        completed: false
      },

      // === MEDIUM QUESTS ===
      {
        id: 'quest_rag_training',
        title: 'Train the RAG',
        description: 'Add 10 new documents to the RAG system and verify indexing',
        difficulty: QuestDifficulty.MEDIUM,
        type: QuestType.SINGLE,
        category: QuestCategory.CONFIGURATION,
        xpReward: 75,
        progress: 0,
        total: 10,
        completed: false,
        requirements: ['Complete "RAG System Search" quest first']
      },
      {
        id: 'quest_trend_analysis',
        title: 'Weekly Trend Analysis',
        description: 'Analyze system metrics for the past week and identify patterns',
        difficulty: QuestDifficulty.MEDIUM,
        type: QuestType.SINGLE,
        category: QuestCategory.ANALYSIS,
        xpReward: 80,
        progress: 0,
        total: 1,
        completed: false,
        steps: [
          { id: '1', title: 'Collect Data', description: 'Gather metrics from all agents', completed: false, order: 1 },
          { id: '2', title: 'Identify Patterns', description: 'Find trends and anomalies', completed: false, order: 2 },
          { id: '3', title: 'Create Report', description: 'Document findings', completed: false, order: 3 }
        ]
      },
      {
        id: 'quest_alert_config',
        title: 'Configure Custom Alert',
        description: 'Set up a custom monitoring alert for system performance',
        difficulty: QuestDifficulty.MEDIUM,
        type: QuestType.SINGLE,
        category: QuestCategory.CONFIGURATION,
        xpReward: 70,
        progress: 0,
        total: 1,
        completed: false
      },
      {
        id: 'quest_sentiment_analysis',
        title: 'Sentiment Analysis',
        description: 'Analyze sentiment of 20 user feedback messages',
        difficulty: QuestDifficulty.MEDIUM,
        type: QuestType.SINGLE,
        category: QuestCategory.ANALYSIS,
        xpReward: 65,
        progress: 0,
        total: 20,
        completed: false
      },
      {
        id: 'quest_api_optimization',
        title: 'API Response Optimization',
        description: 'Identify and optimize slow API endpoints',
        difficulty: QuestDifficulty.MEDIUM,
        type: QuestType.SINGLE,
        category: QuestCategory.OPTIMIZATION,
        xpReward: 85,
        progress: 0,
        total: 3,
        completed: false
      },

      // === HARD QUESTS ===
      {
        id: 'quest_performance_boost',
        title: 'Performance Boost Challenge',
        description: 'Improve average API response time by 20%',
        difficulty: QuestDifficulty.HARD,
        type: QuestType.SINGLE,
        category: QuestCategory.OPTIMIZATION,
        xpReward: 150,
        progress: 0,
        total: 1,
        completed: false,
        requirements: ['Level 3 Explorer or higher', 'Complete "API Response Optimization"']
      },
      {
        id: 'quest_custom_dashboard',
        title: 'Create Custom Dashboard',
        description: 'Design and implement a personalized analytics dashboard',
        difficulty: QuestDifficulty.HARD,
        type: QuestType.SINGLE,
        category: QuestCategory.CONFIGURATION,
        xpReward: 120,
        progress: 0,
        total: 1,
        completed: false,
        steps: [
          { id: '1', title: 'Plan Layout', description: 'Design dashboard structure', completed: false, order: 1 },
          { id: '2', title: 'Add Widgets', description: 'Configure data visualizations', completed: false, order: 2 },
          { id: '3', title: 'Test & Refine', description: 'Verify all widgets work correctly', completed: false, order: 3 }
        ]
      },
      {
        id: 'quest_external_integration',
        title: 'External Service Integration',
        description: 'Connect a new external service to Nuzantara',
        difficulty: QuestDifficulty.HARD,
        type: QuestType.SINGLE,
        category: QuestCategory.CONFIGURATION,
        xpReward: 180,
        progress: 0,
        total: 1,
        completed: false,
        requirements: ['Level 4 Expert or higher']
      },
      {
        id: 'quest_ai_model_tuning',
        title: 'AI Model Fine-tuning',
        description: 'Optimize AI model parameters for better performance',
        difficulty: QuestDifficulty.HARD,
        type: QuestType.SINGLE,
        category: QuestCategory.OPTIMIZATION,
        xpReward: 200,
        progress: 0,
        total: 1,
        completed: false,
        requirements: ['Level 5 Expert or higher', 'Complete "Train the RAG"']
      },

      // === TEAM QUESTS ===
      {
        id: 'team_revenue_boost',
        title: 'Revenue Boost Challenge',
        description: 'Team effort to increase conversion rate by 15%',
        difficulty: QuestDifficulty.HARD,
        type: QuestType.TEAM,
        category: QuestCategory.COLLABORATION,
        xpReward: 500,
        progress: 0,
        total: 1,
        completed: false,
        teamSize: 4
      },
      {
        id: 'team_documentation',
        title: 'System Documentation Sprint',
        description: 'Team creates comprehensive documentation for all agents',
        difficulty: QuestDifficulty.MEDIUM,
        type: QuestType.TEAM,
        category: QuestCategory.COLLABORATION,
        xpReward: 300,
        progress: 0,
        total: 1,
        completed: false,
        teamSize: 3
      }
    ];
  }

  /**
   * Get quests appropriate for user level
   */
  static getQuestsForLevel(level: UserLevel): Quest[] {
    const allQuests = this.getQuestLibrary();

    const levelFilters: Record<UserLevel, (q: Quest) => boolean> = {
      [UserLevel.ROOKIE]: (q) => q.difficulty === QuestDifficulty.EASY,
      [UserLevel.EXPLORER]: (q) =>
        q.difficulty === QuestDifficulty.EASY || q.difficulty === QuestDifficulty.MEDIUM,
      [UserLevel.EXPERT]: (q) =>
        q.difficulty !== QuestDifficulty.LEGENDARY,
      [UserLevel.MASTER]: () => true,
      [UserLevel.LEGEND]: () => true
    };

    return allQuests.filter(levelFilters[level]);
  }

  /**
   * Update quest progress
   */
  static updateQuestProgress(quest: Quest, increment: number = 1): Quest {
    const newProgress = Math.min(quest.progress + increment, quest.total);
    const completed = newProgress >= quest.total;

    return {
      ...quest,
      progress: newProgress,
      completed
    };
  }

  /**
   * Update quest step
   */
  static completeQuestStep(quest: Quest, stepId: string): Quest {
    if (!quest.steps) return quest;

    const updatedSteps = quest.steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    );

    const completedSteps = updatedSteps.filter(s => s.completed).length;

    return {
      ...quest,
      steps: updatedSteps,
      progress: completedSteps,
      total: updatedSteps.length,
      completed: completedSteps === updatedSteps.length
    };
  }

  /**
   * Create daily challenge
   */
  static createDailyChallenge(date: Date = new Date()): DailyChallenge {
    const dailyQuests = this.generateDailyQuests(date);

    return {
      id: `daily_challenge_${date.toISOString().split('T')[0]}`,
      date,
      quests: dailyQuests,
      bonusXp: 50,
      completed: false
    };
  }

  /**
   * Check if daily challenge is completed
   */
  static isDailyChallengeCompleted(challenge: DailyChallenge): boolean {
    return challenge.quests.every(q => q.completed);
  }

  /**
   * Get quest by category
   */
  static getQuestsByCategory(category: QuestCategory): Quest[] {
    return this.getQuestLibrary().filter(q => q.category === category);
  }

  /**
   * Search quests
   */
  static searchQuests(query: string): Quest[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getQuestLibrary().filter(q =>
      q.title.toLowerCase().includes(lowercaseQuery) ||
      q.description.toLowerCase().includes(lowercaseQuery)
    );
  }
}
