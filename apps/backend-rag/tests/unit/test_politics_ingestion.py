"""
Unit tests for Politics Ingestion Service
100% coverage target with comprehensive mocking
"""

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.politics_ingestion import PoliticsIngestionService

# ============================================================================
# Fixtures
# ============================================================================

SAMPLE_PERSON_RECORD = {
    "type": "person",
    "id": "person_123",
    "name": "Test Person",
    "dob": "1980-01-01",
    "pob": "Jakarta",
    "offices": [{"office": "Mayor", "from": "2020", "to": "2024", "jurisdiction_id": "jakarta"}],
    "party_memberships": [{"party_id": "PDI-P", "from": "2015", "to": "present"}],
}

SAMPLE_PARTY_RECORD = {
    "type": "party",
    "id": "party_123",
    "name": "Test Party",
    "abbrev": "TP",
    "founded": "2000",
    "dissolved": None,
    "ideology": ["democracy", "socialism"],
    "leaders": [{"person_id": "person_123", "from": "2020", "to": "present"}],
}

SAMPLE_ELECTION_RECORD = {
    "type": "election",
    "id": "election_123",
    "date": "2024-01-01",
    "level": "national",
    "scope": "presidential",
    "jurisdiction_id": "indonesia",
    "contests": [
        {
            "office": "President",
            "district": "Indonesia",
            "results": [
                {"candidate_id": "cand1", "party_id": "PDI-P", "votes": 1000000, "pct": 50.0}
            ],
        }
    ],
}

SAMPLE_JURISDICTION_RECORD = {
    "type": "jurisdiction",
    "id": "jakarta",
    "name": "Jakarta",
    "kind": "province",
    "parent_id": "indonesia",
    "valid_from": "2000",
    "valid_to": None,
}

SAMPLE_LAW_RECORD = {
    "type": "law",
    "number": "UU 1/2024",
    "title": "Test Law",
    "date": "2024-01-01",
    "subject": "governance",
}


@pytest.fixture
def politics_ingestion_service():
    """Create PoliticsIngestionService instance"""
    with (
        patch("services.politics_ingestion.EmbeddingsGenerator"),
        patch("services.politics_ingestion.QdrantClient"),
        patch("services.politics_ingestion.logger"),
    ):
        service = PoliticsIngestionService()
        service.embedder = MagicMock()
        service.vector_db = MagicMock()
        service.embedder.generate_embeddings.return_value = [[0.1] * 384]
        return service


# ============================================================================
# Tests: _build_text
# ============================================================================


def test_build_text_person(politics_ingestion_service):
    """Test building text for person record"""
    text = politics_ingestion_service._build_text(SAMPLE_PERSON_RECORD)

    assert "Tokoh:" in text
    assert "Test Person" in text
    assert "Lahir:" in text
    assert "1980-01-01" in text
    assert "Jakarta" in text
    assert "Keanggotaan partai:" in text
    assert "PDI-P" in text
    assert "Jabatan:" in text
    assert "Mayor" in text


def test_build_text_party(politics_ingestion_service):
    """Test building text for party record"""
    text = politics_ingestion_service._build_text(SAMPLE_PARTY_RECORD)

    assert "Partai:" in text
    assert "Test Party" in text
    assert "TP" in text
    assert "Berdiri:" in text
    assert "2000" in text
    assert "Ideologi:" in text
    assert "democracy" in text
    assert "Pimpinan:" in text


def test_build_text_election(politics_ingestion_service):
    """Test building text for election record"""
    text = politics_ingestion_service._build_text(SAMPLE_ELECTION_RECORD)

    assert "Pemilu:" in text
    assert "election_123" in text
    assert "2024-01-01" in text
    assert "Level:" in text
    assert "national" in text
    assert "Kontes:" in text
    assert "President" in text


def test_build_text_jurisdiction(politics_ingestion_service):
    """Test building text for jurisdiction record"""
    text = politics_ingestion_service._build_text(SAMPLE_JURISDICTION_RECORD)

    assert "Yurisdiksi:" in text
    assert "jakarta" in text
    assert "Jakarta" in text
    assert "province" in text
    assert "Induk:" in text


def test_build_text_law(politics_ingestion_service):
    """Test building text for law record"""
    text = politics_ingestion_service._build_text(SAMPLE_LAW_RECORD)

    assert "Regulasi:" in text
    assert "UU 1/2024" in text
    assert "Test Law" in text
    assert "2024-01-01" in text
    assert "Subjek:" in text
    assert "governance" in text


def test_build_text_unknown_type(politics_ingestion_service):
    """Test building text for unknown record type"""
    unknown_record = {"type": "unknown", "data": "test"}
    text = politics_ingestion_service._build_text(unknown_record)

    assert isinstance(text, str)
    assert "unknown" in text or "test" in text


def test_build_text_person_no_offices(politics_ingestion_service):
    """Test building text for person with no offices"""
    record = SAMPLE_PERSON_RECORD.copy()
    record["offices"] = []

    text = politics_ingestion_service._build_text(record)

    assert "Jabatan:" in text
    assert "tidak ada" in text


def test_build_text_party_no_leaders(politics_ingestion_service):
    """Test building text for party with no leaders"""
    record = SAMPLE_PARTY_RECORD.copy()
    record["leaders"] = []

    text = politics_ingestion_service._build_text(record)

    assert "Pimpinan:" in text
    assert "tidak ada" in text


# ============================================================================
# Tests: ingest_jsonl_files
# ============================================================================


def test_ingest_jsonl_files_success(politics_ingestion_service):
    """Test ingesting JSONL files successfully"""
    jsonl_content = "\n".join(
        [
            json.dumps(SAMPLE_PERSON_RECORD),
            json.dumps(SAMPLE_PARTY_RECORD),
            json.dumps(SAMPLE_ELECTION_RECORD),
        ]
    )

    mock_file = MagicMock()
    mock_file.__enter__.return_value = mock_file
    mock_file.__iter__.return_value = iter(jsonl_content.splitlines())

    with (
        patch("pathlib.Path.open", return_value=mock_open(read_data=jsonl_content)()),
        patch("builtins.open", mock_open(read_data=jsonl_content)),
    ):
        result = politics_ingestion_service.ingest_jsonl_files([Path("test.jsonl")])

        assert result["success"] is True
        assert result["documents_added"] == 3
        politics_ingestion_service.vector_db.upsert_documents.assert_called_once()


def test_ingest_jsonl_files_empty(politics_ingestion_service):
    """Test ingesting empty JSONL file"""
    with (
        patch("pathlib.Path.open", return_value=mock_open(read_data="")()),
        patch("builtins.open", mock_open(read_data="")),
    ):
        result = politics_ingestion_service.ingest_jsonl_files([Path("empty.jsonl")])

        assert result["success"] is False
        assert result["documents_added"] == 0
        assert "No records found" in result["message"]


def test_ingest_jsonl_files_with_empty_lines(politics_ingestion_service):
    """Test ingesting JSONL file with empty lines"""
    jsonl_content = "\n".join(
        [
            json.dumps(SAMPLE_PERSON_RECORD),
            "",
            json.dumps(SAMPLE_PARTY_RECORD),
            "   ",
        ]
    )

    with (
        patch("pathlib.Path.open", return_value=mock_open(read_data=jsonl_content)()),
        patch("builtins.open", mock_open(read_data=jsonl_content)),
    ):
        result = politics_ingestion_service.ingest_jsonl_files([Path("test.jsonl")])

        assert result["success"] is True
        assert result["documents_added"] == 2  # Empty lines skipped


def test_ingest_jsonl_files_exception(politics_ingestion_service):
    """Test ingesting JSONL file with exception"""
    with patch("pathlib.Path.open", side_effect=Exception("File error")):
        result = politics_ingestion_service.ingest_jsonl_files([Path("error.jsonl")])

        # Should handle exception gracefully
        assert result["success"] is False or result["documents_added"] == 0


def test_ingest_jsonl_files_metadata(politics_ingestion_service):
    """Test metadata in ingested documents"""
    jsonl_content = json.dumps(SAMPLE_PERSON_RECORD)

    with (
        patch("pathlib.Path.open", return_value=mock_open(read_data=jsonl_content)()),
        patch("builtins.open", mock_open(read_data=jsonl_content)),
    ):
        politics_ingestion_service.ingest_jsonl_files([Path("test.jsonl")])

        call_args = politics_ingestion_service.vector_db.upsert_documents.call_args
        metadatas = call_args[1]["metadatas"]

        assert len(metadatas) > 0
        assert metadatas[0]["domain"] == "politics-id"
        assert metadatas[0]["record_type"] == "person"
        assert metadatas[0]["record_id"] == "person_123"


def test_ingest_jsonl_files_ids(politics_ingestion_service):
    """Test ID generation for ingested documents"""
    jsonl_content = json.dumps(SAMPLE_PERSON_RECORD)

    with (
        patch("pathlib.Path.open", return_value=mock_open(read_data=jsonl_content)()),
        patch("builtins.open", mock_open(read_data=jsonl_content)),
        patch("pathlib.Path.stem", "test_file"),
    ):
        politics_ingestion_service.ingest_jsonl_files([Path("test_file.jsonl")])

        call_args = politics_ingestion_service.vector_db.upsert_documents.call_args
        ids = call_args[1]["ids"]

        assert len(ids) > 0
        assert ids[0].startswith("pol:person:")


# ============================================================================
# Tests: ingest_dir
# ============================================================================


def test_ingest_dir_success(politics_ingestion_service):
    """Test ingesting directory successfully"""
    mock_persons_file = Path("persons/test.jsonl")
    mock_parties_file = Path("parties/test.jsonl")
    mock_elections_file = Path("elections/test.jsonl")
    mock_jurisdictions_file = Path("jurisdictions/test.jsonl")

    with patch("pathlib.Path.glob") as mock_glob:
        mock_glob.return_value = [
            mock_persons_file,
            mock_parties_file,
            mock_elections_file,
            mock_jurisdictions_file,
        ]

        with patch.object(
            politics_ingestion_service,
            "ingest_jsonl_files",
            return_value={"success": True, "documents_added": 10},
        ) as mock_ingest:
            result = politics_ingestion_service.ingest_dir(Path("test_dir"))

            assert result["success"] is True
            mock_ingest.assert_called_once()


def test_ingest_dir_finds_all_subdirs(politics_ingestion_service):
    """Test ingest_dir finds files in all subdirectories"""
    with patch("pathlib.Path.glob") as mock_glob:
        mock_glob.return_value = []

        result = politics_ingestion_service.ingest_dir(Path("test_dir"))

        # Should call glob for each subdirectory
        assert mock_glob.call_count == 4  # persons, parties, elections, jurisdictions
