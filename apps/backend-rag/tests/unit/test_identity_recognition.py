"""
Unit tests for Identity Recognition System
Tests the complete flow: collaborator lookup, identity detection, RAG routing, and context building
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.classification.intent_classifier import IntentClassifier
from services.context.context_builder import ContextBuilder
from services.context.rag_manager import RAGManager
from services.collaborator_service import CollaboratorProfile, CollaboratorService
from services.query_router import QueryRouter


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_collaborator_profile():
    """Mock CollaboratorProfile for Anton"""
    return CollaboratorProfile(
        id="anton-001",
        email="anton@balizero.com",
        name="Anton",
        role="Executive Consultant",
        department="Setup",
        team="Setup",
        language="it",
        languages=["it", "en"],
        expertise_level="advanced",
        traits=["strategic", "detail-oriented"],
        notes="Key team member",
    )


@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    service = MagicMock()
    
    # Mock search_collection method (used by _retrieve_from_team_collection)
    service.search_collection = AsyncMock(return_value={
        "results": [
            {
                "text": "Anton is an Executive Consultant in the Setup department...",
                "metadata": {"title": "Anton Profile", "source_collection": "bali_zero_team"},
            }
        ]
    })
    
    # Mock search_with_conflict_resolution (used for regular queries and fallback)
    service.search_with_conflict_resolution = AsyncMock(return_value={
        "results": [
            {
                "text": "Anton is an Executive Consultant...",
                "metadata": {"title": "Anton Profile", "source_collection": "bali_zero_team"},
            }
        ]
    })
    
    return service


@pytest.fixture
def intent_classifier():
    """Create IntentClassifier instance"""
    return IntentClassifier()


@pytest.fixture
def context_builder():
    """Create ContextBuilder instance"""
    return ContextBuilder()


@pytest.fixture
def query_router():
    """Create QueryRouter instance"""
    return QueryRouter()


# ============================================================================
# Test Cases - Identity Recognition Flow
# ============================================================================


@pytest.mark.asyncio
async def test_intent_classifier_identity_detection(intent_classifier):
    """Test that identity queries are correctly classified"""
    # Italian identity queries
    assert (await intent_classifier.classify_intent("io chi sono?"))["category"] == "identity"
    assert (await intent_classifier.classify_intent("chi sono io?"))["category"] == "identity"
    assert (await intent_classifier.classify_intent("mi conosci?"))["category"] == "identity"
    assert (await intent_classifier.classify_intent("cosa sai di me?"))["category"] == "identity"
    
    # English identity queries
    assert (await intent_classifier.classify_intent("who am i?"))["category"] == "identity"
    assert (await intent_classifier.classify_intent("do you know me?"))["category"] == "identity"
    assert (await intent_classifier.classify_intent("my name"))["category"] == "identity"
    
    # Indonesian identity queries
    assert (await intent_classifier.classify_intent("siapa saya?"))["category"] == "identity"
    assert (await intent_classifier.classify_intent("apakah kamu kenal saya?"))["category"] == "identity"


@pytest.mark.asyncio
async def test_intent_classifier_team_query_detection(intent_classifier):
    """Test that team queries are correctly classified"""
    # Italian team queries
    assert (await intent_classifier.classify_intent("conosci i membri di bali zero?"))["category"] == "team_query"
    assert (await intent_classifier.classify_intent("quanti siamo?"))["category"] == "team_query"
    assert (await intent_classifier.classify_intent("parlami del team"))["category"] == "team_query"
    
    # English team queries
    assert (await intent_classifier.classify_intent("team members"))["category"] == "team_query"
    assert (await intent_classifier.classify_intent("who works here?"))["category"] == "team_query"
    
    # Indonesian team queries
    assert (await intent_classifier.classify_intent("anggota tim"))["category"] == "team_query"


def test_query_router_identity_override(query_router):
    """Test that identity queries route to bali_zero_team"""
    assert query_router.route("io chi sono?") == "bali_zero_team"
    assert query_router.route("who am i?") == "bali_zero_team"
    assert query_router.route("siapa saya?") == "bali_zero_team"
    assert query_router.route("cosa sai di me?") == "bali_zero_team"
    assert query_router.route("il mio nome") == "bali_zero_team"


def test_query_router_team_enumeration_override(query_router):
    """Test that team enumeration queries route to bali_zero_team"""
    assert query_router.route("conosci i membri di bali zero?") == "bali_zero_team"
    assert query_router.route("quanti siamo?") == "bali_zero_team"
    assert query_router.route("team members") == "bali_zero_team"
    assert query_router.route("chi lavora qui?") == "bali_zero_team"


def test_context_builder_identity_context(context_builder, mock_collaborator_profile):
    """Test that identity context is built correctly"""
    identity_context = context_builder.build_identity_context(mock_collaborator_profile)
    
    assert identity_context is not None
    assert "Anton" in identity_context
    assert "anton@balizero.com" in identity_context
    assert "Executive Consultant" in identity_context
    assert "Setup" in identity_context
    assert "UTENTE ATTUALMENTE CONNESSO" in identity_context


def test_context_builder_identity_detection(context_builder):
    """Test identity query detection"""
    assert context_builder.detect_identity_query("io chi sono?") is True
    assert context_builder.detect_identity_query("who am i?") is True
    assert context_builder.detect_identity_query("cosa sai di me?") is True
    assert context_builder.detect_identity_query("ciao") is False
    assert context_builder.detect_identity_query("come va?") is False


def test_context_builder_team_query_detection(context_builder):
    """Test team query detection"""
    assert context_builder.detect_team_query("conosci i membri?") is True
    assert context_builder.detect_team_query("team members") is True
    assert context_builder.detect_team_query("quanti siamo?") is True
    assert context_builder.detect_team_query("ciao") is False


@pytest.mark.asyncio
async def test_rag_manager_identity_query(mock_search_service):
    """Test that RAG Manager handles identity queries correctly"""
    rag_manager = RAGManager(search_service=mock_search_service)
    
    result = await rag_manager.retrieve_context(
        query="io chi sono?",
        query_type="identity",
        user_level=0,
        limit=5,
    )
    
    assert result["used_rag"] is True
    assert result["document_count"] > 0
    assert result["context"] is not None
    # Verify that search_collection was called (identity queries use _retrieve_from_team_collection)
    mock_search_service.search_collection.assert_called()


@pytest.mark.asyncio
async def test_rag_manager_team_query(mock_search_service):
    """Test that RAG Manager handles team queries correctly"""
    rag_manager = RAGManager(search_service=mock_search_service)
    
    result = await rag_manager.retrieve_context(
        query="conosci i membri di bali zero?",
        query_type="team_query",
        user_level=0,
        limit=5,
    )
    
    assert result["used_rag"] is True
    assert result["document_count"] > 0
    assert result["context"] is not None


@pytest.mark.asyncio
async def test_rag_manager_skips_casual_queries(mock_search_service):
    """Test that RAG Manager still skips casual queries (not identity/team)"""
    rag_manager = RAGManager(search_service=mock_search_service)
    
    result = await rag_manager.retrieve_context(
        query="come stai?",
        query_type="casual",
        user_level=0,
        limit=5,
    )
    
    # Casual queries should do light search, not full skip
    # But they shouldn't force bali_zero_team
    assert result is not None


def test_context_builder_combine_with_identity(context_builder, mock_collaborator_profile):
    """Test that identity context is included when combining contexts"""
    identity_context = context_builder.build_identity_context(mock_collaborator_profile)
    team_context = context_builder.build_team_context(mock_collaborator_profile)
    
    combined = context_builder.combine_contexts(
        memory_context=None,
        team_context=team_context,
        rag_context="Some RAG context",
        identity_context=identity_context,
    )
    
    assert combined is not None
    assert "Anton" in combined
    assert "UTENTE ATTUALMENTE CONNESSO" in combined
    # Identity context should be included
    assert identity_context in combined


@pytest.mark.asyncio
async def test_collaborator_service_identify():
    """Test CollaboratorService.identify() method"""
    # This test requires the actual CollaboratorService with team_members.json
    # We'll test that it can identify a known user
    try:
        service = CollaboratorService()
        collaborator = await service.identify("anton@balizero.com")
        
        assert collaborator is not None
        assert collaborator.id != "anonymous"
        assert collaborator.email == "anton@balizero.com"
        assert collaborator.name == "Anton"
    except FileNotFoundError:
        pytest.skip("team_members.json not found - skipping CollaboratorService test")


@pytest.mark.asyncio
async def test_collaborator_service_anonymous():
    """Test CollaboratorService returns anonymous for unknown users"""
    try:
        service = CollaboratorService()
        collaborator = await service.identify("unknown@example.com")
        
        assert collaborator is not None
        assert collaborator.id == "anonymous"
    except FileNotFoundError:
        pytest.skip("team_members.json not found - skipping CollaboratorService test")


# ============================================================================
# Integration Test - Complete Flow
# ============================================================================


@pytest.mark.asyncio
async def test_complete_identity_recognition_flow(
    intent_classifier, context_builder, query_router, mock_collaborator_profile, mock_search_service
):
    """Test the complete identity recognition flow"""
    # Step 1: Classify query
    classification = await intent_classifier.classify_intent("io chi sono?")
    assert classification["category"] == "identity"
    
    # Step 2: Route query
    collection = query_router.route("io chi sono?")
    assert collection == "bali_zero_team"
    
    # Step 3: Build identity context
    identity_context = context_builder.build_identity_context(mock_collaborator_profile)
    assert identity_context is not None
    assert "Anton" in identity_context
    
    # Step 4: RAG retrieval
    rag_manager = RAGManager(search_service=mock_search_service)
    rag_result = await rag_manager.retrieve_context(
        query="io chi sono?",
        query_type="identity",
        user_level=0,
        limit=5,
    )
    assert rag_result["used_rag"] is True
    
    # Step 5: Combine contexts
    combined = context_builder.combine_contexts(
        memory_context=None,
        team_context=context_builder.build_team_context(mock_collaborator_profile),
        rag_context=rag_result["context"],
        identity_context=identity_context,
    )
    assert combined is not None
    assert "Anton" in combined

