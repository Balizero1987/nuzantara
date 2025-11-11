// 💬 ZANTARA Chat Service - Natural Language Interface

import { GamificationApi } from './gamificationApi';
import { Quest, UserProfile } from '../types/gamification';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: any[];
    questSuggestions?: Quest[];
    ragSources?: any[];
  };
}

export interface ChatContext {
  userId: string;
  sessionId: string;
  userProfile?: UserProfile;
  recentQuests?: Quest[];
}

/**
 * ZANTARA - Natural Language Chat Interface
 * Integrates with existing RAG system and provides conversational UI
 */
export class ZantaraChat {
  private context: ChatContext;
  private messageHistory: ChatMessage[] = [];

  constructor(context: ChatContext) {
    this.context = context;
  }

  /**
   * Send message to ZANTARA
   */
  async sendMessage(userMessage: string): Promise<ChatMessage> {
    // Add user message to history
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.messageHistory.push(userMsg);

    try {
      // Analyze intent
      const intent = this.analyzeIntent(userMessage);

      // Route to appropriate handler
      let response: ChatMessage;

      switch (intent.type) {
        case 'quest_query':
          response = await this.handleQuestQuery(userMessage, intent);
          break;
        case 'agent_status':
          response = await this.handleAgentStatus(userMessage, intent);
          break;
        case 'analytics':
          response = await this.handleAnalytics(userMessage, intent);
          break;
        case 'help':
          response = await this.handleHelp(userMessage);
          break;
        case 'rag_search':
          response = await this.handleRagSearch(userMessage);
          break;
        default:
          response = await this.handleGeneral(userMessage);
      }

      this.messageHistory.push(response);
      return response;

    } catch (error) {
      console.error('ZANTARA Error:', error);
      return this.createErrorResponse();
    }
  }

  /**
   * Analyze user intent using pattern matching
   */
  private analyzeIntent(message: string): { type: string; entities: any } {
    const lowerMsg = message.toLowerCase();

    // Quest related
    if (
      lowerMsg.includes('quest') ||
      lowerMsg.includes('task') ||
      lowerMsg.includes('mission') ||
      lowerMsg.includes('che posso fare') ||
      lowerMsg.includes('cosa fare')
    ) {
      return { type: 'quest_query', entities: {} };
    }

    // Agent status
    if (
      lowerMsg.includes('status') ||
      lowerMsg.includes('stato') ||
      lowerMsg.includes('agent') ||
      lowerMsg.includes('health') ||
      lowerMsg.includes('immigration') ||
      lowerMsg.includes('revenue')
    ) {
      const agentMatch = lowerMsg.match(/(immigration|health|revenue|memory)/);
      return {
        type: 'agent_status',
        entities: { agent: agentMatch?.[1] || 'all' }
      };
    }

    // Analytics
    if (
      lowerMsg.includes('trend') ||
      lowerMsg.includes('report') ||
      lowerMsg.includes('analytics') ||
      lowerMsg.includes('metrics') ||
      lowerMsg.includes('statistic')
    ) {
      return { type: 'analytics', entities: {} };
    }

    // Help
    if (
      lowerMsg.includes('help') ||
      lowerMsg.includes('aiuto') ||
      lowerMsg.includes('come') ||
      lowerMsg.includes('how')
    ) {
      return { type: 'help', entities: {} };
    }

    // RAG search (default for questions)
    if (lowerMsg.includes('?') || lowerMsg.startsWith('what') || lowerMsg.startsWith('cosa')) {
      return { type: 'rag_search', entities: {} };
    }

    return { type: 'general', entities: {} };
  }

  /**
   * Handle quest-related queries
   */
  private async handleQuestQuery(message: string, intent: any): Promise<ChatMessage> {
    try {
      const availableQuests = await GamificationApi.getAvailableQuests(this.context.userId);
      const activeQuests = await GamificationApi.getActiveQuests(this.context.userId);

      const lowerMsg = message.toLowerCase();

      // User wants quest suggestions
      if (
        lowerMsg.includes('suggest') ||
        lowerMsg.includes('recommend') ||
        lowerMsg.includes('quali') ||
        lowerMsg.includes('che posso')
      ) {
        const suggestions = availableQuests.slice(0, 3);
        const content = this.formatQuestSuggestions(suggestions);

        return {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content,
          timestamp: new Date(),
          metadata: { intent: 'quest_suggestion', questSuggestions: suggestions }
        };
      }

      // User wants to see active quests
      if (lowerMsg.includes('active') || lowerMsg.includes('attive') || lowerMsg.includes('mie')) {
        const content = this.formatActiveQuests(activeQuests);

        return {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content,
          timestamp: new Date(),
          metadata: { intent: 'active_quests', questSuggestions: activeQuests }
        };
      }

      // Default: show available quests
      const content = `🎯 Ho trovato ${availableQuests.length} quest disponibili per te!\n\n` +
        this.formatQuestList(availableQuests.slice(0, 5));

      return {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        metadata: { intent: 'quest_list', questSuggestions: availableQuests }
      };

    } catch (error) {
      return this.createErrorResponse();
    }
  }

  /**
   * Handle agent status queries
   */
  private async handleAgentStatus(message: string, intent: any): Promise<ChatMessage> {
    try {
      const agentName = intent.entities.agent;

      if (agentName === 'all') {
        const health = await GamificationApi.getAllAgentsHealth();
        const content = this.formatAllAgentsStatus(health);

        return {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content,
          timestamp: new Date(),
          metadata: { intent: 'agent_status_all' }
        };
      } else {
        const health = await GamificationApi.getAgentHealth(agentName);
        const content = this.formatAgentStatus(agentName, health);

        return {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content,
          timestamp: new Date(),
          metadata: { intent: 'agent_status_single' }
        };
      }
    } catch (error) {
      return this.createErrorResponse();
    }
  }

  /**
   * Handle analytics queries
   */
  private async handleAnalytics(message: string, intent: any): Promise<ChatMessage> {
    try {
      const metrics = await GamificationApi.getSystemMetrics();
      const content = this.formatAnalytics(metrics);

      return {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        metadata: { intent: 'analytics' }
      };
    } catch (error) {
      return this.createErrorResponse();
    }
  }

  /**
   * Handle help requests
   */
  private async handleHelp(message: string): Promise<ChatMessage> {
    const content = `👋 Ciao! Sono ZANTARA, la tua AI companion per Nuzantara!\n\n` +
      `Ecco cosa posso fare per te:\n\n` +
      `🎯 **Quest & Tasks**\n` +
      `- "Mostrami le quest disponibili"\n` +
      `- "Quali task posso fare?"\n` +
      `- "Le mie quest attive"\n\n` +
      `🤖 **Agent Monitoring**\n` +
      `- "Stato dell'Immigration Agent"\n` +
      `- "Come stanno gli agenti?"\n` +
      `- "Health check di tutti gli agenti"\n\n` +
      `📊 **Analytics**\n` +
      `- "Mostrami i trend della settimana"\n` +
      `- "Report delle metriche"\n` +
      `- "Analisi del sistema"\n\n` +
      `🔍 **Ricerca**\n` +
      `- Fai qualsiasi domanda e cercherò nella knowledge base!\n\n` +
      `Cosa vuoi fare? 😊`;

    return {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: { intent: 'help' }
    };
  }

  /**
   * Handle RAG search
   */
  private async handleRagSearch(message: string): Promise<ChatMessage> {
    try {
      const result = await GamificationApi.ragQuery(message, this.context.userId);

      const content = `🔍 ${result.answer}\n\n` +
        (result.sources?.length > 0
          ? `📚 Fonti:\n${result.sources.map((s: any, i: number) => `${i + 1}. ${s.title}`).join('\n')}`
          : '');

      return {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        metadata: { intent: 'rag_search', ragSources: result.sources }
      };
    } catch (error) {
      return this.createErrorResponse();
    }
  }

  /**
   * Handle general conversation
   */
  private async handleGeneral(message: string): Promise<ChatMessage> {
    const responses = [
      'Interessante! Vuoi che ti aiuti con qualche quest o monitoraggio?',
      'Capisco. Posso suggerirti delle task da fare, vuoi?',
      'Ok! Cosa vuoi esplorare del sistema?',
      'Perfetto! Ti posso aiutare con quest, monitoring o analytics. Cosa preferisci?'
    ];

    const content = responses[Math.floor(Math.random() * responses.length)];

    return {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: { intent: 'general' }
    };
  }

  // === FORMATTING HELPERS ===

  private formatQuestSuggestions(quests: Quest[]): string {
    if (quests.length === 0) {
      return 'Al momento non ci sono quest disponibili per il tuo livello. 😊';
    }

    let content = '🎯 Ecco le quest che ti consiglio:\n\n';

    quests.forEach((quest, index) => {
      const difficultyEmoji = {
        easy: '🟢',
        medium: '🟡',
        hard: '🔴',
        legendary: '🟣'
      }[quest.difficulty];

      content += `${index + 1}. ${difficultyEmoji} **${quest.title}**\n`;
      content += `   ${quest.description}\n`;
      content += `   Reward: ⭐ ${quest.xpReward} XP\n\n`;
    });

    content += 'Quale vuoi iniziare? 😊';

    return content;
  }

  private formatActiveQuests(quests: Quest[]): string {
    if (quests.length === 0) {
      return 'Non hai quest attive al momento. Vuoi che te ne suggerisca qualcuna? 🎯';
    }

    let content = '📋 Le tue quest attive:\n\n';

    quests.forEach((quest, index) => {
      const progress = Math.round((quest.progress / quest.total) * 100);
      const progressBar = this.createProgressBar(progress);

      content += `${index + 1}. **${quest.title}**\n`;
      content += `   ${progressBar} ${progress}%\n`;
      content += `   Reward: ⭐ ${quest.xpReward} XP\n\n`;
    });

    return content;
  }

  private formatQuestList(quests: Quest[]): string {
    return quests.map((q, i) => {
      const diffEmoji = { easy: '🟢', medium: '🟡', hard: '🔴', legendary: '🟣' }[q.difficulty];
      return `${i + 1}. ${diffEmoji} ${q.title} (⭐ ${q.xpReward} XP)`;
    }).join('\n');
  }

  private formatAgentStatus(agentName: string, health: any): string {
    const statusEmoji = health.status === 'healthy' ? '✅' : '⚠️';

    return `${statusEmoji} **${agentName.toUpperCase()} Agent**\n\n` +
      `Status: ${health.status}\n` +
      `Uptime: ${health.uptime || 'N/A'}\n` +
      `Response Time: ${health.responseTime || 'N/A'}\n` +
      `Requests Today: ${health.requestsToday || 0}`;
  }

  private formatAllAgentsStatus(healthData: any): string {
    let content = '🤖 **System Health Overview**\n\n';

    Object.entries(healthData.agents || {}).forEach(([name, data]: [string, any]) => {
      const emoji = data.status === 'healthy' ? '✅' : '⚠️';
      content += `${emoji} ${name}: ${data.status} (${data.uptime || 'N/A'})\n`;
    });

    return content;
  }

  private formatAnalytics(metrics: any): string {
    return `📊 **System Analytics**\n\n` +
      `Total Requests: ${metrics.totalRequests || 0}\n` +
      `Avg Response Time: ${metrics.avgResponseTime || 'N/A'}\n` +
      `Success Rate: ${metrics.successRate || 'N/A'}%\n` +
      `Active Users: ${metrics.activeUsers || 0}`;
  }

  private createProgressBar(percentage: number): string {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private createErrorResponse(): ChatMessage {
    return {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: '😅 Oops! Ho avuto un problema. Puoi riprovare?',
      timestamp: new Date()
    };
  }

  /**
   * Get message history
   */
  getHistory(): ChatMessage[] {
    return this.messageHistory;
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }
}
