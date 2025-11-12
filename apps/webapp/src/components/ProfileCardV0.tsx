// 🎮 Profile Card - v0.dev UI integrated with GamificationEngine

import { useState, useEffect } from 'react';
import { UserProfile, UserLevel } from '../types/gamification';
import { GamificationEngine } from '../services/gamificationEngine';

interface ProfileCardProps {
  userProfile: UserProfile;
  onViewLeaderboard?: () => void;
}

export default function ProfileCardV0({ userProfile, onViewLeaderboard }: ProfileCardProps) {
  const xpPercentage = userProfile.xpToNextLevel > 0
    ? ((userProfile.xp / (userProfile.xp + userProfile.xpToNextLevel)) * 100)
    : 100;

  const stats = [
    { label: 'Quest Completate', value: userProfile.stats.questsCompleted },
    { label: 'Streak Corrente', value: userProfile.streak },
    { label: 'XP Totale', value: userProfile.totalXp },
    { label: 'Badge Guadagnati', value: userProfile.badges.length },
  ];

  // Show top 4 badges (most recent)
  const topBadges = userProfile.badges
    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
    .slice(0, 4);

  const getLevelColor = (level: UserLevel) => {
    switch (level) {
      case UserLevel.ROOKIE: return 'from-green-400 to-emerald-600';
      case UserLevel.EXPLORER: return 'from-blue-400 to-cyan-600';
      case UserLevel.EXPERT: return 'from-purple-400 to-violet-600';
      case UserLevel.MASTER: return 'from-amber-400 to-orange-500';
      case UserLevel.LEGEND: return 'from-pink-400 via-purple-500 to-indigo-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="glass-premium rounded-xl p-6">
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-4xl shadow-lg ring-2 ring-white/30">
          👤
        </div>
      </div>

      {/* Name and Role */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-1">{userProfile.displayName}</h2>
        <p className="text-sm text-white/60">{userProfile.username}</p>
      </div>

      {/* Level Badge */}
      <div className="flex justify-center mb-6">
        <div className={`px-4 py-2 bg-gradient-to-r ${getLevelColor(userProfile.level)} rounded-full text-sm font-semibold text-white shadow-lg ring-1 ring-white/40`}>
          {userProfile.level}
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-white/60 mb-2">
          <span>Progresso XP</span>
          <span className="text-amber-400 font-semibold">
            {userProfile.xp.toLocaleString()} / {(userProfile.xp + userProfile.xpToNextLevel).toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/30 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 transition-all duration-500 xp-glowing rounded-full"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="glass-card rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-400 mb-1">{stat.value}</p>
            <p className="text-xs text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badge Row */}
      <div className="flex gap-2 justify-center mb-4">
        {topBadges.map((badge, index) => (
          <div
            key={index}
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ring-2 ring-white/40 badge-metallic relative"
            title={badge.name}
          >
            <span className="relative z-10">{badge.icon}</span>
          </div>
        ))}
        {topBadges.length === 0 && (
          <>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ring-2 ring-white/20 bg-white/5">
              <span className="text-white/30">🔒</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ring-2 ring-white/20 bg-white/5">
              <span className="text-white/30">🔒</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ring-2 ring-white/20 bg-white/5">
              <span className="text-white/30">🔒</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg ring-2 ring-white/20 bg-white/5">
              <span className="text-white/30">🔒</span>
            </div>
          </>
        )}
      </div>

      {/* View Leaderboard Button */}
      {onViewLeaderboard && (
        <button
          onClick={onViewLeaderboard}
          className="w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-orange-500/50 ring-1 ring-white/20 hover:ring-white/40"
        >
          Classifica Team
        </button>
      )}
    </div>
  );
}
