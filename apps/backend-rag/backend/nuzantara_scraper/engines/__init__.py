"""Scraping engines"""

from .base_engine import BaseEngine
from .requests_engine import RequestsEngine
from .playwright_engine import PlaywrightEngine
from .crawl4ai_engine import Crawl4AIEngine
from .engine_selector import EngineSelector

__all__ = [
    "BaseEngine",
    "RequestsEngine",
    "PlaywrightEngine",
    "Crawl4AIEngine",
    "EngineSelector",
]
