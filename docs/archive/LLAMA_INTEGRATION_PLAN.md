# 🚀 LLAMA Integration Plan
**Step-by-Step Guide to Complete JIWA Architecture**

---

## 📋 Current Status Summary

### ✅ What Exists (70% Complete)

**Batch Processing Infrastructure:**
1. ✅ `llama_nightly_worker.py` - Main orchestrator for scheduled tasks
2. ✅ `cultural_knowledge_generator.py` - Generates 10 Indonesian cultural topics
3. ✅ `golden_answer_generator.py` - Creates FAQ answers with LLAMA + RAG
4. ✅ `query_analyzer.py` - Extracts queries from PostgreSQL conversations
5. ✅ `query_clustering.py` - Clusters similar queries using embeddings
6. ✅ `shadow_mode_service.py` - A/B testing LLAMA vs Claude
7. ✅ `zantara_client.py` - RunPod API client with SANTAI/PIKIRAN modes

**Database Schema:**
- ✅ `conversations` table - User interactions logged
- ✅ `nightly_worker_runs` table - Execution tracking
- ✅ `golden_answers` table - FAQ cache
- ✅ `cultural_knowledge` table - Indonesian insights

### ❌ What's Missing (30% to Complete)

1. **ChromaDB Integration** - Verify cultural knowledge is saved/queryable
2. **Intelligent Router Integration** - Use LLAMA-generated knowledge at runtime
3. **Memory JIWA Enricher** - Post-conversation deep analysis (Pattern 5)
4. **Railway Cron Configuration** - Automatic nightly scheduling

---

## 🎯 Integration Plan (3 Weeks)

### **Week 1: Verification & Testing**

#### Task 1.1: Test LLAMA Endpoint ⏱️ 30 mins
**Goal:** Verify RunPod model is accessible and responding

```bash
# From: /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
cd apps/backend-rag

# Test LLAMA endpoint
python test-zantara-quick.py
```

**Expected Output:**
```
✅ LLAMA endpoint responding
Response: "Ciao! Come posso aiutarti oggi? 😊"
Latency: ~1-2 seconds
```

**If fails:** Check RunPod dashboard for endpoint status

---

#### Task 1.2: Get Railway DATABASE_URL ⏱️ 15 mins
**Goal:** Configure environment variables for testing

```bash
# Get DATABASE_URL from Railway
railway variables --service backend-rag | grep DATABASE_URL

# Or from Railway dashboard:
# https://railway.app/project/{project_id}/service/{service_id}/variables
```

**Export for local testing:**
```bash
export DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway"
export RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync"
export RUNPOD_API_KEY="rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"
export RAG_BACKEND_URL="https://zantara.balizero.com"  # Or your RAG backend
```

---

#### Task 1.3: Run Nightly Worker (Test Mode) ⏱️ 2-3 hours
**Goal:** Verify batch processing works end-to-end

```bash
# Dry run with short lookback period
python apps/backend-rag/scripts/llama_nightly_worker.py \
    --days 1 \
    --max-golden 5 \
    --regenerate-cultural
```

**Expected Flow:**
1. ✅ Connects to PostgreSQL
2. ✅ Extracts queries from last 1 day
3. ✅ Clusters queries (if any found)
4. ✅ Generates 5 golden answers using LLAMA + RAG
5. ✅ Generates 10 cultural knowledge chunks using LLAMA
6. ✅ Saves to PostgreSQL

**Verify in PostgreSQL:**
```sql
-- Check nightly worker run
SELECT * FROM nightly_worker_runs ORDER BY started_at DESC LIMIT 1;

-- Check golden answers
SELECT cluster_id, canonical_question, LENGTH(answer)
FROM golden_answers
ORDER BY created_at DESC LIMIT 5;

-- Check cultural knowledge
SELECT topic, LENGTH(content)
FROM cultural_knowledge
ORDER BY created_at DESC LIMIT 10;
```

---

#### Task 1.4: Verify ChromaDB Integration ⏱️ 1-2 hours
**Goal:** Ensure cultural knowledge is retrievable from ChromaDB

**Check cultural_knowledge_generator.py (line 400-500):**
```python
# Does it save to ChromaDB or just PostgreSQL?
# Look for: chroma_client.add() or similar
```

**If missing ChromaDB integration:**
```python
# Add to cultural_knowledge_generator.py
async def _save_to_chromadb(self, topic: str, content: str, metadata: Dict):
    """Save cultural knowledge to ChromaDB for fast retrieval"""
    from services.search_service import SearchService

    search_service = SearchService()
    await search_service.add_cultural_insight(
        text=content,
        metadata={
            "type": "cultural_insight",
            "source": "llama_zantara",
            "topic": topic,
            **metadata
        }
    )
```

**Test ChromaDB retrieval:**
```python
# Test script
from services.search_service import SearchService

search_service = SearchService()
results = await search_service.query_cultural_insights(
    query="Indonesian embarrassment malu",
    limit=3
)

print(f"Found {len(results)} cultural insights")
for r in results:
    print(f"- {r['metadata']['topic']}: {r['content'][:100]}...")
```

**Success Criteria:**
- ✅ Cultural insights saved to ChromaDB
- ✅ Retrieval works (<5ms)
- ✅ Metadata includes topic, language, when_to_use

---

### **Week 2: Runtime Integration**

#### Task 2.1: Integrate Cultural RAG in Router ⏱️ 4-6 hours
**Goal:** Intelligent router queries ChromaDB for cultural insights

**File:** `apps/backend-rag/backend/services/intelligent_router.py`

**Current State:**
```python
# Line ~200
intelligent_router = IntelligentRouter(
    llama_client=None,  # ← LLAMA disabled
    haiku_service=claude_haiku,
    sonnet_service=claude_sonnet,
)
```

**Changes:**

```python
# 1. Add CulturalRAGService
from services.cultural_rag_service import CulturalRAGService

class IntelligentRouter:
    def __init__(self, ..., cultural_rag_service: CulturalRAGService = None):
        self.cultural_rag = cultural_rag_service or CulturalRAGService()

    async def route_chat(self, message: str, user_id: str, ...):
        # Detect if cultural enrichment needed
        cultural_context = None
        if self._needs_cultural_context(message):
            cultural_context = await self.cultural_rag.get_cultural_context(
                message=message,
                language=self._detect_language(message)
            )

        # Check golden answer cache
        golden_answer = await self._check_golden_answer_cache(message)
        if golden_answer:
            logger.info(f"🎯 Using golden answer for: {message[:50]}")
            return self._personalize_golden_answer(golden_answer, user_id)

        # Claude generates with cultural context
        if use_haiku:
            response = await self.haiku_service.conversational(
                message=message,
                user_id=user_id,
                context=cultural_context,  # ← LLAMA's cultural intelligence
                ...
            )

        return response

    def _needs_cultural_context(self, message: str) -> bool:
        """Detect if message needs cultural enrichment"""
        cultural_keywords = [
            "malu", "senang", "sedih", "maaf", "terima kasih",
            "business culture", "indonesian", "balinese", "bali",
            "hierarchy", "respect", "meeting", "relationship"
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in cultural_keywords)

    async def _check_golden_answer_cache(self, message: str) -> Optional[str]:
        """Check if we have a pre-generated golden answer"""
        # Query golden_answers table by semantic similarity
        # (requires embedding of message + cosine similarity search)
        # For now: return None (implement in phase 2.2)
        return None
```

---

#### Task 2.2: Create CulturalRAGService ⏱️ 2-3 hours
**Goal:** Service to retrieve LLAMA-generated cultural insights

**File:** `apps/backend-rag/backend/services/cultural_rag_service.py` (NEW)

```python
"""
Cultural RAG Service - Retrieve LLAMA-generated cultural insights
"""

import logging
from typing import List, Dict, Optional
from services.search_service import SearchService

logger = logging.getLogger(__name__)


class CulturalRAGService:
    """Retrieve cultural insights generated by LLAMA FT"""

    def __init__(self):
        self.search_service = SearchService()

    async def get_cultural_context(
        self,
        message: str,
        language: str = "en"
    ) -> Optional[str]:
        """
        Get relevant cultural context for user message

        Args:
            message: User message
            language: Language code (en, it, id)

        Returns:
            Cultural context string for Claude system prompt
        """
        # Query ChromaDB for cultural insights
        results = await self.search_service.query_cultural_insights(
            query=message,
            language=language,
            limit=3
        )

        if not results:
            return None

        # Format for Claude
        context_parts = [
            "## Cultural Intelligence (from ZANTARA's Indonesian soul):",
            ""
        ]

        for i, result in enumerate(results, 1):
            topic = result['metadata'].get('topic', 'Unknown')
            content = result['content']

            context_parts.append(f"**{i}. {topic.replace('_', ' ').title()}**")
            context_parts.append(content)
            context_parts.append("")

        context_parts.append(
            "Use this cultural intelligence to respond with appropriate sensitivity and warmth."
        )

        cultural_context = "\n".join(context_parts)

        logger.info(f"📚 Retrieved {len(results)} cultural insights for message")
        return cultural_context


# Test function
async def test_cultural_rag():
    """Test cultural RAG service"""
    service = CulturalRAGService()

    test_messages = [
        "aku malu bertanya tentang visa",
        "how to do business in indonesia",
        "what is tri hita karana"
    ]

    for msg in test_messages:
        print(f"\n🔍 Query: {msg}")
        context = await service.get_cultural_context(msg, language="en")
        if context:
            print(f"✅ Cultural context ({len(context)} chars):")
            print(context[:300] + "...")
        else:
            print("❌ No cultural context found")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_cultural_rag())
```

---

#### Task 2.3: Test End-to-End Flow ⏱️ 1-2 hours
**Goal:** Verify cultural intelligence flows to Claude

**Test Cases:**

```bash
# 1. Test cultural context retrieval
python apps/backend-rag/backend/services/cultural_rag_service.py

# 2. Test intelligent router with cultural context
curl -X POST https://zantara.balizero.com/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "aku malu bertanya tentang visa",
    "user_id": "test_user"
  }'

# Expected: Response shows extra warmth and cultural sensitivity
```

**Success Criteria:**
- ✅ Cultural keywords trigger ChromaDB query
- ✅ Relevant insights retrieved (<5ms)
- ✅ Claude response shows cultural intelligence
- ✅ No latency increase (stays <200ms)

---

### **Week 2-3: Memory JIWA Enricher (New Component)**

#### Task 3.1: Build Memory JIWA Enricher ⏱️ 1-2 days
**Goal:** Post-conversation deep analysis for memory enrichment

**File:** `apps/backend-rag/scripts/modules/memory_jiwa_enricher.py` (NEW)

```python
"""
Memory JIWA Enricher - Post-conversation deep analysis

After each conversation, LLAMA analyzes for:
- Emotional state (malu, senang, sedih, khawatir)
- Cultural signals (direct/indirect communication, hierarchy awareness)
- Trust level (rapport building stage)
- Life dreams and aspirations
- Business goals and challenges

Enriches PostgreSQL memory with JIWA context for future personalization.
"""

import asyncpg
import logging
from typing import Dict, Optional, List
from datetime import datetime
import json
import httpx

logger = logging.getLogger(__name__)


class MemoryJIWAEnricher:
    """Deep psychological/cultural analysis of conversations using LLAMA"""

    def __init__(
        self,
        database_url: str,
        runpod_endpoint: Optional[str] = None,
        runpod_api_key: Optional[str] = None
    ):
        self.database_url = database_url
        self.runpod_endpoint = runpod_endpoint
        self.runpod_api_key = runpod_api_key
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initialize PostgreSQL connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ MemoryJIWAEnricher connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise

    async def close(self):
        """Close PostgreSQL connection pool"""
        if self.pool:
            await self.pool.close()

    async def enrich_conversation(
        self,
        user_id: str,
        conversation_id: str,
        messages: List[Dict]
    ) -> Optional[Dict]:
        """
        Analyze conversation and enrich memory with JIWA context

        Args:
            user_id: User identifier
            conversation_id: Conversation identifier
            messages: List of {role, content} messages

        Returns:
            Dict with JIWA analysis
        """
        logger.info(f"🔄 Enriching memory for user {user_id}, conversation {conversation_id}")

        try:
            # Generate JIWA analysis with LLAMA
            jiwa_analysis = await self._analyze_with_llama(messages)

            if not jiwa_analysis:
                logger.warning(f"⚠️ LLAMA analysis failed for {conversation_id}")
                return None

            # Save to memory_enrichments table
            await self._save_jiwa_enrichment(
                user_id=user_id,
                conversation_id=conversation_id,
                jiwa_analysis=jiwa_analysis
            )

            logger.info(f"✅ Memory enriched for user {user_id}")
            return jiwa_analysis

        except Exception as e:
            logger.error(f"❌ Memory enrichment failed: {e}")
            return None

    async def _analyze_with_llama(self, messages: List[Dict]) -> Optional[Dict]:
        """
        Use LLAMA to analyze conversation for JIWA context

        Args:
            messages: Conversation messages

        Returns:
            Dict with JIWA analysis
        """
        if not self.runpod_endpoint or not self.runpod_api_key:
            logger.warning("⚠️ LLAMA not configured")
            return None

        # Build conversation transcript
        transcript = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in messages[-10:]  # Last 10 messages
        ])

        prompt = f"""Analyze this conversation for deep psychological and cultural context (JIWA).

**Conversation**:
{transcript}

**Instructions**:
Extract the following JIWA dimensions:

1. **Emotional State** (malu/senang/sedih/khawatir/neutral)
   - What emotions did the user express?
   - How comfortable are they asking questions?

2. **Cultural Signals** (high/medium/low Indonesian cultural awareness)
   - Direct or indirect communication style?
   - Hierarchy and respect awareness?
   - Cultural sensitivity level?

3. **Trust Level** (1-5, where 5 = deep trust)
   - How much personal information did they share?
   - Are they in relationship-building or transactional mode?

4. **Life Dreams & Aspirations**
   - What are their goals in Indonesia/Bali?
   - What lifestyle are they building?
   - What matters most to them?

5. **Business Context** (if applicable)
   - What business are they building?
   - What challenges are they facing?
   - What support do they need?

**Output Format** (JSON):
{{
  "emotional_state": "...",
  "emotional_notes": "...",
  "cultural_signals": "...",
  "trust_level": 1-5,
  "trust_notes": "...",
  "life_dreams": "...",
  "business_context": "...",
  "key_insights": ["...", "..."],
  "recommended_approach": "..."
}}

Generate the JIWA analysis now:"""

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.runpod_endpoint}/runsync",
                    headers={
                        "Authorization": f"Bearer {self.runpod_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "input": {
                            "prompt": prompt,
                            "max_tokens": 600,
                            "temperature": 0.4,
                            "top_p": 0.9
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()

                analysis_text = data.get("output", {}).get("text", "")

                if not analysis_text:
                    logger.error("❌ LLAMA returned empty analysis")
                    return None

                # Parse JSON from LLAMA response
                try:
                    jiwa_analysis = json.loads(analysis_text)
                    logger.info(f"✅ LLAMA JIWA analysis complete")
                    return jiwa_analysis
                except json.JSONDecodeError:
                    # LLAMA didn't return valid JSON, extract manually
                    logger.warning("⚠️ LLAMA response not JSON, returning as text")
                    return {
                        "raw_analysis": analysis_text,
                        "trust_level": 3  # Default
                    }

        except Exception as e:
            logger.error(f"❌ LLAMA analysis failed: {e}")
            return None

    async def _save_jiwa_enrichment(
        self,
        user_id: str,
        conversation_id: str,
        jiwa_analysis: Dict
    ):
        """Save JIWA enrichment to PostgreSQL"""
        if not self.pool:
            await self.connect()

        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO memory_enrichments (
                        user_id,
                        conversation_id,
                        emotional_state,
                        cultural_signals,
                        trust_level,
                        life_dreams,
                        business_context,
                        key_insights,
                        recommended_approach,
                        raw_analysis,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                """,
                    user_id,
                    conversation_id,
                    jiwa_analysis.get('emotional_state'),
                    jiwa_analysis.get('cultural_signals'),
                    jiwa_analysis.get('trust_level', 3),
                    jiwa_analysis.get('life_dreams'),
                    jiwa_analysis.get('business_context'),
                    json.dumps(jiwa_analysis.get('key_insights', [])),
                    jiwa_analysis.get('recommended_approach'),
                    json.dumps(jiwa_analysis)
                )

            logger.info(f"✅ Saved JIWA enrichment for conversation {conversation_id}")

        except Exception as e:
            logger.error(f"❌ Failed to save JIWA enrichment: {e}")
            raise


# Test function
async def test_enricher():
    """Test memory JIWA enricher"""
    import os

    database_url = os.getenv("DATABASE_URL")
    runpod_endpoint = os.getenv("RUNPOD_LLAMA_ENDPOINT")
    runpod_api_key = os.getenv("RUNPOD_API_KEY")

    if not database_url:
        print("❌ DATABASE_URL not set")
        return

    enricher = MemoryJIWAEnricher(
        database_url=database_url,
        runpod_endpoint=runpod_endpoint,
        runpod_api_key=runpod_api_key
    )

    # Test conversation
    test_messages = [
        {"role": "user", "content": "aku malu bertanya tentang visa..."},
        {"role": "assistant", "content": "Non c'è niente di cui aver malu! Let me help you."},
        {"role": "user", "content": "I want to build a cafe in Canggu"},
        {"role": "assistant", "content": "Beautiful dream! Let's talk about PT PMA requirements..."}
    ]

    try:
        await enricher.connect()

        print("\n🚀 TESTING JIWA ENRICHMENT")
        print("=" * 60)

        result = await enricher.enrich_conversation(
            user_id="test_user",
            conversation_id="test_conv_001",
            messages=test_messages
        )

        if result:
            print(f"\n✅ SUCCESS!")
            print(json.dumps(result, indent=2))
        else:
            print("\n❌ Enrichment failed")

    finally:
        await enricher.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_enricher())
```

---

#### Task 3.2: Create memory_enrichments Table ⏱️ 30 mins
**Goal:** PostgreSQL schema for JIWA enrichments

```sql
-- Create memory_enrichments table
CREATE TABLE IF NOT EXISTS memory_enrichments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    emotional_state VARCHAR(100),
    cultural_signals VARCHAR(100),
    trust_level INT CHECK (trust_level >= 1 AND trust_level <= 5),
    life_dreams TEXT,
    business_context TEXT,
    key_insights JSONB,
    recommended_approach TEXT,
    raw_analysis JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(conversation_id)
);

CREATE INDEX idx_memory_enrichments_user ON memory_enrichments(user_id);
CREATE INDEX idx_memory_enrichments_created ON memory_enrichments(created_at DESC);
```

---

#### Task 3.3: Integrate in Intelligent Router ⏱️ 2-3 hours
**Goal:** Trigger JIWA enrichment after conversations (background task)

**File:** `apps/backend-rag/backend/services/intelligent_router.py`

```python
# Add at top
from scripts.modules.memory_jiwa_enricher import MemoryJIWAEnricher
import asyncio

class IntelligentRouter:
    def __init__(self, ..., memory_enricher: MemoryJIWAEnricher = None):
        self.memory_enricher = memory_enricher

    async def route_chat(self, message: str, user_id: str, ...):
        # ... existing code ...

        # Generate response
        response = await self.haiku_service.conversational(...)

        # Background: Trigger memory JIWA enrichment (non-blocking)
        if self.memory_enricher:
            asyncio.create_task(
                self.memory_enricher.enrich_conversation(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    messages=conversation_messages
                )
            )

        return response
```

**Success Criteria:**
- ✅ Enrichment runs in background (no latency impact)
- ✅ JIWA analysis saved to PostgreSQL
- ✅ Errors don't break user experience

---

### **Week 3: Production Deployment**

#### Task 4.1: Configure Railway Cron Job ⏱️ 1 hour
**Goal:** Schedule nightly worker to run automatically

**Option A: Railway Cron (Native)**
```yaml
# railway.yml (if Railway supports it)
cron:
  - schedule: "0 2 * * *"  # 2 AM UTC = 10 AM Jakarta
    command: "python apps/backend-rag/scripts/llama_nightly_worker.py --days 7 --max-golden 50 --regenerate-cultural"
```

**Option B: External Cron (EasyCron, Cron-job.org)**
```bash
# Schedule daily HTTP POST to Railway endpoint
# Endpoint: https://your-backend.railway.app/admin/trigger-nightly-worker
# Schedule: 0 2 * * * (2 AM UTC)
```

**Option C: Railway Service with Sleep Loop**
```python
# apps/backend-rag/scripts/nightly_worker_service.py
import asyncio
from datetime import datetime

async def run_nightly_worker_loop():
    """Run nightly worker in loop with sleep"""
    while True:
        now = datetime.now()

        # Run at 2 AM UTC
        if now.hour == 2 and now.minute < 5:
            logger.info("🌙 Starting nightly worker...")
            await run_nightly_worker()

        # Sleep for 5 minutes
        await asyncio.sleep(300)

# Deploy as separate Railway service
```

---

#### Task 4.2: Set Railway Environment Variables ⏱️ 15 mins
**Goal:** Configure production environment

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set RUNPOD_LLAMA_ENDPOINT="https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync"
railway variables set RUNPOD_API_KEY="rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"
railway variables set RAG_BACKEND_URL="https://zantara.balizero.com"
```

---

#### Task 4.3: Monitor First Automatic Run ⏱️ 1-2 hours
**Goal:** Verify production scheduling works

```bash
# Check nightly worker logs on Railway
railway logs --service nightly-worker

# Or query PostgreSQL
SELECT * FROM nightly_worker_runs ORDER BY started_at DESC LIMIT 5;
```

**Success Criteria:**
- ✅ Worker runs automatically at 2 AM UTC
- ✅ No errors or timeouts
- ✅ Golden answers and cultural knowledge generated
- ✅ PostgreSQL and ChromaDB updated

---

## 📊 Success Metrics

**After Full Integration:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cultural sensitivity | +50% | User feedback on "warmth" |
| Golden answer cache hit rate | 20-30% | Log "🎯 Using golden answer" |
| Memory JIWA enrichment coverage | 100% | All conversations analyzed |
| LLAMA batch job success rate | >95% | nightly_worker_runs table |
| ChromaDB retrieval latency | <5ms | Log retrieval times |
| No frontend latency increase | <200ms | Monitor Claude response times |

---

## 🚨 Troubleshooting

### LLAMA Endpoint Not Responding
```bash
# Check RunPod status
curl -X POST https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync \
  -H "Authorization: Bearer rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz" \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "Hello", "max_tokens": 50}}'
```

### ChromaDB Not Finding Cultural Insights
```python
# Debug ChromaDB
from services.search_service import SearchService

search = SearchService()
all_cultural = await search.get_all_collections()
print(f"Collections: {all_cultural}")

# Check if cultural_knowledge collection exists
```

### Nightly Worker Timing Out
```bash
# Reduce batch size
python llama_nightly_worker.py --days 1 --max-golden 10
```

---

## 🎯 Final Checklist

**Before considering integration complete:**

- [ ] LLAMA endpoint tested and responding
- [ ] Nightly worker runs successfully (test mode)
- [ ] Cultural knowledge saved to PostgreSQL
- [ ] Cultural knowledge saved to ChromaDB
- [ ] ChromaDB retrieval works (<5ms)
- [ ] Intelligent router queries ChromaDB
- [ ] Claude responses show cultural intelligence
- [ ] Golden answer cache integrated
- [ ] Memory JIWA enricher built and tested
- [ ] memory_enrichments table created
- [ ] Background enrichment integrated in router
- [ ] Railway Cron configured
- [ ] Environment variables set on Railway
- [ ] First automatic run successful
- [ ] Monitoring/alerting configured

---

## 💰 Cost Verification

**Current LLAMA cost:** €3.78/month (RunPod flat rate)

**With full integration:**
- Nightly worker: Included in flat rate
- Memory JIWA enrichment: Included (async, background)
- Cultural RAG retrieval: Free (ChromaDB self-hosted)

**Total: Still €3.78/month** ✨

---

Pronto! 🚀

This plan completes the JIWA architecture:
- **Week 1**: Test existing system
- **Week 2**: Runtime integration
- **Week 3**: Production deployment

**Next step:** Start with Task 1.1 (Test LLAMA Endpoint)

Ready to begin? 🎭
