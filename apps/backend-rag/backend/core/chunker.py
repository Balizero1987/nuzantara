"""
ZANTARA RAG - Text Chunking
Semantic text splitting for optimal RAG performance
"""

from typing import List, Dict, Any
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from app.config import settings
except ImportError:
    settings = None

logger = logging.getLogger(__name__)


class TextChunker:
    """
    Semantic text chunker using LangChain's RecursiveCharacterTextSplitter.
    Optimized for book content with natural language structure.
    """

    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None,
        max_chunks: int = None
    ):
        """
        Initialize chunker with configuration.

        Args:
            chunk_size: Maximum characters per chunk (default from settings)
            chunk_overlap: Overlap between chunks for context (default from settings)
            max_chunks: Maximum chunks to create per document
        """
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap
        self.max_chunks = max_chunks or settings.max_chunks_per_book

        # Initialize LangChain text splitter
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=[
                "\n\n\n",  # Chapter breaks
                "\n\n",    # Paragraph breaks
                "\n",      # Line breaks
                ". ",      # Sentence breaks
                "! ",      # Exclamation
                "? ",      # Question
                "; ",      # Semicolon
                ", ",      # Comma
                " ",       # Word breaks
                ""         # Character level
            ]
        )

        logger.info(
            f"TextChunker initialized: chunk_size={self.chunk_size}, "
            f"overlap={self.chunk_overlap}, max_chunks={self.max_chunks}"
        )

    def semantic_chunk(
        self,
        text: str,
        metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Split text into semantic chunks with metadata.

        Args:
            text: Full text content to chunk
            metadata: Optional base metadata to attach to each chunk

        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for chunking")
            return []

        try:
            # Split text into chunks
            chunks = self.splitter.split_text(text)

            # Limit number of chunks if needed
            if len(chunks) > self.max_chunks:
                logger.warning(
                    f"Text split into {len(chunks)} chunks, "
                    f"truncating to {self.max_chunks}"
                )
                chunks = chunks[:self.max_chunks]

            # Create chunk objects with metadata
            chunk_objects = []
            for idx, chunk_text in enumerate(chunks):
                chunk_obj = {
                    "text": chunk_text,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "chunk_length": len(chunk_text)
                }

                # Add base metadata if provided
                if metadata:
                    chunk_obj.update(metadata)

                chunk_objects.append(chunk_obj)

            logger.info(
                f"Created {len(chunk_objects)} chunks "
                f"(avg length: {sum(len(c['text']) for c in chunk_objects) // len(chunk_objects)})"
            )

            return chunk_objects

        except Exception as e:
            logger.error(f"Error chunking text: {e}")
            raise


    def chunk_by_pages(
        self,
        text: str,
        page_markers: List[int] = None,
        metadata: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Alternative chunking that respects page boundaries (for PDFs).

        Args:
            text: Full text content
            page_markers: Character positions where pages start
            metadata: Base metadata

        Returns:
            List of chunks with page number tracking
        """
        if not page_markers:
            # Fall back to standard semantic chunking
            return self.semantic_chunk(text, metadata)

        # TODO: Implement page-aware chunking
        # For now, use semantic chunking
        return self.semantic_chunk(text, metadata)


def semantic_chunk(
    text: str,
    max_tokens: int = 500,
    overlap: int = 50
) -> List[str]:
    """
    Convenience function for quick semantic chunking.

    Args:
        text: Text to chunk
        max_tokens: Maximum tokens per chunk (approximated as characters)
        overlap: Overlap between chunks

    Returns:
        List of text chunks
    """
    chunker = TextChunker(chunk_size=max_tokens, chunk_overlap=overlap)
    chunk_objects = chunker.semantic_chunk(text)
    return [chunk["text"] for chunk in chunk_objects]