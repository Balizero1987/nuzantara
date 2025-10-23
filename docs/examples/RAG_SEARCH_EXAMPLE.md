# 🔍 RAG Search Integration Guide

**How to use the RAG backend from TypeScript and Python**

---

## 🎯 What is RAG Backend?

The **RAG Backend** (Python FastAPI at `:8000`) provides:
- **Semantic Search** across 14 ChromaDB collections (14,365+ docs)
- **Claude Haiku 4.5** integration for AI responses
- **Golden Answers** lookup (10-20ms, 50-60% hit rate)
- **JIWA Cultural** intelligence middleware
- **164 Tools** orchestration

---

## 📡 From TypeScript Backend

### Basic RAG Query

```typescript
// apps/backend-ts/src/handlers/my-handler.ts

import { RAGService } from '../../services/ragService.js';
import { ok, err } from '../../utils/response.js';

const ragService = new RAGService(process.env.RAG_BACKEND_URL || 'http://localhost:8000');

export async function myRAGHandler(params: any, req?: any) {
  const { query } = params;

  if (!query) {
    return err("missing_params: query is required");
  }

  try {
    // Query RAG backend
    const response = await ragService.query({
      query,
      user_id: req?.user?.uid || 'anonymous',
      user_email: req?.user?.email,
      k: 5  // Return top 5 sources
    });

    if (!response.success) {
      return err(`rag_error: ${response.error}`);
    }

    return ok({
      answer: response.answer,
      sources: response.sources,
      model: response.model_used
    });
  } catch (error) {
    return err(`rag_backend_error: ${error.message}`);
  }
}
```

### With Conversation History

```typescript
export async function chatWithContext(params: any, req?: any) {
  const { query, history } = params;

  const response = await ragService.query({
    query,
    user_id: req?.user?.uid,
    user_email: req?.user?.email,
    conversation_history: history || []  // Array of {role, content}
  });

  return ok(response);
}
```

**Example conversation history:**
```typescript
const history = [
  { role: 'user', content: 'What is KITAS?' },
  { role: 'assistant', content: 'KITAS is a limited stay permit...' },
  { role: 'user', content: 'How long does it take?' }  // Current query with context
];
```

---

## 🐍 From Python Backend

### Basic RAG Search

```python
# apps/backend-rag/backend/services/my_service.py

from backend.services.search_service import search_relevant_documents
from backend.services.claude_haiku_service import ClaudeHaikuService

async def query_with_rag(query: str, user_id: str = "anonymous"):
    """
    Search RAG and generate answer with Haiku
    """

    # 1. Search ChromaDB (semantic search)
    search_results = await search_relevant_documents(
        query=query,
        collections=["bali_zero_pricing", "visa_oracle", "legal_architect"],
        top_k=5
    )

    if not search_results:
        return {
            "success": False,
            "error": "No relevant documents found"
        }

    # 2. Build context from sources
    context = "\n\n".join([
        f"Source: {doc['metadata'].get('source', 'Unknown')}\n{doc['content']}"
        for doc in search_results
    ])

    # 3. Generate answer with Haiku
    haiku = ClaudeHaikuService()
    response = await haiku.generate(
        prompt=f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based on the context above:",
        user_id=user_id
    )

    return {
        "success": True,
        "answer": response["content"],
        "sources": search_results,
        "model": "claude-haiku-4.5"
    }
```

### Using Golden Answer Service

```python
# Fast lookup before expensive RAG

from backend.services.golden_answer_service import GoldenAnswerService

golden_service = GoldenAnswerService(database_url=os.getenv("DATABASE_URL"))
await golden_service.connect()

async def smart_query(query: str, user_id: str):
    """
    Try golden answer first (10-20ms), fallback to RAG (1-2s)
    """

    # 1. Try golden answer (250x faster!)
    golden = await golden_service.lookup_answer(query)

    if golden:
        # Cache hit! ⚡
        return {
            "success": True,
            "answer": golden["answer"],
            "sources": golden["sources"],
            "cached": True,
            "response_time_ms": 15
        }

    # 2. Cache miss, use full RAG
    rag_response = await query_with_rag(query, user_id)
    rag_response["cached"] = False
    rag_response["response_time_ms"] = 1500

    return rag_response
```

---

## 🔥 Real World Example: Bali Zero Chat

This is the actual flow used in production:

```typescript
// apps/backend-ts/src/handlers/bali-zero/chat.ts

import { RAGService } from '../../services/ragService.js';
import { ok, err } from '../../utils/response.js';
import logger from '../../services/logger.js';

const ragService = new RAGService(process.env.RAG_BACKEND_URL);

export async function baliZeroChat(params: any, req?: any) {
  const { query, conversation_history, user_role } = params;

  if (!query) {
    return err("missing_params: query is required");
  }

  const user = req?.user || { uid: 'demo', email: 'demo@example.com' };

  logger.info('Bali Zero chat request', {
    user_id: user.uid,
    query_length: query.length,
    has_history: !!conversation_history
  });

  try {
    // Call RAG backend /bali-zero/chat endpoint
    const response = await ragService.baliZeroChat({
      query,
      conversation_history: conversation_history || [],
      user_role: user_role || 'member',
      user_email: user.email
    });

    if (!response.success) {
      logger.error('RAG backend failed', { error: response });
      return err(`rag_error: ${response.error || 'Unknown error'}`);
    }

    logger.info('Bali Zero chat success', {
      user_id: user.uid,
      model: response.model_used,
      sources_count: response.sources?.length || 0,
      response_length: response.response?.length || 0
    });

    return ok({
      response: response.response,
      model_used: response.model_used,
      sources: response.sources,
      usage: response.usage
    });

  } catch (error) {
    logger.error('Bali Zero chat exception', error);
    return err(`exception: ${error.message}`);
  }
}

// Register handler
import { globalRegistry } from '../../core/handler-registry.js';

globalRegistry.registerModule('bali-zero', {
  'chat': baliZeroChat
}, {
  requiresAuth: false,  // Demo access allowed
  description: 'Main Bali Zero chat endpoint'
});
```

**Frontend Usage:**
```javascript
// apps/webapp/src/services/api-client.js

async function sendMessage(message, history = []) {
  const response = await fetch('https://ts-backend.railway.app/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      key: 'bali-zero.chat',
      params: {
        query: message,
        conversation_history: history,
        user_role: 'member'
      }
    })
  });

  return await response.json();
}
```

---

## 📊 RAG Search with Specific Collections

```python
from backend.services.search_service import search_relevant_documents

# Search specific domains
visa_docs = await search_relevant_documents(
    query="KITAS requirements for Italian citizen",
    collections=["visa_oracle", "legal_architect"],  # Only visa/legal
    top_k=10
)

tax_docs = await search_relevant_documents(
    query="Corporate tax optimization strategies",
    collections=["tax_genius", "tax_updates"],  # Only tax
    top_k=5
)

# Search all collections
all_docs = await search_relevant_documents(
    query="Open PT PMA in Bali",
    collections=None,  # Search all 14 collections
    top_k=15
)
```

### Available Collections

```python
COLLECTIONS = [
    "bali_zero_pricing",        # Pricing info
    "visa_oracle",              # Visa knowledge
    "kbli_eye",                 # KBLI codes
    "tax_genius",               # Tax knowledge
    "zantara_books",            # 12,907 Indonesian books
    "kb_indonesian",            # Indonesian KB
    "legal_architect",          # Legal knowledge
    "legal_updates",            # Legal updates
    "property_listings",        # Property data
    "property_knowledge",       # Property knowledge
    "tax_updates",              # Tax updates
    "tax_knowledge",            # Tax knowledge
    "cultural_insights",        # JIWA cultural chunks
    "oracle_kbli_knowledge"     # KBLI Oracle
]
```

---

## ⚡ Performance Optimization

### 1. Use Golden Answers

```python
# Golden answer lookup = 10-20ms
# Full RAG generation = 1-2s
# Speedup = 250x

golden = await golden_service.lookup_answer(query)
if golden:
    return golden  # ⚡ Fast path
else:
    return await full_rag_query(query)  # 🐌 Slow path
```

### 2. Limit Search Results

```python
# More results = slower + more tokens
search_results = await search_relevant_documents(
    query=query,
    top_k=5  # ✅ Good balance
    # top_k=50  # ❌ Too many, slow + expensive
)
```

### 3. Cache Frequently Asked Queries

```python
import redis

redis_client = redis.Redis()

async def cached_rag_query(query: str):
    cache_key = f"rag:{hashlib.md5(query.encode()).hexdigest()}"

    # Check cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)  # ⚡ 2ms

    # Generate new
    response = await query_with_rag(query)

    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(response))

    return response
```

---

## 🧪 Testing RAG Integration

### Test RAG Backend Directly

```bash
# Test Python RAG backend
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What documents for KITAS?",
    "user_id": "test_user",
    "top_k": 5
  }'

# Expected response:
# {
#   "success": true,
#   "results": [...],
#   "count": 5
# }
```

### Test via TypeScript Backend

```bash
# Test through TS proxy
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali-zero.chat",
    "params": {
      "query": "What documents for KITAS?"
    }
  }'
```

### Test Golden Answer Lookup

```bash
# Test golden answer service
curl -X POST http://localhost:8000/api/golden-answers/lookup \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What documents for KITAS?"
  }'

# Expect either:
# - Hit: {"found": true, "answer": "...", "response_time_ms": 15}
# - Miss: {"found": false}
```

---

## 🔗 Related Documentation

- **Architecture**: [AI Intelligence](../galaxy-map/03-ai-intelligence.md)
- **Data Flows**: [Data Flows](../galaxy-map/04-data-flows.md)
- **API Reference**: [API Documentation](../api/API_DOCUMENTATION.md)

---

**Start building intelligent search!** 🔍✨
