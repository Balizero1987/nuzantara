"""Engine selector with automatic fallback"""

from typing import List, Type, Optional
from loguru import logger

from .base_engine import BaseEngine
from .crawl4ai_engine import Crawl4AIEngine
from .playwright_engine import PlaywrightEngine
from .requests_engine import RequestsEngine


class EngineSelector:
    """
    Automatically selects best scraping engine
    Tries engines in order: Crawl4AI → Playwright → Requests
    """

    # Default engine order (best to worst)
    DEFAULT_ORDER: List[Type[BaseEngine]] = [
        Crawl4AIEngine,
        PlaywrightEngine,
        RequestsEngine
    ]

    @classmethod
    def select(
        cls,
        url: str,
        requires_js: bool = False,
        config: Optional[any] = None
    ) -> BaseEngine:
        """
        Select best available engine for URL

        Args:
            url: URL to scrape
            requires_js: Whether URL requires JavaScript rendering
            config: Engine configuration (optional)

        Returns:
            Initialized engine instance

        Raises:
            RuntimeError: If no engine is available
        """

        # Determine engine preference order
        if requires_js:
            # For JS sites, prefer browser engines
            order = [Crawl4AIEngine, PlaywrightEngine, RequestsEngine]
        else:
            # For static sites, prefer fast engines
            order = [RequestsEngine, Crawl4AIEngine, PlaywrightEngine]

        # Try engines in order
        for EngineClass in order:
            if EngineClass.test(url):
                logger.debug(f"Selected engine: {EngineClass.__name__}")

                # Initialize with config if available
                if config:
                    if EngineClass == RequestsEngine:
                        return EngineClass(
                            timeout=getattr(config, 'request_timeout', 30),
                            user_agent=getattr(config, 'user_agents', [None])[0]
                        )
                    elif EngineClass == PlaywrightEngine:
                        return EngineClass(
                            timeout=getattr(config, 'page_load_timeout', 60000),
                            headless=True
                        )
                    elif EngineClass == Crawl4AIEngine:
                        return EngineClass(
                            timeout=getattr(config, 'page_load_timeout', 60)
                        )

                # Default initialization
                return EngineClass()

        # No engine available
        raise RuntimeError(
            f"No scraping engine available for {url}. "
            "Install at least one: requests (default), playwright, or crawl4ai"
        )

    @classmethod
    def test_all_engines(cls) -> dict:
        """
        Test which engines are available

        Returns:
            Dictionary of engine availability
        """
        availability = {}

        for EngineClass in cls.DEFAULT_ORDER:
            try:
                available = EngineClass.test("https://example.com")
                availability[EngineClass.__name__] = available
            except Exception as e:
                availability[EngineClass.__name__] = False
                logger.debug(f"{EngineClass.__name__} not available: {e}")

        return availability

    @classmethod
    def get_recommended_engine(cls, url: str) -> str:
        """
        Get recommended engine name for URL (without initializing)

        Args:
            url: URL to check

        Returns:
            Engine class name
        """
        if "javascript" in url.lower() or "react" in url.lower():
            return "Crawl4AIEngine or PlaywrightEngine"

        return "RequestsEngine"
