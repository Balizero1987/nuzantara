"""Playwright engine for JavaScript-heavy sites"""

from typing import Optional
from loguru import logger

from .base_engine import BaseEngine


class PlaywrightEngine(BaseEngine):
    """
    Browser automation engine using Playwright
    Handles JavaScript rendering, slower but more reliable for dynamic content
    """

    def __init__(self, timeout: int = 60000, headless: bool = True):
        self.timeout = timeout
        self.headless = headless
        self._playwright = None
        self._browser = None

    def _ensure_browser(self):
        """Lazy initialization of Playwright browser"""
        if self._browser:
            return

        try:
            from playwright.sync_api import sync_playwright

            self._playwright = sync_playwright().start()
            self._browser = self._playwright.chromium.launch(headless=self.headless)
            logger.debug("Playwright browser initialized")

        except ImportError:
            raise ImportError("Playwright not installed. Run: pip install playwright && python -m playwright install chromium")
        except Exception as e:
            logger.error(f"Error initializing Playwright: {e}")
            raise

    def fetch(self, url: str) -> str:
        """Fetch HTML using Playwright"""
        self._ensure_browser()

        context = None
        page = None

        try:
            # Create context with realistic settings
            context = self._browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                viewport={"width": 1920, "height": 1080}
            )

            page = context.new_page()

            # Navigate with timeout
            page.goto(url, wait_until="networkidle", timeout=self.timeout)

            # Get HTML content
            html = page.content()

            logger.debug(f"PlaywrightEngine fetched: {url}")
            return html

        except Exception as e:
            logger.error(f"PlaywrightEngine error: {e}")
            raise

        finally:
            if page:
                page.close()
            if context:
                context.close()

    @staticmethod
    def test(url: str) -> bool:
        """Check if Playwright is available"""
        try:
            from playwright.sync_api import sync_playwright
            return True
        except ImportError:
            return False

    @property
    def name(self) -> str:
        return "PlaywrightEngine"

    def close(self):
        """Close browser"""
        if self._browser:
            self._browser.close()
        if self._playwright:
            self._playwright.stop()
        logger.debug("Playwright browser closed")

    def __del__(self):
        self.close()
