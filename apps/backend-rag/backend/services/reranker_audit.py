"""
Reranker Audit Trail Service
Records all critical reranker operations for compliance and debugging

Features:
- GDPR-compliant logging (no PII in logs)
- Performance metrics tracking
- Error tracking
- Rate limit violation logging
- Security event logging
"""

import hashlib
import json
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from loguru import logger


class RerankerAuditService:
    """
    Audit trail service for reranker operations

    Records:
    - All reranker calls (query hash, latency, cache hits/misses)
    - Performance metrics
    - Error events
    - Rate limit violations
    - Security events
    """

    def __init__(self, enabled: bool = True, log_file: str | None = None):
        """
        Initialize audit service

        Args:
            enabled: Enable audit trail (default: True)
            log_file: Path to audit log file (default: ./data/reranker_audit.jsonl)
        """
        self.enabled = enabled
        if log_file:
            self.log_file = Path(log_file) if isinstance(log_file, str) else log_file
        else:
            self.log_file = Path(__file__).parent.parent / "data" / "reranker_audit.jsonl"
        self._lock = threading.Lock()
        self._ensure_data_dir()

        if self.enabled:
            logger.info(f"✅ RerankerAuditService enabled (log: {self.log_file})")
        else:
            logger.info("ℹ️ RerankerAuditService disabled")

    def _ensure_data_dir(self):
        """Ensure data directory exists"""
        try:
            self.log_file.parent.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning(f"⚠️ Could not create audit log directory: {e}")

    def _hash_query(self, query: str) -> str:
        """
        Hash query for privacy (GDPR-compliant)
        No PII stored, only hash
        """
        return hashlib.sha256(query.encode()).hexdigest()[:16]

    def log_rerank(
        self,
        query_hash: str,
        doc_count: int,
        top_k: int,
        latency_ms: float,
        cache_hit: bool,
        success: bool,
        error: str | None = None,
        user_id_hash: str | None = None,
    ):
        """
        Log reranker operation

        Args:
            query_hash: Hashed query (no PII)
            doc_count: Number of documents reranked
            top_k: Number of results returned
            latency_ms: Latency in milliseconds
            cache_hit: Whether cache was hit
            success: Whether operation succeeded
            error: Error message if failed
            user_id_hash: Hashed user ID (optional, for tracking)
        """
        if not self.enabled:
            return

        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "rerank",
            "query_hash": query_hash,
            "doc_count": doc_count,
            "top_k": top_k,
            "latency_ms": round(latency_ms, 2),
            "cache_hit": cache_hit,
            "success": success,
            "error": error,
            "user_id_hash": user_id_hash,
        }

        self._write_audit_entry(audit_entry)

    def log_rate_limit_violation(self, user_id_hash: str, endpoint: str, limit: int, window: int):
        """Log rate limit violation"""
        if not self.enabled:
            return

        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "rate_limit_violation",
            "user_id_hash": user_id_hash,
            "endpoint": endpoint,
            "limit": limit,
            "window": window,
        }

        self._write_audit_entry(audit_entry)
        logger.warning(
            f"🚨 Rate limit violation: {user_id_hash[:8]}... on {endpoint} "
            f"(limit: {limit}/{window}s)"
        )

    def log_security_event(
        self,
        event_type: str,
        description: str,
        severity: str = "info",
        metadata: dict[str, Any] | None = None,
    ):
        """Log security event"""
        if not self.enabled:
            return

        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "security_event",
            "security_event_type": event_type,
            "description": description,
            "severity": severity,
            "metadata": metadata or {},
        }

        self._write_audit_entry(audit_entry)

        if severity == "critical":
            logger.critical(f"🚨 Security event: {event_type} - {description}")
        elif severity == "warning":
            logger.warning(f"⚠️ Security event: {event_type} - {description}")
        else:
            logger.info(f"ℹ️ Security event: {event_type} - {description}")

    def log_performance_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "ms",
        metadata: dict[str, Any] | None = None,
    ):
        """Log performance metric"""
        if not self.enabled:
            return

        audit_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": "performance_metric",
            "metric_name": metric_name,
            "value": value,
            "unit": unit,
            "metadata": metadata or {},
        }

        self._write_audit_entry(audit_entry)

    def _write_audit_entry(self, entry: dict[str, Any]):
        """Write audit entry to log file (thread-safe)"""
        try:
            with self._lock, open(self.log_file, "a") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            logger.error(f"❌ Failed to write audit entry: {e}")

    def get_stats(self) -> dict[str, Any]:
        """Get audit service statistics"""
        if not self.enabled:
            return {"enabled": False}

        try:
            # Count entries (last 1000 lines for performance)
            if self.log_file.exists():
                with open(self.log_file) as f:
                    lines = f.readlines()
                    recent_lines = lines[-1000:] if len(lines) > 1000 else lines

                    event_counts = {}
                    for line in recent_lines:
                        try:
                            entry = json.loads(line.strip())
                            event_type = entry.get("event_type", "unknown")
                            event_counts[event_type] = event_counts.get(event_type, 0) + 1
                        except Exception:
                            continue

                    return {
                        "enabled": True,
                        "log_file": str(self.log_file),
                        "total_entries": len(lines),
                        "recent_entries": len(recent_lines),
                        "event_counts": event_counts,
                    }
            else:
                return {"enabled": True, "log_file": str(self.log_file), "total_entries": 0}
        except Exception as e:
            logger.error(f"❌ Failed to get audit stats: {e}")
            return {"enabled": True, "error": str(e)}


# Global audit service instance
_audit_service: RerankerAuditService | None = None


def get_audit_service() -> RerankerAuditService | None:
    """Get global audit service instance"""
    return _audit_service


def initialize_audit_service(enabled: bool = True, log_file: str | None = None):
    """Initialize global audit service"""
    global _audit_service
    _audit_service = RerankerAuditService(enabled=enabled, log_file=log_file)
    return _audit_service
