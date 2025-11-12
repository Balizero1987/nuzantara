// 🏆 Leaderboard Component

import React from 'react';
import { LeaderboardEntry, UserLevel } from '../types/gamification';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserId }) => {
  const levelEmojis: Record<UserLevel, string> = {
    [UserLevel.ROOKIE]: '🔰',
    [UserLevel.EXPLORER]: '🗺️',
    [UserLevel.EXPERT]: '💎',
    [UserLevel.MASTER]: '👑',
    [UserLevel.LEGEND]: '⭐'
  };

  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="leaderboard-widget">
      <h3>🏆 Leaderboard</h3>

      <div className="leaderboard-list">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.userId === currentUserId;
          const rankEmoji = rankEmojis[index] || `${index + 1}️⃣`;

          return (
            <div
              key={entry.userId}
              className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="rank">{rankEmoji}</div>

              <div className="player-info">
                <div className="player-name">
                  {entry.displayName}
                  {isCurrentUser && <span className="you-badge">YOU</span>}
                </div>
                <div className="player-level">
                  {levelEmojis[entry.level]} {entry.level}
                </div>
              </div>

              <div className="player-stats">
                <div className="stat">
                  <span className="stat-value">{entry.xp}</span>
                  <span className="stat-label">XP</span>
                </div>
                {entry.streak > 0 && (
                  <div className="stat streak">
                    <span className="stat-value">🔥 {entry.streak}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="leaderboard-footer">
        <p>Team Streak: 🔥 12 days</p>
      </div>
    </div>
  );
};
