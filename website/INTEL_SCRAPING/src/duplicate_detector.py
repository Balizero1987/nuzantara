#!/usr/bin/env python3
"""
Duplicate Detection for Intel Scraping
Hash-based URL tracking to avoid re-scraping
"""
import hashlib
import json
from pathlib import Path
from typing import Set

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
SEEN_URLS_FILE = DATA_DIR / "seen_urls.json"


class DuplicateDetector:
    """Track and detect duplicate article URLs"""

    def __init__(self):
        self.seen_hashes: Set[str] = set()
        self._load_seen_urls()

    def _load_seen_urls(self):
        """Load seen URL hashes from disk"""
        if SEEN_URLS_FILE.exists():
            try:
                data = json.loads(SEEN_URLS_FILE.read_text(encoding='utf-8'))
                self.seen_hashes = set(data.get('hashes', []))
            except Exception as e:
                print(f"⚠️  Could not load seen URLs: {e}")
                self.seen_hashes = set()

    def _save_seen_urls(self):
        """Save seen URL hashes to disk"""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            data = {'hashes': list(self.seen_hashes)}
            SEEN_URLS_FILE.write_text(json.dumps(data, indent=2), encoding='utf-8')
        except Exception as e:
            print(f"⚠️  Could not save seen URLs: {e}")

    @staticmethod
    def _hash_url(url: str) -> str:
        """Generate hash for URL"""
        return hashlib.sha256(url.encode('utf-8')).hexdigest()[:16]

    def is_duplicate(self, url: str) -> bool:
        """Check if URL has been seen before

        Args:
            url: Article URL

        Returns:
            True if URL is duplicate, False otherwise
        """
        url_hash = self._hash_url(url)
        return url_hash in self.seen_hashes

    def mark_seen(self, url: str) -> None:
        """Mark URL as seen

        Args:
            url: Article URL
        """
        url_hash = self._hash_url(url)
        self.seen_hashes.add(url_hash)

    def save(self) -> None:
        """Save current state to disk"""
        self._save_seen_urls()

    def get_stats(self) -> dict:
        """Get duplicate detection stats

        Returns:
            Dictionary with stats
        """
        return {
            'total_seen': len(self.seen_hashes),
            'storage_file': str(SEEN_URLS_FILE)
        }

    def clear_old_hashes(self, keep_latest: int = 10000) -> int:
        """Clear old hashes to limit memory usage

        Args:
            keep_latest: Number of recent hashes to keep

        Returns:
            Number of hashes removed
        """
        if len(self.seen_hashes) <= keep_latest:
            return 0

        # Keep only the most recent hashes
        # Note: This is a simple implementation that removes oldest
        # In production, you'd want to use a time-based approach
        old_count = len(self.seen_hashes)
        hashes_list = list(self.seen_hashes)
        self.seen_hashes = set(hashes_list[-keep_latest:])

        removed = old_count - len(self.seen_hashes)
        self._save_seen_urls()

        return removed


# Module-level convenience functions
_detector = None

def get_detector() -> DuplicateDetector:
    """Get global duplicate detector instance"""
    global _detector
    if _detector is None:
        _detector = DuplicateDetector()
    return _detector


def is_duplicate(url: str) -> bool:
    """Check if URL is duplicate (convenience function)"""
    return get_detector().is_duplicate(url)


def mark_seen(url: str) -> None:
    """Mark URL as seen (convenience function)"""
    get_detector().mark_seen(url)


if __name__ == '__main__':
    # Test duplicate detection
    detector = DuplicateDetector()

    test_urls = [
        "https://example.com/article1",
        "https://example.com/article2",
        "https://example.com/article1",  # Duplicate
    ]

    for url in test_urls:
        if detector.is_duplicate(url):
            print(f"❌ Duplicate: {url}")
        else:
            print(f"✅ New: {url}")
            detector.mark_seen(url)

    detector.save()
    print(f"\n📊 Stats: {detector.get_stats()}")
