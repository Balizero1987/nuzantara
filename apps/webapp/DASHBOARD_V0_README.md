# 🎮 NUZANTARA QUEST Dashboard v0

Dashboard gamificato moderno generato con **v0.dev** e integrato con i services backend esistenti.

## 📁 Struttura File

```
apps/webapp/
├── quest-dashboard-v0.html          # Entry point HTML
├── src/
│   ├── game-main-v0.tsx             # React entry point
│   ├── components/
│   │   ├── DashboardV0.tsx          # Dashboard principale (orchestrator)
│   │   ├── ProfileCardV0.tsx        # Card profilo utente
│   │   ├── QuestBoardV0.tsx         # Board delle quest
│   │   ├── ZantaraChatWidgetV0.tsx  # Chat con ZANTARA
│   │   └── LeaderboardV0.tsx        # Classifica team
│   ├── services/                    # Services esistenti (già creati)
│   │   ├── gamificationEngine.ts
│   │   ├── questManager.ts
│   │   └── teachingEngine.ts
│   └── types/
│       └── gamification.ts          # Types condivisi
└── css/
    └── dashboard-v0.css             # Glassmorphism CSS

```

## 🎨 Design System

### Colori Principali
- **Background**: `#2B2B2B` (grafite scuro)
- **Accent Orange**: `#F97316` (arancione primario)
- **Accent Indigo**: `#6366F1` (indaco)
- **Accent Purple**: `#8B5CF6` (viola)
- **Success Green**: `#10B981` (verde)
- **Warning Yellow**: `#F59E0B` (giallo)

### Effetti
- **Glassmorphism**: `backdrop-blur`, bg semi-trasparenti
- **3D Depth**: Shadow stratificate per profondità
- **Glow Effects**: Box-shadow colorati per XP/badge
- **Smooth Animations**: Transizioni fluide 150-300ms

## 🚀 Come Avviare

### Opzione 1: Development Server

```bash
cd apps/webapp
npm install
npm run dev
```

Apri: `http://localhost:5173/quest-dashboard-v0.html`

### Opzione 2: Build Production

```bash
npm run build
npm run preview
```

## 🧩 Componenti

### 1. DashboardV0
**Orchestrator principale** che gestisce:
- Stato globale (user profile, quests)
- Navigation (dashboard ↔ leaderboard)
- Integrazione con services backend
- Loading states

**Props**:
```typescript
{
  userId: string;
  initialProfile?: UserProfile;
}
```

### 2. ProfileCardV0
Mostra profilo utente con:
- Avatar
- Nome e username
- Level badge (Rookie → Legend)
- XP progress bar animata
- Stats grid (2x2)
- Top 4 badge recenti
- Button "Classifica Team"

**Props**:
```typescript
{
  userProfile: UserProfile;
  onViewLeaderboard?: () => void;
}
```

**Integrazione**:
- Usa `GamificationEngine.calculateLevel()` per livelli
- Usa `GamificationEngine.calculateXpToNextLevel()` per progressi

### 3. QuestBoardV0
Board delle quest con:
- 3 tabs: Attive / Completate / Team
- Quest cards con:
  - Bordo colorato per difficoltà
  - Progress bar
  - XP reward
  - Intelligence layer indicator (🧠)
  - Category badge
  - Due date (se presente)

**Props**:
```typescript
{
  activeQuests: Quest[];
  completedQuests?: Quest[];
  teamQuests?: Quest[];
  onQuestClick?: (quest: Quest) => void;
}
```

**Integrazione**:
- Usa `QuestManager.getAllQuests()` per caricare quest
- Filtra per `completed: boolean`

### 4. ZantaraChatWidgetV0
Chat AI interattiva:
- Header arancione con branding
- Message bubbles (user verde, AI frosted glass)
- Quick action buttons
- Input field con auto-scroll
- Loading indicator (3 dots animati)

**Props**:
```typescript
{
  userLevel: UserLevel;
  onSendMessage?: (message: string) => Promise<string>;
}
```

**Integrazione**:
- Usa `TeachingEngine.getTeachingContent()` per risposte educative
- Detecta keywords: "insegnami", "spiega", "come funziona"
- Adaptive content basato su `userLevel`

### 5. LeaderboardV0
Classifica team con:
- Top 8 players
- Rank badge (🥇🥈🥉 per top 3)
- Level badge colorato
- XP totale
- Badge count
- Streak 🔥
- Highlight utente corrente (ring indigo)

**Props**:
```typescript
{
  currentUserId?: string;
}
```

## 🔌 Integrazione con Backend

### API Mock (Attuale)
Dashboard usa dati mock per testing. Per produzione, sostituire con API calls.

### API Reale (TODO)

```typescript
// In DashboardV0.tsx, loadDashboardData():

// 1. Load user profile
const response = await fetch(`/api/gamification/profile/${userId}`);
const profile = await response.json();
setUserProfile(profile);

// 2. Load quests
const questsResponse = await fetch(`/api/gamification/quests?userId=${userId}`);
const quests = await questsResponse.json();
setActiveQuests(quests.filter(q => !q.completed));
setCompletedQuests(quests.filter(q => q.completed));

// 3. Chat messages
const chatResponse = await fetch(`/api/zantara/chat`, {
  method: 'POST',
  body: JSON.stringify({ message, userId, userLevel })
});
const aiResponse = await chatResponse.json();
return aiResponse.message;
```

## 📊 Dati Mock

### User Profile Mock
```typescript
{
  userId: 'user123',
  displayName: 'Team Member',
  level: UserLevel.EXPLORER,
  xp: 2400,
  xpToNextLevel: 2600,
  totalXp: 2400,
  streak: 7,
  badges: [],
  stats: {
    questsCompleted: 12,
    successRate: 85
  }
}
```

### Quest Mock
Vedi: `src/services/questManager.ts` - 30+ quest predefinite

### Leaderboard Mock
8 utenti sample con rank, XP, badges, streak

## 🎯 Features Implementate

- ✅ Glassmorphism design (backdrop-blur, frosted glass)
- ✅ Responsive layout (3 columns → stack su mobile)
- ✅ XP progress bar con glow animation
- ✅ Badge metallic effect con shimmer hover
- ✅ Quest difficulty color-coding
- ✅ Intelligence layer indicators
- ✅ Chat con loading states
- ✅ Leaderboard con rank highlighting
- ✅ Smooth transitions e animations
- ✅ Custom scrollbar styling
- ✅ Error boundaries
- ✅ Loading screens

## 🚧 TODO Backend

### API Endpoints Necessari
```
POST   /api/gamification/profile/:userId       # Get user profile
GET    /api/gamification/quests?userId=X       # Get user quests
POST   /api/gamification/quest/complete        # Complete quest
GET    /api/gamification/leaderboard           # Get leaderboard
POST   /api/zantara/chat                       # Chat with AI
GET    /api/teaching/content/:conceptId        # Get teaching content
```

### Database Schema
Vedi: `GAME_DASHBOARD_README.md` sezione Database Schema

## 🎨 Customizzazione CSS

### Cambio Colori
Modifica `css/dashboard-v0.css`:

```css
/* Cambio accent color da arancione a blu */
.xp-glowing {
  box-shadow:
    0 0 10px rgba(59, 130, 246, 0.5),  /* blue */
    0 0 20px rgba(59, 130, 246, 0.3);
}
```

### Cambio Glassmorphism Intensity
```css
.glass-premium {
  background: rgba(255, 255, 255, 0.08);  /* più opaco */
  backdrop-filter: blur(30px);            /* più blur */
}
```

## 🐛 Troubleshooting

### Dashboard non si carica
1. Verifica console browser per errori
2. Check che Tailwind CDN sia raggiungibile
3. Verifica che `/src/game-main-v0.tsx` esista

### Componenti non hanno stile
1. Verifica che `dashboard-v0.css` sia caricato
2. Check che Tailwind config sia nel HTML
3. Ispeziona elementi per vedere classi applicate

### XP bar non animata
1. Check che classe `xp-glowing` sia applicata
2. Verifica CSS animations nel browser DevTools
3. Test su browser diverso (alcune animazioni falliscono su Safari)

## 📝 Note Sviluppo

### Differenze tra v0 e Versione Originale

| Feature | Originale | v0 |
|---------|-----------|-----|
| UI Framework | HTML+CSS custom | React + Tailwind |
| Design | Basic | Glassmorphism premium |
| Components | Monolithic | Modulari |
| State Management | DOM manipulation | React state |
| Animations | CSS-only | CSS + React transitions |
| Data Loading | Inline | Service integration |

### Best Practices
- Sempre usare `ErrorBoundary` per componenti principali
- Implementare loading states per tutte API calls
- Usare `memo()` per componenti con dati statici (leaderboard)
- Debounce input chat per evitare spam API
- Cache leaderboard per 60s

## 🔗 Link Utili

- [v0.dev](https://v0.dev) - Tool per generare UI
- [Tailwind CSS](https://tailwindcss.com)  - CSS framework
- [Glassmorphism Generator](https://glassmorphism.com) - Design tool
- [GAME_DASHBOARD_README.md](./GAME_DASHBOARD_README.md) - Docs originali

## 📄 Licenza

Parte del progetto NUZANTARA. Uso interno.

---

**Creato con ❤️ usando v0.dev + Claude Code**
