"""
ZANTARA RAG Backend - FastAPI
Port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from services.ollama_client import OllamaClient
from services.rag_generator import RAGGenerator
from llm.anthropic_client import AnthropicClient
from llm.bali_zero_router import BaliZeroRouter

# Initialize FastAPI
app = FastAPI(
    title="ZANTARA RAG API",
    version="1.0.0",
    description="RAG + LLM backend for ZANTARA"
)

# CORS - permetti chiamate dal backend TypeScript
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # TypeScript backend
        "https://zantara.balizero.com",  # Frontend
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global clients
ollama_client: Optional[OllamaClient] = None
rag_generator: Optional[RAGGenerator] = None
anthropic_client: Optional[AnthropicClient] = None
bali_zero_router: Optional[BaliZeroRouter] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global ollama_client, rag_generator, anthropic_client, bali_zero_router

    print("🚀 Starting ZANTARA RAG Backend...")

    # Initialize Ollama
    try:
        ollama_client = OllamaClient()
        print("✅ Ollama client ready")
    except Exception as e:
        print(f"⚠️  Ollama not available: {e}")

    # Initialize RAG
    try:
        rag_generator = RAGGenerator(ollama_client=ollama_client)
        print("✅ RAG generator ready")
    except Exception as e:
        print(f"⚠️  RAG not available: {e}")

    # Initialize Anthropic (for Bali Zero)
    try:
        anthropic_client = AnthropicClient()
        bali_zero_router = BaliZeroRouter()
        print("✅ Bali Zero ready (Haiku/Sonnet)")
    except Exception as e:
        print(f"⚠️  Anthropic not available: {e}")

    print("✅ ZANTARA RAG Backend ready on port 8000")


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
        "service": "ZANTARA RAG",
        "version": "1.0.0",
        "ollama": ollama_client is not None,
        "rag": rag_generator is not None,
        "bali_zero": anthropic_client is not None
    }


# RAG endpoint (Ollama)
@app.post("/rag/generate", response_model=RAGQueryResponse)
async def rag_generate(request: RAGQueryRequest):
    """
    Generate answer using RAG + Ollama
    Main endpoint for standard queries
    """

    if not rag_generator:
        raise HTTPException(status_code=503, detail="RAG service not available")

    try:
        result = await rag_generator.generate(
            query=request.query,
            k=request.k,
            use_llm=request.use_llm
        )

        return RAGQueryResponse(
            success=True,
            query=request.query,
            answer=result.get("answer"),
            sources=result.get("sources", []),
            model_used="llama3.2:3b"
        )

    except Exception as e:
        return RAGQueryResponse(
            success=False,
            query=request.query,
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
        raise HTTPException(status_code=503, detail="Bali Zero not available")

    try:
        # Router decides model
        model = bali_zero_router.route(
            query=request.query,
            conversation_history=request.conversation_history,
            user_role=request.user_role
        )

        # Generate response
        messages = request.conversation_history or []
        messages.append({"role": "user", "content": request.query})

        result = anthropic_client.chat(
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
        raise HTTPException(status_code=500, detail=str(e))


# Simple search (no LLM generation)
@app.post("/search")
async def search(request: RAGQueryRequest):
    """Search only, no LLM generation"""

    if not rag_generator:
        raise HTTPException(status_code=503, detail="RAG service not available")

    try:
        result = await rag_generator.generate(
            query=request.query,
            k=request.k,
            use_llm=False
        )

        return {
            "success": True,
            "query": request.query,
            "sources": result.get("sources", [])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)