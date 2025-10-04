"""
ZANTARA RAG - Pydantic Models
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class TierLevel(str, Enum):
    """Book tier classifications"""
    S = "S"  # Supreme - Quantum physics, consciousness, advanced metaphysics
    A = "A"  # Advanced - Philosophy, psychology, spiritual teachings
    B = "B"  # Intermediate - History, culture, practical wisdom
    C = "C"  # Basic - Self-help, business, general knowledge
    D = "D"  # Public - Popular science, introductory texts


class AccessLevel(int, Enum):
    """User access levels"""
    LEVEL_0 = 0  # Only Tier S
    LEVEL_1 = 1  # Tiers S + A
    LEVEL_2 = 2  # Tiers S + A + B + C
    LEVEL_3 = 3  # All tiers


class ChunkMetadata(BaseModel):
    """Metadata for each text chunk"""
    book_title: str
    book_author: str
    tier: TierLevel
    min_level: int = Field(ge=0, le=3)
    chunk_index: int
    page_number: Optional[int] = None
    language: str = "en"
    topics: List[str] = Field(default_factory=list)
    file_path: str
    total_chunks: int


class SearchQuery(BaseModel):
    """Search request model"""
    query: str = Field(..., min_length=1, description="Search query text")
    level: int = Field(0, ge=0, le=3, description="User access level (0-3)")
    limit: int = Field(5, ge=1, le=50, description="Maximum results to return")
    tier_filter: Optional[List[TierLevel]] = Field(None, description="Filter by specific tiers")


class SearchResult(BaseModel):
    """Single search result"""
    text: str
    metadata: ChunkMetadata
    similarity_score: float = Field(ge=0.0, le=1.0)


class SearchResponse(BaseModel):
    """Search response model"""
    query: str
    results: List[SearchResult]
    total_found: int
    user_level: int
    execution_time_ms: float


class BookIngestionRequest(BaseModel):
    """Request to ingest a single book"""
    file_path: str
    title: Optional[str] = None
    author: Optional[str] = None
    language: str = "en"
    tier_override: Optional[TierLevel] = None


class BookIngestionResponse(BaseModel):
    """Response from book ingestion"""
    success: bool
    book_title: str
    book_author: str
    tier: TierLevel
    chunks_created: int
    message: str
    error: Optional[str] = None


class BatchIngestionRequest(BaseModel):
    """Request to ingest multiple books"""
    directory_path: str
    file_patterns: List[str] = Field(default_factory=lambda: ["*.pdf", "*.epub"])
    skip_existing: bool = True


class BatchIngestionResponse(BaseModel):
    """Response from batch ingestion"""
    total_books: int
    successful: int
    failed: int
    results: List[BookIngestionResponse]
    execution_time_seconds: float


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    database: Dict[str, Any]
    embeddings: Dict[str, Any]