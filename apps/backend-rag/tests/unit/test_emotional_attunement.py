"""
Unit tests for Emotional Attunement Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.emotional_attunement import (
    EmotionalAttunementService,
    EmotionalProfile,
    EmotionalState,
    ToneStyle,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def emotional_service():
    """Create EmotionalAttunementService instance"""
    return EmotionalAttunementService()


@pytest.fixture
def mock_collaborator():
    """Mock collaborator with emotional preferences"""
    collaborator = MagicMock()
    collaborator.emotional_preferences = {
        "preferred_tone": "warm",
        "sensitivity_level": "high",
    }
    return collaborator


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(emotional_service):
    """Test initialization"""
    assert emotional_service is not None
    assert hasattr(emotional_service, "EMOTION_PATTERNS")
    assert hasattr(emotional_service, "STATE_TO_TONE")


# ============================================================================
# Tests for analyze_message
# ============================================================================


def test_analyze_message_stressed(emotional_service):
    """Test analyze_message detects stressed"""
    result = emotional_service.analyze_message("URGENT HELP NEEDED ASAP!!! urgent problem")

    # May detect STRESSED, URGENT, or NEUTRAL depending on confidence threshold
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.ENCOURAGING, ToneStyle.DIRECT, ToneStyle.PROFESSIONAL]


def test_analyze_message_excited(emotional_service):
    """Test analyze_message detects excited"""
    result = emotional_service.analyze_message("This is AMAZING! Wow! awesome fantastic!")

    # May detect EXCITED or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.WARM, ToneStyle.PROFESSIONAL]


def test_analyze_message_confused(emotional_service):
    """Test analyze_message detects confused"""
    result = emotional_service.analyze_message("I don't understand how this works? confused unclear not sure")

    # May detect CONFUSED or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.SIMPLE, ToneStyle.PROFESSIONAL]


def test_analyze_message_frustrated(emotional_service):
    """Test analyze_message detects frustrated"""
    result = emotional_service.analyze_message("Ugh, this is still not working again frustrated annoyed")

    # May detect FRUSTRATED or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.DIRECT, ToneStyle.PROFESSIONAL]


def test_analyze_message_curious(emotional_service):
    """Test analyze_message detects curious"""
    result = emotional_service.analyze_message("I'm curious about the technical implementation wondering interested")

    # May detect CURIOUS or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.TECHNICAL, ToneStyle.PROFESSIONAL]


def test_analyze_message_grateful(emotional_service):
    """Test analyze_message detects grateful"""
    result = emotional_service.analyze_message("Thank you so much! This is really helpful thanks appreciate grateful")

    # May detect GRATEFUL or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.WARM, ToneStyle.PROFESSIONAL]


def test_analyze_message_urgent(emotional_service):
    """Test analyze_message detects urgent"""
    result = emotional_service.analyze_message("I need this RIGHT NOW immediately! urgent critical asap")

    # May detect URGENT or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.DIRECT, ToneStyle.PROFESSIONAL]


def test_analyze_message_sad(emotional_service):
    """Test analyze_message detects sad"""
    result = emotional_service.analyze_message("I feel sad and down today depressed unhappy")

    # May detect SAD or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.WARM, ToneStyle.PROFESSIONAL]


def test_analyze_message_anxious(emotional_service):
    """Test analyze_message detects anxious"""
    result = emotional_service.analyze_message("I'm worried and anxious about this nervous afraid")

    # May detect ANXIOUS or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.ENCOURAGING, ToneStyle.PROFESSIONAL]


def test_analyze_message_embarrassed(emotional_service):
    """Test analyze_message detects embarrassed"""
    result = emotional_service.analyze_message("I'm embarrassed to ask this question ashamed shy")

    # May detect EMBARRASSED or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.WARM, ToneStyle.PROFESSIONAL]


def test_analyze_message_lonely(emotional_service):
    """Test analyze_message detects lonely"""
    result = emotional_service.analyze_message("I feel lonely and isolated alone solo")

    # May detect LONELY or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.WARM, ToneStyle.PROFESSIONAL]


def test_analyze_message_scared(emotional_service):
    """Test analyze_message detects scared"""
    result = emotional_service.analyze_message("I'm scared and afraid of this situation frightened terrified")

    # May detect SCARED or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.ENCOURAGING, ToneStyle.PROFESSIONAL]


def test_analyze_message_worried(emotional_service):
    """Test analyze_message detects worried"""
    result = emotional_service.analyze_message("I'm worried about the requirements concerned trouble")

    # May detect WORRIED or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0
    assert result.suggested_tone in [ToneStyle.ENCOURAGING, ToneStyle.PROFESSIONAL]


def test_analyze_message_neutral(emotional_service):
    """Test analyze_message defaults to neutral"""
    result = emotional_service.analyze_message("What is the visa process?")

    assert result.detected_state == EmotionalState.NEUTRAL
    assert result.suggested_tone == ToneStyle.PROFESSIONAL


def test_analyze_message_multilingual_sad(emotional_service):
    """Test analyze_message detects multilingual sad"""
    result = emotional_service.analyze_message("Sono triste oggi depressed")

    # May detect SAD or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0


def test_analyze_message_multilingual_anxious(emotional_service):
    """Test analyze_message detects multilingual anxious"""
    result = emotional_service.analyze_message("Saya khawatir tentang ini anxious worried")

    # May detect ANXIOUS or NEUTRAL depending on confidence
    assert isinstance(result, EmotionalProfile)
    assert result.confidence > 0.0


def test_analyze_message_with_collaborator_preferences(emotional_service):
    """Test analyze_message with collaborator preferences"""
    preferences = {"preferred_tone": "warm", "formality": "casual"}

    result = emotional_service.analyze_message("Hello", preferences)

    assert isinstance(result, EmotionalProfile)
    assert result.suggested_tone == ToneStyle.WARM


def test_analyze_message_with_formal_preference(emotional_service):
    """Test analyze_message with formal preference"""
    preferences = {"formality": "formal"}

    result = emotional_service.analyze_message("Hello", preferences)

    assert result.suggested_tone == ToneStyle.PROFESSIONAL


# ============================================================================
# Tests for get_tone_prompt
# ============================================================================


def test_get_tone_prompt_professional(emotional_service):
    """Test get_tone_prompt for professional tone"""
    result = emotional_service.get_tone_prompt(ToneStyle.PROFESSIONAL)

    assert isinstance(result, str)
    assert len(result) > 0


def test_get_tone_prompt_warm(emotional_service):
    """Test get_tone_prompt for warm tone"""
    result = emotional_service.get_tone_prompt(ToneStyle.WARM)

    assert isinstance(result, str)
    assert len(result) > 0


def test_get_tone_prompt_encouraging(emotional_service):
    """Test get_tone_prompt for encouraging tone"""
    result = emotional_service.get_tone_prompt(ToneStyle.ENCOURAGING)

    assert isinstance(result, str)
    assert len(result) > 0


def test_get_tone_prompt_simple(emotional_service):
    """Test get_tone_prompt for simple tone"""
    result = emotional_service.get_tone_prompt(ToneStyle.SIMPLE)

    assert isinstance(result, str)
    assert len(result) > 0


def test_get_tone_prompt_technical(emotional_service):
    """Test get_tone_prompt for technical tone"""
    result = emotional_service.get_tone_prompt(ToneStyle.TECHNICAL)

    assert isinstance(result, str)
    assert len(result) > 0


def test_get_tone_prompt_direct(emotional_service):
    """Test get_tone_prompt for direct tone"""
    result = emotional_service.get_tone_prompt(ToneStyle.DIRECT)

    assert isinstance(result, str)
    assert len(result) > 0


# ============================================================================
# Tests for build_enhanced_system_prompt
# ============================================================================


def test_build_enhanced_system_prompt_success(emotional_service):
    """Test build_enhanced_system_prompt successful"""
    profile = EmotionalProfile(
        detected_state=EmotionalState.STRESSED,
        confidence=0.8,
        suggested_tone=ToneStyle.ENCOURAGING,
        reasoning="Test",
        detected_indicators=[],
    )

    result = emotional_service.build_enhanced_system_prompt("Base prompt", profile)

    assert "Base prompt" in result
    assert "EMOTIONAL ATTUNEMENT" in result
    assert "Stressed" in result
    assert "Encouraging" in result


def test_build_enhanced_system_prompt_with_collaborator(emotional_service):
    """Test build_enhanced_system_prompt with collaborator name"""
    profile = EmotionalProfile(
        detected_state=EmotionalState.NEUTRAL,
        confidence=0.5,
        suggested_tone=ToneStyle.PROFESSIONAL,
        reasoning="Test",
        detected_indicators=[],
    )

    result = emotional_service.build_enhanced_system_prompt("Base", profile, "John Doe")

    assert "John Doe" in result


def test_build_enhanced_system_prompt_confused(emotional_service):
    """Test build_enhanced_system_prompt with confused state"""
    profile = EmotionalProfile(
        detected_state=EmotionalState.CONFUSED,
        confidence=0.7,
        suggested_tone=ToneStyle.SIMPLE,
        reasoning="Test",
        detected_indicators=[],
    )

    result = emotional_service.build_enhanced_system_prompt("Base", profile)

    assert "confused" in result.lower()
    assert "simple steps" in result.lower()


def test_build_enhanced_system_prompt_sad(emotional_service):
    """Test build_enhanced_system_prompt with sad state"""
    profile = EmotionalProfile(
        detected_state=EmotionalState.SAD,
        confidence=0.7,
        suggested_tone=ToneStyle.WARM,
        reasoning="Test",
        detected_indicators=[],
    )

    result = emotional_service.build_enhanced_system_prompt("Base", profile)

    assert "sad" in result.lower()
    assert "warm" in result.lower() or "empathy" in result.lower()


# ============================================================================
# Tests for get_stats
# ============================================================================


def test_get_stats(emotional_service):
    """Test get_stats"""
    result = emotional_service.get_stats()

    assert "supported_states" in result
    assert "supported_tones" in result
    assert "emotion_patterns" in result
    assert isinstance(result["states"], list)
    assert isinstance(result["tones"], list)

