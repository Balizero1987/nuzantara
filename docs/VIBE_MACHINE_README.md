# ⚡ ZANTARA VIBE MACHINE

**The Ultimate Integrated Development Environment for ZANTARA**

## What is VIBE MACHINE?

A unified orchestration system that integrates:
- 🤖 **5 AI Assistants** (Claude, Copilot, Codex, Gemini, Aider)
- ☁️ **3 Cloud Platforms** (Fly.io, Railway, GitHub Pages)
- 🌐 **Browser Automation** (Playwright with stealth)
- 📊 **Live Monitoring** (btop, logs aggregation)
- 🚀 **One-Command Deployment** (multi-platform orchestrator)
- 🔥 **Hot Reload** (auto-restart on file changes)
- 🎨 **Aesthetic Terminal** (JetBrains Mono + Zantara Theme)

## Quick Start

### 1. Activate VIBE MACHINE
```bash
source ~/.claude/vibe-machine/aliases.zsh
```

### 2. Check System Status
```bash
vibe-status
```

### 3. Launch AI Assistant
```bash
ai                    # Claude Code Opus
copilot "help me"     # GitHub Copilot
codex "generate..."   # OpenAI Codex
```

### 4. Deploy Everything
```bash
deploy-all           # Deploy all backends + webapp
```

### 5. Monitor Systems
```bash
dash                 # Live dashboard
logs                 # Aggregate logs
test-api            # API health checks
```

## Core Commands

### AI Assistants
- `ai` - Claude Code Opus (best reasoning)
- `copilot` - GitHub Copilot CLI
- `codex` - OpenAI Codex
- `gemini` - Google Gemini
- `glm` - GLM-4.6 (Chinese model)
- `pair` - Aider (pair programming)

### Project Navigation
- `nuz` - Jump to project root
- `rag` - RAG backend directory
- `ts` - TS backend directory
- `web` - Webapp directory

### Deployment
- `deploy-all` - Deploy everything
- `deploy-rag` - RAG backend only
- `deploy-ts` - TS backend only
- `deploy-web` - Webapp only
- `status` - Check all deployments

### Monitoring
- `dash` - Live tmux dashboard
- `logs` - Aggregate logs from all sources
- `health` - Quick health check
- `test-api` - Comprehensive API tests

### Development
- `dev-all` - Start all dev servers in tmux
- `watch-logs` - Real-time log monitoring
- `quick-test` - Fast API connectivity test
- `perf-test` - Performance benchmarks

### Browser Automation
- `browse login <url> <user> <pass>`
- `browse scrape <url>`
- `screenshot <url> <output>`

## Advanced Features

### Hot Reload System
```bash
~/.claude/vibe-machine/hot-reload.sh all
```
Watches files and auto-restarts services on changes.

### Multi-Platform Deployment
```bash
~/.claude/vibe-machine/deploy-orchestrator.sh all
```
Deploys to Fly.io, Railway, and GitHub Pages simultaneously.

### Live Dashboard
```bash
vibe dash
```
Splits tmux/zellij with:
- System monitor (btop)
- Aggregated logs
- API status

### Documentation Generator
```bash
~/.claude/vibe-machine/doc-generator.sh all
```
Auto-generates TypeScript, Python, API, and Architecture docs.

## File Structure

```
~/.claude/vibe-machine/
├── ai-orchestrator.sh       # Main orchestrator
├── deploy-orchestrator.sh   # Deployment system
├── api-tester.sh           # API testing suite
├── hot-reload.sh           # Auto-restart system
├── doc-generator.sh        # Documentation generator
└── aliases.zsh             # Intelligent aliases

~/.tmux.conf                 # tmux config (Zantara theme)
~/.config/zellij/
├── config.kdl               # zellij main config
└── layouts/zantara.kdl      # Zantara dev layout

~/.config/iterm2/
└── zantara-theme.itermcolors # Custom iTerm2 theme
```

## Keybindings

### tmux (Prefix: Ctrl+Space)
- `Ctrl+Space |` - Split vertical
- `Ctrl+Space -` - Split horizontal
- `Ctrl+Space h/j/k/l` - Navigate panes
- `Ctrl+Space r` - Reload config

### zellij (Prefix: Ctrl+Space)
- `Ctrl+Space |` - Split vertical
- `Ctrl+Space -` - Split horizontal
- `Ctrl+Space c` - New tab
- `Ctrl+Space n/p` - Next/Previous tab

## Fonts Installed
- ✅ JetBrains Mono (recommended)
- ✅ Fira Code
- ✅ Cascadia Code
- ✅ Hack
- ✅ Source Code Pro

## Tools Installed
- tmux 3.5a (terminal multiplexer)
- zellij 0.43.1 (modern workspace)
- btop 1.4.5 (system monitor)
- ripgrep 15.1.0 (fast grep)
- fd 10.3.0 (fast find)
- fzf 0.66.1 (fuzzy finder)
- bat 0.26.0 (better cat)
- eza 0.23.4 (better ls)

## Environment Variables
Add to `~/.zshrc`:
```bash
# ZANTARA VIBE MACHINE
source ~/.claude/vibe-machine/aliases.zsh

# AI Providers (optional)
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-..."
export GEMINI_API_KEY="..."

# Cloud Platforms
export FLY_API_TOKEN="..."
export RAILWAY_TOKEN="..."
export GITHUB_TOKEN="..."
```

## Troubleshooting

### tmux plugins not working
```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
tmux source ~/.tmux.conf
# Press Prefix + I to install plugins
```

### Fonts not showing in iTerm2
1. Open iTerm2 → Preferences → Profiles → Text
2. Change Font to "JetBrains Mono"
3. Enable ligatures (optional)

### Commands not found
```bash
source ~/.zshrc
vibe-status  # Check what's missing
```

## Performance Metrics

### Deployment Times
- RAG Backend: ~2-3 minutes (Fly.io)
- TS Backend: ~1-2 minutes (Railway)
- Webapp: ~30 seconds (GitHub Pages)

### API Latency
- RAG Chat: ~3.7s (includes AI processing)
- TS Backend: ~270ms
- Health checks: <100ms

## Future Enhancements
- [ ] Auto-sync ChromaDB on schedule
- [ ] Telegram bot integration
- [ ] Voice commands via Whisper
- [ ] Auto-generated test suites
- [ ] Performance profiling dashboard
- [ ] Multi-language support (Italian, English, Indonesian)

## Credits
Built with ❤️ by Claude Opus for ZANTARA/Bali Zero

