// 🎯 Individual Quest Card Component

import React, { useState } from 'react';
import { Quest, QuestDifficulty } from '../types/gamification';

interface QuestCardProps {
  quest: Quest;
  isActive: boolean;
  onAccept?: () => void;
  onComplete?: () => void;
  onUpdateProgress?: (progress: number) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  isActive,
  onAccept,
  onComplete,
  onUpdateProgress
}) => {
  const [expanded, setExpanded] = useState(false);

  const difficultyConfig = {
    [QuestDifficulty.EASY]: { emoji: '🟢', color: 'green', label: 'Easy' },
    [QuestDifficulty.MEDIUM]: { emoji: '🟡', color: 'yellow', label: 'Medium' },
    [QuestDifficulty.HARD]: { emoji: '🔴', color: 'red', label: 'Hard' },
    [QuestDifficulty.LEGENDARY]: { emoji: '🟣', color: 'purple', label: 'Legendary' }
  };

  const difficulty = difficultyConfig[quest.difficulty];
  const progressPercentage = (quest.progress / quest.total) * 100;

  const categoryEmojis = {
    monitoring: '🔍',
    analysis: '📊',
    configuration: '⚙️',
    optimization: '🚀',
    learning: '📚',
    collaboration: '🤝'
  };

  return (
    <div className={`quest-card difficulty-${difficulty.color} ${quest.completed ? 'completed' : ''}`}>
      <div className="quest-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="quest-title-row">
          <span className="category-emoji">{categoryEmojis[quest.category]}</span>
          <h3>{quest.title}</h3>
          <span className="difficulty-badge">
            {difficulty.emoji} {difficulty.label}
          </span>
        </div>

        <div className="quest-meta">
          <span className="xp-reward">⭐ {quest.xpReward} XP</span>
          {quest.type === 'daily' && <span className="quest-type">☀️ Daily</span>}
          {quest.type === 'team' && <span className="quest-type">👥 Team</span>}
          {quest.dueDate && (
            <span className="due-date">
              ⏰ {new Date(quest.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {isActive && (
        <div className="quest-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="progress-text">
            {quest.progress} / {quest.total} ({Math.round(progressPercentage)}%)
          </span>
        </div>
      )}

      {expanded && (
        <div className="quest-card-body">
          <p className="quest-description">{quest.description}</p>

          {quest.requirements && quest.requirements.length > 0 && (
            <div className="quest-requirements">
              <h4>Requirements:</h4>
              <ul>
                {quest.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {quest.steps && quest.steps.length > 0 && (
            <div className="quest-steps">
              <h4>Steps:</h4>
              <ul className="steps-list">
                {quest.steps.map(step => (
                  <li key={step.id} className={step.completed ? 'completed' : ''}>
                    <input
                      type="checkbox"
                      checked={step.completed}
                      disabled={!isActive}
                      readOnly
                    />
                    <div className="step-info">
                      <strong>{step.title}</strong>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="quest-card-actions">
            {!isActive && onAccept && (
              <button className="btn-primary" onClick={onAccept}>
                Accept Quest 🎯
              </button>
            )}

            {isActive && !quest.completed && (
              <>
                {onUpdateProgress && (
                  <button
                    className="btn-secondary"
                    onClick={() => onUpdateProgress(quest.progress + 1)}
                  >
                    Update Progress
                  </button>
                )}
                {quest.progress >= quest.total && onComplete && (
                  <button className="btn-success" onClick={onComplete}>
                    Complete Quest ✅
                  </button>
                )}
              </>
            )}

            {quest.completed && (
              <div className="quest-completed-badge">
                ✅ Completed!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
