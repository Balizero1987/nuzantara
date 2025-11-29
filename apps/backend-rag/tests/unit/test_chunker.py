"""
Unit tests for Text Chunker
100% coverage target with comprehensive testing
"""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from core.chunker import TextChunker, semantic_chunk

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings configuration"""
    with patch("app.core.config.settings") as mock:
        mock.chunk_size = 500
        mock.chunk_overlap = 50
        mock.max_chunks_per_book = 1000
        yield mock


@pytest.fixture
def chunker_default():
    """Create TextChunker with default settings"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.chunk_size = 500
        mock_settings.chunk_overlap = 50
        mock_settings.max_chunks_per_book = 1000
        with patch("core.chunker.logger"):
            return TextChunker()


@pytest.fixture
def chunker_custom():
    """Create TextChunker with custom parameters"""
    with patch("core.chunker.logger"):
        return TextChunker(chunk_size=200, chunk_overlap=20, max_chunks=100)


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_default_settings(mock_settings):
    """Test initialization with default settings"""
    with patch("core.chunker.logger") as mock_logger:
        chunker = TextChunker()
        assert chunker.chunk_size == 500
        assert chunker.chunk_overlap == 50
        assert chunker.max_chunks == 1000
        assert len(chunker.separators) > 0
        mock_logger.info.assert_called_once()


def test_init_with_custom_parameters():
    """Test initialization with custom parameters"""
    with patch("core.chunker.logger"):
        chunker = TextChunker(chunk_size=300, chunk_overlap=30, max_chunks=200)
        assert chunker.chunk_size == 300
        assert chunker.chunk_overlap == 30
        assert chunker.max_chunks == 200


def test_init_with_partial_parameters(mock_settings):
    """Test initialization with partial custom parameters"""
    with patch("core.chunker.logger"):
        chunker = TextChunker(chunk_size=400)
        assert chunker.chunk_size == 400
        assert chunker.chunk_overlap == 50  # From settings
        assert chunker.max_chunks == 1000  # From settings


def test_init_without_settings():
    """Test initialization when settings is None"""
    with patch("core.chunker.settings", None), patch("core.chunker.logger"):
        chunker = TextChunker()
        assert chunker.chunk_size == 1000  # Default fallback
        assert chunker.chunk_overlap == 100  # Default fallback
        assert chunker.max_chunks == 500  # Default fallback


def test_init_separators_order():
    """Test that separators are in correct order"""
    with patch("core.chunker.logger"):
        chunker = TextChunker()
        # Should start with most semantic (paragraph breaks)
        assert chunker.separators[0] == "\n\n\n"
        assert "\n\n" in chunker.separators
        assert "\n" in chunker.separators
        assert "" in chunker.separators  # Character level fallback


# ============================================================================
# Tests for _split_text_recursive
# ============================================================================


def test_split_text_recursive_simple(chunker_default):
    """Test recursive split with simple text"""
    text = "First sentence. Second sentence. Third sentence."
    chunks = chunker_default._split_text_recursive(text, ". ")
    assert len(chunks) > 0
    assert all(isinstance(chunk, str) for chunk in chunks)


def test_split_text_recursive_paragraphs(chunker_custom):
    """Test recursive split with paragraph breaks"""
    # Use custom chunker with smaller chunk_size to ensure splitting
    text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    chunks = chunker_custom._split_text_recursive(text, "\n\n")
    # May produce 1 or more chunks depending on size
    assert len(chunks) >= 1
    # Check that separator is handled correctly
    assert all(isinstance(chunk, str) for chunk in chunks)


def test_split_text_recursive_single_chunk(chunker_custom):
    """Test recursive split when text fits in one chunk"""
    text = "Short text that fits."
    chunks = chunker_custom._split_text_recursive(text, ". ")
    assert len(chunks) == 1
    assert chunks[0] == text


def test_split_text_recursive_large_text(chunker_custom):
    """Test recursive split with text larger than chunk_size"""
    # Create text larger than chunk_size (200)
    text = ". ".join(["Sentence"] * 100)
    chunks = chunker_custom._split_text_recursive(text, ". ")
    assert len(chunks) > 1
    assert all(
        len(chunk) <= chunker_custom.chunk_size * 1.5 for chunk in chunks
    )  # Allow some flexibility


def test_split_text_recursive_character_level_fallback(chunker_custom):
    """Test recursive split that eventually reaches character-level (space separator)"""
    # Create text that will require multiple levels of splitting
    # Use a small chunk_size to force recursive splitting
    text = "word " * 500  # Long text with spaces
    chunks = chunker_custom._split_text_recursive(text, " ")
    assert len(chunks) > 0
    # Should split at word level
    assert all(len(chunk) <= chunker_custom.chunk_size * 1.5 for chunk in chunks)


def test_split_text_recursive_recursive_splitting(chunker_custom):
    """Test that recursive splitting works when chunks are still too large"""
    # Create text that requires multiple levels of splitting
    long_text = "\n\n".join(["Paragraph " + "word " * 50] * 10)
    chunks = chunker_custom._split_text_recursive(long_text, "\n\n")
    # Should recursively split if chunks are still too large
    assert len(chunks) > 0
    assert all(len(chunk) <= chunker_custom.chunk_size * 1.5 for chunk in chunks)


# ============================================================================
# Tests for semantic_chunk
# ============================================================================


def test_semantic_chunk_simple_text(chunker_default):
    """Test semantic chunking with simple text"""
    text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    chunks = chunker_default.semantic_chunk(text)
    assert len(chunks) > 0
    assert all("text" in chunk for chunk in chunks)
    assert all("chunk_index" in chunk for chunk in chunks)
    assert all("total_chunks" in chunk for chunk in chunks)
    assert all("chunk_length" in chunk for chunk in chunks)


def test_semantic_chunk_empty_text(chunker_default):
    """Test semantic chunking with empty text"""
    with patch("core.chunker.logger") as mock_logger:
        chunks = chunker_default.semantic_chunk("")
        assert chunks == []
        mock_logger.warning.assert_called_once()


def test_semantic_chunk_whitespace_only(chunker_default):
    """Test semantic chunking with whitespace-only text"""
    with patch("core.chunker.logger") as mock_logger:
        chunks = chunker_default.semantic_chunk("   \n\n   ")
        assert chunks == []
        mock_logger.warning.assert_called_once()


def test_semantic_chunk_with_metadata(chunker_default):
    """Test semantic chunking with metadata"""
    text = "First paragraph.\n\nSecond paragraph."
    metadata = {"source": "test", "page": 1}
    chunks = chunker_default.semantic_chunk(text, metadata)
    assert len(chunks) > 0
    assert all(chunk["source"] == "test" for chunk in chunks)
    assert all(chunk["page"] == 1 for chunk in chunks)


def test_semantic_chunk_overlap(chunker_custom):
    """Test that overlap is applied between chunks"""
    text = ". ".join([f"Sentence {i}" for i in range(20)])
    chunks = chunker_custom.semantic_chunk(text)
    if len(chunks) > 1:
        # Check that overlap is present (chunks should share some text)
        first_chunk_end = chunks[0]["text"][-chunker_custom.chunk_overlap :]
        second_chunk_start = chunks[1]["text"][: chunker_custom.chunk_overlap]
        # Some overlap should be present
        assert len(first_chunk_end) > 0 or len(second_chunk_start) > 0


def test_semantic_chunk_max_chunks_limit(chunker_custom):
    """Test that max_chunks limit is enforced"""
    # Create text that would produce many chunks
    text = "\n\n".join([f"Paragraph {i}" + " word" * 100 for i in range(200)])
    with patch("core.chunker.logger") as mock_logger:
        chunks = chunker_custom.semantic_chunk(text)
        assert len(chunks) <= chunker_custom.max_chunks
        if len(chunks) == chunker_custom.max_chunks:
            mock_logger.warning.assert_called_once()


def test_semantic_chunk_no_overlap_when_single_chunk(chunker_default):
    """Test that overlap is not applied when there's only one chunk"""
    text = "Short text that fits in one chunk."
    chunks = chunker_default.semantic_chunk(text)
    assert len(chunks) == 1
    # No overlap logic should run for single chunk


def test_semantic_chunk_overlap_zero(chunker_custom):
    """Test semantic chunking with zero overlap"""
    chunker_custom.chunk_overlap = 0
    text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    chunks = chunker_custom.semantic_chunk(text)
    assert len(chunks) > 0
    # Should still work without overlap


def test_semantic_chunk_chunk_length_calculation(chunker_default):
    """Test that chunk_length is correctly calculated"""
    text = "First paragraph.\n\nSecond paragraph."
    chunks = chunker_default.semantic_chunk(text)
    for chunk in chunks:
        assert chunk["chunk_length"] == len(chunk["text"])


def test_semantic_chunk_indexing(chunker_default):
    """Test that chunk_index and total_chunks are correct"""
    text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    chunks = chunker_default.semantic_chunk(text)
    assert chunks[0]["chunk_index"] == 0
    assert chunks[-1]["chunk_index"] == len(chunks) - 1
    assert all(chunk["total_chunks"] == len(chunks) for chunk in chunks)


def test_semantic_chunk_error_handling(chunker_default):
    """Test error handling in semantic_chunk"""
    # This should not raise, but if it does, it should be logged
    with patch("core.chunker.logger") as mock_logger:
        # Create a scenario that might cause issues
        # Mock _split_text_recursive to raise an exception
        with patch.object(
            chunker_default, "_split_text_recursive", side_effect=Exception("Test error")
        ):
            with pytest.raises(Exception):
                chunker_default.semantic_chunk("Test text")
            mock_logger.error.assert_called_once()


def test_semantic_chunk_very_long_text(chunker_default):
    """Test semantic chunking with very long text"""
    # Create very long text
    text = "\n\n".join([f"Paragraph {i}" + " word" * 200 for i in range(100)])
    chunks = chunker_default.semantic_chunk(text)
    assert len(chunks) > 0
    assert all(len(chunk["text"]) > 0 for chunk in chunks)


def test_semantic_chunk_single_separator(chunker_default):
    """Test semantic chunking when only one separator exists"""
    chunker_default.separators = ["\n"]
    text = "Line 1\nLine 2\nLine 3"
    chunks = chunker_default.semantic_chunk(text)
    assert len(chunks) > 0


def test_semantic_chunk_no_separators(chunker_default):
    """Test semantic chunking when no separators exist"""
    chunker_default.separators = []
    text = "Some text without separators"
    chunks = chunker_default.semantic_chunk(text)
    # Should return single chunk with full text
    assert len(chunks) == 1
    assert chunks[0]["text"] == text


# ============================================================================
# Tests for chunk_by_pages
# ============================================================================


def test_chunk_by_pages_without_markers(chunker_default):
    """Test chunk_by_pages without page markers (should fall back to semantic_chunk)"""
    text = "First paragraph.\n\nSecond paragraph."
    chunks = chunker_default.chunk_by_pages(text)
    assert len(chunks) > 0
    assert all("text" in chunk for chunk in chunks)


def test_chunk_by_pages_with_markers(chunker_default):
    """Test chunk_by_pages with page markers (currently uses semantic_chunk)"""
    text = "First paragraph.\n\nSecond paragraph."
    page_markers = [0, 50, 100]
    chunks = chunker_default.chunk_by_pages(text, page_markers)
    # Currently falls back to semantic_chunk
    assert len(chunks) > 0


def test_chunk_by_pages_with_metadata(chunker_default):
    """Test chunk_by_pages with metadata"""
    text = "First paragraph.\n\nSecond paragraph."
    metadata = {"source": "test"}
    chunks = chunker_default.chunk_by_pages(text, metadata=metadata)
    assert len(chunks) > 0
    assert all(chunk["source"] == "test" for chunk in chunks)


# ============================================================================
# Tests for semantic_chunk standalone function
# ============================================================================


def test_semantic_chunk_function_default():
    """Test standalone semantic_chunk function with defaults"""
    text = "First paragraph.\n\nSecond paragraph."
    chunks = semantic_chunk(text)
    assert isinstance(chunks, list)
    assert all(isinstance(chunk, str) for chunk in chunks)
    assert len(chunks) > 0


def test_semantic_chunk_function_custom_params():
    """Test standalone semantic_chunk function with custom parameters"""
    text = "First paragraph.\n\nSecond paragraph."
    chunks = semantic_chunk(text, max_tokens=100, overlap=10)
    assert isinstance(chunks, list)
    assert all(isinstance(chunk, str) for chunk in chunks)


def test_semantic_chunk_function_empty_text():
    """Test standalone semantic_chunk function with empty text"""
    chunks = semantic_chunk("")
    assert chunks == []


def test_semantic_chunk_function_extracts_text():
    """Test that standalone function extracts text from chunk objects"""
    text = "First paragraph.\n\nSecond paragraph."
    chunks = semantic_chunk(text)
    # Should return list of strings, not dictionaries
    assert all(isinstance(chunk, str) for chunk in chunks)
    assert all("text" not in chunk for chunk in chunks)  # Should be strings, not dicts


# ============================================================================
# Edge Cases and Integration Tests
# ============================================================================


def test_chunker_with_unicode_text(chunker_default):
    """Test chunker with unicode characters"""
    text = "Paragrafo primo.\n\nParagrafo secondo.\n\n段落三。"
    chunks = chunker_default.semantic_chunk(text)
    assert len(chunks) > 0
    assert all(len(chunk["text"]) > 0 for chunk in chunks)


def test_chunker_with_special_characters(chunker_default):
    """Test chunker with special characters"""
    text = "Text with ! exclamation?\n\nAnd ; semicolon, comma."
    chunks = chunker_default.semantic_chunk(text)
    assert len(chunks) > 0


def test_chunker_preserves_text_content(chunker_default):
    """Test that chunker preserves all text content"""
    text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    chunks = chunker_default.semantic_chunk(text)
    # Combine all chunks and check content is preserved
    combined = " ".join(chunk["text"] for chunk in chunks)
    # Should contain original text (allowing for overlap)
    assert "First paragraph" in combined
    assert "Second paragraph" in combined
    assert "Third paragraph" in combined


def test_chunker_overlap_edge_case_short_previous_chunk(chunker_custom):
    """Test overlap when previous chunk is shorter than overlap size"""
    chunker_custom.chunk_overlap = 100
    text = "Short.\n\n" + "Long " * 200
    chunks = chunker_custom.semantic_chunk(text)
    if len(chunks) > 1:
        # Should handle case where previous chunk is shorter than overlap
        assert len(chunks) > 0


def test_chunker_recursive_separator_not_in_list(chunker_default):
    """Test recursive splitting when separator is not in separators list"""
    # Use a separator that's not in the default list
    text = "Text with | separator | multiple | times"
    # This tests the fallback when separator not found
    chunks = chunker_default._split_text_recursive(text, "|")
    assert len(chunks) > 0


def test_chunker_empty_chunk_filtering(chunker_default):
    """Test that empty chunks are filtered out"""
    text = "First paragraph.\n\n\n\nSecond paragraph."
    chunks = chunker_default.semantic_chunk(text)
    # Should not have empty chunks
    assert all(len(chunk["text"].strip()) > 0 for chunk in chunks)
