"""Base engine interface"""

from abc import ABC, abstractmethod


class BaseEngine(ABC):
    """Abstract base class for scraping engines"""

    @abstractmethod
    def fetch(self, url: str) -> str:
        """
        Fetch HTML content from URL

        Args:
            url: URL to fetch

        Returns:
            HTML content as string

        Raises:
            Exception on fetch failure
        """
        pass

    @staticmethod
    @abstractmethod
    def test(url: str) -> bool:
        """
        Test if engine can handle this URL

        Args:
            url: URL to test

        Returns:
            True if engine can handle URL
        """
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Engine name"""
        pass
