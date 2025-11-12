// 🎮 Main Gamification Dashboard Component

import React, { useEffect, useState } from 'react';
import { UserProfile, Quest, LeaderboardEntry, DailyChallenge, Notification } from '../types/gamification';
import { GamificationApi, GamificationRealtimeClient } from '../services/gamificationApi';
import { QuestManager } from '../services/questManager';
import { ProfileCard } from './ProfileCard';
import { QuestBoard } from './QuestBoard';
import { ZantaraChatWidget } from './ZantaraChatWidget';
import { Leaderboard } from './Leaderboard';
import { SystemHealthWidget } from './SystemHealthWidget';
import { NotificationCenter } from './NotificationCenter';

interface GameDashboardProps {
  userId: string;
}

export const GameDashboard: React.FC<GameDashboardProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeClient] = useState(() => new GamificationRealtimeClient());

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    setupRealtimeUpdates();

    return () => {
      realtimeClient.disconnect();
    };
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        profileData,
        activeQuestsData,
        availableQuestsData,
        leaderboardData,
        dailyChallengeData,
        notificationsData
      ] = await Promise.all([
        GamificationApi.getUserProfile(userId),
        GamificationApi.getActiveQuests(userId),
        GamificationApi.getAvailableQuests(userId),
        GamificationApi.getLeaderboard(10),
        GamificationApi.getDailyChallenge(userId),
        GamificationApi.getNotifications(userId)
      ]);

      setProfile(profileData);
      setActiveQuests(activeQuestsData);
      setAvailableQuests(availableQuestsData);
      setLeaderboard(leaderboardData);
      setDailyChallenge(dailyChallengeData);
      setNotifications(notificationsData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    realtimeClient.connect(userId);

    // Listen for profile updates
    realtimeClient.on('profile_update', (data: UserProfile) => {
      setProfile(data);
    });

    // Listen for quest updates
    realtimeClient.on('quest_update', (data: Quest) => {
      setActiveQuests(prev =>
        prev.map(q => q.id === data.id ? data : q)
      );
    });

    // Listen for new notifications
    realtimeClient.on('notification', (data: Notification) => {
      setNotifications(prev => [data, ...prev]);
    });

    // Listen for leaderboard updates
    realtimeClient.on('leaderboard_update', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });
  };

  const handleQuestAccept = async (questId: string) => {
    try {
      const quest = await GamificationApi.acceptQuest(userId, questId);
      setActiveQuests(prev => [...prev, quest]);
      setAvailableQuests(prev => prev.filter(q => q.id !== questId));
    } catch (error) {
      console.error('Failed to accept quest:', error);
    }
  };

  const handleQuestComplete = async (questId: string) => {
    try {
      const result = await GamificationApi.completeQuest(userId, questId);

      setProfile(result.profile);
      setActiveQuests(prev => prev.filter(q => q.id !== questId));

      // Show reward notification
      if (result.rewards.levelUp) {
        showNotification('Level Up!', `You reached ${result.profile.level}! 🎉`);
      }
      if (result.rewards.badges) {
        result.rewards.badges.forEach(badge => {
          showNotification('Badge Unlocked!', `${badge.icon} ${badge.name}`);
        });
      }

      // Reload available quests
      const newAvailable = await GamificationApi.getAvailableQuests(userId);
      setAvailableQuests(newAvailable);

    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  const handleQuestProgress = async (questId: string, progress: number) => {
    try {
      const updated = await GamificationApi.updateQuestProgress(userId, questId, progress);
      setActiveQuests(prev =>
        prev.map(q => q.id === questId ? updated : q)
      );
    } catch (error) {
      console.error('Failed to update quest progress:', error);
    }
  };

  const showNotification = (title: string, message: string) => {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type: 'quest_complete',
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
  };

  if (loading) {
    return (
      <div className="game-dashboard loading">
        <div className="loading-spinner">Loading your adventure...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="game-dashboard error">
        <div className="error-message">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="game-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>🎮 NUZANTARA QUEST</h1>
        <NotificationCenter
          notifications={notifications}
          onMarkRead={(id) => GamificationApi.markNotificationRead(id)}
        />
      </header>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">

        {/* Left Column - Profile & Leaderboard */}
        <aside className="dashboard-sidebar">
          <ProfileCard profile={profile} />

          <div className="daily-challenge-widget">
            <h3>☀️ Daily Challenge</h3>
            {dailyChallenge && (
              <div className="daily-challenge">
                <p>Complete all daily quests for +{dailyChallenge.bonusXp} XP bonus!</p>
                <div className="progress">
                  {dailyChallenge.quests.filter(q => q.completed).length} / {dailyChallenge.quests.length}
                </div>
              </div>
            )}
          </div>

          <Leaderboard entries={leaderboard} currentUserId={userId} />
        </aside>

        {/* Center Column - Quests */}
        <main className="dashboard-main">
          <QuestBoard
            activeQuests={activeQuests}
            availableQuests={availableQuests}
            onAcceptQuest={handleQuestAccept}
            onCompleteQuest={handleQuestComplete}
            onUpdateProgress={handleQuestProgress}
            userLevel={profile.level}
          />
        </main>

        {/* Right Column - Chat & System Health */}
        <aside className="dashboard-sidebar-right">
          <ZantaraChatWidget
            userId={userId}
            userProfile={profile}
          />

          <SystemHealthWidget />
        </aside>
      </div>
    </div>
  );
};
