"""
ZANTARA RAG - Ingestion Service
Book processing pipeline: parse → chunk → embed → store
"""

import logging
from pathlib import Path
from typing import Any

from core.chunker import TextChunker
from core.embeddings import EmbeddingsGenerator
from core.parsers import auto_detect_and_parse, get_document_info
from core.qdrant_db import QdrantClient
from utils.tier_classifier import TierClassifier

from app.models import TierLevel

logger = logging.getLogger(__name__)


class IngestionService:
    """
    Complete book ingestion pipeline.
    Handles the full flow from raw document to searchable embeddings.
    """

    def __init__(self):
        """Initialize ingestion service with all components"""
        self.chunker = TextChunker()
        self.embedder = EmbeddingsGenerator()
        self.vector_db = QdrantClient()
        self.classifier = TierClassifier()

        logger.info("IngestionService initialized")

    async def ingest_book(
        self,
        file_path: str,
        title: str | None = None,
        author: str | None = None,
        language: str = "en",
        tier_override: TierLevel | None = None,
    ) -> dict[str, Any]:
        """
        Ingest a single book through the complete pipeline.

        Args:
            file_path: Path to book file (PDF or EPUB)
            title: Book title (auto-detected if not provided)
            author: Book author (auto-detected if not provided)
            language: Book language code
            tier_override: Manual tier classification (optional)

        Returns:
            Dictionary with ingestion results
        """
        try:
            logger.info(f"Starting ingestion for: {file_path}")

            # Step 1: Extract document info
            doc_info = get_document_info(file_path)
            book_title = title or doc_info.get("title", Path(file_path).stem)
            book_author = author or doc_info.get("author", "Unknown")

            logger.info(f"Book: {book_title} by {book_author}")

            # Step 2: Parse document
            text = auto_detect_and_parse(file_path)
            logger.info(f"Extracted {len(text)} characters")

            # Step 3: Classify tier
            if tier_override:
                tier = tier_override
                logger.info(f"Using manual tier override: {tier.value}")
            else:
                # Use first 2000 chars as content sample for classification
                content_sample = text[:2000]
                tier = self.classifier.classify_book_tier(book_title, book_author, content_sample)

            min_level = self.classifier.get_min_access_level(tier)

            # Step 4: Chunk text
            base_metadata = {
                "book_title": book_title,
                "book_author": book_author,
                "tier": tier.value,
                "min_level": min_level,
                "language": language,
                "file_path": file_path,
            }

            chunks = self.chunker.semantic_chunk(text, metadata=base_metadata)
            logger.info(f"Created {len(chunks)} chunks")

            # Step 5: Generate embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.embedder.generate_embeddings(chunk_texts)
            logger.info(f"Generated {len(embeddings)} embeddings")

            # Step 6: Prepare metadata for each chunk
            metadatas = []
            for chunk in chunks:
                meta = {
                    "book_title": book_title,
                    "book_author": book_author,
                    "tier": tier.value,
                    "min_level": min_level,
                    "chunk_index": chunk["chunk_index"],
                    "total_chunks": chunk["total_chunks"],
                    "language": language,
                    "file_path": file_path,
                }
                metadatas.append(meta)

            # Step 7: Store in vector database
            result = self.vector_db.upsert_documents(
                chunks=chunk_texts, embeddings=embeddings, metadatas=metadatas
            )

            logger.info(f"✅ Successfully ingested: {book_title}")

            return {
                "success": True,
                "book_title": book_title,
                "book_author": book_author,
                "tier": tier.value,
                "chunks_created": len(chunks),
                "message": f"Successfully ingested {book_title}",
                "error": None,
            }

        except Exception as e:
            logger.error(f"❌ Error ingesting {file_path}: {e}")
            return {
                "success": False,
                "book_title": title or Path(file_path).stem,
                "book_author": author or "Unknown",
                "tier": "Unknown",
                "chunks_created": 0,
                "message": "Failed to ingest book",
                "error": str(e),
            }
