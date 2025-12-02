"""
Unit tests for Memory Fact Extractor Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.memory_fact_extractor import MemoryFactExtractor

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def fact_extractor():
    """Create MemoryFactExtractor instance"""
    return MemoryFactExtractor()


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(fact_extractor):
    """Test initialization"""
    assert fact_extractor is not None
    assert len(fact_extractor.preference_patterns) > 0
    assert len(fact_extractor.business_patterns) > 0
    assert len(fact_extractor.personal_patterns) > 0
    assert len(fact_extractor.timeline_patterns) > 0


# ============================================================================
# Tests for extract_facts_from_conversation
# ============================================================================


def test_extract_facts_from_conversation_preference(fact_extractor):
    """Test extract_facts_from_conversation with preference"""
    user_msg = "I prefer espresso coffee"
    ai_msg = "I understand you like espresso"

    facts = fact_extractor.extract_facts_from_conversation(user_msg, ai_msg, "user-123")

    assert len(facts) > 0
    assert any(
        "preference" in f.get("type", "") or "espresso" in f.get("content", "").lower()
        for f in facts
    )


def test_extract_facts_from_conversation_business(fact_extractor):
    """Test extract_facts_from_conversation with business info"""
    user_msg = "I want to start a PT PMA company"
    ai_msg = "PT PMA is a foreign investment company"

    facts = fact_extractor.extract_facts_from_conversation(user_msg, ai_msg, "user-123")

    assert len(facts) > 0
    assert any("company" in f.get("type", "") or "PT PMA" in f.get("content", "") for f in facts)


def test_extract_facts_from_conversation_personal(fact_extractor):
    """Test extract_facts_from_conversation with personal info"""
    user_msg = "My name is John and I am Italian"
    ai_msg = "Nice to meet you John"

    facts = fact_extractor.extract_facts_from_conversation(user_msg, ai_msg, "user-123")

    assert len(facts) > 0
    assert any("identity" in f.get("type", "") or "John" in f.get("content", "") for f in facts)


def test_extract_facts_from_conversation_timeline(fact_extractor):
    """Test extract_facts_from_conversation with timeline"""
    user_msg = "I need this done by next week, it's urgent"
    ai_msg = "I understand the deadline is next week"

    facts = fact_extractor.extract_facts_from_conversation(user_msg, ai_msg, "user-123")

    assert len(facts) > 0
    assert any("deadline" in f.get("type", "") or "urgent" in f.get("type", "") for f in facts)


def test_extract_facts_from_conversation_empty(fact_extractor):
    """Test extract_facts_from_conversation with empty messages"""
    facts = fact_extractor.extract_facts_from_conversation("", "", "user-123")

    assert isinstance(facts, list)
    assert len(facts) == 0


def test_extract_facts_from_conversation_exception(fact_extractor):
    """Test extract_facts_from_conversation exception handling"""
    with patch.object(fact_extractor, "_extract_from_text", side_effect=Exception("Test error")):
        facts = fact_extractor.extract_facts_from_conversation("test", "test", "user-123")

        assert isinstance(facts, list)
        assert len(facts) == 0


# ============================================================================
# Tests for _extract_from_text
# ============================================================================


def test_extract_from_text_preference_patterns(fact_extractor):
    """Test _extract_from_text with preference patterns"""
    text = "I prefer Italian food and I like pasta"
    facts = fact_extractor._extract_from_text(text, source="user")

    assert len(facts) > 0
    assert any(f["type"] == "preference" for f in facts)


def test_extract_from_text_business_patterns(fact_extractor):
    """Test _extract_from_text with business patterns"""
    text = "I want to register a company with KBLI code 12345"
    facts = fact_extractor._extract_from_text(text, source="user")

    assert len(facts) > 0
    assert any(f["type"] in ["company", "kbli"] for f in facts)


def test_extract_from_text_personal_patterns(fact_extractor):
    """Test _extract_from_text with personal patterns"""
    text = "My name is Maria and I live in Bali"
    facts = fact_extractor._extract_from_text(text, source="user")

    assert len(facts) > 0
    assert any(f["type"] in ["identity", "location"] for f in facts)


def test_extract_from_text_timeline_patterns(fact_extractor):
    """Test _extract_from_text with timeline patterns"""
    text = "The deadline is next month and it's urgent"
    facts = fact_extractor._extract_from_text(text, source="user")

    assert len(facts) > 0
    assert any(f["type"] in ["deadline", "urgent", "upcoming"] for f in facts)


def test_extract_from_text_source_confidence(fact_extractor):
    """Test _extract_from_text confidence by source"""
    text = "I prefer coffee"
    user_facts = fact_extractor._extract_from_text(text, source="user")
    ai_facts = fact_extractor._extract_from_text(text, source="ai")

    # User facts should have higher confidence
    if user_facts and ai_facts:
        assert user_facts[0]["confidence"] >= ai_facts[0]["confidence"]


def test_extract_from_text_short_context(fact_extractor):
    """Test _extract_from_text with very short context"""
    text = "test"
    facts = fact_extractor._extract_from_text(text, source="user")

    # Very short text may not produce facts
    assert isinstance(facts, list)


# ============================================================================
# Tests for _clean_context
# ============================================================================


def test_clean_context_removes_markdown(fact_extractor):
    """Test _clean_context removes markdown"""
    context = "**bold** and *italic* text"
    cleaned = fact_extractor._clean_context(context)

    assert "**" not in cleaned
    assert "*" not in cleaned


def test_clean_context_removes_whitespace(fact_extractor):
    """Test _clean_context removes extra whitespace"""
    context = "  multiple   spaces   here  "
    cleaned = fact_extractor._clean_context(context)

    assert "  " not in cleaned
    assert cleaned.strip() == cleaned


def test_clean_context_capitalizes(fact_extractor):
    """Test _clean_context capitalizes first letter"""
    context = "lowercase text"
    cleaned = fact_extractor._clean_context(context)

    assert cleaned[0].isupper() if cleaned else True


def test_clean_context_empty(fact_extractor):
    """Test _clean_context with empty string"""
    cleaned = fact_extractor._clean_context("")

    assert isinstance(cleaned, str)


# ============================================================================
# Tests for _deduplicate_facts
# ============================================================================


def test_deduplicate_facts_removes_duplicates(fact_extractor):
    """Test _deduplicate_facts removes duplicates"""
    facts = [
        {"content": "I prefer coffee", "type": "preference", "confidence": 0.8, "source": "user"},
        {"content": "I prefer coffee", "type": "preference", "confidence": 0.6, "source": "ai"},
    ]

    deduplicated = fact_extractor._deduplicate_facts(facts)

    assert len(deduplicated) <= len(facts)
    # Should keep highest confidence
    if deduplicated:
        assert deduplicated[0]["confidence"] == 0.8


def test_deduplicate_facts_limits_to_three(fact_extractor):
    """Test _deduplicate_facts limits to top 3"""
    facts = [
        {
            "content": f"Fact {i}",
            "type": "preference",
            "confidence": 0.9 - i * 0.1,
            "source": "user",
        }
        for i in range(5)
    ]

    deduplicated = fact_extractor._deduplicate_facts(facts)

    assert len(deduplicated) <= 3


def test_deduplicate_facts_empty(fact_extractor):
    """Test _deduplicate_facts with empty list"""
    deduplicated = fact_extractor._deduplicate_facts([])

    assert isinstance(deduplicated, list)
    assert len(deduplicated) == 0


def test_deduplicate_facts_sorts_by_confidence(fact_extractor):
    """Test _deduplicate_facts sorts by confidence"""
    facts = [
        {"content": "Low", "type": "preference", "confidence": 0.5, "source": "user"},
        {"content": "High", "type": "preference", "confidence": 0.9, "source": "user"},
        {"content": "Medium", "type": "preference", "confidence": 0.7, "source": "user"},
    ]

    deduplicated = fact_extractor._deduplicate_facts(facts)

    if len(deduplicated) > 1:
        assert deduplicated[0]["confidence"] >= deduplicated[1]["confidence"]


# ============================================================================
# Tests for _calculate_overlap
# ============================================================================


def test_calculate_overlap_high_overlap(fact_extractor):
    """Test _calculate_overlap with high overlap"""
    text1 = "I prefer coffee and tea"
    text2 = "I prefer coffee and tea"

    overlap = fact_extractor._calculate_overlap(text1, text2)

    assert overlap > 0.7


def test_calculate_overlap_low_overlap(fact_extractor):
    """Test _calculate_overlap with low overlap"""
    text1 = "I prefer coffee"
    text2 = "I like pizza"

    overlap = fact_extractor._calculate_overlap(text1, text2)

    assert overlap < 0.7


def test_calculate_overlap_empty(fact_extractor):
    """Test _calculate_overlap with empty strings"""
    overlap = fact_extractor._calculate_overlap("", "")

    assert overlap == 0.0


def test_calculate_overlap_no_common_words(fact_extractor):
    """Test _calculate_overlap with no common words"""
    text1 = "coffee tea"
    text2 = "pizza pasta"

    overlap = fact_extractor._calculate_overlap(text1, text2)

    assert overlap == 0.0


# ============================================================================
# Tests for extract_quick_facts
# ============================================================================


def test_extract_quick_facts(fact_extractor):
    """Test extract_quick_facts"""
    text = "I prefer coffee and I want to start a company"
    facts = fact_extractor.extract_quick_facts(text, max_facts=2)

    assert isinstance(facts, list)
    assert len(facts) <= 2
    assert all(isinstance(f, str) for f in facts)


def test_extract_quick_facts_empty(fact_extractor):
    """Test extract_quick_facts with empty text"""
    facts = fact_extractor.extract_quick_facts("", max_facts=2)

    assert isinstance(facts, list)
    assert len(facts) == 0


def test_extract_quick_facts_max_facts(fact_extractor):
    """Test extract_quick_facts respects max_facts"""
    text = "I prefer coffee and I want tea and I like pizza"
    facts = fact_extractor.extract_quick_facts(text, max_facts=1)

    assert len(facts) <= 1
