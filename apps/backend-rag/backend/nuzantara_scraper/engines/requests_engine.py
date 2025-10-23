"""Requests-based engine for simple HTTP scraping"""

import requests
from typing import Optional
from loguru import logger

from .base_engine import BaseEngine


class RequestsEngine(BaseEngine):
    """
    Simple HTTP engine using requests library
    Fast and lightweight, but no JavaScript support
    """

    def __init__(self, timeout: int = 30, user_agent: Optional[str] = None):
        self.timeout = timeout
        self.user_agent = user_agent or "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

    def fetch(self, url: str) -> str:
        """Fetch HTML using requests"""
        headers = {
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }

        try:
            response = requests.get(url, headers=headers, timeout=self.timeout)
            response.raise_for_status()

            logger.debug(f"RequestsEngine fetched: {url} ({response.status_code})")
            return response.text

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error: {e}")
            raise
        except requests.exceptions.Timeout:
            logger.error(f"Timeout fetching: {url}")
            raise
        except Exception as e:
            logger.error(f"RequestsEngine error: {e}")
            raise

    @staticmethod
    def test(url: str) -> bool:
        """Requests engine can handle any URL (fallback)"""
        return True

    @property
    def name(self) -> str:
        return "RequestsEngine"
