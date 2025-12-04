"""
Unit tests for Collaborator Service
100% coverage target with comprehensive mocking
"""

import json
import sys
from datetime import timedelta
from pathlib import Path
from unittest.mock import mock_open, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.collaborator_service import CollaboratorProfile, CollaboratorService

# ============================================================================
# Fixtures
# ============================================================================

SAMPLE_TEAM_DATA = [
    {
        "id": "user1",
        "email": "test1@example.com",
        "name": "Test User 1",
        "role": "Developer",
        "department": "Engineering",
        "team": "Backend",
        "preferred_language": "en",
        "languages": ["en", "it"],
        "expertise_level": "senior",
        "age": 30,
        "traits": ["analytical", "detail-oriented"],
    },
    {
        "id": "user2",
        "email": "test2@example.com",
        "name": "Test User 2",
        "role": "Designer",
        "department": "Design",
        "team": "UI/UX",
        "language": "it",
        "languages": ["it", "en"],
        "expertise_level": "intermediate",
        "traits": ["creative"],
    },
]


@pytest.fixture
def mock_team_data_file():
    """Mock team_members.json file"""
    with (
        patch("services.collaborator_service.DATA_PATH") as mock_path,
        patch("builtins.open", mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA))),
    ):
        mock_path.exists.return_value = True
        mock_path.open.return_value = mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA)).return_value
        yield


@pytest.fixture
def collaborator_service(mock_team_data_file):
    """Create CollaboratorService instance"""
    with patch("builtins.open", mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA))):
        return CollaboratorService()


@pytest.fixture
def sample_profile():
    """Create a sample CollaboratorProfile"""
    return CollaboratorProfile(
        id="test-id",
        email="test@example.com",
        name="Test User",
        role="Developer",
        department="Engineering",
        team="Backend",
        language="en",
        languages=["en", "it"],
        expertise_level="senior",
        age=30,
        traits=["analytical"],
    )


# ============================================================================
# Tests: CollaboratorProfile
# ============================================================================


def test_collaborator_profile_to_dict(sample_profile):
    """Test CollaboratorProfile.to_dict()"""
    result = sample_profile.to_dict()

    assert result["id"] == "test-id"
    assert result["email"] == "test@example.com"
    assert result["name"] == "Test User"
    assert result["role"] == "Developer"
    assert result["department"] == "Engineering"
    assert result["team"] == "Backend"
    assert result["language"] == "en"
    assert result["languages"] == ["en", "it"]
    assert result["expertise_level"] == "senior"
    assert result["age"] == 30
    assert result["traits"] == ["analytical"]


def test_collaborator_profile_matches(sample_profile):
    """Test CollaboratorProfile.matches()"""
    assert sample_profile.matches("Test User") is True
    assert sample_profile.matches("test@example.com") is True
    assert sample_profile.matches("Developer") is True
    assert sample_profile.matches("Engineering") is True
    assert sample_profile.matches("analytical") is True
    assert sample_profile.matches("nonexistent") is False
    assert sample_profile.matches("TEST USER") is True  # Case insensitive


# ============================================================================
# Tests: Initialization
# ============================================================================


def test_collaborator_service_init(mock_team_data_file):
    """Test CollaboratorService initialization"""
    with patch("builtins.open", mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA))):
        service = CollaboratorService()

        assert len(service.members) == 2
        assert len(service.members_by_email) == 2
        assert "test1@example.com" in service.members_by_email
        assert "test2@example.com" in service.members_by_email


def test_collaborator_service_init_file_not_found():
    """Test CollaboratorService initialization with missing file"""
    with patch("services.collaborator_service.DATA_PATH") as mock_path:
        mock_path.exists.return_value = False
        with pytest.raises(FileNotFoundError):
            CollaboratorService()


def test_collaborator_service_team_database_backward_compat(mock_team_data_file):
    """Test TEAM_DATABASE backward compatibility"""
    with patch("builtins.open", mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA))):
        service = CollaboratorService()

        assert "test1@example.com" in service.TEAM_DATABASE
        assert service.TEAM_DATABASE["test1@example.com"]["id"] == "user1"
        assert service.TEAM_DATABASE["test1@example.com"]["name"] == "Test User 1"
        assert service.TEAM_DATABASE["test1@example.com"]["role"] == "Developer"


def test_collaborator_service_email_lowercase(mock_team_data_file):
    """Test email normalization to lowercase"""
    with patch("builtins.open", mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA))):
        service = CollaboratorService()

        assert "test1@example.com" in service.members_by_email
        assert "TEST1@EXAMPLE.COM" not in service.members_by_email  # Should be lowercase


# ============================================================================
# Tests: identify
# ============================================================================


@pytest.mark.asyncio
async def test_identify_existing_user(collaborator_service):
    """Test identifying existing user"""
    profile = await collaborator_service.identify("test1@example.com")

    assert profile is not None
    assert profile.email == "test1@example.com"
    assert profile.name == "Test User 1"
    assert profile.id == "user1"


@pytest.mark.asyncio
async def test_identify_nonexistent_user(collaborator_service):
    """Test identifying nonexistent user returns anonymous"""
    profile = await collaborator_service.identify("nonexistent@example.com")

    assert profile is not None
    assert profile.id == "anonymous"
    assert profile.email == "anonymous@balizero.com"
    assert profile.name == "Guest"


@pytest.mark.asyncio
async def test_identify_none(collaborator_service):
    """Test identifying with None returns anonymous"""
    profile = await collaborator_service.identify(None)

    assert profile.id == "anonymous"


@pytest.mark.asyncio
async def test_identify_email_normalization(collaborator_service):
    """Test email normalization in identify"""
    profile = await collaborator_service.identify("  TEST1@EXAMPLE.COM  ")

    assert profile.email == "test1@example.com"


@pytest.mark.asyncio
async def test_identify_caching(collaborator_service):
    """Test identify caching"""
    # First call
    profile1 = await collaborator_service.identify("test1@example.com")

    # Should be cached
    assert "test1@example.com" in collaborator_service.cache

    # Second call should use cache
    profile2 = await collaborator_service.identify("test1@example.com")

    assert profile1 is profile2


@pytest.mark.asyncio
async def test_identify_cache_expiry(collaborator_service):
    """Test cache expiry"""
    # Set cache TTL to 0 for testing
    collaborator_service.cache_ttl = timedelta(seconds=0)

    # First call
    await collaborator_service.identify("test1@example.com")

    # Wait and call again (cache should expire)
    import asyncio

    await asyncio.sleep(0.1)
    profile = await collaborator_service.identify("test1@example.com")

    # Should still work (re-fetches)
    assert profile.email == "test1@example.com"


# ============================================================================
# Tests: get_member
# ============================================================================


def test_get_member_existing(collaborator_service):
    """Test getting existing member"""
    profile = collaborator_service.get_member("test1@example.com")

    assert profile is not None
    assert profile.email == "test1@example.com"


def test_get_member_nonexistent(collaborator_service):
    """Test getting nonexistent member"""
    profile = collaborator_service.get_member("nonexistent@example.com")

    assert profile is None


def test_get_member_email_normalization(collaborator_service):
    """Test email normalization in get_member"""
    profile = collaborator_service.get_member("TEST1@EXAMPLE.COM")

    assert profile is not None
    assert profile.email == "test1@example.com"


# ============================================================================
# Tests: list_members
# ============================================================================


def test_list_members_all(collaborator_service):
    """Test listing all members"""
    members = collaborator_service.list_members()

    assert len(members) == 2
    assert all(isinstance(m, CollaboratorProfile) for m in members)


def test_list_members_by_department(collaborator_service):
    """Test listing members by department"""
    members = collaborator_service.list_members(department="Engineering")

    assert len(members) == 1
    assert members[0].department == "Engineering"


def test_list_members_by_team(collaborator_service):
    """Test listing members by team"""
    members = collaborator_service.list_members(department="Backend")

    assert len(members) == 1
    assert members[0].team == "Backend"


def test_list_members_case_insensitive(collaborator_service):
    """Test listing members is case insensitive"""
    members = collaborator_service.list_members(department="engineering")

    assert len(members) == 1


# ============================================================================
# Tests: search_members
# ============================================================================


def test_search_members_by_name(collaborator_service):
    """Test searching members by name"""
    results = collaborator_service.search_members("Test User 1")

    assert len(results) == 1
    assert results[0].name == "Test User 1"


def test_search_members_by_email(collaborator_service):
    """Test searching members by email"""
    results = collaborator_service.search_members("test1@example.com")

    assert len(results) == 1


def test_search_members_by_role(collaborator_service):
    """Test searching members by role"""
    results = collaborator_service.search_members("Developer")

    assert len(results) == 1
    assert results[0].role == "Developer"


def test_search_members_by_trait(collaborator_service):
    """Test searching members by trait"""
    results = collaborator_service.search_members("analytical")

    assert len(results) == 1


def test_search_members_empty_query(collaborator_service):
    """Test searching with empty query"""
    results = collaborator_service.search_members("")

    assert results == []


def test_search_members_whitespace_only(collaborator_service):
    """Test searching with whitespace only"""
    results = collaborator_service.search_members("   ")

    assert results == []


def test_search_members_case_insensitive(collaborator_service):
    """Test searching is case insensitive"""
    results = collaborator_service.search_members("DEVELOPER")

    assert len(results) == 1


# ============================================================================
# Tests: get_team_stats
# ============================================================================


def test_get_team_stats(mock_team_data_file):
    """Test getting team statistics"""
    with patch("builtins.open", mock_open(read_data=json.dumps(SAMPLE_TEAM_DATA))):
        service = CollaboratorService()
        stats = service.get_team_stats()

        assert stats["total"] == 2
        assert "departments" in stats
        assert stats["departments"]["Engineering"] == 1
        assert stats["departments"]["Design"] == 1
        assert "languages" in stats
        assert stats["languages"].get("en", 0) >= 1


def test_get_team_stats_language_distribution(mock_team_data_file):
    """Test language distribution in stats"""
    service = CollaboratorService()
    stats = service.get_team_stats()

    assert "languages" in stats
    assert isinstance(stats["languages"], dict)


# ============================================================================
# Tests: _anonymous_profile
# ============================================================================


def test_anonymous_profile(mock_team_data_file):
    """Test anonymous profile creation"""
    service = CollaboratorService()
    profile = service._anonymous_profile()

    assert profile.id == "anonymous"
    assert profile.email == "anonymous@balizero.com"
    assert profile.name == "Guest"
    assert profile.role == "guest"
    assert profile.department == "general"
    assert profile.team == "general"
    assert profile.language == "en"
    assert profile.expertise_level == "beginner"
