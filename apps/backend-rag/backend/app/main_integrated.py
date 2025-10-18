"""
ZANTARA RAG Backend - FastAPI Integrated
Port 8000
Integrates: ChromaDB + Bali Zero (Haiku/Sonnet) + Immigration Scraper
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import sys
import os
from pathlib import Path
import logging

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from services.search_service import SearchService
from llm.anthropic_client import AnthropicClient
from llm.bali_zero_router import BaliZeroRouter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="1.0.0",
    description="RAG + LLM backend for ZANTARA (ChromaDB + Anthropic)"
)

# CORS - allow calls from TypeScript backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # TypeScript backend
        "https://zantara.balizero.com",  # Frontend
        "http://127.0.0.1:8080",
        "https://balizero1987.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global clients
search_service: Optional[SearchService] = None
anthropic_client: Optional[AnthropicClient] = None
bali_zero_router: Optional[BaliZeroRouter] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global search_service, anthropic_client, bali_zero_router

    logger.info("🚀 Starting ZANTARA RAG Backend (ChromaDB + Anthropic)...")

    # Initialize Search Service
    try:
        search_service = SearchService()
        logger.info("✅ ChromaDB search service ready")
    except Exception as e:
        logger.error(f"❌ Search service failed: {e}")
        raise

    # Initialize Anthropic (required)
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        anthropic_client = AnthropicClient(api_key=api_key)
        bali_zero_router = BaliZeroRouter()
        logger.info("✅ Anthropic client ready (Haiku/Sonnet routing)")
    except Exception as e:
        logger.error(f"❌ Anthropic initialization failed: {e}")
        raise

    logger.info("✅ ZANTARA RAG Backend ready on port 8000")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 ZANTARA RAG Backend shutdown")


# Pydantic models
class SearchRequest(BaseModel):
    query: str
    k: int = 5
    use_llm: bool = True
    user_level: int = 3
    conversation_history: Optional[List[Dict]] = None


class SearchResponse(BaseModel):
    success: bool
    query: str
    answer: Optional[str] = None
    sources: List[Dict] = []
    model_used: Optional[str] = None
    execution_time_ms: Optional[float] = None
    error: Optional[str] = None


class BaliZeroRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Dict]] = None
    user_role: str = "member"


class BaliZeroResponse(BaseModel):
    success: bool
    response: str
    model_used: str
    sources: List[Dict] = []
    usage: Optional[Dict] = None


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZANTARA RAG",
        "version": "2.0.0",
        "backend": "ChromaDB + Anthropic",
        "components": {
            "chromadb": search_service is not None,
            "anthropic": anthropic_client is not None,
            "router": bali_zero_router is not None
        }
    }


# Main search/RAG endpoint
@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """
    Search endpoint with optional LLM generation
    - use_llm=true: RAG pipeline (ChromaDB search + Anthropic generation)
    - use_llm=false: Search only (return sources)
    """

    if not search_service:
        raise HTTPException(status_code=503, detail="ChromaDB search service not available")

    try:
        # Perform ChromaDB search
        results = await search_service.search(
            query=request.query,
            user_level=request.user_level,
            limit=request.k
        )

        # Format sources
        sources = []
        if results["results"].get("documents"):
            for idx, doc in enumerate(results["results"]["documents"]):
                metadata = results["results"]["metadatas"][idx]
                distance = results["results"]["distances"][idx]
                sources.append({
                    "content": doc,
                    "metadata": metadata,
                    "similarity": round(1 / (1 + distance), 4)
                })

        # Search only mode - return sources without LLM
        if not request.use_llm:
            return SearchResponse(
                success=True,
                query=request.query,
                sources=sources,
                execution_time_ms=results.get("execution_time_ms")
            )

        # RAG mode - use Anthropic to generate answer from sources
        if not anthropic_client:
            raise HTTPException(status_code=503, detail="Anthropic client not available")

        # Build context from top sources
        context_parts = []
        for i, source in enumerate(sources[:5], 1):
            content = source["content"][:500]  # Limit context size
            context_parts.append(f"[Source {i}]: {content}")

        context = "\n\n".join(context_parts)

        # Generate answer with Anthropic
        messages = [
            {
                "role": "user",
                "content": f"""Based on the following context, answer the question.

Context:
{context}

Question: {request.query}

Provide a clear, concise answer based on the context above."""
            }
        ]

        # Use router to decide Haiku vs Sonnet
        model = bali_zero_router.route(
            query=request.query,
            conversation_history=request.conversation_history,
            user_role="member"
        ) if bali_zero_router else "haiku"

        response = await anthropic_client.chat_async(
            messages=messages,
            model=model,
            max_tokens=1000
        )

        if not response["success"]:
            raise Exception(response.get("error", "Anthropic generation failed"))

        return SearchResponse(
            success=True,
            query=request.query,
            answer=response["text"],
            sources=sources,
            model_used=model,
            execution_time_ms=results.get("execution_time_ms")
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            sources=[],
            error=str(e)
        )


# Bali Zero endpoint (Haiku/Sonnet)
@app.post("/bali-zero/chat", response_model=BaliZeroResponse)
async def bali_zero_chat(request: BaliZeroRequest):
    """
    Bali Zero chat endpoint
    Uses intelligent routing: Haiku (80%) or Sonnet (20%)
    Specialized for immigration/visa queries
    """

    if not anthropic_client or not bali_zero_router:
        raise HTTPException(
            status_code=503,
            detail="Bali Zero not available. Set ANTHROPIC_API_KEY environment variable."
        )

    try:
        # Router decides model based on complexity
        model = bali_zero_router.route(
            query=request.query,
            conversation_history=request.conversation_history,
            user_role=request.user_role
        )

        # Build messages
        messages = request.conversation_history or []
        messages.append({"role": "user", "content": request.query})

        # Generate response
        result = await anthropic_client.chat_async(
            messages=messages,
            model=model,
            max_tokens=1500
        )

        if not result["success"]:
            raise Exception(result.get("error", "Unknown error"))

        return BaliZeroResponse(
            success=True,
            response=result["text"],
            model_used=model,
            sources=[],  # TODO: integrate ChromaDB immigration KB
            usage=result.get("usage", {})
        )

    except Exception as e:
        logger.error(f"Bali Zero error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ZANTARA RAG System",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "search": "/search (POST)",
            "bali_zero": "/bali-zero/chat (POST)"
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )