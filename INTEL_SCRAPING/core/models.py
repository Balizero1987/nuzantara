#!/usr/bin/env python3
"""
Unified Data Models - Swiss-Watch Precision
All data structures defined in one place with Pydantic validation.

Key improvements:
- published_date is ALWAYS datetime (no more string confusion!)
- Automatic content hashing for deduplication
- URL normalization
- Comprehensive validation
- Type safety
"""

import hashlib
import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse

try:
    from pydantic import BaseModel, Field, HttpUrl, validator, root_validator
except ImportError:
    print("⚠️  Pydantic not installed. Run: pip install pydantic")
    raise


# ========================================
# ENUMS
# ========================================

class ArticleStatus(str, Enum):
    """Article processing status"""
    SCRAPED = "scraped"
    FILTERED = "filtered"
    PROCESSED = "processed"
    PUBLISHED = "published"
    FAILED = "failed"


class ArticleTier(str, Enum):
    """Source tier classification"""
    T1 = "T1"  # Premium sources
    T2 = "T2"  # Good sources
    T3 = "T3"  # Standard sources


class ImpactLevel(str, Enum):
    """Article impact level"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PipelineStage(str, Enum):
    """Pipeline processing stages"""
    SCRAPING = "scraping"
    FILTERING = "filtering"
    RAG_PROCESSING = "rag_processing"
    CONTENT_CREATION = "content_creation"
    JOURNAL_GENERATION = "journal_generation"
    PDF_EXPORT = "pdf_export"
    EMAIL_SENDING = "email_sending"


# ========================================
# CORE MODELS
# ========================================

class Article(BaseModel):
    """
    Unified Article model.

    This is the SINGLE SOURCE OF TRUTH for all article data.
    All components must use this model.
    """

    # Identifiers
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str  # Use str instead of HttpUrl for flexibility
    content_hash: str = ""  # Auto-generated

    # Content
    title: str = Field(..., min_length=10)
    content: str = Field(..., min_length=100)
    summary: Optional[str] = None

    # Dates (ALWAYS datetime objects!)
    published_date: datetime
    scraped_at: datetime = Field(default_factory=datetime.now)

    # Classification
    source: str  # Website name
    category: str  # Business category
    tier: ArticleTier = ArticleTier.T3
    status: ArticleStatus = ArticleStatus.SCRAPED

    # Metadata
    author: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    image_url: Optional[str] = None
    image_alt: Optional[str] = None
    language: str = "id"  # Default to Indonesian

    # Quality metrics
    word_count: int = 0
    quality_score: float = 0.0
    relevance_score: float = 0.0
    impact_level: ImpactLevel = ImpactLevel.MEDIUM

    # Processing metadata
    processing_errors: List[str] = Field(default_factory=list)
    processing_metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @validator('url')
    def validate_url(cls, v):
        """Validate URL format"""
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v

    @validator('word_count', pre=True, always=True)
    def calculate_word_count(cls, v, values):
        """Auto-calculate word count if not provided"""
        if v == 0 and 'content' in values:
            return len(values['content'].split())
        return v

    @root_validator
    def generate_content_hash(cls, values):
        """Auto-generate content hash for deduplication"""
        if not values.get('content_hash') and values.get('content'):
            content = values['content']
            # Hash first 1000 chars for performance
            hash_content = content[:1000]
            values['content_hash'] = hashlib.md5(hash_content.encode('utf-8')).hexdigest()
        return values

    def normalize_url(self) -> str:
        """Return normalized URL for deduplication"""
        parsed = urlparse(self.url)
        # Remove query params and fragments, trailing slash
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
        return normalized.lower()

    def to_markdown(self) -> str:
        """Convert article to markdown format"""
        md = f"""# {self.title}

**Source**: {self.source}
**Category**: {self.category}
**Tier**: {self.tier}
**Date**: {self.published_date.strftime('%Y-%m-%d')}
**URL**: {self.url}
**Author**: {self.author or 'N/A'}
**Words**: {self.word_count}
**Quality Score**: {self.quality_score:.2f}
**Relevance Score**: {self.relevance_score:.2f}

## Content

{self.content}

---

**Metadata**:
- Impact Level: {self.impact_level}
- Language: {self.language}
- Tags: {', '.join(self.tags) if self.tags else 'None'}
- Image: {self.image_url or 'N/A'}
- Scraped: {self.scraped_at.isoformat()}
- Content Hash: {self.content_hash[:8]}...
- Status: {self.status}
"""
        return md

    def to_dict_safe(self) -> Dict[str, Any]:
        """
        Convert to dict with safe serialization (datetime → str).
        Use this for JSON export.
        """
        d = self.dict()
        d['published_date'] = self.published_date.isoformat()
        d['scraped_at'] = self.scraped_at.isoformat()
        return d


class ScrapingResult(BaseModel):
    """Result from a scraping operation"""
    site_name: str
    site_url: str
    category: str
    tier: ArticleTier
    articles: List[Article] = Field(default_factory=list)
    articles_count: int = 0
    full_content_count: int = 0
    errors: List[str] = Field(default_factory=list)
    duration_seconds: float = 0.0
    success: bool = True

    @validator('articles_count', pre=True, always=True)
    def count_articles(cls, v, values):
        """Auto-count articles"""
        if v == 0 and 'articles' in values:
            return len(values['articles'])
        return v


class FilterResult(BaseModel):
    """Result from a filtering operation"""
    input_count: int
    output_count: int
    filtered_out: int = 0
    reasons: Dict[str, int] = Field(default_factory=dict)  # reason → count
    duration_seconds: float = 0.0

    @validator('filtered_out', pre=True, always=True)
    def calculate_filtered(cls, v, values):
        """Auto-calculate filtered count"""
        if 'input_count' in values and 'output_count' in values:
            return values['input_count'] - values['output_count']
        return v


class PipelineRun(BaseModel):
    """Represents a complete pipeline run"""
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    status: str = "running"  # running | completed | failed
    stages_completed: List[PipelineStage] = Field(default_factory=list)
    total_articles_scraped: int = 0
    total_articles_filtered: int = 0
    total_articles_processed: int = 0
    categories_processed: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def duration(self) -> Optional[float]:
        """Get duration in seconds"""
        if self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None

    def mark_completed(self):
        """Mark run as completed"""
        self.completed_at = datetime.now()
        self.status = "completed" if not self.errors else "failed"


class JournalStructure(BaseModel):
    """Journal/magazine structure"""
    date: str
    cover_stories: List[Dict[str, Any]] = Field(default_factory=list)
    sections: List[Dict[str, Any]] = Field(default_factory=list)
    editorial_note: str = ""
    total_articles: int = 0
    generated_at: datetime = Field(default_factory=datetime.now)
    cover_images: List[str] = Field(default_factory=list)


# ========================================
# STATE MODELS
# ========================================

class StageState(BaseModel):
    """State of a pipeline stage for a category"""
    run_id: str
    stage: PipelineStage
    category: str
    status: str = "pending"  # pending | running | completed | failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ========================================
# UTILITY FUNCTIONS
# ========================================

def parse_date_unified(date_input: Any) -> Optional[datetime]:
    """
    🔥 SINGLE SOURCE OF TRUTH for date parsing.

    Use this function EVERYWHERE instead of datetime.strptime().

    Supports:
    - datetime objects (pass through)
    - ISO strings (YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS)
    - Slashed dates (DD/MM/YYYY, YYYY/MM/DD)
    - Compact format (YYYYMMDD)
    - Various timestamp formats

    Args:
        date_input: datetime object, string, or None

    Returns:
        datetime object or None if parsing fails
    """
    if date_input is None:
        return None

    if isinstance(date_input, datetime):
        return date_input

    if not isinstance(date_input, str):
        return None

    date_str = str(date_input).strip()

    if not date_str:
        return None

    # List of formats to try (order matters - most specific first)
    formats = [
        '%Y-%m-%dT%H:%M:%SZ',           # ISO with Z
        '%Y-%m-%dT%H:%M:%S.%fZ',        # ISO with microseconds
        '%Y-%m-%dT%H:%M:%S',            # ISO without Z
        '%Y-%m-%dT%H:%M:%S.%f',         # ISO with microseconds, no Z
        '%Y-%m-%d %H:%M:%S',            # MySQL format
        '%Y-%m-%d',                     # ISO date only
        '%Y/%m/%d',                     # Slash format
        '%d/%m/%Y',                     # European format
        '%d-%m-%Y',                     # European dash format
        '%m/%d/%Y',                     # US format
        '%Y%m%d',                       # Compact format
    ]

    for fmt in formats:
        try:
            # Truncate string to format length to avoid issues with extra text
            max_len = len(fmt.replace('%f', ''))  # Account for microseconds
            truncated = date_str[:max_len + 10]  # +10 for microseconds
            return datetime.strptime(truncated, fmt)
        except (ValueError, IndexError):
            continue

    # If all formats fail, try parsing with dateutil if available
    try:
        from dateutil import parser
        return parser.parse(date_str)
    except (ImportError, ValueError, TypeError):
        pass

    return None


def create_article_from_legacy(legacy_dict: Dict[str, Any]) -> Optional[Article]:
    """
    Convert legacy article dict to new Article model.

    Handles all the messy date parsing and validation.
    """
    try:
        # Parse published date
        published_date = None
        for date_key in ['published_date', 'date', 'pub_date', 'publication_date']:
            if date_key in legacy_dict:
                published_date = parse_date_unified(legacy_dict[date_key])
                if published_date:
                    break

        if not published_date:
            # If no valid date, skip article
            return None

        # Parse scraped date
        scraped_at = parse_date_unified(legacy_dict.get('scraped_at')) or datetime.now()

        # Create Article
        article = Article(
            url=legacy_dict.get('url', ''),
            title=legacy_dict.get('title', ''),
            content=legacy_dict.get('content', ''),
            published_date=published_date,
            scraped_at=scraped_at,
            source=legacy_dict.get('source', 'Unknown'),
            category=legacy_dict.get('category', 'unknown'),
            tier=ArticleTier(legacy_dict.get('tier', 'T3')),
            author=legacy_dict.get('author'),
            tags=legacy_dict.get('tags', []),
            image_url=legacy_dict.get('image_url'),
            language=legacy_dict.get('language', 'id'),
            word_count=legacy_dict.get('word_count', 0),
            impact_level=ImpactLevel(legacy_dict.get('impact_level', 'medium'))
        )

        return article

    except Exception as e:
        print(f"⚠️  Failed to convert legacy article: {e}")
        return None


if __name__ == "__main__":
    # Test models
    print("=" * 60)
    print("INTEL SCRAPING - Data Models Test")
    print("=" * 60)

    # Test Article creation
    article = Article(
        url="https://openai.com/blog/gpt-4",
        title="GPT-4 Technical Report",
        content="GPT-4 is a large multimodal model..." * 50,
        published_date=datetime(2025, 10, 22),
        source="OpenAI Blog",
        category="ai_tech",
        tier=ArticleTier.T1,
        tags=["AI", "GPT", "LLM"]
    )

    print(f"\n✅ Created article:")
    print(f"   ID: {article.id}")
    print(f"   Title: {article.title}")
    print(f"   Word count: {article.word_count}")
    print(f"   Content hash: {article.content_hash[:16]}...")
    print(f"   Normalized URL: {article.normalize_url()}")

    # Test date parsing
    print(f"\n🔥 Date parsing tests:")
    test_dates = [
        "2025-10-22",
        "2025/10/22",
        "22/10/2025",
        "20251022",
        "2025-10-22T12:30:45Z",
        "invalid_date",
        None,
    ]

    for test_date in test_dates:
        result = parse_date_unified(test_date)
        status = "✅" if result else "❌"
        print(f"   {status} {test_date} → {result}")

    print("\n" + "=" * 60)
