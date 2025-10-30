# 🚀 ZANTARA Bridge - Startup Options

## ❓ Domanda Frequente

**"Devo sempre eseguire `./run.sh` prima di usare il bridge?"**

**Risposta: SÌ, il bridge deve essere RUNNING**

---

## 🔧 3 Modi per Avviare il Bridge

### **OPZIONE 1: Manual Start (Flessibile)** ⭐ Raccomandato per iniziare

#### Setup
**Terminal 1 - Server & Watcher:**
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge
./run.sh
```
Lascia questo terminal aperto. Vedrai i logs in tempo reale.

**Terminal 2 - Uso normale:**
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge
./bridge_client.sh "Your task here" "context" "priority"
```

#### Pro & Contro
✅ **Pro:**
- Vedi logs in tempo reale
- Facile da fermare (Ctrl+C)
- Debug semplice
- Controllo totale

❌ **Contro:**
- Devi ricordarti di avviarlo
- Un terminal sempre occupato
- Si ferma se chiudi il terminal

---

### **OPZIONE 2: Background Processes (Separato)**

Avvia server e watcher in **2 processi separati**.

#### Setup
**Start Server:**
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge
python bridge_server.py > logs/server_manual.log 2>&1 &
echo $! > .server.pid
```

**Start Watcher:**
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge
python bridge_watcher.py > logs/watcher_manual.log 2>&1 &
echo $! > .watcher.pid
```

**Check Status:**
```bash
# Check if running
ps -p $(cat .server.pid) > /dev/null && echo "Server running" || echo "Server stopped"
ps -p $(cat .watcher.pid) > /dev/null && echo "Watcher running" || echo "Watcher stopped"

# Or use curl
curl -s http://127.0.0.1:5050/health | jq
```

**Stop Services:**
```bash
kill $(cat .server.pid) 2>/dev/null || true
kill $(cat .watcher.pid) 2>/dev/null || true
rm .server.pid .watcher.pid
```

#### Pro & Contro
✅ **Pro:**
- Non occupa terminal
- Può rimanere running indefinitamente
- Logs salvati su file

❌ **Contro:**
- Più complicato da gestire
- Devi killare manualmente i processi
- Più difficile vedere cosa succede

---

### **OPZIONE 3: LaunchAgent (Automatico)** 🌟 Raccomandato per uso quotidiano

Installa il bridge come **servizio macOS** che parte **automaticamente all'avvio**.

#### Setup (Una Volta)
```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge
./install_launchd.sh
```

**Cosa fa:**
1. Crea 2 LaunchAgent files in `~/Library/LaunchAgents/`
2. Li registra con `launchctl`
3. Avvia server e watcher immediatamente
4. Configurati per riavviarsi automaticamente se crashano
5. Partono automaticamente al login

#### Verifica Installazione
```bash
# Check se servizi sono attivi
launchctl list | grep zantara

# Output atteso:
# 12345	0	com.zantara.bridge.server
# 12346	0	com.zantara.bridge.watcher

# Test server
curl http://127.0.0.1:5050/health | jq
```

#### Gestione
```bash
# Check status
launchctl list | grep zantara

# Stop temporaneamente
launchctl stop com.zantara.bridge.server
launchctl stop com.zantara.bridge.watcher

# Start manualmente
launchctl start com.zantara.bridge.server
launchctl start com.zantara.bridge.watcher

# View logs
tail -f logs/server_launchd.log
tail -f logs/watcher_launchd.log

# Disinstalla completamente
./uninstall_launchd.sh
```

#### Pro & Contro
✅ **Pro:**
- **Niente da fare!** Parte automaticamente
- Riavvio automatico se crash
- Perfetto per uso quotidiano
- Nessun terminal occupato
- Bridge sempre disponibile

❌ **Contro:**
- Setup iniziale più complesso
- Logs in file separati
- Più difficile da debuggare inizialmente

---

## 📊 Confronto Opzioni

| Feature | Manual | Background | LaunchAgent |
|---------|--------|------------|-------------|
| **Setup Difficulty** | 🟢 Easy | 🟡 Medium | 🔴 Advanced |
| **Daily Use** | 🟡 Manual start | 🟡 Manual start | 🟢 Automatic |
| **Debugging** | 🟢 Easy | 🟡 Medium | 🟡 Medium |
| **Logs Visibility** | 🟢 Real-time | 🟡 File-based | 🟡 File-based |
| **Reliability** | 🟡 Terminal-dependent | 🟢 Independent | 🟢 Auto-restart |
| **Recommended For** | Learning/Testing | Power Users | Daily Production |

---

## 🎯 Raccomandazione

### Per Iniziare (Primi Giorni)
**Usa OPZIONE 1 (Manual Start):**
```bash
./run.sh
```
- Più semplice
- Vedi cosa succede
- Impari come funziona

### Per Uso Quotidiano (Dopo 1 Settimana)
**Passa a OPZIONE 3 (LaunchAgent):**
```bash
./install_launchd.sh
```
- Niente da pensare
- Sempre disponibile
- Set it and forget it

---

## 🔍 Come Verificare se Bridge è Running

### Quick Check
```bash
curl -s http://127.0.0.1:5050/health
```

**Output atteso:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T23:00:00.000000",
  "directories": {
    "inbox": "/Users/.../inbox",
    "executed": "/Users/.../executed",
    "logs": "/Users/.../logs"
  }
}
```

### Detailed Check
```bash
# Check server process
ps aux | grep bridge_server.py | grep -v grep

# Check watcher process
ps aux | grep bridge_watcher.py | grep -v grep

# Check ports
lsof -i :5050

# Test submission
./bridge_client.sh "Test" "test" "low"
```

---

## 🐛 Troubleshooting

### "Bridge server is not accessible"

**Causa:** Server non running.

**Fix:**
```bash
# Option 1: Start with run.sh
./run.sh

# Option 2: Check if LaunchAgent is installed
launchctl list | grep zantara

# Option 3: Start manually
python bridge_server.py &
python bridge_watcher.py &
```

### "Port 5050 already in use"

**Causa:** Altro processo sta usando la porta.

**Fix:**
```bash
# Find what's using port 5050
lsof -ti:5050

# Kill it
kill -9 $(lsof -ti:5050)

# Restart bridge
./run.sh
```

### "Watcher not processing tasks"

**Causa:** Watcher non running o crashato.

**Fix:**
```bash
# Check if watcher is running
ps aux | grep bridge_watcher

# Check watcher logs
tail -50 logs/watcher_*.log

# Restart watcher
# If using run.sh: Ctrl+C and restart
# If using LaunchAgent:
launchctl stop com.zantara.bridge.watcher
launchctl start com.zantara.bridge.watcher
```

---

## 📝 Best Practices

### During Development/Testing
```bash
# Use manual start with visible logs
./run.sh

# In separate terminal, submit test tasks
./bridge_client.sh "Test task" "test" "low"

# Watch logs in real-time
tail -f logs/server_*.log logs/watcher_*.log
```

### For Daily Production Use
```bash
# Install LaunchAgent once
./install_launchd.sh

# Then just use bridge normally
./bridge_client.sh "Real task" "nuzantara" "high"

# Check status occasionally
curl http://127.0.0.1:5050/status | jq
```

### When Debugging Issues
```bash
# Uninstall LaunchAgent temporarily
./uninstall_launchd.sh

# Start manually to see logs
./run.sh

# Debug and fix issue

# Re-install LaunchAgent
./install_launchd.sh
```

---

## 🔄 Workflow Summary

### First Time Setup
1. **Install dependencies:** `./setup.sh`
2. **Test manually:** `./run.sh`
3. **Submit test task:** `./bridge_client.sh "Test" "test" "low"`
4. **Verify it works:** Check iTerm2 window opens
5. **Install LaunchAgent:** `./install_launchd.sh`
6. **Done!** Bridge is now always available

### Daily Use (After LaunchAgent Install)
1. **Submit task:** `./bridge_client.sh "Your task" "context" "priority"`
2. **Watch iTerm2 window open**
3. **See Claude work**
4. **Done!**

No need to think about starting/stopping the bridge!

---

## 💡 FAQ

**Q: Do I need to restart the bridge after system reboot?**
A: No, if using LaunchAgent. Yes, if using manual start.

**Q: Can I use the bridge from any directory?**
A: Yes, but you need to provide full path to `bridge_client.sh` or add it to PATH.

**Q: What happens if the bridge crashes?**
A:
- Manual: You need to restart it
- Background: Stays stopped
- LaunchAgent: Auto-restarts automatically

**Q: Can I see what tasks are pending?**
A: Yes, `curl http://127.0.0.1:5050/status | jq`

**Q: How do I update the bridge?**
A:
1. Stop it (`Ctrl+C` or `./uninstall_launchd.sh`)
2. `git pull` to get updates
3. Restart (`./run.sh` or `./install_launchd.sh`)

---

## 🎯 TL;DR

**Devo sempre eseguire `./run.sh`?**

**Opzione A (Facile ma manuale):**
```bash
./run.sh  # In un terminal, lascialo aperto
```

**Opzione B (Setup una volta, poi automatico):**
```bash
./install_launchd.sh  # Una volta sola
# Poi basta usare: ./bridge_client.sh
```

**Raccomandazione:**
- **Primi giorni:** Usa `./run.sh` (impari come funziona)
- **Dopo:** Usa `./install_launchd.sh` (set and forget)

---

**Location**: `.zantara/bridge/`
**Scripts**: `run.sh`, `install_launchd.sh`, `uninstall_launchd.sh`
**Version**: 1.1.0
