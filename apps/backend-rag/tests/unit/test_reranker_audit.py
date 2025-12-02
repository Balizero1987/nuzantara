"""
Unit tests for Reranker Audit Service
100% coverage target with comprehensive mocking
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.reranker_audit import (
    RerankerAuditService,
    get_audit_service,
    initialize_audit_service,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def temp_log_file(tmp_path):
    """Create temporary log file"""
    return tmp_path / "test_audit.jsonl"


@pytest.fixture
def audit_service(temp_log_file):
    """Create RerankerAuditService instance"""
    # Pass Path object directly - service will handle it
    return RerankerAuditService(enabled=True, log_file=temp_log_file)


@pytest.fixture
def audit_service_disabled(temp_log_file):
    """Create disabled RerankerAuditService instance"""
    return RerankerAuditService(enabled=False, log_file=temp_log_file)


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_enabled(temp_log_file):
    """Test initialization with enabled=True"""
    service = RerankerAuditService(enabled=True, log_file=str(temp_log_file))

    assert service.enabled is True
    assert str(service.log_file) == str(temp_log_file)


def test_init_disabled(temp_log_file):
    """Test initialization with enabled=False"""
    service = RerankerAuditService(enabled=False, log_file=str(temp_log_file))

    assert service.enabled is False


def test_init_default_log_file():
    """Test initialization with default log file"""
    with patch("services.reranker_audit.Path") as mock_path:
        mock_path.return_value.parent.parent = Path("/test")
        service = RerankerAuditService(enabled=True)

        assert service.enabled is True


# ============================================================================
# Tests for _ensure_data_dir
# ============================================================================


def test_ensure_data_dir_success(audit_service, temp_log_file):
    """Test _ensure_data_dir creates directory"""
    # Directory should be created during init
    assert temp_log_file.parent.exists()


def test_ensure_data_dir_failure():
    """Test _ensure_data_dir handles failure"""
    with patch("pathlib.Path.mkdir", side_effect=Exception("Permission denied")):
        # Should not raise exception
        service = RerankerAuditService(enabled=True, log_file="/invalid/path/test.jsonl")
        assert service.enabled is True


# ============================================================================
# Tests for _hash_query
# ============================================================================


def test_hash_query(audit_service):
    """Test _hash_query generates hash"""
    query = "test query"
    hash1 = audit_service._hash_query(query)
    hash2 = audit_service._hash_query(query)

    assert hash1 == hash2
    assert len(hash1) == 16
    assert isinstance(hash1, str)


def test_hash_query_different_queries(audit_service):
    """Test _hash_query generates different hashes for different queries"""
    hash1 = audit_service._hash_query("query 1")
    hash2 = audit_service._hash_query("query 2")

    assert hash1 != hash2


# ============================================================================
# Tests for log_rerank
# ============================================================================


def test_log_rerank_success(audit_service, temp_log_file):
    """Test log_rerank writes entry"""
    audit_service.log_rerank(
        query_hash="abc123",
        doc_count=10,
        top_k=5,
        latency_ms=100.5,
        cache_hit=True,
        success=True,
    )

    assert temp_log_file.exists()
    with open(temp_log_file) as f:
        line = f.readline()
        entry = json.loads(line)
        assert entry["event_type"] == "rerank"
        assert entry["query_hash"] == "abc123"
        assert entry["doc_count"] == 10
        assert entry["top_k"] == 5
        assert entry["latency_ms"] == 100.5
        assert entry["cache_hit"] is True
        assert entry["success"] is True


def test_log_rerank_with_error(audit_service, temp_log_file):
    """Test log_rerank with error"""
    audit_service.log_rerank(
        query_hash="abc123",
        doc_count=10,
        top_k=5,
        latency_ms=100.5,
        cache_hit=False,
        success=False,
        error="Test error",
        user_id_hash="user123",
    )

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["error"] == "Test error"
        assert entry["user_id_hash"] == "user123"


def test_log_rerank_disabled(audit_service_disabled, temp_log_file):
    """Test log_rerank when disabled"""
    audit_service_disabled.log_rerank(
        query_hash="abc123",
        doc_count=10,
        top_k=5,
        latency_ms=100.5,
        cache_hit=True,
        success=True,
    )

    # File should not exist when disabled
    assert not temp_log_file.exists()


def test_log_rerank_write_failure(audit_service):
    """Test log_rerank handles write failure"""
    with patch("builtins.open", side_effect=Exception("Write error")):
        # Should not raise exception
        audit_service.log_rerank(
            query_hash="abc123",
            doc_count=10,
            top_k=5,
            latency_ms=100.5,
            cache_hit=True,
            success=True,
        )


# ============================================================================
# Tests for log_rate_limit_violation
# ============================================================================


def test_log_rate_limit_violation_success(audit_service, temp_log_file):
    """Test log_rate_limit_violation writes entry"""
    audit_service.log_rate_limit_violation(
        user_id_hash="user123", endpoint="/api/rerank", limit=100, window=60
    )

    assert temp_log_file.exists()
    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["event_type"] == "rate_limit_violation"
        assert entry["user_id_hash"] == "user123"
        assert entry["endpoint"] == "/api/rerank"
        assert entry["limit"] == 100
        assert entry["window"] == 60


def test_log_rate_limit_violation_disabled(audit_service_disabled):
    """Test log_rate_limit_violation when disabled"""
    audit_service_disabled.log_rate_limit_violation(
        user_id_hash="user123", endpoint="/api/rerank", limit=100, window=60
    )
    # Should not raise exception


# ============================================================================
# Tests for log_security_event
# ============================================================================


def test_log_security_event_info(audit_service, temp_log_file):
    """Test log_security_event with info severity"""
    audit_service.log_security_event(
        event_type="test_event",
        description="Test description",
        severity="info",
        metadata={"key": "value"},
    )

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["event_type"] == "security_event"
        assert entry["security_event_type"] == "test_event"
        assert entry["description"] == "Test description"
        assert entry["severity"] == "info"
        assert entry["metadata"] == {"key": "value"}


def test_log_security_event_critical(audit_service, temp_log_file):
    """Test log_security_event with critical severity"""
    audit_service.log_security_event(
        event_type="critical_event",
        description="Critical issue",
        severity="critical",
    )

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["severity"] == "critical"


def test_log_security_event_warning(audit_service, temp_log_file):
    """Test log_security_event with warning severity"""
    audit_service.log_security_event(
        event_type="warning_event",
        description="Warning issue",
        severity="warning",
    )

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["severity"] == "warning"


def test_log_security_event_no_metadata(audit_service, temp_log_file):
    """Test log_security_event without metadata"""
    audit_service.log_security_event(event_type="test_event", description="Test", severity="info")

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["metadata"] == {}


def test_log_security_event_disabled(audit_service_disabled):
    """Test log_security_event when disabled"""
    audit_service_disabled.log_security_event(
        event_type="test", description="Test", severity="info"
    )
    # Should not raise exception


# ============================================================================
# Tests for log_performance_metric
# ============================================================================


def test_log_performance_metric_success(audit_service, temp_log_file):
    """Test log_performance_metric writes entry"""
    audit_service.log_performance_metric(
        metric_name="latency", value=150.5, unit="ms", metadata={"endpoint": "/api"}
    )

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["event_type"] == "performance_metric"
        assert entry["metric_name"] == "latency"
        assert entry["value"] == 150.5
        assert entry["unit"] == "ms"
        assert entry["metadata"] == {"endpoint": "/api"}


def test_log_performance_metric_default_unit(audit_service, temp_log_file):
    """Test log_performance_metric with default unit"""
    audit_service.log_performance_metric(metric_name="test", value=100.0)

    with open(temp_log_file) as f:
        entry = json.loads(f.readline())
        assert entry["unit"] == "ms"


def test_log_performance_metric_disabled(audit_service_disabled):
    """Test log_performance_metric when disabled"""
    audit_service_disabled.log_performance_metric(metric_name="test", value=100.0)
    # Should not raise exception


# ============================================================================
# Tests for _write_audit_entry
# ============================================================================


def test_write_audit_entry_success(audit_service, temp_log_file):
    """Test _write_audit_entry writes entry"""
    entry = {"test": "data", "timestamp": "2024-01-01T00:00:00Z"}

    audit_service._write_audit_entry(entry)

    assert temp_log_file.exists()
    with open(temp_log_file) as f:
        line = f.readline()
        assert json.loads(line) == entry


def test_write_audit_entry_failure(audit_service):
    """Test _write_audit_entry handles failure"""
    with patch("builtins.open", side_effect=Exception("Write error")):
        # Should not raise exception
        audit_service._write_audit_entry({"test": "data"})


# ============================================================================
# Tests for get_stats
# ============================================================================


def test_get_stats_disabled(audit_service_disabled):
    """Test get_stats when disabled"""
    result = audit_service_disabled.get_stats()

    assert result["enabled"] is False


def test_get_stats_no_file(audit_service, temp_log_file):
    """Test get_stats when file doesn't exist"""
    # Ensure file doesn't exist
    if temp_log_file.exists():
        temp_log_file.unlink()

    result = audit_service.get_stats()

    assert result["enabled"] is True
    assert result.get("total_entries", 0) == 0


def test_get_stats_with_entries(audit_service, temp_log_file):
    """Test get_stats with entries"""
    # Write some entries
    audit_service.log_rerank(
        query_hash="abc123",
        doc_count=10,
        top_k=5,
        latency_ms=100.5,
        cache_hit=True,
        success=True,
    )
    audit_service.log_rate_limit_violation(
        user_id_hash="user123", endpoint="/api", limit=100, window=60
    )

    # Ensure file exists and has content
    assert temp_log_file.exists()
    with open(temp_log_file) as f:
        lines = f.readlines()
        assert len(lines) >= 2

    result = audit_service.get_stats()

    assert result["enabled"] is True
    assert result.get("total_entries", 0) >= 2
    assert "rerank" in result.get("event_counts", {})
    assert "rate_limit_violation" in result.get("event_counts", {})


def test_get_stats_many_entries(audit_service, temp_log_file):
    """Test get_stats with many entries (truncates to 1000)"""
    # Write 1500 entries
    for i in range(1500):
        audit_service.log_rerank(
            query_hash=f"hash{i}",
            doc_count=10,
            top_k=5,
            latency_ms=100.5,
            cache_hit=True,
            success=True,
        )

    # Ensure file is written
    import time

    time.sleep(0.1)

    result = audit_service.get_stats()

    assert result["enabled"] is True
    assert result.get("total_entries", 0) == 1500
    assert result.get("recent_entries", 0) == 1000


def test_get_stats_invalid_json(audit_service, temp_log_file):
    """Test get_stats handles invalid JSON"""
    # Write invalid JSON
    with open(temp_log_file, "w") as f:
        f.write("invalid json\n")
        f.write('{"valid": "json"}\n')

    result = audit_service.get_stats()

    assert result["enabled"] is True
    assert "event_counts" in result


def test_get_stats_exception(audit_service, temp_log_file):
    """Test get_stats handles exception"""
    # Create file first
    audit_service.log_rerank(
        query_hash="abc123",
        doc_count=10,
        top_k=5,
        latency_ms=100.5,
        cache_hit=True,
        success=True,
    )

    # Now simulate read error
    with patch("builtins.open", side_effect=Exception("Read error")):
        result = audit_service.get_stats()

        assert result["enabled"] is True
        assert "error" in result


# ============================================================================
# Tests for get_audit_service
# ============================================================================


def test_get_audit_service_none():
    """Test get_audit_service when not initialized"""
    with patch("services.reranker_audit._audit_service", None):
        result = get_audit_service()

        assert result is None


def test_get_audit_service_initialized():
    """Test get_audit_service when initialized"""
    mock_service = MagicMock()
    with patch("services.reranker_audit._audit_service", mock_service):
        result = get_audit_service()

        assert result == mock_service


# ============================================================================
# Tests for initialize_audit_service
# ============================================================================


def test_initialize_audit_service(temp_log_file):
    """Test initialize_audit_service"""
    result = initialize_audit_service(enabled=True, log_file=str(temp_log_file))

    assert isinstance(result, RerankerAuditService)
    assert result.enabled is True
    assert get_audit_service() == result
