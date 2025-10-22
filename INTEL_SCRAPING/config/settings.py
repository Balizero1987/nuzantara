#!/usr/bin/env python3
"""
Configuration System - Swiss-Watch Precision
Centralized configuration with Pydantic validation and YAML loading.

Usage:
    from INTEL_SCRAPING.config.settings import settings

    # Access config
    max_articles = settings.scraper.max_articles_per_source
    runpod_key = settings.runpod.api_key  # Auto-loads from env
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum

try:
    from pydantic import BaseModel, Field, HttpUrl, validator
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback for older pydantic
    from pydantic import BaseModel, Field, HttpUrl, validator, BaseSettings

import yaml


# ========================================
# ENUMS
# ========================================

class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"


class CacheBackend(str, Enum):
    SQLITE = "sqlite"
    REDIS = "redis"


# ========================================
# SUB-CONFIGURATIONS
# ========================================

class ScraperConfig(BaseModel):
    """Scraper configuration"""
    max_articles_per_source: int = 15
    max_content_age_days: int = 14
    timeout_seconds: int = 45
    retry_attempts: int = 2
    concurrent_sites: int = 5
    dns_timeout: int = 10
    verify_ssl: bool = False

    # Rate limiting
    delay_min: int = 1
    delay_max: int = 3
    max_concurrent_domains: int = 2

    # Quality filters
    min_content_length: int = 100
    min_word_count: int = 50
    min_title_length: int = 10


class RunPodConfig(BaseModel):
    """RunPod LLAMA configuration"""
    endpoint: str
    api_key: str
    timeout_minutes: int = 8
    max_articles_for_journal: int = 100
    max_tokens: int = 4000
    temperature: float = 0.7
    top_p: float = 0.9
    poll_interval_seconds: int = 5
    max_poll_attempts: int = 96


class OllamaConfig(BaseModel):
    """Ollama fallback configuration"""
    enabled: bool = True
    base_url: str = "http://localhost:11434"
    model: str = "llama3.2"
    timeout_seconds: int = 60
    max_tokens: int = 2000
    temperature: float = 0.7
    max_articles_for_fallback: int = 50


class RAGConfig(BaseModel):
    """RAG backend configuration"""
    backend_url: str
    batch_size: int = 10
    embedding_timeout: int = 30
    storage_timeout: int = 30
    max_workers: int = 5


class ContentConfig(BaseModel):
    """Content creation configuration"""
    anthropic_api_key: str
    model: str = "claude-3-5-haiku-20241022"
    max_tokens: int = 2000
    max_workers: int = 3


class FiltersConfig(BaseModel):
    """Filters configuration"""
    quality_threshold: float = 0.7
    impact_threshold: str = "medium"
    duplicate_similarity_threshold: float = 0.85
    use_cache: bool = True
    cache_backend: CacheBackend = CacheBackend.SQLITE
    cache_ttl_days: int = 30
    max_article_age_days: int = 14
    require_valid_date: bool = True
    llama_categories: List[str] = ["dev_code", "future_trends", "news"]


class StateConfig(BaseModel):
    """State management configuration"""
    backend: CacheBackend = CacheBackend.SQLITE
    db_path: str = "INTEL_SCRAPING/data/.state/scraping_state.db"
    enable_resume: bool = True
    checkpoint_interval: int = 100


class AlertChannel(BaseModel):
    """Alert channel configuration"""
    type: str  # log | slack | email
    webhook_url: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    from_email: Optional[str] = None
    to_emails: Optional[List[str]] = None


class MonitoringConfig(BaseModel):
    """Monitoring and metrics configuration"""
    enabled: bool = True
    metrics_dir: str = "INTEL_SCRAPING/data/metrics"
    log_level: LogLevel = LogLevel.INFO
    structured_logging: bool = True
    prometheus_enabled: bool = False
    prometheus_port: int = 8000
    alerts_enabled: bool = True
    alert_channels: List[AlertChannel] = []


class CategorySchedule(BaseModel):
    """Per-category schedule"""
    cron: str


class SchedulingConfig(BaseModel):
    """Scheduling configuration"""
    enabled: bool = False
    cron_expression: str = "0 */6 * * *"
    timezone: str = "Asia/Jakarta"
    category_schedules: Dict[str, CategorySchedule] = {}


class EmailConfig(BaseModel):
    """Email configuration"""
    enabled: bool = True
    skip_on_ci: bool = True
    sender: str = "zero@balizero.com"
    regular_categories: Dict[str, str] = {}
    llama_categories: Dict[str, str] = {}


class OutputConfig(BaseModel):
    """Output configuration"""
    base_dir: str = "INTEL_SCRAPING/data/INTEL_SCRAPING"
    raw_dir: str = "raw"
    filtered_dir: str = "filtered"
    articles_dir: str = "INTEL_SCRAPING/data/INTEL_SCRAPING/articles"
    journal_dir: str = "INTEL_SCRAPING/data/JOURNAL"
    save_json: bool = True
    save_markdown: bool = True
    save_html: bool = False
    compress_old_files: bool = True
    compress_after_days: int = 30


# ========================================
# MAIN SETTINGS
# ========================================

class Settings(BaseModel):
    """
    Main configuration class.

    Loads from settings.yaml with environment variable substitution.
    """

    scraper: ScraperConfig
    runpod: RunPodConfig
    ollama: OllamaConfig
    rag: RAGConfig
    content: ContentConfig
    filters: FiltersConfig
    state: StateConfig
    monitoring: MonitoringConfig
    scheduling: SchedulingConfig
    email: EmailConfig
    output: OutputConfig

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @classmethod
    def from_yaml(cls, yaml_path: str = None) -> "Settings":
        """
        Load settings from YAML file with environment variable substitution.

        Environment variables in format ${VAR_NAME} are automatically substituted.

        Args:
            yaml_path: Path to YAML file (default: config/settings.yaml)

        Returns:
            Settings instance
        """
        if yaml_path is None:
            # Default path
            config_dir = Path(__file__).parent
            yaml_path = config_dir / "settings.yaml"

        with open(yaml_path, 'r') as f:
            yaml_content = f.read()

        # Substitute environment variables
        yaml_content = cls._substitute_env_vars(yaml_content)

        # Load YAML
        config_dict = yaml.safe_load(yaml_content)

        return cls(**config_dict)

    @staticmethod
    def _substitute_env_vars(content: str) -> str:
        """
        Substitute environment variables in format ${VAR_NAME}.

        Example:
            api_key: "${RUNPOD_API_KEY}" → api_key: "actual_key_value"
        """
        pattern = r'\$\{([^}]+)\}'

        def replacer(match):
            var_name = match.group(1)
            value = os.getenv(var_name)
            if value is None:
                # If env var not set, keep placeholder (will fail validation if required)
                return match.group(0)
            return value

        return re.sub(pattern, replacer, content)

    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to dictionary"""
        return self.dict()

    def to_yaml(self, output_path: str):
        """Save settings to YAML file"""
        with open(output_path, 'w') as f:
            yaml.dump(self.to_dict(), f, default_flow_style=False, sort_keys=False)


# ========================================
# GLOBAL SETTINGS INSTANCE
# ========================================

def load_settings(yaml_path: str = None) -> Settings:
    """
    Load settings from YAML file.

    Args:
        yaml_path: Path to YAML file (default: config/settings.yaml)

    Returns:
        Settings instance
    """
    try:
        return Settings.from_yaml(yaml_path)
    except FileNotFoundError as e:
        print(f"⚠️  Configuration file not found: {yaml_path or 'config/settings.yaml'}")
        print(f"    Using default settings.")
        # Return default settings
        return Settings(
            scraper=ScraperConfig(),
            runpod=RunPodConfig(
                endpoint="https://api.runpod.ai/v2/itz2q5gmid4cyt",
                api_key=os.getenv("RUNPOD_API_KEY", "")
            ),
            ollama=OllamaConfig(),
            rag=RAGConfig(
                backend_url="https://zantara-rag-backend-himaadsxua-ew.a.run.app"
            ),
            content=ContentConfig(
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", "")
            ),
            filters=FiltersConfig(),
            state=StateConfig(),
            monitoring=MonitoringConfig(),
            scheduling=SchedulingConfig(),
            email=EmailConfig(),
            output=OutputConfig()
        )
    except Exception as e:
        print(f"❌ Error loading configuration: {e}")
        raise


# Load settings on module import
settings = load_settings()


# ========================================
# CONVENIENCE FUNCTIONS
# ========================================

def get_category_email(category: str) -> Optional[str]:
    """Get email address for a category"""
    if category in settings.email.regular_categories:
        return settings.email.regular_categories[category]
    elif category in settings.email.llama_categories:
        return settings.email.llama_categories[category]
    return None


def is_llama_category(category: str) -> bool:
    """Check if category uses LLAMA filter"""
    return category in settings.filters.llama_categories


def get_output_dir(category: str, subdir: str = "raw") -> Path:
    """Get output directory for a category"""
    base = Path(settings.output.base_dir) / category / subdir
    base.mkdir(parents=True, exist_ok=True)
    return base


if __name__ == "__main__":
    # Test configuration loading
    print("=" * 60)
    print("INTEL SCRAPING - Configuration Test")
    print("=" * 60)

    print(f"\n✅ Loaded configuration:")
    print(f"   Scraper max articles: {settings.scraper.max_articles_per_source}")
    print(f"   RunPod endpoint: {settings.runpod.endpoint}")
    print(f"   Ollama enabled: {settings.ollama.enabled}")
    print(f"   Monitoring enabled: {settings.monitoring.enabled}")
    print(f"   Log level: {settings.monitoring.log_level}")

    print(f"\n📧 Email mappings:")
    for cat, email in list(settings.email.regular_categories.items())[:3]:
        print(f"   {cat}: {email}")

    print(f"\n🔥 LLAMA categories: {settings.filters.llama_categories}")

    print(f"\n💾 State backend: {settings.state.backend}")
    print(f"   Database: {settings.state.db_path}")

    print("\n" + "=" * 60)
