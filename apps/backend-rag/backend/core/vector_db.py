"""
ZANTARA RAG - Vector Database (Chroma)
ChromaDB client wrapper for book embeddings storage and retrieval
"""

from typing import List, Dict, Any, Optional
import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
import os

try:
    from app.config import settings
except ImportError:
    settings = None

logger = logging.getLogger(__name__)


class ChromaDBClient:
    """
    Wrapper around ChromaDB for ZANTARA book embeddings.
    Handles storage, retrieval, and filtering of book chunks.
    """

    def __init__(
        self,
        persist_directory: str = None,
        collection_name: str = None
    ):
        """
        Initialize ChromaDB client.

        Args:
            persist_directory: Directory to persist database (default from settings)
            collection_name: Name of collection to use (default from settings)
        """
        # Handle case where settings is None (import failed)
        if settings:
            # Prefer explicit argument, then env var provided by app startup, then settings
            env_dir = os.environ.get("CHROMA_DB_PATH")
            self.persist_directory = persist_directory or env_dir or settings.chroma_persist_dir
            self.collection_name = collection_name or settings.chroma_collection_name
        else:
            # FIX 2025-11-10: Use production path as fallback to avoid ChromaDB instance conflicts
            self.persist_directory = persist_directory or os.environ.get("CHROMA_DB_PATH", "/data/chroma_db_FULL_deploy")
            self.collection_name = collection_name or "zantara_books"

        # Initialize Chroma client with persistence
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Get or create collection
        # First, try to get existing collection to preserve its metadata (including dimensions)
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            logger.info(
                f"ChromaDB connected to existing collection: '{self.collection_name}' "
                f"(metadata: {self.collection.metadata})"
            )
        except Exception:
            # Collection doesn't exist, create with default metadata
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "ZANTARA Knowledge Base"}
            )
            logger.info(
                f"ChromaDB created new collection: '{self.collection_name}', "
                f"persist_dir='{self.persist_directory}'"
            )

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
            # Generate IDs if not provided
            if not ids:
                ids = [
                    f"{metadatas[i].get('book_title', 'unknown')}_{i}"
                    for i in range(len(chunks))
                ]

            logger.info(f"Upserting {len(chunks)} documents to collection")

            # Upsert to Chroma
            self.collection.upsert(
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )

            logger.info("Documents upserted successfully")

            return {
                "success": True,
                "documents_added": len(chunks),
                "collection": self.collection_name
            }

        except Exception as e:
            logger.error(f"Error upserting documents: {e}")
            raise

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
            filter: Metadata filter (e.g., {"tier": "S"})
            limit: Maximum number of results

        Returns:
            Dictionary with search results
        """
        try:
            logger.info(f"Searching with limit={limit}, filter={filter}")

            results = self.collection.query(
                query_embeddings=[query_embedding],
                where=filter,
                n_results=limit,
                include=["documents", "metadatas", "distances"]
            )

            # Transform results - safe handling of None/empty results
            formatted_results = {
                "ids": results.get("ids", [[]])[0] if results.get("ids") and len(results["ids"]) > 0 else [],
                "documents": results.get("documents", [[]])[0] if results.get("documents") and len(results["documents"]) > 0 else [],
                "metadatas": results.get("metadatas", [[]])[0] if results.get("metadatas") and len(results["metadatas"]) > 0 else [],
                "distances": results.get("distances", [[]])[0] if results.get("distances") and len(results["distances"]) > 0 else [],
                "total_found": len(results.get("ids", [[]])[0]) if results.get("ids") and len(results["ids"]) > 0 else 0
            }

            logger.info(f"Found {formatted_results['total_found']} results")
            return formatted_results

        except Exception as e:
            logger.error(f"Error searching: {e}")
            raise

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the collection.

        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.collection.count()

            # Get sample documents to analyze tiers
            sample = self.collection.peek(limit=1000)
            tiers = {}
            if sample and sample["metadatas"]:
                for meta in sample["metadatas"]:
                    tier = meta.get("tier", "unknown")
                    tiers[tier] = tiers.get(tier, 0) + 1

            return {
                "collection_name": self.collection_name,
                "total_documents": count,
                "persist_directory": self.persist_directory,
                "tiers_distribution": tiers
            }

        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {
                "collection_name": self.collection_name,
                "error": str(e)
            }

    def delete_by_book(self, book_title: str) -> Dict[str, Any]:
        """
        Delete all chunks from a specific book.

        Args:
            book_title: Title of book to delete

        Returns:
            Dictionary with deletion results
        """
        try:
            logger.info(f"Deleting all chunks from book: {book_title}")

            # Get all document IDs for this book
            results = self.collection.get(
                where={"book_title": book_title},
                include=[]
            )

            if results and results["ids"]:
                self.collection.delete(ids=results["ids"])
                logger.info(f"Deleted {len(results['ids'])} chunks")

                return {
                    "success": True,
                    "deleted_count": len(results["ids"]),
                    "book_title": book_title
                }
            else:
                logger.warning(f"No chunks found for book: {book_title}")
                return {
                    "success": True,
                    "deleted_count": 0,
                    "book_title": book_title
                }

        except Exception as e:
            logger.error(f"Error deleting book chunks: {e}")
            raise

    def reset_collection(self):
        """
        Delete all documents and reset the collection.
        USE WITH CAUTION!
        """
        logger.warning("RESETTING COLLECTION - ALL DATA WILL BE LOST")
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.create_collection(
            name=self.collection_name,
            metadata={"description": "ZANTARA Books Knowledge Base"}
        )
        logger.info("Collection reset complete")
