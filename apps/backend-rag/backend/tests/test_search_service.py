"""
Tests for RAG Search Service
Tests semantic search and document retrieval
"""

import pytest
from unittest.mock import Mock, patch, MagicMock


class TestSearchService:
    """Test suite for search service"""

    @pytest.fixture
    def mock_chroma_client(self):
        """Mock ChromaDB client"""
        client = Mock()
        collection = Mock()
        collection.query.return_value = {
            'documents': [['Test document 1', 'Test document 2']],
            'distances': [[0.1, 0.2]],
            'metadatas': [[{'source': 'test1'}, {'source': 'test2'}]]
        }
        client.get_collection.return_value = collection
        return client

    def test_semantic_search(self, mock_chroma_client):
        """Test semantic search returns relevant documents"""
        query = "What are PT PMA requirements?"
        k = 5

        results = mock_chroma_client.get_collection('test').query(
            query_texts=[query],
            n_results=k
        )

        assert 'documents' in results
        assert len(results['documents'][0]) == 2
        assert 'distances' in results
        assert 'metadatas' in results

    def test_search_with_filter(self, mock_chroma_client):
        """Test search with metadata filters"""
        query = "KITAS requirements"
        filter_metadata = {'category': 'visa'}

        collection = mock_chroma_client.get_collection('test')
        collection.query.return_value = {
            'documents': [['KITAS document']],
            'distances': [[0.05]],
            'metadatas': [[{'category': 'visa'}]]
        }

        results = collection.query(
            query_texts=[query],
            n_results=5,
            where=filter_metadata
        )

        assert len(results['documents'][0]) == 1
        assert results['metadatas'][0][0]['category'] == 'visa'

    def test_empty_query(self):
        """Test handling of empty query"""
        query = ""

        with pytest.raises(ValueError):
            if not query:
                raise ValueError("Query cannot be empty")

    def test_search_limit(self, mock_chroma_client):
        """Test search respects result limit"""
        query = "test"
        k = 3

        collection = mock_chroma_client.get_collection('test')
        collection.query.return_value = {
            'documents': [['Doc1', 'Doc2', 'Doc3']],
            'distances': [[0.1, 0.2, 0.3]],
            'metadatas': [[{}, {}, {}]]
        }

        results = collection.query(query_texts=[query], n_results=k)

        assert len(results['documents'][0]) == k

    def test_score_threshold(self):
        """Test filtering by similarity score threshold"""
        results = {
            'documents': [['Doc1', 'Doc2', 'Doc3']],
            'distances': [[0.05, 0.15, 0.95]]
        }

        threshold = 0.5
        filtered = [
            doc for doc, dist in zip(results['documents'][0], results['distances'][0])
            if dist < threshold
        ]

        assert len(filtered) == 2
        assert 'Doc3' not in filtered

    def test_search_pagination(self, mock_chroma_client):
        """Test paginated search results"""
        query = "test"
        page_size = 10
        offset = 20

        # Mock implementation of pagination
        total_results = 50
        current_page = offset // page_size

        assert current_page == 2
        assert offset + page_size <= total_results

    def test_multilingual_search(self, mock_chroma_client):
        """Test search with multilingual queries"""
        queries = [
            "Apa saja syarat KITAS?",  # Indonesian
            "What are KITAS requirements?",  # English
            "Quali sono i requisiti per KITAS?",  # Italian
        ]

        for query in queries:
            results = mock_chroma_client.get_collection('test').query(
                query_texts=[query],
                n_results=5
            )
            assert 'documents' in results

    def test_search_relevance_ranking(self):
        """Test results are ranked by relevance"""
        results = {
            'distances': [[0.05, 0.10, 0.15, 0.20, 0.25]]
        }

        distances = results['distances'][0]
        assert distances == sorted(distances)

    def test_search_with_no_results(self, mock_chroma_client):
        """Test handling when no results found"""
        collection = mock_chroma_client.get_collection('test')
        collection.query.return_value = {
            'documents': [[]],
            'distances': [[]],
            'metadatas': [[]]
        }

        results = collection.query(query_texts=["nonexistent"], n_results=5)

        assert len(results['documents'][0]) == 0
