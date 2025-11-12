// 🎮 Leaderboard - v0.dev UI

import { useState, useEffect } from 'react';
import { LeaderboardEntry, UserLevel } from '../types/gamification';

interface LeaderboardV0Props {
  currentUserId?: string;
}

export default function LeaderboardV0({ currentUserId }: LeaderboardV0Props) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Mock data for testing
      // In real implementation, this would fetch from API
      const mockData: LeaderboardEntry[] = [
        {
          rank: 1,
          userId: 'user1',
          username: 'jordan_smith',
          displayName: 'Jordan Smith',
          level: UserLevel.LEGEND,
          xp: 12500,
          badges: 24,
          streak: 30,
          isCurrentUser: currentUserId === 'user1'
        },
        {
          rank: 2,
          userId: 'user2',
          username: 'taylor_wong',
          displayName: 'Taylor Wong',
          level: UserLevel.MASTER,
          xp: 11800,
          badges: 22,
          streak: 25,
          isCurrentUser: currentUserId === 'user2'
        },
        {
          rank: 3,
          userId: 'user3',
          username: 'morgan_brown',
          displayName: 'Morgan Brown',
          level: UserLevel.MASTER,
          xp: 10900,
          badges: 20,
          streak: 20,
          isCurrentUser: currentUserId === 'user3'
        },
        {
          rank: 4,
          userId: 'user4',
          username: 'casey_rivera',
          displayName: 'Casey Rivera',
          level: UserLevel.EXPERT,
          xp: 9800,
          badges: 18,
          streak: 15,
          isCurrentUser: currentUserId === 'user4'
        },
        {
          rank: 5,
          userId: 'user5',
          username: 'jordan_green',
          displayName: 'Jordan Green',
          level: UserLevel.EXPERT,
          xp: 8900,
          badges: 16,
          streak: 12,
          isCurrentUser: currentUserId === 'user5'
        },
        {
          rank: 6,
          userId: 'user6',
          username: 'riley_park',
          displayName: 'Riley Park',
          level: UserLevel.EXPLORER,
          xp: 8100,
          badges: 14,
          streak: 10,
          isCurrentUser: currentUserId === 'user6'
        },
        {
          rank: 7,
          userId: 'user7',
          username: 'alex_chen',
          displayName: 'Alex Chen',
          level: UserLevel.EXPLORER,
          xp: 4800,
          badges: 8,
          streak: 7,
          isCurrentUser: currentUserId === 'user7'
        },
        {
          rank: 8,
          userId: 'user8',
          username: 'sam_davis',
          displayName: 'Sam Davis',
          level: UserLevel.ROOKIE,
          xp: 4200,
          badges: 7,
          streak: 5,
          isCurrentUser: currentUserId === 'user8'
        }
      ];

      setLeaderboardData(mockData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-amber-400 to-orange-500';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-300 to-orange-500';
    return 'from-purple-600 to-indigo-600';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  const getLevelColor = (level: UserLevel) => {
    switch (level) {
      case UserLevel.ROOKIE: return 'from-green-500 to-emerald-600';
      case UserLevel.EXPLORER: return 'from-blue-500 to-cyan-600';
      case UserLevel.EXPERT: return 'from-purple-500 to-violet-600';
      case UserLevel.MASTER: return 'from-amber-500 to-orange-600';
      case UserLevel.LEGEND: return 'from-pink-500 via-purple-600 to-indigo-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="glass-premium rounded-xl p-6">
        <div className="text-center text-white">Caricamento classifica...</div>
      </div>
    );
  }

  return (
    <div className="glass-premium rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Classifica Globale</h2>
          <p className="text-sm text-white/60 mt-1">Top performer del team</p>
        </div>
        <div className="text-4xl">🏆</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/15">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/60 uppercase">Rank</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white/60 uppercase">Player</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/60 uppercase">Livello</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/60 uppercase">XP Totale</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/60 uppercase">Badge</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-white/60 uppercase">Streak</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry, index) => (
              <tr
                key={entry.userId}
                className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                  entry.rank <= 3 ? 'bg-white/8' : ''
                } ${entry.isCurrentUser ? 'ring-2 ring-indigo-500' : ''}`}
              >
                {/* Rank */}
                <td className="px-4 py-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${getRankColor(entry.rank)} ring-2 ring-white/30 shadow-lg`}
                  >
                    {getRankEmoji(entry.rank)}
                  </div>
                </td>

                {/* Player */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-lg ring-2 ring-white/30">
                      👤
                    </div>
                    <div>
                      <p className="font-semibold text-white">{entry.displayName}</p>
                      <p className="text-xs text-white/50">@{entry.username}</p>
                    </div>
                    {entry.isCurrentUser && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">Tu</span>
                    )}
                  </div>
                </td>

                {/* Level */}
                <td className="px-4 py-4 text-center">
                  <div className={`inline-block px-3 py-1 bg-gradient-to-r ${getLevelColor(entry.level)} rounded-full text-sm font-semibold text-white ring-2 ring-white/30 shadow-lg`}>
                    {entry.level}
                  </div>
                </td>

                {/* Total XP */}
                <td className="px-4 py-4 text-center">
                  <p className="font-bold text-amber-400 text-lg">{entry.xp.toLocaleString()}</p>
                  <p className="text-xs text-white/50">XP</p>
                </td>

                {/* Badges */}
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg">🏆</span>
                    <p className="font-semibold text-white">{entry.badges}</p>
                  </div>
                </td>

                {/* Streak */}
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg">🔥</span>
                    <p className="font-semibold text-orange-400">{entry.streak}</p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Current User Summary */}
      {currentUserId && leaderboardData.find(e => e.isCurrentUser) && (
        <div className="mt-6 p-4 glass-card rounded-lg border-l-4 border-indigo-500">
          <p className="text-sm text-white/80">
            <span className="font-bold text-white">La tua posizione:</span> #{leaderboardData.find(e => e.isCurrentUser)?.rank}
          </p>
          <p className="text-xs text-white/60 mt-1">
            Continua così! Completa più quest per scalare la classifica.
          </p>
        </div>
      )}
    </div>
  );
}
