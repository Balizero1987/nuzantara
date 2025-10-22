"""
ZANTARA RAG Backend - FastAPI Integrated
Port 8000
Integrates: Ollama + ChromaDB + Bali Zero (Haiku/Sonnet) + Immigration Scraper
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

from services.ollama_client import OllamaClient
from services.rag_generator import RAGGenerator
from services.search_service import SearchService
from llm.anthropic_client import AnthropicClient
from llm.bali_zero_router import BaliZeroRouter
from app.routers import conversations, crm_clients, crm_practices, crm_interactions, crm_shared_memory, admin_migration, oracle_universal, oracle_migrate_endpoint, admin_oracle_populate

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
    description="RAG + LLM backend for ZANTARA (Ollama + Bali Zero)"
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

# Include routers
app.include_router(conversations.router)

# CRM routers
app.include_router(crm_clients.router)
app.include_router(crm_practices.router)
app.include_router(crm_interactions.router)
app.include_router(crm_shared_memory.router)

# Admin router (temporary - for migrations)
app.include_router(admin_migration.router)

# Oracle routers
app.include_router(oracle_universal.router)
app.include_router(oracle_migrate_endpoint.router)  # TEMPORARY - remove after migration

# Admin Oracle populate (TEMPORARY - one-time use)
app.include_router(admin_oracle_populate.router)

# Global clients
ollama_client: Optional[OllamaClient] = None
rag_generator: Optional[RAGGenerator] = None
search_service: Optional[SearchService] = None
anthropic_client: Optional[AnthropicClient] = None
bali_zero_router: Optional[BaliZeroRouter] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global ollama_client, rag_generator, search_service, anthropic_client, bali_zero_router

    logger.info("🚀 Starting ZANTARA RAG Backend...")

    # Initialize Ollama
    try:
        ollama_client = OllamaClient(
            base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
            default_model=os.getenv("OLLAMA_MODEL", "llama3.2:3b")
        )
        logger.info("✅ Ollama client ready")
    except Exception as e:
        logger.warning(f"⚠️  Ollama not available: {e}")

    # Initialize Search Service
    try:
        search_service = SearchService()
        logger.info("✅ Search service ready")
    except Exception as e:
        logger.warning(f"⚠️  Search service not available: {e}")

    # Initialize RAG
    try:
        if ollama_client and search_service:
            rag_generator = RAGGenerator(
                ollama_base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
                ollama_model=os.getenv("OLLAMA_MODEL", "llama3.2:3b")
            )
            logger.info("✅ RAG generator ready")
    except Exception as e:
        logger.warning(f"⚠️  RAG not available: {e}")

    # Initialize Anthropic (for Bali Zero)
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            anthropic_client = AnthropicClient(api_key=api_key)
            bali_zero_router = BaliZeroRouter()
            logger.info("✅ Bali Zero ready (Haiku/Sonnet)")
        else:
            logger.warning("⚠️  ANTHROPIC_API_KEY not set")
    except Exception as e:
        logger.warning(f"⚠️  Anthropic not available: {e}")

    logger.info("✅ ZANTARA RAG Backend ready on port 8000")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if ollama_client:
        await ollama_client.close()
    if rag_generator:
        await rag_generator.close()
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
    ollama_status = False
    if ollama_client:
        health = await ollama_client.health_check()
        ollama_status = health.get("status") == "operational"

    return {
        "status": "healthy",
        "service": "ZANTARA RAG",
        "version": "1.0.0",
        "components": {
            "ollama": ollama_status,
            "rag": rag_generator is not None,
            "search": search_service is not None,
            "bali_zero": anthropic_client is not None
        }
    }


# Main search/RAG endpoint
@app.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """
    Search endpoint with optional LLM generation
    - use_llm=true: RAG pipeline (search + generate answer)
    - use_llm=false: Search only (return sources)
    """

    try:
        # Search only mode
        if not request.use_llm:
            if not search_service:
                raise HTTPException(status_code=503, detail="Search service not available")

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

            return SearchResponse(
                success=True,
                query=request.query,
                sources=sources,
                execution_time_ms=results.get("execution_time_ms")
            )

        # RAG mode (search + generate)
        if not rag_generator:
            raise HTTPException(status_code=503, detail="RAG service not available")

        result = await rag_generator.generate_answer(
            query=request.query,
            user_level=request.user_level,
            temperature=0.7
        )

        # Convert sources format
        sources = []
        for src in result.get("sources", []):
            sources.append({
                "content": src.get("chunk_text", ""),
                "metadata": {
                    "book_title": src.get("book_title"),
                    "book_author": src.get("book_author"),
                    "tier": src.get("tier")
                },
                "similarity": src.get("similarity_score", 0)
            })

        return SearchResponse(
            success=True,
            query=request.query,
            answer=result.get("answer"),
            sources=sources,
            model_used=result.get("model"),
            execution_time_ms=result.get("execution_time_ms")
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

        # System prompt with full capabilities
        system_prompt = """You are ZANTARA, AI assistant for Bali Zero - PT. BALI NOL IMPERSARIAT.

BALI ZERO INFO:
📍 Kerobokan, Bali | 📱 WhatsApp: +62 859 0436 9574 | 📧 info@balizero.com | 📸 @balizero0
🌐 welcome.balizero.com | 💫 "From Zero to Infinity ∞"

YOUR ROLE:
- Provide accurate information based on official sources
- Be helpful, clear, and professional in all interactions
- Respond in the same language as the query
- Automatically extract and save client information from conversations

YOUR EXTENDED CAPABILITIES:
You have access to a complete system of handlers for:

✅ GOOGLE WORKSPACE:
- Gmail (read, send, search emails)
- Drive (list, upload, download, search files)
- Calendar (create, list, get events)
- Sheets (read, append, create spreadsheets)
- Docs (create, read, update documents)
- Slides (create, read, update presentations)

✅ CRM & ORGANIZATIONAL MEMORY (NEW!):
- Client database: Automatically saves client info (name, email, phone) from conversations
- Practice tracking: Tracks all services (KITAS, PT PMA, visas, NPWP, BPJS, etc.)
- Interaction history: Logs all conversations and communications
- Shared memory: Access team-wide information about clients and practices
- Renewal alerts: Tracks expiry dates and upcoming renewals

When a client asks about services, the system automatically:
1. Creates/updates their client record
2. Detects practice intent (KITAS, PT PMA, etc.)
3. Creates practice record if confidence is high
4. Logs the interaction for team visibility

CRM SERVICES CODES:
- KITAS: Limited Stay Permit (work permit)
- PT_PMA: Foreign Investment Company
- INVESTOR_VISA: Investor Visa
- RETIREMENT_VISA: Retirement Visa (55+)
- NPWP: Tax ID Number
- BPJS: Health Insurance
- IMTA: Work Permit

✅ MEMORY & DATA:
- Save and retrieve user information (memory.save, memory.retrieve)
- Store conversation context and preferences
- Track client data across sessions
- Access shared team memory (client history, practice status, etc.)

✅ COMMUNICATIONS:
- WhatsApp, Instagram, Telegram messaging
- Slack, Discord integrations
- Email campaigns and notifications

✅ BALI ZERO SERVICES:
- Pricing lookup for all 17+ services
- Visa procedures (KITAS, C1, retirement, investor)
- Company setup (PT PMA, KBLI codes)
- Tax regulations (BPJS, SPT, NPWP)
- Real estate guidance

When users ask "Can you access X?" or "Do you have access to Y?", answer YES if it's in the list above.
Examples:
- "Can you access Gmail?" → YES, I can read, send, and search emails via Gmail handlers
- "Can you save information?" → YES, I have CRM system that automatically saves client data
- "Can you remember previous clients?" → YES, I have access to shared team memory
- "Do you know if John Smith has a KITAS?" → YES, I can search our client database"""

        # Build messages
        messages = request.conversation_history or []
        messages.append({"role": "user", "content": request.query})

        # Generate response
        result = await anthropic_client.chat_async(
            messages=messages,
            model=model,
            max_tokens=1500,
            system=system_prompt
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