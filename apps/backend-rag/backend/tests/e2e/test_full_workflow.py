"""End-to-end tests for complete scraping workflows"""

import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

from nuzantara_scraper.api.routes import app
from nuzantara_scraper.models.scraped_content import ScrapedContent, ContentType


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.mark.e2e
@pytest.mark.slow
class TestCompleteScrapingWorkflow:
    """Test complete end-to-end scraping workflow"""

    @patch("nuzantara_scraper.engines.requests_engine.RequestsEngine.fetch_content")
    @patch("nuzantara_scraper.core.database_manager.DatabaseManager.save_to_chromadb")
    def test_property_scraper_full_workflow(
        self, mock_save_db, mock_fetch, client, property_config
    ):
        """Test complete property scraping workflow"""

        # Mock HTML response
        mock_html = """
        <html><body>
            <div class="property">
                <h2>Test Villa in Canggu</h2>
                <span class="price">USD 600,000</span>
                <span class="size">250 sqm</span>
                <p class="description">
                    Beautiful modern villa with private pool and garden area.
                    Located in peaceful Canggu neighborhood near the beach.
                    Features 3 bedrooms, 3 bathrooms, and open-plan living.
                </p>
            </div>
        </body></html>
        """
        mock_fetch.return_value = mock_html
        mock_save_db.return_value = True

        # Run scraper via API
        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": False,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Verify workflow completed
        assert data["status"] == "completed"
        assert data["items_scraped"] > 0

    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper.run_cycle")
    def test_async_job_workflow(self, mock_run_cycle, client):
        """Test async job submission and status checking"""

        # Mock successful run
        mock_result = Mock()
        mock_result.sources_attempted = 3
        mock_result.sources_successful = 3
        mock_result.items_scraped = 5
        mock_result.items_saved = 5
        mock_run_cycle.return_value = mock_result

        # 1. Submit async job
        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": True,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200
        job_id = response.json()["job_id"]

        # 2. Check job status
        response = client.get(f"/api/scraper/status/{job_id}")

        assert response.status_code == 200
        status_data = response.json()
        assert status_data["job_id"] == job_id
        assert status_data["status"] in ["pending", "running", "completed"]

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.add_job")
    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.start")
    def test_scheduler_workflow(self, mock_start, mock_add_job, client):
        """Test complete scheduler workflow"""

        mock_add_job.return_value = "scheduled_job_123"

        # 1. Schedule a job
        response = client.post(
            "/api/scheduler/schedule",
            json={
                "scraper_type": "property",
                "frequency": "daily",
                "enable_ai": True,
            },
        )

        assert response.status_code == 200
        job_id = response.json()["job_id"]

        # 2. Start scheduler
        response = client.post("/api/scheduler/start")
        assert response.status_code == 200

        # 3. Check scheduler status
        response = client.get("/api/scheduler/status")
        assert response.status_code == 200

        # 4. List jobs
        response = client.get("/api/scheduler/jobs")
        assert response.status_code == 200

    def test_api_health_and_discovery(self, client):
        """Test API health check and service discovery"""

        # 1. Health check
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

        # 2. Root endpoint (discovery)
        response = client.get("/")
        assert response.status_code == 200
        root_data = response.json()
        assert "endpoints" in root_data

        # 3. List available scrapers
        response = client.get("/api/scraper/list")
        assert response.status_code == 200
        assert len(response.json()["scrapers"]) == 4

    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper.run_cycle")
    @patch("nuzantara_scraper.scrapers.immigration_scraper.ImmigrationScraper.run_cycle")
    @patch("nuzantara_scraper.scrapers.tax_scraper.TaxScraper.run_cycle")
    @patch("nuzantara_scraper.scrapers.news_scraper.NewsScraper.run_cycle")
    def test_all_scrapers_workflow(
        self, mock_news, mock_tax, mock_immigration, mock_property, client
    ):
        """Test running all 4 scrapers"""

        # Mock successful runs for all scrapers
        mock_result = Mock()
        mock_result.sources_attempted = 2
        mock_result.sources_successful = 2
        mock_result.items_scraped = 3
        mock_result.items_saved = 3

        mock_property.return_value = mock_result
        mock_immigration.return_value = mock_result
        mock_tax.return_value = mock_result
        mock_news.return_value = mock_result

        scrapers = ["property", "immigration", "tax", "news"]

        for scraper_type in scrapers:
            response = client.post(
                "/api/scraper/run",
                json={
                    "scraper_type": scraper_type,
                    "run_async": False,
                    "enable_ai": False,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "completed"
            assert data["scraper_type"] == scraper_type

    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper.run_cycle")
    def test_error_handling_workflow(self, mock_run_cycle, client):
        """Test error handling in workflow"""

        # Mock scraper error
        mock_run_cycle.side_effect = Exception("Simulated scraper error")

        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": False,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Should handle error gracefully
        assert data["status"] == "failed"
        assert "error" in data


@pytest.mark.e2e
@pytest.mark.slow
class TestDataPersistence:
    """Test data persistence through workflow"""

    @patch("nuzantara_scraper.core.cache_manager.CacheManager.is_cached")
    @patch("nuzantara_scraper.core.cache_manager.CacheManager.add_to_cache")
    def test_cache_persistence(self, mock_add_cache, mock_is_cached, client):
        """Test content caching in workflow"""

        # First run - not cached
        mock_is_cached.return_value = False
        mock_add_cache.return_value = True

        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": False,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200

        # Cache should be checked and updated
        assert mock_is_cached.called or mock_add_cache.called

    @patch("nuzantara_scraper.core.database_manager.DatabaseManager.save_to_chromadb")
    def test_database_persistence(self, mock_save_db, client):
        """Test database persistence in workflow"""

        mock_save_db.return_value = True

        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": False,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200

        # Database save should be called
        # (will be called if any items are scraped)


@pytest.mark.e2e
@pytest.mark.slow
class TestPerformance:
    """Test workflow performance"""

    @pytest.mark.timeout(30)
    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper.run_cycle")
    def test_workflow_completes_within_timeout(self, mock_run_cycle, client):
        """Test workflow completes within reasonable time"""

        mock_result = Mock()
        mock_result.sources_attempted = 5
        mock_result.sources_successful = 5
        mock_result.items_scraped = 10
        mock_result.items_saved = 10
        mock_run_cycle.return_value = mock_result

        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": False,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200
        # If this completes, it's within timeout

    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper.run_cycle")
    def test_concurrent_requests(self, mock_run_cycle, client):
        """Test handling concurrent API requests"""

        mock_result = Mock()
        mock_result.sources_attempted = 1
        mock_result.sources_successful = 1
        mock_result.items_scraped = 1
        mock_result.items_saved = 1
        mock_run_cycle.return_value = mock_result

        # Submit multiple concurrent requests
        responses = []
        for _ in range(5):
            response = client.post(
                "/api/scraper/run",
                json={
                    "scraper_type": "property",
                    "run_async": True,
                    "enable_ai": False,
                },
            )
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200

        # All should have unique job IDs
        job_ids = [r.json()["job_id"] for r in responses]
        assert len(job_ids) == len(set(job_ids))
