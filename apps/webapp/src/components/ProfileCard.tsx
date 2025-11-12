// 👤 User Profile Card Component

import React from 'react';
import { UserProfile, UserLevel, LEVEL_THRESHOLDS } from '../types/gamification';

interface ProfileCardProps {
  profile: UserProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const xpPercentage = (profile.xp / profile.xpToNextLevel) * 100;

  const levelEmojis: Record<UserLevel, string> = {
    [UserLevel.ROOKIE]: '🔰',
    [UserLevel.EXPLORER]: '🗺️',
    [UserLevel.EXPERT]: '💎',
    [UserLevel.MASTER]: '👑',
    [UserLevel.LEGEND]: '⭐'
  };

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar">
          {profile.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h3>{profile.displayName}</h3>
          <p className="username">@{profile.username}</p>
        </div>
      </div>

      <div className="level-section">
        <div className="level-badge">
          <span className="level-emoji">{levelEmojis[profile.level]}</span>
          <span className="level-text">Level {profile.level}</span>
        </div>

        <div className="xp-bar-container">
          <div className="xp-bar">
            <div
              className="xp-bar-fill"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <div className="xp-text">
            {profile.xp} / {profile.xpToNextLevel} XP
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{profile.streak}</div>
          <div className="stat-label">🔥 Streak</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{profile.badges.length}</div>
          <div className="stat-label">🎖️ Badges</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{profile.completedQuests}</div>
          <div className="stat-label">✅ Quests</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{profile.stats.daysActive}</div>
          <div className="stat-label">📅 Days</div>
        </div>
      </div>

      {profile.badges.length > 0 && (
        <div className="badges-preview">
          <h4>Recent Badges</h4>
          <div className="badges-row">
            {profile.badges.slice(-5).reverse().map(badge => (
              <div
                key={badge.id}
                className={`badge-icon rarity-${badge.rarity}`}
                title={`${badge.name}: ${badge.description}`}
              >
                {badge.icon}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
