"""
Unit tests for Citation Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.citation_service import CitationService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def citation_service():
    """Create CitationService instance"""
    return CitationService()


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(citation_service):
    """Test initialization"""
    assert citation_service is not None


# ============================================================================
# Tests for create_citation_instructions
# ============================================================================


def test_create_citation_instructions_with_sources(citation_service):
    """Test create_citation_instructions with sources available"""
    result = citation_service.create_citation_instructions(sources_available=True)

    assert len(result) > 0
    assert "Citation Guidelines" in result
    assert "[1]" in result or "citations" in result.lower()


def test_create_citation_instructions_no_sources(citation_service):
    """Test create_citation_instructions without sources"""
    result = citation_service.create_citation_instructions(sources_available=False)

    assert result == ""


# ============================================================================
# Tests for extract_sources_from_rag
# ============================================================================


def test_extract_sources_from_rag_success(citation_service):
    """Test extract_sources_from_rag successful"""
    rag_results = [
        {
            "metadata": {
                "title": "Document 1",
                "url": "https://example.com/doc1",
                "date": "2024-01-15",
                "category": "immigration",
            },
            "score": 0.85,
        },
        {
            "metadata": {
                "title": "Document 2",
                "source_url": "https://example.com/doc2",
                "scraped_at": "2024-02-20",
            },
            "score": 0.75,
        },
    ]

    sources = citation_service.extract_sources_from_rag(rag_results)

    assert len(sources) == 2
    assert sources[0]["id"] == 1
    assert sources[0]["title"] == "Document 1"
    assert sources[0]["url"] == "https://example.com/doc1"
    assert sources[0]["type"] == "rag"
    assert sources[0]["score"] == 0.85


def test_extract_sources_from_rag_empty(citation_service):
    """Test extract_sources_from_rag with empty list"""
    sources = citation_service.extract_sources_from_rag([])

    assert isinstance(sources, list)
    assert len(sources) == 0


def test_extract_sources_from_rag_minimal_metadata(citation_service):
    """Test extract_sources_from_rag with minimal metadata"""
    rag_results = [{"metadata": {}, "score": 0.5}]

    sources = citation_service.extract_sources_from_rag(rag_results)

    assert len(sources) == 1
    assert sources[0]["title"] == "Document 1"
    assert sources[0]["id"] == 1


# ============================================================================
# Tests for format_sources_section
# ============================================================================


def test_format_sources_section_success(citation_service):
    """Test format_sources_section successful"""
    sources = [
        {
            "id": 1,
            "title": "Document 1",
            "url": "https://example.com/doc1",
            "date": "2024-01-15",
        },
        {
            "id": 2,
            "title": "Document 2",
            "url": "",
            "date": "",
        },
    ]

    result = citation_service.format_sources_section(sources)

    assert "Sources:" in result
    assert "[1]" in result
    assert "[2]" in result
    assert "Document 1" in result
    assert "Document 2" in result


def test_format_sources_section_empty(citation_service):
    """Test format_sources_section with empty list"""
    result = citation_service.format_sources_section([])

    assert result == ""


def test_format_sources_section_with_date(citation_service):
    """Test format_sources_section formats date correctly"""
    sources = [
        {
            "id": 1,
            "title": "Document 1",
            "url": "https://example.com/doc1",
            "date": "2024-01-15T10:30:00Z",
        }
    ]

    result = citation_service.format_sources_section(sources)

    assert "2024-01-15" in result


# ============================================================================
# Tests for inject_citation_context_into_prompt
# ============================================================================


def test_inject_citation_context_into_prompt_with_sources(citation_service):
    """Test inject_citation_context_into_prompt with sources"""
    system_prompt = "You are a helpful assistant."
    sources = [
        {"id": 1, "title": "Document 1", "category": "immigration"},
        {"id": 2, "title": "Document 2", "category": "tax"},
    ]

    result = citation_service.inject_citation_context_into_prompt(system_prompt, sources)

    assert system_prompt in result
    assert "Citation Guidelines" in result
    assert "Available Sources" in result
    assert "[1]" in result
    assert "[2]" in result


def test_inject_citation_context_into_prompt_no_sources(citation_service):
    """Test inject_citation_context_into_prompt without sources"""
    system_prompt = "You are a helpful assistant."

    result = citation_service.inject_citation_context_into_prompt(system_prompt, [])

    assert result == system_prompt


def test_inject_citation_context_into_prompt_with_category(citation_service):
    """Test inject_citation_context_into_prompt includes category"""
    system_prompt = "You are a helpful assistant."
    sources = [{"id": 1, "title": "Document 1", "category": "immigration"}]

    result = citation_service.inject_citation_context_into_prompt(system_prompt, sources)

    assert "Category: immigration" in result


# ============================================================================
# Tests for validate_citations_in_response
# ============================================================================


def test_validate_citations_in_response_valid(citation_service):
    """Test validate_citations_in_response with valid citations"""
    response_text = "This is a test [1]. Another statement [2]."
    sources = [
        {"id": 1, "title": "Source 1"},
        {"id": 2, "title": "Source 2"},
        {"id": 3, "title": "Source 3"},
    ]

    result = citation_service.validate_citations_in_response(response_text, sources)

    assert result["valid"] is True
    assert len(result["citations_found"]) == 2
    assert 1 in result["citations_found"]
    assert 2 in result["citations_found"]
    assert len(result["invalid_citations"]) == 0
    assert 3 in result["unused_sources"]


def test_validate_citations_in_response_invalid(citation_service):
    """Test validate_citations_in_response with invalid citations"""
    response_text = "This is a test [1] [5]."
    sources = [{"id": 1, "title": "Source 1"}, {"id": 2, "title": "Source 2"}]

    result = citation_service.validate_citations_in_response(response_text, sources)

    assert result["valid"] is False
    assert 5 in result["invalid_citations"]


def test_validate_citations_in_response_no_citations(citation_service):
    """Test validate_citations_in_response with no citations"""
    response_text = "This is a test without citations."
    sources = [{"id": 1, "title": "Source 1"}]

    result = citation_service.validate_citations_in_response(response_text, sources)

    assert len(result["citations_found"]) == 0
    assert len(result["unused_sources"]) == 1


def test_validate_citations_in_response_duplicate_citations(citation_service):
    """Test validate_citations_in_response handles duplicate citations"""
    response_text = "Test [1]. Another [1]. More [1]."
    sources = [{"id": 1, "title": "Source 1"}]

    result = citation_service.validate_citations_in_response(response_text, sources)

    assert result["valid"] is True
    assert len(result["citations_found"]) == 1  # Should deduplicate


def test_validate_citations_in_response_stats(citation_service):
    """Test validate_citations_in_response calculates stats"""
    response_text = "Test [1] [2]."
    sources = [{"id": 1, "title": "Source 1"}, {"id": 2, "title": "Source 2"}]

    result = citation_service.validate_citations_in_response(response_text, sources)

    assert "stats" in result
    assert result["stats"]["total_citations"] == 2
    assert result["stats"]["total_sources"] == 2
    assert result["stats"]["citation_rate"] == 1.0


# ============================================================================
# Tests for append_sources_to_response
# ============================================================================


def test_append_sources_to_response_success(citation_service):
    """Test append_sources_to_response successful"""
    response_text = "This is a test [1]."
    sources = [{"id": 1, "title": "Source 1", "url": "https://example.com", "date": "2024-01-15"}]

    result = citation_service.append_sources_to_response(response_text, sources)

    assert response_text in result
    assert "Sources:" in result
    assert "[1]" in result


def test_append_sources_to_response_no_sources(citation_service):
    """Test append_sources_to_response without sources"""
    response_text = "This is a test."

    result = citation_service.append_sources_to_response(response_text, [])

    assert result == response_text


def test_append_sources_to_response_with_validation(citation_service):
    """Test append_sources_to_response with validation result"""
    response_text = "This is a test [1]."
    sources = [
        {"id": 1, "title": "Source 1"},
        {"id": 2, "title": "Source 2"},
    ]
    validation = {"citations_found": [1]}

    result = citation_service.append_sources_to_response(response_text, sources, validation)

    assert "[1]" in result
    assert "Source 1" in result
    # Source 2 should not be included since it wasn't cited
    assert "Source 2" not in result


def test_append_sources_to_response_no_validation(citation_service):
    """Test append_sources_to_response without validation result"""
    response_text = "This is a test."
    sources = [{"id": 1, "title": "Source 1"}]

    result = citation_service.append_sources_to_response(response_text, sources)

    assert "Source 1" in result


# ============================================================================
# Tests for process_response_with_citations
# ============================================================================


def test_process_response_with_citations_with_rag(citation_service):
    """Test process_response_with_citations with RAG results"""
    response_text = "This is a test [1]."
    rag_results = [
        {
            "metadata": {"title": "Source 1", "url": "https://example.com"},
            "score": 0.85,
        }
    ]

    result = citation_service.process_response_with_citations(response_text, rag_results)

    assert result["has_citations"] is True
    assert len(result["sources"]) == 1
    assert "validation" in result
    assert "response" in result


def test_process_response_with_citations_no_rag(citation_service):
    """Test process_response_with_citations without RAG results"""
    response_text = "This is a test."

    result = citation_service.process_response_with_citations(response_text, None)

    assert result["has_citations"] is False
    assert len(result["sources"]) == 0


def test_process_response_with_citations_auto_append_false(citation_service):
    """Test process_response_with_citations with auto_append=False"""
    response_text = "This is a test [1]."
    rag_results = [
        {
            "metadata": {"title": "Source 1"},
            "score": 0.85,
        }
    ]

    result = citation_service.process_response_with_citations(
        response_text, rag_results, auto_append=False
    )

    assert result["response"] == response_text  # Should not append


def test_process_response_with_citations_no_citations_found(citation_service):
    """Test process_response_with_citations when no citations found"""
    response_text = "This is a test without citations."
    rag_results = [{"metadata": {"title": "Source 1"}, "score": 0.85}]

    result = citation_service.process_response_with_citations(response_text, rag_results)

    assert result["has_citations"] is False
    # Should not append sources if no citations found
    assert result["response"] == response_text


# ============================================================================
# Tests for create_source_metadata_for_frontend
# ============================================================================


def test_create_source_metadata_for_frontend_success(citation_service):
    """Test create_source_metadata_for_frontend successful"""
    sources = [
        {
            "id": 1,
            "title": "Source 1",
            "url": "https://example.com",
            "date": "2024-01-15",
            "type": "rag",
            "category": "immigration",
        }
    ]

    result = citation_service.create_source_metadata_for_frontend(sources)

    assert len(result) == 1
    assert result[0]["id"] == 1
    assert result[0]["title"] == "Source 1"
    assert result[0]["type"] == "rag"
    assert result[0]["category"] == "immigration"


def test_create_source_metadata_for_frontend_defaults(citation_service):
    """Test create_source_metadata_for_frontend with defaults"""
    sources = [{"id": 1}]

    result = citation_service.create_source_metadata_for_frontend(sources)

    assert result[0]["title"] == "Unknown Source"
    assert result[0]["type"] == "rag"
    assert result[0]["category"] == "general"


def test_create_source_metadata_for_frontend_empty(citation_service):
    """Test create_source_metadata_for_frontend with empty list"""
    result = citation_service.create_source_metadata_for_frontend([])

    assert isinstance(result, list)
    assert len(result) == 0


# ============================================================================
# Tests for health_check
# ============================================================================


@pytest.mark.asyncio
async def test_health_check(citation_service):
    """Test health_check"""
    result = await citation_service.health_check()

    assert result["status"] == "healthy"
    assert "features" in result
    assert result["features"]["inline_citations"] is True
    assert result["features"]["citation_validation"] is True
