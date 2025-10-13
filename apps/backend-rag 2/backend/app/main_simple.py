"""
FastAPI RAG Backend - Simple Version for Cloud Run
Supports Bali Zero intelligent routing (Haiku/Sonnet)
+ Official Bali Zero Pricing Service (NO AI GENERATION)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import sys
from pathlib import Path

# Add services directory to path
services_path = Path(__file__).parent.parent / "services"
if str(services_path) not in sys.path:
    sys.path.insert(0, str(services_path))

# Import pricing service
PRICING_AVAILABLE = False
try:
    from pricing_service import (
        get_pricing_service,
        get_all_prices,
        search_service as search_pricing,
        get_visa_prices,
        get_kitas_prices,
        get_business_prices,
        get_tax_prices,
        get_pricing_context_for_llm
    )
    PRICING_AVAILABLE = True
    print(" Pricing service loaded successfully")
except Exception as e:
    print(f"  WARNING: Pricing service not available: {e}")
    PRICING_AVAILABLE = False

app = FastAPI(
    title="ZANTARA RAG Backend",
    version="1.0.0",
    description="RAG backend with ChromaDB + Anthropic Claude + Official Bali Zero Pricing"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class QueryRequest(BaseModel):
    query: str
    k: int = 5
    use_llm: bool = True
    conversation_history: Optional[List[Dict[str, str]]] = None


class SearchRequest(BaseModel):
    query: str
    k: int = 5


class PricingSearchRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ZANTARA RAG Backend",
        "version": "1.0.0",
        "features": {
            "rag": False,  # ChromaDB not loaded in simple version
            "pricing": PRICING_AVAILABLE,
            "llm": bool(os.getenv("ANTHROPIC_API_KEY"))
        }
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ZANTARA RAG Backend",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "pricing": {
                "all": "/pricing/all",
                "search": "/pricing/search (POST)",
                "visa": "/pricing/visa",
                "kitas": "/pricing/kitas",
                "business": "/pricing/business",
                "tax": "/pricing/tax"
            },
            "rag": {
                "query": "/query (POST)",
                "search": "/search (POST)",
                "bali_zero_chat": "/bali-zero/chat (POST)"
            }
        },
        "status": "online"
    }


# ===============================
# PRICING ENDPOINTS (Official Bali Zero Prices)
# ===============================

@app.get("/pricing/all")
async def get_all_pricing():
    """Get all official Bali Zero prices"""
    if not PRICING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Pricing service not available. Contact info@balizero.com"
        )

    try:
        prices = get_all_prices()
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/pricing/search")
async def search_pricing_service(request: PricingSearchRequest):
    """Search for a specific service by name or keyword"""
    if not PRICING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Pricing service not available. Contact info@balizero.com"
        )

    try:
        results = search_pricing(request.query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pricing/visa")
async def get_visa_pricing():
    """Get all visa prices (single entry + multiple entry)"""
    if not PRICING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Pricing service not available. Contact info@balizero.com"
        )

    try:
        prices = get_visa_prices()
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pricing/kitas")
async def get_kitas_pricing():
    """Get all KITAS prices"""
    if not PRICING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Pricing service not available. Contact info@balizero.com"
        )

    try:
        prices = get_kitas_prices()
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pricing/business")
async def get_business_pricing():
    """Get business & legal service prices"""
    if not PRICING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Pricing service not available. Contact info@balizero.com"
        )

    try:
        prices = get_business_prices()
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pricing/tax")
async def get_tax_pricing():
    """Get taxation service prices"""
    if not PRICING_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Pricing service not available. Contact info@balizero.com"
        )

    try:
        prices = get_tax_prices()
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# RAG ENDPOINTS (Placeholder - will be implemented later)
# ===============================

@app.post("/query")
async def rag_query(request: QueryRequest):
    """RAG query with LLM response (placeholder)"""
    # Placeholder - ChromaDB not loaded in simple version
    return {
        "success": False,
        "query": request.query,
        "answer": "RAG query not implemented in simple version",
        "sources": [],
        "note": "Use /pricing/* endpoints for official Bali Zero prices"
    }


@app.post("/search")
async def rag_search(request: SearchRequest):
    """Semantic search without LLM (placeholder)"""
    # Placeholder - ChromaDB not loaded in simple version
    return {
        "success": False,
        "query": request.query,
        "results": [],
        "note": "Use /pricing/search endpoint for official Bali Zero service search"
    }


@app.post("/bali-zero/chat")
async def bali_zero_chat(request: QueryRequest):
    """
    Bali Zero intelligent chat with Haiku/Sonnet routing
    NOW WITH OFFICIAL PRICING INTEGRATION
    """

    if not PRICING_AVAILABLE:
        return {
            "success": False,
            "error": "Pricing service not available",
            "fallback_contact": {
                "email": "info@balizero.com",
                "whatsapp": "+62 813 3805 1876"
            }
        }

    try:
        # STEP 1: Pre-filter for simple greetings (skip RAG)
        query_lower = request.query.lower().strip()
        
        # Simple greetings - return immediately without RAG
        simple_greetings = ['ciao', 'hello', 'hi', 'hey', 'buongiorno', 'buonasera', 'halo', 'salut']
        if query_lower in simple_greetings:
            return {
                "success": True,
                "response": "Ciao! Come posso aiutarti oggi con Bali Zero? 😊\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com",
                "model_used": "built-in-greeting",
                "sources": [],
                "usage": {"input_tokens": 0, "output_tokens": 0}
            }
        
        # Casual questions - return immediately without RAG
        casual_patterns = ['come stai', 'how are you', 'tutto bene', 'come va', "how's it going", 'apa kabar']
        if any(pattern in query_lower for pattern in casual_patterns):
            return {
                "success": True,
                "response": "Sto benissimo, grazie! 😊 Pronta ad assisterti con visti, KITAS, PT PMA e business in Indonesia. Cosa ti serve?\n\nPer assistenza diretta: WhatsApp +62 859 0436 9574 o info@balizero.com",
                "model_used": "built-in-casual",
                "sources": [],
                "usage": {"input_tokens": 0, "output_tokens": 0}
            }
        
        # STEP 2: Detect if query is about pricing (IMPROVED DETECTOR)
        query_lower = request.query.lower()

        # Expanded keywords for better detection
        price_keywords = [
            'harga', 'biaya', 'berapa', 'price', 'cost', 'tarif', 'fee', 'quote',
            'quanto', 'how much', 'combien', 'cuanto', 'quanto costa', 'ongkos',
            'bayar', 'payment', 'pay', 'budget', 'estimate', 'pricing'
        ]

        service_keywords = [
            'visa', 'kitas', 'kitap', 'pt', 'pma', 'npwp', 'bpjs', 'company', 'tax', 'pajak',
            'e33g', 'e33', 'c1', 'c2', 'c7', 'c18', 'c22', 'remote', 'digital nomad',
            'business', 'tourism', 'investor', 'retirement', 'spouse', 'limited', 'perusahaan',
            'setup', 'incorporation', 'accounting', 'bookkeeping', 'imb', 'oss-rba', 'nib'
        ]

        # More flexible matching
        is_pricing_query = any(word in query_lower for word in price_keywords)
        is_service_query = any(word in query_lower for word in service_keywords)

        # Also detect if query contains numbers (likely asking about specific service)
        has_service_code = any(code in query_lower for code in ['e33', 'c1', 'c2', 'c7', 'c18', 'c22'])

        if is_pricing_query and is_service_query or has_service_code:
            # This is a pricing question - search pricing database
            pricing_results = search_pricing(request.query)

            return {
                "success": True,
                "query": request.query,
                "answer": "= OFFICIAL BALI ZERO PRICES 2025",
                "pricing_results": pricing_results,
                "sources": ["Official Bali Zero Price List 2025"],
                "model": "pricing_service",
                "note": "These are OFFICIAL prices - not AI generated"
            }

        else:
            # General query - would use RAG + LLM (not implemented in simple version)
            return {
                "success": False,
                "query": request.query,
                "answer": "General chat not implemented in simple version. For pricing questions, ask about specific services (visa, KITAS, company setup, tax).",
                "sources": [],
                "note": "Pricing queries are supported. Try asking 'How much is E33G visa?'"
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
