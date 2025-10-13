from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ChatRequest, ChatResponse
from rag_service import RAGService
import logging

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# App
app = FastAPI(
    title="Zantara RAG API",
    version="3.0.0-clean",
    description="Clean RAG backend - Minimal dependencies, maximum reliability"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service (will be set on startup)
rag_service = None

@app.on_event("startup")
async def startup_event():
    """Initialize RAG service on startup"""
    global rag_service
    try:
        logger.info("🚀 Starting Zantara RAG Backend...")
        rag_service = RAGService()
        logger.info("✅ Zantara RAG Backend ready on port 8000")
    except Exception as e:
        logger.error(f"❌ Failed to initialize RAG service: {e}")
        raise

@app.get("/")
def root():
    return {
        "service": "Zantara RAG API",
        "version": "3.0.0-clean",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    """Health check endpoint"""
    if not rag_service:
        return {
            "status": "unhealthy",
            "error": "RAG service not initialized"
        }

    try:
        # Check ChromaDB (optional)
        kb_chunks = 0
        rag_available = False
        if rag_service.collection:
            kb_chunks = rag_service.collection.count()
            rag_available = kb_chunks > 0

        return {
            "status": "healthy",
            "kb_chunks": kb_chunks,
            "rag_available": rag_available,
            "llm_available": True,
            "mode": "RAG" if rag_available else "Pure LLM"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "error": str(e)
        }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint

    Request:
    - message: User message
    - conversation_history: Previous messages (optional)
    - use_rag: Use RAG context (default: true)
    - model: 'haiku' or 'sonnet' (default: 'haiku')

    Response:
    - response: AI response
    - sources: Retrieved chunks (if use_rag=true)
    """
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service not available")

    try:
        logger.info(f"📨 Chat request: {request.message[:50]}...")

        response_text, sources = rag_service.generate_response(
            query=request.message,
            conversation_history=[msg.dict() for msg in request.conversation_history],
            use_rag=request.use_rag,
            model=request.model
        )

        return ChatResponse(
            response=response_text,
            sources=sources if request.use_rag else None
        )

    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)