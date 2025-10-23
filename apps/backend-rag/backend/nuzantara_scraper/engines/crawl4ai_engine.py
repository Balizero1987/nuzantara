"""Crawl4AI engine for advanced web scraping"""

from typing import Optional
from loguru import logger

from .base_engine import BaseEngine


class Crawl4AIEngine(BaseEngine):
    """
    Advanced scraping engine using Crawl4AI
    Best performance for modern websites with JavaScript
    """

    def __init__(self, timeout: int = 60):
        self.timeout = timeout
        self._client = None

    def _ensure_client(self):
        """Lazy initialization of Crawl4AI"""
        if self._client:
            return

        try:
            # Try to import crawl4ai
            # Note: crawl4ai might not be installed, so we handle gracefully
            from crawl4ai import WebCrawler
            from crawl4ai.extraction_strategy import LLMExtractionStrategy

            self._client = WebCrawler(
                headless=True,
                verbose=False
            )

            logger.debug("Crawl4AI client initialized")

        except ImportError:
            raise ImportError("Crawl4AI not installed. Run: pip install crawl4ai")
        except Exception as e:
            logger.error(f"Error initializing Crawl4AI: {e}")
            raise

    def fetch(self, url: str) -> str:
        """Fetch HTML using Crawl4AI"""
        self._ensure_client()

        try:
            # Run crawler
            result = self._client.run(
                url=url,
                word_count_threshold=10,
                bypass_cache=False,
                timeout=self.timeout
            )

            if result.success:
                logger.debug(f"Crawl4AIEngine fetched: {url}")
                return result.html
            else:
                raise Exception(f"Crawl4AI failed: {result.error_message}")

        except Exception as e:
            logger.error(f"Crawl4AIEngine error: {e}")
            raise

    @staticmethod
    def test(url: str) -> bool:
        """Check if Crawl4AI is available"""
        try:
            import crawl4ai
            return True
        except ImportError:
            return False

    @property
    def name(self) -> str:
        return "Crawl4AIEngine"
