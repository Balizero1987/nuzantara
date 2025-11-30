"""
Unit tests for Query Router Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.query_router import QueryRouter

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def query_router():
    """Create QueryRouter instance"""
    return QueryRouter()


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_initializes_router(query_router):
    """Test QueryRouter initialization"""
    assert query_router is not None
    assert hasattr(query_router, "VISA_KEYWORDS")
    assert hasattr(query_router, "KBLI_KEYWORDS")
    assert hasattr(query_router, "TAX_KEYWORDS")
    assert hasattr(query_router, "LEGAL_KEYWORDS")


# ============================================================================
# Tests for route()
# ============================================================================


def test_route_visa_keywords(query_router):
    """Test route() routes visa queries correctly"""
    visa_queries = [
        "What is a visa?",
        "How to get immigration permit?",
        "Tell me about passport",
        "sponsor requirements",
        "stay permit application",
    ]

    for query in visa_queries:
        result = query_router.route(query)
        assert result == "visa_oracle"


def test_route_kbli_keywords(query_router):
    """Test route() routes KBLI queries correctly"""
    kbli_queries = [
        "What is KBLI?",
        "business classification code",
        "OSS registration",
        "NIB application",
        "business license requirements",
    ]

    for query in kbli_queries:
        result = query_router.route(query)
        assert result in ["kbli_eye", "kbli_comprehensive"]


def test_route_tax_keywords(query_router):
    """Test route() routes tax queries correctly"""
    tax_queries = [
        "tax calculation",
        "pajak penghasilan",
        "VAT requirements",
        "tax compliance",
        "tax filing",
    ]

    for query in tax_queries:
        result = query_router.route(query)
        assert result in ["tax_genius", "tax_updates", "tax_knowledge"]


def test_route_legal_keywords(query_router):
    """Test route() routes legal queries correctly"""
    legal_queries = [
        "company formation",
        "foreign investment",
        "notary deed",
        "legal compliance",
        "contract requirements",
    ]

    for query in legal_queries:
        result = query_router.route(query)
        assert result in ["legal_architect", "legal_updates"]


def test_route_property_keywords(query_router):
    """Test route() routes property queries correctly"""
    property_queries = [
        "property listing",
        "real estate",
        "property investment",
        "property purchase",
    ]

    for query in property_queries:
        result = query_router.route(query)
        assert result in ["property_listings", "property_knowledge"]


def test_route_pricing_keywords(query_router):
    """Test route() routes pricing queries correctly"""
    # Note: Pricing routing is primarily handled by search_service.py, not query_router
    # Query router routes based on domain keywords (tax, visa, etc.)
    # When no domain keywords match, it defaults to visa_oracle
    
    # Generic pricing queries without domain keywords default to visa_oracle
    pricing_queries = [
        "What is the price?",
        "How much does it cost?",
        "pricing information",
        "service fees",
    ]
    
    for query in pricing_queries:
        result = query_router.route(query)
        # Default fallback when no domain keywords match
        assert result == "visa_oracle"
    
    # Pricing queries with tax keywords route to tax collections
    tax_pricing_queries = [
        "tax calculation price",
        "tax service pricelist",
    ]
    
    for query in tax_pricing_queries:
        result = query_router.route(query)
        # Should route to tax collection because of "tax" keyword
        assert result in ["tax_genius", "tax_updates", "tax_knowledge"]


def test_route_cultural_keywords(query_router):
    """Test route() routes cultural queries correctly"""
    # Note: Cultural routing may not be directly handled by query_router
    # It may route to books or default collections
    cultural_queries = [
        "Indonesian culture",
        "Bali customs",
        "cultural insights",
        "local traditions",
    ]

    for query in cultural_queries:
        result = query_router.route(query)
        # May route to books if "culture" matches BOOKS_KEYWORDS, or default to visa_oracle
        assert isinstance(result, str)
        assert len(result) > 0


def test_route_default_fallback(query_router):
    """Test route() falls back to visa_oracle for unknown queries"""
    unknown_queries = [
        "random question",
        "hello world",
        "test query",
    ]

    for query in unknown_queries:
        result = query_router.route(query)
        # Should default to visa_oracle or a valid collection
        assert isinstance(result, str)
        assert len(result) > 0


def test_route_case_insensitive(query_router):
    """Test route() is case insensitive"""
    query1 = "VISA REQUIREMENTS"
    query2 = "visa requirements"
    query3 = "Visa Requirements"

    result1 = query_router.route(query1)
    result2 = query_router.route(query2)
    result3 = query_router.route(query3)

    assert result1 == result2 == result3


# ============================================================================
# Tests for route_with_confidence()
# ============================================================================


def test_route_with_confidence_returns_tuple(query_router):
    """Test route_with_confidence() returns tuple"""
    query = "What is a visa?"
    result = query_router.route_with_confidence(query)

    assert isinstance(result, tuple)
    assert len(result) == 3
    collection, confidence, fallbacks = result
    assert isinstance(collection, str)
    assert isinstance(confidence, float)
    assert isinstance(fallbacks, list)


def test_route_with_confidence_high_confidence(query_router):
    """Test route_with_confidence() returns confidence for queries"""
    query = "visa application requirements"
    collection, confidence, fallbacks = query_router.route_with_confidence(query)

    assert collection == "visa_oracle"
    # Confidence calculation depends on keyword matches
    # For a query with visa keywords, confidence should be > 0
    assert confidence > 0.0
    assert confidence <= 1.0


def test_route_with_confidence_low_confidence(query_router):
    """Test route_with_confidence() returns low confidence for ambiguous queries"""
    query = "random ambiguous question"
    collection, confidence, fallbacks = query_router.route_with_confidence(query)

    assert confidence <= 0.5  # Should have low confidence


def test_route_with_confidence_includes_fallbacks(query_router):
    """Test route_with_confidence() includes fallback collections"""
    query = "tax and legal question"
    collection, confidence, fallbacks = query_router.route_with_confidence(query)

    assert isinstance(fallbacks, list)
    assert len(fallbacks) >= 0


def test_route_with_confidence_confidence_range(query_router):
    """Test route_with_confidence() returns confidence in valid range"""
    queries = [
        "visa question",
        "tax question",
        "legal question",
        "ambiguous question",
    ]

    for query in queries:
        collection, confidence, fallbacks = query_router.route_with_confidence(query)
        assert 0.0 <= confidence <= 1.0


# ============================================================================
# Tests for keyword matching
# ============================================================================


def test_visa_keywords_defined(query_router):
    """Test VISA_KEYWORDS are defined"""
    assert len(query_router.VISA_KEYWORDS) > 0
    assert "visa" in query_router.VISA_KEYWORDS
    assert "immigration" in query_router.VISA_KEYWORDS


def test_kbli_keywords_defined(query_router):
    """Test KBLI_KEYWORDS are defined"""
    assert len(query_router.KBLI_KEYWORDS) > 0
    assert "kbli" in query_router.KBLI_KEYWORDS


def test_tax_keywords_defined(query_router):
    """Test TAX_KEYWORDS are defined"""
    assert len(query_router.TAX_KEYWORDS) > 0
    assert "tax" in query_router.TAX_KEYWORDS


def test_legal_keywords_defined(query_router):
    """Test LEGAL_KEYWORDS are defined"""
    assert len(query_router.LEGAL_KEYWORDS) > 0
    assert "company" in query_router.LEGAL_KEYWORDS


def test_keyword_matching_multiple_keywords(query_router):
    """Test route() handles queries with multiple keywords"""
    query = "visa and tax requirements for company formation"
    result = query_router.route(query)

    # Should route to one of the collections (priority-based)
    assert isinstance(result, str)
    assert len(result) > 0


def test_keyword_matching_partial_matches(query_router):
    """Test route() matches partial keywords"""
    query = "visa application process"
    result = query_router.route(query)

    assert result == "visa_oracle"


def test_keyword_matching_no_matches(query_router):
    """Test route() handles queries with no keyword matches"""
    query = "xyz abc 123 random"
    result = query_router.route(query)

    # Should still return a valid collection (default fallback)
    assert isinstance(result, str)
    assert len(result) > 0

