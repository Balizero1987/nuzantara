"""
Unit tests for Cache Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from core.cache import CacheService, _memory_cache, cached, invalidate_cache

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings configuration"""
    with patch("app.core.config.settings") as mock:
        mock.redis_url = None
        yield mock


@pytest.fixture
def mock_redis_client():
    """Mock Redis client"""
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_client.get.return_value = None
    mock_client.setex.return_value = True
    mock_client.delete.return_value = 1
    mock_client.keys.return_value = []
    return mock_client


@pytest.fixture
def cache_service_no_redis():
    """Create CacheService without Redis"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = None
        with patch("core.cache.logger"):
            service = CacheService()
            return service


@pytest.fixture
def cache_service_with_redis(mock_redis_client):
    """Create CacheService with Redis"""
    mock_redis_module = MagicMock()
    mock_redis_module.from_url.return_value = mock_redis_client

    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = "redis://localhost:6379"
        with patch.dict("sys.modules", {"redis": mock_redis_module}):
            with patch("core.cache.logger"):
                service = CacheService()
                return service


@pytest.fixture
def clear_memory_cache():
    """Clear memory cache before and after test"""
    _memory_cache.clear()
    yield
    _memory_cache.clear()


# ============================================================================
# Tests for CacheService.__init__
# ============================================================================


def test_init_without_redis_url():
    """Test initialization without Redis URL"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = None
        with patch("core.cache.logger") as mock_logger:
            service = CacheService()
            assert service.redis_available is False
            assert service.redis_client is None
            assert service.stats == {"hits": 0, "misses": 0, "errors": 0}
            mock_logger.info.assert_called_once()


def test_init_with_redis_url_success(mock_redis_client):
    """Test initialization with Redis URL and successful connection"""
    mock_redis_module = MagicMock()
    mock_redis_module.from_url.return_value = mock_redis_client

    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = "redis://localhost:6379"
        with patch.dict("sys.modules", {"redis": mock_redis_module}):
            with patch("core.cache.logger") as mock_logger:
                service = CacheService()
                assert service.redis_available is True
                assert service.redis_client == mock_redis_client
                mock_redis_module.from_url.assert_called_once_with(
                    "redis://localhost:6379", decode_responses=True
                )
                mock_redis_client.ping.assert_called_once()
                mock_logger.info.assert_called_once()


def test_init_with_redis_connection_error():
    """Test initialization when Redis connection fails"""
    mock_redis_module = MagicMock()
    mock_redis_module.from_url.side_effect = Exception("Connection refused")

    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = "redis://localhost:6379"
        with patch.dict("sys.modules", {"redis": mock_redis_module}):
            with patch("core.cache.logger") as mock_logger:
                service = CacheService()
                assert service.redis_available is False
                assert service.redis_client is None
                mock_logger.warning.assert_called_once()


def test_init_with_redis_ping_error(mock_redis_client):
    """Test initialization when Redis ping fails"""
    mock_redis_module = MagicMock()
    mock_redis_module.from_url.return_value = mock_redis_client
    mock_redis_client.ping.side_effect = Exception("Ping failed")

    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = "redis://localhost:6379"
        with patch.dict("sys.modules", {"redis": mock_redis_module}):
            with patch("core.cache.logger") as mock_logger:
                service = CacheService()
                assert service.redis_available is False
                mock_logger.warning.assert_called_once()


# ============================================================================
# Tests for _generate_key
# ============================================================================


def test_generate_key_with_args(cache_service_no_redis):
    """Test key generation with positional arguments"""
    key = cache_service_no_redis._generate_key("test", "arg1", "arg2")
    assert key.startswith("zantara:test:")
    assert len(key.split(":")[2]) == 12  # MD5 hash truncated to 12 chars


def test_generate_key_with_kwargs(cache_service_no_redis):
    """Test key generation with keyword arguments"""
    key1 = cache_service_no_redis._generate_key("test", key1="value1", key2="value2")
    key2 = cache_service_no_redis._generate_key("test", key2="value2", key1="value1")
    # Should be deterministic (same order after sort_keys=True)
    assert key1 == key2


def test_generate_key_with_mixed_args(cache_service_no_redis):
    """Test key generation with mixed args and kwargs"""
    key = cache_service_no_redis._generate_key("test", "arg1", key1="value1")
    assert key.startswith("zantara:test:")
    assert len(key) > 0


def test_generate_key_filters_self(cache_service_no_redis):
    """Test that 'self' is filtered from args"""

    class TestClass:
        pass

    obj = TestClass()
    key = cache_service_no_redis._generate_key("test", obj, "arg1")
    # Should not include obj in the hash
    assert key.startswith("zantara:test:")


# ============================================================================
# Tests for get method
# ============================================================================


def test_get_from_redis_hit(cache_service_with_redis, mock_redis_client):
    """Test get from Redis with cache hit"""
    mock_redis_client.get.return_value = '{"key": "value"}'
    result = cache_service_with_redis.get("test_key")
    assert result == {"key": "value"}
    assert cache_service_with_redis.stats["hits"] == 1
    assert cache_service_with_redis.stats["misses"] == 0
    mock_redis_client.get.assert_called_once_with("test_key")


def test_get_from_redis_miss(cache_service_with_redis, mock_redis_client):
    """Test get from Redis with cache miss"""
    mock_redis_client.get.return_value = None
    result = cache_service_with_redis.get("test_key")
    assert result is None
    assert cache_service_with_redis.stats["hits"] == 0
    assert cache_service_with_redis.stats["misses"] == 1


def test_get_from_memory_hit(cache_service_no_redis, clear_memory_cache):
    """Test get from memory cache with cache hit"""
    _memory_cache["test_key"] = {"key": "value"}
    result = cache_service_no_redis.get("test_key")
    assert result == {"key": "value"}
    assert cache_service_no_redis.stats["hits"] == 1
    assert cache_service_no_redis.stats["misses"] == 0


def test_get_from_memory_miss(cache_service_no_redis, clear_memory_cache):
    """Test get from memory cache with cache miss"""
    result = cache_service_no_redis.get("test_key")
    assert result is None
    assert cache_service_no_redis.stats["hits"] == 0
    assert cache_service_no_redis.stats["misses"] == 1


def test_get_redis_error(cache_service_with_redis, mock_redis_client):
    """Test get when Redis raises exception"""
    mock_redis_client.get.side_effect = Exception("Redis error")
    with patch("core.cache.logger") as mock_logger:
        result = cache_service_with_redis.get("test_key")
        assert result is None
        assert cache_service_with_redis.stats["errors"] == 1
        mock_logger.error.assert_called_once()


def test_get_invalid_json(cache_service_with_redis, mock_redis_client):
    """Test get with invalid JSON from Redis"""
    mock_redis_client.get.return_value = "invalid json"
    with patch("core.cache.logger") as mock_logger:
        result = cache_service_with_redis.get("test_key")
        # Exception should be caught and None returned
        assert result is None
        assert cache_service_with_redis.stats["errors"] == 1
        mock_logger.error.assert_called_once()


# ============================================================================
# Tests for set method
# ============================================================================


def test_set_to_redis(cache_service_with_redis, mock_redis_client):
    """Test set to Redis"""
    result = cache_service_with_redis.set("test_key", {"key": "value"}, ttl=600)
    assert result is True
    mock_redis_client.setex.assert_called_once_with("test_key", 600, '{"key": "value"}')


def test_set_to_memory(cache_service_no_redis, clear_memory_cache):
    """Test set to memory cache"""
    result = cache_service_no_redis.set("test_key", {"key": "value"}, ttl=600)
    assert result is True
    assert _memory_cache["test_key"] == {"key": "value"}


def test_set_redis_error(cache_service_with_redis, mock_redis_client):
    """Test set when Redis raises exception"""
    mock_redis_client.setex.side_effect = Exception("Redis error")
    with patch("core.cache.logger") as mock_logger:
        result = cache_service_with_redis.set("test_key", {"key": "value"})
        assert result is False
        assert cache_service_with_redis.stats["errors"] == 1
        mock_logger.error.assert_called_once()


def test_set_default_ttl(cache_service_with_redis, mock_redis_client):
    """Test set with default TTL"""
    cache_service_with_redis.set("test_key", {"key": "value"})
    mock_redis_client.setex.assert_called_once_with("test_key", 300, '{"key": "value"}')


# ============================================================================
# Tests for delete method
# ============================================================================


def test_delete_from_redis(cache_service_with_redis, mock_redis_client):
    """Test delete from Redis"""
    result = cache_service_with_redis.delete("test_key")
    assert result is True
    mock_redis_client.delete.assert_called_once_with("test_key")


def test_delete_from_memory(cache_service_no_redis, clear_memory_cache):
    """Test delete from memory cache"""
    _memory_cache["test_key"] = {"key": "value"}
    result = cache_service_no_redis.delete("test_key")
    assert result is True
    assert "test_key" not in _memory_cache


def test_delete_nonexistent_memory(cache_service_no_redis, clear_memory_cache):
    """Test delete non-existent key from memory cache"""
    result = cache_service_no_redis.delete("nonexistent_key")
    assert result is True  # pop with None default doesn't raise


def test_delete_redis_error(cache_service_with_redis, mock_redis_client):
    """Test delete when Redis raises exception"""
    mock_redis_client.delete.side_effect = Exception("Redis error")
    with patch("core.cache.logger") as mock_logger:
        result = cache_service_with_redis.delete("test_key")
        assert result is False
        mock_logger.error.assert_called_once()


# ============================================================================
# Tests for clear_pattern method
# ============================================================================


def test_clear_pattern_redis_with_keys(cache_service_with_redis, mock_redis_client):
    """Test clear_pattern with Redis and matching keys"""
    mock_redis_client.keys.return_value = ["key1", "key2", "key3"]
    mock_redis_client.delete.return_value = 3
    result = cache_service_with_redis.clear_pattern("zantara:test:*")
    assert result == 3
    mock_redis_client.keys.assert_called_once_with("zantara:test:*")
    mock_redis_client.delete.assert_called_once_with("key1", "key2", "key3")


def test_clear_pattern_redis_no_keys(cache_service_with_redis, mock_redis_client):
    """Test clear_pattern with Redis and no matching keys"""
    mock_redis_client.keys.return_value = []
    result = cache_service_with_redis.clear_pattern("zantara:test:*")
    assert result == 0
    mock_redis_client.delete.assert_not_called()


def test_clear_pattern_memory(cache_service_no_redis, clear_memory_cache):
    """Test clear_pattern with memory cache"""
    _memory_cache["zantara:test:key1"] = "value1"
    _memory_cache["zantara:test:key2"] = "value2"
    _memory_cache["zantara:other:key3"] = "value3"
    result = cache_service_no_redis.clear_pattern("zantara:test:*")
    assert result == 2
    assert "zantara:test:key1" not in _memory_cache
    assert "zantara:test:key2" not in _memory_cache
    assert "zantara:other:key3" in _memory_cache


def test_clear_pattern_memory_no_match(cache_service_no_redis, clear_memory_cache):
    """Test clear_pattern with memory cache and no matches"""
    _memory_cache["zantara:other:key"] = "value"
    result = cache_service_no_redis.clear_pattern("zantara:test:*")
    assert result == 0
    assert "zantara:other:key" in _memory_cache


def test_clear_pattern_redis_error(cache_service_with_redis, mock_redis_client):
    """Test clear_pattern when Redis raises exception"""
    mock_redis_client.keys.side_effect = Exception("Redis error")
    with patch("core.cache.logger") as mock_logger:
        result = cache_service_with_redis.clear_pattern("zantara:test:*")
        assert result == 0
        mock_logger.error.assert_called_once()


# ============================================================================
# Tests for get_stats method
# ============================================================================


def test_get_stats_with_hits_and_misses(cache_service_no_redis):
    """Test get_stats with hits and misses"""
    cache_service_no_redis.stats = {"hits": 10, "misses": 5, "errors": 0}
    stats = cache_service_no_redis.get_stats()
    assert stats["hits"] == 10
    assert stats["misses"] == 5
    assert stats["errors"] == 0
    assert stats["hit_rate"] == "66.7%"
    assert stats["backend"] == "memory"
    assert stats["connected"] is False


def test_get_stats_redis_backend(cache_service_with_redis):
    """Test get_stats with Redis backend"""
    cache_service_with_redis.stats = {"hits": 8, "misses": 2, "errors": 0}
    stats = cache_service_with_redis.get_stats()
    assert stats["backend"] == "redis"
    assert stats["connected"] is True
    assert stats["hit_rate"] == "80.0%"


def test_get_stats_no_requests(cache_service_no_redis):
    """Test get_stats with no requests"""
    stats = cache_service_no_redis.get_stats()
    assert stats["hits"] == 0
    assert stats["misses"] == 0
    assert stats["hit_rate"] == "0.0%"


def test_get_stats_with_errors(cache_service_no_redis):
    """Test get_stats with errors"""
    cache_service_no_redis.stats = {"hits": 5, "misses": 3, "errors": 2}
    stats = cache_service_no_redis.get_stats()
    assert stats["errors"] == 2


# ============================================================================
# Tests for cached decorator
# ============================================================================


@pytest.mark.asyncio
async def test_cached_decorator_cache_hit(cache_service_no_redis, clear_memory_cache):
    """Test cached decorator with cache hit"""
    call_count = 0

    @cached(ttl=300, prefix="test")
    async def test_function(arg1, arg2):
        nonlocal call_count
        call_count += 1
        return {"result": arg1 + arg2}

    # First call - cache miss
    result1 = await test_function("a", "b")
    assert result1 == {"result": "ab"}
    assert call_count == 1

    # Second call - cache hit
    result2 = await test_function("a", "b")
    assert result2 == {"result": "ab"}
    assert call_count == 1  # Function not called again


@pytest.mark.asyncio
async def test_cached_decorator_cache_miss(cache_service_no_redis, clear_memory_cache):
    """Test cached decorator with cache miss"""
    call_count = 0

    @cached(ttl=300, prefix="test")
    async def test_function(arg):
        nonlocal call_count
        call_count += 1
        return {"result": arg}

    # Different arguments = cache miss
    await test_function("a")
    await test_function("b")
    assert call_count == 2


@pytest.mark.asyncio
async def test_cached_decorator_custom_ttl(mock_redis_client):
    """Test cached decorator with custom TTL"""
    mock_redis_module = MagicMock()
    mock_redis_module.from_url.return_value = mock_redis_client

    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = "redis://localhost:6379"
        with patch.dict("sys.modules", {"redis": mock_redis_module}):
            with patch("core.cache.logger"):
                # Recreate cache service to use mocked redis
                from core.cache import cache

                cache.redis_available = True
                cache.redis_client = mock_redis_client

                @cached(ttl=600, prefix="test")
                async def test_function():
                    return {"result": "test"}

                await test_function()
                # Verify TTL was used
                call_args = mock_redis_client.setex.call_args
                assert call_args[0][1] == 600  # TTL parameter


@pytest.mark.asyncio
async def test_cached_decorator_custom_prefix(clear_memory_cache):
    """Test cached decorator with custom prefix"""
    # Use the global cache instance
    from core.cache import cache

    cache.redis_available = False
    cache.redis_client = None

    @cached(ttl=300, prefix="custom")
    async def test_function():
        return {"result": "test"}

    await test_function()
    # Check that key starts with custom prefix
    keys = list(_memory_cache.keys())
    assert len(keys) == 1
    assert keys[0].startswith("zantara:custom:")


@pytest.mark.asyncio
async def test_cached_decorator_with_kwargs(cache_service_no_redis, clear_memory_cache):
    """Test cached decorator with keyword arguments"""
    call_count = 0

    @cached(ttl=300, prefix="test")
    async def test_function(**kwargs):
        nonlocal call_count
        call_count += 1
        return kwargs

    result1 = await test_function(key1="value1", key2="value2")
    result2 = await test_function(key2="value2", key1="value1")  # Same, different order
    assert result1 == result2
    assert call_count == 1  # Should be cached


# ============================================================================
# Tests for invalidate_cache function
# ============================================================================


def test_invalidate_cache_with_pattern(cache_service_no_redis, clear_memory_cache):
    """Test invalidate_cache function"""
    _memory_cache["zantara:test:key1"] = "value1"
    _memory_cache["zantara:test:key2"] = "value2"
    _memory_cache["zantara:other:key3"] = "value3"

    with patch("core.cache.cache", cache_service_no_redis):
        with patch("core.cache.logger") as mock_logger:
            count = invalidate_cache("zantara:test:*")
            assert count == 2
            mock_logger.info.assert_called_once()


def test_invalidate_cache_default_pattern(cache_service_no_redis, clear_memory_cache):
    """Test invalidate_cache with default pattern"""
    _memory_cache["zantara:test:key1"] = "value1"
    _memory_cache["zantara:test:key2"] = "value2"

    with patch("core.cache.cache", cache_service_no_redis), patch("core.cache.logger"):
        count = invalidate_cache()
        assert count == 2


def test_invalidate_cache_no_matches(cache_service_no_redis, clear_memory_cache):
    """Test invalidate_cache with no matching keys"""
    _memory_cache["zantara:other:key"] = "value"

    with patch("core.cache.cache", cache_service_no_redis), patch("core.cache.logger"):
        count = invalidate_cache("zantara:test:*")
        assert count == 0


# ============================================================================
# Edge Cases and Integration Tests
# ============================================================================


def test_redis_unavailable_fallback(cache_service_with_redis, mock_redis_client):
    """Test that Redis errors fall back to memory cache"""
    # Simulate Redis becoming unavailable
    cache_service_with_redis.redis_available = False
    cache_service_with_redis.redis_client = None

    result = cache_service_with_redis.set("test_key", {"key": "value"})
    assert result is True
    # Should use memory cache
    assert "test_key" in _memory_cache


def test_memory_cache_persistence(cache_service_no_redis, clear_memory_cache):
    """Test that memory cache persists across service instances"""
    _memory_cache["persistent_key"] = "persistent_value"
    service2 = CacheService()
    result = service2.get("persistent_key")
    assert result == "persistent_value"


def test_stats_independence():
    """Test that stats are independent per service instance"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.redis_url = None
        with patch("core.cache.logger"):
            service1 = CacheService()
            service2 = CacheService()

            service1.get("key1")
            service2.get("key2")

            assert service1.stats["misses"] == 1
            assert service2.stats["misses"] == 1
            # Stats should be independent
            assert service1.stats is not service2.stats


def test_generate_key_with_complex_types(cache_service_no_redis):
    """Test key generation with complex types"""
    key = cache_service_no_redis._generate_key("test", [1, 2, 3], {"nested": {"key": "value"}})
    assert key.startswith("zantara:test:")
    assert len(key.split(":")[2]) == 12
