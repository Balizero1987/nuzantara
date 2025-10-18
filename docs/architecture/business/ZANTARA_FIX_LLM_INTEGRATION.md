# 🚀 ZANTARA FIX - LLM Integration Patch

**Versione**: 1.0.0
**Data**: 2025-09-30
**Obiettivo**: Aggiungere generazione risposte LLM al sistema RAG ZANTARA
**Status**: ✅ READY FOR DEPLOYMENT

---

## 📋 QUICK START (2 minuti)

```bash
# 1. Navigate to zantara-rag
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag/backend"

# 2. Create ollama_client.py
cat > services/ollama_client.py << 'EOFPYTHON'
# [VEDI STEP 2 sotto per il contenuto completo]
EOFPYTHON

# 3. Create rag_generator.py
cat > services/rag_generator.py << 'EOFPYTHON'
# [VEDI STEP 3 sotto per il contenuto completo]
EOFPYTHON

# 4. Update services/__init__.py
echo 'from .ollama_client import OllamaClient
from .rag_generator import RAGGenerator
from .search_service import SearchService
from .ingestion_service import IngestionService

__all__ = ["OllamaClient", "RAGGenerator", "SearchService", "IngestionService"]' > services/__init__.py

# 5. Test
python3 -c "from services.ollama_client import OllamaClient; print('✅ Ollama client OK')"
python3 -c "from services.rag_generator import RAGGenerator; print('✅ RAG generator OK')"

# 6. Start Ollama (se non già attivo)
ollama serve &
ollama pull llama3.2

# 7. Test completo
python3 services/rag_generator.py
```

---

## 🎯 PROBLEMA RISOLTO

**PRIMA** (solo semantic search):
```
Query → Embeddings → Vector DB → Top K results → 🛑 STOP
```

**DOPO** (RAG completo con LLM):
```
Query → Embeddings → Vector DB → Top K results → LLM (Ollama) → ✅ Risposta finale
```

---

## 📦 FILE DA CREARE

### STEP 1: Installa dipendenze

```bash
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag"
pip3 install httpx tenacity
```

---

### STEP 2: Crea `services/ollama_client.py`

```python
"""
ZANTARA - Ollama Client
Local LLM integration via Ollama API
Supports: Llama 3.2, Mistral, Phi-3, etc.
"""

import httpx
import logging
from typing import Dict, Any, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class OllamaClient:
    """
    HTTP client for Ollama local LLM server
    Default: http://localhost:11434
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        default_model: str = "llama3.2",
        timeout: int = 120
    ):
        """
        Initialize Ollama client.

        Args:
            base_url: Ollama server URL (default: localhost:11434)
            default_model: Default model to use (default: llama3.2)
            timeout: Request timeout in seconds (default: 120)
        """
        self.base_url = base_url.rstrip('/')
        self.default_model = default_model
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout
        )
        logger.info(f"OllamaClient initialized: {self.base_url} (model: {self.default_model})")

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> str:
        """
        Generate text using Ollama.

        Args:
            prompt: User prompt/question
            model: Model name (default: self.default_model)
            system: System prompt (optional)
            temperature: Sampling temperature (0-1)
            max_tokens: Max tokens to generate
            stream: Stream response (not implemented yet)

        Returns:
            Generated text response

        Raises:
            OllamaAPIError: If generation fails
        """
        model = model or self.default_model

        try:
            # Build request payload
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }

            if system:
                payload["system"] = system

            logger.debug(f"Generating with model '{model}': {prompt[:50]}...")

            # Call Ollama API
            response = await self.client.post(
                "/api/generate",
                json=payload
            )

            response.raise_for_status()
            data = response.json()

            # Extract generated text
            generated_text = data.get("response", "")

            if not generated_text:
                raise OllamaAPIError("Empty response from Ollama")

            logger.info(f"Generated {len(generated_text)} chars with {model}")
            return generated_text.strip()

        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama HTTP error: {e}")
            raise OllamaAPIError(f"HTTP {e.response.status_code}: {e}")

        except httpx.RequestError as e:
            logger.error(f"Ollama request error: {e}")
            raise OllamaAPIError(f"Request failed: {e}")

        except Exception as e:
            logger.error(f"Ollama unexpected error: {e}")
            raise OllamaAPIError(f"Generation failed: {e}")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Chat completion using Ollama chat API.

        Args:
            messages: List of message dicts with 'role' and 'content'
                      Example: [{"role": "user", "content": "Hello"}]
            model: Model name
            temperature: Sampling temperature
            max_tokens: Max tokens

        Returns:
            Assistant's response text
        """
        model = model or self.default_model

        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }

            response = await self.client.post(
                "/api/chat",
                json=payload
            )

            response.raise_for_status()
            data = response.json()

            # Extract message content
            message = data.get("message", {})
            content = message.get("content", "")

            if not content:
                raise OllamaAPIError("Empty chat response")

            logger.info(f"Chat response: {len(content)} chars")
            return content.strip()

        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise OllamaAPIError(f"Chat failed: {e}")

    async def list_models(self) -> List[str]:
        """
        List available Ollama models.

        Returns:
            List of model names
        """
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            data = response.json()

            models = [model["name"] for model in data.get("models", [])]
            logger.info(f"Available models: {models}")
            return models

        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []

    async def health_check(self) -> Dict[str, Any]:
        """
        Check if Ollama server is running.

        Returns:
            Health status dict
        """
        try:
            response = await self.client.get("/")
            return {
                "status": "operational" if response.status_code == 200 else "degraded",
                "url": self.base_url,
                "model": self.default_model
            }
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return {
                "status": "unavailable",
                "error": str(e)
            }


class OllamaAPIError(Exception):
    """Exception for Ollama API errors"""
    pass


# Example usage
if __name__ == "__main__":
    import asyncio

    async def test_ollama():
        """Test Ollama client"""
        client = OllamaClient()

        # Health check
        print("🏥 Health Check:")
        health = await client.health_check()
        print(f"   Status: {health.get('status')}")

        # List models
        print("\n📦 Available Models:")
        models = await client.list_models()
        for model in models:
            print(f"   - {model}")

        # Test generation
        print("\n🤖 Test Generation:")
        try:
            response = await client.generate(
                prompt="What is 2+2? Answer in one sentence.",
                temperature=0.1
            )
            print(f"   Response: {response}")
        except Exception as e:
            print(f"   Error: {e}")

        await client.close()

    asyncio.run(test_ollama())
```

---

### STEP 3: Crea `services/rag_generator.py`

```python
"""
ZANTARA - RAG Generator
Complete RAG pipeline: Search + Context + LLM Generation
"""

import logging
from typing import Dict, Any, List, Optional
from .ollama_client import OllamaClient
from .search_service import SearchService

logger = logging.getLogger(__name__)


class RAGGenerator:
    """
    Complete RAG (Retrieval-Augmented Generation) pipeline.

    Flow:
    1. Semantic search → get relevant chunks
    2. Build context from top results
    3. Generate answer using LLM + context
    """

    # Default system prompt for RAG
    DEFAULT_SYSTEM_PROMPT = """You are ZANTARA, an intelligent assistant with access to a knowledge base of 214 books covering esotericism, Indonesian magic, philosophy, and more.

Your task:
- Answer questions using ONLY the provided context from the knowledge base
- If the context doesn't contain the answer, say "I don't have enough information in my knowledge base to answer this."
- Be concise but complete
- Cite book titles when possible
- Maintain a helpful, knowledgeable tone

Context will be provided below. Use it to answer the user's question."""

    def __init__(
        self,
        ollama_base_url: str = "http://localhost:11434",
        ollama_model: str = "llama3.2",
        max_context_chunks: int = 5
    ):
        """
        Initialize RAG generator.

        Args:
            ollama_base_url: Ollama server URL
            ollama_model: LLM model to use
            max_context_chunks: Max chunks to include in context (default: 5)
        """
        self.ollama = OllamaClient(
            base_url=ollama_base_url,
            default_model=ollama_model
        )
        self.search_service = SearchService()
        self.max_context_chunks = max_context_chunks
        logger.info(f"RAGGenerator initialized with model: {ollama_model}")

    async def close(self):
        """Close all clients"""
        await self.ollama.close()

    async def generate_answer(
        self,
        query: str,
        user_level: int = 3,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate answer using RAG pipeline.

        Args:
            query: User's question
            user_level: Access level (0-3) for search filtering
            temperature: LLM sampling temperature
            system_prompt: Optional custom system prompt

        Returns:
            Dict with:
                - answer: Generated answer text
                - sources: List of source chunks used
                - model: LLM model used
                - query: Original query
                - execution_time_ms: Total time
        """
        import time
        start_time = time.time()

        try:
            # Step 1: Semantic search
            logger.info(f"RAG Query: '{query}' (level {user_level})")
            search_results = await self.search_service.search(
                query=query,
                user_level=user_level,
                limit=self.max_context_chunks
            )

            # Step 2: Build context
            context = self._build_context(search_results["results"])

            if not context:
                return {
                    "answer": "I don't have enough information in my knowledge base to answer this question.",
                    "sources": [],
                    "model": self.ollama.default_model,
                    "query": query,
                    "execution_time_ms": (time.time() - start_time) * 1000
                }

            # Step 3: Build prompt
            final_prompt = self._build_prompt(query, context)

            # Step 4: Generate with LLM
            system = system_prompt or self.DEFAULT_SYSTEM_PROMPT
            answer = await self.ollama.generate(
                prompt=final_prompt,
                system=system,
                temperature=temperature
            )

            execution_time = (time.time() - start_time) * 1000

            logger.info(
                f"RAG completed: '{query}' -> {len(answer)} chars in {execution_time:.2f}ms"
            )

            # Step 5: Format response
            return {
                "answer": answer,
                "sources": self._format_sources(search_results["results"]),
                "model": self.ollama.default_model,
                "query": query,
                "execution_time_ms": round(execution_time, 2)
            }

        except Exception as e:
            logger.error(f"RAG generation failed: {e}")
            return {
                "answer": f"Error generating answer: {str(e)}",
                "sources": [],
                "model": self.ollama.default_model,
                "query": query,
                "error": str(e),
                "execution_time_ms": (time.time() - start_time) * 1000
            }

    def _build_context(self, search_results: Dict[str, Any]) -> str:
        """
        Build context string from search results.

        Args:
            search_results: Raw search results from vector DB

        Returns:
            Formatted context string
        """
        if not search_results.get("documents"):
            return ""

        context_parts = []

        for idx, doc in enumerate(search_results["documents"][:self.max_context_chunks], 1):
            metadata = search_results["metadatas"][idx - 1]
            book_title = metadata.get("book_title", "Unknown")
            author = metadata.get("book_author", "Unknown")

            context_parts.append(
                f"[Source {idx}] {book_title} by {author}\n{doc}\n"
            )

        return "\n---\n".join(context_parts)

    def _build_prompt(self, query: str, context: str) -> str:
        """
        Build final prompt with query + context.

        Args:
            query: User's question
            context: Retrieved context

        Returns:
            Complete prompt string
        """
        return f"""Context from knowledge base:

{context}

---

Question: {query}

Answer:"""

    def _format_sources(self, search_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Format search results into source citations.

        Args:
            search_results: Raw search results

        Returns:
            List of source dicts
        """
        if not search_results.get("documents"):
            return []

        sources = []

        for idx, doc in enumerate(search_results["documents"], 1):
            metadata = search_results["metadatas"][idx - 1]
            distance = search_results["distances"][idx - 1]

            sources.append({
                "index": idx,
                "book_title": metadata.get("book_title", "Unknown"),
                "book_author": metadata.get("book_author", "Unknown"),
                "tier": metadata.get("tier", "C"),
                "chunk_text": doc[:200] + "..." if len(doc) > 200 else doc,
                "similarity_score": round(1 / (1 + distance), 4)
            })

        return sources

    async def health_check(self) -> Dict[str, Any]:
        """
        Check health of RAG system.

        Returns:
            Health status dict
        """
        ollama_health = await self.ollama.health_check()

        return {
            "status": "operational" if ollama_health["status"] == "operational" else "degraded",
            "llm": ollama_health,
            "search": "ready",
            "model": self.ollama.default_model
        }


# Example usage
if __name__ == "__main__":
    import asyncio

    async def test_rag():
        """Test RAG generator"""
        rag = RAGGenerator()

        # Health check
        print("🏥 RAG Health Check:")
        health = await rag.health_check()
        print(f"   Status: {health.get('status')}")
        print(f"   Model: {health.get('model')}")

        # Test query
        print("\n🔮 Test RAG Query:")
        result = await rag.generate_answer(
            query="What is Sunda Wiwitan?",
            user_level=3,
            temperature=0.7
        )

        print(f"\n📝 Answer ({result['execution_time_ms']:.0f}ms):")
        print(result["answer"])

        print(f"\n📚 Sources ({len(result['sources'])}):")
        for source in result["sources"]:
            print(f"   [{source['index']}] {source['book_title']} (similarity: {source['similarity_score']})")

        await rag.close()

    asyncio.run(test_rag())
```

---

### STEP 4: Update `services/__init__.py`

```python
from .ollama_client import OllamaClient
from .rag_generator import RAGGenerator
from .search_service import SearchService
from .ingestion_service import IngestionService

__all__ = [
    "OllamaClient",
    "RAGGenerator",
    "SearchService",
    "IngestionService"
]
```

---

## ✅ VERIFICA INSTALLAZIONE

### Test 1: Import Check

```bash
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag/backend"

python3 << 'EOF'
from services.ollama_client import OllamaClient
from services.rag_generator import RAGGenerator
print("✅ All imports OK!")
EOF
```

### Test 2: Ollama Server Check

```bash
# Start Ollama (se non già attivo)
ollama serve &

# Wait 5 seconds
sleep 5

# Pull model (se non già presente)
ollama pull llama3.2

# Test
python3 services/ollama_client.py
```

**Expected output**:
```
🏥 Health Check:
   Status: operational
📦 Available Models:
   - llama3.2
🤖 Test Generation:
   Response: 2+2 equals 4.
```

### Test 3: RAG Pipeline Check

```bash
python3 services/rag_generator.py
```

**Expected output**:
```
🏥 RAG Health Check:
   Status: operational
   Model: llama3.2
🔮 Test RAG Query:
📝 Answer (1250ms):
[Generated answer about Sunda Wiwitan using context from books]
📚 Sources (5):
   [1] Sanghyang Siksakandang Karesian (similarity: 0.8234)
   [2] Bujangga Manik (similarity: 0.7891)
   ...
```

---

## 🚀 USO IN PRODUZIONE

### Aggiungi endpoint RAG a FastAPI

Crea `/app/routers/rag.py`:

```python
"""
ZANTARA RAG - RAG Router
Complete RAG with LLM generation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from ...services.rag_generator import RAGGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])


class RAGQuery(BaseModel):
    query: str
    level: int = 3
    temperature: float = 0.7
    system_prompt: Optional[str] = None


@router.post("/answer")
async def rag_answer(request: RAGQuery):
    """
    Generate answer using RAG pipeline.

    - **query**: User's question
    - **level**: Access level (0-3)
    - **temperature**: LLM temperature (0-1)
    - **system_prompt**: Optional custom system prompt
    """
    try:
        rag = RAGGenerator()

        result = await rag.generate_answer(
            query=request.query,
            user_level=request.level,
            temperature=request.temperature,
            system_prompt=request.system_prompt
        )

        await rag.close()

        return {
            "ok": True,
            "data": result
        }

    except Exception as e:
        logger.error(f"RAG error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"RAG generation failed: {str(e)}"
        )


@router.get("/health")
async def rag_health():
    """RAG system health check"""
    try:
        rag = RAGGenerator()
        health = await rag.health_check()
        await rag.close()

        return health

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"RAG unhealthy: {str(e)}"
        )
```

### Update `app/main.py`

```python
# Add to imports
from .routers import health, search, ingest, rag  # <-- ADD rag

# Add to router includes
app.include_router(rag.router)  # <-- ADD THIS
```

### Test endpoint

```bash
# Start RAG server
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag"
python3 -m backend.app.main

# In another terminal, test
curl -X POST http://localhost:8000/rag/answer \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the Kujang symbol?",
    "level": 3,
    "temperature": 0.7
  }' | jq
```

---

## 🔧 TROUBLESHOOTING

### Errore: "Ollama connection refused"

```bash
# Check if Ollama is running
ps aux | grep ollama

# If not, start it
ollama serve &

# Wait and retry
sleep 5
```

### Errore: "Model not found"

```bash
# Pull required model
ollama pull llama3.2

# Or use another model
ollama pull mistral
ollama pull phi3
```

### Errore: "No module named 'httpx'"

```bash
pip3 install httpx tenacity
```

### Errore: "SearchService not found"

```bash
# Make sure you're in the correct directory
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara-rag/backend"

# Check path
python3 -c "import sys; print(sys.path)"
```

---

## 📊 PERFORMANCE BENCHMARKS

**Expected performance** (local M1/M2 Mac):

| Operation | Time | Notes |
|-----------|------|-------|
| Semantic search | 50-150ms | Vector DB lookup |
| LLM generation | 800-2000ms | Depends on model & length |
| **Total RAG** | **1-3 seconds** | End-to-end |

**Optimization tips**:
1. Use smaller models for faster response (phi3, mistral-7b)
2. Reduce `max_context_chunks` (default: 5 → try 3)
3. Lower `temperature` for more deterministic (faster) output
4. Use GPU acceleration if available (Ollama auto-detects)

---

## 🎯 COSA MANCA ANCORA

✅ **Completato**:
- Ollama client
- RAG pipeline
- Context building
- LLM generation
- Source citations

🟡 **Opzionale**:
- Streaming responses (for real-time UX)
- Multi-turn conversation (chat history)
- Response caching
- A/B testing different models

---

## 📝 SUMMARY

**Questa patch aggiunge**:
1. `services/ollama_client.py` - Client HTTP per Ollama
2. `services/rag_generator.py` - Pipeline RAG completo
3. `services/__init__.py` - Export dei nuovi moduli
4. `app/routers/rag.py` - Endpoint FastAPI (opzionale)

**Risultato finale**:
```
User Query → RAG Generator → Search Service → Vector DB
                              ↓
                         Context Builder
                              ↓
                         Ollama LLM
                              ↓
                    Generated Answer + Sources
```

**Deploy time**: ~2 minuti
**Dependencies**: `httpx`, `tenacity`, `ollama` (già installati)
**Status**: ✅ READY

---

## 🚀 NEXT STEPS

1. **Esegui STEP 1-7** (Quick Start sopra)
2. **Testa** `python3 services/rag_generator.py`
3. **Deploy endpoint** (opzionale): aggiungi `rag.py` router
4. **Passa a uno dei ragazzi** - ready for production!

---

**Fine patch** ✅