"""Domain-specific scrapers"""

from .property_scraper import PropertyScraper
from .immigration_scraper import ImmigrationScraper
from .tax_scraper import TaxScraper
from .news_scraper import NewsScraper

__all__ = [
    "PropertyScraper",
    "ImmigrationScraper",
    "TaxScraper",
    "NewsScraper",
]
