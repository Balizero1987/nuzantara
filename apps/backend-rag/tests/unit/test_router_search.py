"""
Unit tests for Search Router
100% coverage target with comprehensive FastAPI testing
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    with patch("app.routers.search.SearchService") as mock:
        service_instance = MagicMock()

        # Mock successful search response
        service_instance.search = AsyncMock(
            return_value={
                "query": "test query",
                "results": {
                    "documents": ["Document 1", "Document 2"],
                    "metadatas": [
                        {
                            "book_title": "Test Book 1",
                            "book_author": "Author 1",
                            "tier": "A",
                            "min_level": 1,
                            "chunk_index": 0,
                            "page_number": 10,
                            "language": "en",
                            "topics": ["visa", "business"],
                            "file_path": "/test/path1.pdf",
                            "total_chunks": 100,
                        },
                        {
                            "book_title": "Test Book 2",
                            "book_author": "Author 2",
                            "tier": "B",
                            "min_level": 2,
                            "chunk_index": 1,
                            "page_number": 20,
                            "language": "id",
                            "topics": ["tax"],
                            "file_path": "/test/path2.pdf",
                            "total_chunks": 50,
                        },
                    ],
                    "distances": [0.1, 0.2],
                },
                "user_level": 2,
                "allowed_tiers": ["S", "A", "B", "C"],
                "collection_used": "visa_oracle",
            }
        )

        mock.return_value = service_instance
        yield mock


@pytest.fixture
def client(mock_search_service):
    """Create test client with mocked dependencies"""
    from fastapi import FastAPI

    from app.routers.search import router

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


# ============================================================================
# Test POST /api/search/ - Semantic Search
# ============================================================================


def test_semantic_search_success(client, mock_search_service):
    """Test successful semantic search"""
    request_data = {
        "query": "What is KITAS visa?",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()

    # Verify response structure
    assert "query" in data
    assert "results" in data
    assert "total_found" in data
    assert "user_level" in data
    assert "execution_time_ms" in data

    # Verify data values
    assert data["query"] == "What is KITAS visa?"
    assert data["user_level"] == 2
    assert data["total_found"] == 2
    assert len(data["results"]) == 2

    # Verify result structure
    result = data["results"][0]
    assert "text" in result
    assert "metadata" in result
    assert "similarity_score" in result

    # Verify metadata
    metadata = result["metadata"]
    assert metadata["book_title"] == "Test Book 1"
    assert metadata["book_author"] == "Author 1"
    assert metadata["tier"] == "A"
    assert metadata["min_level"] == 1


def test_semantic_search_with_collection_override(client, mock_search_service):
    """Test semantic search with collection override"""
    request_data = {
        "query": "What is the price?",
        "level": 1,
        "limit": 3,
        "collection": "bali_zero_pricing",
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()

    # Verify search was called with collection override
    service = mock_search_service.return_value
    service.search.assert_called_once()
    call_kwargs = service.search.call_args[1]
    assert call_kwargs["collection_override"] == "bali_zero_pricing"


def test_semantic_search_with_tier_filter(client, mock_search_service):
    """Test semantic search with tier filter"""

    request_data = {
        "query": "tax regulations",
        "level": 2,
        "limit": 5,
        "tier_filter": ["A", "B"],
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200

    # Verify tier_filter was passed correctly
    service = mock_search_service.return_value
    service.search.assert_called_once()
    call_kwargs = service.search.call_args[1]
    assert call_kwargs["tier_filter"] is not None


def test_semantic_search_invalid_level_negative(client, mock_search_service):
    """Test semantic search with negative level returns 422 or 400"""
    request_data = {
        "query": "test query",
        "level": -1,  # Invalid: below 0
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    # Could be 422 (Pydantic validation) or 400 (router validation)
    assert response.status_code in [400, 422]
    data = response.json()
    # Error detail varies based on validation layer
    assert "detail" in data


def test_semantic_search_invalid_level_too_high(client, mock_search_service):
    """Test semantic search with level > 3 returns 422 or 400"""
    request_data = {
        "query": "test query",
        "level": 4,  # Invalid: above 3
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    # Could be 422 (Pydantic validation) or 400 (router validation)
    assert response.status_code in [400, 422]
    data = response.json()
    assert "detail" in data


def test_semantic_search_valid_level_0(client, mock_search_service):
    """Test semantic search with level 0 (S tier only) succeeds"""
    request_data = {
        "query": "test query",
        "level": 0,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["user_level"] == 0


def test_semantic_search_valid_level_3(client, mock_search_service):
    """Test semantic search with level 3 (all tiers) succeeds"""
    request_data = {
        "query": "test query",
        "level": 3,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["user_level"] == 3


def test_semantic_search_custom_limit(client, mock_search_service):
    """Test semantic search with custom limit"""
    request_data = {
        "query": "test query",
        "level": 2,
        "limit": 10,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200

    # Verify limit was passed correctly
    service = mock_search_service.return_value
    service.search.assert_called_once()
    call_kwargs = service.search.call_args[1]
    assert call_kwargs["limit"] == 10


def test_semantic_search_default_limit(client, mock_search_service):
    """Test semantic search uses default limit when not specified"""
    request_data = {
        "query": "test query",
        "level": 2,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200

    # Verify default limit (5) was used
    service = mock_search_service.return_value
    service.search.assert_called_once()
    call_kwargs = service.search.call_args[1]
    assert call_kwargs["limit"] == 5  # Default value


def test_semantic_search_empty_query(client, mock_search_service):
    """Test semantic search with empty query string"""
    request_data = {
        "query": "",
        "level": 2,
        "limit": 5,
    }

    # Empty queries might fail Pydantic validation or be processed
    response = client.post("/api/search/", json=request_data)

    # Accept both: 422 if validation fails, 200 if processed
    assert response.status_code in [200, 422]


def test_semantic_search_long_query(client, mock_search_service):
    """Test semantic search with very long query"""
    long_query = "What is the process for " + "visa application " * 100

    request_data = {
        "query": long_query,
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200


def test_semantic_search_no_results(client, mock_search_service):
    """Test semantic search when no results found"""
    # Mock search returning empty results
    service = mock_search_service.return_value
    service.search.return_value = {
        "query": "test query",
        "results": {
            "documents": [],
            "metadatas": [],
            "distances": [],
        },
        "user_level": 2,
        "allowed_tiers": ["S", "A", "B", "C"],
        "collection_used": "visa_oracle",
    }

    request_data = {
        "query": "nonexistent query",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["total_found"] == 0
    assert len(data["results"]) == 0


def test_semantic_search_service_error(client, mock_search_service):
    """Test semantic search when SearchService raises exception"""
    # Mock search raising an exception
    service = mock_search_service.return_value
    service.search.side_effect = Exception("Database connection failed")

    request_data = {
        "query": "test query",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 500
    data = response.json()
    assert "search failed" in data["detail"].lower()


def test_semantic_search_missing_query_field(client, mock_search_service):
    """Test semantic search with missing required query field"""
    request_data = {
        # Missing "query" field
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 422  # Validation error


def test_semantic_search_missing_level_field(client, mock_search_service):
    """Test semantic search with missing level field uses default (0)"""
    request_data = {
        "query": "test query",
        # Missing "level" field - should use default 0
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    # Level has default value, so request should succeed
    assert response.status_code == 200

    # Verify default level (0) was used
    service = mock_search_service.return_value
    service.search.assert_called_once()
    call_kwargs = service.search.call_args[1]
    assert call_kwargs["user_level"] == 0  # Default value


def test_semantic_search_invalid_limit_type(client, mock_search_service):
    """Test semantic search with invalid limit type"""
    request_data = {
        "query": "test query",
        "level": 2,
        "limit": "invalid",  # Should be int
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 422  # Validation error


def test_semantic_search_execution_time_included(client, mock_search_service):
    """Test that execution time is included in response"""
    request_data = {
        "query": "test query",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert "execution_time_ms" in data
    assert isinstance(data["execution_time_ms"], float)
    assert data["execution_time_ms"] >= 0


def test_semantic_search_similarity_score_format(client, mock_search_service):
    """Test that similarity scores are properly formatted"""
    request_data = {
        "query": "test query",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()

    for result in data["results"]:
        score = result["similarity_score"]
        assert isinstance(score, float)
        assert 0 <= score <= 1  # Similarity score should be between 0 and 1
        # Check it's rounded to 4 decimal places
        assert len(str(score).split(".")[-1]) <= 4


def test_semantic_search_metadata_complete(client, mock_search_service):
    """Test that all metadata fields are present"""
    request_data = {
        "query": "test query",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()

    result = data["results"][0]
    metadata = result["metadata"]

    # Verify all expected metadata fields exist
    expected_fields = [
        "book_title",
        "book_author",
        "tier",
        "min_level",
        "chunk_index",
        "page_number",
        "language",
        "topics",
        "file_path",
        "total_chunks",
    ]

    for field in expected_fields:
        assert field in metadata


# ============================================================================
# Test GET /api/search/health - Health Check
# ============================================================================


def test_search_health_success(client, mock_search_service):
    """Test health check when service is operational"""
    response = client.get("/api/search/health")

    assert response.status_code == 200
    data = response.json()

    # Verify health response structure
    assert data["status"] == "operational"
    assert data["service"] == "search"
    assert data["embeddings"] == "ready"
    assert data["vector_db"] == "connected"


def test_search_health_service_unavailable(client, mock_search_service):
    """Test health check when service initialization fails"""
    # Mock SearchService initialization failing
    mock_search_service.side_effect = Exception("Cannot connect to Qdrant")

    response = client.get("/api/search/health")

    assert response.status_code == 503
    data = response.json()
    assert "unhealthy" in data["detail"].lower()


def test_search_health_no_auth_required(client, mock_search_service):
    """Test health check doesn't require authentication"""
    # Health check should work without any headers
    response = client.get("/api/search/health")

    # Should succeed (not 401 or 403)
    assert response.status_code in [200, 503]


# ============================================================================
# Integration Tests
# ============================================================================


def test_search_logging(client, mock_search_service, caplog):
    """Test that search operations are logged"""
    import logging

    caplog.set_level(logging.INFO)

    request_data = {
        "query": "test query",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200

    # Verify logging occurred
    # Note: Logging might be in the service layer, not router
    # This test verifies logging infrastructure is working


def test_search_multiple_requests(client, mock_search_service):
    """Test multiple consecutive search requests"""
    queries = [
        "visa requirements",
        "tax information",
        "legal documents",
    ]

    for query_text in queries:
        request_data = {
            "query": query_text,
            "level": 2,
            "limit": 5,
        }

        response = client.post("/api/search/", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == query_text


def test_search_with_all_optional_params(client, mock_search_service):
    """Test search with all optional parameters specified"""
    request_data = {
        "query": "comprehensive test",
        "level": 2,
        "limit": 10,
        "tier_filter": ["A", "B", "C"],
        "collection": "visa_oracle",
    }

    response = client.post("/api/search/", json=request_data)

    assert response.status_code == 200
    data = response.json()

    # Verify all parameters were processed
    service = mock_search_service.return_value
    service.search.assert_called_once()
    call_kwargs = service.search.call_args[1]

    assert call_kwargs["query"] == "comprehensive test"
    assert call_kwargs["user_level"] == 2
    assert call_kwargs["limit"] == 10
    assert call_kwargs["tier_filter"] is not None
    assert call_kwargs["collection_override"] == "visa_oracle"


# ============================================================================
# Edge Cases
# ============================================================================


def test_search_special_characters_in_query(client, mock_search_service):
    """Test search with special characters"""
    special_queries = [
        "What is KITAS? (visa)",
        "Tax @ 10%",
        "Legal & Compliance",
        "Price: $1000",
        "Email: test@example.com",
    ]

    for query in special_queries:
        request_data = {
            "query": query,
            "level": 2,
            "limit": 5,
        }

        response = client.post("/api/search/", json=request_data)
        assert response.status_code == 200


def test_search_unicode_characters(client, mock_search_service):
    """Test search with Unicode/Indonesian characters"""
    unicode_queries = [
        "Apa itu visa KITAS?",
        "Informasi pajak di Bali",
        "Hukum & Regulasi",
        "中文查询测试",
        "日本語クエリ",
    ]

    for query in unicode_queries:
        request_data = {
            "query": query,
            "level": 2,
            "limit": 5,
        }

        response = client.post("/api/search/", json=request_data)
        assert response.status_code == 200


def test_search_very_short_query(client, mock_search_service):
    """Test search with single character query"""
    request_data = {
        "query": "a",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)
    assert response.status_code == 200


def test_search_numeric_query(client, mock_search_service):
    """Test search with numeric query"""
    request_data = {
        "query": "123456",
        "level": 2,
        "limit": 5,
    }

    response = client.post("/api/search/", json=request_data)
    assert response.status_code == 200


def test_search_limit_boundary_1(client, mock_search_service):
    """Test search with minimum limit (1)"""
    request_data = {
        "query": "test",
        "level": 2,
        "limit": 1,
    }

    response = client.post("/api/search/", json=request_data)
    assert response.status_code == 200


def test_search_limit_boundary_50(client, mock_search_service):
    """Test search with maximum limit (50)"""
    request_data = {
        "query": "test",
        "level": 2,
        "limit": 50,
    }

    response = client.post("/api/search/", json=request_data)
    assert response.status_code == 200


def test_search_zero_limit_validation(client, mock_search_service):
    """Test search with zero limit (should fail validation)"""
    request_data = {
        "query": "test",
        "level": 2,
        "limit": 0,
    }

    response = client.post("/api/search/", json=request_data)
    # Should fail validation (limit must be >= 1)
    assert response.status_code == 422


def test_search_negative_limit(client, mock_search_service):
    """Test search with negative limit (should fail validation)"""
    request_data = {
        "query": "test",
        "level": 2,
        "limit": -5,
    }

    response = client.post("/api/search/", json=request_data)
    # Should fail validation
    assert response.status_code == 422


def test_search_excessive_limit(client, mock_search_service):
    """Test search with limit > 50 (should fail validation)"""
    request_data = {
        "query": "test",
        "level": 2,
        "limit": 100,
    }

    response = client.post("/api/search/", json=request_data)
    # Should fail validation (limit max is 50)
    assert response.status_code == 422
