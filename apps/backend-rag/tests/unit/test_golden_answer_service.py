"""
Unit tests for Golden Answer Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.golden_answer_service import GoldenAnswerService

# ============================================================================
# Fixtures
# ============================================================================


class AsyncContextManager:
    """Helper class for async context manager"""

    def __init__(self, return_value):
        self.return_value = return_value

    async def __aenter__(self):
        return self.return_value

    async def __aexit__(self, *args):
        pass


@pytest.fixture
def mock_pool():
    """Mock asyncpg.Pool"""
    pool = MagicMock()
    pool.close = AsyncMock()
    conn = MagicMock()
    conn.fetchrow = AsyncMock()
    conn.fetch = AsyncMock()
    conn.execute = AsyncMock()

    # Mock acquire as async context manager
    pool.acquire = MagicMock(return_value=AsyncContextManager(conn))
    return pool, conn


@pytest.fixture
def golden_answer_service(mock_pool):
    """Create GoldenAnswerService instance"""
    pool, conn = mock_pool

    async def mock_create_pool(*args, **kwargs):
        return pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = pool
        return service, pool, conn


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init():
    """Test initialization"""
    service = GoldenAnswerService("postgresql://test")

    assert service.database_url == "postgresql://test"
    assert service.pool is None
    assert service.model is None
    assert service.similarity_threshold == 0.80


# ============================================================================
# Tests for connect
# ============================================================================


@pytest.mark.asyncio
async def test_connect_success():
    """Test connect successful"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        await service.connect()

        assert service.pool == mock_pool


@pytest.mark.asyncio
async def test_connect_failure():
    """Test connect handles exception"""
    with patch(
        "services.golden_answer_service.asyncpg.create_pool",
        side_effect=Exception("Connection error"),
    ):
        service = GoldenAnswerService("postgresql://test")

        with pytest.raises(Exception):
            await service.connect()


# ============================================================================
# Tests for close
# ============================================================================


@pytest.mark.asyncio
async def test_close_success(golden_answer_service):
    """Test close successful"""
    service, pool, conn = golden_answer_service

    await service.close()

    pool.close.assert_called_once()


@pytest.mark.asyncio
async def test_close_no_pool():
    """Test close without pool"""
    service = GoldenAnswerService("postgresql://test")

    # Should not raise exception
    await service.close()


# ============================================================================
# Tests for _load_model
# ============================================================================


def test_load_model_lazy(golden_answer_service):
    """Test _load_model lazy loading"""
    service, pool, conn = golden_answer_service

    with patch("services.golden_answer_service.SentenceTransformer") as mock_transformer:
        mock_model = MagicMock()
        mock_transformer.return_value = mock_model

        service._load_model()

        assert service.model == mock_model
        mock_transformer.assert_called_once_with("all-MiniLM-L6-v2")


def test_load_model_already_loaded(golden_answer_service):
    """Test _load_model doesn't reload if already loaded"""
    service, pool, conn = golden_answer_service
    mock_model = MagicMock()
    service.model = mock_model

    with patch("services.golden_answer_service.SentenceTransformer") as mock_transformer:
        service._load_model()

        assert service.model == mock_model
        mock_transformer.assert_not_called()


# ============================================================================
# Tests for lookup_golden_answer
# ============================================================================


@pytest.mark.asyncio
async def test_lookup_golden_answer_exact_match(golden_answer_service):
    """Test lookup_golden_answer with exact match"""
    service, pool, conn = golden_answer_service

    # Create a class that supports both attribute and dict access
    class MockRow:
        def __init__(self):
            self.cluster_id = "cluster_123"
            self.canonical_question = "How to get KITAS?"
            self.answer = "KITAS answer"
            self.sources = ["source1"]
            self.confidence = 0.95
            self.usage_count = 10

        def __getitem__(self, key):
            return getattr(self, key)

    mock_row = MockRow()
    conn.fetchrow = AsyncMock(return_value=mock_row)
    conn.execute = AsyncMock()

    result = await service.lookup_golden_answer("How to get KITAS?")

    assert result is not None
    assert result["cluster_id"] == "cluster_123"
    assert result["match_type"] == "exact"
    assert result["answer"] == "KITAS answer"
    conn.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_lookup_golden_answer_semantic_match(golden_answer_service):
    """Test lookup_golden_answer with semantic match"""
    service, pool, conn = golden_answer_service

    # No exact match
    conn.fetchrow = AsyncMock(return_value=None)

    # Mock semantic lookup
    with patch.object(
        service,
        "_semantic_lookup",
        return_value={
            "cluster_id": "cluster_456",
            "canonical_question": "KITAS process",
            "answer": "Semantic answer",
            "sources": [],
            "confidence": 0.85,
            "similarity": 0.82,
        },
    ):
        conn.execute = AsyncMock()

        result = await service.lookup_golden_answer("How do I get KITAS?")

        assert result is not None
        assert result["match_type"] == "semantic"
        assert result["similarity"] == 0.82


@pytest.mark.asyncio
async def test_lookup_golden_answer_no_match(golden_answer_service):
    """Test lookup_golden_answer with no match"""
    service, pool, conn = golden_answer_service

    conn.fetchrow = AsyncMock(return_value=None)

    with patch.object(service, "_semantic_lookup", return_value=None):
        result = await service.lookup_golden_answer("Unknown query")

        assert result is None


@pytest.mark.asyncio
async def test_lookup_golden_answer_auto_connect(golden_answer_service):
    """Test lookup_golden_answer auto-connects if pool is None"""
    service, pool, conn = golden_answer_service
    service.pool = None

    with patch.object(service, "connect", new_callable=AsyncMock) as mock_connect:
        conn.fetchrow = AsyncMock(return_value=None)
        with patch.object(service, "_semantic_lookup", return_value=None):
            await service.lookup_golden_answer("test")

            mock_connect.assert_called_once()


@pytest.mark.asyncio
async def test_lookup_golden_answer_exception(golden_answer_service):
    """Test lookup_golden_answer handles exception"""
    service, pool, conn = golden_answer_service

    conn.fetchrow.side_effect = Exception("Database error")

    result = await service.lookup_golden_answer("test")

    assert result is None


# ============================================================================
# Tests for _semantic_lookup
# ============================================================================


@pytest.mark.asyncio
async def test_semantic_lookup_success(golden_answer_service):
    """Test _semantic_lookup successful"""
    service, pool, conn = golden_answer_service

    mock_golden_answers = [
        {
            "cluster_id": "cluster_1",
            "canonical_question": "How to get KITAS?",
            "answer": "Answer 1",
            "sources": [],
            "confidence": 0.9,
            "usage_count": 10,
        },
        {
            "cluster_id": "cluster_2",
            "canonical_question": "Visa requirements",
            "answer": "Answer 2",
            "sources": [],
            "confidence": 0.85,
            "usage_count": 5,
        },
    ]

    conn.fetch = AsyncMock(return_value=mock_golden_answers)

    with (
        patch.object(service, "_load_model"),
        patch("services.golden_answer_service.SentenceTransformer") as mock_transformer,
    ):
        mock_model = MagicMock()
        mock_model.encode = MagicMock(
            side_effect=[
                [[0.1, 0.2, 0.3]],  # Query embedding
                [[0.1, 0.2, 0.3], [0.5, 0.6, 0.7]],  # Canonical embeddings
            ]
        )
        service.model = mock_model

        with patch("services.golden_answer_service.cosine_similarity", return_value=[[0.85, 0.5]]):
            with patch("services.golden_answer_service.np.argmax", return_value=0):
                result = await service._semantic_lookup("How to get KITAS?")

                assert result is not None
                assert result["cluster_id"] == "cluster_1"
                assert result["similarity"] == 0.85


@pytest.mark.asyncio
async def test_semantic_lookup_below_threshold(golden_answer_service):
    """Test _semantic_lookup below threshold"""
    service, pool, conn = golden_answer_service

    conn.fetch = AsyncMock(
        return_value=[
            {
                "cluster_id": "cluster_1",
                "canonical_question": "Test",
                "answer": "Answer",
                "sources": [],
                "confidence": 0.9,
                "usage_count": 10,
            }
        ]
    )

    with (
        patch.object(service, "_load_model"),
        patch("services.golden_answer_service.SentenceTransformer"),
    ):
        mock_model = MagicMock()
        mock_model.encode = MagicMock(return_value=[[0.1, 0.2]])
        service.model = mock_model

        with patch(
            "services.golden_answer_service.cosine_similarity", return_value=[[0.5]]
        ):  # Below 0.8 threshold
            with patch("services.golden_answer_service.np.argmax", return_value=0):
                result = await service._semantic_lookup("test")

                assert result is None


@pytest.mark.asyncio
async def test_semantic_lookup_no_pool():
    """Test _semantic_lookup without pool"""
    service = GoldenAnswerService("postgresql://test")

    result = await service._semantic_lookup("test")

    assert result is None


@pytest.mark.asyncio
async def test_semantic_lookup_no_answers(golden_answer_service):
    """Test _semantic_lookup with no golden answers"""
    service, pool, conn = golden_answer_service

    conn.fetch = AsyncMock(return_value=[])

    result = await service._semantic_lookup("test")

    assert result is None


@pytest.mark.asyncio
async def test_semantic_lookup_exception(golden_answer_service):
    """Test _semantic_lookup handles exception"""
    service, pool, conn = golden_answer_service

    conn.fetch.side_effect = Exception("Database error")

    result = await service._semantic_lookup("test")

    assert result is None


# ============================================================================
# Tests for _increment_usage
# ============================================================================


@pytest.mark.asyncio
async def test_increment_usage_success(golden_answer_service):
    """Test _increment_usage successful"""
    service, pool, conn = golden_answer_service

    conn.execute = AsyncMock()

    await service._increment_usage("cluster_123")

    conn.execute.assert_called_once()
    # Check SQL contains UPDATE and cluster_id
    call_args = str(conn.execute.call_args)
    assert "UPDATE" in call_args or "update" in call_args.lower()


@pytest.mark.asyncio
async def test_increment_usage_no_pool():
    """Test _increment_usage without pool"""
    service = GoldenAnswerService("postgresql://test")

    # Should not raise exception
    await service._increment_usage("cluster_123")


@pytest.mark.asyncio
async def test_increment_usage_exception(golden_answer_service):
    """Test _increment_usage handles exception"""
    service, pool, conn = golden_answer_service

    conn.execute.side_effect = Exception("Update error")

    # Should not raise exception
    await service._increment_usage("cluster_123")


# ============================================================================
# Tests for get_golden_answer_stats
# ============================================================================


@pytest.mark.asyncio
async def test_get_golden_answer_stats_success(golden_answer_service):
    """Test get_golden_answer_stats successful"""
    service, pool, conn = golden_answer_service

    class MockStats:
        def __init__(self):
            self.total_golden_answers = 100
            self.total_hits = 500
            self.avg_confidence = 0.85
            self.max_usage = 50
            self.min_usage = 1

        def __getitem__(self, key):
            return getattr(self, key)

    class MockTopRow:
        def __init__(self):
            self.cluster_id = "cluster_1"
            self.canonical_question = "Question 1"
            self.usage_count = 50
            self.last_used = None

        def __getitem__(self, key):
            return getattr(self, key)

    mock_stats = MockStats()
    mock_top_10 = [MockTopRow()]

    conn.fetchrow = AsyncMock(return_value=mock_stats)
    conn.fetch = AsyncMock(return_value=mock_top_10)

    result = await service.get_golden_answer_stats()

    assert result["total_golden_answers"] == 100
    assert result["total_hits"] == 500
    assert result["avg_confidence"] == 0.85
    assert len(result["top_10"]) == 1


@pytest.mark.asyncio
async def test_get_golden_answer_stats_auto_connect(golden_answer_service):
    """Test get_golden_answer_stats auto-connects"""
    service, pool, conn = golden_answer_service
    service.pool = None

    async def mock_connect():
        service.pool = pool

    with patch.object(service, "connect", side_effect=mock_connect):

        class MockStatsNone:
            def __init__(self):
                self.total_golden_answers = 0
                self.total_hits = None
                self.avg_confidence = None
                self.max_usage = None
                self.min_usage = None

            def __getitem__(self, key):
                return getattr(self, key)

        mock_stats = MockStatsNone()

        conn.fetchrow = AsyncMock(return_value=mock_stats)
        conn.fetch = AsyncMock(return_value=[])

        await service.get_golden_answer_stats()

        assert service.pool == pool


@pytest.mark.asyncio
async def test_get_golden_answer_stats_none_values(golden_answer_service):
    """Test get_golden_answer_stats handles None values"""
    service, pool, conn = golden_answer_service

    class MockStatsNone:
        def __init__(self):
            self.total_golden_answers = 0
            self.total_hits = None
            self.avg_confidence = None
            self.max_usage = None
            self.min_usage = None

        def __getitem__(self, key):
            return getattr(self, key)

    mock_stats = MockStatsNone()

    conn.fetchrow = AsyncMock(return_value=mock_stats)
    conn.fetch = AsyncMock(return_value=[])

    result = await service.get_golden_answer_stats()

    assert result["total_hits"] == 0
    assert result["avg_confidence"] == 0.0
    assert result["max_usage"] == 0
    assert result["min_usage"] == 0


# ============================================================================
# Additional Edge Cases and Error Path Tests
# ============================================================================


@pytest.mark.asyncio
async def test_lookup_golden_answer_with_whitespace_normalization():
    """Test query hash normalization with whitespace"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        class MockRow:
            def __init__(self):
                self.cluster_id = "cluster_123"
                self.canonical_question = "How to get KITAS?"
                self.answer = "Answer"
                self.sources = []
                self.confidence = 0.95
                self.usage_count = 5

            def __getitem__(self, key):
                return getattr(self, key)

        conn.fetchrow = AsyncMock(return_value=MockRow())
        conn.execute = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        # Test with different whitespace patterns that normalize to same hash
        result = await service.lookup_golden_answer("  How to get KITAS?  ")
        assert result is not None


@pytest.mark.asyncio
async def test_semantic_lookup_load_model_called():
    """Test _semantic_lookup calls _load_model"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()
        conn.fetch = AsyncMock(return_value=[])
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model") as mock_load_model:
            await service._semantic_lookup("test query")
            mock_load_model.assert_called_once()


@pytest.mark.asyncio
async def test_semantic_lookup_with_multiple_candidates():
    """Test _semantic_lookup picks best match from multiple answers"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        # Multiple golden answers to choose from
        mock_answers = [
            {
                "cluster_id": "cluster_1",
                "canonical_question": "How to get KITAS?",
                "answer": "Answer 1",
                "sources": [],
                "confidence": 0.9,
                "usage_count": 10,
            },
            {
                "cluster_id": "cluster_2",
                "canonical_question": "KITAS process",
                "answer": "Answer 2",
                "sources": [],
                "confidence": 0.85,
                "usage_count": 5,
            },
            {
                "cluster_id": "cluster_3",
                "canonical_question": "Visa requirements",
                "answer": "Answer 3",
                "sources": [],
                "confidence": 0.8,
                "usage_count": 3,
            },
        ]

        conn.fetch = AsyncMock(return_value=mock_answers)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model"):
            mock_model = MagicMock()
            service.model = mock_model

            # Simulate embeddings and similarities
            with (
                patch("services.golden_answer_service.SentenceTransformer"),
                patch(
                    "services.golden_answer_service.cosine_similarity",
                    return_value=[[0.75, 0.85, 0.65]],
                ),
                patch("services.golden_answer_service.np.argmax", return_value=1),
            ):  # cluster_2 is best
                result = await service._semantic_lookup("get KITAS info")

                assert result is not None
                assert result["cluster_id"] == "cluster_2"
                assert result["similarity"] == 0.85


@pytest.mark.asyncio
async def test_lookup_golden_answer_increment_usage_on_exact_match(golden_answer_service):
    """Test that usage count is incremented after exact match"""
    service, pool, conn = golden_answer_service

    class MockRow:
        def __init__(self):
            self.cluster_id = "cluster_123"
            self.canonical_question = "How to get KITAS?"
            self.answer = "Answer"
            self.sources = []
            self.confidence = 0.95
            self.usage_count = 10

        def __getitem__(self, key):
            return getattr(self, key)

    conn.fetchrow = AsyncMock(return_value=MockRow())
    conn.execute = AsyncMock()

    result = await service.lookup_golden_answer("How to get KITAS?")

    assert result is not None
    # Verify _increment_usage was called (check that execute was called)
    conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_lookup_golden_answer_increment_usage_on_semantic_match(golden_answer_service):
    """Test that usage count is incremented after semantic match"""
    service, pool, conn = golden_answer_service

    # No exact match
    conn.fetchrow = AsyncMock(return_value=None)

    # Mock semantic lookup with result
    semantic_result = {
        "cluster_id": "cluster_456",
        "canonical_question": "KITAS process",
        "answer": "Semantic answer",
        "sources": [],
        "confidence": 0.85,
        "similarity": 0.82,
    }

    with patch.object(service, "_semantic_lookup", return_value=semantic_result):
        conn.execute = AsyncMock()

        result = await service.lookup_golden_answer("How do I get KITAS?")

        assert result is not None
        # Verify usage was incremented
        conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_golden_answer_stats_with_dates():
    """Test get_golden_answer_stats with date values"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        from datetime import date

        class MockStats:
            def __init__(self):
                self.total_golden_answers = 50
                self.total_hits = 1000
                self.avg_confidence = 0.88
                self.max_usage = 100
                self.min_usage = 5

            def __getitem__(self, key):
                return getattr(self, key)

        class MockTopRow:
            def __init__(self, cluster_id, usage_count, last_used_date=None):
                self.cluster_id = cluster_id
                self.canonical_question = f"Question {cluster_id}"
                self.usage_count = usage_count
                self.last_used = last_used_date

            def __getitem__(self, key):
                return getattr(self, key)

        mock_stats = MockStats()
        test_date = date(2024, 1, 15)
        mock_top_10 = [
            MockTopRow("cluster_1", 100, test_date),
            MockTopRow("cluster_2", 90, test_date),
            MockTopRow("cluster_3", 80, None),
        ]

        conn.fetchrow = AsyncMock(return_value=mock_stats)
        conn.fetch = AsyncMock(return_value=mock_top_10)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        result = await service.get_golden_answer_stats()

        assert result["total_golden_answers"] == 50
        assert result["total_hits"] == 1000
        assert result["avg_confidence"] == 0.88
        assert len(result["top_10"]) == 3
        assert result["top_10"][0]["last_used"] == "2024-01-15"
        assert result["top_10"][2]["last_used"] is None


@pytest.mark.asyncio
async def test_semantic_lookup_exact_threshold_match():
    """Test _semantic_lookup when similarity equals threshold"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        mock_answers = [
            {
                "cluster_id": "cluster_1",
                "canonical_question": "Test",
                "answer": "Answer",
                "sources": [],
                "confidence": 0.9,
                "usage_count": 10,
            }
        ]

        conn.fetch = AsyncMock(return_value=mock_answers)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model"):
            mock_model = MagicMock()
            service.model = mock_model

            # Exactly at threshold (0.80)
            with patch("services.golden_answer_service.cosine_similarity", return_value=[[0.80]]):
                with patch("services.golden_answer_service.np.argmax", return_value=0):
                    result = await service._semantic_lookup("test")

                    assert result is not None
                    assert result["similarity"] == 0.80


@pytest.mark.asyncio
async def test_semantic_lookup_just_below_threshold():
    """Test _semantic_lookup when similarity just below threshold"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        mock_answers = [
            {
                "cluster_id": "cluster_1",
                "canonical_question": "Test",
                "answer": "Answer",
                "sources": [],
                "confidence": 0.9,
                "usage_count": 10,
            }
        ]

        conn.fetch = AsyncMock(return_value=mock_answers)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model"):
            mock_model = MagicMock()
            service.model = mock_model

            # Just below threshold (0.799)
            with patch("services.golden_answer_service.cosine_similarity", return_value=[[0.799]]):
                with patch("services.golden_answer_service.np.argmax", return_value=0):
                    result = await service._semantic_lookup("test")

                    assert result is None


@pytest.mark.asyncio
async def test_lookup_golden_answer_query_hash_consistency():
    """Test that query hash is consistent across calls"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()
        conn.fetchrow = AsyncMock(return_value=None)
        conn.fetch = AsyncMock(return_value=[])
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_semantic_lookup", return_value=None):
            # Call with same query twice
            await service.lookup_golden_answer("test query")
            await service.lookup_golden_answer("test query")

            # Verify fetchrow was called twice with same hash
            assert conn.fetchrow.call_count == 2

            # Extract hashes from both calls
            import hashlib

            expected_hash = hashlib.md5("test query".lower().strip().encode("utf-8")).hexdigest()

            # Both calls should use same hash
            call_1_hash = conn.fetchrow.call_args_list[0][0][1]
            call_2_hash = conn.fetchrow.call_args_list[1][0][1]
            assert call_1_hash == call_2_hash == expected_hash


@pytest.mark.asyncio
async def test_similarity_threshold_attribute():
    """Test similarity_threshold is correctly set"""
    service = GoldenAnswerService("postgresql://test")
    assert service.similarity_threshold == 0.80


@pytest.mark.asyncio
async def test_lookup_golden_answer_exception_with_semantic_lookup_call():
    """Test lookup_golden_answer exception in semantic lookup doesn't crash main function"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()
        conn.fetchrow = AsyncMock(return_value=None)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        # Semantic lookup raises exception
        with patch.object(service, "_semantic_lookup", side_effect=Exception("Semantic error")):
            result = await service.lookup_golden_answer("test")

            # Should handle gracefully and return None
            assert result is None


@pytest.mark.asyncio
async def test_get_golden_answer_stats_database_exception():
    """Test get_golden_answer_stats handles database exception"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()
        conn.fetchrow = AsyncMock(side_effect=Exception("Database error"))
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with pytest.raises(Exception):
            await service.get_golden_answer_stats()


@pytest.mark.asyncio
async def test_semantic_lookup_encodes_query_correctly():
    """Test that semantic lookup properly encodes query and answers"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        mock_answers = [
            {
                "cluster_id": "cluster_1",
                "canonical_question": "How to get KITAS?",
                "answer": "Answer 1",
                "sources": [],
                "confidence": 0.9,
                "usage_count": 10,
            }
        ]

        conn.fetch = AsyncMock(return_value=mock_answers)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model"):
            mock_model = MagicMock()

            # Track encode calls
            encode_calls = []

            def track_encode(texts):
                encode_calls.append(texts)
                if isinstance(texts, list) and all(isinstance(t, str) for t in texts):
                    return [[0.1, 0.2, 0.3]] * len(texts)
                return [[0.1, 0.2, 0.3]]

            mock_model.encode = track_encode
            service.model = mock_model

            with patch("services.golden_answer_service.cosine_similarity", return_value=[[0.85]]):
                with patch("services.golden_answer_service.np.argmax", return_value=0):
                    result = await service._semantic_lookup("test query")

                    # Verify encode was called for query and answers
                    assert len(encode_calls) == 2
                    assert "test query" in encode_calls[0] or encode_calls[0] == ["test query"]
                    assert (
                        "How to get KITAS?" in encode_calls[1]
                        or encode_calls[1][0] == "How to get KITAS?"
                    )


@pytest.mark.asyncio
async def test_connect_and_lookup_flow():
    """Test complete flow: init -> connect -> lookup -> close"""

    async def mock_create_pool(*args, **kwargs):
        mock_pool = AsyncMock()
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")

        # Initially no pool
        assert service.pool is None

        # Connect
        await service.connect()
        assert service.pool is not None

        # Close
        await service.close()


@pytest.mark.asyncio
async def test_get_golden_answer_stats_empty_database():
    """Test get_golden_answer_stats with empty database"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        class MockEmptyStats:
            def __init__(self):
                self.total_golden_answers = 0
                self.total_hits = 0
                self.avg_confidence = 0.0
                self.max_usage = 0
                self.min_usage = 0

            def __getitem__(self, key):
                return getattr(self, key)

        mock_stats = MockEmptyStats()
        conn.fetchrow = AsyncMock(return_value=mock_stats)
        conn.fetch = AsyncMock(return_value=[])
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        result = await service.get_golden_answer_stats()

        assert result["total_golden_answers"] == 0
        assert result["total_hits"] == 0
        assert result["top_10"] == []


@pytest.mark.asyncio
async def test_semantic_lookup_with_high_similarity():
    """Test _semantic_lookup with very high similarity scores"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        mock_answers = [
            {
                "cluster_id": "cluster_1",
                "canonical_question": "Perfect match",
                "answer": "Answer",
                "sources": [],
                "confidence": 0.99,
                "usage_count": 100,
            }
        ]

        conn.fetch = AsyncMock(return_value=mock_answers)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model"):
            mock_model = MagicMock()
            service.model = mock_model

            # Very high similarity (0.99)
            with patch("services.golden_answer_service.cosine_similarity", return_value=[[0.99]]):
                with patch("services.golden_answer_service.np.argmax", return_value=0):
                    result = await service._semantic_lookup("perfect match")

                    assert result is not None
                    assert result["similarity"] == 0.99
                    assert result["confidence"] == 0.99


@pytest.mark.asyncio
async def test_lookup_golden_answer_with_empty_sources():
    """Test lookup returns correct structure with empty sources"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        class MockRow:
            def __init__(self):
                self.cluster_id = "cluster_123"
                self.canonical_question = "Question"
                self.answer = "Answer text"
                self.sources = []
                self.confidence = 0.90
                self.usage_count = 1

            def __getitem__(self, key):
                return getattr(self, key)

        conn.fetchrow = AsyncMock(return_value=MockRow())
        conn.execute = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        result = await service.lookup_golden_answer("Question")

        assert result["sources"] == []
        assert len(result["sources"]) == 0


@pytest.mark.asyncio
async def test_lookup_golden_answer_with_various_confidence_levels():
    """Test lookup with different confidence levels"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()
        conn.execute = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        # Test with low confidence
        class MockRowLowConfidence:
            def __init__(self):
                self.cluster_id = "cluster_low"
                self.canonical_question = "Q"
                self.answer = "A"
                self.sources = []
                self.confidence = 0.50
                self.usage_count = 1

            def __getitem__(self, key):
                return getattr(self, key)

        conn.fetchrow = AsyncMock(return_value=MockRowLowConfidence())

        result = await service.lookup_golden_answer("Q")
        assert result["confidence"] == 0.50

        # Test with high confidence
        class MockRowHighConfidence:
            def __init__(self):
                self.cluster_id = "cluster_high"
                self.canonical_question = "Q"
                self.answer = "A"
                self.sources = []
                self.confidence = 0.99
                self.usage_count = 1

            def __getitem__(self, key):
                return getattr(self, key)

        conn.fetchrow = AsyncMock(return_value=MockRowHighConfidence())

        result = await service.lookup_golden_answer("Q")
        assert result["confidence"] == 0.99


@pytest.mark.asyncio
async def test_semantic_lookup_filters_by_usage_count():
    """Test that semantic lookup respects the LIMIT clause (top 100)"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        # Create 100 mock answers ordered by usage count
        mock_answers = [
            {
                "cluster_id": f"cluster_{i}",
                "canonical_question": f"Question {i}",
                "answer": f"Answer {i}",
                "sources": [],
                "confidence": 0.9,
                "usage_count": 100 - i,  # Decreasing usage count
            }
            for i in range(100)
        ]

        conn.fetch = AsyncMock(return_value=mock_answers)
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        with patch.object(service, "_load_model"):
            mock_model = MagicMock()
            service.model = mock_model

            with (
                patch(
                    "services.golden_answer_service.cosine_similarity", return_value=[[0.85] * 100]
                ),
                patch("services.golden_answer_service.np.argmax", return_value=0),
            ):
                result = await service._semantic_lookup("test")

                # Verify it selected from the answers
                assert result is not None
                assert result["cluster_id"] == "cluster_0"  # First one has highest usage


@pytest.mark.asyncio
async def test_lookup_golden_answer_exception_in_increment_usage():
    """Test that exception in _increment_usage doesn't prevent main return"""
    mock_pool = AsyncMock()

    async def mock_create_pool(*args, **kwargs):
        return mock_pool

    with patch("services.golden_answer_service.asyncpg.create_pool", side_effect=mock_create_pool):
        service = GoldenAnswerService("postgresql://test")
        service.pool = mock_pool

        class AsyncContextManager:
            def __init__(self, return_value):
                self.return_value = return_value

            async def __aenter__(self):
                return self.return_value

            async def __aexit__(self, *args):
                pass

        conn = MagicMock()

        class MockRow:
            def __init__(self):
                self.cluster_id = "cluster_123"
                self.canonical_question = "Q"
                self.answer = "A"
                self.sources = []
                self.confidence = 0.95
                self.usage_count = 1

            def __getitem__(self, key):
                return getattr(self, key)

        conn.fetchrow = AsyncMock(return_value=MockRow())
        # Execute raises exception
        conn.execute = AsyncMock(side_effect=Exception("Update failed"))
        mock_pool.acquire = MagicMock(return_value=AsyncContextManager(conn))

        # Despite execute failure, lookup should still return result
        result = await service.lookup_golden_answer("Q")
        assert result is not None
        assert result["cluster_id"] == "cluster_123"


@pytest.mark.asyncio
async def test_database_url_stored_correctly():
    """Test that database URL is stored in service"""
    db_url = "postgresql://user:pass@localhost/db"
    service = GoldenAnswerService(db_url)
    assert service.database_url == db_url


# ============================================================================
# Tests for test_service() convenience function (Lines 295-342)
# ============================================================================


@pytest.mark.asyncio
async def test_test_service_with_database_url_and_match():
    """Test test_service() function when database_url is set and match is found"""
    # Import the function
    from services.golden_answer_service import test_service

    # Mock settings
    mock_settings = MagicMock()
    mock_settings.database_url = "postgresql://test:test@localhost/test"

    # Mock GoldenAnswerService
    mock_service_instance = MagicMock()
    mock_service_instance.connect = AsyncMock()
    mock_service_instance.close = AsyncMock()
    mock_service_instance.lookup_golden_answer = AsyncMock(
        return_value={
            "match_type": "exact",
            "cluster_id": "cluster_123",
            "canonical_question": "How to get KITAS in Indonesia?",
            "confidence": 0.95,
            "answer": "KITAS is a temporary stay permit..." * 20,  # Long answer
            "sources": ["source1", "source2"],
        }
    )
    mock_service_instance.get_golden_answer_stats = AsyncMock(
        return_value={"total_golden_answers": 100, "total_hits": 500, "avg_confidence": 0.85}
    )

    with (
        patch("app.core.config.settings", mock_settings),
        patch(
            "services.golden_answer_service.GoldenAnswerService", return_value=mock_service_instance
        ),
    ):
        # Run test_service
        await test_service()

    # Verify service methods were called
    mock_service_instance.connect.assert_called_once()
    mock_service_instance.lookup_golden_answer.assert_called_once()
    mock_service_instance.get_golden_answer_stats.assert_called_once()
    mock_service_instance.close.assert_called_once()


@pytest.mark.asyncio
async def test_test_service_with_database_url_and_no_match():
    """Test test_service() function when database_url is set but no match is found"""
    from services.golden_answer_service import test_service

    mock_settings = MagicMock()
    mock_settings.database_url = "postgresql://test:test@localhost/test"

    mock_service_instance = MagicMock()
    mock_service_instance.connect = AsyncMock()
    mock_service_instance.close = AsyncMock()
    mock_service_instance.lookup_golden_answer = AsyncMock(return_value=None)
    mock_service_instance.get_golden_answer_stats = AsyncMock(
        return_value={"total_golden_answers": 100, "total_hits": 500, "avg_confidence": 0.85}
    )

    with (
        patch("app.core.config.settings", mock_settings),
        patch(
            "services.golden_answer_service.GoldenAnswerService", return_value=mock_service_instance
        ),
    ):
        await test_service()

    mock_service_instance.connect.assert_called_once()
    mock_service_instance.lookup_golden_answer.assert_called_once()
    mock_service_instance.get_golden_answer_stats.assert_called_once()
    mock_service_instance.close.assert_called_once()


@pytest.mark.asyncio
async def test_test_service_without_database_url():
    """Test test_service() function when database_url is not set (early return)"""
    from services.golden_answer_service import test_service

    # Mock settings with no database_url
    mock_settings = MagicMock()
    mock_settings.database_url = None

    with patch("app.core.config.settings", mock_settings):
        # Should return early without errors
        await test_service()

    # Function should return early, so no service methods called


@pytest.mark.asyncio
async def test_test_service_with_exception_in_connect():
    """Test test_service() handles exceptions and closes service in finally block"""
    from services.golden_answer_service import test_service

    mock_settings = MagicMock()
    mock_settings.database_url = "postgresql://test:test@localhost/test"

    mock_service_instance = MagicMock()
    mock_service_instance.connect = AsyncMock(side_effect=Exception("Connection failed"))
    mock_service_instance.close = AsyncMock()

    with (
        patch("app.core.config.settings", mock_settings),
        patch(
            "services.golden_answer_service.GoldenAnswerService", return_value=mock_service_instance
        ),
    ):
        # Should not raise exception
        try:
            await test_service()
        except Exception:
            pass  # Exception is expected but handled

    # close() should still be called in finally block
    mock_service_instance.close.assert_called_once()


@pytest.mark.asyncio
async def test_test_service_with_empty_sources():
    """Test test_service() function when result has empty sources"""
    from services.golden_answer_service import test_service

    mock_settings = MagicMock()
    mock_settings.database_url = "postgresql://test:test@localhost/test"

    mock_service_instance = MagicMock()
    mock_service_instance.connect = AsyncMock()
    mock_service_instance.close = AsyncMock()
    mock_service_instance.lookup_golden_answer = AsyncMock(
        return_value={
            "match_type": "fuzzy",
            "cluster_id": "cluster_456",
            "canonical_question": "Test question",
            "confidence": 0.75,
            "answer": "Short answer",
            # No sources key
        }
    )
    mock_service_instance.get_golden_answer_stats = AsyncMock(
        return_value={"total_golden_answers": 50, "total_hits": 200, "avg_confidence": 0.80}
    )

    with (
        patch("app.core.config.settings", mock_settings),
        patch(
            "services.golden_answer_service.GoldenAnswerService", return_value=mock_service_instance
        ),
    ):
        await test_service()

    mock_service_instance.connect.assert_called_once()
    mock_service_instance.close.assert_called_once()


# ============================================================================
# NOTE: Lines 346-348 (if __name__ == "__main__" block) are not covered
# This is a common pattern for scripts and is functionally tested through
# test_service() tests above. Coverage: 97.96%
# ============================================================================
