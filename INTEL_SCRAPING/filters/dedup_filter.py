#!/usr/bin/env python3
"""
Centralized Deduplication Filter - Swiss-Watch Precision
SINGLE SOURCE OF TRUTH for all deduplication logic.

Features:
- URL normalization and caching
- Content hash based deduplication
- Title similarity matching
- Persistent SQLite cache
- TTL support
"""

import sqlite3
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Set, Tuple
from contextlib import contextmanager
from urllib.parse import urlparse

from INTEL_SCRAPING.core.models import Article


class DeduplicationCache:
    """
    Persistent cache for seen articles.

    Uses SQLite to track:
    - Seen URLs (normalized)
    - Content hashes
    - Title fingerprints
    """

    def __init__(
        self,
        db_path: str = "INTEL_SCRAPING/data/.state/dedup_cache.db",
        ttl_days: int = 30
    ):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.ttl_days = ttl_days
        self._init_database()

    def _init_database(self):
        """Initialize cache database"""
        with self._get_connection() as conn:
            # Seen URLs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS seen_urls (
                    normalized_url TEXT PRIMARY KEY,
                    original_url TEXT NOT NULL,
                    first_seen TEXT NOT NULL,
                    last_seen TEXT NOT NULL,
                    article_id TEXT,
                    category TEXT
                )
            """)

            # Content hashes table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS seen_content_hashes (
                    content_hash TEXT PRIMARY KEY,
                    first_seen TEXT NOT NULL,
                    last_seen TEXT NOT NULL,
                    article_id TEXT,
                    title TEXT
                )
            """)

            # Title fingerprints (for similarity matching)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS seen_titles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title_lower TEXT NOT NULL,
                    title_fingerprint TEXT NOT NULL,
                    first_seen TEXT NOT NULL,
                    article_id TEXT,
                    UNIQUE(title_fingerprint)
                )
            """)

            # Create indices
            conn.execute("CREATE INDEX IF NOT EXISTS idx_url_seen ON seen_urls(last_seen)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_hash_seen ON seen_content_hashes(last_seen)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_title_fp ON seen_titles(title_fingerprint)")

            conn.commit()

    @contextmanager
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(str(self.db_path))
        try:
            yield conn
        finally:
            conn.close()

    def normalize_url(self, url: str) -> str:
        """
        Normalize URL for deduplication.

        Removes:
        - Query parameters
        - Fragments
        - Trailing slashes
        - www prefix
        """
        parsed = urlparse(url)

        # Remove www
        netloc = parsed.netloc
        if netloc.startswith('www.'):
            netloc = netloc[4:]

        # Normalize path
        path = parsed.path.rstrip('/')

        # Construct normalized URL
        normalized = f"{parsed.scheme}://{netloc}{path}"
        return normalized.lower()

    def _generate_title_fingerprint(self, title: str) -> str:
        """
        Generate title fingerprint for similarity matching.

        Removes:
        - Stop words
        - Punctuation
        - Extra spaces

        Then creates hash of normalized title.
        """
        # Normalize
        title_lower = title.lower()

        # Remove common words (basic implementation)
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during'
        }

        words = title_lower.split()
        filtered_words = [w for w in words if w not in stop_words and len(w) > 2]

        # Sort words (order-independent matching)
        fingerprint_text = ' '.join(sorted(filtered_words))

        # Hash
        return hashlib.md5(fingerprint_text.encode('utf-8')).hexdigest()

    def is_url_seen(self, url: str) -> bool:
        """Check if URL has been seen before"""
        normalized = self.normalize_url(url)

        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT 1 FROM seen_urls WHERE normalized_url = ?",
                (normalized,)
            ).fetchone()

            return row is not None

    def is_content_seen(self, content_hash: str) -> bool:
        """Check if content hash has been seen"""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT 1 FROM seen_content_hashes WHERE content_hash = ?",
                (content_hash,)
            ).fetchone()

            return row is not None

    def is_title_seen(self, title: str, similarity_threshold: float = 0.85) -> bool:
        """
        Check if similar title has been seen.

        Uses title fingerprint for exact matching (for now).
        TODO: Implement fuzzy matching for similarity_threshold.
        """
        fingerprint = self._generate_title_fingerprint(title)

        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT 1 FROM seen_titles WHERE title_fingerprint = ?",
                (fingerprint,)
            ).fetchone()

            return row is not None

    def mark_seen(self, article: Article):
        """
        Mark article as seen (all methods).

        Adds:
        - Normalized URL
        - Content hash
        - Title fingerprint
        """
        now = datetime.now().isoformat()
        normalized_url = self.normalize_url(article.url)
        title_fingerprint = self._generate_title_fingerprint(article.title)

        with self._get_connection() as conn:
            # URL
            conn.execute("""
                INSERT OR REPLACE INTO seen_urls
                (normalized_url, original_url, first_seen, last_seen, article_id, category)
                VALUES (?, ?, COALESCE((SELECT first_seen FROM seen_urls WHERE normalized_url = ?), ?), ?, ?, ?)
            """, (normalized_url, article.url, normalized_url, now, now, article.id, article.category))

            # Content hash
            conn.execute("""
                INSERT OR REPLACE INTO seen_content_hashes
                (content_hash, first_seen, last_seen, article_id, title)
                VALUES (?, COALESCE((SELECT first_seen FROM seen_content_hashes WHERE content_hash = ?), ?), ?, ?, ?)
            """, (article.content_hash, article.content_hash, now, now, article.id, article.title))

            # Title
            conn.execute("""
                INSERT OR IGNORE INTO seen_titles
                (title_lower, title_fingerprint, first_seen, article_id)
                VALUES (?, ?, ?, ?)
            """, (article.title.lower(), title_fingerprint, now, article.id))

            conn.commit()

    def cleanup_old_entries(self):
        """Remove entries older than TTL"""
        cutoff = (datetime.now() - timedelta(days=self.ttl_days)).isoformat()

        with self._get_connection() as conn:
            deleted_urls = conn.execute(
                "DELETE FROM seen_urls WHERE last_seen < ?",
                (cutoff,)
            ).rowcount

            deleted_hashes = conn.execute(
                "DELETE FROM seen_content_hashes WHERE last_seen < ?",
                (cutoff,)
            ).rowcount

            deleted_titles = conn.execute(
                "DELETE FROM seen_titles WHERE first_seen < ?",
                (cutoff,)
            ).rowcount

            conn.commit()

            return {
                'urls': deleted_urls,
                'hashes': deleted_hashes,
                'titles': deleted_titles
            }

    def get_stats(self) -> dict:
        """Get cache statistics"""
        with self._get_connection() as conn:
            url_count = conn.execute("SELECT COUNT(*) as count FROM seen_urls").fetchone()[0]
            hash_count = conn.execute("SELECT COUNT(*) as count FROM seen_content_hashes").fetchone()[0]
            title_count = conn.execute("SELECT COUNT(*) as count FROM seen_titles").fetchone()[0]

            return {
                'urls': url_count,
                'content_hashes': hash_count,
                'titles': title_count,
                'total': url_count + hash_count + title_count
            }


class DeduplicationFilter:
    """
    🔥 SINGLE SOURCE OF TRUTH for deduplication.

    Use this filter in ALL stages:
    - During scraping
    - During filtering
    - Before processing

    Methods:
    - URL-based deduplication
    - Content hash deduplication
    - Title similarity deduplication
    """

    def __init__(
        self,
        cache_backend: str = "sqlite",
        similarity_threshold: float = 0.85,
        use_cache: bool = True,
        ttl_days: int = 30
    ):
        self.similarity_threshold = similarity_threshold
        self.use_cache = use_cache

        # Initialize cache
        if use_cache and cache_backend == "sqlite":
            self.cache = DeduplicationCache(ttl_days=ttl_days)
        else:
            self.cache = None

        # In-memory cache for current session (fallback)
        self.session_urls: Set[str] = set()
        self.session_hashes: Set[str] = set()

    def is_duplicate(self, article: Article) -> tuple[bool, Optional[str]]:
        """
        Check if article is duplicate.

        Returns:
            (is_duplicate, reason)
        """
        # Check URL
        if self.cache and self.cache.is_url_seen(article.url):
            return True, "duplicate_url"

        if article.normalize_url() in self.session_urls:
            return True, "duplicate_url_session"

        # Check content hash
        if self.cache and self.cache.is_content_seen(article.content_hash):
            return True, "duplicate_content"

        if article.content_hash in self.session_hashes:
            return True, "duplicate_content_session"

        # Check title similarity
        if self.cache and self.cache.is_title_seen(article.title, self.similarity_threshold):
            return True, "duplicate_title"

        return False, None

    def mark_seen(self, article: Article):
        """Mark article as seen"""
        # Persistent cache
        if self.cache:
            self.cache.mark_seen(article)

        # Session cache
        self.session_urls.add(article.normalize_url())
        self.session_hashes.add(article.content_hash)

    def filter_duplicates(self, articles: List[Article]) -> tuple[List[Article], dict]:
        """
        Filter out duplicates from list of articles.

        Returns:
            (unique_articles, stats)
        """
        unique = []
        stats = {
            'input_count': len(articles),
            'duplicate_url': 0,
            'duplicate_content': 0,
            'duplicate_title': 0,
            'duplicate_url_session': 0,
            'duplicate_content_session': 0,
            'output_count': 0
        }

        for article in articles:
            is_dup, reason = self.is_duplicate(article)

            if is_dup:
                stats[reason] = stats.get(reason, 0) + 1
            else:
                unique.append(article)
                self.mark_seen(article)

        stats['output_count'] = len(unique)

        return unique, stats

    def cleanup_old_entries(self):
        """Cleanup old cache entries"""
        if self.cache:
            return self.cache.cleanup_old_entries()
        return {}

    def get_stats(self) -> dict:
        """Get deduplication statistics"""
        if self.cache:
            cache_stats = self.cache.get_stats()
        else:
            cache_stats = {}

        return {
            'cache': cache_stats,
            'session_urls': len(self.session_urls),
            'session_hashes': len(self.session_hashes),
            'total_tracked': cache_stats.get('total', 0) + len(self.session_urls)
        }


if __name__ == "__main__":
    # Test deduplication
    print("=" * 60)
    print("INTEL SCRAPING - Deduplication Filter Test")
    print("=" * 60)

    # Create test filter
    dedup = DeduplicationFilter(use_cache=True, ttl_days=30)

    # Create test articles
    article1 = Article(
        url="https://openai.com/blog/gpt-4",
        title="GPT-4 Technical Report",
        content="GPT-4 is amazing..." * 100,
        published_date=datetime.now(),
        source="OpenAI",
        category="ai_tech"
    )

    article2 = Article(
        url="https://openai.com/blog/gpt-4/",  # Same but with trailing slash
        title="GPT-4 Technical Report",
        content="GPT-4 is amazing..." * 100,
        published_date=datetime.now(),
        source="OpenAI",
        category="ai_tech"
    )

    article3 = Article(
        url="https://www.openai.com/blog/gpt-4",  # Same but with www
        title="GPT-4 Technical Report",
        content="GPT-4 is amazing..." * 100,
        published_date=datetime.now(),
        source="OpenAI",
        category="ai_tech"
    )

    print(f"\n📝 Testing with 3 similar articles...")

    # Test
    articles = [article1, article2, article3]
    unique, stats = dedup.filter_duplicates(articles)

    print(f"\n✅ Results:")
    print(f"   Input: {stats['input_count']}")
    print(f"   Output: {stats['output_count']}")
    print(f"   Duplicate URLs: {stats.get('duplicate_url', 0)}")
    print(f"   Duplicate content: {stats.get('duplicate_content', 0)}")

    # Stats
    dedup_stats = dedup.get_stats()
    print(f"\n📊 Cache stats:")
    for key, value in dedup_stats.items():
        print(f"   {key}: {value}")

    print("\n" + "=" * 60)
