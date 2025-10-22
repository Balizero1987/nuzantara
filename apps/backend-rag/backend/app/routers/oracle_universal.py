"""
ORACLE UNIVERSAL API Router (Phase 3)
Single intelligent endpoint that routes to appropriate Oracle collection automatically

Replaces 22 individual endpoints with 1 universal endpoint:
- POST /api/oracle/query - Universal query endpoint

Benefits:
- 91% reduction in API surface (22 → 1)
- Automatic intelligent routing via QueryRouter
- Simplified frontend integration
- Single source of truth for Oracle queries
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal, TYPE_CHECKING
from datetime import datetime
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from services.search_service import SearchService
from app.dependencies import get_search_service, get_anthropic_client

# Type checking only - anthropic_client not available at runtime
if TYPE_CHECKING:
    from typing import Any as AnthropicClient
else:
    AnthropicClient = Any

router = APIRouter(prefix="/api/oracle", tags=["Oracle UNIVERSAL"])


# ========================================
# Request/Response Models
# ========================================

class OracleQueryRequest(BaseModel):
    """Universal Oracle query request"""
    query: str = Field(..., description="Natural language query", min_length=3)

    # Optional context
    domain_hint: Optional[Literal["tax", "legal", "property", "visa", "kbli"]] = Field(
        None,
        description="Optional domain hint to guide routing (usually not needed)"
    )
    user_role: str = Field("member", description="User role for access control")
    conversation_history: Optional[List[Dict[str, str]]] = Field(
        None,
        description="Previous conversation for context"
    )

    # Response options
    use_ai: bool = Field(
        True,
        description="Use AI to generate natural language answer from results"
    )
    limit: int = Field(10, ge=1, le=50, description="Max number of results")
    include_routing_info: bool = Field(
        True,
        description="Include routing decision details in response"
    )


class OracleResult(BaseModel):
    """Single result from Oracle search"""
    content: str
    metadata: Dict[str, Any]
    relevance: float = Field(..., ge=0, le=1)
    source_collection: str


class OracleQueryResponse(BaseModel):
    """Universal Oracle query response"""
    success: bool
    query: str

    # Routing information (transparent AI decision)
    collection_used: str = Field(..., description="Which collection was searched")
    routing_reason: Optional[str] = Field(
        None,
        description="Human-readable explanation of routing decision"
    )
    domain_scores: Optional[Dict[str, int]] = Field(
        None,
        description="Keyword match scores for each domain"
    )

    # Results
    results: List[OracleResult]
    total_results: int

    # AI-generated answer (optional)
    answer: Optional[str] = Field(
        None,
        description="Natural language answer generated from results"
    )
    model_used: Optional[str] = Field(None, description="AI model used for answer")

    # Performance metrics
    execution_time_ms: Optional[float]

    # Error handling
    error: Optional[str] = None


# ========================================
# UNIVERSAL ENDPOINT
# ========================================

@router.post("/query", response_model=OracleQueryResponse)
async def universal_oracle_query(
    request: OracleQueryRequest,
    service: SearchService = Depends(get_search_service),
    anthropic: Optional[AnthropicClient] = Depends(get_anthropic_client)
):
    """
    Universal Oracle query endpoint - Phase 3 Intelligent API

    This single endpoint automatically:
    1. Routes query to appropriate collection (tax_updates, property_listings, etc.)
    2. Searches the collection using semantic search
    3. Optionally generates AI answer from results

    **Example Queries:**
    - "Latest tax updates for 2025?" → tax_updates
    - "Villas for sale in Canggu" → property_listings
    - "How to calculate PPh 21?" → tax_knowledge
    - "New PT PMA regulations" → legal_updates

    **Benefits:**
    - No need to know which endpoint to call
    - Automatic intelligent routing
    - Consistent response format
    - Single integration point

    **Backward Compatibility:**
    - Old 22 endpoints still work (deprecated)
    - Migrate to this endpoint at your convenience
    """

    import time
    start_time = time.time()

    try:
        # Get routing statistics for transparency
        routing_stats = service.router.get_routing_stats(request.query)
        collection_used = routing_stats["selected_collection"]

        # Check if collection exists in SearchService
        if collection_used not in service.collections:
            raise HTTPException(
                status_code=500,
                detail=f"Collection '{collection_used}' not found in SearchService. "
                       f"Available: {list(service.collections.keys())}"
            )

        # Override collection if domain_hint provided
        if request.domain_hint:
            # Map domain hints to preferred collections
            domain_map = {
                "tax": "tax_knowledge",
                "legal": "legal_architect",
                "property": "property_knowledge",
                "visa": "visa_oracle",
                "kbli": "kbli_eye"
            }
            if request.domain_hint in domain_map:
                collection_used = domain_map[request.domain_hint]
                routing_stats["selected_collection"] = collection_used

        # Perform semantic search using SearchService
        # SearchService.search() already uses QueryRouter, but we override here for control
        vector_db = service.collections[collection_used]

        # Search the collection
        search_results = vector_db.search(
            query_text=request.query,
            limit=request.limit
        )

        # Format results
        results = []
        for i, doc in enumerate(search_results.get("documents", [])):
            metadata = search_results.get("metadatas", [])[i] if i < len(search_results.get("metadatas", [])) else {}
            distance = search_results.get("distances", [])[i] if i < len(search_results.get("distances", [])) else 1.0

            # Calculate relevance score (0-1, higher is better)
            relevance = 1 / (1 + distance)

            results.append(OracleResult(
                content=doc,
                metadata=metadata,
                relevance=round(relevance, 4),
                source_collection=collection_used
            ))

        # Generate AI answer if requested
        answer = None
        model_used = None

        if request.use_ai and results and anthropic:
            # Build context from top results
            context_parts = []
            for i, result in enumerate(results[:5], 1):
                content = result.content[:500]  # Limit context size
                context_parts.append(f"[Source {i}]: {content}")

            context = "\n\n".join(context_parts)

            # System prompt for Oracle
            system_prompt = f"""You are ZANTARA Oracle, an expert AI assistant specialized in Indonesian business services.

You have access to knowledge from the {collection_used} collection.

Provide accurate, helpful answers based on the context below. If the context doesn't contain enough information, say so clearly.

Always cite your sources and be transparent about limitations."""

            # Generate answer with Anthropic
            messages = [
                {
                    "role": "user",
                    "content": f"""Based on the following context, answer the question.

Context from {collection_used}:
{context}

Question: {request.query}

Provide a clear, concise answer based on the context above. If you need more information, ask clarifying questions."""
                }
            ]

            # Use Haiku for speed (can upgrade to Sonnet for complex queries)
            model = "haiku"

            response = await anthropic.chat_async(
                messages=messages,
                model=model,
                max_tokens=1000,
                system=system_prompt
            )

            if response["success"]:
                answer = response["text"]
                model_used = model

        # Calculate execution time
        execution_time_ms = round((time.time() - start_time) * 1000, 2)

        # Build routing reason
        routing_reason = f"Routed to {collection_used} based on keyword analysis"
        if routing_stats.get("total_matches", 0) > 0:
            top_domain = max(routing_stats["domain_scores"], key=routing_stats["domain_scores"].get)
            top_score = routing_stats["domain_scores"][top_domain]
            routing_reason = f"Detected {top_domain} domain (score={top_score}), routed to {collection_used}"

        return OracleQueryResponse(
            success=True,
            query=request.query,
            collection_used=collection_used,
            routing_reason=routing_reason if request.include_routing_info else None,
            domain_scores=routing_stats["domain_scores"] if request.include_routing_info else None,
            results=results,
            total_results=len(results),
            answer=answer,
            model_used=model_used,
            execution_time_ms=execution_time_ms
        )

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Universal Oracle query error: {e}", exc_info=True)

        return OracleQueryResponse(
            success=False,
            query=request.query,
            collection_used="error",
            results=[],
            total_results=0,
            error=str(e)
        )


# ========================================
# METADATA ENDPOINT
# ========================================

@router.get("/collections")
async def get_available_collections(
    service: SearchService = Depends(get_search_service)
):
    """
    Get list of available Oracle collections

    Useful for understanding what domains are covered
    """
    return {
        "success": True,
        "collections": list(service.collections.keys()),
        "total": len(service.collections),
        "oracle_collections": [
            "tax_updates",
            "tax_knowledge",
            "property_listings",
            "property_knowledge",
            "legal_updates"
        ],
        "description": {
            "tax_updates": "Recent tax regulation updates and announcements",
            "tax_knowledge": "General tax knowledge base (rates, procedures, compliance)",
            "property_listings": "Property listings (for sale, for rent)",
            "property_knowledge": "Property ownership, structures, regulations",
            "legal_updates": "Recent legal and regulatory updates",
            "legal_architect": "Legal structures (PT PMA, company setup, etc.)",
            "visa_oracle": "Visa and immigration information",
            "kbli_eye": "Business classification codes (KBLI)",
            "zantara_books": "General knowledge base (philosophy, tech, culture)"
        }
    }


@router.get("/routing/test")
async def test_routing(
    query: str,
    service: SearchService = Depends(get_search_service)
):
    """
    Test routing for a query without executing search

    Useful for debugging and understanding routing decisions
    """
    routing_stats = service.router.get_routing_stats(query)

    return {
        "success": True,
        "query": query,
        "would_route_to": routing_stats["selected_collection"],
        "domain_scores": routing_stats["domain_scores"],
        "modifier_scores": routing_stats["modifier_scores"],
        "matched_keywords": {
            domain: keywords[:5]  # Show first 5 matches only
            for domain, keywords in routing_stats["matched_keywords"].items()
            if keywords
        },
        "total_matches": routing_stats["total_matches"]
    }
