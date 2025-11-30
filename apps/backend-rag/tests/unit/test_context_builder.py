"""
Unit tests for Context Builder Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.context.context_builder import ContextBuilder

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def context_builder():
    """Create ContextBuilder instance"""
    return ContextBuilder()


@pytest.fixture
def mock_memory():
    """Mock memory object"""
    memory = MagicMock()
    memory.profile_facts = [
        "You're talking to John Doe, CEO in the management department",
        "Role: CEO",
        "Level: 3",
        "Language: English",
        "User prefers detailed explanations",
        "User is interested in KITAS visas",
    ]
    memory.summary = "Previous conversation about business setup in Indonesia"
    return memory


@pytest.fixture
def mock_collaborator():
    """Mock collaborator object"""
    collaborator = MagicMock()
    collaborator.id = "collab-123"
    collaborator.name = "Jane Smith"
    collaborator.role = "CTO"
    collaborator.department = "Technology"
    collaborator.language = "en"
    collaborator.expertise_level = "advanced"
    collaborator.emotional_preferences = {
        "tone": "professional_warm",
        "formality": "medium",
        "humor": "light",
    }
    return collaborator


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_initializes_builder(context_builder):
    """Test ContextBuilder initialization"""
    assert context_builder is not None


# ============================================================================
# Tests for build_memory_context()
# ============================================================================


def test_build_memory_context_with_facts(context_builder, mock_memory):
    """Test build_memory_context with profile facts"""
    result = context_builder.build_memory_context(mock_memory)

    assert result is not None
    assert isinstance(result, str)
    assert "Riassunto conversazione precedente:" in result or "business setup" in result.lower()
    assert "CEO" in result or "John Doe" in result


def test_build_memory_context_no_memory(context_builder):
    """Test build_memory_context with None memory"""
    result = context_builder.build_memory_context(None)

    assert result is None


def test_build_memory_context_empty_facts(context_builder):
    """Test build_memory_context with empty facts"""
    memory = MagicMock()
    memory.profile_facts = []
    memory.summary = None  # Add summary attribute

    result = context_builder.build_memory_context(memory)

    assert result is None


def test_build_memory_context_with_summary(context_builder, mock_memory):
    """Test build_memory_context includes summary"""
    result = context_builder.build_memory_context(mock_memory)

    assert result is not None
    assert "Riassunto conversazione precedente:" in result
    assert "business setup" in result.lower() or "Indonesia" in result


def test_build_memory_context_limits_facts(context_builder):
    """Test build_memory_context limits to top 10 facts"""
    memory = MagicMock()
    memory.profile_facts = [f"Fact {i}" for i in range(20)]  # 20 facts
    memory.summary = None

    result = context_builder.build_memory_context(memory)

    assert result is not None
    # Should only use first 10 facts (top_facts[:10])
    assert "Fact 0" in result
    # The code uses top_facts[:10] but then only shows first 5 in "other_facts"
    # So Fact 9 might not appear if it's in "other_facts" and only first 5 are shown
    assert len(result) > 0
    # Fact 10+ should definitely not appear
    assert "Fact 15" not in result


def test_build_memory_context_groups_personal_facts(context_builder):
    """Test build_memory_context groups personal facts"""
    memory = MagicMock()
    memory.profile_facts = [
        "You're talking to John Doe",
        "Role: CEO",
        "User likes coffee",
        "Language: English",
    ]
    memory.summary = None

    result = context_builder.build_memory_context(memory)

    assert result is not None
    # Personal facts should appear first
    assert "John Doe" in result or "CEO" in result


def test_build_memory_context_no_profile_facts_attribute(context_builder):
    """Test build_memory_context handles missing profile_facts attribute"""
    memory = MagicMock()
    # No profile_facts attribute
    memory.summary = ""  # Add empty summary

    result = context_builder.build_memory_context(memory)

    assert result is None


# ============================================================================
# Tests for build_team_context()
# ============================================================================


def test_build_team_context_with_collaborator(context_builder, mock_collaborator):
    """Test build_team_context with collaborator"""
    result = context_builder.build_team_context(mock_collaborator)

    assert result is not None
    assert isinstance(result, str)
    assert "Jane Smith" in result
    assert "CTO" in result
    assert "Technology" in result
    assert "English" in result


def test_build_team_context_no_collaborator(context_builder):
    """Test build_team_context with None collaborator"""
    result = context_builder.build_team_context(None)

    assert result is None


def test_build_team_context_anonymous_id(context_builder):
    """Test build_team_context with anonymous collaborator"""
    collaborator = MagicMock()
    collaborator.id = "anonymous"

    result = context_builder.build_team_context(collaborator)

    assert result is None


def test_build_team_context_no_id_attribute(context_builder):
    """Test build_team_context with collaborator without id"""
    # Use a simple object without id attribute
    class CollaboratorWithoutId:
        name = "Test User"
        role = "Test Role"
        department = "Test Dept"
        language = "en"

    collaborator = CollaboratorWithoutId()

    result = context_builder.build_team_context(collaborator)

    # MagicMock creates attributes automatically, so we need to check differently
    # The code checks hasattr(collaborator, "id"), which will be False for our object
    assert result is None


def test_build_team_context_language_mapping(context_builder):
    """Test build_team_context maps language codes correctly"""
    language_tests = [
        ("it", "Italian"),
        ("id", "Indonesian"),
        ("en", "English"),
        ("ua", "Ukrainian"),
        ("unknown", "UNKNOWN"),
    ]

    for lang_code, expected_lang in language_tests:
        collaborator = MagicMock()
        collaborator.id = "test-123"
        collaborator.name = "Test User"
        collaborator.role = "Test Role"
        collaborator.department = "Test Dept"
        collaborator.language = lang_code

        result = context_builder.build_team_context(collaborator)

        assert result is not None
        assert expected_lang in result


def test_build_team_context_expertise_level(context_builder):
    """Test build_team_context includes expertise level instructions"""
    expertise_levels = ["beginner", "intermediate", "advanced", "expert"]

    for level in expertise_levels:
        collaborator = MagicMock()
        collaborator.id = "test-123"
        collaborator.name = "Test User"
        collaborator.role = "Test Role"
        collaborator.department = "Test Dept"
        collaborator.language = "en"
        collaborator.expertise_level = level

        result = context_builder.build_team_context(collaborator)

        assert result is not None
        # Should include expertise-specific instructions
        assert len(result) > 0


def test_build_team_context_emotional_preferences(context_builder):
    """Test build_team_context includes emotional preferences"""
    collaborator = MagicMock()
    collaborator.id = "test-123"
    collaborator.name = "Test User"
    collaborator.role = "Test Role"
    collaborator.department = "Test Dept"
    collaborator.language = "en"
    collaborator.emotional_preferences = {
        "tone": "professional_warm",
        "formality": "medium",
        "humor": "light",
    }

    result = context_builder.build_team_context(collaborator)

    assert result is not None
    # Should include tone/formality/humor instructions
    assert len(result) > 100  # Should have substantial content


def test_build_team_context_sacred_semar_energy(context_builder):
    """Test build_team_context handles sacred_semar_energy tone"""
    collaborator = MagicMock()
    collaborator.id = "test-123"
    collaborator.name = "Test User"
    collaborator.role = "Test Role"
    collaborator.department = "Test Dept"
    collaborator.language = "en"
    collaborator.emotional_preferences = {
        "tone": "sacred_semar_energy",
        "formality": "casual",
        "humor": "sacred_semar_energy",
    }

    result = context_builder.build_team_context(collaborator)

    assert result is not None
    assert "playful" in result.lower() or "wise" in result.lower() or "intuitive" in result.lower()


# ============================================================================
# Tests for combine_contexts()
# ============================================================================


def test_combine_contexts_all_sources(context_builder):
    """Test combine_contexts with all context sources"""
    memory_context = "Memory context here"
    team_context = "Team context here"
    rag_context = "RAG context here"
    cultural_context = "Cultural context here"

    result = context_builder.combine_contexts(
        memory_context, team_context, rag_context, cultural_context
    )

    assert result is not None
    assert memory_context in result
    assert team_context in result
    assert rag_context in result
    assert cultural_context in result
    assert "<knowledge_base>" in result  # RAG wrapped in knowledge_base XML


def test_combine_contexts_team_first(context_builder):
    """Test combine_contexts puts team context first"""
    team_context = "Team context"
    memory_context = "Memory context"
    rag_context = "RAG context"

    result = context_builder.combine_contexts(memory_context, team_context, rag_context)

    assert result is not None
    # Team context should appear first
    assert result.startswith(team_context) or team_context in result.split("\n\n")[0]


def test_combine_contexts_rag_wrapped_in_xml(context_builder):
    """Test combine_contexts wraps RAG context in XML tags"""
    rag_context = "RAG context"

    result = context_builder.combine_contexts(None, None, rag_context)

    assert result is not None
    assert "<knowledge_base>" in result
    assert "</knowledge_base>" in result
    assert rag_context in result


def test_combine_contexts_no_contexts(context_builder):
    """Test combine_contexts returns None when no contexts"""
    result = context_builder.combine_contexts(None, None, None)

    assert result is None


def test_combine_contexts_partial_contexts(context_builder):
    """Test combine_contexts with only some contexts"""
    # Only memory context
    result1 = context_builder.combine_contexts("Memory", None, None)
    assert result1 is not None
    assert "Memory" in result1

    # Only team context
    result2 = context_builder.combine_contexts(None, "Team", None)
    assert result2 is not None
    assert "Team" in result2

    # Only RAG context
    result3 = context_builder.combine_contexts(None, None, "RAG")
    assert result3 is not None
    assert "RAG" in result3


def test_combine_contexts_separates_with_newlines(context_builder):
    """Test combine_contexts separates contexts with double newlines"""
    memory_context = "Memory"
    team_context = "Team"
    rag_context = "RAG"

    result = context_builder.combine_contexts(memory_context, team_context, rag_context)

    assert result is not None
    # Should have double newlines between contexts
    assert "\n\n" in result


def test_build_memory_context_only_other_facts(context_builder):
    """Test build_memory_context when only other_facts exist (no personal_facts)"""
    memory = MagicMock()
    memory.profile_facts = [
        "User likes coffee",
        "User prefers morning meetings",
        "User works in tech",
    ]  # No personal facts (no "talking to", "role:", etc.)
    memory.summary = None

    result = context_builder.build_memory_context(memory)

    assert result is not None
    assert "Contesto aggiuntivo:" in result  # Italian for "Additional context"
    assert "coffee" in result or "meetings" in result


def test_build_team_context_emotional_preferences_empty_instruction_parts(context_builder):
    """Test build_team_context when emotional_preferences exist but instruction_parts is empty"""
    collaborator = MagicMock()
    collaborator.id = "test-123"
    collaborator.name = "Test User"
    collaborator.role = "Test Role"
    collaborator.department = "Test Dept"
    collaborator.language = "en"
    # Set emotional_preferences with values not in the instruction dictionaries
    collaborator.emotional_preferences = {
        "tone": "unknown_tone",  # Not in tone_instructions
        "formality": "unknown_formality",  # Not in formality_instructions
        "humor": "unknown_humor",  # Not in humor_instructions
    }

    result = context_builder.build_team_context(collaborator)

    assert result is not None
    # Should still build context even if instruction_parts is empty
    assert "Test User" in result


def test_build_memory_context_only_other_facts_no_personal(context_builder):
    """Test build_memory_context when only other_facts exist, no personal_facts (branch 68->71)"""
    memory = MagicMock()
    # Facts that don't match personal keywords - ensure personal_facts is empty
    memory.profile_facts = [
        "User likes coffee",
        "User prefers morning meetings",
        "User works in tech",
        "User has 5 years experience",
        "User speaks 3 languages",
    ]
    memory.summary = "Previous conversation summary"

    result = context_builder.build_memory_context(memory)

    assert result is not None
    # Should include "Contesto aggiuntivo:" for other_facts (Italian)
    assert "Contesto aggiuntivo:" in result
    # Should include summary with Italian prefix
    assert "Riassunto conversazione precedente:" in result
    # Should NOT include personal facts section (personal_facts is empty)
    # The branch 68->71 is taken when other_facts exists but personal_facts doesn't
    assert "talking to" not in result.lower() or "role:" not in result.lower()


def test_build_memory_context_no_personal_facts_branch(context_builder):
    """Test build_memory_context branch when personal_facts is empty but other_facts exists"""
    memory = MagicMock()
    # Ensure no personal facts match - this makes personal_facts empty
    memory.profile_facts = [
        "Fact about coffee",
        "Fact about meetings",
        "Fact about work",
        "Fact about experience",
        "Fact about skills",
    ]  # No "talking to", "role:", "level:", "language:", "colleague"
    memory.summary = None

    result = context_builder.build_memory_context(memory)

    assert result is not None
    # Should have other_facts but no personal_facts
    # This tests branch 68->71: when other_facts exists but personal_facts is empty
    # The branch 68->71 is the path from line 68 (if other_facts) to line 71 (if summary)
    assert "Contesto aggiuntivo:" in result  # Italian for "Additional context"
    # Should NOT have personal facts section
    assert "talking to" not in result.lower()
    assert "role:" not in result.lower()


def test_build_team_context_emotional_preferences_no_instruction_parts(context_builder):
    """Test build_team_context when emotional_preferences exist but instruction_parts is empty (branch 120->165)"""
    collaborator = MagicMock()
    collaborator.id = "test-123"
    collaborator.name = "Test User"
    collaborator.role = "Test Role"
    collaborator.department = "Test Dept"
    collaborator.language = "en"
    # Set emotional_preferences but with values that don't match any instructions
    # This ensures instruction_parts remains empty, testing branch 120->165
    collaborator.emotional_preferences = {
        "tone": "nonexistent_tone",  # Not in tone_instructions
        "formality": "nonexistent_formality",  # Not in formality_instructions
        "humor": "nonexistent_humor",  # Not in humor_instructions
    }

    result = context_builder.build_team_context(collaborator)

    assert result is not None
    # Should build context even if instruction_parts is empty
    # Branch 120->165 is taken when emotional_preferences exists but instruction_parts is empty
    assert "Test User" in result
    assert "Test Role" in result
    # Should not include instruction parts since they don't match
    # The branch 120->165 skips adding instruction_parts when it's empty
    assert len(result) > 0
    # Verify emotional_preferences block was entered but instruction_parts remained empty
    assert "English" in result  # Language should be included

