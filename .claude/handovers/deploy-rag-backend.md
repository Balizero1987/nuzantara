# Handover: deploy-rag-backend

## Latest Updates

### 2025-10-08 05:40 (Tool Use Loop Prevention) [sonnet-4.5_m1]

**Changed**:
- File: `apps/backend-rag 2/backend/app/main_cloud.py:717-800`
- Feature: Prevent infinite tool use loops on exploratory queries

**Implementation**:
```python
# Track read-only handlers to prevent re-calling
read_only_handlers_called = set()

READ_ONLY_HANDLERS = {
    "system.handlers.list", "system.handlers.tools",
    "team.list", "team.get", "team.departments", "team.recent_activity",
    "pricing.official", "pricing.get", "contact.info",
    "identity.resolve", "kbli.lookup", "kbli.requirements"
}

# Check for redundant calls
if redundant_calls:
    logger.warning(f"⚠️ AI attempting to re-call: {redundant_calls}")
    break  # Force stop

# After executing read-only handlers, hint AI to finalize
messages.append({
    "role": "user",
    "content": "Please provide your final answer. Do not call more tools."
})
```

**Problem Solved**:
- AI was looping on "Tell me about handlers" queries
- Would reach max_iterations (5) before responding
- Now stops after first read-only handler execution

**Testing**:
```bash
# Query that previously looped
curl -X POST https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"query": "tell me more about the team handlers", "user_id": "test"}' \
  | jq '.response'
# Expected: Response in 1-2 iterations (not 5)
```

**Deployment**:
- Commit: `8c889f8` (auto-deployed with backend)
- Note: RAG backend uses same main_cloud.py

**Related**:
→ Full session: [2025-10-08_sonnet-4.5_m1.md](../diaries/2025-10-08_sonnet-4.5_m1.md#rag-loop-fix)

---

### 2025-10-06 22:10 (Tool Use Integration Complete) [sonnet-4.5_m5]

**Changed**:
- RAG Backend: Tool execution ACTIVE
- Revision: `zantara-rag-backend-00102-cjs`
- Version: v2.5.0-tool-use-active
- Handler Proxy: Fixed endpoints (POST /call RPC format)

**Details**:
- File: `apps/backend-rag 2/backend/services/handler_proxy.py`
  - Fixed `get_anthropic_tools()`: GET /system.handlers.tools → POST /call {"key": "system.handlers.tools"}
  - Fixed `execute_handler()`: POST /system.handler.execute → POST /call {"key": handler_key, "params": params}
- TypeScript Backend URL: Updated to `https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app`
- Tools loaded: 41 (confirmed in logs: "🔧 Loaded 41 tools for AI")
- Tool execution: ✅ Working (logs: "🔌 Executing handler: team.list", "✅ Tool executed successfully")

**Tests Passed**:
1. ✅ Team list query → Executed `team_list` → 23 members returned
2. ✅ Pricing query → Executed `bali_zero_pricing` → 20M IDR returned

**Deployment**:
- GitHub Actions: deploy-rag-amd64.yml
- Run IDs: 18289885355, 18290478419
- Duration: 7m12s, 8m0s
- Commits: `d9f1c2c`, `6ddcf1f`

**Traffic Routing**:
- Manual routing required: `gcloud run services update-traffic zantara-rag-backend --region=europe-west1 --to-latest`
- Current: 100% on revision 00102-cjs

**Health Check**:
```bash
# Test tool execution
curl -X POST https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"query": "list all team members", "user_id": "test", "session_id": "test"}' \
  | jq '.response' | head -20
# Expected: AI executes team_list and returns 23 team members
```

**Related**:
→ Full session: [2025-10-06_sonnet-4.5_m5.md](../diaries/2025-10-06_sonnet-4.5_m5.md)
→ TypeScript backend tool use: [deploy-backend.md](deploy-backend.md#2025-10-06-2210)

---

### 2025-10-06 17:15 (ChromaDB Clean Re-ingestion + Deploy) [sonnet-4.5_m1]

**Changed**:
- ChromaDB: Complete re-ingestion from KB source (7,564 docs, 8 collections, 91.4 MiB)
- Uploaded to: `gs://nuzantara-chromadb-2025/chroma_db/`
- Deployed: Revision `zantara-rag-backend-00083-w8l`
- Collections: bali_zero_pricing (NEW), visa_oracle, kbli_eye, tax_genius, legal_architect, kb_indonesian, kbli_comprehensive, zantara_books

**Details**:
- Source KB: `/Users/antonellosiano/Desktop/KB/` (681 files)
- Dedicated `bali_zero_pricing` collection created (14 docs, priority routing)
- Contamination removed: 6 "Pricing Policy" docs + 9 pricing files relocated
- Results: +2,037% documents (354 → 7,564), +60% collections (5 → 8)
- Pricing accuracy: 50% → 70-80% (target 99.9% needs further work)

**Related**:
→ Full session: [2025-10-06_sonnet-4.5_m1.md](../diaries/2025-10-06_sonnet-4.5_m1.md)
→ Re-ingestion script: /tmp/chromadb_analysis/reingest_chromadb_clean.py

---

### 2025-10-03 20:30 (Deploy RAG v2.2-kitas-2025) [sonnet-4.5_m24]

**Changed**:
- zantara-rag-backend Cloud Run service - Deployed v2.2-kitas-2025 revision
- Docker image: gcr.io/involuted-box-469105-r0/zantara-rag-backend:v2.2-kitas-2025
- Environment variables: Updated CHROMADB_VERSION=1759493496
- Revision: zantara-rag-backend-v11-team (100% traffic)

**Details**:
- Built Docker image locally (2.33GB) after Cloud Build bucket access issue
- Pushed to GCR with tags :v2.2-kitas-2025 and :latest
- Deployed to europe-west1 with 2Gi memory, 2 CPU, 300s timeout
- ChromaDB now loads from GCS (gs://nuzantara-chromadb-2025/chroma_db/)
- Contains 229 docs in visa_oracle collection (+140 KITAS chunks from m23)

**E2E Tests** (3/3 passed):
- E23 Working KITAS requirements ✅
- E33G Digital Nomad visa info ✅
- E28A Investor KITAS requirements ✅

**Production URL**: https://zantara-rag-backend-1064094238013.europe-west1.run.app

**Related**:
→ Full session: [2025-10-03_sonnet-4.5_m24.md](../diaries/2025-10-03_sonnet-4.5_m24.md)
→ ChromaDB re-index: [2025-10-03_sonnet-4.5_m23.md](../diaries/2025-10-03_sonnet-4.5_m23.md)
→ KB Update Patch #2: [2025-10-03_sonnet-4.5_m22.md](../diaries/2025-10-03_sonnet-4.5_m22.md)

---

## Deployment Process

### Standard Deploy Flow:
1. Build: `docker build -f Dockerfile.cloud -t gcr.io/involuted-box-469105-r0/zantara-rag-backend:TAG .`
2. Push: `docker push gcr.io/involuted-box-469105-r0/zantara-rag-backend:TAG`
3. Deploy: `gcloud run deploy zantara-rag-backend --image=... --region=europe-west1`

### Key Configuration:
- **Port**: 8000
- **Memory**: 2Gi
- **CPU**: 2
- **Timeout**: 300s
- **Max Instances**: 3
- **Auth**: allow-unauthenticated

### Environment Variables:
- `ANTHROPIC_API_KEY`: From Secret Manager (CLAUDE_API_KEY)
- `GCS_BUCKET`: nuzantara-chromadb-2025
- `CHROMA_PATH`: chroma_db
- `CHROMADB_VERSION`: Timestamp (for cache busting)

### Entry Point:
- File: `app/main_cloud.py`
- Command: `uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000`

---

## ChromaDB Configuration

**Storage**: Google Cloud Storage (GCS)
- Bucket: `gs://nuzantara-chromadb-2025/`
- Path: `chroma_db/`
- Backup: `backup-2025-10-03_195717/`

**Collections** (5 active):
1. **visa_oracle**: 229 docs (immigration, KITAS guides)
2. **kbli_eye**: 53 docs (business classifications)
3. **tax_genius**: 29 docs (tax regulations)
4. **legal_architect**: 8 docs (legal frameworks)
5. **zantara_books**: 35 docs (general knowledge)

**Embedding Model**: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)

---

## Testing Endpoints

### Health Check:
```bash
curl https://zantara-rag-backend-1064094238013.europe-west1.run.app/health
```

### Chat Endpoint (Bali Zero):
```bash
curl -X POST "https://zantara-rag-backend-1064094238013.europe-west1.run.app/bali-zero/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"YOUR_QUERY","user_id":"test","user_role":"member"}'
```

### Test Queries (Known Good):
- "What are the requirements for E23 Working KITAS?"
- "What is E33G digital nomad visa Indonesia?"
- "E28A investor KITAS requirements 2025"
- "How do I migrate from C312 to E23 KITAS?"

---

## Known Issues

### Cloud Build Bucket Access:
- Issue: Cloud Build fails with "Requested entity was not found"
- Workaround: Use local Docker build + push to GCR
- Related: User account permissions (zero@balizero.com)

### /search Endpoint:
- Status: ⚠️ Broken (Pydantic validation error)
- Working: `/bali-zero/chat` endpoint ✅
- Location: `app/main_cloud.py:350-416`
- Impact: Direct search API unusable, chat API works fine

---

## Version History

| Version | Date | Revision | ChromaDB Docs | Notes |
|---------|------|----------|---------------|-------|
| v2.2-kitas-2025 | 2025-10-03 | v11-team | 229 (visa_oracle) | Added 140 KITAS chunks |
| v12-firestore | 2025-10-03 | v10 | - | Previous version |

---

## Related Files

**Dockerfile**: `zantara-rag/backend/Dockerfile.cloud`
**Main Entry**: `zantara-rag/backend/app/main_cloud.py`
**Requirements**: `zantara-rag/backend/requirements.txt`
**Deploy Script**: `zantara-rag/backend/deploy_cloud_run.sh`
**Cloud Build**: `zantara-rag/backend/cloudbuild.yaml` (not used due to bucket issue)

---

**Last Updated**: 2025-10-03 20:30 by m24 (sonnet-4.5)
