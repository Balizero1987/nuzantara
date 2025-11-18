# 🤖 Autonomous Agents - NUZANTARA

**Tier 1 Autonomous Agents** for the NUZANTARA platform, providing self-directed AI capabilities that learn, improve, and maintain the system automatically.

## 📋 Available Agents

### 1. 🕸️ Knowledge Graph Builder

**Purpose:** Automatically extracts entities and relationships from all conversations to build a comprehensive knowledge graph.

**Capabilities:**
- Extracts entities: laws, topics, companies, people, locations, practice types
- Identifies relationships between entities (relates_to, requires, conflicts_with, governed_by)
- Maintains PostgreSQL-based knowledge graph
- Provides semantic search across all extracted knowledge
- Generates insights on most-mentioned topics and connection hubs

**Schedule:** Daily at 4 AM
**API:** `POST /api/autonomous-agents/knowledge-graph-builder/run`
**Model:** Claude 3.5 Haiku (entity extraction + relationship mapping)

**Database Tables:**
- `kg_entities` - All extracted entities with types and metadata
- `kg_relationships` - Connections between entities with evidence
- `kg_entity_mentions` - Source references for each entity

---

### 2. 🤖 Conversation Trainer

**Purpose:** Learns from successful conversations and automatically improves system prompts.

**Capabilities:**
- Analyzes high-rated conversations (rating ≥ 4)
- Extracts successful patterns and key phrases
- Generates improved prompt suggestions with AI
- Creates GitHub PRs with prompt improvements
- Notifies team via Slack (if configured)

**Schedule:** Weekly Sunday at 4 AM
**API:** `POST /api/autonomous-agents/conversation-trainer/run`
**Model:** Claude 3.5 Sonnet (pattern analysis + prompt generation)

**Requirements:**
- `GITHUB_TOKEN` - For creating PRs
- `SLACK_WEBHOOK_URL` - Optional, for notifications

**Output:**
- Automated GitHub PR with prompt improvements
- Analysis report in `reports/conversation-analysis-{date}.md`

---

### 3. 💰 Client Value Predictor

**Purpose:** Predicts client lifetime value and sends personalized nurturing messages.

**Capabilities:**
- Calculates LTV scores based on engagement, sentiment, recency
- Segments clients: VIP, HIGH_VALUE, MEDIUM_VALUE, LOW_VALUE
- Identifies at-risk high-value clients
- Auto-generates personalized WhatsApp messages with AI
- Sends via Twilio

**Schedule:** Daily at 10 AM
**API:** `POST /api/autonomous-agents/client-value-predictor/run`
**Model:** Claude 3.5 Haiku (message generation)

**Requirements:**
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`

**Status:** ⚠️ Disabled by default (requires Twilio configuration)

---

## 🚀 Quick Start

### 1. Initialize Knowledge Graph Schema

First time setup:

```bash
cd apps/backend-rag
DATABASE_URL="postgresql://..." python scripts/init_knowledge_graph.py
```

This creates the required PostgreSQL tables.

### 2. Test Agents via HTTP API

Start the backend server:

```bash
cd apps/backend-rag
uvicorn backend.app.main_cloud:app --reload --port 8000
```

Test endpoints:

```bash
# Get agent status
curl http://localhost:8000/api/autonomous-agents/status

# Run Knowledge Graph Builder (processes last 30 days)
curl -X POST "http://localhost:8000/api/autonomous-agents/knowledge-graph-builder/run?days_back=30"

# Run Conversation Trainer (analyzes last 7 days)
curl -X POST "http://localhost:8000/api/autonomous-agents/conversation-trainer/run?days_back=7"

# Check execution status
curl http://localhost:8000/api/autonomous-agents/executions
```

Or use the test script:

```bash
./scripts/test_autonomous_agents.sh
```

### 3. Setup Automated Scheduling

Run the scheduler as a background service:

```bash
# Run scheduler (blocks indefinitely)
DATABASE_URL="..." ANTHROPIC_API_KEY="..." python scripts/autonomous_agents_scheduler.py

# Or test a specific agent once
python scripts/autonomous_agents_scheduler.py --agent knowledge_graph
python scripts/autonomous_agents_scheduler.py --agent conversation_trainer
```

**Schedule:**
- **Knowledge Graph Builder:** Daily at 4 AM
- **Conversation Trainer:** Weekly Sunday at 4 AM
- **Client Value Predictor:** Daily at 10 AM (disabled, requires Twilio)

---

## 📊 Monitoring

### Check Agent Status

```bash
curl http://localhost:8000/api/autonomous-agents/status
```

Returns:
```json
{
  "success": true,
  "tier": 1,
  "total_agents": 3,
  "agents": [
    {
      "id": "knowledge_graph_builder",
      "name": "Knowledge Graph Builder",
      "schedule": "Daily (4 AM)",
      "priority": 7
    },
    ...
  ]
}
```

### View Execution History

```bash
# List recent executions
curl http://localhost:8000/api/autonomous-agents/executions?limit=10

# Get specific execution details
curl http://localhost:8000/api/autonomous-agents/executions/{execution_id}
```

### Query Knowledge Graph

After Knowledge Graph Builder runs:

```python
from agents.knowledge_graph_builder import KnowledgeGraphBuilder

builder = KnowledgeGraphBuilder()

# Get insights
insights = await builder.get_entity_insights(top_n=20)
print(insights['top_entities'])
print(insights['hubs'])

# Search entities
results = await builder.semantic_search_entities("investment license", top_k=10)
```

---

## 🔧 Configuration

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Anthropic API key

Optional:
- `GITHUB_TOKEN` - For Conversation Trainer PR creation
- `SLACK_WEBHOOK_URL` - For notifications
- `TWILIO_ACCOUNT_SID` - For Client Value Predictor
- `TWILIO_AUTH_TOKEN` - For Client Value Predictor
- `TWILIO_WHATSAPP_NUMBER` - For Client Value Predictor

### Customizing Schedules

Edit `scripts/autonomous_agents_scheduler.py`:

```python
# Change Knowledge Graph Builder to run every 6 hours
self.daily_schedule(
    self.run_knowledge_graph_builder,
    time(0, 0),  # Midnight
    "Knowledge Graph Builder"
)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  HTTP API Layer                             │
│  /api/autonomous-agents/*                   │
│  (FastAPI BackgroundTasks)                  │
├─────────────────────────────────────────────┤
│  Agent Implementations                      │
│  ├─ KnowledgeGraphBuilder                   │
│  ├─ ConversationTrainer                     │
│  └─ ClientValuePredictor                    │
├─────────────────────────────────────────────┤
│  Storage & AI                               │
│  ├─ PostgreSQL (knowledge graph)            │
│  ├─ Claude 3.5 Haiku (extraction)           │
│  └─ Claude 3.5 Sonnet (analysis)            │
└─────────────────────────────────────────────┘
```

**Agent Execution Flow:**
1. HTTP request triggers agent via `/api/autonomous-agents/{agent}/run`
2. Router creates execution record and returns immediately
3. Agent runs in background (FastAPI BackgroundTasks)
4. Results stored in `agent_executions` dict
5. Status queryable via `/api/autonomous-agents/executions/{id}`

**Scheduler Flow:**
1. `autonomous_agents_scheduler.py` runs as background service
2. Uses `asyncio.sleep()` to wait for scheduled times
3. Calls agent functions directly (not via HTTP)
4. Logs results to stdout/logs

---

## 🧪 Testing

### Unit Tests

```bash
cd apps/backend-rag
pytest backend/agents/tests/
```

### Integration Tests

```bash
# Test with local server
./scripts/test_autonomous_agents.sh http://localhost:8000

# Test production
./scripts/test_autonomous_agents.sh https://nuzantara-rag.fly.dev
```

---

## 📈 Performance

**Knowledge Graph Builder:**
- 100 conversations: ~2-3 minutes
- 1000 conversations: ~20-30 minutes
- Uses batch processing with Claude API
- Database indexes optimize queries

**Conversation Trainer:**
- Analyzes top 50 conversations
- Generates 1 GitHub PR
- Runtime: ~5-10 minutes

**Client Value Predictor:**
- Processes all clients in database
- Sends WhatsApp messages to VIP + at-risk
- Runtime: ~5-15 minutes (depends on client count)

---

## 🐛 Troubleshooting

### Agent fails with "No module named 'agents'"

Ensure `agents/` is not in `.gitignore` and directory exists:

```bash
ls -la apps/backend-rag/backend/agents/
```

### Database connection errors

Check `DATABASE_URL`:

```bash
python -c "import os; print(os.getenv('DATABASE_URL'))"
```

### GitHub PR creation fails

Conversation Trainer requires `GITHUB_TOKEN`:

```bash
export GITHUB_TOKEN="ghp_..."
```

### Knowledge Graph schema not found

Initialize schema first:

```bash
python scripts/init_knowledge_graph.py
```

---

## 🚢 Deployment

### Fly.io

Agents run automatically when backend-rag is deployed:

1. **HTTP Endpoints:** Always available at `/api/autonomous-agents/*`
2. **Scheduler:** Deploy as separate Fly.io app or use cron

**Option 1: Separate Scheduler App**

```bash
# Create new Fly.io app for scheduler
cd apps/backend-rag
fly apps create nuzantara-agent-scheduler

# Add to fly.toml
[[services]]
  internal_port = 8080
  processes = ["scheduler"]

# Deploy
fly deploy --config fly-scheduler.toml
```

**Option 2: System Cron (on VM)**

```bash
# Add to crontab
0 4 * * * /path/to/python scripts/autonomous_agents_scheduler.py --agent knowledge_graph
0 4 * * 0 /path/to/python scripts/autonomous_agents_scheduler.py --agent conversation_trainer
```

---

## 📝 Future Enhancements

- [ ] Add more relationship types to knowledge graph
- [ ] Implement A/B testing for prompt improvements
- [ ] Real-time client scoring with WebSocket updates
- [ ] Auto-scaling based on conversation volume
- [ ] Machine learning for LTV prediction (replace heuristics)
- [ ] Multi-language support for entity extraction
- [ ] Graph visualization dashboard

---

## 🤝 Contributing

When adding new agents:

1. Create agent class in `backend/agents/{agent_name}.py`
2. Add HTTP endpoints in `backend/app/routers/autonomous_agents.py`
3. Add schedule to `scripts/autonomous_agents_scheduler.py`
4. Update this README
5. Add tests in `backend/agents/tests/`

---

## 📄 License

MIT License - Part of NUZANTARA Platform

---

**Last Updated:** 2025-11-18
**Maintainer:** NUZANTARA Team
**Status:** ✅ Production Ready
