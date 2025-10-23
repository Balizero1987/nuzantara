"""
Nuzantara Unified Scraping System
Enterprise-grade web scraping framework for Indonesian business intelligence

Architecture:
- core: Base classes and configuration
- engines: Scraping engines (Crawl4AI, Playwright, Requests)
- processors: AI analysis, filtering, quality control
- scrapers: Domain-specific scrapers (Property, Tax, Immigration, News)
- models: Pydantic data models
- utils: Logging, metrics, scheduling
- config: YAML configurations
- api: REST API interface

Version: 1.0.0
Author: Nuzantara Team
"""

__version__ = "1.0.0"

from .core.base_scraper import BaseScraper
from .core.scraper_config import ScraperConfig
from .models.scraped_content import ScrapedContent, ScraperResult

__all__ = [
    "BaseScraper",
    "ScraperConfig",
    "ScrapedContent",
    "ScraperResult",
]
