"""
Pydantic models for scraped content
Provides type safety and validation across all scrapers
"""

from pydantic import BaseModel, Field, HttpUrl, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SourceTier(str, Enum):
    """Source reliability tier"""
    OFFICIAL = "official"      # T1: Government, official sources
    ACCREDITED = "accredited"  # T2: Reputable news, verified sources
    COMMUNITY = "community"    # T3: Forums, social media


class ContentType(str, Enum):
    """Type of scraped content"""
    NEWS = "news"
    PROPERTY = "property"
    TAX = "tax"
    IMMIGRATION = "immigration"
    REGULATION = "regulation"
    GENERAL = "general"


class Source(BaseModel):
    """Source configuration"""
    name: str
    url: HttpUrl
    tier: SourceTier = SourceTier.COMMUNITY
    category: ContentType
    selectors: List[str] = Field(default_factory=list)
    requires_js: bool = False
    custom_parser: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ScrapedContent(BaseModel):
    """Standardized scraped content"""
    content_id: str
    title: str
    content: str
    url: HttpUrl
    source_name: str
    source_tier: SourceTier
    category: ContentType

    # Metadata
    scraped_at: datetime = Field(default_factory=datetime.now)
    published_date: Optional[datetime] = None
    author: Optional[str] = None

    # Extracted data (domain-specific)
    extracted_data: Dict[str, Any] = Field(default_factory=dict)

    # Quality metrics
    word_count: int = 0
    quality_score: float = 0.0
    relevance_score: float = 0.0

    # AI analysis (optional)
    ai_summary: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None

    # Images
    featured_image: Optional[HttpUrl] = None
    images: List[HttpUrl] = Field(default_factory=list)

    @validator('word_count', pre=True, always=True)
    def calculate_word_count(cls, v, values):
        if v == 0 and 'content' in values:
            return len(values['content'].split())
        return v

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class ScraperResult(BaseModel):
    """Result from a scraping cycle"""
    scraper_name: str
    category: ContentType
    started_at: datetime
    completed_at: Optional[datetime] = None

    # Statistics
    sources_attempted: int = 0
    sources_successful: int = 0
    items_scraped: int = 0
    items_filtered: int = 0
    items_saved: int = 0

    # Items
    items: List[ScrapedContent] = Field(default_factory=list)

    # Errors
    errors: List[Dict[str, str]] = Field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Calculate source success rate"""
        if self.sources_attempted == 0:
            return 0.0
        return self.sources_successful / self.sources_attempted

    @property
    def filter_efficiency(self) -> float:
        """Calculate filter efficiency"""
        if self.items_scraped == 0:
            return 0.0
        return self.items_filtered / self.items_scraped

    @property
    def duration_seconds(self) -> float:
        """Calculate scraping duration"""
        if not self.completed_at:
            return 0.0
        return (self.completed_at - self.started_at).total_seconds()

    def add_error(self, source: str, error: str):
        """Add error to result"""
        self.errors.append({
            "source": source,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }
