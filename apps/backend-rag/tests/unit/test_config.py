"""
Unit tests for app.core.config
100% coverage target
"""

import sys
from pathlib import Path

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.core.config import Settings


def test_embedding_dimension_openai():
    """Test embedding_dimension is 1536 for OpenAI provider"""
    settings = Settings(embedding_provider="openai")
    assert settings.embedding_dimensions == 1536


def test_embedding_dimension_fallback():
    """Test embedding_dimension is 384 for non-OpenAI providers"""
    # Test sentence-transformers provider (covers line 36)
    settings = Settings(embedding_provider="sentence-transformers")
    assert settings.embedding_dimensions == 384  # sentence-transformers fallback


def test_embedding_dimension_huggingface():
    """Test embedding_dimension is 384 for HuggingFace"""
    settings = Settings(embedding_provider="huggingface")
    assert settings.embedding_dimensions == 384


def test_settings_creation():
    """Test Settings can be instantiated"""
    settings = Settings()
    assert settings is not None
    assert hasattr(settings, "database_url")
    assert hasattr(settings, "jwt_secret_key")
