"""
Unified cache management for all scrapers
Handles content deduplication and seen content tracking
"""

import json
import hashlib
from pathlib import Path
from typing import Set, Optional
from datetime import datetime, timedelta
from loguru import logger


class CacheManager:
    """Manages scraper cache for deduplication"""

    def __init__(self, cache_dir: Path, ttl_days: int = 7):
        """
        Initialize cache manager

        Args:
            cache_dir: Directory to store cache files
            ttl_days: Time to live for cache entries in days
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl_days = ttl_days

        self.cache_file = self.cache_dir / "seen_hashes.json"
        self.metadata_file = self.cache_dir / "cache_metadata.json"

        self.seen_hashes: Set[str] = self._load_cache()
        self.metadata: dict = self._load_metadata()

    def _load_cache(self) -> Set[str]:
        """Load seen content hashes from cache file"""
        if not self.cache_file.exists():
            return set()

        try:
            with open(self.cache_file, 'r') as f:
                return set(json.load(f))
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
            return set()

    def _load_metadata(self) -> dict:
        """Load cache metadata"""
        if not self.metadata_file.exists():
            return {"created_at": datetime.now().isoformat(), "entries": {}}

        try:
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading metadata: {e}")
            return {"created_at": datetime.now().isoformat(), "entries": {}}

    def save(self):
        """Save cache to disk"""
        try:
            # Save hashes
            with open(self.cache_file, 'w') as f:
                json.dump(list(self.seen_hashes), f, indent=2)

            # Save metadata
            self.metadata["last_updated"] = datetime.now().isoformat()
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)

            logger.debug(f"Cache saved: {len(self.seen_hashes)} entries")
        except Exception as e:
            logger.error(f"Error saving cache: {e}")

    def content_hash(self, content: str) -> str:
        """Generate MD5 hash for content"""
        return hashlib.md5(content.encode()).hexdigest()

    def is_seen(self, content_hash: str) -> bool:
        """Check if content hash has been seen before"""
        return content_hash in self.seen_hashes

    def mark_seen(self, content_hash: str, metadata: Optional[dict] = None):
        """Mark content as seen"""
        self.seen_hashes.add(content_hash)

        if metadata:
            self.metadata["entries"][content_hash] = {
                "timestamp": datetime.now().isoformat(),
                **metadata
            }

    def clean_expired(self):
        """Remove expired cache entries based on TTL"""
        if not self.metadata.get("entries"):
            return

        cutoff_date = datetime.now() - timedelta(days=self.ttl_days)
        expired_hashes = []

        for content_hash, entry_data in self.metadata["entries"].items():
            timestamp = datetime.fromisoformat(entry_data["timestamp"])
            if timestamp < cutoff_date:
                expired_hashes.append(content_hash)

        # Remove expired entries
        for content_hash in expired_hashes:
            self.seen_hashes.discard(content_hash)
            del self.metadata["entries"][content_hash]

        if expired_hashes:
            logger.info(f"Cleaned {len(expired_hashes)} expired cache entries")
            self.save()

    def clear(self):
        """Clear all cache"""
        self.seen_hashes.clear()
        self.metadata = {"created_at": datetime.now().isoformat(), "entries": {}}
        self.save()
        logger.info("Cache cleared")

    def get_stats(self) -> dict:
        """Get cache statistics"""
        return {
            "total_entries": len(self.seen_hashes),
            "cache_file": str(self.cache_file),
            "ttl_days": self.ttl_days,
            "created_at": self.metadata.get("created_at"),
            "last_updated": self.metadata.get("last_updated"),
        }
