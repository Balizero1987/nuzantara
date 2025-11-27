"""
ZANTARA RAG - Local Embeddings with Sentence Transformers
FREE, no API key needed, runs locally
"""

import logging

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class LocalEmbeddingsGenerator:
    """
    Generate embeddings using Sentence Transformers (local, free).
    No API key required, runs on your machine.
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialize local embeddings generator.

        Args:
            model_name: Sentence transformer model name
                       Default: all-MiniLM-L6-v2 (384 dims, fast, good quality)
                       Alternatives:
                       - all-mpnet-base-v2 (768 dims, better quality, slower)
                       - paraphrase-multilingual-MiniLM-L12-v2 (multilingual)
        """
        self.model_name = model_name

        logger.info(f"Loading local embedding model: {model_name}")
        logger.info("This may take a minute on first run (downloads model)...")

        try:
            self.model = SentenceTransformer(model_name)
            self.dimensions = self.model.get_sentence_embedding_dimension()

            logger.info(f"✅ Model loaded: {model_name} ({self.dimensions} dimensions)")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for a list of texts.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors (each vector is a list of floats)
        """
        if not texts:
            logger.warning("Empty text list provided for embedding")
            return []

        try:
            logger.info(f"Generating embeddings for {len(texts)} texts...")

            # Generate embeddings
            embeddings = self.model.encode(
                texts, convert_to_numpy=True, show_progress_bar=len(texts) > 10
            )

            # Convert to list of lists
            embeddings_list = embeddings.tolist()

            logger.info(f"✅ Generated {len(embeddings_list)} embeddings")
            return embeddings_list

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    def generate_single_embedding(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text string to embed

        Returns:
            Embedding vector as list of floats
        """
        embeddings = self.generate_embeddings([text])
        return embeddings[0] if embeddings else []

    def generate_query_embedding(self, query: str) -> list[float]:
        """
        Generate embedding optimized for query/search.

        Args:
            query: Search query text

        Returns:
            Query embedding vector
        """
        return self.generate_single_embedding(query)

    def get_model_info(self) -> dict:
        """
        Get information about the embedding model.

        Returns:
            Dictionary with model configuration
        """
        return {
            "model": self.model_name,
            "dimensions": self.dimensions,
            "provider": "sentence-transformers (local)",
            "cost": "FREE",
        }
