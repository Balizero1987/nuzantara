"""
Integration tests for WorkSessionService with real PostgreSQL database.

These tests verify that WorkSessionService correctly interacts with PostgreSQL.
"""

import sys
from pathlib import Path

import pytest

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


@pytest.mark.integration
@pytest.mark.database
class TestWorkSessionIntegration:
    """Integration tests for WorkSessionService with real PostgreSQL"""

    @pytest.mark.asyncio
    async def test_work_session_connect_no_database_url(self):
        """Test connecting without database URL (should use in-memory fallback)"""
        from services.work_session_service import WorkSessionService

        # Create service without database URL
        service = WorkSessionService(database_url=None)
        await service.connect()

        # Should not have pool if no database URL
        assert service.pool is None

        await service.close()

    @pytest.mark.asyncio
    async def test_work_session_connect_with_database(self, postgres_container):
        """Test connecting with real PostgreSQL database"""
        from services.work_session_service import WorkSessionService

        database_url = postgres_container
        service = WorkSessionService(database_url=database_url)
        await service.connect()

        # Should have pool if database URL is provided
        assert service.pool is not None

        await service.close()
