#!/usr/bin/env python3
"""
Circuit Breaker Pattern for Web Scraping
Prevents cascading failures by stopping requests to failing domains
"""

import asyncio
import time
import logging
from enum import Enum
from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from collections import defaultdict

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "CLOSED"      # Normal operation, requests allowed
    OPEN = "OPEN"          # Too many failures, requests blocked
    HALF_OPEN = "HALF_OPEN"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker"""
    failure_threshold: int = 5          # Open after N consecutive failures
    recovery_timeout: int = 300         # Seconds to wait before testing recovery (5 min)
    success_threshold: int = 2          # Successes needed in HALF_OPEN to close
    timeout: int = 30                   # Request timeout in seconds


@dataclass
class CircuitMetrics:
    """Metrics for a circuit breaker"""
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: float = 0
    last_state_change: float = field(default_factory=time.time)
    total_requests: int = 0
    total_failures: int = 0
    total_successes: int = 0

    def reset(self):
        """Reset counters (used when closing circuit)"""
        self.failure_count = 0
        self.success_count = 0


class CircuitBreaker:
    """
    Circuit breaker for individual domains

    States:
    - CLOSED: Normal operation, all requests allowed
    - OPEN: Too many failures, all requests blocked
    - HALF_OPEN: Testing recovery, limited requests allowed

    Transitions:
    - CLOSED → OPEN: After failure_threshold consecutive failures
    - OPEN → HALF_OPEN: After recovery_timeout seconds
    - HALF_OPEN → CLOSED: After success_threshold consecutive successes
    - HALF_OPEN → OPEN: On any failure
    """

    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.metrics = CircuitMetrics()
        self._lock = asyncio.Lock()

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection

        Args:
            func: Async function to execute
            *args, **kwargs: Arguments for func

        Returns:
            Function result

        Raises:
            CircuitBreakerOpenError: If circuit is open
            Original exception: If function fails
        """
        async with self._lock:
            self.metrics.total_requests += 1

            # Check if circuit should transition from OPEN to HALF_OPEN
            if self.metrics.state == CircuitState.OPEN:
                time_since_failure = time.time() - self.metrics.last_failure_time
                if time_since_failure >= self.config.recovery_timeout:
                    logger.info(f"🔄 {self.name}: OPEN → HALF_OPEN (testing recovery)")
                    self.metrics.state = CircuitState.HALF_OPEN
                    self.metrics.last_state_change = time.time()
                else:
                    remaining = self.config.recovery_timeout - time_since_failure
                    raise CircuitBreakerOpenError(
                        f"{self.name} circuit is OPEN (retry in {remaining:.0f}s)"
                    )

            # In HALF_OPEN state, only allow one request at a time
            if self.metrics.state == CircuitState.HALF_OPEN:
                logger.info(f"⚠️  {self.name}: Testing recovery in HALF_OPEN state")

        # Execute function (outside lock to allow concurrent requests in CLOSED state)
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result

        except Exception as e:
            await self._on_failure(e)
            raise

    async def _on_success(self):
        """Handle successful request"""
        async with self._lock:
            self.metrics.total_successes += 1

            if self.metrics.state == CircuitState.HALF_OPEN:
                self.metrics.success_count += 1
                logger.info(
                    f"✅ {self.name}: Success in HALF_OPEN "
                    f"({self.metrics.success_count}/{self.config.success_threshold})"
                )

                # Close circuit after enough successes
                if self.metrics.success_count >= self.config.success_threshold:
                    logger.info(f"🔵 {self.name}: HALF_OPEN → CLOSED (recovered)")
                    self.metrics.state = CircuitState.CLOSED
                    self.metrics.last_state_change = time.time()
                    self.metrics.reset()

            elif self.metrics.state == CircuitState.CLOSED:
                # Reset failure count on success in CLOSED state
                self.metrics.failure_count = 0

    async def _on_failure(self, exception: Exception):
        """Handle failed request"""
        async with self._lock:
            self.metrics.total_failures += 1
            self.metrics.failure_count += 1
            self.metrics.last_failure_time = time.time()

            logger.warning(
                f"❌ {self.name}: Failure #{self.metrics.failure_count} - {type(exception).__name__}"
            )

            if self.metrics.state == CircuitState.HALF_OPEN:
                # Any failure in HALF_OPEN → back to OPEN
                logger.error(f"🔴 {self.name}: HALF_OPEN → OPEN (recovery failed)")
                self.metrics.state = CircuitState.OPEN
                self.metrics.last_state_change = time.time()
                self.metrics.reset()

            elif self.metrics.state == CircuitState.CLOSED:
                # Open circuit after threshold failures
                if self.metrics.failure_count >= self.config.failure_threshold:
                    logger.error(
                        f"🔴 {self.name}: CLOSED → OPEN "
                        f"({self.metrics.failure_count} consecutive failures)"
                    )
                    self.metrics.state = CircuitState.OPEN
                    self.metrics.last_state_change = time.time()

    def get_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status"""
        return {
            'name': self.name,
            'state': self.metrics.state.value,
            'failure_count': self.metrics.failure_count,
            'success_count': self.metrics.success_count,
            'total_requests': self.metrics.total_requests,
            'total_successes': self.metrics.total_successes,
            'total_failures': self.metrics.total_failures,
            'success_rate': (
                self.metrics.total_successes / self.metrics.total_requests * 100
                if self.metrics.total_requests > 0 else 0
            ),
            'time_in_current_state': time.time() - self.metrics.last_state_change,
        }


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""
    pass


class DomainCircuitBreakers:
    """
    Manages circuit breakers for multiple domains
    Each domain gets its own circuit breaker
    """

    def __init__(self, config: Optional[CircuitBreakerConfig] = None):
        self.config = config or CircuitBreakerConfig()
        self._breakers: Dict[str, CircuitBreaker] = {}
        self._lock = asyncio.Lock()

    async def get_breaker(self, domain: str) -> CircuitBreaker:
        """Get or create circuit breaker for domain"""
        if domain not in self._breakers:
            async with self._lock:
                if domain not in self._breakers:  # Double-check
                    self._breakers[domain] = CircuitBreaker(domain, self.config)
        return self._breakers[domain]

    async def call(self, domain: str, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker for domain"""
        breaker = await self.get_breaker(domain)
        return await breaker.call(func, *args, **kwargs)

    def get_all_statuses(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all circuit breakers"""
        return {
            domain: breaker.get_status()
            for domain, breaker in self._breakers.items()
        }

    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics across all domains"""
        statuses = self.get_all_statuses()

        if not statuses:
            return {
                'total_domains': 0,
                'open_circuits': 0,
                'half_open_circuits': 0,
                'closed_circuits': 0,
            }

        states = [s['state'] for s in statuses.values()]

        return {
            'total_domains': len(statuses),
            'open_circuits': states.count('OPEN'),
            'half_open_circuits': states.count('HALF_OPEN'),
            'closed_circuits': states.count('CLOSED'),
            'overall_success_rate': (
                sum(s['total_successes'] for s in statuses.values()) /
                sum(s['total_requests'] for s in statuses.values()) * 100
                if sum(s['total_requests'] for s in statuses.values()) > 0 else 0
            ),
        }


# ============================================================================
# Integration Example with resilient_scraper.py
# ============================================================================

async def scrape_with_circuit_breaker(
    url: str,
    scraper_func: Callable,
    breakers: DomainCircuitBreakers,
    **kwargs
) -> Optional[Dict[str, Any]]:
    """
    Scrape URL with circuit breaker protection

    Args:
        url: Target URL
        scraper_func: Async scraper function
        breakers: Domain circuit breakers manager
        **kwargs: Additional args for scraper_func

    Returns:
        Scraped data or None if circuit is open
    """
    from urllib.parse import urlparse

    # Extract domain from URL
    domain = urlparse(url).netloc

    try:
        # Execute with circuit breaker protection
        result = await breakers.call(domain, scraper_func, url, **kwargs)
        return result

    except CircuitBreakerOpenError as e:
        logger.warning(f"⛔ Circuit breaker blocked request to {url}: {e}")
        return None

    except Exception as e:
        logger.error(f"❌ Failed to scrape {url}: {e}")
        return None


# ============================================================================
# CLI Testing
# ============================================================================

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    async def test_circuit_breaker():
        """Test circuit breaker with simulated failures"""

        print("=" * 70)
        print("CIRCUIT BREAKER TEST")
        print("=" * 70)
        print()

        # Create circuit breaker with aggressive config for testing
        config = CircuitBreakerConfig(
            failure_threshold=3,      # Open after 3 failures
            recovery_timeout=5,       # Wait 5 seconds before testing recovery
            success_threshold=2,      # Need 2 successes to close
        )

        breaker = CircuitBreaker("test-domain.com", config)

        # Simulate function that fails N times then succeeds
        failure_count = [0]

        async def flaky_function():
            """Fails 5 times, then succeeds"""
            failure_count[0] += 1
            if failure_count[0] <= 5:
                raise ConnectionError(f"Simulated failure #{failure_count[0]}")
            return {"status": "success", "attempt": failure_count[0]}

        # Test 1: Cause circuit to open (3 failures)
        print("🧪 Test 1: Triggering circuit breaker (3 failures)")
        for i in range(3):
            try:
                await breaker.call(flaky_function)
            except ConnectionError as e:
                print(f"  Attempt {i+1}: {e}")

        status = breaker.get_status()
        print(f"\n📊 Status: {status['state']} (failures: {status['failure_count']})")

        # Test 2: Try to call while open (should be blocked)
        print("\n🧪 Test 2: Calling while circuit is OPEN")
        try:
            await breaker.call(flaky_function)
        except CircuitBreakerOpenError as e:
            print(f"  ⛔ Blocked: {e}")

        # Test 3: Wait for recovery timeout
        print(f"\n⏳ Waiting {config.recovery_timeout} seconds for recovery timeout...")
        await asyncio.sleep(config.recovery_timeout + 1)

        # Test 4: Circuit should be HALF_OPEN, but function still fails
        print("\n🧪 Test 3: Testing recovery (HALF_OPEN → OPEN)")
        try:
            await breaker.call(flaky_function)
        except ConnectionError as e:
            print(f"  Attempt failed: {e}")
            print(f"  Circuit should go back to OPEN")

        status = breaker.get_status()
        print(f"\n📊 Status: {status['state']}")

        # Test 5: Wait again and this time succeed
        print(f"\n⏳ Waiting {config.recovery_timeout} seconds again...")
        await asyncio.sleep(config.recovery_timeout + 1)

        print("\n🧪 Test 4: Testing recovery (HALF_OPEN → CLOSED)")
        # Function will succeed now (after 5 failures)
        for i in range(config.success_threshold):
            try:
                result = await breaker.call(flaky_function)
                print(f"  ✅ Success {i+1}/{config.success_threshold}: {result}")
            except Exception as e:
                print(f"  ❌ Failed: {e}")

        status = breaker.get_status()
        print(f"\n📊 Final Status: {status['state']}")

        # Summary
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Total Requests: {status['total_requests']}")
        print(f"Successes: {status['total_successes']}")
        print(f"Failures: {status['total_failures']}")
        print(f"Success Rate: {status['success_rate']:.1f}%")
        print(f"Final State: {status['state']}")


    async def test_multi_domain():
        """Test multi-domain circuit breakers"""

        print("\n" + "=" * 70)
        print("MULTI-DOMAIN CIRCUIT BREAKER TEST")
        print("=" * 70)
        print()

        config = CircuitBreakerConfig(
            failure_threshold=2,
            recovery_timeout=3,
        )

        breakers = DomainCircuitBreakers(config)

        # Simulate scraping different domains with different success rates
        async def scrape_domain(domain: str, should_fail: bool = False):
            """Simulate scraping a domain"""
            if should_fail:
                raise ConnectionError(f"{domain} is down")
            return {"domain": domain, "status": "success"}

        domains = [
            ("good-domain.com", False),     # Always succeeds
            ("bad-domain.com", True),       # Always fails
            ("flaky-domain.com", False),    # Succeeds
        ]

        print("🧪 Testing 3 domains with different behaviors\n")

        # Scrape each domain multiple times
        for i in range(3):
            print(f"Round {i+1}:")
            for domain, should_fail in domains:
                try:
                    result = await breakers.call(
                        domain,
                        scrape_domain,
                        domain,
                        should_fail=should_fail
                    )
                    print(f"  ✅ {domain}: {result}")
                except CircuitBreakerOpenError as e:
                    print(f"  ⛔ {domain}: Circuit OPEN")
                except ConnectionError as e:
                    print(f"  ❌ {domain}: {e}")
            print()

        # Summary
        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)

        summary = breakers.get_summary()
        print(f"Total Domains: {summary['total_domains']}")
        print(f"Open Circuits: {summary['open_circuits']}")
        print(f"Half-Open Circuits: {summary['half_open_circuits']}")
        print(f"Closed Circuits: {summary['closed_circuits']}")
        print(f"Overall Success Rate: {summary['overall_success_rate']:.1f}%")

        print("\n📊 Per-Domain Status:")
        for domain, status in breakers.get_all_statuses().items():
            print(f"\n  {domain}:")
            print(f"    State: {status['state']}")
            print(f"    Requests: {status['total_requests']}")
            print(f"    Success Rate: {status['success_rate']:.1f}%")


    # Run tests
    asyncio.run(test_circuit_breaker())
    asyncio.run(test_multi_domain())
