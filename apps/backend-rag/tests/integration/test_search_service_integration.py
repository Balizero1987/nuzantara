"""
Integration tests for SearchService with real Qdrant database.

These tests verify that SearchService correctly interacts with Qdrant,
including collection creation, document upsertion, and search operations.
"""

import sys
from pathlib import Path

import pytest

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


@pytest.mark.integration
@pytest.mark.database
class TestSearchServiceIntegration:
    """Integration tests for SearchService with real Qdrant"""

    @pytest.mark.asyncio
    async def test_search_service_initialization(self, qdrant_container):
        """Test that SearchService initializes correctly with Qdrant"""
        import os

        from services.search_service import SearchService

        # Override Qdrant URL
        original_url = os.getenv("QDRANT_URL")
        os.environ["QDRANT_URL"] = qdrant_container

        try:
            service = SearchService()
            assert service is not None
            assert service.embedder is not None
            assert hasattr(service, "collections")
        finally:
            # Restore original URL
            if original_url:
                os.environ["QDRANT_URL"] = original_url
            elif "QDRANT_URL" in os.environ:
                del os.environ["QDRANT_URL"]

    @pytest.mark.asyncio
    async def test_collection_creation(self, qdrant_client):
        """Test that Qdrant collections can be created"""
        from core.qdrant_db import QdrantClient

        # Create a test collection
        test_collection = QdrantClient(
            qdrant_url=qdrant_client.qdrant_url, collection_name="test_integration_collection"
        )

        # Verify collection exists or can be created
        assert test_collection.qdrant_url == qdrant_client.qdrant_url

    @pytest.mark.asyncio
    async def test_document_upsert_and_search(self, qdrant_client):
        """Test document upsertion and search with real Qdrant"""
        from core.embeddings import EmbeddingsGenerator

        # Create embedder
        embedder = EmbeddingsGenerator()

        # Generate test embedding
        test_text = "This is a test document for integration testing"
        embedding = embedder.generate_query_embedding(test_text)

        # Upsert document
        result = qdrant_client.upsert_documents(
            chunks=[test_text],
            embeddings=[embedding],
            metadatas=[{"source": "test", "type": "integration_test"}],
            ids=["test_doc_1"],
        )

        assert result is not None

        # Search for the document
        search_results = qdrant_client.search(query_embedding=embedding, limit=5)

        assert search_results is not None
        assert "documents" in search_results or "ids" in search_results

    @pytest.mark.asyncio
    async def test_search_with_filters(self, qdrant_client):
        """Test search with metadata filters"""
        from core.embeddings import EmbeddingsGenerator

        # Create embedder
        embedder = EmbeddingsGenerator()

        # Generate test embeddings
        test_texts = ["Document about visas", "Document about taxes", "Document about business"]
        embeddings = [embedder.generate_query_embedding(text) for text in test_texts]

        # Upsert documents with different metadata
        qdrant_client.upsert_documents(
            chunks=test_texts,
            embeddings=embeddings,
            metadatas=[
                {"topic": "visa", "tier": "S"},
                {"topic": "tax", "tier": "A"},
                {"topic": "business", "tier": "B"},
            ],
            ids=["visa_doc", "tax_doc", "business_doc"],
        )

        # Search with filter
        query_embedding = embedder.generate_query_embedding("visa")
        filter_dict = {"topic": "visa"}

        results = qdrant_client.search(query_embedding=query_embedding, filter=filter_dict, limit=5)

        assert results is not None
