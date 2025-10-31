# ⚡ VIBE Dashboard

Multi-Agent AI Orchestration Dashboard for ZANTARA

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Open browser
open http://localhost:3030

# Default PIN: 1987
```

## Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Features

- 💬 **Chat Interface** - Natural language commands
- 🤖 **Agent Status** - Real-time monitoring of all AI agents
- 🚀 **Quick Actions** - One-click common tasks
- 📜 **Log Viewer** - Unified logs from all services
- 🎨 **ZANTARA Theme** - Nero-oro design matching brand

## Architecture

```
Dashboard (React/Next.js)
    ↓ (SSE)
Cloudflare Workers (Orchestrator)
    ↓
Fly.io Swarm Agent
    ↓
AI APIs (Cursor, Claude, Copilot, ChatGPT)
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Styling**: ZANTARA gold/dark theme
- **Deployment**: Cloudflare Pages
- **Communication**: SSE (Server-Sent Events)
