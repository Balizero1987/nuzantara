"""
ZANTARA RAG - Configuration Management
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Embeddings Provider
    embedding_provider: str = "sentence-transformers"  # or "openai"

    # OpenAI (optional - only if using OpenAI provider)
    openai_api_key: Optional[str] = None

    # Chroma
    chroma_persist_dir: str = "./data/chroma_db"
    chroma_collection_name: str = "zantara_books"

    # Embeddings
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimensions: int = 384  # 384 for MiniLM, 1536 for OpenAI

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
    enable_reranker: bool = True  # Enable CrossEncoder re-ranking for +40% quality
    reranker_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    reranker_top_k: int = 5  # Return top-K re-ranked results
    reranker_latency_target_ms: float = 50.0  # Target latency per query

    # Tier overrides (optional)
    tier_overrides: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()