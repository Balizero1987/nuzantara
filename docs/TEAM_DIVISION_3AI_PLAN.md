# 👥 3-Team Division Plan: Triple-AI Implementation
## Specialist Teams for Claude, Llama, DevAI

**Strategy**: Divide et impera - Ogni team si specializza su un'AI
**Timeline**: 2 settimane parallele invece di 4 settimane sequenziali
**Efficiency**: 2x faster, 3x expertise

---

## 🎯 TEAM STRUCTURE

```
┌────────────────────────────────────────────────────────────┐
│                   PROJECT COORDINATOR                      │
│              (Antonello - Orchestra tutto)                 │
└───────────┬──────────────────┬──────────────────┬──────────┘
            │                  │                  │
    ┌───────▼──────┐   ┌───────▼──────┐   ┌─────▼────────┐
    │   TEAM A:    │   │   TEAM B:    │   │   TEAM C:    │
    │   CLAUDE     │   │   LLAMA      │   │   DEVAI      │
    │              │   │              │   │              │
    │ Focus:       │   │ Focus:       │   │ Focus:       │
    │ Conversazioni│   │ Routing+RAG  │   │ Code Quality │
    └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 👤 TEAM A: Claude Integration Team

### 👨‍💻 Team Lead
**Developer A** (o Claude Sonnet 4.5 se solo tu)

### 🎯 Mission
Integrare Claude API per conversazioni naturali e tool use

### 📦 Deliverables

**Week 1**:
- [x] Anthropic API key setup
- [x] `claude_service.py` implementation
- [x] Basic conversational endpoint (`/chat-claude`)
- [x] ZANTARA personality tuning
- [x] Test suite (greetings, casual, business)

**Week 2**:
- [ ] Tool use integration (email, calendar, memory handlers)
- [ ] Multi-turn conversation support
- [ ] Context injection from Llama RAG
- [ ] Cost tracking & optimization
- [ ] Streaming responses (SSE)

### 📄 Files to Create/Modify

```
apps/backend-rag 2/backend/
├── app/services/
│   ├── claude_service.py          ← CREATE
│   └── claude_tools.py             ← CREATE (tool use logic)
│
├── tests/
│   ├── test_claude_service.py      ← CREATE
│   └── test_claude_tools.py        ← CREATE
│
└── app/main_cloud.py               ← MODIFY (add /chat-claude endpoint)
```

### 🔧 Tech Stack
- **Language**: Python 3.11
- **SDK**: `anthropic>=0.7.0`
- **Testing**: pytest + async fixtures
- **Monitoring**: Token tracking, cost per request

### 📊 Success Metrics
- Greeting quality: 95%+ (emoji, brevity, warmth)
- Latency: < 1s for simple, < 3s for complex
- Cost: < $0.005 per request
- Tool use: 90%+ success rate

---

## 🤖 TEAM B: Llama Gatekeeper Team

### 👨‍💻 Team Lead
**Developer B** (o altro Claude instance)

### 🎯 Mission
Implementare routing intelligente e RAG orchestration

### 📦 Deliverables

**Week 1**:
- [x] `llama_gatekeeper.py` (intent classification)
- [x] `intelligent_router.py` (routing logic)
- [x] Keyword-based intent detection
- [x] Basic routing (greeting → Claude, business → Llama)
- [x] Metrics tracking

**Week 2**:
- [ ] RAG search & compression (ChromaDB → context for Claude)
- [ ] Cross-encoder reranking integration
- [ ] Context enrichment (user memory + conversation history)
- [ ] Structured JSON output (Llama-only route)
- [ ] ML-based intent classifier (fine-tune Llama)

### 📄 Files to Create/Modify

```
apps/backend-rag 2/backend/
├── app/services/
│   ├── llama_gatekeeper.py        ← CREATE
│   ├── intelligent_router.py      ← CREATE
│   ├── rag_orchestrator.py        ← CREATE (RAG logic)
│   └── context_compressor.py      ← CREATE (3K→500 tokens)
│
├── tests/
│   ├── test_intent_classification.py  ← CREATE
│   ├── test_routing.py                ← CREATE
│   └── test_rag_orchestration.py      ← CREATE
│
└── app/main_cloud.py               ← MODIFY (add /chat-hybrid endpoint)
```

### 🔧 Tech Stack
- **Language**: Python 3.11
- **Models**: Llama 3.1 8B (RunPod), Cross-encoder reranker
- **Database**: ChromaDB (7.3K docs)
- **Testing**: pytest + mock ChromaDB

### 📊 Success Metrics
- Intent accuracy: 90%+ (keyword), 95%+ (ML-based)
- Routing latency: < 0.2s
- RAG quality: 85%+ precision@3
- Context compression: 3K → 500 tokens (85% reduction)

---

## 💻 TEAM C: DevAI Optimization Team

### 👨‍💻 Team Lead
**Developer C** (o Qwen stesso 😄)

### 🎯 Mission
Stabilizzare DevAI, integrare nel router, setup automation

### 📦 Deliverables

**Week 1**:
- [ ] ✅ **PRIORITY**: Restart RunPod workers (BLOCKING!)
- [ ] Verify all 7 DevAI tasks working (chat, analyze, fix, review, etc.)
- [ ] Add `code` intent to router
- [ ] Internal user authentication check
- [ ] Basic DevAI dashboard (usage stats)

**Week 2**:
- [ ] GitHub Actions integration (auto PR review)
- [ ] Daily health check automation (cron)
- [ ] Watch mode (file changes → auto analysis)
- [ ] Bug auto-fix workflow
- [ ] DevAI metrics & cost tracking

### 📄 Files to Create/Modify

```
apps/backend-rag 2/backend/
├── app/services/
│   └── devai_router.py             ← CREATE (DevAI-specific routing)
│
├── tests/
│   └── test_devai_integration.py   ← CREATE
│
src/handlers/devai/
└── devai-qwen.ts                   ← EXISTING (no changes needed ✅)

.github/workflows/
├── devai-pr-review.yml             ← CREATE
└── devai-daily-check.yml           ← CREATE

scripts/
├── devai-watch.ts                  ← CREATE (watch mode)
├── devai-health-check.ts           ← CREATE (daily check)
└── devai-dashboard.ts              ← CREATE (usage stats)
```

### 🔧 Tech Stack
- **Language**: TypeScript (existing handler) + Python (router)
- **Model**: Qwen 2.5 Coder 7B (RunPod)
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom dashboard + Slack notifications

### 📊 Success Metrics
- Worker uptime: 99%+
- Code analysis latency: < 3s (warm), < 10s (cold)
- Bug detection accuracy: 85%+
- Auto-fix success: 70%+ (high confidence bugs)
- PR review automation: 100% coverage

---

## 🔗 INTEGRATION POINTS

### Week 1 Integration (End of Week)

**Friday Team Sync**:
1. **Team A** demos Claude endpoint → Router
2. **Team B** demos intent routing → Claude/Llama
3. **Team C** demos DevAI working → Router

**Integration Test**:
```python
# Test all 3 AIs working together

# 1. Greeting → Claude
response = router.route_chat("Ciao!", "user1")
assert response['route'] == 'claude_direct'
assert response['model'] == 'claude-3.5-sonnet'

# 2. Business → Llama RAG + Claude
response = router.route_chat("What is KITAS?", "user1")
assert response['route'] == 'hybrid_rag_claude'
assert 'context' in response

# 3. Code → DevAI
response = router.route_chat("Fix this bug in router.ts", "internal_dev")
assert response['route'] == 'devai'
assert response['model'] == 'devai-qwen'
```

---

### Week 2 Integration (Production Deploy)

**Monday**: Merge all branches
**Tuesday**: Integration testing
**Wednesday**: Staging deploy (10% traffic)
**Thursday**: Monitor metrics, fix bugs
**Friday**: Production deploy (100% traffic) 🚀

---

## 📅 DAILY STANDUPS (15 min)

### Format
```
Team A (Claude):
  ✅ Yesterday: [completed]
  🏃 Today: [working on]
  ⚠️  Blockers: [if any]

Team B (Llama):
  ✅ Yesterday: [completed]
  🏃 Today: [working on]
  ⚠️  Blockers: [if any]

Team C (DevAI):
  ✅ Yesterday: [completed]
  🏃 Today: [working on]
  ⚠️  Blockers: [if any]
```

### Communication
- **Slack Channel**: #triple-ai-implementation
- **Shared Docs**: Google Docs per architecture decisions
- **Code Review**: GitHub PR reviews cross-team
- **Bug Tracking**: GitHub Issues con labels `team-a`, `team-b`, `team-c`

---

## 🛠️ SHARED INFRASTRUCTURE

### Common Services (All Teams Use)

```python
# Shared metrics collector
class MetricsCollector:
    """Track metrics across all AIs"""

    async def track(self, event: dict):
        """
        event = {
            'team': 'claude' | 'llama' | 'devai',
            'route': str,
            'latency': float,
            'tokens': int,
            'cost': float,
            'user_id': str,
            'success': bool
        }
        """
        # Store in database for analytics
        pass

# Shared logger
import logging
logger = logging.getLogger('triple-ai')

# Shared config
class Config:
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    RUNPOD_LLAMA_ENDPOINT = os.getenv("RUNPOD_LLAMA_ENDPOINT")
    RUNPOD_QWEN_ENDPOINT = os.getenv("RUNPOD_QWEN_ENDPOINT")
    RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
```

---

## 🔒 ACCESS CONTROL

### API Keys & Secrets

**Team A (Claude)**:
- Needs: `ANTHROPIC_API_KEY`
- Access: Antonello provides key
- Cost limit: $50/month (Anthropic billing)

**Team B (Llama)**:
- Needs: `RUNPOD_API_KEY`, `RUNPOD_LLAMA_ENDPOINT`
- Access: Existing (already configured)
- Cost: €2-8/month (already paid)

**Team C (DevAI)**:
- Needs: `RUNPOD_API_KEY`, `RUNPOD_QWEN_ENDPOINT`
- Access: Existing (already configured)
- Cost: €1-3/month (already paid)
- **⚠️ CRITICAL**: Restart RunPod workers FIRST!

### Deployment Access

All teams need:
- Google Cloud Run deploy permissions
- GitHub repository write access
- Secret Manager read access (for API keys)

---

## 🧪 TESTING STRATEGY

### Unit Tests (Each Team)

**Team A (Claude)**:
```bash
pytest tests/test_claude_service.py -v
pytest tests/test_claude_tools.py -v
```

**Team B (Llama)**:
```bash
pytest tests/test_intent_classification.py -v
pytest tests/test_routing.py -v
pytest tests/test_rag_orchestration.py -v
```

**Team C (DevAI)**:
```bash
pytest tests/test_devai_integration.py -v
npm test -- devai  # TypeScript tests
```

### Integration Tests (All Teams)

```bash
# End-to-end test suite
pytest tests/integration/test_triple_ai.py -v

# Test all routes
pytest tests/integration/test_all_routes.py -v

# Load test
locust -f tests/load/locustfile.py --users 100
```

---

## 📊 SHARED DASHBOARD

### Metrics to Track (Real-time)

```
┌─────────────────── TRIPLE-AI DASHBOARD ───────────────────┐
│                                                            │
│  Requests Today: 1,247                                     │
│                                                            │
│  CLAUDE:     523 requests  (42%)  [$2.13]  Avg: 0.8s     │
│  LLAMA:      624 requests  (50%)  [€0.00]  Avg: 0.3s     │
│  DEVAI:       45 requests  (3%)   [€0.00]  Avg: 2.1s     │
│  HYBRID:      55 requests  (4%)   [$0.28]  Avg: 1.9s     │
│                                                            │
│  Quality Score: 91%  ✅                                    │
│  Avg Latency:   1.2s ✅                                    │
│  Cost Today:    $2.41 ✅                                   │
│                                                            │
│  Top Routes:                                               │
│  1. claude_direct        523 (greeting, casual)           │
│  2. hybrid_rag_claude    55 (business questions)          │
│  3. devai                45 (code analysis)               │
│  4. llama_json           24 (structured output)           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🚨 RISK MANAGEMENT

### Blocker Scenarios & Escalation

**Scenario 1**: Team A blocked by Anthropic API key issue
- **Escalation**: Antonello gets key immediately
- **Fallback**: Team A helps Team B with RAG while waiting

**Scenario 2**: Team C blocked by DevAI worker stuck
- **Escalation**: Restart RunPod workers (user action)
- **Fallback**: Team C works on GitHub Actions integration offline

**Scenario 3**: Integration issues between teams
- **Escalation**: Daily sync moved to Slack call
- **Fallback**: Interface contracts defined in shared doc

**Scenario 4**: One team falls behind schedule
- **Escalation**: Other teams provide 1 hour/day support
- **Fallback**: MVP scope reduced (defer Week 2 features)

---

## 🎯 DECISION AUTHORITY

### Who Decides What

**Architecture Decisions** → Antonello (Project Coordinator)
- API contracts between services
- Deployment strategy
- Cost limits

**Implementation Details** → Team Leads
- Code structure within their service
- Testing approach
- Performance optimizations

**Integration Points** → Consensus (Team Sync)
- Shared interfaces
- Error handling strategy
- Metrics format

---

## 📝 DOCUMENTATION OWNERSHIP

### Team A (Claude)
- `CLAUDE_INTEGRATION_GUIDE.md`
- `CLAUDE_TOOL_USE_GUIDE.md`
- Claude service code comments

### Team B (Llama)
- `LLAMA_ROUTING_GUIDE.md`
- `RAG_ORCHESTRATION_GUIDE.md`
- Router service code comments

### Team C (DevAI)
- `DEVAI_USAGE_GUIDE.md`
- `DEVAI_AUTOMATION_GUIDE.md`
- DevAI handler code comments

### Shared
- `TRIPLE_AI_ARCHITECTURE_COMPLETE.md` (already exists ✅)
- `API_CONTRACTS.md` (to create)
- `DEPLOYMENT_GUIDE.md` (to create)

---

## 🏁 WEEK 1 FRIDAY DEMO

### Demo Script (30 min)

**5 min - Team A Demo**:
```bash
# Show Claude responding naturally to greetings
curl /chat-claude -d '{"query": "Ciao!"}'
# → "Ciao! 😊 Come posso aiutarti oggi?"

# Show emojis, brevity, warmth
```

**5 min - Team B Demo**:
```bash
# Show intent classification working
curl /classify-intent -d '{"query": "Ciao!"}'
# → {"category": "greeting", "route": "claude_direct"}

# Show routing decision logic
```

**5 min - Team C Demo**:
```bash
# Show DevAI analyzing code
curl /devai -d '{"task": "analyze", "code": "..."}'
# → Bug report with fixes

# Show worker health status
```

**10 min - Integration Demo**:
```bash
# Show /chat-hybrid routing to all 3 AIs
curl /chat-hybrid -d '{"query": "Ciao!"}'       # → Claude
curl /chat-hybrid -d '{"query": "What is KITAS?"}' # → Llama RAG + Claude
curl /chat-hybrid -d '{"query": "Fix this bug"}' # → DevAI (if internal user)
```

**5 min - Metrics Demo**:
```bash
# Show dashboard with all 3 AIs working
open http://localhost:3000/dashboard
```

---

## ✅ FINAL DELIVERABLE (Week 2 Friday)

### Production-Ready System

```bash
# Single endpoint, intelligent routing to 3 AIs
curl -X POST https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat-hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "Ciao!", "user_id": "user123"}'

# Response:
{
  "success": true,
  "answer": "Ciao! 😊 Come posso aiutarti oggi?",
  "model": "claude-3.5-sonnet",
  "route": "claude_direct",
  "intent": "greeting",
  "latency": 0.623,
  "cost": 0.000594,
  "metadata": {
    "tokens": 33,
    "confidence": 0.98,
    "team": "claude"
  }
}
```

### Success Criteria ✅

- [ ] All 3 AIs integrated and working
- [ ] Intent routing 90%+ accuracy
- [ ] Quality score 90%+ (greetings, business, code)
- [ ] Latency < 2s for 95% of requests
- [ ] Cost < $20/month for 3000 requests
- [ ] DevAI automation working (PR reviews, daily checks)
- [ ] Documentation complete
- [ ] Test coverage 80%+
- [ ] Production deployed and stable

---

## 🎉 CELEBRATION

When all 3 teams deliver:

```
     🎉 TRIPLE-AI SYSTEM COMPLETE! 🎉

     CLAUDE ✅  LLAMA ✅  DEVAI ✅

     Users: Happy 😊
     Developers: Productive 💻
     Codebase: Healthy 🏥
     Cost: Optimized 💰

     From Zero to Infinity ∞ 🚀
```

---

## 📞 TEAM CONTACTS

**Project Coordinator**:
- Antonello: antonello@balizero.com

**Team Leads**:
- Team A (Claude): [Developer A email]
- Team B (Llama): [Developer B email]
- Team C (DevAI): [Developer C email]

**Slack**: #triple-ai-implementation

**GitHub**: https://github.com/Balizero1987/nuzantara

---

**Ready to start?** Assign teams and let's build! 🚀

**First Action** (CRITICAL): Team C must restart DevAI RunPod workers IMMEDIATELY!

---

*Document Version: 1.0*
*Created: 2025-10-14 11:30*
*Author: Claude Sonnet 4.5 (m8)*
