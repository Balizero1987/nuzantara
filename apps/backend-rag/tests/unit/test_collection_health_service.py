"""
Unit tests for Collection Health Service
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.collection_health_service import (
    CollectionHealthService,
    CollectionMetrics,
    HealthStatus,
    StalenessSeverity,
)


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    return MagicMock()


@pytest.fixture
def health_service(mock_search_service):
    """Create CollectionHealthService instance"""
    return CollectionHealthService(search_service=mock_search_service)


# ============================================================================
# Tests for Enums
# ============================================================================


def test_health_status_enum():
    """Test HealthStatus enum values"""
    assert HealthStatus.EXCELLENT == "excellent"
    assert HealthStatus.GOOD == "good"
    assert HealthStatus.WARNING == "warning"
    assert HealthStatus.CRITICAL == "critical"


def test_staleness_severity_enum():
    """Test StalenessSeverity enum values"""
    assert StalenessSeverity.FRESH == "fresh"
    assert StalenessSeverity.AGING == "aging"
    assert StalenessSeverity.STALE == "stale"
    assert StalenessSeverity.VERY_STALE == "very_stale"


# ============================================================================
# Tests for CollectionMetrics dataclass
# ============================================================================


def test_collection_metrics_creation():
    """Test CollectionMetrics dataclass creation"""
    metrics = CollectionMetrics(
        collection_name="test_collection",
        document_count=100,
        last_updated=datetime.now().isoformat(),
        query_count=50,
        hit_count=40,
        avg_confidence=0.8,
        avg_results_per_query=3.5,
        health_status=HealthStatus.GOOD,
        staleness=StalenessSeverity.FRESH,
        issues=[],
        recommendations=["Test recommendation"],
    )
    assert metrics.collection_name == "test_collection"
    assert metrics.document_count == 100
    assert metrics.health_status == HealthStatus.GOOD


# ============================================================================
# Tests for CollectionHealthService.__init__
# ============================================================================


def test_init(health_service, mock_search_service):
    """Test CollectionHealthService initialization"""
    assert health_service.search_service is mock_search_service
    assert len(health_service.metrics) == 14
    assert "bali_zero_pricing" in health_service.metrics
    assert "visa_oracle" in health_service.metrics


def test_init_metrics_structure(health_service):
    """Test that metrics are initialized with correct structure"""
    metrics = health_service.metrics["bali_zero_pricing"]
    
    assert "query_count" in metrics
    assert "hit_count" in metrics
    assert "total_results" in metrics
    assert "confidence_scores" in metrics
    assert metrics["query_count"] == 0
    assert metrics["hit_count"] == 0


# ============================================================================
# Tests for record_query
# ============================================================================


def test_record_query_success(health_service):
    """Test recording a successful query"""
    health_service.record_query(
        collection_name="bali_zero_pricing",
        had_results=True,
        result_count=5,
        avg_score=0.85,
    )
    
    metrics = health_service.metrics["bali_zero_pricing"]
    assert metrics["query_count"] == 1
    assert metrics["hit_count"] == 1
    assert metrics["total_results"] == 5
    assert len(metrics["confidence_scores"]) == 1
    assert metrics["confidence_scores"][0] == 0.85
    assert metrics["last_queried"] is not None


def test_record_query_no_results(health_service):
    """Test recording a query with no results"""
    health_service.record_query(
        collection_name="visa_oracle",
        had_results=False,
        result_count=0,
        avg_score=0.0,
    )
    
    metrics = health_service.metrics["visa_oracle"]
    assert metrics["query_count"] == 1
    assert metrics["hit_count"] == 0
    assert len(metrics["confidence_scores"]) == 0


def test_record_query_unknown_collection(health_service):
    """Test recording query for unknown collection"""
    initial_count = len(health_service.metrics)
    
    health_service.record_query(
        collection_name="unknown_collection",
        had_results=True,
    )
    
    # Should not create new collection
    assert len(health_service.metrics) == initial_count
    assert "unknown_collection" not in health_service.metrics


def test_record_query_multiple(health_service):
    """Test recording multiple queries"""
    for i in range(5):
        health_service.record_query(
            collection_name="kbli_eye",
            had_results=(i % 2 == 0),  # Alternate success/failure
            result_count=3 if i % 2 == 0 else 0,
            avg_score=0.7 if i % 2 == 0 else 0.0,
        )
    
    metrics = health_service.metrics["kbli_eye"]
    assert metrics["query_count"] == 5
    assert metrics["hit_count"] == 3  # 3 successful queries


# ============================================================================
# Tests for calculate_staleness
# ============================================================================


def test_calculate_staleness_fresh(health_service):
    """Test calculating staleness for fresh data"""
    last_updated = (datetime.now() - timedelta(days=15)).isoformat()
    staleness = health_service.calculate_staleness(last_updated)
    
    assert staleness == StalenessSeverity.FRESH


def test_calculate_staleness_aging(health_service):
    """Test calculating staleness for aging data"""
    last_updated = (datetime.now() - timedelta(days=60)).isoformat()
    staleness = health_service.calculate_staleness(last_updated)
    
    assert staleness == StalenessSeverity.AGING


def test_calculate_staleness_stale(health_service):
    """Test calculating staleness for stale data"""
    last_updated = (datetime.now() - timedelta(days=150)).isoformat()
    staleness = health_service.calculate_staleness(last_updated)
    
    assert staleness == StalenessSeverity.STALE


def test_calculate_staleness_very_stale(health_service):
    """Test calculating staleness for very stale data"""
    last_updated = (datetime.now() - timedelta(days=400)).isoformat()
    staleness = health_service.calculate_staleness(last_updated)
    
    assert staleness == StalenessSeverity.VERY_STALE


def test_calculate_staleness_none(health_service):
    """Test calculating staleness when last_updated is None"""
    staleness = health_service.calculate_staleness(None)
    
    assert staleness == StalenessSeverity.VERY_STALE


def test_calculate_staleness_invalid_format(health_service):
    """Test calculating staleness with invalid timestamp"""
    staleness = health_service.calculate_staleness("invalid-timestamp")
    
    assert staleness == StalenessSeverity.VERY_STALE


# ============================================================================
# Tests for calculate_health_status
# ============================================================================


def test_calculate_health_status_excellent(health_service):
    """Test calculating excellent health status"""
    status = health_service.calculate_health_status(
        hit_rate=0.85,
        avg_confidence=0.75,
        staleness=StalenessSeverity.FRESH,
        query_count=15,
    )
    
    assert status == HealthStatus.EXCELLENT


def test_calculate_health_status_good(health_service):
    """Test calculating good health status"""
    status = health_service.calculate_health_status(
        hit_rate=0.65,
        avg_confidence=0.55,
        staleness=StalenessSeverity.AGING,
        query_count=8,
    )
    
    assert status == HealthStatus.GOOD


def test_calculate_health_status_warning_stale(health_service):
    """Test calculating warning status due to stale data"""
    status = health_service.calculate_health_status(
        hit_rate=0.7,
        avg_confidence=0.6,
        staleness=StalenessSeverity.STALE,
        query_count=10,
    )
    
    assert status == HealthStatus.WARNING


def test_calculate_health_status_warning_low_hit_rate(health_service):
    """Test calculating warning status due to low hit rate"""
    status = health_service.calculate_health_status(
        hit_rate=0.5,
        avg_confidence=0.6,
        staleness=StalenessSeverity.FRESH,
        query_count=10,
    )
    
    assert status == HealthStatus.WARNING


def test_calculate_health_status_critical_very_stale(health_service):
    """Test calculating critical status due to very stale data"""
    status = health_service.calculate_health_status(
        hit_rate=0.8,
        avg_confidence=0.8,
        staleness=StalenessSeverity.VERY_STALE,
        query_count=10,
    )
    
    assert status == HealthStatus.CRITICAL


def test_calculate_health_status_critical_low_hit_rate(health_service):
    """Test calculating critical status due to very low hit rate"""
    status = health_service.calculate_health_status(
        hit_rate=0.3,
        avg_confidence=0.5,
        staleness=StalenessSeverity.FRESH,
        query_count=15,
    )
    
    assert status == HealthStatus.CRITICAL


def test_calculate_health_status_critical_low_confidence(health_service):
    """Test calculating critical status due to low confidence"""
    status = health_service.calculate_health_status(
        hit_rate=0.6,
        avg_confidence=0.25,
        staleness=StalenessSeverity.FRESH,
        query_count=15,
    )
    
    assert status == HealthStatus.CRITICAL


# ============================================================================
# Tests for generate_recommendations
# ============================================================================


def test_generate_recommendations_very_stale(health_service):
    """Test generating recommendations for very stale collection"""
    recommendations = health_service.generate_recommendations(
        collection_name="test_collection",
        _health_status=HealthStatus.CRITICAL,
        staleness=StalenessSeverity.VERY_STALE,
        hit_rate=0.8,
        avg_confidence=0.8,
        query_count=10,
    )
    
    assert len(recommendations) > 0
    assert any("URGENT" in rec or ">6 months" in rec for rec in recommendations)


def test_generate_recommendations_low_hit_rate(health_service):
    """Test generating recommendations for low hit rate"""
    recommendations = health_service.generate_recommendations(
        collection_name="test_collection",
        _health_status=HealthStatus.WARNING,
        staleness=StalenessSeverity.FRESH,
        hit_rate=0.3,
        avg_confidence=0.6,
        query_count=15,
    )
    
    assert len(recommendations) > 0
    assert any("hit rate" in rec.lower() for rec in recommendations)


def test_generate_recommendations_low_confidence(health_service):
    """Test generating recommendations for low confidence"""
    recommendations = health_service.generate_recommendations(
        collection_name="test_collection",
        _health_status=HealthStatus.WARNING,
        staleness=StalenessSeverity.FRESH,
        hit_rate=0.7,
        avg_confidence=0.25,
        query_count=15,
    )
    
    assert len(recommendations) > 0
    assert any("confidence" in rec.lower() for rec in recommendations)


def test_generate_recommendations_no_queries(health_service):
    """Test generating recommendations for collection with no queries"""
    recommendations = health_service.generate_recommendations(
        collection_name="test_collection",
        _health_status=HealthStatus.GOOD,
        staleness=StalenessSeverity.FRESH,
        hit_rate=0.0,
        avg_confidence=0.0,
        query_count=0,
    )
    
    assert len(recommendations) > 0
    assert any("No queries" in rec or "unused" in rec.lower() for rec in recommendations)


def test_generate_recommendations_updates_collection(health_service):
    """Test generating recommendations for updates collection"""
    recommendations = health_service.generate_recommendations(
        collection_name="tax_updates",
        _health_status=HealthStatus.WARNING,
        staleness=StalenessSeverity.STALE,
        hit_rate=0.7,
        avg_confidence=0.6,
        query_count=10,
    )
    
    assert len(recommendations) > 0
    assert any("auto-ingestion" in rec.lower() for rec in recommendations)


def test_generate_recommendations_good_health(health_service):
    """Test generating recommendations for good health"""
    recommendations = health_service.generate_recommendations(
        collection_name="test_collection",
        _health_status=HealthStatus.EXCELLENT,
        staleness=StalenessSeverity.FRESH,
        hit_rate=0.9,
        avg_confidence=0.8,
        query_count=20,
    )
    
    assert len(recommendations) > 0
    assert any("no action needed" in rec.lower() or "good" in rec.lower() for rec in recommendations)


# ============================================================================
# Tests for get_collection_health
# ============================================================================


def test_get_collection_health_existing(health_service):
    """Test getting health for existing collection"""
    # Record some queries
    health_service.record_query("bali_zero_pricing", had_results=True, result_count=3, avg_score=0.8)
    health_service.record_query("bali_zero_pricing", had_results=True, result_count=2, avg_score=0.75)
    
    health = health_service.get_collection_health(
        collection_name="bali_zero_pricing",
        document_count=100,
        last_updated=(datetime.now() - timedelta(days=10)).isoformat(),
    )
    
    assert isinstance(health, CollectionMetrics)
    assert health.collection_name == "bali_zero_pricing"
    assert health.query_count == 2
    assert health.hit_count == 2
    assert health.document_count == 100
    assert health.health_status in [HealthStatus.EXCELLENT, HealthStatus.GOOD, HealthStatus.WARNING, HealthStatus.CRITICAL]


def test_get_collection_health_unknown_collection(health_service):
    """Test getting health for unknown collection"""
    health = health_service.get_collection_health(collection_name="unknown_collection")
    
    assert health.collection_name == "unknown_collection"
    assert health.health_status == HealthStatus.CRITICAL
    assert health.staleness == StalenessSeverity.VERY_STALE
    assert "Collection not found" in health.issues


def test_get_collection_health_with_issues(health_service):
    """Test getting health that detects issues"""
    # Record queries with low hit rate
    for _ in range(15):
        health_service.record_query("visa_oracle", had_results=False)
    
    health = health_service.get_collection_health(
        collection_name="visa_oracle",
        last_updated=(datetime.now() - timedelta(days=200)).isoformat(),
    )
    
    assert len(health.issues) > 0
    assert health.health_status in [HealthStatus.WARNING, HealthStatus.CRITICAL]


def test_get_collection_health_empty_collection(health_service):
    """Test getting health for empty collection"""
    health = health_service.get_collection_health(
        collection_name="kbli_eye",
        document_count=0,
    )
    
    assert "Empty collection" in health.issues


# ============================================================================
# Tests for get_all_collection_health
# ============================================================================


def test_get_all_collection_health_include_empty(health_service):
    """Test getting all collection health including empty"""
    all_health = health_service.get_all_collection_health(include_empty=True)
    
    assert len(all_health) == 14
    assert all(isinstance(health, CollectionMetrics) for health in all_health.values())


def test_get_all_collection_health_exclude_empty(health_service):
    """Test getting all collection health excluding empty"""
    # Record query for one collection
    health_service.record_query("bali_zero_pricing", had_results=True)
    
    all_health = health_service.get_all_collection_health(include_empty=False)
    
    assert len(all_health) == 1
    assert "bali_zero_pricing" in all_health


# ============================================================================
# Tests for get_dashboard_summary
# ============================================================================


def test_get_dashboard_summary(health_service):
    """Test getting dashboard summary"""
    # Record some queries
    health_service.record_query("bali_zero_pricing", had_results=True, result_count=5, avg_score=0.8)
    health_service.record_query("visa_oracle", had_results=False)
    
    summary = health_service.get_dashboard_summary()
    
    assert "timestamp" in summary
    assert "total_collections" in summary
    assert summary["total_collections"] == 14
    assert "health_distribution" in summary
    assert "staleness_distribution" in summary
    assert "total_queries" in summary
    assert "overall_hit_rate" in summary
    assert "collections_with_issues" in summary
    assert "critical_collections" in summary
    assert "needs_attention" in summary


def test_get_dashboard_summary_counts(health_service):
    """Test that dashboard summary counts are correct"""
    # Set up different health statuses
    health_service.record_query("bali_zero_pricing", had_results=True, result_count=5, avg_score=0.85)
    health_service.record_query("visa_oracle", had_results=False)
    
    summary = health_service.get_dashboard_summary()
    
    total_statuses = sum(summary["health_distribution"].values())
    assert total_statuses == 14  # All collections should be counted
    
    assert summary["total_queries"] == 2


# ============================================================================
# Tests for get_health_report
# ============================================================================


def test_get_health_report_text(health_service):
    """Test getting health report in text format"""
    report = health_service.get_health_report(format="text")
    
    assert isinstance(report, str)
    assert "COLLECTION HEALTH REPORT" in report
    assert "SUMMARY" in report
    assert "COLLECTION DETAILS" in report


def test_get_health_report_markdown(health_service):
    """Test getting health report in markdown format"""
    report = health_service.get_health_report(format="markdown")
    
    assert isinstance(report, str)
    assert len(report) > 0


def test_get_health_report_includes_collections(health_service):
    """Test that health report includes collection details"""
    health_service.record_query("bali_zero_pricing", had_results=True)
    
    report = health_service.get_health_report()
    
    assert "bali_zero_pricing" in report.upper() or "BALI_ZERO_PRICING" in report


def test_get_health_report_includes_critical(health_service):
    """Test that health report includes critical collections"""
    # Create a critical collection
    health_service.record_query("visa_oracle", had_results=False)
    # Set stale data
    health_service.metrics["visa_oracle"]["last_updated"] = (datetime.now() - timedelta(days=400)).isoformat()
    
    report = health_service.get_health_report()
    
    # Should mention critical or warning
    assert "CRITICAL" in report or "critical" in report.lower() or "⚠️" in report or "🚨" in report

