# 🎨 ZANTARA Design v4 - Local Development

**Status**: 🚧 In Development
**Environment**: LOCAL ONLY
**Production**: zantara.balizero.com (unchanged)
**Test Deploy**: TBD (zantara-v4.balizero.com quando pronta)

---

## 🎯 Obiettivo

Implementare nuovo design ZANTARA basato su `/Desktop/webza` mantenendo:
- ✅ Produzione corrente INTATTA
- ✅ Sviluppo e test in LOCALE
- ✅ Deploy parallelo quando pronta (no sostituzione)

---

## 📂 Struttura Workspace

```
design-v4/
├── README.md              # This file
├── index.html            # Base template (landing/redirect)
├── login.html            # Login page (JWT auth)
├── chat.html             # Chat page (main app)
├── css/
│   ├── design-system.css # Core design system (da webza/globals.css)
│   ├── components.css    # Component styles
│   ├── animations.css    # Animations & transitions
│   └── responsive.css    # Media queries
├── js/
│   ├── app.js           # Main application logic
│   ├── auth.js          # JWT authentication
│   ├── api-client.js    # Backend integration
│   ├── chat-ui.js       # Chat UI management
│   ├── sse-client.js    # Server-Sent Events streaming
│   └── utils.js         # Utility functions
├── assets/
│   ├── fonts/          # Cormorant Garamond, SF Pro Display
│   ├── images/         # Logo, icons
│   └── video/          # Background video (if used)
└── dev-server.sh       # Local development server
```

---

## 🚀 Local Development

### Start Dev Server

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/webapp-next/design-v4

# Option 1: Python HTTP server
python3 -m http.server 8002

# Option 2: Node http-server (if installed)
npx http-server -p 8002

# Option 3: Using script
./dev-server.sh
```

### Access Locally

- **Login**: http://localhost:8002/login.html
- **Chat**: http://localhost:8002/chat.html
- **Index**: http://localhost:8002/

### Backend Connection

**Local backend** (if running):
```
http://localhost:8080
```

**Production backend** (default):
```
https://nuzantara-backend.fly.dev
```

Configurabile in `js/api-client.js`:
```javascript
const API_BASE_URL = 'https://nuzantara-backend.fly.dev'
// const API_BASE_URL = 'http://localhost:8080' // Local dev
```

---

## 🧪 Testing Workflow

### Phase 1: Local Development
```
Design → Code → Test (localhost:8002)
```

### Phase 2: Local Testing
- Browser testing (Chrome, Firefox, Safari)
- Mobile emulation
- API integration tests
- Authentication flow
- SSE streaming

### Phase 3: Parallel Deploy (when ready)
```
Deploy to: zantara-v4.balizero.com (NEW subdomain)
Keep: zantara.balizero.com (CURRENT production)
```

### Phase 4: Gradual Migration
- Beta users → v4
- Feedback & fixes
- Full migration when stable

---

## 🔗 API Endpoints Used

### Authentication
- `POST /api/auth/team/login` - JWT login
- `GET /api/auth/team/members` - Team list
- `POST /api/auth/team/logout` - Logout

### Chat
- `POST /api/v3/zantara/unified` - Unified query
- `GET /api/v3/zantara/stream` - SSE streaming (TODO)

### Health
- `GET /health` - Backend health check

---

## 📋 Development Checklist

### Phase 1: Design System ✅
- [x] Workspace created
- [ ] CSS extraction from webza/globals.css
- [ ] Design system variables setup
- [ ] Font configuration
- [ ] Color palette test

### Phase 2: Static Components
- [ ] Base HTML template
- [ ] Login page HTML
- [ ] Chat page HTML
- [ ] Header component
- [ ] Message bubble template
- [ ] Input component
- [ ] Quick actions

### Phase 3: Interactivity
- [ ] State management (vanilla JS)
- [ ] Message rendering
- [ ] Input handling
- [ ] Auto-scroll
- [ ] Typing indicator
- [ ] Loading states

### Phase 4: Backend Integration
- [ ] API client module
- [ ] JWT token management
- [ ] Unified endpoint integration
- [ ] Error handling
- [ ] Response parsing

### Phase 5: Authentication
- [ ] Login page logic
- [ ] JWT validation
- [ ] Session persistence
- [ ] Protected routes
- [ ] Logout flow

### Phase 6: Advanced Features
- [ ] SSE streaming
- [ ] Message persistence (localStorage)
- [ ] Conversation history
- [ ] Markdown rendering
- [ ] Code syntax highlighting

### Phase 7: Polish
- [ ] Animations tuning
- [ ] Mobile optimization
- [ ] Accessibility
- [ ] Performance audit
- [ ] Browser testing

---

## 🌐 Deployment Strategy (Future)

### Parallel Deployment

**Current Production** (KEEP):
```
Domain: zantara.balizero.com
Source: apps/webapp (current)
Status: PRODUCTION (unchanged)
```

**New Version** (TEST):
```
Domain: zantara-v4.balizero.com (or beta.zantara.balizero.com)
Source: apps/webapp-next/design-v4
Status: BETA TESTING
```

### Cloudflare Pages Setup

```bash
# When ready for parallel deploy
cd apps/webapp-next/design-v4

# Deploy to Cloudflare Pages (separate project)
# Project name: zantara-v4
# Domain: zantara-v4.balizero.com
```

### Migration Plan

1. **Week 1-3**: Local development
2. **Week 4**: Deploy v4 to `zantara-v4.balizero.com`
3. **Week 5-6**: Beta testing with select users
4. **Week 7**: Gradual migration (traffic splitting)
5. **Week 8**: Full migration (if no issues)

---

## 🔧 Configuration

### Environment Variables

Create `.env.local` (git-ignored):
```env
# Backend URLs
VITE_API_BASE_URL=https://nuzantara-backend.fly.dev
VITE_RAG_URL=https://nuzantara-rag.fly.dev

# Features
VITE_ENABLE_SSE=true
VITE_ENABLE_PERSISTENCE=true
VITE_ENABLE_ANALYTICS=false

# Debug
VITE_DEBUG_MODE=true
```

---

## 📊 Performance Targets

- First Paint: <1s
- Time to Interactive: <2s
- API Response: <500ms (cached)
- SSE First Chunk: <200ms
- Lighthouse Score: >90

---

## 🐛 Known Issues

(Will be populated during development)

---

## 📝 Notes

- **No framework**: Pure HTML/CSS/JS (no build step)
- **No npm**: Direct file serving
- **Backend**: Existing ZANTARA backend (no changes needed)
- **Design source**: `/Users/antonellosiano/Desktop/webza`

---

**Created**: 5 Nov 2025
**Last Updated**: 5 Nov 2025
**Status**: Initial setup
