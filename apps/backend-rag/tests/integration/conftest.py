"""
Integration Test Configuration

Sets up REAL database connections using testcontainers for PostgreSQL and Qdrant.
These tests verify service layer interactions with actual databases.
"""

import os
import sys
from pathlib import Path

import pytest

# Set required environment variables BEFORE any imports
os.environ.setdefault("JWT_SECRET_KEY", "test_jwt_secret_key_for_testing_only_min_32_chars")
os.environ.setdefault("API_KEYS", "test_api_key_1,test_api_key_2")
os.environ.setdefault("WHATSAPP_VERIFY_TOKEN", "test_whatsapp_verify_token")
os.environ.setdefault("INSTAGRAM_VERIFY_TOKEN", "test_instagram_verify_token")
os.environ.setdefault("OPENAI_API_KEY", "test_openai_api_key_for_testing")
os.environ.setdefault("GOOGLE_API_KEY", "test_google_api_key_for_testing")

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Try to import testcontainers, but don't fail if not installed
try:
    from testcontainers.compose import DockerCompose
    from testcontainers.postgres import PostgresContainer

    TESTCONTAINERS_AVAILABLE = True
except ImportError:
    TESTCONTAINERS_AVAILABLE = False
    PostgresContainer = None
    DockerCompose = None


@pytest.fixture(scope="session")
def postgres_container():
    """
    Start PostgreSQL container for integration tests.

    Uses testcontainers if available, otherwise falls back to DATABASE_URL env var.
    """
    if TESTCONTAINERS_AVAILABLE:
        with PostgresContainer("postgres:15-alpine") as postgres:
            database_url = postgres.get_connection_url()
            os.environ["DATABASE_URL"] = database_url
            yield database_url
    else:
        # Fallback: use DATABASE_URL from environment
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            pytest.skip("DATABASE_URL not set and testcontainers not available")
        yield database_url


@pytest.fixture(scope="session")
def qdrant_container():
    """
    Start Qdrant container for integration tests.

    Uses docker-compose if available, otherwise falls back to QDRANT_URL env var.
    """
    qdrant_url = os.getenv("QDRANT_URL")

    if not qdrant_url:
        # Try to use docker-compose for Qdrant
        if TESTCONTAINERS_AVAILABLE:
            # Use docker-compose.test.yml if it exists
            compose_file = Path(__file__).parent.parent.parent / "docker-compose.test.yml"
            if compose_file.exists():
                with DockerCompose(
                    str(compose_file.parent), compose_file_name="docker-compose.test.yml"
                ) as compose:
                    # Wait for Qdrant to be ready
                    import time

                    time.sleep(5)  # Give Qdrant time to start
                    qdrant_url = "http://localhost:6333"
                    os.environ["QDRANT_URL"] = qdrant_url
                    yield qdrant_url
                    return

        pytest.skip("QDRANT_URL not set and docker-compose.test.yml not available")
    else:
        os.environ["QDRANT_URL"] = qdrant_url
        yield qdrant_url


@pytest.fixture(scope="function")
async def db_pool(postgres_container):
    """
    Create asyncpg connection pool for PostgreSQL.

    Yields:
        asyncpg.Pool: Connection pool to test database
    """
    import asyncpg

    # Ensure we have a valid connection string
    database_url = postgres_container

    pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10, command_timeout=60)

    yield pool

    await pool.close()

    # Clean up test data
    async with pool.acquire() as conn:
        try:
            await conn.execute("DELETE FROM work_sessions WHERE user_id LIKE 'test_%'")
        except Exception:
            pass  # Table might not exist


@pytest.fixture(scope="function")
def qdrant_client(qdrant_container):
    """
    Create Qdrant client for integration tests.

    Yields:
        QdrantClient: Qdrant client connected to test instance
    """
    from core.qdrant_db import QdrantClient

    client = QdrantClient(qdrant_url=qdrant_container, collection_name="test_collection")

    yield client


@pytest.fixture(scope="function")
async def memory_service(db_pool):
    """
    Create MemoryServicePostgres with test database.

    Yields:
        MemoryServicePostgres: Memory service connected to test database
    """
    from services.memory_service_postgres import MemoryServicePostgres

    # Get connection URL from pool
    database_url = os.getenv("DATABASE_URL")
    service = MemoryServicePostgres(database_url=database_url)
    await service.connect()

    yield service

    await service.close()


@pytest.fixture(scope="function")
async def search_service(qdrant_client):
    """
    Create SearchService with test Qdrant instance.

    Yields:
        SearchService: Search service connected to test Qdrant
    """
    from services.search_service import SearchService

    # Override Qdrant URL in settings
    original_url = os.getenv("QDRANT_URL")
    os.environ["QDRANT_URL"] = qdrant_client.qdrant_url

    service = SearchService()

    yield service

    # Restore original URL
    if original_url:
        os.environ["QDRANT_URL"] = original_url
    elif "QDRANT_URL" in os.environ:
        del os.environ["QDRANT_URL"]


@pytest.fixture(scope="function", autouse=True)
async def cleanup_test_data(postgres_container, qdrant_client):
    """
    Clean up test data before and after each test.

    This fixture runs automatically before and after each test.
    Note: db_pool might not be available for all tests, so we use postgres_container directly.
    """
    import asyncpg

    # Pre-test cleanup
    try:
        async with asyncpg.create_pool(postgres_container, min_size=1, max_size=1) as pool:
            async with pool.acquire() as conn:
                # Clean up test tables (handle missing tables gracefully)
                try:
                    await conn.execute("DELETE FROM user_memories WHERE user_id LIKE 'test_%'")
                except Exception:
                    pass  # Table might not exist
                try:
                    await conn.execute("DELETE FROM conversations WHERE user_id LIKE 'test_%'")
                except Exception:
                    pass  # Table might not exist
                try:
                    await conn.execute("DELETE FROM work_sessions WHERE user_id LIKE 'test_%'")
                except Exception:
                    pass  # Table might not exist
    except Exception:
        pass  # Database might not be available

    yield

    # Post-test cleanup
    try:
        async with asyncpg.create_pool(postgres_container, min_size=1, max_size=1) as pool:
            async with pool.acquire() as conn:
                try:
                    await conn.execute("DELETE FROM user_memories WHERE user_id LIKE 'test_%'")
                    await conn.execute("DELETE FROM conversations WHERE user_id LIKE 'test_%'")
                    await conn.execute("DELETE FROM work_sessions WHERE user_id LIKE 'test_%'")
                except Exception:
                    pass  # Tables might not exist
    except Exception:
        pass  # Database might not be available

    # Clean up Qdrant test collections
    try:
        import requests

        requests.delete(f"{qdrant_client.qdrant_url}/collections/test_collection", timeout=2)
    except Exception:
        pass  # Collection might not exist or Qdrant might not be available
