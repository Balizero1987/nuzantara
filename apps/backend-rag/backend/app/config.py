"""
ZANTARA RAG - Configuration Management
Centralized configuration for all services
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # ========================================
    # EMBEDDINGS CONFIGURATION
    # ========================================
    embedding_provider: str = "openai"  # OpenAI for production (1536-dim)
    openai_api_key: Optional[str] = None  # Set via OPENAI_API_KEY env var
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536  # Matches migrated collections

    @field_validator('embedding_dimensions', mode='before')
    @classmethod
    def set_dimensions_from_provider(cls, v, info):
        """Automatically set embedding dimensions based on provider"""
        provider = info.data.get('embedding_provider', 'openai')
        if provider == 'openai':
            return 1536  # OpenAI text-embedding-3-small
        return 384  # sentence-transformers fallback

    # ========================================
    # ZANTARA AI CONFIGURATION (PRIMARY)
    # ========================================
    # ZANTARA AI is the PRIMARY engine - configurable via environment
    zantara_ai_model: str = "meta-llama/llama-4-scout"  # Set via ZANTARA_AI_MODEL
    openrouter_api_key: Optional[str] = None  # Set via OPENROUTER_API_KEY_LLAMA
    zantara_ai_cost_input: float = 0.20  # Cost per 1M input tokens
    zantara_ai_cost_output: float = 0.20  # Cost per 1M output tokens

    # ========================================
    # QDRANT VECTOR DATABASE
    # ========================================
    qdrant_url: str = "https://nuzantara-qdrant.fly.dev"
    qdrant_collection_name: str = "knowledge_base"

    # ========================================
    # CHUNKING CONFIGURATION
    # ========================================
    chunk_size: int = 500
    chunk_overlap: int = 50
    max_chunks_per_book: int = 1000

    # ========================================
    # API CONFIGURATION
    # ========================================
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True

    # ========================================
    # TIMEOUT CONFIGURATION (Centralized)
    # ========================================
    # All timeouts in seconds - centralized for consistency
    timeout_default: float = 30.0  # Default timeout for API calls
    timeout_ai_response: float = 60.0  # AI response timeout
    timeout_rag_query: float = 10.0  # RAG query timeout
    timeout_tool_execution: float = 30.0  # Tool execution timeout
    timeout_streaming: float = 120.0  # Streaming timeout
    timeout_internal_api: float = 5.0  # Internal API calls timeout

    # ========================================
    # RERANKER CONFIGURATION
    # ========================================
    enable_reranker: bool = False  # DISABLED: Saves ~5GB Docker image size
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    reranker_top_k: int = 5
    reranker_latency_target_ms: float = 50.0
    reranker_cache_enabled: bool = True
    reranker_cache_size: int = 1000
    reranker_batch_enabled: bool = True
    reranker_audit_enabled: bool = True
    reranker_rate_limit_per_minute: int = 100
    reranker_rate_limit_per_hour: int = 1000
    reranker_overfetch_count: int = 20
    reranker_return_count: int = 5

    # ========================================
    # LOGGING CONFIGURATION
    # ========================================
    log_level: str = "INFO"
    log_file: str = "./data/zantara_rag.log"

    # ========================================
    # DATA DIRECTORIES
    # ========================================
    raw_books_dir: str = "./data/raw_books"
    processed_dir: str = "./data/processed"
    batch_size: int = 10

    # ========================================
    # TIER OVERRIDES (Optional)
    # ========================================
    tier_overrides: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()
