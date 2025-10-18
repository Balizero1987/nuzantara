# 📁 .claude/ - AI Session Tracking

> **Sistema per gestire 4 istanze AI concorrenti su NUZANTARA**

---

## 🚀 Per Nuove Istanze AI

**Prima volta qui?** Leggi SOLO [`START_HERE.md`](START_HERE.md) (2 minuti)

**Già operativo?** Workflow:
```bash
1. User ti dice quale window sei (W1/W2/W3/W4)
2. Leggi PROJECT_CONTEXT.md (context sistema)
3. Apri il tuo CURRENT_SESSION_WX.md
4. Lavora e aggiorna progressivamente
5. Fine: appendi a ARCHIVE_SESSIONS.md
```

---

## 📁 File Structure

```
.claude/
├── START_HERE.md               # ★ Entry point per nuove AI
├── PROJECT_CONTEXT.md          # ★ Context tecnico NUZANTARA
├── CURRENT_SESSION_W1.md       # ★ Window 1 (max 4 concurrent)
├── CURRENT_SESSION_W2.md       # ★ Window 2
├── CURRENT_SESSION_W3.md       # ★ Window 3
├── CURRENT_SESSION_W4.md       # ★ Window 4
├── CURRENT_SESSION.template.md # Template per reset
└── ARCHIVE_SESSIONS.md         # ★ Log globale append-only

# Legacy (read-only, non modificare)
├── diaries/                    # Vecchie sessioni
├── handovers/                  # Vecchi handover
└── [altri].md                  # Report storici
```

**Regola**: Usa SOLO i 4 file core (W1-W4 + ARCHIVE). Zero nuovi file.

---

## ⚡ Workflow AI Session

### 🟢 Start
```bash
# User assegna window
User: "Sei W2, implementa feature X"

# Carica context
1. PROJECT_CONTEXT.md (5 min)
2. CURRENT_SESSION_W2.md (stato attuale)
3. tail -100 ARCHIVE_SESSIONS.md (ultime sessioni, opzionale)

# Sovrascrivi il tuo file
cp CURRENT_SESSION.template.md CURRENT_SESSION_W2.md
# Compila: Window, Date, Model, Task
```

### 🟡 Work
```bash
# Aggiorna SOLO il tuo CURRENT_SESSION_WX.md
- Task completati
- File modificati
- Problemi risolti
- Note tecniche

# Regole
- NON creare nuovi file MD
- NON toccare altre window (W1-W4)
- Sovrascrivi progressivamente
```

### 🔴 End
```bash
# Completa sezione finale
## 🏁 Chiusura Sessione
- Risultato: [summary]
- Build/Tests: ✅/❌
- Handover: [info per prossima AI]

# Archivia
cat CURRENT_SESSION_W2.md >> ARCHIVE_SESSIONS.md
echo "\n---\n" >> ARCHIVE_SESSIONS.md

# Reset
cp CURRENT_SESSION.template.md CURRENT_SESSION_W2.md
```

---

## 📋 Template Standard

```markdown
## 📅 Session Info
- Window: WX (W1/W2/W3/W4)
- Date: YYYY-MM-DD HH:MM UTC
- Model: [model-id]
- User: antonellosiano
- Task: [user request]

## ✅ Task Completati
### 1. [Task Name]
- Status: ✅/🚧/❌
- Files: path/to/file.ts
- Changes: [what changed]
- Result: [outcome]

## 📝 Note Tecniche
### Scoperte
- [important findings]

### Problemi Risolti
- [issue] → [solution]

### TODO Next
- [ ] Item

## 🔗 Files Rilevanti
- path/to/file - description

## 📊 Metrics
- Duration: ~X hours
- Files modified: X
- Tests: ✅/❌

## 🏁 Chiusura
### Risultato
[summary]

### System Status
- Build: ✅/❌
- Tests: ✅/❌
- Deploy: ✅/❌

### Handover
[what next AI needs to know]
```

---

## 🔍 Search Previous Sessions

### ARCHIVE_SESSIONS.md
```bash
# By date
grep -A 50 "Date: 2025-10-18" ARCHIVE_SESSIONS.md

# By keyword
grep -A 20 "Railway" ARCHIVE_SESSIONS.md

# Last 3 sessions
tail -n 300 ARCHIVE_SESSIONS.md

# Today
grep -A 50 "Date: $(date +%Y-%m-%d)" ARCHIVE_SESSIONS.md
```

### Legacy diaries/ (if needed)
```bash
# Only if ARCHIVE_SESSIONS doesn't have what you need
grep -r "keyword" diaries/
ls -lt diaries/ | head -10
```

---

## ✅ Rules

### DO
- ✅ Ask user which window (if not told)
- ✅ Use your CURRENT_SESSION_WX.md only
- ✅ Overwrite, don't create new files
- ✅ Archive at end of session
- ✅ Follow template structure
- ✅ Work from .claude/ directory when using bash commands

### DON'T
- ❌ **Create ANY new files in .claude/** (no .md, .txt, .log, .json)
- ❌ Modify diaries/ or handovers/ (legacy archive, read-only)
- ❌ Touch other windows (W1-W4)
- ❌ Read all files upfront (load only what needed)
- ❌ Skip archiving at end
- ❌ Use absolute paths when appending to ARCHIVE_SESSIONS.md

### ✅ WHAT TO MODIFY
```bash
# In .claude/: ONLY your session file
.claude/CURRENT_SESSION_WX.md  # ✅

# In project: ALL files needed for the task
apps/*/, packages/*/, docs/, config/, etc.  # ✅
```

### ✅ CORRECT Working Directory
```bash
# When archiving, work from .claude/ directory:
cd /path/to/NUZANTARA-RAILWAY/.claude
cat CURRENT_SESSION_W1.md >> ARCHIVE_SESSIONS.md  # ✅

# NOT from root:
cat .claude/CURRENT_SESSION_W1.md >> .claude/ARCHIVE_SESSIONS.md  # ❌ works but unnecessary
```

---

## 📚 Reference Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `START_HERE.md` | Quick start | First time |
| `PROJECT_CONTEXT.md` | System context | Every session |
| `CURRENT_SESSION_W1-4.md` | Active sessions | Your working file |
| `ARCHIVE_SESSIONS.md` | History | Search past work |
| `ARCHITECTURE.md` | Full architecture | Deep dive needed |
| `diaries/` | Legacy sessions | Specific history needed |

---

## 🔧 Commands

### Session Setup
```bash
# User tells you: "You're W2"
cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION_W2.md
code .claude/CURRENT_SESSION_W2.md
```

### Archive
```bash
# Replace W2 with your window number
cat .claude/CURRENT_SESSION_W2.md >> .claude/ARCHIVE_SESSIONS.md
echo "\n---\n" >> .claude/ARCHIVE_SESSIONS.md
cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION_W2.md
```

### Search
```bash
# Date
grep -A 50 "Date: 2025-10" .claude/ARCHIVE_SESSIONS.md

# Keyword
grep -i -A 20 "railway" .claude/ARCHIVE_SESSIONS.md

# Recent
tail -n 500 .claude/ARCHIVE_SESSIONS.md
```

---

## 🎯 Multi-Window Concurrency

**User runs 4 AI instances simultaneously:**
```
Window 1 → AI #1 (task A) → CURRENT_SESSION_W1.md
Window 2 → AI #2 (task B) → CURRENT_SESSION_W2.md
Window 3 → AI #3 (task C) → CURRENT_SESSION_W3.md
Window 4 → AI #4 (task D) → CURRENT_SESSION_W4.md
```

**Rules:**
- Each AI works on separate file
- No file conflicts (W1-W4 isolated)
- Archiving is sequential (append-only safe)
- Only user knows which AI is in which window

---

## 🆘 FAQ

**Q: How do I know which window I am?**
A: User tells you at start. If unclear, ask: "Which window am I? (W1/W2/W3/W4)"

**Q: Where do I track my session?**
A: Your assigned CURRENT_SESSION_WX.md file

**Q: Can I create new files?**
A: NO. Use only your assigned WX file

**Q: How many concurrent AI instances?**
A: Max 4 (W1, W2, W3, W4)

**Q: What if I need context from other windows?**
A: Read their CURRENT_SESSION_WX.md files (read-only)

---

## 🌐 KB Content Rules

> **For NUZANTARA KB updates only**

**Rule**: Indonesian for LAW, English for PRACTICE
- Indonesian: Legal regulations, procedures
- English: Guides, examples, FAQ

See: `nuzantara-kb/kb-agents/KB_CONTENT_RULES.md`

---

**System Version**: 2.1.0 (AI-optimized)
**Created**: 2025-10-01
**Updated**: 2025-10-18 (AI instance focus)
**Maintained by**: All AI instances
