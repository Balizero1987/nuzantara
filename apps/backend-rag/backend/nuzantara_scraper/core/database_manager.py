"""
Unified database management for ChromaDB and PostgreSQL
Provides consistent interface across all scrapers
"""

import chromadb
from chromadb.config import Settings
import psycopg2
from psycopg2.extras import Json
from pathlib import Path
from typing import List, Dict, Any, Optional
from loguru import logger

from ..models.scraped_content import ScrapedContent


class DatabaseManager:
    """Manages database connections and operations"""

    def __init__(
        self,
        chromadb_path: str,
        postgres_url: Optional[str] = None,
        collections_prefix: str = "nuzantara"
    ):
        """
        Initialize database manager

        Args:
            chromadb_path: Path to ChromaDB persistent storage
            postgres_url: PostgreSQL connection string (optional)
            collections_prefix: Prefix for collection names
        """
        self.chromadb_path = Path(chromadb_path)
        self.chromadb_path.mkdir(parents=True, exist_ok=True)
        self.collections_prefix = collections_prefix

        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=str(self.chromadb_path),
            settings=Settings(anonymized_telemetry=False)
        )

        # Initialize PostgreSQL (optional)
        self.pg_conn = None
        self.pg_cursor = None
        if postgres_url:
            try:
                self.pg_conn = psycopg2.connect(postgres_url)
                self.pg_cursor = self.pg_conn.cursor()
                logger.info("PostgreSQL connection established")
            except Exception as e:
                logger.warning(f"PostgreSQL connection failed: {e}")

        # Cache for collections
        self._collections_cache: Dict[str, Any] = {}

    def get_collection(self, collection_name: str, create_if_missing: bool = True):
        """
        Get or create ChromaDB collection

        Args:
            collection_name: Name of collection
            create_if_missing: Create collection if it doesn't exist

        Returns:
            ChromaDB collection object
        """
        full_name = f"{self.collections_prefix}_{collection_name}"

        if full_name in self._collections_cache:
            return self._collections_cache[full_name]

        try:
            if create_if_missing:
                collection = self.chroma_client.get_or_create_collection(full_name)
            else:
                collection = self.chroma_client.get_collection(full_name)

            self._collections_cache[full_name] = collection
            return collection

        except Exception as e:
            logger.error(f"Error getting collection {full_name}: {e}")
            raise

    def save_to_chromadb(
        self,
        collection_name: str,
        content: ScrapedContent,
        custom_document: Optional[str] = None
    ) -> bool:
        """
        Save content to ChromaDB

        Args:
            collection_name: Name of collection
            content: ScrapedContent object
            custom_document: Custom document text (if not provided, uses content.content)

        Returns:
            Success status
        """
        try:
            collection = self.get_collection(collection_name)

            document = custom_document or content.content
            metadata = {
                "title": content.title[:500] if content.title else "",  # Limit length
                "url": str(content.url),
                "source": content.source_name,
                "tier": content.source_tier.value,
                "category": content.category.value,
                "scraped_at": content.scraped_at.isoformat(),
                "word_count": content.word_count,
                "quality_score": content.quality_score,
            }

            # Add AI analysis if available
            if content.ai_summary:
                metadata["ai_summary"] = content.ai_summary[:500]

            # Add custom extracted data (flatten dict)
            for key, value in content.extracted_data.items():
                if isinstance(value, (str, int, float, bool)):
                    metadata[f"ext_{key}"] = value

            collection.add(
                documents=[document],
                ids=[content.content_id],
                metadatas=[metadata]
            )

            logger.debug(f"Saved to ChromaDB: {content.content_id}")
            return True

        except Exception as e:
            logger.error(f"Error saving to ChromaDB: {e}")
            return False

    def save_to_postgres(
        self,
        table_name: str,
        data: Dict[str, Any]
    ) -> bool:
        """
        Save data to PostgreSQL

        Args:
            table_name: Name of table
            data: Data dictionary

        Returns:
            Success status
        """
        if not self.pg_conn or not self.pg_cursor:
            logger.warning("PostgreSQL not available")
            return False

        try:
            # Build INSERT query
            columns = ", ".join(data.keys())
            placeholders = ", ".join(["%s"] * len(data))
            values = tuple(data.values())

            query = f"""
                INSERT INTO {table_name} ({columns})
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
            """

            self.pg_cursor.execute(query, values)
            self.pg_conn.commit()

            logger.debug(f"Saved to PostgreSQL: {table_name}")
            return True

        except Exception as e:
            logger.error(f"Error saving to PostgreSQL: {e}")
            if self.pg_conn:
                self.pg_conn.rollback()
            return False

    def search_chromadb(
        self,
        collection_name: str,
        query: str,
        n_results: int = 10,
        where: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Semantic search in ChromaDB

        Args:
            collection_name: Name of collection
            query: Search query
            n_results: Number of results
            where: Filter conditions

        Returns:
            List of search results
        """
        try:
            collection = self.get_collection(collection_name, create_if_missing=False)

            kwargs = {
                "query_texts": [query],
                "n_results": n_results
            }
            if where:
                kwargs["where"] = where

            results = collection.query(**kwargs)

            output = []
            for i, doc in enumerate(results['documents'][0]):
                output.append({
                    "document": doc,
                    "metadata": results['metadatas'][0][i],
                    "distance": results['distances'][0][i],
                    "id": results['ids'][0][i]
                })

            return output

        except Exception as e:
            logger.error(f"Search error: {e}")
            return []

    def get_collection_count(self, collection_name: str) -> int:
        """Get number of items in collection"""
        try:
            collection = self.get_collection(collection_name, create_if_missing=False)
            return collection.count()
        except Exception as e:
            logger.error(f"Error getting count: {e}")
            return 0

    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection"""
        try:
            full_name = f"{self.collections_prefix}_{collection_name}"
            self.chroma_client.delete_collection(full_name)
            if full_name in self._collections_cache:
                del self._collections_cache[full_name]
            logger.info(f"Deleted collection: {full_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False

    def close(self):
        """Close database connections"""
        if self.pg_cursor:
            self.pg_cursor.close()
        if self.pg_conn:
            self.pg_conn.close()
        logger.info("Database connections closed")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
