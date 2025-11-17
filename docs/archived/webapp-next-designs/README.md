# 🎨 ZANTARA Webapp Design Drafts

Workspace per sviluppare il nuovo design ZANTARA senza toccare l'app in produzione.

## 📂 Struttura

```
webapp-next/
├── login-draft/          # Login page experiments
│   ├── login-v1.html    # Minimal design
│   ├── login-v2.html    # Animated version
│   └── login-v3.html    # Hybrid (best of both)
├── chat-draft/           # Chat page experiments
│   ├── chat-v1.html     # Minimal layout
│   ├── chat-v2.html     # With SSE streaming
│   └── chat-v3.html     # Full featured
├── shared/               # Shared resources
│   ├── components/      # Componenti da /code
│   ├── styles/          # Tailwind + custom CSS
│   └── js/              # Symlink to ../webapp/js/
└── README.md            # This file
```

## 🔗 Dependencies

### Symlinked from `apps/webapp/js/` (NON duplicati):
- `api-contracts.js` - API contracts
- `zantara-api.js` - Core API client
- `sse-client.js` - Server-Sent Events
- `message-formatter.js` - Message formatting
- `conversation-history.js` - History management
- `jwt-login.js` - JWT authentication
- `i18n.js` - Internationalization

## 🚀 Development

### Test locally:
```bash
cd apps/webapp-next
python3 -m http.server 8001
# Open http://localhost:8001/login-draft/login-v1.html
```

## ✅ Testing Checklist

### Login Page:
- [ ] JWT authentication works
- [ ] API endpoint connection
- [ ] Visual design matches mockup
- [ ] Animations smooth
- [ ] Mobile responsive

### Chat Page:
- [ ] SSE streaming works
- [ ] Messages display correctly
- [ ] History persistence
- [ ] API calls functional
- [ ] Mobile responsive

## 🎯 Status

- [x] Workspace created
- [ ] Login v1 draft
- [ ] Chat v1 draft

---

**Created:** 2025-11-04  
**Purpose:** Safe design experimentation workspace
