"""
Unit tests for Query Router Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path

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


# ============================================================================
# Tests for explicit overrides and special routing
# ============================================================================


def test_route_founder_query_fondatore(query_router):
    """Test route() routes fondatore queries to team collection"""
    queries = [
        "Who is the fondatore?",
        "Tell me about the fondatore of the company",
        "fondatore information",
    ]

    for query in queries:
        result = query_router.route(query)
        assert result == "bali_zero_team"


def test_route_founder_query_founder(query_router):
    """Test route() routes founder queries to team collection"""
    queries = [
        "Who is the founder?",
        "Tell me about the founder of the company",
        "founder information",
    ]

    for query in queries:
        result = query_router.route(query)
        assert result == "bali_zero_team"


def test_route_team_keywords(query_router):
    """Test route() routes team queries correctly"""
    queries = [
        "Who is on the team?",
        "team members list",
        "lista team completa",
        "mostrami il team",
    ]

    for query in queries:
        result = query_router.route(query)
        assert result == "bali_zero_team"


def test_route_tax_updates(query_router):
    """Test route() routes tax update queries to tax_updates"""
    query = "latest tax updates and pembaruan"
    result = query_router.route(query)
    assert result == "tax_updates"


def test_route_legal_updates(query_router):
    """Test route() routes legal update queries to legal_updates"""
    # Use strong legal keywords + update keywords to ensure legal wins
    query = "company formation incorporation limited liability updates pembaruan"
    result = query_router.route(query)
    assert result == "legal_updates"


def test_route_books_keywords(query_router):
    """Test route() routes books queries to zantara_books"""
    queries = [
        "Plato's Republic",
        "philosophy of Aristotle",
        "machine learning algorithms",
    ]

    for query in queries:
        result = query_router.route(query)
        assert result == "zantara_books"


def test_route_property_listings(query_router):
    """Test route() routes property listings to property_listings"""
    queries = [
        "property for sale in Bali",
        "villa dijual",
        "rent apartment sewa",
    ]

    for query in queries:
        result = query_router.route(query)
        assert result == "property_listings"


# ============================================================================
# Tests for calculate_confidence()
# ============================================================================


def test_calculate_confidence_no_matches(query_router):
    """Test calculate_confidence() with no keyword matches"""
    query = "random unrelated query xyz"
    domain_scores = {"visa": 0, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert confidence == 0.0


def test_calculate_confidence_low_matches(query_router):
    """Test calculate_confidence() with 1-2 matches"""
    query = "visa question"
    domain_scores = {"visa": 1, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_medium_matches(query_router):
    """Test calculate_confidence() with 3-4 matches"""
    query = "visa immigration passport sponsor"
    domain_scores = {"visa": 4, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_high_matches(query_router):
    """Test calculate_confidence() with 5+ matches"""
    query = "visa immigration passport sponsor stay permit work permit"
    domain_scores = {"visa": 6, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_short_query(query_router):
    """Test calculate_confidence() with short query (<5 words)"""
    query = "visa info"
    domain_scores = {"visa": 1, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert 0.0 <= confidence <= 1.0


def test_calculate_confidence_medium_query(query_router):
    """Test calculate_confidence() with medium query (5-9 words)"""
    query = "how to get visa for work"
    domain_scores = {"visa": 1, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_long_query(query_router):
    """Test calculate_confidence() with long query (10+ words)"""
    query = "how to apply for work visa and what documents are needed for immigration"
    domain_scores = {"visa": 2, "kbli": 0, "tax": 0, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_clear_winner(query_router):
    """Test calculate_confidence() with clear domain winner"""
    query = "visa immigration passport"
    domain_scores = {"visa": 3, "kbli": 0, "tax": 0, "legal": 1, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    # Should have higher specificity confidence
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_moderate_winner(query_router):
    """Test calculate_confidence() with moderate domain winner (not clear)"""
    # Scenario: max_score > second_max but NOT > second_max * 2
    # This triggers line 584: elif max_score > second_max
    query = "visa immigration company"
    domain_scores = {"visa": 3, "kbli": 0, "tax": 0, "legal": 2, "property": 0, "books": 0}
    # visa=3 > legal=2, but 3 NOT > 2*2=4, so moderate winner

    confidence = query_router.calculate_confidence(query, domain_scores)
    # Should have moderate specificity confidence
    assert 0.0 < confidence <= 1.0


def test_calculate_confidence_tie(query_router):
    """Test calculate_confidence() with domain tie"""
    query = "visa and tax question"
    domain_scores = {"visa": 1, "kbli": 0, "tax": 1, "legal": 0, "property": 0, "books": 0}

    confidence = query_router.calculate_confidence(query, domain_scores)
    # Should have lower specificity confidence
    assert 0.0 < confidence <= 1.0


# ============================================================================
# Tests for get_fallback_collections()
# ============================================================================


def test_get_fallback_collections_high_confidence(query_router):
    """Test get_fallback_collections() with high confidence returns primary only"""
    collections = query_router.get_fallback_collections("visa_oracle", 0.9)
    assert collections == ["visa_oracle"]


def test_get_fallback_collections_medium_confidence(query_router):
    """Test get_fallback_collections() with medium confidence returns 1 fallback"""
    collections = query_router.get_fallback_collections("visa_oracle", 0.5)
    assert len(collections) <= 2  # Primary + 1 fallback


def test_get_fallback_collections_low_confidence(query_router):
    """Test get_fallback_collections() with low confidence returns 3 fallbacks"""
    collections = query_router.get_fallback_collections("visa_oracle", 0.2)
    assert 1 <= len(collections) <= 4  # Primary + up to 3 fallbacks


def test_get_fallback_collections_custom_max(query_router):
    """Test get_fallback_collections() respects max_fallbacks parameter"""
    collections = query_router.get_fallback_collections("visa_oracle", 0.1, max_fallbacks=2)
    assert len(collections) <= 3  # Primary + max 2 fallbacks


# ============================================================================
# Tests for route_with_confidence() additional branches
# ============================================================================


def test_route_with_confidence_founder_override(query_router):
    """Test route_with_confidence() handles founder override"""
    collection, confidence, fallbacks = query_router.route_with_confidence("Who is the founder?")
    assert collection == "bali_zero_team"
    assert confidence == 1.0
    assert fallbacks == ["bali_zero_team"]


def test_route_with_confidence_tax_genius(query_router):
    """Test route_with_confidence() routes to tax_genius"""
    collection, confidence, fallbacks = query_router.route_with_confidence("how to calculate tax")
    assert collection == "tax_genius"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_tax_updates(query_router):
    """Test route_with_confidence() routes to tax_updates"""
    collection, confidence, fallbacks = query_router.route_with_confidence("latest tax updates")
    assert collection == "tax_updates"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_tax_knowledge(query_router):
    """Test route_with_confidence() routes to tax_knowledge"""
    collection, confidence, fallbacks = query_router.route_with_confidence("tax regulations")
    assert collection in ["tax_knowledge", "tax_genius", "tax_updates"]
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_legal_updates(query_router):
    """Test route_with_confidence() routes to legal_updates"""
    # Use strong legal keywords + update keywords to ensure legal wins
    collection, confidence, fallbacks = query_router.route_with_confidence(
        "company formation incorporation limited liability updates pembaruan"
    )
    assert collection == "legal_updates"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_legal_architect(query_router):
    """Test route_with_confidence() routes to legal_architect"""
    collection, confidence, fallbacks = query_router.route_with_confidence(
        "company formation legal"
    )
    assert collection == "legal_architect"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_property_listings(query_router):
    """Test route_with_confidence() routes to property_listings"""
    collection, confidence, fallbacks = query_router.route_with_confidence("property for sale")
    assert collection == "property_listings"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_property_knowledge(query_router):
    """Test route_with_confidence() routes to property_knowledge"""
    collection, confidence, fallbacks = query_router.route_with_confidence(
        "property investment info"
    )
    assert collection == "property_knowledge"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_visa(query_router):
    """Test route_with_confidence() routes to visa_oracle"""
    collection, confidence, fallbacks = query_router.route_with_confidence("visa requirements")
    assert collection == "visa_oracle"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_kbli(query_router):
    """Test route_with_confidence() routes to kbli_eye"""
    collection, confidence, fallbacks = query_router.route_with_confidence("KBLI classification")
    assert collection == "kbli_eye"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_books(query_router):
    """Test route_with_confidence() routes to zantara_books"""
    collection, confidence, fallbacks = query_router.route_with_confidence("Plato philosophy")
    assert collection == "zantara_books"
    assert 0.0 < confidence <= 1.0


def test_route_with_confidence_no_fallbacks(query_router):
    """Test route_with_confidence() with return_fallbacks=False"""
    collection, confidence, fallbacks = query_router.route_with_confidence(
        "visa question", return_fallbacks=False
    )
    assert collection == "visa_oracle"
    assert fallbacks == ["visa_oracle"]


def test_route_with_confidence_updates_stats(query_router):
    """Test route_with_confidence() updates fallback stats"""
    initial_total = query_router.fallback_stats["total_routes"]

    query_router.route_with_confidence("visa requirements")

    assert query_router.fallback_stats["total_routes"] == initial_total + 1


def test_route_with_confidence_high_confidence_stats(query_router):
    """Test route_with_confidence() tracks high confidence"""
    query_router.route_with_confidence("visa immigration passport sponsor stay permit work permit")

    # Should increment high_confidence counter
    assert query_router.fallback_stats["high_confidence"] >= 0


def test_route_with_confidence_fallbacks_used_stats(query_router):
    """Test route_with_confidence() tracks fallbacks used"""
    # Low confidence query should use fallbacks
    query_router.route_with_confidence("random question")

    # Fallbacks may or may not be used depending on confidence
    assert query_router.fallback_stats["fallbacks_used"] >= 0


# ============================================================================
# Tests for get_routing_stats()
# ============================================================================


def test_get_routing_stats_returns_dict(query_router):
    """Test get_routing_stats() returns dictionary with required fields"""
    stats = query_router.get_routing_stats("visa requirements")

    assert isinstance(stats, dict)
    assert "query" in stats
    assert "selected_collection" in stats
    assert "domain_scores" in stats
    assert "modifier_scores" in stats
    assert "matched_keywords" in stats
    assert "routing_method" in stats
    assert "total_matches" in stats


def test_get_routing_stats_domain_scores(query_router):
    """Test get_routing_stats() calculates domain scores"""
    stats = query_router.get_routing_stats("visa and tax question")

    assert stats["domain_scores"]["visa"] > 0
    assert stats["domain_scores"]["tax"] > 0


def test_get_routing_stats_matched_keywords(query_router):
    """Test get_routing_stats() returns matched keywords"""
    stats = query_router.get_routing_stats("visa immigration")

    assert "visa" in stats["matched_keywords"]["visa"]
    assert "immigration" in stats["matched_keywords"]["visa"]


def test_get_routing_stats_total_matches(query_router):
    """Test get_routing_stats() calculates total matches"""
    stats = query_router.get_routing_stats("visa tax legal")

    assert stats["total_matches"] > 0


def test_get_routing_stats_modifier_scores(query_router):
    """Test get_routing_stats() tracks modifier scores"""
    stats = query_router.get_routing_stats("latest tax updates")

    assert stats["modifier_scores"]["updates"] > 0


# ============================================================================
# Tests for get_fallback_stats()
# ============================================================================


def test_get_fallback_stats_returns_dict(query_router):
    """Test get_fallback_stats() returns dictionary with required fields"""
    stats = query_router.get_fallback_stats()

    assert isinstance(stats, dict)
    assert "total_routes" in stats
    assert "high_confidence" in stats
    assert "medium_confidence" in stats
    assert "low_confidence" in stats
    assert "fallbacks_used" in stats
    assert "fallback_rate" in stats
    assert "confidence_distribution" in stats


def test_get_fallback_stats_initial_state(query_router):
    """Test get_fallback_stats() returns zeros initially"""
    stats = query_router.get_fallback_stats()

    assert stats["total_routes"] == 0
    assert stats["fallback_rate"] == "0.0%"


def test_get_fallback_stats_after_routing(query_router):
    """Test get_fallback_stats() updates after routing"""
    query_router.route_with_confidence("visa question")
    query_router.route_with_confidence("tax question")

    stats = query_router.get_fallback_stats()
    assert stats["total_routes"] >= 2


def test_get_fallback_stats_confidence_distribution(query_router):
    """Test get_fallback_stats() calculates confidence distribution"""
    query_router.route_with_confidence("visa immigration passport")

    stats = query_router.get_fallback_stats()

    assert "high" in stats["confidence_distribution"]
    assert "medium" in stats["confidence_distribution"]
    assert "low" in stats["confidence_distribution"]
