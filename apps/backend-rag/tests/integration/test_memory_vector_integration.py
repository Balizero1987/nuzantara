"""
Integration tests for Memory Vector Router with real Qdrant database.

These tests verify the complete workflow of memory vector operations
with a real Qdrant instance.
"""

import sys
from pathlib import Path

import pytest

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


@pytest.mark.integration
@pytest.mark.database
@pytest.mark.slow
class TestMemoryVectorIntegration:
    """Integration tests for Memory Vector Router with real Qdrant"""

    @pytest.mark.asyncio
    async def test_memory_workflow_complete(self, qdrant_client):
        """Test complete workflow: init -> embed -> store -> search -> delete"""
        from unittest.mock import patch

        from fastapi.testclient import TestClient

        from app.main_cloud import app

        # Mock dependencies
        with patch("app.routers.memory_vector.settings") as mock_settings:
            mock_settings.qdrant_url = qdrant_client.qdrant_url

            with TestClient(app) as client:
                # 1. Initialize
                init_response = client.post("/api/memory/init", json={})
                assert init_response.status_code == 200

                # 2. Generate embedding
                embed_response = client.post("/api/memory/embed", json={"text": "Test memory"})
                assert embed_response.status_code == 200
                embedding = embed_response.json()["embedding"]
                assert len(embedding) > 0

                # 3. Store memory
                store_response = client.post(
                    "/api/memory/store",
                    json={
                        "id": "mem_test_integration",
                        "document": "Test memory for integration",
                        "embedding": embedding,
                        "metadata": {"userId": "test_user_integration"},
                    },
                )
                assert store_response.status_code == 200

                # 4. Search memories
                search_response = client.post(
                    "/api/memory/search",
                    json={"query_embedding": embedding, "limit": 10},
                )
                assert search_response.status_code == 200
                search_data = search_response.json()
                assert "results" in search_data or "ids" in search_data

                # 5. Delete memory
                delete_response = client.delete("/api/memory/mem_test_integration")
                assert delete_response.status_code == 200
