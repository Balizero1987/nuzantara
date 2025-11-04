"""
ZANTARA RAG - Embeddings Generation
Supports both OpenAI and Sentence Transformers
"""

from typing import List
import logging

logger = logging.getLogger(__name__)

# Import settings - try both absolute paths
try:
    from app.config import settings
except ImportError:
    try:
        import sys
        from pathlib import Path
        # Add parent dir to path for imports
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from app.config import settings
    except ImportError:
        # Fallback if config not available
        settings = None


class EmbeddingsGenerator:
    """
    Generate embeddings using OpenAI's text-embedding-3-small model.
    Optimized for semantic search and RAG applications.
    """

    def __init__(self, api_key: str = None, model: str = None):
        """
        Initialize embeddings generator.
        Automatically chooses provider based on settings.

        Args:
            api_key: OpenAI API key (only needed if using OpenAI)
            model: Embedding model name (default from settings)
        """
        # OpenAI-only configuration (sentence-transformers removed for deployment size)
        from openai import OpenAI

        # Use settings if available, otherwise fallback to defaults
        if settings:
            self.provider = "openai"
            self.model = model or settings.embedding_model
            self.dimensions = settings.embedding_dimensions
        else:
            # Defaults when settings unavailable
            self.provider = "openai"
            self.model = model or "text-embedding-3-small"
            self.dimensions = 1536

        self.api_key = api_key or (settings.openai_api_key if settings else None)

        if not self.api_key:
            raise ValueError("OpenAI API key is required")

        self.client = OpenAI(api_key=self.api_key)
        logger.info(f"EmbeddingsGenerator initialized with OpenAI: {self.model}")

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors (each vector is a list of floats)

        Raises:
            Exception: If API call fails
        """
        if not texts:
            logger.warning("Empty text list provided for embedding")
            return []

        try:
            logger.info(f"Generating embeddings for {len(texts)} texts using OpenAI")

            # Call OpenAI API
            response = self.client.embeddings.create(
                model=self.model,
                input=texts,
                dimensions=self.dimensions
            )

            embeddings = [item.embedding for item in response.data]

            logger.info(f"Successfully generated {len(embeddings)} embeddings")
            return embeddings

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    def generate_single_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text string to embed

        Returns:
            Embedding vector as list of floats
        """
        embeddings = self.generate_embeddings([text])
        return embeddings[0] if embeddings else []

    def generate_query_embedding(self, query: str) -> List[float]:
        """
        Generate embedding optimized for query/search.

        Args:
            query: Search query text

        Returns:
            Query embedding vector
        """
        # For text-embedding-3-small, same process as document embedding
        return self.generate_single_embedding(query)

    def get_model_info(self) -> dict:
        """
        Get information about the embedding model.

        Returns:
            Dictionary with model configuration
        """
        return {
            "model": self.model,
            "dimensions": self.dimensions,
            "provider": "openai",
            "cost": "Paid (OpenAI API)"
        }


# Convenience function
def generate_embeddings(texts: List[str], api_key: str = None) -> List[List[float]]:
    """
    Quick function to generate embeddings without instantiating class.

    Args:
        texts: List of texts to embed
        api_key: Optional OpenAI API key

    Returns:
        List of embedding vectors
    """
    generator = EmbeddingsGenerator(api_key=api_key)
    return generator.generate_embeddings(texts)