# 🎯 VIBE War Machine - Quick Start

Your multi-agent AI orchestration system is ready!

## 🚀 Start the System

```bash
./vibe-start.sh
```

Then open: **http://localhost:3030**
PIN: **1987**

## 🛑 Stop the System

```bash
./vibe-stop.sh
```

## 📊 Check Status

```bash
./vibe-status.sh
```

## 💬 How to Use

1. **Login** with PIN 1987
2. **Type natural language commands** in Italian or English
3. **Watch agents work** in real-time

### Example Commands:

```
crea una nuova API per gli utenti e testa tutto
deploy the backend to production
fix the authentication bug in main.py
generate documentation for the swarm agent
run all tests and show me the results
```

## 🤖 Available Agents

- **Cursor** → Code creation, bug fixes, refactoring
- **Claude** → Documentation, code optimization, architecture analysis
- **Copilot** → Test execution, code suggestions
- **ChatGPT** → Research, problem solving
- **Fly.io** → Deployment, infrastructure management

## 🎨 Features

- ✅ Intelligent NLP parsing (Claude Haiku 4.5)
- ✅ Real-time agent status
- ✅ SSE streaming for live updates
- ✅ ZANTARA nero-oro design
- ✅ Zero API costs (uses subscriptions)

## 🏗️ Architecture

```
Dashboard (localhost:3030)
    ↓ SSE Streaming
Orchestrator API (/api/orchestrate)
    ↓ Parse with Haiku
Swarm Agent (localhost:8080)
    ↓ Execute Tasks
Real Agents (claude, copilot, cursor, chatgpt, flyio)
```

## 💡 Tips

- The system auto-saves your session
- Agent status updates every 30 seconds
- Commands are parsed intelligently by Claude Haiku
- All CLI tools use your existing subscriptions (zero extra costs)

---

**Made with Claude Code** | Vibe Coding 2025
