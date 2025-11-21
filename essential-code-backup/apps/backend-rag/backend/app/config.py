"""
ZANTARA RAG - Configuration Management
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Embeddings Provider
    # HOTFIX 2025-11-05: Switch to OpenAI to match migrated collections (1536-dim)
    embedding_provider: str = "openai"  # was: "sentence-transformers"

    # OpenAI (required for production)
    openai_api_key: Optional[str] = None  # Set via OPENAI_API_KEY env var

    # Qdrant Vector Database
    qdrant_url: str = "https://nuzantara-qdrant.fly.dev"
    qdrant_collection_name: str = "knowledge_base"

    # Embeddings
    embedding_model: str = "text-embedding-3-small"  # was: sentence-transformers/all-MiniLM-L6-v2
    embedding_dimensions: int = 1536  # was: 384 - now matches migrated collections

    @field_validator('embedding_dimensions', mode='before')
    @classmethod
    def set_dimensions_from_provider(cls, v, info):
        """Automatically set embedding dimensions based on provider"""
        provider = info.data.get('embedding_provider', 'sentence-transformers')
        if provider == 'openai':
            return 1536  # OpenAI text-embedding-3-small
        return 384  # sentence-transformers/all-MiniLM-L6-v2

    # Chunking
    chunk_size: int = 500
    chunk_overlap: int = 50
    max_chunks_per_book: int = 1000

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True

    # Logging
    log_level: str = "INFO"
    log_file: str = "./data/zantara_rag.log"

    # Directories
    raw_books_dir: str = "./data/raw_books"
    processed_dir: str = "./data/processed"
    batch_size: int = 10

    # Reranker Service (Performance Enhancement)
    enable_reranker: bool = False  # DISABLED: Saves ~5GB Docker image size (sentence-transformers)
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    reranker_top_k: int = 5  # Return top-K re-ranked results
    reranker_latency_target_ms: float = 50.0  # Target latency per query
    
    # Reranker Feature Flags (Zero-Downtime Deployment)
    reranker_cache_enabled: bool = True  # Enable query similarity caching
    reranker_cache_size: int = 1000  # Max cached query results
    reranker_batch_enabled: bool = True  # Enable batch reranking for multi-query
    reranker_audit_enabled: bool = True  # Enable audit trail for reranker operations
    
    # Reranker Rate Limiting (Anti-Abuse)
    reranker_rate_limit_per_minute: int = 100  # Max rerank requests per user/IP per minute
    reranker_rate_limit_per_hour: int = 1000  # Max rerank requests per user/IP per hour
    
    # Reranker Overfetch Strategy
    reranker_overfetch_count: int = 20  # Fetch 20 candidates from Qdrant
    reranker_return_count: int = 5  # Return top-5 after reranking

    # Tier overrides (optional)
    tier_overrides: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()