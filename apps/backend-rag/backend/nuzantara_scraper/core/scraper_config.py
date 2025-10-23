"""
Unified configuration for all scrapers
Supports YAML files and environment variables
"""

import os
import yaml
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from ..models.scraped_content import ContentType, Source


class DatabaseConfig(BaseModel):
    """Database configuration"""
    chromadb_path: str = "./data/chromadb"
    postgres_url: Optional[str] = None
    collections_prefix: str = "nuzantara"


class AIConfig(BaseModel):
    """AI providers configuration"""
    # Gemini
    gemini_key: Optional[str] = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    gemini_model: str = "gemini-2.0-flash-exp"

    # Claude
    anthropic_key: Optional[str] = Field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY"))
    claude_model: str = "claude-3-haiku-20240307"

    # LLAMA (Ollama)
    ollama_url: str = "http://localhost:11434"
    llama_model: str = "llama3.2"

    # Provider preference order
    provider_order: List[str] = ["gemini", "claude", "llama"]


class EngineConfig(BaseModel):
    """Scraping engines configuration"""
    engine_preference: List[str] = ["crawl4ai", "playwright", "requests"]

    # Timeouts
    request_timeout: int = 30
    page_load_timeout: int = 60

    # Rate limiting
    delay_between_requests: int = 2
    delay_between_sources: int = 5

    # Retries
    max_retries: int = 3
    retry_delay: int = 5

    # User agents
    user_agents: List[str] = Field(default_factory=lambda: [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ])


class CacheConfig(BaseModel):
    """Cache configuration"""
    enabled: bool = True
    cache_dir: str = "./data/cache"
    ttl_days: int = 7  # Time to live for cached items


class FilterConfig(BaseModel):
    """Filtering configuration"""
    min_word_count: int = 50
    min_quality_score: float = 0.3
    enable_ai_filtering: bool = True
    enable_deduplication: bool = True


class ScraperConfig(BaseModel):
    """Main scraper configuration"""

    # Identity
    scraper_name: str
    category: ContentType

    # Sources
    sources: List[Source] = Field(default_factory=list)

    # Sub-configs
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    ai: AIConfig = Field(default_factory=AIConfig)
    engine: EngineConfig = Field(default_factory=EngineConfig)
    cache: CacheConfig = Field(default_factory=CacheConfig)
    filter: FilterConfig = Field(default_factory=FilterConfig)

    # Scheduling
    schedule_enabled: bool = False
    schedule_interval_hours: int = 24

    # Monitoring
    enable_metrics: bool = True
    log_level: str = "INFO"

    # Custom settings (domain-specific)
    custom: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_yaml(cls, yaml_path: str, **overrides) -> "ScraperConfig":
        """Load configuration from YAML file"""
        path = Path(yaml_path)
        if not path.exists():
            raise FileNotFoundError(f"Config file not found: {yaml_path}")

        with open(path, 'r') as f:
            config_data = yaml.safe_load(f)

        # Merge with overrides
        config_data.update(overrides)

        return cls(**config_data)

    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> "ScraperConfig":
        """Load configuration from dictionary"""
        return cls(**config_dict)

    def get_chromadb_collection_name(self) -> str:
        """Get ChromaDB collection name"""
        return f"{self.database.collections_prefix}_{self.category.value}"

    def get_cache_path(self) -> Path:
        """Get cache directory path"""
        cache_dir = Path(self.cache.cache_dir) / self.scraper_name
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
