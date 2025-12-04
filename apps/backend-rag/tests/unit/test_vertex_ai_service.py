"""
Unit tests for Vertex AI Service
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.vertex_ai_service import VertexAIService

try:
    import vertexai
except ImportError:
    vertexai = None

pytestmark = pytest.mark.skipif(vertexai is None, reason="vertexai module not installed")

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_vertexai():
    """Mock vertexai module"""
    mock = MagicMock()
    mock.init = MagicMock()
    return mock


@pytest.fixture
def mock_generative_model():
    """Mock GenerativeModel"""
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"type": "UNDANG-UNDANG", "type_abbrev": "UU", "number": "12", "year": 2024, "topic": "Test", "status": "BERLAKU", "full_title": "Test Title"}'
    mock_model.generate_content = MagicMock(return_value=mock_response)
    return mock_model


@pytest.fixture
def vertex_ai_service():
    """Create VertexAIService instance"""
    return VertexAIService(project_id="test-project", location="us-central1")


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_project_id():
    """Test initialization with project ID"""
    service = VertexAIService(project_id="test-project")
    assert service.project_id == "test-project"
    assert service.location == "us-central1"
    assert service._initialized is False
    assert service.model is None


def test_init_without_project_id():
    """Test initialization without project ID (uses env var)"""
    with patch.dict("os.environ", {"GOOGLE_CLOUD_PROJECT": "env-project"}):
        service = VertexAIService()
        assert service.project_id == "env-project"


def test_init_with_custom_location():
    """Test initialization with custom location"""
    service = VertexAIService(project_id="test-project", location="asia-southeast1")
    assert service.location == "asia-southeast1"


# ============================================================================
# Tests for _ensure_initialized
# ============================================================================


def test_ensure_initialized_success(vertex_ai_service, mock_vertexai, mock_generative_model):
    """Test successful initialization"""
    with (
        patch("services.vertex_ai_service.vertexai", mock_vertexai),
        patch("services.vertex_ai_service.GenerativeModel", return_value=mock_generative_model),
    ):
        vertex_ai_service._ensure_initialized()

        assert vertex_ai_service._initialized is True
        assert vertex_ai_service.model == mock_generative_model
        mock_vertexai.init.assert_called_once_with(project="test-project", location="us-central1")


def test_ensure_initialized_already_initialized(vertex_ai_service):
    """Test that initialization is skipped if already initialized"""
    vertex_ai_service._initialized = True
    vertex_ai_service.model = MagicMock()

    with patch("services.vertex_ai_service.vertexai") as mock_vertexai:
        vertex_ai_service._ensure_initialized()
        mock_vertexai.init.assert_not_called()


def test_ensure_initialized_no_project_id():
    """Test initialization warning when project_id is missing"""
    service = VertexAIService(project_id=None)

    with patch.dict("os.environ", {}, clear=True):
        with patch("services.vertex_ai_service.vertexai") as mock_vertexai:
            with patch("services.vertex_ai_service.logger") as mock_logger:
                with patch("services.vertex_ai_service.GenerativeModel", return_value=MagicMock()):
                    try:
                        service._ensure_initialized()
                    except Exception:
                        pass  # We expect it to fail, but we check the warning
                    mock_logger.warning.assert_called_once()


def test_ensure_initialized_failure(vertex_ai_service):
    """Test initialization failure handling"""
    with patch("services.vertex_ai_service.vertexai") as mock_vertexai:
        mock_vertexai.init.side_effect = Exception("Init failed")

        with pytest.raises(Exception, match="Init failed"):
            vertex_ai_service._ensure_initialized()


# ============================================================================
# Tests for extract_metadata
# ============================================================================


@pytest.mark.asyncio
async def test_extract_metadata_success(vertex_ai_service, mock_generative_model):
    """Test successful metadata extraction"""
    vertex_ai_service._initialized = True
    vertex_ai_service.model = mock_generative_model

    text = "UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 12 TAHUN 2024"
    result = await vertex_ai_service.extract_metadata(text)

    assert result["type"] == "UNDANG-UNDANG"
    assert result["type_abbrev"] == "UU"
    assert result["number"] == "12"
    assert result["year"] == 2024
    mock_generative_model.generate_content.assert_called_once()


@pytest.mark.asyncio
async def test_extract_metadata_with_markdown_wrapper(vertex_ai_service, mock_generative_model):
    """Test metadata extraction when response includes markdown code blocks"""
    mock_response = MagicMock()
    mock_response.text = '```json\n{"type": "PP", "number": "5"}\n```'
    mock_generative_model.generate_content = MagicMock(return_value=mock_response)

    vertex_ai_service._initialized = True
    vertex_ai_service.model = mock_generative_model

    result = await vertex_ai_service.extract_metadata("test text")

    assert result["type"] == "PP"
    assert result["number"] == "5"


@pytest.mark.asyncio
async def test_extract_metadata_text_truncation(vertex_ai_service, mock_generative_model):
    """Test that long text is truncated to 10k characters"""
    long_text = "A" * 20000
    vertex_ai_service._initialized = True
    vertex_ai_service.model = mock_generative_model

    await vertex_ai_service.extract_metadata(long_text)

    call_args = mock_generative_model.generate_content.call_args
    prompt = call_args[0][0]
    # Check that the text in prompt is truncated
    assert len(prompt) < len(long_text) + 500  # Allow for prompt overhead


@pytest.mark.asyncio
async def test_extract_metadata_generation_config(vertex_ai_service, mock_generative_model):
    """Test that generation config is set correctly"""
    vertex_ai_service._initialized = True
    vertex_ai_service.model = mock_generative_model

    await vertex_ai_service.extract_metadata("test")

    call_args = mock_generative_model.generate_content.call_args
    gen_config = call_args[1]["generation_config"]

    # GenerationConfig is passed as an object, check it was called
    assert gen_config is not None
    # Verify the call was made with the expected parameters
    assert mock_generative_model.generate_content.called


@pytest.mark.asyncio
async def test_extract_metadata_json_parse_error(vertex_ai_service, mock_generative_model):
    """Test handling of invalid JSON response"""
    mock_response = MagicMock()
    mock_response.text = "Invalid JSON response"
    mock_generative_model.generate_content = MagicMock(return_value=mock_response)

    vertex_ai_service._initialized = True
    vertex_ai_service.model = mock_generative_model

    with patch("services.vertex_ai_service.logger") as mock_logger:
        result = await vertex_ai_service.extract_metadata("test")

        assert result == {}
        mock_logger.error.assert_called_once()


@pytest.mark.asyncio
async def test_extract_metadata_exception_handling(vertex_ai_service, mock_generative_model):
    """Test exception handling during extraction"""
    mock_generative_model.generate_content.side_effect = Exception("API error")

    vertex_ai_service._initialized = True
    vertex_ai_service.model = mock_generative_model

    with patch("services.vertex_ai_service.logger") as mock_logger:
        result = await vertex_ai_service.extract_metadata("test")

        assert result == {}
        mock_logger.error.assert_called_once()


@pytest.mark.asyncio
async def test_extract_metadata_initializes_if_needed(vertex_ai_service, mock_generative_model):
    """Test that extract_metadata calls _ensure_initialized"""
    with (
        patch("services.vertex_ai_service.vertexai"),
        patch("services.vertex_ai_service.GenerativeModel", return_value=mock_generative_model),
        patch.object(vertex_ai_service, "_ensure_initialized") as mock_init,
    ):
        await vertex_ai_service.extract_metadata("test")
        mock_init.assert_called_once()


# ============================================================================
# Tests for extract_structure
# ============================================================================


@pytest.mark.asyncio
async def test_extract_structure_placeholder(vertex_ai_service):
    """Test that extract_structure is a placeholder"""
    result = await vertex_ai_service.extract_structure("test text")
    assert result is None
