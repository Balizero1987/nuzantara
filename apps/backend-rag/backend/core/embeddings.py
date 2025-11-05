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
    Generate embeddings using configured provider (OpenAI or Sentence Transformers).
    Automatically chooses provider based on settings.
    """

    def __init__(self, api_key: str = None, model: str = None, provider: str = None):
        """
        Initialize embeddings generator.
        Automatically chooses provider based on settings.

        Args:
            api_key: OpenAI API key (only needed if using OpenAI provider)
            model: Embedding model name (default from settings)
            provider: "openai" or "sentence-transformers" (default from settings)
        """
        # Determine provider from settings or parameter
        if provider:
            self.provider = provider
        elif settings:
            self.provider = settings.embedding_provider
        else:
            # Default to sentence-transformers for local deployment
            self.provider = "sentence-transformers"

        # Load appropriate provider
        if self.provider == "openai":
            self._init_openai(api_key, model)
        else:
            # Default to sentence-transformers (local, no API key needed)
            self._init_sentence_transformers(model)

    def _init_openai(self, api_key: str = None, model: str = None):
        """Initialize OpenAI embeddings provider"""
        from openai import OpenAI

        self.model = model or (settings.embedding_model if settings else "text-embedding-3-small")
        self.dimensions = 1536  # OpenAI text-embedding-3-small is always 1536
        self.api_key = api_key or (settings.openai_api_key if settings else None)

        if not self.api_key:
            raise ValueError("OpenAI API key is required for OpenAI provider")

        self.client = OpenAI(api_key=self.api_key)
        logger.info(f"🔌 [EmbeddingsGenerator] Initialized with OpenAI: {self.model} ({self.dimensions} dims)")

    def _init_sentence_transformers(self, model: str = None):
        """Initialize Sentence Transformers local embeddings provider"""
        from sentence_transformers import SentenceTransformer

        self.model = model or (settings.embedding_model if settings else "sentence-transformers/all-MiniLM-L6-v2")

        logger.info(f"🔌 [EmbeddingsGenerator] Loading Sentence Transformers: {self.model}")
        logger.info("   This may take a moment on first run (downloads model)...")

        try:
            self.transformer = SentenceTransformer(self.model)
            self.dimensions = self.transformer.get_sentence_embedding_dimension()
            logger.info(f"🔌 [EmbeddingsGenerator] Initialized with Sentence Transformers: {self.model} ({self.dimensions} dims)")
        except Exception as e:
            logger.error(f"🔌 [EmbeddingsGenerator] Failed to load Sentence Transformers: {e}")
            raise

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
            if self.provider == "openai":
                return self._generate_embeddings_openai(texts)
            else:
                return self._generate_embeddings_sentence_transformers(texts)

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    def _generate_embeddings_openai(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using OpenAI API"""
        logger.info(f"Generating embeddings for {len(texts)} texts using OpenAI")

        # Call OpenAI API
        response = self.client.embeddings.create(
            model=self.model,
            input=texts,
            dimensions=self.dimensions
        )

        embeddings = [item.embedding for item in response.data]
        logger.info(f"✅ Generated {len(embeddings)} embeddings (OpenAI)")
        return embeddings

    def _generate_embeddings_sentence_transformers(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Sentence Transformers"""
        logger.info(f"Generating embeddings for {len(texts)} texts using Sentence Transformers")

        try:
            embeddings = self.transformer.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=len(texts) > 10
            )

            # Convert numpy array to list of lists
            embeddings_list = embeddings.tolist()
            logger.info(f"✅ Generated {len(embeddings_list)} embeddings (Sentence Transformers)")
            return embeddings_list

        except Exception as e:
            logger.error(f"Sentence Transformers error: {e}")
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
        cost_info = "Paid (OpenAI API)" if self.provider == "openai" else "FREE (Local)"
        return {
            "model": self.model,
            "dimensions": self.dimensions,
            "provider": self.provider,
            "cost": cost_info
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