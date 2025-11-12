// 🎮 NUZANTARA QUEST Dashboard - v0.dev UI integrated with backend services

import { useState, useEffect } from 'react';
import ProfileCardV0 from './ProfileCardV0';
import QuestBoardV0 from './QuestBoardV0';
import ZantaraChatWidgetV0 from './ZantaraChatWidgetV0';
import LeaderboardV0 from './LeaderboardV0';
import { UserProfile, Quest, LeaderboardEntry } from '../types/gamification';
import { GamificationEngine } from '../services/gamificationEngine';
import { QuestManager } from '../services/questManager';
import { TeachingEngine } from '../services/teachingEngine';

interface DashboardV0Props {
  userId: string;
  initialProfile?: UserProfile;
}

export default function DashboardV0({ userId, initialProfile }: DashboardV0Props) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leaderboard'>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile || null);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(!initialProfile);

  // Initialize data
  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // In a real implementation, these would be API calls
      // For now, using services directly

      // Load user profile
      if (!userProfile) {
        // Mock profile for testing
        const mockProfile: UserProfile = {
          userId,
          username: userId,
          displayName: 'Team Member',
          level: require('../types/gamification').UserLevel.EXPLORER,
          xp: 2400,
          xpToNextLevel: 2600,
          totalXp: 2400,
          streak: 7,
          longestStreak: 14,
          badges: [],
          achievements: [],
          activeQuests: [],
          completedQuests: 12,
          joinedAt: new Date(),
          lastActive: new Date(),
          stats: {
            questsCompleted: 12,
            dailyQuestsCompleted: 8,
            teamQuestsCompleted: 4,
            totalXpEarned: 2400,
            badgesUnlocked: 3,
            daysActive: 15,
            averageQuestsPerDay: 0.8,
            favoriteCategory: require('../types/gamification').QuestCategory.LEARNING,
            successRate: 85
          }
        };
        setUserProfile(mockProfile);
      }

      // Load quests
      const questManager = new QuestManager();
      const allQuests = questManager.getAllQuests();

      setActiveQuests(allQuests.filter(q => !q.completed).slice(0, 5));
      setCompletedQuests(allQuests.filter(q => q.completed).slice(0, 10));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestClick = (quest: Quest) => {
    console.log('Quest clicked:', quest);
    // TODO: Open quest detail modal or navigate to quest page
  };

  const handleChatMessage = async (message: string): Promise<string> => {
    try {
      // Check if it's a learning query
      const learningKeywords = ['insegnami', 'spiega', 'come funziona', 'cos\'è', 'perché'];
      const isLearningQuery = learningKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );

      if (isLearningQuery && userProfile) {
        const teachingEngine = new TeachingEngine();

        // Try to extract topic from message
        const concepts = Object.keys(require('../types/gamification').SYSTEM_CONCEPTS);
        const matchedConcept = concepts.find(concept =>
          message.toLowerCase().includes(concept.toLowerCase().replace(/_/g, ' '))
        );

        if (matchedConcept) {
          const content = teachingEngine.getTeachingContent(matchedConcept, userProfile.level);
          return content.explanation;
        }

        // Generic learning response
        return `Ciao! Posso insegnarti questi concetti:\n\n` +
               `• Come ZANTARA Trova le Informazioni\n` +
               `• I 4 Esperti di ZANTARA\n` +
               `• Come ZANTARA Ti Ricorda\n\n` +
               `Chiedi "Spiega [nome concetto]" per iniziare! 🧠`;
      }

      // Default response for other queries
      return `Ottima domanda! Continua a completare le quest per sbloccare nuove funzionalità e badge. Hai ${userProfile?.xpToNextLevel || 0} XP fino al prossimo livello! 🚀`;

    } catch (error) {
      console.error('Error handling chat message:', error);
      return 'Ops, ho avuto un problema. Riprova!';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center">
        <div className="text-white text-xl">Caricamento dashboard...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center">
        <div className="text-white text-xl">Errore: profilo non trovato</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#2B2B2B] p-4 md:p-8">
      {activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Left Sidebar - Profile */}
          <div className="md:col-span-1">
            <ProfileCardV0
              userProfile={userProfile}
              onViewLeaderboard={() => setActiveTab('leaderboard')}
            />
          </div>

          {/* Center Panel - Quests */}
          <div className="md:col-span-1">
            <QuestBoardV0
              activeQuests={activeQuests}
              completedQuests={completedQuests}
              teamQuests={[]}
              onQuestClick={handleQuestClick}
            />
          </div>

          {/* Right Sidebar - Chat */}
          <div className="md:col-span-1">
            <ZantaraChatWidgetV0
              userLevel={userProfile.level}
              onSendMessage={handleChatMessage}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mb-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            ← Torna al Dashboard
          </button>
          <LeaderboardV0 currentUserId={userId} />
        </div>
      )}
    </main>
  );
}
