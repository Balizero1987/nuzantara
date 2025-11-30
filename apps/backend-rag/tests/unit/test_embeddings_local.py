"""
Unit tests for LocalEmbeddingsGenerator - Comprehensive test coverage
Targets 90%+ coverage for embeddings_local.py
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call
import logging

import pytest
import numpy as np

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from core.embeddings_local import LocalEmbeddingsGenerator


@pytest.fixture
def mock_sentence_transformer():
    """Mock SentenceTransformer model"""
    mock_model = MagicMock()
    mock_model.get_sentence_embedding_dimension = MagicMock(return_value=384)

    # Create realistic embeddings (numpy arrays)
    def mock_encode(texts, convert_to_numpy=True, show_progress_bar=False):
        num_texts = len(texts)
        # Return numpy array of shape (num_texts, 384)
        embeddings = np.random.rand(num_texts, 384).astype(np.float32)
        return embeddings

    mock_model.encode = MagicMock(side_effect=mock_encode)
    return mock_model


@pytest.fixture
def mock_logger():
    """Mock logger for testing log messages"""
    with patch('core.embeddings_local.logger') as mock_log:
        yield mock_log


# ============================================================================
# Tests for __init__ - Initialization
# ============================================================================


def test_init_default_model(mock_sentence_transformer, mock_logger):
    """Test initialization with default model"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        assert generator.model_name == "sentence-transformers/all-MiniLM-L6-v2"
        assert generator.dimensions == 384
        assert generator.model is not None

        # Verify logging
        mock_logger.info.assert_any_call("Loading local embedding model: sentence-transformers/all-MiniLM-L6-v2")
        mock_logger.info.assert_any_call("This may take a minute on first run (downloads model)...")
        mock_logger.info.assert_any_call("✅ Model loaded: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)")


def test_init_custom_model(mock_sentence_transformer, mock_logger):
    """Test initialization with custom model name"""
    custom_model = "sentence-transformers/all-mpnet-base-v2"
    mock_sentence_transformer.get_sentence_embedding_dimension = MagicMock(return_value=768)

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator(model_name=custom_model)

        assert generator.model_name == custom_model
        assert generator.dimensions == 768

        # Verify model was loaded with correct name
        mock_logger.info.assert_any_call(f"Loading local embedding model: {custom_model}")
        mock_logger.info.assert_any_call(f"✅ Model loaded: {custom_model} (768 dimensions)")


def test_init_multilingual_model(mock_sentence_transformer):
    """Test initialization with multilingual model"""
    multilingual_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator(model_name=multilingual_model)

        assert generator.model_name == multilingual_model
        assert generator.model is not None


def test_init_model_load_failure(mock_logger):
    """Test initialization when model fails to load"""
    with patch('core.embeddings_local.SentenceTransformer', side_effect=RuntimeError("Model download failed")):
        with pytest.raises(RuntimeError, match="Model download failed"):
            LocalEmbeddingsGenerator()

        # Verify error logging
        mock_logger.error.assert_called_once()
        assert "Failed to load model" in str(mock_logger.error.call_args)


def test_init_model_load_exception(mock_logger):
    """Test initialization with generic exception"""
    with patch('core.embeddings_local.SentenceTransformer', side_effect=Exception("Unexpected error")):
        with pytest.raises(Exception, match="Unexpected error"):
            LocalEmbeddingsGenerator()

        mock_logger.error.assert_called_once()


def test_init_stores_dimension_correctly(mock_sentence_transformer):
    """Test that dimensions are correctly stored from model"""
    mock_sentence_transformer.get_sentence_embedding_dimension = MagicMock(return_value=512)

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        assert generator.dimensions == 512


# ============================================================================
# Tests for generate_embeddings - Batch embedding generation
# ============================================================================


def test_generate_embeddings_single_text(mock_sentence_transformer, mock_logger):
    """Test generating embeddings for a single text"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["Hello world"]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 1
        assert len(embeddings[0]) == 384
        assert isinstance(embeddings[0], list)
        assert all(isinstance(x, float) for x in embeddings[0])

        # Verify encoding was called correctly
        mock_sentence_transformer.encode.assert_called_once()
        call_args = mock_sentence_transformer.encode.call_args
        assert call_args[0][0] == texts
        assert call_args[1]['convert_to_numpy'] is True
        assert call_args[1]['show_progress_bar'] is False  # Single text, no progress bar


def test_generate_embeddings_multiple_texts(mock_sentence_transformer, mock_logger):
    """Test generating embeddings for multiple texts"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["Text 1", "Text 2", "Text 3"]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 3
        assert all(len(emb) == 384 for emb in embeddings)
        assert all(isinstance(emb, list) for emb in embeddings)

        # Verify logging
        mock_logger.info.assert_any_call("Generating embeddings for 3 texts...")
        mock_logger.info.assert_any_call("✅ Generated 3 embeddings")


def test_generate_embeddings_large_batch_shows_progress(mock_sentence_transformer):
    """Test that progress bar is shown for large batches (>10 texts)"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        # Create 15 texts to trigger progress bar
        texts = [f"Text {i}" for i in range(15)]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 15

        # Verify show_progress_bar=True was passed
        call_args = mock_sentence_transformer.encode.call_args
        assert call_args[1]['show_progress_bar'] is True


def test_generate_embeddings_exactly_10_texts_no_progress(mock_sentence_transformer):
    """Test that progress bar is NOT shown for exactly 10 texts"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = [f"Text {i}" for i in range(10)]
        generator.generate_embeddings(texts)

        # Verify show_progress_bar=False (not > 10)
        call_args = mock_sentence_transformer.encode.call_args
        assert call_args[1]['show_progress_bar'] is False


def test_generate_embeddings_empty_list(mock_sentence_transformer, mock_logger):
    """Test generating embeddings for empty list"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embeddings = generator.generate_embeddings([])

        assert embeddings == []

        # Verify warning was logged
        mock_logger.warning.assert_called_once_with("Empty text list provided for embedding")

        # Verify encode was NOT called
        mock_sentence_transformer.encode.assert_not_called()


def test_generate_embeddings_preserves_order(mock_sentence_transformer):
    """Test that embeddings are returned in same order as input"""
    # Create a mock that returns distinct embeddings for each text
    def ordered_encode(texts, convert_to_numpy=True, show_progress_bar=False):
        num_texts = len(texts)
        embeddings = np.zeros((num_texts, 384), dtype=np.float32)
        for i in range(num_texts):
            embeddings[i][0] = float(i)  # First element identifies the order
        return embeddings

    mock_sentence_transformer.encode = MagicMock(side_effect=ordered_encode)

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["First", "Second", "Third"]
        embeddings = generator.generate_embeddings(texts)

        # Verify order is preserved
        assert embeddings[0][0] == 0.0
        assert embeddings[1][0] == 1.0
        assert embeddings[2][0] == 2.0


def test_generate_embeddings_converts_numpy_to_list(mock_sentence_transformer):
    """Test that numpy arrays are converted to lists"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embeddings = generator.generate_embeddings(["Test"])

        # Verify return type is list of lists, not numpy
        assert isinstance(embeddings, list)
        assert isinstance(embeddings[0], list)
        assert not isinstance(embeddings[0], np.ndarray)


def test_generate_embeddings_error_handling(mock_sentence_transformer, mock_logger):
    """Test error handling during embedding generation"""
    mock_sentence_transformer.encode = MagicMock(side_effect=RuntimeError("CUDA out of memory"))

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        with pytest.raises(RuntimeError, match="CUDA out of memory"):
            generator.generate_embeddings(["Test text"])

        # Verify error was logged
        mock_logger.error.assert_called_once()
        assert "Error generating embeddings" in str(mock_logger.error.call_args)


def test_generate_embeddings_exception_propagation(mock_sentence_transformer, mock_logger):
    """Test that exceptions are properly propagated"""
    mock_sentence_transformer.encode = MagicMock(side_effect=ValueError("Invalid input"))

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        with pytest.raises(ValueError, match="Invalid input"):
            generator.generate_embeddings(["Bad input"])


def test_generate_embeddings_with_special_characters(mock_sentence_transformer):
    """Test embedding generation with special characters"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["Hello! @#$%", "Text with émojis 🎉", "Line\nbreaks\nhere"]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 3
        assert all(len(emb) == 384 for emb in embeddings)


def test_generate_embeddings_with_unicode(mock_sentence_transformer):
    """Test embedding generation with unicode text"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["日本語", "Español", "العربية", "中文"]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 4


# ============================================================================
# Tests for generate_single_embedding - Single text embedding
# ============================================================================


def test_generate_single_embedding_basic(mock_sentence_transformer):
    """Test generating single embedding"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embedding = generator.generate_single_embedding("Test text")

        assert isinstance(embedding, list)
        assert len(embedding) == 384
        assert all(isinstance(x, float) for x in embedding)


def test_generate_single_embedding_calls_batch_method(mock_sentence_transformer):
    """Test that single embedding uses batch generation internally"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        with patch.object(generator, 'generate_embeddings', wraps=generator.generate_embeddings) as mock_gen:
            embedding = generator.generate_single_embedding("Test")

            # Verify it called generate_embeddings with list of one item
            mock_gen.assert_called_once_with(["Test"])


def test_generate_single_embedding_empty_string(mock_sentence_transformer):
    """Test generating embedding for empty string"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embedding = generator.generate_single_embedding("")

        assert isinstance(embedding, list)
        assert len(embedding) == 384


def test_generate_single_embedding_returns_first_element(mock_sentence_transformer):
    """Test that single embedding returns first element from batch"""
    # Create mock that returns identifiable embeddings
    def unique_encode(texts, convert_to_numpy=True, show_progress_bar=False):
        embeddings = np.zeros((len(texts), 384), dtype=np.float32)
        embeddings[0][0] = 42.0  # Marker value
        return embeddings

    mock_sentence_transformer.encode = MagicMock(side_effect=unique_encode)

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embedding = generator.generate_single_embedding("Test")

        assert embedding[0] == 42.0


def test_generate_single_embedding_when_empty_result(mock_sentence_transformer):
    """Test single embedding when generate_embeddings returns empty list"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        # Mock generate_embeddings to return empty list
        with patch.object(generator, 'generate_embeddings', return_value=[]):
            embedding = generator.generate_single_embedding("Test")

            assert embedding == []


# ============================================================================
# Tests for generate_query_embedding - Query-specific embeddings
# ============================================================================


def test_generate_query_embedding_basic(mock_sentence_transformer):
    """Test generating query embedding"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embedding = generator.generate_query_embedding("What is the meaning of life?")

        assert isinstance(embedding, list)
        assert len(embedding) == 384


def test_generate_query_embedding_uses_single_embedding(mock_sentence_transformer):
    """Test that query embedding uses single embedding method"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        with patch.object(generator, 'generate_single_embedding', wraps=generator.generate_single_embedding) as mock_single:
            query = "Search query"
            embedding = generator.generate_query_embedding(query)

            # Verify it called generate_single_embedding
            mock_single.assert_called_once_with(query)


def test_generate_query_embedding_short_query(mock_sentence_transformer):
    """Test query embedding with short query"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embedding = generator.generate_query_embedding("AI")

        assert len(embedding) == 384


def test_generate_query_embedding_long_query(mock_sentence_transformer):
    """Test query embedding with long query"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        long_query = " ".join(["word"] * 100)
        embedding = generator.generate_query_embedding(long_query)

        assert len(embedding) == 384


def test_generate_query_embedding_same_as_single_for_local(mock_sentence_transformer):
    """Test that query embedding uses the same underlying method as single embedding"""
    # Create deterministic embeddings for this test
    def deterministic_encode(texts, convert_to_numpy=True, show_progress_bar=False):
        # Return same embedding for same text
        embeddings = np.ones((len(texts), 384), dtype=np.float32) * 0.5
        return embeddings

    mock_sentence_transformer.encode = MagicMock(side_effect=deterministic_encode)

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        text = "Test query"

        # Both should call the same underlying generate_single_embedding
        with patch.object(generator, 'generate_single_embedding', wraps=generator.generate_single_embedding) as mock_single:
            query_emb = generator.generate_query_embedding(text)
            mock_single.assert_called_once_with(text)


# ============================================================================
# Tests for get_model_info - Model information retrieval
# ============================================================================


def test_get_model_info_default_model(mock_sentence_transformer):
    """Test getting model info for default model"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        info = generator.get_model_info()

        assert info["model"] == "sentence-transformers/all-MiniLM-L6-v2"
        assert info["dimensions"] == 384
        assert info["provider"] == "sentence-transformers (local)"
        assert info["cost"] == "FREE"


def test_get_model_info_custom_model(mock_sentence_transformer):
    """Test getting model info for custom model"""
    custom_model = "sentence-transformers/all-mpnet-base-v2"
    mock_sentence_transformer.get_sentence_embedding_dimension = MagicMock(return_value=768)

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator(model_name=custom_model)

        info = generator.get_model_info()

        assert info["model"] == custom_model
        assert info["dimensions"] == 768
        assert info["provider"] == "sentence-transformers (local)"
        assert info["cost"] == "FREE"


def test_get_model_info_returns_dict(mock_sentence_transformer):
    """Test that model info returns dictionary"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        info = generator.get_model_info()

        assert isinstance(info, dict)
        assert all(key in info for key in ["model", "dimensions", "provider", "cost"])


def test_get_model_info_immutability(mock_sentence_transformer):
    """Test that model info reflects current state"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        info1 = generator.get_model_info()
        info2 = generator.get_model_info()

        # Should return consistent info
        assert info1 == info2


def test_get_model_info_all_fields_present(mock_sentence_transformer):
    """Test that all required fields are present in model info"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        info = generator.get_model_info()

        required_fields = ["model", "dimensions", "provider", "cost"]
        for field in required_fields:
            assert field in info, f"Missing required field: {field}"


# ============================================================================
# Integration-style tests
# ============================================================================


def test_full_workflow_single_text(mock_sentence_transformer):
    """Test complete workflow: init -> generate -> get info"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        # Initialize
        generator = LocalEmbeddingsGenerator()

        # Generate embedding
        embedding = generator.generate_single_embedding("Test document")
        assert len(embedding) == 384

        # Get info
        info = generator.get_model_info()
        assert info["dimensions"] == 384
        assert info["cost"] == "FREE"


def test_full_workflow_batch_processing(mock_sentence_transformer):
    """Test complete workflow with batch processing"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        # Process multiple batches
        batch1 = generator.generate_embeddings(["Doc 1", "Doc 2"])
        batch2 = generator.generate_embeddings(["Doc 3", "Doc 4", "Doc 5"])

        assert len(batch1) == 2
        assert len(batch2) == 3

        # All embeddings should have correct dimensions
        all_embeddings = batch1 + batch2
        assert all(len(emb) == 384 for emb in all_embeddings)


def test_multiple_generators_independent(mock_sentence_transformer):
    """Test that multiple generator instances work independently"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        gen1 = LocalEmbeddingsGenerator(model_name="model1")

    # Create second generator with different model
    mock_model2 = MagicMock()
    mock_model2.get_sentence_embedding_dimension = MagicMock(return_value=512)
    mock_model2.encode = MagicMock(return_value=np.random.rand(1, 512).astype(np.float32))

    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_model2):
        gen2 = LocalEmbeddingsGenerator(model_name="model2")

    # Verify they have different configurations
    assert gen1.model_name == "model1"
    assert gen2.model_name == "model2"
    assert gen1.dimensions == 384
    assert gen2.dimensions == 512


def test_reuse_generator_multiple_calls(mock_sentence_transformer):
    """Test that generator can be reused for multiple calls"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        # Make multiple calls
        emb1 = generator.generate_single_embedding("Text 1")
        emb2 = generator.generate_single_embedding("Text 2")
        batch = generator.generate_embeddings(["Text 3", "Text 4"])
        query = generator.generate_query_embedding("Query 1")

        # All should work correctly
        assert len(emb1) == 384
        assert len(emb2) == 384
        assert len(batch) == 2
        assert len(query) == 384


# ============================================================================
# Edge cases and corner cases
# ============================================================================


def test_very_long_text(mock_sentence_transformer):
    """Test embedding generation with very long text"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        # Create a very long text (>10k characters)
        long_text = "word " * 2000
        embedding = generator.generate_single_embedding(long_text)

        assert len(embedding) == 384


def test_whitespace_only_text(mock_sentence_transformer):
    """Test embedding for whitespace-only text"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        embedding = generator.generate_single_embedding("   \t\n   ")

        assert len(embedding) == 384


def test_mixed_language_batch(mock_sentence_transformer):
    """Test batch with mixed languages"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["English text", "Texte français", "Texto español", "日本語"]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 4


def test_duplicate_texts_in_batch(mock_sentence_transformer):
    """Test batch with duplicate texts"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["Same text", "Same text", "Different", "Same text"]
        embeddings = generator.generate_embeddings(texts)

        # Should still generate all embeddings
        assert len(embeddings) == 4


def test_single_character_texts(mock_sentence_transformer):
    """Test embedding generation for single characters"""
    with patch('core.embeddings_local.SentenceTransformer', return_value=mock_sentence_transformer):
        generator = LocalEmbeddingsGenerator()

        texts = ["a", "b", "c"]
        embeddings = generator.generate_embeddings(texts)

        assert len(embeddings) == 3
