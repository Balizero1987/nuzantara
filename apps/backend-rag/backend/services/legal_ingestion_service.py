"""
Legal Ingestion Service
Specialized ingestion pipeline for Indonesian legal documents
"""

import logging
from pathlib import Path
from typing import Any

from core.embeddings import EmbeddingsGenerator
from core.legal import LegalChunker, LegalCleaner, LegalMetadataExtractor, LegalStructureParser
from core.parsers import auto_detect_and_parse
from core.qdrant_db import QdrantClient
from utils.tier_classifier import TierClassifier

from app.models import TierLevel

logger = logging.getLogger(__name__)


class LegalIngestionService:
    """
    Specialized ingestion service for Indonesian legal documents.
    Implements 4-stage pipeline: Clean → Extract Metadata → Parse Structure → Chunk
    """

    def __init__(self, collection_name: str = "legal_unified"):
        """
        Initialize legal ingestion service.

        Args:
            collection_name: Qdrant collection name for legal documents
        """
        self.cleaner = LegalCleaner()
        self.metadata_extractor = LegalMetadataExtractor()
        self.structure_parser = LegalStructureParser()
        self.chunker = LegalChunker()
        self.embedder = EmbeddingsGenerator()
        self.vector_db = QdrantClient(collection_name=collection_name)
        self.classifier = TierClassifier()

        logger.info(f"LegalIngestionService initialized (collection: {collection_name})")

    async def ingest_legal_document(
        self,
        file_path: str,
        title: str | None = None,
        tier_override: TierLevel | None = None,
        collection_name: str | None = None,
    ) -> dict[str, Any]:
        """
        Ingest a legal document through the complete pipeline.

        Pipeline stages:
        1. Parse: Extract text from PDF/HTML
        2. Clean: Remove headers/footers/noise
        3. Extract Metadata: Type, number, year, topic
        4. Parse Structure: BAB, Pasal, Ayat hierarchy
        5. Chunk: Pasal-aware chunking with context injection
        6. Embed: Generate embeddings
        7. Store: Upsert to Qdrant

        Args:
            file_path: Path to legal document file
            title: Document title (auto-extracted if not provided)
            tier_override: Manual tier classification (optional)
            collection_name: Override collection name (optional)

        Returns:
            Dictionary with ingestion results
        """
        try:
            logger.info(f"Starting legal document ingestion: {file_path}")

            # Override collection if specified
            if collection_name:
                self.vector_db = QdrantClient(collection_name=collection_name)

            # STAGE 1: Parse document
            raw_text = auto_detect_and_parse(file_path)
            logger.info(f"Extracted {len(raw_text)} characters from document")

            # STAGE 2: Clean (The Washer)
            cleaned_text = self.cleaner.clean(raw_text)
            logger.info(f"Cleaned text: {len(cleaned_text)} characters")

            # STAGE 3: Extract Metadata (The Librarian)
            metadata = self.metadata_extractor.extract(cleaned_text)

            # HYBRID EXTRACTION: Fallback to Vertex AI if Pattern Extraction fails
            if not metadata or metadata.get("type") == "UNKNOWN":
                logger.info(
                    "Pattern extraction failed/incomplete. Attempting Vertex AI fallback..."
                )
                try:
                    from services.vertex_ai_service import VertexAIService

                    vertex_service = VertexAIService()
                    ai_metadata = await vertex_service.extract_metadata(cleaned_text)

                    if ai_metadata:
                        logger.info(
                            f"Vertex AI extraction successful: {ai_metadata.get('type_abbrev')} {ai_metadata.get('number')}"
                        )
                        # Merge AI metadata, preferring AI results for missing fields
                        if not metadata:
                            metadata = ai_metadata
                        else:
                            metadata.update({k: v for k, v in ai_metadata.items() if v})
                except Exception as e:
                    logger.warning(f"Vertex AI fallback failed: {e}")

            if not metadata:
                logger.warning("Could not extract metadata (Pattern + AI failed), using defaults")
                metadata = {
                    "type": "UNKNOWN",
                    "type_abbrev": "UNKNOWN",
                    "number": "UNKNOWN",
                    "year": "UNKNOWN",
                    "topic": title or Path(file_path).stem,
                    "status": None,
                    "full_title": title or Path(file_path).stem,
                }

            # Use extracted title if not provided
            document_title = title or metadata.get("full_title", Path(file_path).stem)

            # STAGE 4: Parse Structure (The Architect)
            structure = self.structure_parser.parse(cleaned_text)
            logger.info(
                f"Parsed structure: {len(structure.get('batang_tubuh', []))} BAB, "
                f"{len(structure.get('pasal_list', []))} Pasal"
            )

            # STAGE 5: Classify tier
            if tier_override:
                tier = tier_override
                logger.info(f"Using manual tier override: {tier.value}")
            else:
                # Use first 2000 chars for classification
                content_sample = cleaned_text[:2000]
                tier = self.classifier.classify_book_tier(
                    document_title, "Pemerintah Indonesia", content_sample
                )

            min_level = self.classifier.get_min_access_level(tier)

            # STAGE 6: Chunk with Context (The Butcher)
            base_metadata = {
                "book_title": document_title,
                "book_author": "Pemerintah Indonesia",
                "tier": tier.value,
                "min_level": min_level,
                "language": "id",  # Indonesian
                "file_path": file_path,
                "doc_type": "legal",
                # Legal-specific metadata
                "legal_type": metadata.get("type_abbrev"),
                "legal_number": metadata.get("number"),
                "legal_year": metadata.get("year"),
                "legal_topic": metadata.get("topic"),
                "legal_status": metadata.get("status"),
            }

            chunks = self.chunker.chunk(cleaned_text, metadata, structure)
            logger.info(f"Created {len(chunks)} legal chunks (Pasal-aware)")

            if not chunks:
                logger.warning("No chunks created from document")
                return {
                    "success": False,
                    "book_title": document_title,
                    "chunks_created": 0,
                    "message": "No chunks created",
                    "error": "Chunking produced no results",
                }

            # STAGE 7: Generate embeddings
            chunk_texts = [chunk["text"] for chunk in chunks]
            embeddings = self.embedder.generate_embeddings(chunk_texts)
            logger.info(f"Generated {len(embeddings)} embeddings")

            # STAGE 8: Prepare metadata for each chunk
            metadatas = []
            for chunk in chunks:
                meta = {
                    "book_title": document_title,
                    "book_author": "Pemerintah Indonesia",
                    "tier": tier.value,
                    "min_level": min_level,
                    "chunk_index": chunk.get("chunk_index", 0),
                    "total_chunks": chunk.get("total_chunks", len(chunks)),
                    "language": "id",
                    "file_path": file_path,
                    "doc_type": "legal",
                    # Legal-specific metadata
                    "legal_type": metadata.get("type_abbrev"),
                    "legal_number": metadata.get("number"),
                    "legal_year": metadata.get("year"),
                    "legal_topic": metadata.get("topic"),
                    "legal_status": metadata.get("status"),
                    "has_context": chunk.get("has_context", False),
                }

                # Add Pasal number if available
                if chunk.get("pasal_number"):
                    meta["pasal_number"] = chunk["pasal_number"]

                metadatas.append(meta)

            # STAGE 9: Store in vector database
            self.vector_db.upsert_documents(
                chunks=chunk_texts, embeddings=embeddings, metadatas=metadatas
            )

            logger.info(f"✅ Successfully ingested legal document: {document_title}")

            return {
                "success": True,
                "book_title": document_title,
                "book_author": "Pemerintah Indonesia",
                "tier": tier.value,
                "chunks_created": len(chunks),
                "legal_metadata": metadata,
                "structure": {
                    "bab_count": len(structure.get("batang_tubuh", [])),
                    "pasal_count": len(structure.get("pasal_list", [])),
                },
                "message": f"Successfully ingested {document_title}",
                "error": None,
            }

        except Exception as e:
            logger.error(f"❌ Error ingesting legal document {file_path}: {e}", exc_info=True)
            return {
                "success": False,
                "book_title": title or Path(file_path).stem,
                "book_author": "Pemerintah Indonesia",
                "tier": "Unknown",
                "chunks_created": 0,
                "message": "Failed to ingest legal document",
                "error": str(e),
            }

    def detect_legal_document(self, text: str) -> bool:
        """
        Detect if text appears to be an Indonesian legal document.

        Args:
            text: Text to check

        Returns:
            True if text appears to be a legal document
        """
        return self.metadata_extractor.is_legal_document(text)
