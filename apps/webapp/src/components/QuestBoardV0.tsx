// 🎮 Quest Board - v0.dev UI integrated with QuestManager

import { useState } from 'react';
import { Quest, QuestDifficulty, QuestCategory } from '../types/gamification';

interface QuestBoardProps {
  activeQuests: Quest[];
  completedQuests?: Quest[];
  teamQuests?: Quest[];
  onQuestClick?: (quest: Quest) => void;
}

export default function QuestBoardV0({
  activeQuests,
  completedQuests = [],
  teamQuests = [],
  onQuestClick
}: QuestBoardProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'team'>('active');

  const difficultyColors: Record<QuestDifficulty, string> = {
    [QuestDifficulty.EASY]: '#10B981',
    [QuestDifficulty.MEDIUM]: '#F59E0B',
    [QuestDifficulty.HARD]: '#EF4444',
    [QuestDifficulty.LEGENDARY]: '#8B5CF6'
  };

  const getQuestColor = (difficulty: QuestDifficulty) => {
    return difficultyColors[difficulty];
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 33) return '#EF4444';
    if (progress < 67) return '#F59E0B';
    return '#10B981';
  };

  const calculateProgress = (quest: Quest) => {
    return quest.total > 0 ? (quest.progress / quest.total) * 100 : 0;
  };

  const getCategoryLabel = (category: QuestCategory) => {
    const labels: Record<QuestCategory, string> = {
      [QuestCategory.MONITORING]: 'Monitoraggio',
      [QuestCategory.ANALYSIS]: 'Analisi',
      [QuestCategory.CONFIGURATION]: 'Configurazione',
      [QuestCategory.OPTIMIZATION]: 'Ottimizzazione',
      [QuestCategory.LEARNING]: 'Apprendimento',
      [QuestCategory.COLLABORATION]: 'Collaborazione',
      [QuestCategory.INTELLIGENCE]: 'Intelligenza',
      [QuestCategory.ARCHITECTURE]: 'Architettura'
    };
    return labels[category];
  };

  const getDifficultyLabel = (difficulty: QuestDifficulty) => {
    const labels: Record<QuestDifficulty, string> = {
      [QuestDifficulty.EASY]: 'Facile',
      [QuestDifficulty.MEDIUM]: 'Media',
      [QuestDifficulty.HARD]: 'Difficile',
      [QuestDifficulty.LEGENDARY]: 'Leggendaria'
    };
    return labels[difficulty];
  };

  const getCurrentQuests = () => {
    if (activeTab === 'active') return activeQuests;
    if (activeTab === 'completed') return completedQuests;
    return teamQuests;
  };

  const quests = getCurrentQuests();

  return (
    <div className="glass-premium rounded-xl p-6 h-full">
      {/* Header with Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/15 pb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'active'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          Attive
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'completed'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          Completate
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'team'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          Team
        </button>
      </div>

      {/* Quest Cards */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {quests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60 text-sm">
              {activeTab === 'active' && 'Nessuna quest attiva al momento'}
              {activeTab === 'completed' && 'Nessuna quest completata ancora'}
              {activeTab === 'team' && 'Nessuna quest di team disponibile'}
            </p>
          </div>
        )}

        {quests.map((quest) => {
          const progress = calculateProgress(quest);
          return (
            <div
              key={quest.id}
              className="group glass-card border-l-4 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-all"
              style={{ borderLeftColor: getQuestColor(quest.difficulty) }}
              onClick={() => onQuestClick?.(quest)}
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                    {quest.title}
                  </h3>
                  <p className="text-xs text-white/60">{quest.description}</p>
                </div>

                {/* Category Badge */}
                <div className="ml-3 px-2 py-1 bg-white/10 rounded text-xs text-white/80 font-medium whitespace-nowrap">
                  {getCategoryLabel(quest.category)}
                </div>
              </div>

              {/* Intelligence Layer Indicator */}
              {quest.intelligenceLayer && (
                <div className="mb-3 flex items-center gap-2 text-xs text-purple-400">
                  <span>🧠</span>
                  <span>Include spiegazione tecnica</span>
                </div>
              )}

              {/* Progress Section */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.total}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: getProgressBarColor(progress)
                    }}
                  />
                </div>
              </div>

              {/* Footer Row */}
              <div className="flex justify-between items-center">
                {/* Difficulty Badge */}
                <div
                  className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: getQuestColor(quest.difficulty) }}
                >
                  {getDifficultyLabel(quest.difficulty)}
                </div>

                {/* XP Reward */}
                <div className="flex items-center gap-1">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-bold text-amber-400">+{quest.xpReward} XP</span>
                </div>
              </div>

              {/* Due Date if exists */}
              {quest.dueDate && !quest.completed && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-xs text-white/50">
                    Scadenza: {new Date(quest.dueDate).toLocaleDateString('it-IT')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
