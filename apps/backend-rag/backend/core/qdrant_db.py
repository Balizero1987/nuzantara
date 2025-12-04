"""
ZANTARA RAG - Vector Database (Qdrant)
Qdrant client wrapper for embeddings storage and retrieval
"""

import logging
from typing import Any

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

    def __init__(self, qdrant_url: str = None, collection_name: str = None):
        """
        Initialize Qdrant client.

        Args:
            qdrant_url: Qdrant server URL (default from env/settings)
            collection_name: Name of collection to use
        """
        # Get Qdrant URL from settings
        self.qdrant_url = qdrant_url or settings.qdrant_url

        self.collection_name = collection_name or "knowledge_base"

        # Remove trailing slash
        self.qdrant_url = self.qdrant_url.rstrip("/")

        logger.info(
            f"Qdrant client initialized: collection='{self.collection_name}', "
            f"url='{self.qdrant_url}'"
        )

    def _convert_filter_to_qdrant_format(
        self, filter_dict: dict[str, Any]
    ) -> dict[str, Any] | None:
        """
        Convert simplified filter format to Qdrant filter format.

        Supports:
        - {"tier": {"$in": ["S", "A"]}} -> must match any of these values
        - {"status_vigensi": {"$ne": "dicabut"}} -> must_not match this value
        - {"status_vigensi": "berlaku"} -> must match this value

        Args:
            filter_dict: Simplified filter dictionary

        Returns:
            Qdrant filter format or None if filter is empty/invalid
        """
        if not filter_dict:
            return None

        must_conditions = []
        must_not_conditions = []

        for key, value in filter_dict.items():
            if isinstance(value, dict):
                # Handle operators like $in, $ne, etc.
                if "$in" in value:
                    # Match any of the values
                    match_values = value["$in"]
                    if match_values:
                        must_conditions.append(
                            {"key": f"metadata.{key}", "match": {"any": match_values}}
                        )
                elif "$ne" in value:
                    # Must NOT match this value
                    must_not_conditions.append(
                        {"key": f"metadata.{key}", "match": {"value": value["$ne"]}}
                    )
                elif "$nin" in value:
                    # Must NOT match any of these values
                    for excluded_value in value["$nin"]:
                        must_not_conditions.append(
                            {"key": f"metadata.{key}", "match": {"value": excluded_value}}
                        )
            else:
                # Direct value match
                must_conditions.append({"key": f"metadata.{key}", "match": {"value": value}})

        result = {}
        if must_conditions:
            result["must"] = must_conditions
        if must_not_conditions:
            result["must_not"] = must_not_conditions

        return result if result else None

    def search(
        self, query_embedding: list[float], filter: dict[str, Any] | None = None, limit: int = 5
    ) -> dict[str, Any]:
        """
        Search for similar documents.

        Args:
            query_embedding: Query embedding vector
            filter: Metadata filter (not implemented yet)
            limit: Maximum number of results

        Returns:
            Dictionary with search results (compatible with Qdrant format)
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}/points/search"

            payload = {"vector": query_embedding, "limit": limit, "with_payload": True}

            # Add filter if provided (Qdrant filter format)
            if filter:
                qdrant_filter = self._convert_filter_to_qdrant_format(filter)
                if qdrant_filter:
                    payload["filter"] = qdrant_filter

            response = requests.post(url, json=payload, timeout=30)

            if response.status_code != 200:
                logger.error(f"Qdrant search failed: {response.status_code} - {response.text}")
                return {
                    "ids": [],
                    "documents": [],
                    "metadatas": [],
                    "distances": [],
                    "total_found": 0,
                }

            results = response.json().get("result", [])

            # Transform Qdrant results to Qdrant-compatible format
            formatted_results = {
                "ids": [str(r["id"]) for r in results],
                "documents": [r["payload"].get("text", "") for r in results],
                "metadatas": [r["payload"].get("metadata", {}) for r in results],
                "distances": [1.0 - r["score"] for r in results],  # Convert similarity to distance
                "total_found": len(results),
            }

            logger.info(
                f"Qdrant search: collection={self.collection_name}, found {len(results)} results"
            )
            return formatted_results

        except Exception as e:
            logger.error(f"Qdrant search error: {e}")
            return {"ids": [], "documents": [], "metadatas": [], "distances": [], "total_found": 0}

    def get_collection_stats(self) -> dict[str, Any]:
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
                    "vector_size": data.get("config", {})
                    .get("params", {})
                    .get("vectors", {})
                    .get("size", 1536),
                    "distance": data.get("config", {})
                    .get("params", {})
                    .get("vectors", {})
                    .get("distance", "Cosine"),
                    "status": data.get("status", "unknown"),
                }
            else:
                logger.error(f"Failed to get collection stats: {response.status_code}")
                return {
                    "collection_name": self.collection_name,
                    "error": f"HTTP {response.status_code}",
                }

        except Exception as e:
            logger.error(f"Error getting Qdrant stats: {e}")
            return {"collection_name": self.collection_name, "error": str(e)}

    def create_collection(self, vector_size: int = 1536, distance: str = "Cosine") -> bool:
        """
        Create a new collection.

        Args:
            vector_size: Size of the vectors (default 1536 for OpenAI)
            distance: Distance metric (Cosine, Euclidean, Dot)

        Returns:
            True if successful
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}"

            payload = {"vectors": {"size": vector_size, "distance": distance}}

            response = requests.put(url, json=payload, timeout=30)

            if response.status_code == 200:
                logger.info(f"Created collection '{self.collection_name}'")
                return True
            else:
                logger.error(
                    f"Failed to create collection: {response.status_code} - {response.text}"
                )
                return False

        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            return False

    def upsert_documents(
        self,
        chunks: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
        ids: list[str] | None = None,
    ) -> dict[str, Any]:
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
                    "payload": {"text": chunks[i], "metadata": metadatas[i]},
                }
                points.append(point)

            # Upsert via REST API
            payload = {"points": points}
            response = requests.put(url, json=payload, params={"wait": "true"}, timeout=60)

            if response.status_code == 200:
                logger.info(
                    f"Upserted {len(chunks)} documents to Qdrant collection '{self.collection_name}'"
                )
                return {
                    "success": True,
                    "documents_added": len(chunks),
                    "collection": self.collection_name,
                }
            else:
                logger.error(f"Qdrant upsert failed: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "collection": self.collection_name,
                }

        except Exception as e:
            logger.error(f"Error upserting to Qdrant: {e}")
            raise

    @property
    def collection(self):
        """
        Property to provide Qdrant-compatible collection interface.
        Returns self for direct method access.
        """
        return self

    def get(self, ids: list[str], include: list[str] | None = None) -> dict[str, Any]:
        """
        Retrieve points by IDs (Qdrant-compatible interface).

        Args:
            ids: List of point IDs to retrieve
            include: List of fields to include (e.g., ["embeddings", "payload"])

        Returns:
            Dictionary with Qdrant-compatible format
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}/points"

            # Qdrant retrieve endpoint
            payload = {"ids": ids}
            if include:
                # Map Qdrant include to Qdrant with_payload/with_vectors
                with_payload = "payload" in include or "metadatas" in include
                with_vectors = "embeddings" in include
                params = {}
                if with_payload:
                    params["with_payload"] = True
                if with_vectors:
                    params["with_vectors"] = True
            else:
                params = {"with_payload": True, "with_vectors": True}

            response = requests.post(url, json=payload, params=params, timeout=30)

            if response.status_code != 200:
                logger.error(f"Qdrant get failed: {response.status_code} - {response.text}")
                return {"ids": [], "embeddings": [], "documents": [], "metadatas": []}

            results = response.json().get("result", [])

            # Transform to Qdrant format
            formatted = {"ids": [], "embeddings": [], "documents": [], "metadatas": []}

            for point in results:
                formatted["ids"].append(str(point["id"]))
                if "vector" in point:
                    formatted["embeddings"].append(point["vector"])
                else:
                    formatted["embeddings"].append(None)

                payload_data = point.get("payload", {})
                formatted["documents"].append(payload_data.get("text", ""))
                formatted["metadatas"].append(payload_data.get("metadata", {}))

            return formatted

        except Exception as e:
            logger.error(f"Qdrant get error: {e}")
            return {"ids": [], "embeddings": [], "documents": [], "metadatas": []}

    def delete(self, ids: list[str]) -> dict[str, Any]:
        """
        Delete points by IDs (Qdrant-compatible interface).

        Args:
            ids: List of point IDs to delete

        Returns:
            Dictionary with operation results
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}/points/delete"

            payload = {"points": ids}
            response = requests.post(url, json=payload, params={"wait": "true"}, timeout=30)

            if response.status_code == 200:
                logger.info(
                    f"Deleted {len(ids)} points from Qdrant collection '{self.collection_name}'"
                )
                return {"success": True, "deleted_count": len(ids)}
            else:
                logger.error(f"Qdrant delete failed: {response.status_code} - {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}"}

        except Exception as e:
            logger.error(f"Error deleting from Qdrant: {e}")
            raise

    def peek(self, limit: int = 10) -> dict[str, Any]:
        """
        Peek at points in the collection (Qdrant-compatible interface).

        Args:
            limit: Maximum number of points to return

        Returns:
            Dictionary with sample points in Qdrant format
        """
        try:
            url = f"{self.qdrant_url}/collections/{self.collection_name}/points/scroll"

            payload = {"limit": limit, "with_payload": True, "with_vectors": False}
            response = requests.post(url, json=payload, timeout=10)

            if response.status_code == 200:
                data = response.json().get("result", {})
                points = data.get("points", [])

                # Transform to Qdrant format
                formatted = {
                    "ids": [str(p["id"]) for p in points],
                    "documents": [p.get("payload", {}).get("text", "") for p in points],
                    "metadatas": [p.get("payload", {}).get("metadata", {}) for p in points],
                }

                return formatted
            else:
                logger.error(f"Qdrant peek failed: {response.status_code}")
                return {"ids": [], "documents": [], "metadatas": []}

        except Exception as e:
            logger.error(f"Error peeking Qdrant collection: {e}")
            return {"ids": [], "documents": [], "metadatas": []}
