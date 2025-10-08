#!/usr/bin/env python3
"""
Resilient Scraper with Exponential Backoff
Industry-standard retry logic for web scraping reliability
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    RetryError
)
from playwright.async_api import TimeoutError as PlaywrightTimeout
import httpx

logger = logging.getLogger(__name__)

# Retry configuration
MAX_ATTEMPTS = 5
MIN_WAIT = 1  # seconds
MAX_WAIT = 60  # seconds
MULTIPLIER = 2  # exponential: 1s, 2s, 4s, 8s, 16s, capped at 60s


def is_retryable_http_error(exception: Exception) -> bool:
    """
    Determine if HTTP error is retryable
    - Retry: 5xx (server errors), timeouts, connection issues
    - DON'T retry: 4xx (client errors like 404, 403)
    """
    if isinstance(exception, PlaywrightTimeout):
        return True

    if isinstance(exception, (ConnectionError, asyncio.TimeoutError)):
        return True

    if isinstance(exception, httpx.HTTPStatusError):
        # Only retry server errors (5xx)
        return exception.response.status_code >= 500

    return False


@retry(
    stop=stop_after_attempt(MAX_ATTEMPTS),
    wait=wait_exponential(multiplier=MULTIPLIER, min=MIN_WAIT, max=MAX_WAIT),
    retry=retry_if_exception_type((
        PlaywrightTimeout,
        ConnectionError,
        asyncio.TimeoutError,
        httpx.HTTPStatusError
    )),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True
)
async def scrape_with_retry(
    url: str,
    scraper_func: callable,
    **kwargs
) -> Optional[Dict[str, Any]]:
    """
    Scrape URL with exponential backoff retry

    Args:
        url: Target URL
        scraper_func: Async function that performs the scrape
        **kwargs: Additional args for scraper_func

    Returns:
        Scraped data dict or None if all retries failed

    Raises:
        RetryError: If all retry attempts exhausted

    Example:
        >>> async def my_scraper(url):
        ...     async with async_playwright() as p:
        ...         browser = await p.chromium.launch()
        ...         page = await browser.new_page()
        ...         await page.goto(url, timeout=30000)
        ...         content = await page.content()
        ...         await browser.close()
        ...         return {'url': url, 'content': content}
        >>>
        >>> result = await scrape_with_retry(
        ...     "https://imigrasi.go.id/berita/",
        ...     my_scraper
        ... )
    """

    try:
        logger.info(f"Scraping {url}")
        result = await scraper_func(url, **kwargs)

        if result is None:
            raise ValueError(f"Scraper returned None for {url}")

        logger.info(f"✅ Successfully scraped {url}")
        return result

    except httpx.HTTPStatusError as e:
        # Check if retryable
        if not is_retryable_http_error(e):
            status = e.response.status_code
            logger.error(f"❌ Non-retryable HTTP {status} for {url}")
            return None

        # Log and let retry decorator handle it
        logger.warning(f"HTTP {e.response.status_code} for {url}, will retry...")
        raise

    except (PlaywrightTimeout, ConnectionError, asyncio.TimeoutError) as e:
        logger.warning(f"Timeout/Connection error for {url}: {e}, will retry...")
        raise

    except Exception as e:
        # Unknown error - don't retry
        logger.error(f"❌ Non-retryable error for {url}: {type(e).__name__} - {e}")
        return None


async def batch_scrape_with_retry(
    urls: list[str],
    scraper_func: callable,
    max_concurrent: int = 5,
    **kwargs
) -> Dict[str, Any]:
    """
    Scrape multiple URLs concurrently with retry logic

    Args:
        urls: List of URLs to scrape
        scraper_func: Async scraper function
        max_concurrent: Max concurrent requests (default 5)
        **kwargs: Additional args for scraper_func

    Returns:
        {
            'successful': list of scraped data dicts,
            'failed': list of (url, error_msg) tuples,
            'success_rate': percentage
        }

    Example:
        >>> urls = [
        ...     "https://imigrasi.go.id/berita/",
        ...     "https://www.thejakartapost.com/indonesia",
        ...     "https://coconuts.co/bali/"
        ... ]
        >>> results = await batch_scrape_with_retry(urls, my_scraper)
        >>> print(f"Success: {results['success_rate']:.1f}%")
    """

    semaphore = asyncio.Semaphore(max_concurrent)
    successful = []
    failed = []

    async def scrape_one(url: str):
        async with semaphore:
            try:
                result = await scrape_with_retry(url, scraper_func, **kwargs)
                if result:
                    successful.append(result)
                else:
                    failed.append((url, "Scraper returned None"))
            except RetryError as e:
                # All retries exhausted
                last_exception = e.last_attempt.exception()
                failed.append((url, f"All retries failed: {last_exception}"))
            except Exception as e:
                failed.append((url, str(e)))

    # Scrape all URLs concurrently (respecting semaphore limit)
    await asyncio.gather(*[scrape_one(url) for url in urls])

    total = len(urls)
    success_count = len(successful)
    success_rate = (success_count / total * 100) if total > 0 else 0

    logger.info(f"Batch scraping complete: {success_count}/{total} successful ({success_rate:.1f}%)")

    return {
        'successful': successful,
        'failed': failed,
        'success_rate': success_rate,
        'total': total,
        'success_count': success_count,
        'failure_count': len(failed)
    }


# ============================================================================
# Integration Example with existing crawl4ai_scraper.py
# ============================================================================

async def crawl4ai_wrapper(url: str, **kwargs) -> Dict[str, Any]:
    """
    Wrapper for existing crawl4ai scraper
    This function should call your existing scraper logic
    """
    from crawl4ai import AsyncWebCrawler

    async with AsyncWebCrawler(headless=True) as crawler:
        result = await crawler.arun(
            url=url,
            bypass_cache=True,
            word_count_threshold=50,
            **kwargs
        )

        if not result.success:
            raise ValueError(f"Crawl4ai failed for {url}")

        return {
            'url': url,
            'markdown': result.markdown,
            'extracted_content': result.extracted_content,
            'success': True
        }


# ============================================================================
# CLI Testing
# ============================================================================

if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    async def test_single_url():
        """Test single URL scraping with retry"""
        test_url = "https://imigrasi.go.id/berita/"

        print("=" * 70)
        print("RESILIENT SCRAPER TEST - Single URL")
        print("=" * 70)
        print(f"URL: {test_url}")
        print(f"Max attempts: {MAX_ATTEMPTS}")
        print(f"Retry schedule: 1s, 2s, 4s, 8s, 16s...")
        print()

        try:
            result = await scrape_with_retry(test_url, crawl4ai_wrapper)

            if result:
                print(f"\n✅ SUCCESS")
                print(f"Content length: {len(result.get('markdown', ''))} chars")
            else:
                print(f"\n❌ FAILED - No data returned")

        except RetryError as e:
            print(f"\n❌ ALL RETRIES EXHAUSTED")
            print(f"Last error: {e.last_attempt.exception()}")


    async def test_batch_urls():
        """Test batch URL scraping with retry"""
        test_urls = [
            "https://imigrasi.go.id/berita/",
            "https://www.thejakartapost.com/indonesia",
            "https://coconuts.co/bali/",
            "https://this-will-fail-404.example.com/test",  # Will fail fast (4xx)
            "https://httpstat.us/500?sleep=100",  # Will retry (5xx)
        ]

        print("\n" + "=" * 70)
        print("RESILIENT SCRAPER TEST - Batch URLs")
        print("=" * 70)
        print(f"URLs: {len(test_urls)}")
        print(f"Max concurrent: 5")
        print()

        results = await batch_scrape_with_retry(
            test_urls,
            crawl4ai_wrapper,
            max_concurrent=3
        )

        print(f"\n" + "=" * 70)
        print("RESULTS")
        print("=" * 70)
        print(f"Total: {results['total']}")
        print(f"Successful: {results['success_count']}")
        print(f"Failed: {results['failure_count']}")
        print(f"Success Rate: {results['success_rate']:.1f}%")

        if results['failed']:
            print(f"\nFailed URLs:")
            for url, error in results['failed']:
                print(f"  ❌ {url}")
                print(f"     {error}")


    # Run test
    if len(sys.argv) > 1 and sys.argv[1] == "--batch":
        asyncio.run(test_batch_urls())
    else:
        asyncio.run(test_single_url())
