"""
ZANTARA RAG - Vector Database (Qdrant)
Qdrant client wrapper for embeddings storage and retrieval
"""

from typing import List, Dict, Any, Optional
import logging
import os
import requests

try:
    from app.config import settings
except ImportError:
    settings = None

logger = logging.getLogger(__name__)


class QdrantClient:
    """
    Wrapper around Qdrant for ZANTARA embeddings.
    Handles storage, retrieval, and filtering via REST API.
    """

    def __init__(
        self,
        qdrant_url: str = None,
        collection_name: str = None
    ):
        """
        Initialize Qdrant client.

        Args:
            qdrant_url: Qdrant server URL (default from env/settings)
            collection_name: Name of collection to use
        """
        # Get Qdrant URL from env or settings
        self.qdrant_url = (
            qdrant_url or
            os.environ.get("QDRANT_URL") or
            (settings.qdrant_url if settings else "https://nuzantara-qdrant.fly.dev")
        )

        self.collection_name = collection_name or "knowledge_base"

        # Remove trailing slash
        self.qdrant_url = self.qdrant_url.rstrip("/")

        logger.info(
            f"Qdrant client initialized: collection='{self.collection_name}', "
            f"url='{self.qdrant_url}'"
        )

    def search(
        self,
        query_embedding: List[float],
        filter: Optional[Dict[str, Any]] = None,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Search for similar documents.

        Args:
            query_embedding: Query embedding vector
            filter: Metadata filter (not implemented yet)
            limit: Maximum number of results

        Returns:
            Dictionary with search results (compatible with ChromaDB format)
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}/points/search"

            payload = {
                "vector": query_embedding,
                "limit": limit,
                "with_payload": True
            }

            # Add filter if provided (Qdrant filter format)
            if filter:
                # Convert ChromaDB filter format to Qdrant format
                # Example: {"tier": {"$in": ["S", "A"]}} -> {"must": [{"key": "tier", "match": {"any": ["S", "A"]}}]}
                # For now, skip complex filter conversion - will be added if needed
                logger.warning(f"Filters not yet implemented in Qdrant client: {filter}")

            response = requests.post(url, json=payload, timeout=30)

            if response.status_code != 200:
                logger.error(f"Qdrant search failed: {response.status_code} - {response.text}")
                return {
                    "ids": [],
                    "documents": [],
                    "metadatas": [],
                    "distances": [],
                    "total_found": 0
                }

            results = response.json().get("result", [])

            # Transform Qdrant results to ChromaDB-compatible format
            formatted_results = {
                "ids": [str(r["id"]) for r in results],
                "documents": [r["payload"].get("text", "") for r in results],
                "metadatas": [r["payload"].get("metadata", {}) for r in results],
                "distances": [1.0 - r["score"] for r in results],  # Convert similarity to distance
                "total_found": len(results)
            }

            logger.info(f"Qdrant search: collection={self.collection_name}, found {len(results)} results")
            return formatted_results

        except Exception as e:
            logger.error(f"Qdrant search error: {e}")
            return {
                "ids": [],
                "documents": [],
                "metadatas": [],
                "distances": [],
                "total_found": 0
            }

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the collection.

        Returns:
            Dictionary with collection statistics
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                data = response.json().get("result", {})
                points_count = data.get("points_count", 0)

                return {
                    "collection_name": self.collection_name,
                    "total_documents": points_count,
                    "vector_size": data.get("config", {}).get("params", {}).get("vectors", {}).get("size", 1536),
                    "distance": data.get("config", {}).get("params", {}).get("vectors", {}).get("distance", "Cosine"),
                    "status": data.get("status", "unknown")
                }
            else:
                logger.error(f"Failed to get collection stats: {response.status_code}")
                return {
                    "collection_name": self.collection_name,
                    "error": f"HTTP {response.status_code}"
                }

        except Exception as e:
            logger.error(f"Error getting Qdrant stats: {e}")
            return {
                "collection_name": self.collection_name,
                "error": str(e)
            }

    def upsert_documents(
        self,
        chunks: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Insert or update documents in the collection.

        Args:
            chunks: List of text chunks
            embeddings: List of embedding vectors
            metadatas: List of metadata dictionaries
            ids: Optional list of document IDs (auto-generated if not provided)

        Returns:
            Dictionary with operation results
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}/points"

            # Generate IDs if not provided
            if not ids:
                import uuid
                ids = [str(uuid.uuid4()) for _ in range(len(chunks))]

            # Build points array
            points = []
            for i in range(len(chunks)):
                point = {
                    "id": ids[i],
                    "vector": embeddings[i],
                    "payload": {
                        "text": chunks[i],
                        "metadata": metadatas[i]
                    }
                }
                points.append(point)

            # Upsert via REST API
            payload = {"points": points}
            response = requests.put(url, json=payload, params={"wait": "true"}, timeout=60)

            if response.status_code == 200:
                logger.info(f"Upserted {len(chunks)} documents to Qdrant collection '{self.collection_name}'")
                return {
                    "success": True,
                    "documents_added": len(chunks),
                    "collection": self.collection_name
                }
            else:
                logger.error(f"Qdrant upsert failed: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "collection": self.collection_name
                }

        except Exception as e:
            logger.error(f"Error upserting to Qdrant: {e}")
            raise
