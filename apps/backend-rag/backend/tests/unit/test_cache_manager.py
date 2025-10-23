"""Unit tests for CacheManager"""

import pytest
import hashlib
from pathlib import Path
from datetime import datetime, timedelta

from nuzantara_scraper.core.cache_manager import CacheManager


@pytest.mark.unit
class TestCacheManager:
    """Test CacheManager functionality"""

    def test_initialization(self, temp_cache_dir: Path):
        """Test cache manager initialization"""
        cache = CacheManager(cache_dir=str(temp_cache_dir), ttl_days=7)

        assert cache.cache_dir == temp_cache_dir
        assert cache.ttl_days == 7
        assert cache.cache_file.exists()

    def test_content_hash_generation(self, temp_cache_dir: Path):
        """Test MD5 hash generation"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        content = "Test content for hashing"
        hash_value = cache._get_content_hash(content)

        # Verify it's a valid MD5 hash
        assert len(hash_value) == 32
        assert hash_value.isalnum()

        # Verify same content produces same hash
        hash_value2 = cache._get_content_hash(content)
        assert hash_value == hash_value2

    def test_add_to_cache(self, temp_cache_dir: Path):
        """Test adding content to cache"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        content = "Test content to cache"
        metadata = {"source": "test", "url": "https://example.com"}

        result = cache.add_to_cache(content, metadata)

        assert result is True
        assert cache.is_cached(content)

    def test_is_cached(self, temp_cache_dir: Path):
        """Test checking if content is cached"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        content = "Test content"

        # Should not be cached initially
        assert cache.is_cached(content) is False

        # Add to cache
        cache.add_to_cache(content)

        # Should now be cached
        assert cache.is_cached(content) is True

    def test_cache_expiration(self, temp_cache_dir: Path):
        """Test TTL-based cache expiration"""
        cache = CacheManager(cache_dir=str(temp_cache_dir), ttl_days=7)

        content = "Test content"
        content_hash = cache._get_content_hash(content)

        # Add to cache with old timestamp
        old_timestamp = (datetime.now() - timedelta(days=8)).isoformat()
        cache.cache_data[content_hash] = {
            "timestamp": old_timestamp,
            "metadata": {},
        }
        cache._save_cache()

        # Should be considered expired
        assert cache.is_cached(content) is False

    def test_cleanup_expired_entries(self, temp_cache_dir: Path):
        """Test automatic cleanup of expired entries"""
        cache = CacheManager(cache_dir=str(temp_cache_dir), ttl_days=7)

        # Add fresh entry
        fresh_content = "Fresh content"
        cache.add_to_cache(fresh_content)

        # Add expired entry manually
        expired_hash = hashlib.md5("Expired content".encode()).hexdigest()
        old_timestamp = (datetime.now() - timedelta(days=10)).isoformat()
        cache.cache_data[expired_hash] = {
            "timestamp": old_timestamp,
            "metadata": {},
        }
        cache._save_cache()

        # Cleanup
        cache.cleanup_expired()

        # Fresh should remain, expired should be gone
        assert cache.is_cached(fresh_content) is True
        assert expired_hash not in cache.cache_data

    def test_get_cache_stats(self, temp_cache_dir: Path):
        """Test getting cache statistics"""
        cache = CacheManager(cache_dir=str(temp_cache_dir), ttl_days=7)

        # Add some entries
        cache.add_to_cache("Content 1")
        cache.add_to_cache("Content 2")
        cache.add_to_cache("Content 3")

        stats = cache.get_stats()

        assert stats["total_entries"] == 3
        assert stats["cache_file"] == str(cache.cache_file)

    def test_cache_persistence(self, temp_cache_dir: Path):
        """Test cache persistence across instances"""
        # Create cache and add content
        cache1 = CacheManager(cache_dir=str(temp_cache_dir))
        cache1.add_to_cache("Persistent content")

        # Create new instance
        cache2 = CacheManager(cache_dir=str(temp_cache_dir))

        # Should load existing cache
        assert cache2.is_cached("Persistent content")

    def test_empty_content_handling(self, temp_cache_dir: Path):
        """Test handling of empty content"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        # Empty string should still generate hash
        empty_hash = cache._get_content_hash("")
        assert len(empty_hash) == 32

        # Can cache empty content
        result = cache.add_to_cache("")
        assert result is True

    def test_unicode_content(self, temp_cache_dir: Path):
        """Test handling of unicode content"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        unicode_content = "Test unicode: 你好世界 مرحبا بالعالم"

        # Should handle unicode properly
        cache.add_to_cache(unicode_content)
        assert cache.is_cached(unicode_content)

    def test_large_content(self, temp_cache_dir: Path):
        """Test handling of large content"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        # Create large content (1MB)
        large_content = "x" * (1024 * 1024)

        cache.add_to_cache(large_content)
        assert cache.is_cached(large_content)

    def test_metadata_storage(self, temp_cache_dir: Path):
        """Test storing metadata with cached content"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        content = "Content with metadata"
        metadata = {
            "url": "https://example.com",
            "source": "test_source",
            "category": "property",
        }

        cache.add_to_cache(content, metadata)

        # Verify metadata is stored
        content_hash = cache._get_content_hash(content)
        stored_data = cache.cache_data[content_hash]

        assert stored_data["metadata"] == metadata

    def test_concurrent_access_simulation(self, temp_cache_dir: Path):
        """Test simulated concurrent cache access"""
        cache = CacheManager(cache_dir=str(temp_cache_dir))

        # Simulate multiple rapid additions
        for i in range(10):
            cache.add_to_cache(f"Content {i}")

        # All should be cached
        for i in range(10):
            assert cache.is_cached(f"Content {i}")

        # Total should be correct
        stats = cache.get_stats()
        assert stats["total_entries"] == 10
