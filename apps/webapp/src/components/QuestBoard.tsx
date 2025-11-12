// 📜 Quest Board Component

import React, { useState } from 'react';
import { Quest, QuestDifficulty, UserLevel } from '../types/gamification';
import { QuestCard } from './QuestCard';

interface QuestBoardProps {
  activeQuests: Quest[];
  availableQuests: Quest[];
  onAcceptQuest: (questId: string) => void;
  onCompleteQuest: (questId: string) => void;
  onUpdateProgress: (questId: string, progress: number) => void;
  userLevel: UserLevel;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({
  activeQuests,
  availableQuests,
  onAcceptQuest,
  onCompleteQuest,
  onUpdateProgress,
  userLevel
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');
  const [filterDifficulty, setFilterDifficulty] = useState<QuestDifficulty | 'all'>('all');

  const filteredAvailableQuests = filterDifficulty === 'all'
    ? availableQuests
    : availableQuests.filter(q => q.difficulty === filterDifficulty);

  return (
    <div className="quest-board">
      <div className="quest-board-header">
        <h2>📜 Quest Board</h2>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active ({activeQuests.length})
          </button>
          <button
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available ({availableQuests.length})
          </button>
        </div>
      </div>

      {activeTab === 'available' && (
        <div className="quest-filters">
          <label>Difficulty:</label>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
            <option value="legendary">🟣 Legendary</option>
          </select>
        </div>
      )}

      <div className="quest-list">
        {activeTab === 'active' ? (
          activeQuests.length === 0 ? (
            <div className="empty-state">
              <p>No active quests!</p>
              <p>Start a new adventure from the Available tab 🎯</p>
            </div>
          ) : (
            activeQuests.map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                isActive={true}
                onComplete={() => onCompleteQuest(quest.id)}
                onUpdateProgress={(progress) => onUpdateProgress(quest.id, progress)}
              />
            ))
          )
        ) : (
          filteredAvailableQuests.length === 0 ? (
            <div className="empty-state">
              <p>No quests available with selected filters</p>
            </div>
          ) : (
            filteredAvailableQuests.map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                isActive={false}
                onAccept={() => onAcceptQuest(quest.id)}
              />
            ))
          )
        )}
      </div>

      <div className="quest-board-footer">
        <div className="tip">
          💡 Tip: Complete quests to earn XP and unlock badges!
        </div>
      </div>
    </div>
  );
};
