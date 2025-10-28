# 🤝 AI Coordination System
> **Auto-sync ogni 5 minuti** | Hard locks attivi | Retention: 7 giorni

**Ultimo aggiornamento**: 2025-10-29 14:20:00 UTC

---

## 🟢 Active Windows (Auto-detected)

| Window | AI Model | Task | Status | Since | Locked Files | Last Update |
|--------|----------|------|--------|-------|--------------|-------------|
| W1 | - | Available | ⚪️ Idle | - | - | - |
| W2 | - | Available | ⚪️ Idle | - | - | - |
| W3 | - | Available | ⚪️ Idle | - | - | - |
| W4 | - | Available | ⚪️ Idle | - | - | - |

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
# Nessun lock attivo
# Esempio: apps/backend-ts/src/handlers/ai-services/** → W1 | - | Available | ⚪️ Idle | - | - | -
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
| W1 | 2 | ~15min | 6 | 0 |
| W2 | 0 | - | 0 | 0 |
| W3 | 0 | - | 0 | 0 |
| W4 | 0 | - | 0 | 0 |

---

## 🔄 Auto-Sync Status

**Sync Script**: `.claude/scripts/sync-coordination.sh`
**Frequency**: Ogni 5 minuti
**Status**: 🟢 Active
**Last sync**: 2025-10-29 00:10:00
**Next sync**: 2025-10-29 00:15:00

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
