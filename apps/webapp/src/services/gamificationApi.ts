// 🌐 Gamification API Client

import {
  UserProfile,
  Quest,
  LeaderboardEntry,
  DailyChallenge,
  TeamQuest,
  Notification,
  PowerUp
} from '../types/gamification';

// Base API URL - adjust based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nuzantara.com/api';

/**
 * API Client for Gamification System
 */
export class GamificationApi {
  private static async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // === USER PROFILE ===

  static async getUserProfile(userId: string): Promise<UserProfile> {
    return this.fetchWithAuth(`/gamification/profile/${userId}`);
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.fetchWithAuth(`/gamification/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  static async updateStreak(userId: string): Promise<UserProfile> {
    return this.fetchWithAuth(`/gamification/profile/${userId}/streak`, {
      method: 'POST'
    });
  }

  // === QUESTS ===

  static async getActiveQuests(userId: string): Promise<Quest[]> {
    return this.fetchWithAuth(`/gamification/quests/active/${userId}`);
  }

  static async getAvailableQuests(userId: string): Promise<Quest[]> {
    return this.fetchWithAuth(`/gamification/quests/available/${userId}`);
  }

  static async acceptQuest(userId: string, questId: string): Promise<Quest> {
    return this.fetchWithAuth(`/gamification/quests/accept`, {
      method: 'POST',
      body: JSON.stringify({ userId, questId })
    });
  }

  static async updateQuestProgress(
    userId: string,
    questId: string,
    progress: number
  ): Promise<Quest> {
    return this.fetchWithAuth(`/gamification/quests/${questId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ userId, progress })
    });
  }

  static async completeQuest(userId: string, questId: string): Promise<{
    quest: Quest;
    profile: UserProfile;
    rewards: any;
  }> {
    return this.fetchWithAuth(`/gamification/quests/${questId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  static async completeQuestStep(
    userId: string,
    questId: string,
    stepId: string
  ): Promise<Quest> {
    return this.fetchWithAuth(`/gamification/quests/${questId}/steps/${stepId}`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // === DAILY CHALLENGES ===

  static async getDailyChallenge(userId: string): Promise<DailyChallenge> {
    return this.fetchWithAuth(`/gamification/daily-challenge/${userId}`);
  }

  static async completeDailyChallenge(userId: string): Promise<{
    challenge: DailyChallenge;
    profile: UserProfile;
    bonusXp: number;
  }> {
    return this.fetchWithAuth(`/gamification/daily-challenge/${userId}/complete`, {
      method: 'POST'
    });
  }

  // === LEADERBOARD ===

  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    return this.fetchWithAuth(`/gamification/leaderboard?limit=${limit}`);
  }

  static async getTeamLeaderboard(teamId: string): Promise<LeaderboardEntry[]> {
    return this.fetchWithAuth(`/gamification/leaderboard/team/${teamId}`);
  }

  // === TEAM QUESTS ===

  static async getTeamQuests(teamId: string): Promise<TeamQuest[]> {
    return this.fetchWithAuth(`/gamification/team/${teamId}/quests`);
  }

  static async joinTeamQuest(userId: string, questId: string, role: string): Promise<TeamQuest> {
    return this.fetchWithAuth(`/gamification/team/quests/${questId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId, role })
    });
  }

  // === NOTIFICATIONS ===

  static async getNotifications(userId: string): Promise<Notification[]> {
    return this.fetchWithAuth(`/gamification/notifications/${userId}`);
  }

  static async markNotificationRead(notificationId: string): Promise<void> {
    return this.fetchWithAuth(`/gamification/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }

  // === POWER-UPS ===

  static async getAvailablePowerUps(userId: string): Promise<PowerUp[]> {
    return this.fetchWithAuth(`/gamification/powerups/${userId}`);
  }

  static async activatePowerUp(userId: string, powerUpId: string): Promise<PowerUp> {
    return this.fetchWithAuth(`/gamification/powerups/${powerUpId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // === STATISTICS ===

  static async getUserStats(userId: string): Promise<any> {
    return this.fetchWithAuth(`/gamification/stats/${userId}`);
  }

  static async getTeamStats(teamId: string): Promise<any> {
    return this.fetchWithAuth(`/gamification/stats/team/${teamId}`);
  }

  // === AGENT MONITORING (Integration with existing Nuzantara APIs) ===

  static async getAgentHealth(agentName: string): Promise<any> {
    return this.fetchWithAuth(`/admin/dashboard/agents/${agentName}/health`);
  }

  static async getAllAgentsHealth(): Promise<any> {
    return this.fetchWithAuth(`/admin/dashboard/agents/health`);
  }

  static async getRevenueMetrics(): Promise<any> {
    return this.fetchWithAuth(`/admin/dashboard/revenue`);
  }

  static async getSystemMetrics(): Promise<any> {
    return this.fetchWithAuth(`/admin/dashboard/metrics`);
  }

  // === RAG INTEGRATION ===

  static async ragQuery(query: string, userId: string): Promise<any> {
    return this.fetchWithAuth(`/api/rag/query`, {
      method: 'POST',
      body: JSON.stringify({
        query,
        userId,
        includeMetadata: true
      })
    });
  }

  static async addDocumentToRag(
    document: { title: string; content: string; metadata?: any },
    userId: string
  ): Promise<any> {
    return this.fetchWithAuth(`/api/rag/documents`, {
      method: 'POST',
      body: JSON.stringify({ ...document, userId })
    });
  }
}

/**
 * Real-time updates using SSE (Server-Sent Events)
 */
export class GamificationRealtimeClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(userId: string) {
    const token = localStorage.getItem('authToken');
    this.eventSource = new EventSource(
      `${API_BASE_URL}/gamification/stream/${userId}?token=${token}`
    );

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      this.reconnect(userId);
    };
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: (data: any) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  private emit(eventType: string, data: any) {
    this.listeners.get(eventType)?.forEach(callback => callback(data));
  }

  private reconnect(userId: string) {
    setTimeout(() => {
      console.log('Reconnecting SSE...');
      this.connect(userId);
    }, 5000);
  }

  disconnect() {
    this.eventSource?.close();
    this.listeners.clear();
  }
}
