# 🤖 VIBE Swarm Agent

Multi-agent task executor for VIBE Dashboard.
Runs on Fly.io, executes tasks using browser automation + CLI tools.

## Architecture

```
Dashboard (localhost:3030)
    ↓ POST /execute
Swarm Agent (Fly.io)
    ↓
┌─────────────────────────────────┐
│ Agents:                         │
│ • Claude (browser automation)   │
│ • ChatGPT (browser automation)  │
│ • Copilot (gh CLI)              │
│ • Cursor (file system)          │
│ • Fly.io (GraphQL API)          │
└─────────────────────────────────┘
```

## Local Development

### 1. Install Dependencies

```bash
cd apps/swarm-agent
pip install -r requirements.txt
playwright install chromium
```

### 2. Set Environment Variables

```bash
export FLY_API_TOKEN="your-fly-token"
export WORKSPACE_ROOT="/path/to/workspace"
```

### 3. Run Server

```bash
python main.py
# Server runs on http://localhost:8080
```

### 4. Test Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Execute task
curl -X POST http://localhost:8080/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "flyio",
    "action": "deploy_to_production",
    "params": {},
    "priority": 1
  }'

# Get agent status
curl http://localhost:8080/agents/copilot/status
```

## Deploy to Fly.io

### 1. Login to Fly.io

```bash
fly auth login
```

### 2. Create App

```bash
fly apps create vibe-swarm-agent
```

### 3. Set Secrets

```bash
fly secrets set FLY_API_TOKEN="your-token"
```

### 4. Deploy

```bash
fly deploy
```

### 5. Check Status

```bash
fly status
fly logs
```

## Agents

### Claude Browser Agent

Uses Playwright to interact with claude.ai
- Actions: `generate_documentation`, `optimize_code`, `analyze_architecture`
- Requires: Browser session (cookies/login)

### ChatGPT Browser Agent

Uses Playwright to interact with chat.openai.com
- Actions: `research_topic`, `explain_concept`
- Requires: Browser session (cookies/login)

### Copilot CLI Agent

Uses `gh copilot` command
- Actions: `run_tests`, `suggest_code`, `explain_code`
- Requires: `gh` CLI installed with copilot extension

### Cursor Local Agent

File system operations
- Actions: `create_code`, `fix_bugs`, `refactor_code`, `execute_command`
- Requires: Write access to workspace

### Fly.io API Agent

GraphQL API for infrastructure
- Actions: `deploy_to_production`, `scale_app`, `get_status`
- Requires: FLY_API_TOKEN

## Configuration

### Environment Variables

```bash
# Required
FLY_API_TOKEN=your-fly-token

# Optional
PORT=8080
WORKSPACE_ROOT=/workspace
```

### Fly.io Resources

```toml
# fly.toml
cpu_kind = "shared"
cpus = 1
memory_mb = 512

# Scales to 0 when idle (free tier friendly)
auto_stop_machines = true
auto_start_machines = true
min_machines_running = 0
```

## Cost

**Fly.io Free Tier**:
- 3 shared-cpu-1x 256mb VMs
- 160GB outbound data transfer

**Estimated Cost**: $0-5/mo (likely free tier)

## Integration with Dashboard

Update dashboard `.env.local`:

```bash
SWARM_AGENT_URL=https://vibe-swarm-agent.fly.dev
```

Agent will be called automatically when tasks are executed.
Fallback to mock if agent is unavailable.

## Browser Automation Setup

For Claude and ChatGPT agents to work with your subscriptions:

### Option 1: Cookie Export (Recommended)

1. Login to Claude.ai/ChatGPT manually
2. Export cookies using browser extension
3. Load cookies in Playwright session

### Option 2: Persistent Browser Context

1. Run Playwright with `--headed` mode
2. Login manually once
3. Save browser context
4. Reuse in future sessions

## Troubleshooting

### Playwright Browser Not Found

```bash
playwright install chromium
```

### gh copilot Not Available

```bash
gh extension install github/gh-copilot
gh auth login
```

### Agent Returns Error

Check logs:
```bash
fly logs
```

Check agent status:
```bash
curl https://vibe-swarm-agent.fly.dev/agents/copilot/status
```
