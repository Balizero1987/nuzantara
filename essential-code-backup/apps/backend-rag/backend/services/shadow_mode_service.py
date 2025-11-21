"""
Shadow Mode Service - A/B Testing LLAMA vs Claude

Runs LLAMA in parallel with Claude (shadow mode) without affecting user experience.
Logs both responses for comparison and quality analysis.

Use cases:
1. Validate LLAMA quality before production switch
2. Collect real-world performance metrics
3. A/B test different models without user impact
4. Gradual rollout with safety net

IMPORTANT: Shadow mode has NO user-facing impact. User always receives Claude response.
"""

import asyncio
import logging
import time
import json
from typing import Dict, Optional, Any, List
from datetime import datetime
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class ShadowModeService:
    """
    Shadow Mode testing for LLAMA vs Claude

    Architecture:
    1. User query arrives
    2. Route to Claude (primary) → user receives this
    3. Simultaneously route to LLAMA (shadow) → logged only
    4. Compare responses: latency, quality, tokens
    5. Log comparison to file for analysis

    Safety:
    - Shadow requests run in background (non-blocking)
    - Errors in shadow mode never affect user experience
    - Can be enabled/disabled via environment variable
    """

    def __init__(
        self,
        llama_client: Optional[Any] = None,
        log_dir: str = "./logs/shadow_mode",
        enabled: bool = True,
        traffic_percent: float = 100.0  # % of traffic to shadow test
    ):
        """
        Initialize shadow mode service

        Args:
            llama_client: ZantaraClient for LLAMA inference
            log_dir: Directory for comparison logs
            enabled: Enable/disable shadow mode
            traffic_percent: Percentage of traffic to test (0-100)
        """
        self.llama_client = llama_client
        self.log_dir = Path(log_dir)
        self.enabled = enabled and llama_client is not None
        self.traffic_percent = traffic_percent

        # Create log directory
        if self.enabled:
            self.log_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"✅ Shadow Mode Service initialized")
            logger.info(f"   Log dir: {self.log_dir}")
            logger.info(f"   Traffic: {self.traffic_percent}%")
        else:
            logger.info("⏸️  Shadow Mode Service disabled")

    def should_shadow_test(self) -> bool:
        """Decide if this request should be shadow tested (traffic sampling)"""
        if not self.enabled:
            return False

        # Random sampling based on traffic_percent
        import random
        return random.random() * 100 < self.traffic_percent

    async def run_shadow_comparison(
        self,
        message: str,
        user_id: str,
        claude_response: Dict,  # Already generated Claude response
        conversation_history: Optional[List[Dict]] = None,
        memory_context: Optional[str] = None,
        category: Optional[str] = None
    ):
        """
        Run LLAMA in shadow mode and log comparison

        This runs in background, does NOT block user response

        Args:
            message: User query
            user_id: User identifier
            claude_response: Already generated Claude response (sent to user)
            conversation_history: Chat history
            memory_context: Memory context
            category: Query category (greeting, business, etc.)
        """
        if not self.should_shadow_test():
            return

        try:
            logger.info(f"👥 [Shadow Mode] Running LLAMA comparison for user {user_id}")

            # Start timer
            start_time = time.time()

            # Call LLAMA with same inputs
            llama_result = await self._call_llama_safe(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history,
                memory_context=memory_context
            )

            # Calculate metrics
            llama_latency = (time.time() - start_time) * 1000  # ms

            # Build comparison record
            comparison = {
                "timestamp": datetime.now().isoformat(),
                "user_id": user_id,
                "query": message,
                "category": category,
                "query_length": len(message),

                # Claude metrics (primary)
                "claude": {
                    "response": claude_response.get("response", ""),
                    "model": claude_response.get("model", "unknown"),
                    "ai_used": claude_response.get("ai_used", "unknown"),
                    "tokens_input": claude_response.get("tokens", {}).get("input", 0),
                    "tokens_output": claude_response.get("tokens", {}).get("output", 0),
                    "used_rag": claude_response.get("used_rag", False),
                    "used_tools": claude_response.get("used_tools", False),
                    "response_length": len(claude_response.get("response", ""))
                },

                # LLAMA metrics (shadow)
                "llama": {
                    "response": llama_result.get("response", ""),
                    "model": llama_result.get("model", "unknown"),
                    "tokens_input": llama_result.get("tokens", {}).get("input", 0),
                    "tokens_output": llama_result.get("tokens", {}).get("output", 0),
                    "latency_ms": llama_latency,
                    "error": llama_result.get("error"),
                    "response_length": len(llama_result.get("response", ""))
                },

                # Quick comparison metrics
                "comparison": {
                    "length_diff": len(llama_result.get("response", "")) - len(claude_response.get("response", "")),
                    "length_ratio": len(llama_result.get("response", "")) / max(len(claude_response.get("response", "")), 1),
                    "llama_success": llama_result.get("error") is None
                }
            }

            # Log to file (daily rotation)
            await self._log_comparison(comparison)

            logger.info(f"✅ [Shadow Mode] Comparison logged: LLAMA {llama_latency:.0f}ms, success={comparison['comparison']['llama_success']}")

        except Exception as e:
            logger.error(f"❌ [Shadow Mode] Comparison failed (non-fatal): {e}")
            # Shadow mode errors should never affect user experience

    async def _call_llama_safe(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None,
        memory_context: Optional[str] = None,
        timeout: float = 10.0
    ) -> Dict:
        """
        Call LLAMA with timeout and error handling

        Returns dict with response or error
        """
        try:
            # Call LLAMA with timeout
            result = await asyncio.wait_for(
                self.llama_client.conversational(
                    message=message,
                    user_id=user_id,
                    conversation_history=conversation_history,
                    memory_context=memory_context,
                    mode="auto",  # Let LLAMA decide SANTAI/PIKIRAN
                    max_tokens=500
                ),
                timeout=timeout
            )

            return {
                "response": result.get("text", ""),
                "model": result.get("model", "unknown"),
                "tokens": result.get("tokens", {}),
                "error": None
            }

        except asyncio.TimeoutError:
            logger.warning(f"⏱️ [Shadow Mode] LLAMA timeout after {timeout}s")
            return {
                "response": "",
                "model": "llama-timeout",
                "tokens": {},
                "error": "timeout"
            }
        except Exception as e:
            logger.warning(f"❌ [Shadow Mode] LLAMA error: {e}")
            return {
                "response": "",
                "model": "llama-error",
                "tokens": {},
                "error": str(e)
            }

    async def _log_comparison(self, comparison: Dict):
        """Log comparison to daily file"""
        try:
            # Daily log file
            date_str = datetime.now().strftime("%Y-%m-%d")
            log_file = self.log_dir / f"shadow_comparison_{date_str}.jsonl"

            # Append to file
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(comparison, ensure_ascii=False) + '\n')

        except Exception as e:
            logger.error(f"❌ [Shadow Mode] Failed to log comparison: {e}")

    async def analyze_daily_logs(self, date: Optional[str] = None) -> Dict:
        """
        Analyze daily shadow mode logs

        Args:
            date: Date string (YYYY-MM-DD), defaults to today

        Returns:
            Analysis report dict
        """
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")

        log_file = self.log_dir / f"shadow_comparison_{date}.jsonl"

        if not log_file.exists():
            return {"error": f"No logs found for {date}"}

        try:
            # Load all comparisons for the day
            comparisons = []
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    comparisons.append(json.loads(line))

            # Calculate metrics
            total = len(comparisons)
            llama_success = sum(1 for c in comparisons if c['comparison']['llama_success'])
            llama_errors = total - llama_success

            # Latency stats (only successful)
            latencies = [c['llama']['latency_ms'] for c in comparisons if c['comparison']['llama_success']]
            avg_latency = sum(latencies) / len(latencies) if latencies else 0

            # Token usage
            claude_tokens = sum(c['claude']['tokens_output'] for c in comparisons)
            llama_tokens = sum(c['llama']['tokens_output'] for c in comparisons if c['comparison']['llama_success'])

            # Response length comparison
            length_diffs = [c['comparison']['length_diff'] for c in comparisons if c['comparison']['llama_success']]
            avg_length_diff = sum(length_diffs) / len(length_diffs) if length_diffs else 0

            return {
                "date": date,
                "total_comparisons": total,
                "llama_success_rate": llama_success / total if total > 0 else 0,
                "llama_errors": llama_errors,
                "avg_latency_ms": avg_latency,
                "max_latency_ms": max(latencies) if latencies else 0,
                "min_latency_ms": min(latencies) if latencies else 0,
                "claude_total_tokens": claude_tokens,
                "llama_total_tokens": llama_tokens,
                "avg_length_difference": avg_length_diff,
                "categories": self._analyze_categories(comparisons)
            }

        except Exception as e:
            logger.error(f"❌ [Shadow Mode] Analysis failed: {e}")
            return {"error": str(e)}

    def _analyze_categories(self, comparisons: List[Dict]) -> Dict:
        """Analyze performance by query category"""
        from collections import defaultdict

        category_stats = defaultdict(lambda: {"count": 0, "llama_success": 0, "avg_latency": []})

        for c in comparisons:
            category = c.get("category", "unknown")
            category_stats[category]["count"] += 1

            if c['comparison']['llama_success']:
                category_stats[category]["llama_success"] += 1
                category_stats[category]["avg_latency"].append(c['llama']['latency_ms'])

        # Calculate averages
        result = {}
        for category, stats in category_stats.items():
            result[category] = {
                "count": stats["count"],
                "success_rate": stats["llama_success"] / stats["count"] if stats["count"] > 0 else 0,
                "avg_latency": sum(stats["avg_latency"]) / len(stats["avg_latency"]) if stats["avg_latency"] else 0
            }

        return result


# Singleton instance
_shadow_mode_service: Optional[ShadowModeService] = None


def initialize_shadow_mode(
    llama_client: Optional[Any] = None,
    log_dir: str = "./logs/shadow_mode",
    enabled: bool = None,
    traffic_percent: float = 100.0
):
    """
    Initialize global shadow mode service

    Args:
        llama_client: ZantaraClient instance
        log_dir: Log directory
        enabled: Enable/disable (defaults to env SHADOW_MODE_ENABLED)
        traffic_percent: Traffic sampling percentage
    """
    global _shadow_mode_service

    # Check environment variable if not explicitly set
    if enabled is None:
        enabled = os.getenv("SHADOW_MODE_ENABLED", "false").lower() == "true"

    _shadow_mode_service = ShadowModeService(
        llama_client=llama_client,
        log_dir=log_dir,
        enabled=enabled,
        traffic_percent=traffic_percent
    )

    return _shadow_mode_service


def get_shadow_mode_service() -> Optional[ShadowModeService]:
    """Get global shadow mode service instance"""
    return _shadow_mode_service
