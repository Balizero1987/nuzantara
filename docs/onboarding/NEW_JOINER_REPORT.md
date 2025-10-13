# New Joiner Report (NJR)
Last Updated: 2025-10-10
Maintainer: Core Team

1) Start Here (15')
- Read: .claude/PROJECT_CONTEXT.md, docs/onboarding/ORIENTATION_ONE_PAGER.md
- Health checks:
  - TS: GET https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health
  - RAG: GET https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
  - Expected: {"status":"ok"|"healthy","version":"5.2.0"|"2.3.0-reranker", ...}

2) Architecture 101 (10')
- Request Flow:
  - User → WebApp (origin bypass auth) → POST /call → Handler Registry → External APIs
  - User → RAG /chat → ChromaDB search → Reranker → Tool executor → TS handlers
- Rate Limits: Bali Zero (20/min), AI Chat (30/min), RAG (15/min), Batch (5/min)
- Auth: Origin-based for webapp (https://zantara.balizero.com), API key for others

3) Capabilities (20')
Try these real handlers (curl examples):

Team & Organization
```bash
curl -s -X POST \
  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"team.list"}' | jq '.data.members | length'
# Expected: 23 team members
```

Pricing (official)
```bash
curl -s -X POST \
  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"pricing.official","params":{"service_type":"visa","include_details":true}}' | jq '.ok'
```

Memory System
```bash
# Save
curl -s -X POST \
  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"memory.save","params":{"userId":"onboarding_test","content":"Prefers morning meetings"}}'
# Retrieve
curl -s -X POST \
  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"memory.retrieve","params":{"userId":"onboarding_test"}}' | jq '.ok'
```

RAG Chat (tool-use)
Preferred (normalized via TS handler):
```bash
curl -s -X POST \
  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-internal-dev-key-2025' \
  -d '{"key":"bali.zero.chat","params":{"query":"What is the team size?"}}' | jq '.data.response'
```
Direct RAG (for debugging only): may return empty `response` depending on upstream model routing.
```bash
curl -s -X POST \
  https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{"query":"What is the team size?","user_id":"test"}' | jq '.response'
```

4) First 3 Tasks (30')
- T1: Hit 5 handlers via WebApp (Explorer) → verify p95 < 3.5s
  - team.list, pricing.official, bali.zero.pricing, memory.save, memory.retrieve
- T2: Save+retrieve a memory (userId) → verify content matches
  - Use userId: "onboarding_test_<your_name>"
- T3: RAG chat with citations → verify at least 1 tool-call executed
  - Ask: "Chi sono i membri del team?" or "What are Bali Zero pricing options?"

5) Pitfalls & Troubleshooting (10')
Common Errors
- handler_not_found: Check key spelling (e.g., "team.list" not "teamList")
- 401 Unauthorized: Add x-api-key header or use webapp origin
- 429 Too Many Requests: Rate limit hit; wait 60 seconds or use internal API key
- CORS error: Frontend origin not whitelisted (should be zantara.balizero.com)
- Param naming mismatch: Use camelCase (userId, serviceType, includeDetails).
  Exceptions (legacy): pricing.official expects snake_case (service_type, include_details).

Logs
- Cloud Run: gcloud logging read 'resource.type="cloud_run_revision"' --limit 50
- GitHub Actions: gh run list --limit 5

How to open PR
- Branch: git checkout -b feature/your-feature
- Commit: feat:/fix:/docs: conventional commits
- Push: git push origin feature/your-feature
- PR: gh pr create --title "feat: your feature" --body "Description"

6) Glossary & Contacts
Roles
- Handler: Business logic unit (e.g., team.list, pricing.official)
- Tool: Handler exposed for AI tool use (live: 164/164)
- RAG Backend: Python FastAPI service for retrieval + AI chat
- TS Backend: Node.js Express service for handlers + routing

Environments
- Production: Cloud Run (europe-west1)
- Staging: N/A (deploy to prod via GitHub Actions)
- Local: npm run dev (port 8080), uvicorn (port 8000)

Naming Conventions
- Handler keys: category.action (e.g., team.list, memory.save)
- Params: camelCase (userId, serviceType, includeDetails)
- Files: kebab-case (team-handlers.ts, pricing-service.ts)
