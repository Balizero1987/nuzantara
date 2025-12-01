"""
NUZANTARA PRIME - Centralized Configuration
All environment variables centralized using pydantic-settings
"""


from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables - Prime Standard"""

    # ========================================
    # PROJECT CONFIGURATION
    # ========================================
    PROJECT_NAME: str = "Nuzantara Prime"
    API_V1_STR: str = "/api/v1"

    # ========================================
    # EMBEDDINGS CONFIGURATION
    # ========================================
    embedding_provider: str = "openai"  # OpenAI for production (1536-dim)
    openai_api_key: str | None = None  # Set via OPENAI_API_KEY env var
    google_api_key: str | None = None  # Set via GOOGLE_API_KEY env var
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536  # Matches migrated collections

    @field_validator("embedding_dimensions", mode="before")
    @classmethod
    def set_dimensions_from_provider(cls, _v, info):
        """Automatically set embedding dimensions based on provider"""
        provider = info.data.get("embedding_provider", "openai")
        if provider == "openai":
            return 1536  # OpenAI text-embedding-3-small
        return 384  # sentence-transformers fallback

    # ========================================
    # ZANTARA AI CONFIGURATION (PRIMARY)
    # ========================================
    zantara_ai_model: str = "gpt-4o-mini"  # Set via ZANTARA_AI_MODEL
    zantara_ai_cost_input: float = 0.15  # Cost per 1M input tokens (GPT-4o-mini)
    zantara_ai_cost_output: float = 0.60  # Cost per 1M output tokens (GPT-4o-mini)
    openrouter_api_key_llama: str | None = None  # Set via OPENROUTER_API_KEY_LLAMA env var

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
    api_port: int = 8080  # Use PORT env var (default 8080 for Fly.io)
    api_reload: bool = True

    # ========================================
    # TIMEOUT CONFIGURATION (Centralized)
    # ========================================
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
    tier_overrides: str | None = None

    # ========================================
    # DATABASE CONFIGURATION
    # ========================================
    database_url: str | None = None  # Set via DATABASE_URL env var

    # ========================================
    # REDIS CONFIGURATION
    # ========================================
    redis_url: str | None = None  # Set via REDIS_URL env var

    # ========================================
    # AUTHENTICATION CONFIGURATION
    # ========================================
    jwt_secret_key: str = Field(..., description="JWT secret key - REQUIRED, no default")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_hours: int = 24

    @field_validator("jwt_secret_key", mode="before")
    @classmethod
    def validate_jwt_secret(cls, v):
        if not v or v == "zantara_default_secret_key_2025_change_in_production":
            raise ValueError("JWT_SECRET_KEY must be set to a secure value in production")
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        return v

    # ========================================
    # API KEY AUTHENTICATION CONFIGURATION
    # ========================================
    api_keys: str = Field(..., description="API keys - REQUIRED, comma-separated")
    api_auth_enabled: bool = True
    api_auth_bypass_db: bool = False  # Must be False to enable JWT auth

    # ========================================
    # TYPESCRIPT BACKEND INTEGRATION
    # ========================================
    ts_backend_url: str = "https://nuzantara-backend.fly.dev"
    ts_internal_api_key: str | None = None  # Set via TS_INTERNAL_API_KEY env var

    # ========================================
    # CORS CONFIGURATION
    # ========================================
    zantara_allowed_origins: str | None = (
        None  # Comma-separated list, set via ZANTARA_ALLOWED_ORIGINS
    )

    # ========================================
    # FEATURE FLAGS
    # ========================================
    enable_skill_detection: bool = False  # Set via ENABLE_SKILL_DETECTION env var
    enable_collective_memory: bool = False  # Set via ENABLE_COLLECTIVE_MEMORY env var
    enable_advanced_analytics: bool = False  # Set via ENABLE_ADVANCED_ANALYTICS env var
    enable_tool_execution: bool = False  # Set via ENABLE_TOOL_EXECUTION env var

    # ========================================
    # NOTIFICATION SERVICES
    # ========================================
    sendgrid_api_key: str | None = None  # Set via SENDGRID_API_KEY env var
    smtp_host: str | None = None  # Set via SMTP_HOST env var
    twilio_account_sid: str | None = None  # Set via TWILIO_ACCOUNT_SID env var
    twilio_auth_token: str | None = None  # Set via TWILIO_AUTH_TOKEN env var
    twilio_whatsapp_number: str | None = None  # Set via TWILIO_WHATSAPP_NUMBER env var
    slack_webhook_url: str | None = None  # Set via SLACK_WEBHOOK_URL env var
    discord_webhook_url: str | None = None  # Set via DISCORD_WEBHOOK_URL env var
    github_token: str | None = None  # Set via GITHUB_TOKEN env var

    # ========================================
    # META WHATSAPP CONFIGURATION
    # ========================================
    whatsapp_verify_token: str = Field(
        ..., description="WhatsApp webhook verify token - REQUIRED, set via WHATSAPP_VERIFY_TOKEN"
    )
    whatsapp_access_token: str | None = None  # Set via WHATSAPP_ACCESS_TOKEN env var
    whatsapp_phone_number_id: str | None = None  # Set via WHATSAPP_PHONE_NUMBER_ID env var
    whatsapp_business_account_id: str | None = None  # Set via WHATSAPP_BUSINESS_ACCOUNT_ID env var

    # ========================================
    # META INSTAGRAM CONFIGURATION
    # ========================================
    instagram_verify_token: str = Field(
        ..., description="Instagram webhook verify token - REQUIRED, set via INSTAGRAM_VERIFY_TOKEN"
    )
    instagram_access_token: str | None = None  # Set via INSTAGRAM_ACCESS_TOKEN env var
    instagram_account_id: str | None = None  # Set via INSTAGRAM_ACCOUNT_ID env var

    # ========================================
    # ORACLE CONFIGURATION
    # ========================================
    zantara_oracle_url: str = Field(
        default="http://localhost:11434/api/generate",
        description="ZANTARA Oracle API URL (set via ZANTARA_ORACLE_URL env var)",
    )

    # Development origins (for local testing)
    dev_origins: str = Field(
        default="http://localhost:4173,http://127.0.0.1:4173,http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated list of development origins for CORS (set via DEV_ORIGINS env var)",
    )
    oracle_api_key: str | None = None  # Set via ORACLE_API_KEY env var

    # ========================================
    # GOOGLE SERVICES CONFIGURATION
    # ========================================
    google_api_key: str | None = None  # Set via GOOGLE_API_KEY env var
    google_credentials_json: str | None = None  # Set via GOOGLE_CREDENTIALS_JSON env var
    hf_api_key: str | None = None  # Set via HF_API_KEY env var

    # ========================================
    # FLY.IO DEPLOYMENT
    # ========================================
    fly_app_name: str | None = None  # Set via FLY_APP_NAME env var
    fly_region: str | None = None  # Set via FLY_REGION env var
    hostname: str | None = None  # Set via HOSTNAME env var
    port: int = 8080  # Set via PORT env var (Fly.io default)

    # ========================================
    # SERVICE CONFIGURATION
    # ========================================
    service_name: str = "nuzantara-rag"  # Set via SERVICE_NAME env var

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()
