# 📁 .claude/ System Documentation

> **Sistema di gestione sessioni multi-CLI per ZANTARA**

---

## 📋 Struttura

```
.claude/
├── PROJECT_CONTEXT.md          # Chi siamo, architettura, coordinate
├── README.md                   # Questa guida
├── handovers/                  # Micro-categorie (create on-demand)
│   ├── backend-routes.md
│   ├── deploy-backend.md
│   ├── rag-chromadb.md
│   └── ... (created when needed)
└── diaries/                    # Session logs (1 per CLI per giorno)
    ├── 2025-10-01_sonnet-4.5_m1.md
    ├── 2025-10-01_opus-4.1_m2.md
    └── 2025-10-02_sonnet-4.5_m1.md
```

---

## 🚀 Entry Protocol (Nuova CLI)

Quando una nuova CLI parte:

### **Step 1: Auto-detect**
```
Model: claude-sonnet-4-5-20250929 (from API)
Date: 2025-10-01 (from system)
Matricola: 3 (count existing diaries today + 1)
```

### **Step 2: Read Context**
```
1. PROJECT_CONTEXT.md → Overview progetto
2. All diaries from today (2025-10-01_*.md)
3. All diaries from yesterday (2025-09-30_*.md)
```

### **Step 3: Ask User**
```
🎯 Su cosa lavori?
> [user input: "fix websocket bug"]
```

### **Step 4: Auto-detect Categories**
```
Keywords: "fix" + "websocket"
→ Categories: backend-routes, backend-handlers, debug

Read relevant handovers:
  - handovers/backend-routes.md
  - handovers/backend-handlers.md
  - handovers/debug.md (create if doesn't exist)
```

### **Step 5: Start Work**
```
Create: diaries/2025-10-01_sonnet-4.5_m3.md
Log all actions in real-time
```

---

## ✅ Exit Protocol (Fine Sessione)

### **Step 1: Complete Diary**
```
Update diary with:
- End time, duration
- Files modified
- Problems encountered & solutions
- Deployments (if any)
- Tests results
- Next steps
```

### **Step 2: Update Handovers**
```
For each category touched:
  - Append entry to handovers/[category].md
  - Create handover if doesn't exist
  - Add cross-reference to diary
```

### **Step 3: Check PROJECT_CONTEXT**
```
If major changes (URL, architecture, ports):
  - Update PROJECT_CONTEXT.md
  - Update "Last Updated" timestamp
```

### **Step 4: Show Summary**
```
Display:
- Session duration
- Files modified
- Categories updated
- Deployments
- Pending tasks
```

---

## 📔 Diary Format

### **Naming Convention**
```
YYYY-MM-DD_MODEL_mMATRICOLA.md

Examples:
2025-10-01_sonnet-4.5_m1.md    # First CLI today, Sonnet
2025-10-01_opus-4.1_m2.md      # Second CLI today, Opus
2025-10-01_sonnet-4.5_m3.md    # Third CLI today, Sonnet
2025-10-02_sonnet-4.5_m1.md    # Next day, reset matricola
```

### **Model Detection**
```
claude-sonnet-4-5-* → "sonnet-4.5"
claude-opus-4-* → "opus-4.1"
gpt-4-* → "gpt-4"
```

### **Template Structure**
```markdown
# Session Diary: YYYY-MM-DD | Model Name | Matricola N

> **⚠️ SNAPSHOT CIRCOSTANZIATO**
> Questo report descrive lo stato **al momento della sessione**.

## Session Info
- Start: HH:MM
- End: HH:MM
- Duration: Xh Ym
- Task: [description]

## Lavoro Svolto
[chronological log with timestamps]

## Codice Implementato
[code snippets with file paths and line numbers]

## Problemi Incontrati
[errors, root causes, solutions, time lost]

## Categories Updated
- [link to handover]#anchor

## Snapshot Circostanziato
[state at end of session: URLs, versions, pending tasks]
```

---

## 📝 Handover Format

### **Naming Convention**
```
[area]-[component].md

Examples:
backend-routes.md       # API routes
backend-handlers.md     # Business logic handlers
deploy-backend.md       # Backend deployments
deploy-rag.md          # RAG deployments
frontend-api-client.md # Frontend API integration
rag-chromadb.md        # ChromaDB operations
infra-gcp.md           # GCP infrastructure
```

### **Template Structure**
```markdown
# [Category Name] Handover

> **What This Tracks**: [description]
> **Created**: YYYY-MM-DD by [model_matricola]

## Current State
[current status, last known good state]

---
## History

### YYYY-MM-DD HH:MM ([task-id]) [model_matricola]

**Changed**:
- [file:line] - [description]

**Related**:
→ Full session: [diary link]#anchor

---
```

### **Auto-Creation**
```
If handover doesn't exist when needed:
1. Create from template
2. Add "Created" timestamp
3. Add first entry
```

---

## 🔍 Category Auto-Detection

### **Keywords Map**
```javascript
const CATEGORY_KEYWORDS = {
  'backend-routes': ['routes', 'endpoint', 'api'],
  'backend-handlers': ['handlers', 'business logic'],
  'backend-middleware': ['middleware', 'auth', 'validation'],
  'deploy-backend': ['deploy', 'cloud run', 'gcloud', 'docker'],
  'deploy-rag': ['deploy rag', 'rag backend'],
  'frontend-ui': ['html', 'css', 'ui', 'interface'],
  'frontend-api-client': ['api-config', 'fetch', 'api call'],
  'rag-chromadb': ['chromadb', 'embeddings', 'vector'],
  'rag-search': ['search', 'rag', 'query'],
  'rag-ingestion': ['ingest', 'pdf', 'kb'],
  'infra-gcp': ['gcp', 'cloud', 'project'],
  'infra-secrets': ['secret', 'api key', 'env'],
  'config-docker': ['dockerfile', 'docker', 'container'],
  'config-env': ['.env', 'environment'],
  'debug': ['fix', 'bug', 'error']
};
```

### **File Path Map**
```javascript
const FILE_TO_CATEGORIES = {
  'routes/*.ts': ['backend-routes'],
  'handlers/*.js': ['backend-handlers'],
  'middleware/*.js': ['backend-middleware'],
  'Dockerfile*': ['config-docker', 'deploy-backend'],
  'zantara_webapp/js/api-config.js': ['frontend-api-client'],
  'backend/app/main*.py': ['deploy-rag'],
  'backend/services/search*.py': ['rag-search']
};
```

---

## 🎯 Best Practices

### **DO**
✅ Read PROJECT_CONTEXT first (always)
✅ Read today + yesterday diaries (complete context)
✅ Create handovers on-demand (not upfront)
✅ Log problems + solutions in diary (help future sessions)
✅ Update PROJECT_CONTEXT when URLs/architecture change
✅ Cross-reference diary ↔ handover (bidirectional links)

### **DON'T**
❌ Read all handovers at start (waste of time)
❌ Create handovers you don't need (clutter)
❌ Put code snippets in handovers (use diaries instead)
❌ Update PROJECT_CONTEXT for small changes (use handovers)
❌ Skip diary creation (lose session knowledge)

---

## 🔧 Maintenance

### **Archive Old Diaries**
```bash
# Keep last 30 days, archive older
find .claude/diaries/ -name "*.md" -mtime +30 -exec mv {} archive/diaries/ \;
```

### **Clean Empty Handovers**
```bash
# Remove handovers with no history entries
# (manual review recommended)
```

### **Update PROJECT_CONTEXT**
```
Frequency: When major changes occur
Who: Any session that makes architectural changes
How: Edit file + update timestamp
```

---

## 📊 Example Multi-CLI Session

```
Day: 2025-10-01

16:30 → CLI 1 (Sonnet 4.5, m1)
        Task: Deploy RAG backend
        Diary: 2025-10-01_sonnet-4.5_m1.md
        Handovers: deploy-rag.md, config-docker.md

17:00 → CLI 2 (Opus 4.1, m2)
        Task: Fix CORS in frontend
        Reads: diaries from m1 (context)
        Diary: 2025-10-01_opus-4.1_m2.md
        Handovers: frontend-api-client.md, debug.md

18:30 → CLI 3 (Sonnet 4.5, m3)
        Task: Add WebSocket support
        Reads: diaries from m1 + m2 (full context)
        Diary: 2025-10-01_sonnet-4.5_m3.md
        Handovers: backend-routes.md, backend-handlers.md

Next Day: 2025-10-02

10:00 → CLI 1 (Sonnet 4.5, m1)
        Reads: All diaries from 2025-10-01 + 2025-09-30
        Matricola: Reset to 1 (new day)
```

---

---

## 🌐 KB CONTENT LANGUAGE RULES (PERMANENT)

> **🔴 MANDATORY POLICY FOR ALL KB UPDATES**

**Rule**: Indonesian for LAW, English for PRACTICE

### Quick Reference:
- ✅ **Indonesian**: Legal regulations, official procedures, legal terms
  - Permenkumham, Undang-Undang, RPTKA procedures, LKPM requirements
  - File location: `nuzantara-kb/kb-agents/visa/regulations/indonesian/`

- ✅ **English**: Case studies, practical guides, FAQ, examples
  - User-facing content, how-to guides, troubleshooting
  - File location: `nuzantara-kb/kb-agents/visa/cases/` or `/guides/`

### Full Policy:
📄 **See**: `nuzantara-kb/kb-agents/KB_CONTENT_RULES.md` (detailed rules + examples)
📄 **See**: `nuzantara-kb/kb-agents/visa/KB_BILINGUAL_STRUCTURE_GUIDE.md` (implementation guide)

**Enforcement**: This rule applies to ALL immigration/VISA content forever. DO NOT violate.

---

**System Version**: 1.0.1
**Created**: 2025-10-01
**Last Updated**: 2025-10-03 (added KB language rules)
**Maintained by**: All Claude Code sessions
