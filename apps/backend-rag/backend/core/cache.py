"""
Redis Caching Layer for ZANTARA
Provides intelligent caching for expensive operations

Features:
- TTL-based expiration
- Automatic key generation
- Cache invalidation
- Hit/miss metrics
"""

import hashlib
import json
import logging
from collections.abc import Callable
from functools import wraps
from typing import Any

logger = logging.getLogger(__name__)

# In-memory cache fallback (if Redis not available)
_memory_cache = {}


class CacheService:
    """
    Intelligent caching service with Redis backend
    Falls back to in-memory cache if Redis unavailable
    """

    def __init__(self):
        self.redis_available = False
        self.redis_client = None
        self.stats = {"hits": 0, "misses": 0, "errors": 0}

        # Try to connect to Redis (Fly.io provides REDIS_URL)
        from app.core.config import settings

        redis_url = settings.redis_url
        if redis_url:
            try:
                import redis

                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                self.redis_client.ping()
                self.redis_available = True
                logger.info("✅ Redis cache connected")
            except Exception as e:
                logger.warning(f"⚠️ Redis not available, using memory cache: {e}")
        else:
            logger.info("ℹ️ No REDIS_URL, using in-memory cache")

    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        # Skip 'self' from args (first argument for instance methods)
        # This prevents "Object not JSON serializable" errors
        filtered_args = args[1:] if args and hasattr(args[0], "__dict__") else args

        # Create deterministic key from arguments
        key_data = json.dumps({"args": filtered_args, "kwargs": kwargs}, sort_keys=True)
        key_hash = hashlib.md5(key_data.encode()).hexdigest()[:12]
        return f"zantara:{prefix}:{key_hash}"

    def get(self, key: str) -> Any | None:
        """Get value from cache"""
        try:
            if self.redis_available and self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    self.stats["hits"] += 1
                    return json.loads(value)
                self.stats["misses"] += 1
                return None
            else:
                # In-memory fallback
                if key in _memory_cache:
                    self.stats["hits"] += 1
                    return _memory_cache[key]
                self.stats["misses"] += 1
                return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.stats["errors"] += 1
            return None

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL (seconds)"""
        try:
            if self.redis_available and self.redis_client:
                self.redis_client.setex(key, ttl, json.dumps(value))
                return True
            else:
                # In-memory fallback (no TTL support)
                _memory_cache[key] = value
                return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self.stats["errors"] += 1
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if self.redis_available and self.redis_client:
                self.redis_client.delete(key)
                return True
            else:
                _memory_cache.pop(key, None)
                return True
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            if self.redis_available and self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                # In-memory: clear keys matching pattern
                keys_to_delete = [k for k in _memory_cache if pattern.replace("*", "") in k]
                for key in keys_to_delete:
                    del _memory_cache[key]
                return len(keys_to_delete)
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return 0

    def get_stats(self) -> dict:
        """Get cache statistics"""
        total = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total * 100) if total > 0 else 0

        return {
            "backend": "redis" if self.redis_available else "memory",
            "connected": self.redis_available,
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "errors": self.stats["errors"],
            "hit_rate": f"{hit_rate:.1f}%",
        }


# Global cache instance
cache = CacheService()


def cached(ttl: int = 300, prefix: str = "default"):
    """
    Decorator to cache function results

    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        prefix: Cache key prefix

    Example:
        @cached(ttl=600, prefix="agents")
        async def get_agents_status():
            return expensive_operation()
    """

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache._generate_key(prefix, *args, **kwargs)

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"✅ Cache HIT: {cache_key}")
                return cached_value

            # Cache miss - execute function
            logger.debug(f"❌ Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl)

            return result

        return wrapper

    return decorator


def invalidate_cache(pattern: str = "zantara:*"):
    """
    Invalidate cache entries matching pattern

    Args:
        pattern: Redis key pattern (default: all zantara keys)

    Example:
        invalidate_cache("zantara:agents:*")
    """
    count = cache.clear_pattern(pattern)
    logger.info(f"🗑️ Invalidated {count} cache entries matching '{pattern}'")
    return count
