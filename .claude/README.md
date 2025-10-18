# 📁 .claude/ - Session Tracking System

> **Sistema semplificato di gestione sessioni per NUZANTARA**

---

## 🚀 Quick Start (Nuovi Dev AI)

### 1️⃣ Prima Volta Qui?
**Leggi SOLO**: [`START_HERE.md`](START_HERE.md)

Quel file ti spiega tutto in 2 minuti. Non leggere altro finché non hai letto quello.

### 2️⃣ Hai già letto START_HERE?
Segui il workflow:

```bash
1. Leggi PROJECT_CONTEXT.md (5 min)
2. Apri CURRENT_SESSION.md (sovrascrivi per la tua sessione)
3. Lavora e aggiorna CURRENT_SESSION.md progressivamente
4. A fine sessione: appendi a ARCHIVE_SESSIONS.md
```

---

## 📁 Struttura File Core (SOLO 4 FILE!)

```
.claude/
├── START_HERE.md              # ★ Entry point obbligatorio
├── PROJECT_CONTEXT.md          # ★ Contesto tecnico progetto
├── CURRENT_SESSION.md          # ★ Sessione corrente (sovrascrivibile)
├── CURRENT_SESSION.template.md # Template per reset
└── ARCHIVE_SESSIONS.md         # ★ Storico append-only

# File legacy (non toccare, solo consultazione)
├── diaries/                   # Vecchie sessioni (archivio)
├── handovers/                 # Vecchi handover (archivio)
└── [altri file].md            # Report storici (read-only)
```

---

## 🎯 Workflow Sessione

### 🟢 Inizio Sessione

1. **Leggi** (in quest'ordine):
   ```bash
   START_HERE.md → PROJECT_CONTEXT.md → CURRENT_SESSION.md
   ```

2. **Apri** `CURRENT_SESSION.md`:
   - Sovrascrivi completamente
   - Compila Session Info (data, model, task)
   - Inizia a lavorare

### 🟡 Durante Sessione

1. **Aggiorna** `CURRENT_SESSION.md` progressivamente:
   - ✅ Task completati
   - 🚧 Task in progress
   - 📝 Note tecniche
   - 🔗 File rilevanti

2. **NON creare** nuovi file MD!

### 🔴 Fine Sessione

1. **Completa** `CURRENT_SESSION.md`:
   ```markdown
   ## 🏁 Chiusura Sessione
   - Risultato finale
   - Stato del sistema (Build/Tests/Deploy)
   - Handover al prossimo Dev AI
   ```

2. **Archivia**:
   ```bash
   # Appendi a storico
   cat CURRENT_SESSION.md >> ARCHIVE_SESSIONS.md
   echo "\n---\n" >> ARCHIVE_SESSIONS.md

   # Resetta per prossimo
   cp CURRENT_SESSION.template.md CURRENT_SESSION.md
   ```

3. **Verifica**:
   - ✅ ARCHIVE_SESSIONS.md contiene la tua sessione
   - ✅ CURRENT_SESSION.md è resettato al template

---

## 📋 Template Sessione

Usa sempre questo formato in `CURRENT_SESSION.md`:

```markdown
## 📅 Session Info
- Date: YYYY-MM-DD
- Time: HH:MM UTC
- Model: [model-name]
- User: antonellosiano

## 🎯 Task Ricevuto
[Descrizione task]

## ✅ Task Completati
### 1. [Nome Task]
- Status: ✅/🚧/❌
- Files Modified: [lista]
- Changes: [descrizione]
- Result: [risultato]

## 📝 Note Tecniche
### Scoperte Importanti
### Problemi Risolti
### TODO per Prossima Sessione

## 🔗 Files Rilevanti
[Lista file importanti]

## 📊 Metriche Sessione
- Durata: ~X ore
- File Modificati: X
- Test Status: ✅/❌

## 🏁 Chiusura Sessione
### Risultato Finale
### Stato del Sistema
### Handover al Prossimo Dev AI
```

---

## 🔍 Cercare Sessioni Passate

### Cerca in ARCHIVE_SESSIONS.md

```bash
# Per data
grep -A 50 "Date: 2025-10-18" ARCHIVE_SESSIONS.md

# Per keyword
grep -A 20 "Railway" ARCHIVE_SESSIONS.md
grep -A 20 "WebSocket" ARCHIVE_SESSIONS.md

# Ultime 3 sessioni
tail -n 300 ARCHIVE_SESSIONS.md

# Sessioni di oggi
grep -A 50 "Date: $(date +%Y-%m-%d)" ARCHIVE_SESSIONS.md
```

### Consulta diaries/ (se necessario)

```bash
# Cerca nei vecchi diaries solo se ARCHIVE_SESSIONS non basta
ls -lt diaries/ | head -10
grep -r "keyword" diaries/
```

---

## ✅ Regole d'Oro

### DO ✅
- ✅ Leggi START_HERE.md prima di tutto
- ✅ Usa CURRENT_SESSION.md come unico file attivo
- ✅ Sovrascrivi, non creare nuovi file
- ✅ Archivia a fine sessione
- ✅ Segui il template standard

### DON'T ❌
- ❌ Creare nuovi file MD in .claude/
- ❌ Modificare diaries/ o handovers/
- ❌ Leggere tutti i file all'inizio
- ❌ Saltare l'archiviazione a fine sessione
- ❌ Deviare dal template standard

---

## 📚 File di Riferimento

| File | Scopo | Quando Leggerlo |
|------|-------|-----------------|
| `START_HERE.md` | Onboarding | Prima volta qui |
| `PROJECT_CONTEXT.md` | Contesto tecnico | Ogni sessione |
| `CURRENT_SESSION.md` | Sessione attiva | Sempre (tuo file di lavoro) |
| `ARCHIVE_SESSIONS.md` | Storico | Quando cerchi qualcosa |
| `diaries/` | Vecchie sessioni | Solo se necessario |
| `handovers/` | Vecchi handover | Solo se necessario |

---

## 🔧 Comandi Utili

### Setup Sessione
```bash
# Copia template
cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION.md

# Apri per editing
code .claude/CURRENT_SESSION.md
```

### Archiviazione
```bash
# Appendi a archivio
cat .claude/CURRENT_SESSION.md >> .claude/ARCHIVE_SESSIONS.md
echo "\n---\n" >> .claude/ARCHIVE_SESSIONS.md

# Resetta
cp .claude/CURRENT_SESSION.template.md .claude/CURRENT_SESSION.md
```

### Ricerca
```bash
# Cerca per data
grep -A 50 "Date: 2025-10" .claude/ARCHIVE_SESSIONS.md

# Cerca per keyword
grep -i -A 20 "railway" .claude/ARCHIVE_SESSIONS.md

# Ultime sessioni
tail -n 500 .claude/ARCHIVE_SESSIONS.md
```

---

## 🌐 KB Content Language Rules

> **Regola permanente per contenuti Knowledge Base**

**Rule**: Indonesian for LAW, English for PRACTICE

- ✅ **Indonesian**: Legal regulations, official procedures
- ✅ **English**: Case studies, guides, FAQ

📄 **Full Policy**: `nuzantara-kb/kb-agents/KB_CONTENT_RULES.md`

---

## 🆘 Help

### Problemi Comuni

**Q: Dove trovo il contesto del progetto?**
A: `PROJECT_CONTEXT.md`

**Q: Come traccio la mia sessione?**
A: Usa `CURRENT_SESSION.md`, sovrascrivi il contenuto

**Q: Devo creare un nuovo file per la mia sessione?**
A: NO! Usa sempre `CURRENT_SESSION.md`

**Q: Come cerco sessioni passate?**
A: `grep` in `ARCHIVE_SESSIONS.md`

**Q: Posso modificare i file in diaries/?**
A: NO, sono read-only (archivio storico)

---

**System Version**: 2.0.0 (Simplified)
**Created**: 2025-10-01
**Updated**: 2025-10-18 (sistema semplificato)
**Maintained by**: All Dev AI sessions
