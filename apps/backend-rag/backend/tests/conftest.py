"""Pytest configuration and shared fixtures"""

import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, MagicMock
from typing import Generator

from nuzantara_scraper.core import ScraperConfig
from nuzantara_scraper.models.scraped_content import (
    ContentType,
    Source,
    SourceTier,
    ScrapedContent,
)


# ==================== Fixtures: Temporary Directories ====================

@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Create temporary directory for tests"""
    temp_path = Path(tempfile.mkdtemp())
    yield temp_path
    shutil.rmtree(temp_path, ignore_errors=True)


@pytest.fixture
def temp_cache_dir(temp_dir: Path) -> Path:
    """Create temporary cache directory"""
    cache_dir = temp_dir / "cache"
    cache_dir.mkdir()
    return cache_dir


@pytest.fixture
def temp_chromadb_dir(temp_dir: Path) -> Path:
    """Create temporary ChromaDB directory"""
    db_dir = temp_dir / "chromadb"
    db_dir.mkdir()
    return db_dir


# ==================== Fixtures: Configurations ====================

@pytest.fixture
def base_config(temp_cache_dir: Path, temp_chromadb_dir: Path) -> ScraperConfig:
    """Create base scraper configuration for testing"""
    return ScraperConfig(
        scraper_name="test_scraper",
        category=ContentType.PROPERTY,
        sources=[],
        database={
            "chromadb_path": str(temp_chromadb_dir),
            "postgres_url": None,
            "collections_prefix": "test",
        },
        cache={
            "cache_dir": str(temp_cache_dir),
            "ttl_days": 7,
        },
        ai={
            "ollama_url": "http://localhost:11434",
            "llama_model": "llama3.2",
            "zantara_url": "http://localhost:8000",
            "zantara_api_key": None,
            "provider_order": ["llama"],
        },
        engine={
            "engine_preference": ["requests"],
            "request_timeout": 10,
            "delay_between_requests": 0,
        },
        filter={
            "min_word_count": 10,
            "min_quality_score": 0.1,
            "enable_ai_filtering": False,
            "enable_deduplication": True,
        },
    )


@pytest.fixture
def property_config(base_config: ScraperConfig) -> ScraperConfig:
    """Property scraper configuration"""
    config = base_config.model_copy(deep=True)
    config.scraper_name = "property_test"
    config.category = ContentType.PROPERTY
    return config


@pytest.fixture
def immigration_config(base_config: ScraperConfig) -> ScraperConfig:
    """Immigration scraper configuration"""
    config = base_config.model_copy(deep=True)
    config.scraper_name = "immigration_test"
    config.category = ContentType.IMMIGRATION
    return config


@pytest.fixture
def tax_config(base_config: ScraperConfig) -> ScraperConfig:
    """Tax scraper configuration"""
    config = base_config.model_copy(deep=True)
    config.scraper_name = "tax_test"
    config.category = ContentType.TAX
    return config


@pytest.fixture
def news_config(base_config: ScraperConfig) -> ScraperConfig:
    """News scraper configuration"""
    config = base_config.model_copy(deep=True)
    config.scraper_name = "news_test"
    config.category = ContentType.NEWS
    return config


# ==================== Fixtures: Mock Sources ====================

@pytest.fixture
def mock_source() -> Source:
    """Create mock source"""
    return Source(
        name="Test Source",
        url="https://example.com/test",
        tier=SourceTier.ACCREDITED,
        category=ContentType.PROPERTY,
        selectors=["div.content"],
        requires_js=False,
    )


@pytest.fixture
def mock_official_source() -> Source:
    """Create mock official source"""
    return Source(
        name="Official Test Source",
        url="https://official.gov/test",
        tier=SourceTier.OFFICIAL,
        category=ContentType.TAX,
        selectors=["article.announcement"],
        requires_js=False,
    )


@pytest.fixture
def mock_sources(mock_source: Source, mock_official_source: Source) -> list[Source]:
    """Create list of mock sources"""
    return [mock_source, mock_official_source]


# ==================== Fixtures: Mock Content ====================

@pytest.fixture
def mock_html_content() -> str:
    """Mock HTML content for testing"""
    return """
    <html>
        <head><title>Test Property</title></head>
        <body>
            <div class="property">
                <h1>Beautiful Villa in Bali</h1>
                <p class="price">USD 500,000</p>
                <p class="size">200 sqm</p>
                <p class="location">Canggu, Bali</p>
                <div class="description">
                    This is a beautiful villa located in the heart of Canggu.
                    It features modern amenities and stunning ocean views.
                    Perfect for families looking for a peaceful retreat.
                </div>
            </div>
        </body>
    </html>
    """


@pytest.fixture
def mock_scraped_content(mock_source: Source) -> ScrapedContent:
    """Create mock scraped content"""
    return ScrapedContent(
        content_id="test_123",
        title="Test Property",
        content="This is test property content with sufficient word count for filtering.",
        url="https://example.com/property/123",
        source_name=mock_source.name,
        source_tier=mock_source.tier,
        category=ContentType.PROPERTY,
        extracted_data={
            "price": "USD 500,000",
            "size": "200 sqm",
            "location": "Canggu",
        },
    )


# ==================== Fixtures: Mock Engines ====================

@pytest.fixture
def mock_engine():
    """Mock scraping engine"""
    engine = Mock()
    engine.fetch_content.return_value = "<html><body>Test content</body></html>"
    return engine


# ==================== Fixtures: Mock AI ====================

@pytest.fixture
def mock_ai_analyzer():
    """Mock AI analyzer"""
    analyzer = Mock()
    analyzer.analyze.return_value = {
        "summary": "Test property summary",
        "key_features": ["feature1", "feature2"],
        "quality_score": 0.8,
    }
    return analyzer


# ==================== Fixtures: Mock Database ====================

@pytest.fixture
def mock_chromadb():
    """Mock ChromaDB client"""
    db = MagicMock()
    db.save_to_chromadb.return_value = True
    db.search_chromadb.return_value = []
    db.collection_exists.return_value = False
    return db


# ==================== Fixtures: Mock Cache ====================

@pytest.fixture
def mock_cache():
    """Mock cache manager"""
    cache = Mock()
    cache.is_cached.return_value = False
    cache.add_to_cache.return_value = True
    cache.get_cached.return_value = None
    return cache


# ==================== Fixtures: API Testing ====================

@pytest.fixture
def mock_fastapi_client():
    """Mock FastAPI test client"""
    from fastapi.testclient import TestClient
    from nuzantara_scraper.api.routes import app

    return TestClient(app)


# ==================== Fixtures: Scheduler ====================

@pytest.fixture
def mock_scheduler():
    """Mock scheduler"""
    scheduler = Mock()
    scheduler.jobs = {}
    scheduler.running = False
    scheduler.add_job.return_value = "test_job_id"
    scheduler.get_job.return_value = None
    return scheduler


# ==================== Helper Functions ====================

@pytest.fixture
def assert_valid_content():
    """Helper to assert content validity"""

    def _assert(content: ScrapedContent):
        assert content.content_id
        assert content.title
        assert content.content
        assert content.url
        assert content.source_name
        assert isinstance(content.source_tier, SourceTier)
        assert isinstance(content.category, ContentType)

    return _assert


@pytest.fixture
def create_mock_response():
    """Helper to create mock HTTP response"""

    def _create(status_code: int = 200, text: str = "", json_data: dict = None):
        response = Mock()
        response.status_code = status_code
        response.text = text
        response.json.return_value = json_data or {}
        response.raise_for_status = Mock()
        if status_code >= 400:
            from requests.exceptions import HTTPError

            response.raise_for_status.side_effect = HTTPError()
        return response

    return _create
