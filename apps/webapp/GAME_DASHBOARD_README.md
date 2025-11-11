# 🎮 NUZANTARA QUEST - Interactive Team Onboarding Dashboard

## Overview

NUZANTARA QUEST is a gamified interactive dashboard designed to onboard team members to the Nuzantara system in an engaging, game-like experience. Team members complete quests, earn XP, unlock badges, and progress through levels while learning the system.

## 🎯 Key Features

### 1. **Gamification System**
- **5 Levels**: Rookie → Explorer → Expert → Master → Legend
- **XP & Progression**: Earn XP by completing quests
- **Streak System**: Daily activity bonuses (up to 2x XP at 30-day streak)
- **Badges & Achievements**: Unlock 10+ unique badges
- **Leaderboard**: Compete with team members

### 2. **Quest System**
- **Multiple Difficulty Levels**: Easy, Medium, Hard, Legendary
- **Quest Types**:
  - Daily Quests: Refresh every day
  - Single Quests: One-time completable
  - Team Quests: Collaborative missions
  - Event Quests: Time-limited challenges

- **Quest Categories**:
  - 🔍 Monitoring: Agent health checks, system status
  - 📊 Analysis: Data analysis, trend identification
  - ⚙️ Configuration: Setup alerts, customize dashboards
  - 🚀 Optimization: Performance improvements
  - 📚 Learning: System exploration, documentation
  - 🤝 Collaboration: Team-based activities

### 3. **ZANTARA Chat - Natural Language Interface**
- AI-powered chat companion
- Natural language queries in Italian/English/Indonesian
- Integrated with RAG system for intelligent responses
- Quick actions for common tasks
- Intent recognition and context-aware responses

### 4. **Real-time System Monitoring**
- Live agent health status
- System performance metrics
- Automatic alerts and events
- Integration with existing Nuzantara monitoring

### 5. **Team Collaboration**
- Real-time leaderboard
- Team quests and challenges
- Social achievements
- Progress tracking

## 📁 File Structure

```
apps/webapp/
├── quest-dashboard.html           # Main entry point
├── src/
│   ├── game-main.tsx             # React app initialization
│   ├── types/
│   │   └── gamification.ts       # TypeScript types and interfaces
│   ├── services/
│   │   ├── gamificationEngine.ts # Core gamification logic
│   │   ├── questManager.ts       # Quest generation and management
│   │   ├── gamificationApi.ts    # API client for backend
│   │   └── zantaraChat.ts        # ZANTARA chat service
│   └── components/
│       ├── GameDashboard.tsx     # Main dashboard component
│       ├── ProfileCard.tsx       # User profile widget
│       ├── QuestBoard.tsx        # Quest management
│       ├── QuestCard.tsx         # Individual quest display
│       ├── ZantaraChatWidget.tsx # Chat interface
│       ├── Leaderboard.tsx       # Team rankings
│       ├── SystemHealthWidget.tsx # System monitoring
│       └── NotificationCenter.tsx # Notifications
└── css/
    └── game-dashboard.css        # Base styles (to be enhanced)
```

## 🚀 Getting Started

### For Users

1. **Access**: Navigate to `/quest-dashboard.html`
2. **Login**: Use your Nuzantara credentials
3. **Start Tutorial**: ZANTARA will guide you through the basics
4. **Accept Your First Quest**: Choose from available quests
5. **Complete Tasks**: Follow quest steps to earn XP
6. **Level Up**: Progress through ranks and unlock features

### For Developers

1. **Install Dependencies**:
   ```bash
   cd apps/webapp
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🎮 How It Works (The Game Mechanics)

### Levels & XP

| Level | XP Range | Description |
|-------|----------|-------------|
| 🔰 Rookie | 0-500 | Starting level, basic quests |
| 🗺️ Explorer | 500-1,500 | Intermediate challenges |
| 💎 Expert | 1,500-3,500 | Advanced system tasks |
| 👑 Master | 3,500-7,500 | Complex optimizations |
| ⭐ Legend | 7,500+ | Elite level, all features |

### Quest Rewards

| Difficulty | Base XP | Description |
|------------|---------|-------------|
| 🟢 Easy | 20-50 | Quick tasks (5-10 min) |
| 🟡 Medium | 50-100 | Standard challenges (15-30 min) |
| 🔴 Hard | 100-200 | Complex tasks (1+ hour) |
| 🟣 Legendary | 250+ | Major achievements |

### Streak Bonuses

- **3 days**: +10% XP
- **7 days**: +25% XP
- **14 days**: +50% XP
- **30 days**: +100% XP (2x multiplier!)

### Badge Examples

- 🔰 **First Steps**: Complete your first quest
- 🔍 **Data Detective**: Complete 50 quests
- 💬 **Chat Master**: 100 ZANTARA conversations
- 🚀 **Speed Runner**: 5 quests in one day
- 🤝 **Team Player**: Complete 3 team quests
- ⭐ **Perfect Week**: 7-day streak

## 💬 ZANTARA Chat Commands

Natural language examples:

```
"Mostrami le quest disponibili"
→ Lists available quests for your level

"Stato dell'Immigration Agent"
→ Shows Immigration Agent health and metrics

"Quali task posso fare per salire di livello?"
→ Suggests quests to reach next level

"Come sta il team?"
→ Team leaderboard and activity

"Trend revenue ultimi 30 giorni"
→ Revenue analytics and patterns
```

## 🔧 Backend Integration

### Required API Endpoints

The frontend expects these endpoints (to be implemented):

```
# Gamification
GET  /api/gamification/profile/:userId
PUT  /api/gamification/profile/:userId
POST /api/gamification/profile/:userId/streak

GET  /api/gamification/quests/active/:userId
GET  /api/gamification/quests/available/:userId
POST /api/gamification/quests/accept
PUT  /api/gamification/quests/:questId/progress
POST /api/gamification/quests/:questId/complete

GET  /api/gamification/daily-challenge/:userId
POST /api/gamification/daily-challenge/:userId/complete

GET  /api/gamification/leaderboard
GET  /api/gamification/notifications/:userId

# Real-time
GET  /api/gamification/stream/:userId (SSE)

# Existing (already available)
GET  /api/admin/dashboard/agents/health
POST /api/rag/query
```

### Database Schema

New tables needed:

```sql
-- User gamification profiles
CREATE TABLE gamification_profiles (
  user_id VARCHAR PRIMARY KEY,
  level VARCHAR,
  xp INTEGER,
  total_xp INTEGER,
  streak INTEGER,
  longest_streak INTEGER,
  completed_quests INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User badges
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  badge_type VARCHAR,
  unlocked_at TIMESTAMP
);

-- Active quests
CREATE TABLE active_quests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  quest_id VARCHAR,
  progress INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

## 🎨 Design & Styling

**Note**: Basic CSS structure is provided. The design will be enhanced via Figma and deployed through Vercel.

Key CSS classes:
- `.game-dashboard` - Main container
- `.quest-card` - Individual quest
- `.profile-card` - User profile widget
- `.zantara-chat-widget` - Chat interface
- `.leaderboard-widget` - Rankings

## 📊 Analytics & Tracking

Track these metrics:
- Daily active users
- Quest completion rate
- Average time to complete quests
- Most popular quest categories
- Team collaboration frequency
- ZANTARA chat usage

## 🔒 Security Considerations

- JWT authentication required
- Rate limiting on API endpoints
- Input validation for all user inputs
- XSS prevention in chat messages
- CSRF protection

## 🚧 Future Enhancements

- [ ] Mobile app version
- [ ] Voice commands for ZANTARA
- [ ] Custom quest builder
- [ ] Team vs Team competitions
- [ ] Achievement sharing on social media
- [ ] Integration with Slack/Teams
- [ ] Video tutorials in quests
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Follow existing code structure
2. Add new quests to `questManager.ts`
3. Create new badges in `gamificationEngine.ts`
4. Test with multiple user levels
5. Update this README

## 📝 License

Part of the Nuzantara project.

---

**Made with ❤️ for the Nuzantara Team**
