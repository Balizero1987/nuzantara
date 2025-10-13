"""
ZANTARA RAG Backend - FastAPI Simple
Port 8000
Minimal version without complex RAG dependencies
Focus on Bali Zero (Haiku/Sonnet) functionality
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

# Import only what we need - no circular dependencies
try:
    from llm.anthropic_client import AnthropicClient
    from llm.bali_zero_router import BaliZeroRouter
    ANTHROPIC_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Anthropic not available: {e}")
    ANTHROPIC_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="1.0.0-simple",
    description="Simplified RAG backend (Bali Zero only)"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://zantara.balizero.com",
        "http://127.0.0.1:8080",
        "https://balizero1987.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global clients
anthropic_client: Optional[AnthropicClient] = None
bali_zero_router: Optional[BaliZeroRouter] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global anthropic_client, bali_zero_router

    logger.info("🚀 Starting ZANTARA RAG Backend (Simple Mode)...")

    # Initialize Anthropic (for Bali Zero)
    if ANTHROPIC_AVAILABLE:
        try:
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if api_key:
                anthropic_client = AnthropicClient(api_key=api_key)
                bali_zero_router = BaliZeroRouter()
                logger.info("✅ Bali Zero ready (Haiku/Sonnet)")
            else:
                logger.warning("⚠️  ANTHROPIC_API_KEY not set")
        except Exception as e:
            logger.warning(f"⚠️  Anthropic initialization failed: {e}")

    logger.info("✅ ZANTARA RAG Backend ready on port 8000 (Simple Mode)")


# Pydantic models
class RAGQueryRequest(BaseModel):
    query: str
    k: int = 5
    use_llm: bool = True
    conversation_history: Optional[List[Dict]] = None


class RAGQueryResponse(BaseModel):
    success: bool
    query: str
    answer: Optional[str] = None
    sources: List[Dict] = []
    model_used: Optional[str] = None
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
        "service": "ZANTARA RAG Simple",
        "version": "1.0.0-simple",
        "components": {
            "bali_zero": anthropic_client is not None,
            "rag": False,  # Not available in simple mode
            "ollama": False  # Not available in simple mode
        }
    }


# RAG endpoint (returns error - not available in simple mode)
@app.post("/rag/generate", response_model=RAGQueryResponse)
async def rag_generate(request: RAGQueryRequest):
    """RAG not available in simple mode"""
    return RAGQueryResponse(
        success=False,
        query=request.query,
        sources=[],
        error="RAG not available in simple mode. Use Bali Zero endpoint instead."
    )


# Bali Zero endpoint (Main functionality)
@app.post("/bali-zero/chat", response_model=BaliZeroResponse)
async def bali_zero_chat(request: BaliZeroRequest):
    """
    Bali Zero chat endpoint
    Uses intelligent routing: Haiku (80%) or Sonnet (20%)
    """

    if not anthropic_client or not bali_zero_router:
        raise HTTPException(
            status_code=503,
            detail="Bali Zero not available. Set ANTHROPIC_API_KEY environment variable."
        )

    try:
        # Router decides model
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
            sources=[],
            usage=result.get("usage", {})
        )

    except Exception as e:
        logger.error(f"Bali Zero error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Search endpoint (not available in simple mode)
@app.post("/search")
async def search(request: RAGQueryRequest):
    """Search not available in simple mode"""
    return {
        "success": False,
        "query": request.query,
        "sources": [],
        "error": "Search not available in simple mode."
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ZANTARA RAG System (Simple Mode)",
        "version": "1.0.0-simple",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "bali_zero": "/bali-zero/chat (POST) - AVAILABLE",
            "rag": "/rag/generate (POST) - NOT AVAILABLE",
            "search": "/search (POST) - NOT AVAILABLE"
        },
        "note": "This is the simplified version. Full RAG requires complex dependencies."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")