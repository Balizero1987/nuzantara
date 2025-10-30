# 🤝 AI Coordination System
> **Auto-sync ogni 5 minuti** | Hard locks attivi | Retention: 7 giorni

**Ultimo aggiornamento**: 2025-10-31 03:59:00 UTC

---

## 🟢 Active Windows (Auto-detected)

| Window | AI Model | Task | Status | Since | Locked Files | Last Update |
|--------|----------|------|--------|-------|--------------|-------------|
| W1 | Sonnet 4.5 | 🚀 PATCH-1 Redis + Service Consolidation | 🟢 Completed | 10:30 | apps/orchestrator/**, apps/unified-backend/** | 2025-10-29 11:57 |
| W2 | Opus 4.1 | 🌺 JIWA Integration | 🟢 Completed | 06:00 | apps/ibu-nuzantara/** | 2025-10-29 06:25 |
| W3 | Sonnet 4.5 | 🌐 Intel Scraping + Webapp Design Fix + ZANTARA Bridge | 🟢 Completed | 18:00 | website/**, .zantara/bridge/** | 2025-10-31 03:59 |
| W4 | - | Available | ⚪️ Idle | - | - | - |
| W5 | Sonnet 4.5 | 🔍 Intel Scraping System Optimization | 🟢 Completed | 08:30 | website/INTEL_SCRAPING/** | 2025-10-29 12:02 |

**Status Legend**:
- 🟢 Active (working)
- 🟡 Paused (thinking/reading)
- 🔴 Critical (error state)
- ⚪️ Idle (available)

---

## 🔒 Resource Locks (Hard Lock - Will Error!)

**Formato**: `path/to/file|directory/** → WX (reason) [since HH:MM]`

### Current Locks
```
# COMPLETED SESSION LOCKS (Released)
# apps/orchestrator/** → W1 (PATCH-1 Redis Cache) [10:30-11:57] ✅ COMPLETED
# apps/unified-backend/** → W1 (PATCH-6 Service Consolidation) [10:30-11:57] ✅ COMPLETED
# apps/flan-router/fly.toml → W1 (Fly.io Debug) [11:30-11:57] ✅ COMPLETED
# apps/ibu-nuzantara/** → W2 (JIWA System Integration) [06:00-06:25] ✅ COMPLETED
# website/INTEL_SCRAPING/** → W5 (Intel Scraping Optimization) [08:30-12:02] ✅ COMPLETED
# website/INTEL_SCRAPING/** → W3 (Intel +141 URLs + 3 categories) [18:00-03:59] ✅ COMPLETED
# website/zantara webapp/** → W3 (Webapp design fix) [18:00-03:59] ✅ COMPLETED
# .zantara/bridge/** → W3 (ZANTARA Bridge docs) [18:00-03:59] ✅ COMPLETED
```

### Lock Rules
- **Hard Lock**: Altri AI riceveranno ERROR se tentano accesso
- **Scope**: File singolo o directory con `**`
- **Duration**: Max 2 ore, poi richiesta conferma user
- **Override**: Solo con conferma esplicita user

---

## 📋 Task Queue

### 🔥 High Priority (Prendi subito!)
```
# Nessun task urgente
```

### 🎯 Medium Priority
```
# Nessun task in attesa
```

### 💡 Low Priority (Quando hai tempo)
```
# Nessun task in backlog
```

---

## 🚨 Conflict Prevention

### Come Evitare Conflitti
1. **Prima di iniziare**: Leggi questo file
2. **Lock subito**: Dichiara le risorse che userai
3. **Sync ogni 5min**: Auto-update automatico (script attivo)
4. **Comunica**: Aggiorna task status nel tuo `CURRENT_SESSION_WX.md`

### Se Trovi Un Lock
```bash
# ❌ NON FORZARE - Hard lock attivo!
# ✅ Opzioni:
1. Scegli altro task dalla queue
2. Chiedi user override (casi eccezionali)
3. Lavora su altro modulo/file
```

---

## 📊 Statistics (Last 7 Days)

| Window | Sessions | Avg Duration | Tasks Completed | Conflicts |
|--------|----------|--------------|-----------------|-----------|
| W1 | 3 | ~39min | 9 (Redis Cache + Service Consolidation + Fly.io Debug) | 0 |
| W2 | 2 | ~50min | 2 (Router-Only System + JIWA Integration) | 0 |
| W3 | 1 | ~10h | 3 (Intel Scraping +141 URLs + Webapp Design Fix + Bridge Docs) | 0 |
| W4 | 0 | - | 0 | 0 |
| W5 | 1 | ~3h32min | 1 (Intel Scraping System Optimization) | 0 |

---

## 🔄 Auto-Sync Status

**Sync Script**: `.claude/scripts/sync-coordination.sh`
**Frequency**: Ogni 5 minuti
**Status**: 🟢 Active
**Last sync**: 2025-10-29 12:02:00
**Next sync**: 2025-10-29 12:07:00

---

## 📖 Quick Reference

### Entry Workflow
```bash
# 1. User ti assegna window
User: "Sei W2, [task]"

# 2. Auto-detect verifica se W2 è libero
bash .claude/scripts/enter-window.sh W2

# 3. Leggi coordination
cat .claude/AI_COORDINATION.md

# 4. Dichiara lock se necessario
echo "apps/backend-ts/** → W2 (task description) [$(date +%H:%M)]" >> .claude/locks/active.txt

# 5. Lavora e aggiorna CURRENT_SESSION_W2.md
```

### Exit Workflow
```bash
# 1. Rilascia lock
sed -i '' '/→ W2/d' .claude/locks/active.txt

# 2. Archivia sessione (flessibile - scegli formato!)
bash .claude/scripts/exit-window.sh W2

# 3. Reset window status
# Auto-eseguito dallo script
```

---

## 🛠️ Maintenance

**Auto-cleanup**: Handovers >7 giorni eliminati automaticamente
**Manual cleanup**: `npm run ai:cleanup`
**Force reset**: `npm run ai:reset-all` (emergenza)

---

**🚀 Ready to code?** Dichiara il tuo lock e inizia!
