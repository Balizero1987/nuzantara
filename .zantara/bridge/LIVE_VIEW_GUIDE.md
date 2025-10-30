# 🎬 ZANTARA Bridge - Live iTerm2 View

## 🎯 Cosa Fa

Quando ChatGPT Atlas invia un task, **si apre automaticamente una nuova finestra iTerm2** dove puoi vedere Claude Code CLI lavorare **in tempo reale**.

---

## 🖼️ Come Appare

Quando arriva un task, vedrai qualcosa del genere:

```
╔════════════════════════════════════════════════════════════════════════════╗
║  ZANTARA BRIDGE - Claude Code CLI Execution                                ║
╚════════════════════════════════════════════════════════════════════════════╝

Task ID:   6ac8ce3c9eae
Context:   nuzantara
Priority:  high (from ChatGPT Atlas)

Task Description:
Fix authentication bug in apps/backend-ts/src/auth/jwt.ts - increase token
expiration from 1h to 24h and add refresh token mechanism

════════════════════════════════════════════════════════════════════════════

Starting Claude Code CLI...

[Qui vedrai Claude Code lavorare LIVE]
• Reading files...
• Analyzing code...
• Making changes...
• Testing...

════════════════════════════════════════════════════════════════════════════
✓ Task completed successfully!

Press any key to close this window...
```

---

## ⚙️ Come Funziona

### Workflow Completo

1. **ChatGPT Atlas genera comando:**
   ```bash
   ./bridge_client.sh "Fix auth bug" "backend" "high"
   ```

2. **Tu esegui il comando sul Mac**

3. **Bridge Server riceve e salva YAML**

4. **Watcher rileva il nuovo file**

5. **🆕 SI APRE AUTOMATICAMENTE UNA NUOVA FINESTRA iTerm2**
   - Mostra task details
   - Avvia Claude Code CLI
   - Tu vedi tutto in tempo reale

6. **Claude lavora e tu guardi**
   - Vedi file che legge
   - Vedi modifiche che fa
   - Vedi output e eventuali errori

7. **Task completo**
   - Messaggio di successo
   - Premi un tasto per chiudere la finestra
   - File archiviato in executed/

---

## 🎮 Configurazione

### Abilitare/Disabilitare Live View

Modifica `.zantara/bridge/config/bridge_config.yaml`:

```yaml
processors:
  claude:
    enabled: true
    options:
      # Toggle this
      show_in_iterm: true  # false per disabilitare
```

### Context-Specific

Puoi abilitarlo solo per certi contexts:

```yaml
contexts:
  nuzantara:
    priority: high
    processor: claude
    show_in_iterm: true    # Live view per nuzantara

  test:
    priority: low
    processor: manual      # No live view, solo log
```

---

## 🧪 Test Live View

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge

# Assicurati che bridge sia running
./run.sh

# In un altro terminal, esegui test
./test_iterm_live.sh
```

**Cosa succede:**
1. Script verifica che il bridge sia online
2. Sottomette un task di test
3. **BAM! Si apre una nuova finestra iTerm2**
4. Vedi Claude analizzare la struttura del progetto
5. Quando finisce, premi un tasto per chiudere

---

## 💡 Vantaggi

### 1. **Trasparenza Totale**
- Vedi esattamente cosa fa Claude
- Nessuna "scatola nera"
- Debug immediato se qualcosa va storto

### 2. **Engagement**
- Non più "aspetto che finisca"
- Attivamente guardi il lavoro svolgersi
- Puoi interrompere (Ctrl+C) se necessario

### 3. **Learning**
- Vedi come Claude ragiona
- Impari dai suoi approcci
- Capisci il processo

### 4. **Verifica Immediata**
- Vedi errori in tempo reale
- Nessuna sorpresa alla fine
- Feedback loop più veloce

---

## 🔧 Dettagli Tecnici

### Come Funziona Internamente

**bridge_watcher.py:**
```python
def _process_with_claude(self, task, context, task_id):
    # 1. Crea script bash temporaneo
    script_file = LOGS_DIR / f"claude_task_{task_id}.sh"

    # 2. Script contiene:
    #    - Header formattato
    #    - Task details
    #    - Claude command
    #    - Success/failure message

    # 3. Usa AppleScript per aprire iTerm2
    applescript = '''
    tell application "iTerm"
        create window with default profile
        tell current session of current window
            write text "bash {script}"
        end tell
    end tell
    '''

    # 4. Esegue AppleScript
    subprocess.run(["osascript", "-e", applescript])
```

### Script Generato

Location: `.zantara/bridge/logs/claude_task_{task_id}.sh`

Puoi ri-eseguire manualmente:
```bash
bash .zantara/bridge/logs/claude_task_abc123.sh
```

---

## 🎨 Personalizzazione

### Cambia Colori/Formato

Modifica `bridge_watcher.py` nella sezione `_process_with_claude`:

```python
f.write(f"""#!/bin/bash
# Aggiungi colori ANSI
RED='\\033[0;31m'
GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
NC='\\033[0m'

echo -e "${{BLUE}}╔═══════════════════╗${{NC}}"
echo -e "${{BLUE}}║  Your Custom Header  ║${{NC}}"
echo -e "${{BLUE}}╚═══════════════════╝${{NC}}"
# ... rest of script
""")
```

### Aggiungi Notifiche macOS

```python
# Dopo Claude execution
subprocess.run([
    "osascript", "-e",
    f'display notification "Task {task_id} completed" with title "ZANTARA Bridge"'
])
```

---

## 📊 Confronto Modalità

### Background Mode (Originale)
```
✓ Pro: Non distrae
✗ Con: Non vedi cosa succede
✗ Con: Scopri errori dopo
```

### Live iTerm2 Mode (Nuovo)
```
✓ Pro: Vedi tutto in tempo reale
✓ Pro: Debug immediato
✓ Pro: Più coinvolgente
✗ Con: Una finestra in più (gestibile)
```

### Manual Mode
```
✓ Pro: Controllo totale
✗ Con: Devi eseguire manualmente
✗ Con: Niente automazione
```

---

## 🚀 Workflow Ideale

### Setup Iniziale
```bash
# Terminal 1: Bridge server + watcher
cd .zantara/bridge && ./run.sh
```

### Uso Normale
1. ChatGPT Atlas genera task command
2. Tu lo esegui
3. **Nuova finestra iTerm2 si apre automaticamente**
4. Guardi Claude lavorare
5. Task completo → premi tasto → finestra si chiude
6. Repeat!

### Multiple Tasks
Se arrivano più task:
- **Una finestra iTerm2 per task**
- Ogni finestra mostra task specifico
- Puoi seguirli tutti in parallelo
- O minimizzare quelli meno interessanti

---

## 🐛 Troubleshooting

### iTerm2 non si apre
```bash
# Verifica che iTerm2 sia installato
ls /Applications/iTerm.app

# Se non c'è, installa:
brew install --cask iterm2
```

### Finestra si apre ma non esegue
```bash
# Verifica permessi script
ls -la .zantara/bridge/logs/claude_task_*.sh

# Dovrebbe essere: -rwxr-xr-x
# Se no:
chmod +x .zantara/bridge/logs/claude_task_*.sh
```

### Claude command not found
```bash
# Verifica Claude CLI installato
which claude

# Se non c'è, installa da:
# https://claude.ai/download
```

### AppleScript errors
```bash
# Test AppleScript manualmente
osascript -e 'tell application "iTerm" to create window with default profile'

# Se errore, verifica permessi Accessibility:
# System Settings → Privacy & Security → Accessibility → iTerm2
```

---

## 📝 Note Importanti

### Performance
- **Nessun impatto**: iTerm2 si apre in ~200ms
- **Parallelo**: Watcher continua a funzionare
- **Lightweight**: Script bash semplice

### Privacy
- Script temporanei sono in `logs/` (gitignored)
- Nessun dato sensibile esposto
- Pulisci vecchi script se vuoi:
  ```bash
  rm .zantara/bridge/logs/claude_task_*.sh
  ```

### Compatibilità
- ✅ macOS (iTerm2 + AppleScript)
- ❌ Linux (usa `gnome-terminal` o `xterm`)
- ❌ Windows (usa `Windows Terminal` con PowerShell)

---

## 🎯 Esempi d'Uso

### Esempio 1: Bug Fix Live
```bash
./bridge_client.sh "Fix memory leak in apps/orchestrator/src/websocket.ts" "backend" "critical"

# iTerm2 si apre e vedi:
# • Claude legge websocket.ts
# • Identifica il leak (listener non rimosso)
# • Aggiunge cleanup nel disconnect handler
# • Testa la fix
# • ✓ Completato!
```

### Esempio 2: Feature Development
```bash
./bridge_client.sh "Implement dark mode toggle in website/app/layout.tsx" "webapp" "medium"

# iTerm2 mostra:
# • Analisi del tema corrente
# • Aggiunta state management
# • Creazione CSS variables
# • Testing del toggle
# • ✓ Dark mode implementato!
```

### Esempio 3: Code Review
```bash
./bridge_client.sh "Review security of authentication flow in apps/backend-ts/src/auth/" "security" "high"

# Vedi Claude:
# • Analizzare ogni file auth
# • Identificare vulnerabilità
# • Suggerire fix
# • Generare report
# • ✓ Review completata!
```

---

## 🏁 Conclusione

**Live iTerm2 View** trasforma ZANTARA Bridge da sistema automatico "invisibile" a **esperienza interattiva e trasparente**.

**Vantaggi chiave:**
- ✅ Vedi Claude lavorare in real-time
- ✅ Debug immediato
- ✅ Learning experience
- ✅ Nessun impatto performance
- ✅ Facilmente disabilitabile

**Ready to watch AI at work! 🎬**

---

**Location**: `.zantara/bridge/`
**Feature**: Live iTerm2 View
**Version**: 1.1.0
**Status**: ✅ Production Ready
