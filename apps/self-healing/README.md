# 🤖 ZANTARA Self-Healing System

## Overview
Sistema autonomo di auto-diagnosi e auto-riparazione per l'intero ecosistema ZANTARA.

## Architecture

```
CENTRAL ORCHESTRATOR (Fly.io)
├── Frontend Agent (Browser-based)
│   ├── Console Monitor
│   ├── Network Monitor
│   ├── UI Error Detector
│   └── Performance Tracker
│
├── Backend Agents (Service-based)
│   ├── RAG Health Monitor
│   ├── Memory Service Monitor
│   ├── Database Monitor
│   └── API Gateway Monitor
│
└── AI Decision Engine (GPT-4)
    ├── Error Classification
    ├── Fix Strategy Selection
    ├── Auto-Apply or Escalate
    └── Learning from Past Fixes
```

## Components

### 1. Frontend Agent (`frontend-agent.js`)
- Runs in browser
- Monitors console errors, network failures, UI issues
- Attempts local fixes (reload, retry, fallback)
- Reports to orchestrator if can't fix

### 2. Backend Agents (`backend-agent.py`)
- Runs on each Fly.io service
- Health checks every 30s
- Auto-restart unhealthy services
- Reports metrics to orchestrator

### 3. Central Orchestrator (`orchestrator.py`)
- Receives all error reports
- AI-powered decision making
- Coordinates fixes across services
- Learns from patterns

### 4. Auto-Fix Library (`auto-fix-strategies.js`)
- Pre-defined fix patterns
- Success rate tracking
- Automatic rollback on failure

## Deployment

```bash
# Central Orchestrator
cd apps/self-healing
fly deploy -a nuzantara-orchestrator

# Backend Agents (auto-included in each service)
# Frontend Agent (auto-loaded in webapp)
```

## Error Types & Auto-Fix Strategies

| Error Type | Detection | Auto-Fix Strategy | Escalation |
|------------|-----------|-------------------|------------|
| JS Import Error | Console | Convert to module | If module conflict |
| Syntax Error | Console | Auto-format code | If can't parse |
| 404 File | Network | Comment import | If critical file |
| 500 API Error | Network | Retry 3x + fallback | If persistent |
| Service Down | Health Check | Auto-restart | If restart fails |
| DB Connection | Backend | Reconnect pool | If pool exhausted |
| Memory Leak | Metrics | Trigger GC + restart | If OOM imminent |

## Agent Communication Protocol

```json
{
  "error": {
    "id": "uuid",
    "timestamp": "ISO8601",
    "source": "frontend|backend-rag|backend-memory",
    "type": "js-error|network|health|performance",
    "severity": "low|medium|high|critical",
    "data": {},
    "context": {}
  },
  "fix": {
    "strategy": "retry|reload|restart|patch",
    "auto_applied": true,
    "success": true,
    "rollback_available": true
  }
}
```

## AI Learning System

The orchestrator learns from:
1. Which fixes work for which errors
2. Error patterns across services
3. Time-of-day error trends
4. User impact metrics

## Dashboard

Real-time monitoring at: `https://health.zantara.balizero.com`

- Live error stream
- Fix success rates
- Service health map
- AI decision logs
