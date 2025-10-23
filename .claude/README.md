# 📁 .claude/ - DevAI Onboarding & Session Management

> **2-minute instant orientation for new AI developers on NUZANTARA**

---

## 🚀 For New DevAI Instances

**First time here?** Follow this sequence:

1. **Read [`START_HERE.md`](START_HERE.md)** (60 seconds)
   - Sant'Antonio prayer for alignment
   - 7-step workflow overview
   - Quick commands reference

2. **Scan [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md)** (30 seconds)
   - One-page system cheat sheet
   - Key stats, URLs, commands
   - Instant orientation

3. **Review [`PROJECT_MAP.md`](PROJECT_MAP.md)** (30 seconds)
   - Visual architecture diagrams
   - Complete codebase tree
   - All 122 handlers mapped

**Total time: 2 minutes** → You're ready to code!

---

## 📁 File Structure

```
.claude/
├── START_HERE.md               ⭐ Entry point (60s)
├── QUICK_REFERENCE.md          ⭐ System cheat sheet (30s)
├── PROJECT_MAP.md              ⭐ Visual architecture (30s)
├── HANDOVER_GUIDE.md           ⭐ Session management procedures
├── CURRENT_SESSION.template.md ⭐ Session tracking template
├── CURRENT_SESSION_WX.md       🚧 Active session files (W1-W4)
├── README.md                   📖 This file
└── legacy/                     📦 Archived old reports (read-only)
```

---

## 🎯 Multi-Window System

**User runs 4 concurrent AI instances:**
```
Window 1 → DevAI #1 (task A) → CURRENT_SESSION_W1.md
Window 2 → DevAI #2 (task B) → CURRENT_SESSION_W2.md
Window 3 → DevAI #3 (task C) → CURRENT_SESSION_W3.md
Window 4 → DevAI #4 (task D) → CURRENT_SESSION_W4.md
```

**Rules:**
- User assigns window: "Sei W2"
- Each AI works on separate session file
- No file conflicts (W1-W4 isolated)
- Follow HANDOVER_GUIDE.md for session management

---

## ⚡ Quick Workflow

### 🟢 Session Start
```bash
# User assigns window
User: "Sei W2, implementa feature X"

# Load context (2 minutes)
1. START_HERE.md         # Workflow overview
2. QUICK_REFERENCE.md    # System stats
3. PROJECT_MAP.md        # Architecture

# Initialize session
cp CURRENT_SESSION.template.md CURRENT_SESSION_W2.md
# Fill in: Window, Date, Model, Task
```

### 🟡 During Work
```bash
# Update YOUR session file only
CURRENT_SESSION_WX.md:
- Tasks completed ✅
- Files modified 📝
- Problems solved 🔧
- Decisions made 💡

# Use TodoWrite tool for task tracking
# Commit and push as you go
```

### 🔴 Session End
```bash
# Follow HANDOVER_GUIDE.md checklist
1. Complete session file
2. Document decisions & issues
3. Add tips for next AI
4. Quality check
5. Commit & push
6. Reset session file
```

---

## 📚 Documentation Reference

### Core Onboarding (Read First)
- [`START_HERE.md`](START_HERE.md) - 7-step workflow
- [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) - System cheat sheet
- [`PROJECT_MAP.md`](PROJECT_MAP.md) - Architecture diagrams
- [`HANDOVER_GUIDE.md`](HANDOVER_GUIDE.md) - Session procedures

### Architecture (Deep Dive)
- [`docs/galaxy-map/`](../docs/galaxy-map/) - Complete system architecture
  - 01-system-overview.md
  - 02-technical-architecture.md
  - 03-ai-intelligence.md
  - 04-data-flows.md
  - 05-database-schema.md

### Code Examples
- [`docs/examples/`](../docs/examples/)
  - HANDLER_INTEGRATION.md - Create TypeScript handlers
  - RAG_SEARCH_EXAMPLE.md - RAG backend integration
  - TOOL_CREATION.md - Add new AI tools
  - API_CLIENT_EXAMPLES.md - External API clients

### Operations
- [`docs/operations/`](../docs/operations/)
  - INCIDENT_RESPONSE.md - P0-P3 incident playbooks
  - MONITORING_GUIDE.md - Metrics & alerts

### Security
- [`docs/security/`](../docs/security/)
  - SECURITY_GUIDE.md - Auth, encryption, audit logging

### Deployment
- [`docs/guides/`](../docs/guides/)
  - RAILWAY_DEPLOYMENT_GUIDE.md - Railway setup & deploy

---

## 🔧 Essential Commands

### Git
```bash
git status                    # Check status
git add .                     # Stage changes
git commit -m "message"       # Commit
git push -u origin claude/branch-name  # Push

# Branch format: claude/{description}-{session-id}
```

### Railway
```bash
railway status                # Service status
railway logs --service TS-BACKEND --tail 100
railway logs --service "RAG BACKEND" --tail 100
```

### Local Development
```bash
# TS Backend
cd apps/backend-ts
npm install
npm run dev                   # Port 8080

# RAG Backend
cd apps/backend-rag/backend
pip install -r requirements.txt
python main.py                # Port 8000
```

### Testing
```bash
# TS Backend
cd apps/backend-ts
npm test

# Health checks
curl http://localhost:8080/health
curl http://localhost:8000/health
```

---

## 🎯 Key System Stats

**Current Status:**
- 122 handlers across 19 categories
- 34 PostgreSQL tables (~100MB)
- 14 ChromaDB collections (14,365 documents)
- 164 AI-callable tools
- 3 AI models: Claude Haiku 4.5, ZANTARA Llama, DevAI Qwen

**Performance:**
- Golden Answer: 10-20ms (50-60% hit rate)
- Haiku + RAG: 1-2s average
- API Cost: $8-15/month (production)

**Production URLs:**
- TS Backend: https://ts-backend-production-568d.up.railway.app
- RAG Backend: https://scintillating-kindness-production-47e3.up.railway.app
- Frontend: https://zantara.balizero.com

---

## ✅ Rules

### DO
- ✅ Ask user which window if not told: "Quale window? (W1/W2/W3/W4)"
- ✅ Use YOUR assigned CURRENT_SESSION_WX.md only
- ✅ Follow TodoWrite task tracking
- ✅ Commit and push frequently
- ✅ Follow HANDOVER_GUIDE.md at session end
- ✅ Read QUICK_REFERENCE + PROJECT_MAP first (2 min total)

### DON'T
- ❌ Create new .md files in .claude/ (use templates only)
- ❌ Modify legacy/ directory (read-only archive)
- ❌ Touch other windows' session files
- ❌ Skip handover procedures
- ❌ Commit secrets or .env files

---

## 🆘 FAQ

**Q: How do I know which window I am?**
A: User tells you at start. If unclear, ask: "Quale window? (W1/W2/W3/W4)"

**Q: Where do I track my session?**
A: Your assigned `CURRENT_SESSION_WX.md` file

**Q: How long to get oriented?**
A: 2 minutes (START_HERE 60s + QUICK_REFERENCE 30s + PROJECT_MAP 30s)

**Q: What if I need to handover to next AI?**
A: Follow complete checklist in `HANDOVER_GUIDE.md`

**Q: Where are deployment procedures?**
A: `docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md`

**Q: Where are incident playbooks?**
A: `docs/operations/INCIDENT_RESPONSE.md`

**Q: How do I create a new handler?**
A: Follow `docs/examples/HANDLER_INTEGRATION.md`

**Q: Where's the database schema?**
A: `docs/galaxy-map/05-database-schema.md` + `PROJECT_MAP.md`

---

## 📦 Legacy Files

The `legacy/` directory contains archived session reports and old documentation files that are now superseded by the new onboarding system. These files are read-only and kept for historical reference only.

See `legacy/README.md` for details on archived files.

---

## 🌐 KB Content Rules

> **For NUZANTARA KB updates only**

**Rule**: Indonesian for LAW, English for PRACTICE
- Indonesian: Legal regulations, procedures
- English: Guides, examples, FAQ

See: `nuzantara-kb/kb-agents/KB_CONTENT_RULES.md`

---

**System Version**: 3.0.0 (New onboarding system)
**Created**: 2025-10-01
**Updated**: 2025-10-23 (Complete documentation overhaul)
**Maintained by**: All DevAI instances
