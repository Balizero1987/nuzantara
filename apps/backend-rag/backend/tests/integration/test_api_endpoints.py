"""Integration tests for REST API endpoints"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from nuzantara_scraper.api.routes import app, active_jobs, scheduler


@pytest.fixture
def client():
    """Create test client"""
    # Clear state between tests
    active_jobs.clear()
    scheduler.jobs.clear()

    return TestClient(app)


@pytest.mark.integration
class TestScraperAPIEndpoints:
    """Test scraper API endpoints"""

    def test_root_endpoint(self, client):
        """Test API root endpoint"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert "name" in data
        assert "version" in data
        assert "endpoints" in data
        assert data["name"] == "Nuzantara Unified Scraper API"

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_scraper_list_endpoint(self, client):
        """Test listing available scrapers"""
        response = client.get("/api/scraper/list")

        assert response.status_code == 200
        data = response.json()

        assert "scrapers" in data
        scrapers = data["scrapers"]

        # Should have 4 scrapers
        assert len(scrapers) == 4

        # Verify scraper types
        scraper_types = [s["type"] for s in scrapers]
        assert "property" in scraper_types
        assert "immigration" in scraper_types
        assert "tax" in scraper_types
        assert "news" in scraper_types

    @patch("nuzantara_scraper.api.routes.run_scraper_task")
    def test_scraper_run_async(self, mock_task, client):
        """Test running scraper asynchronously"""
        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": True,
                "enable_ai": False,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "job_id" in data
        assert data["scraper_type"] == "property"
        assert data["status"] in ["pending", "running"]

    @patch("nuzantara_scraper.scrapers.property_scraper.PropertyScraper.run_cycle")
    def test_scraper_run_sync(self, mock_run_cycle, client):
        """Test running scraper synchronously"""
        # Mock successful run
        mock_result = Mock()
        mock_result.sources_attempted = 5
        mock_result.sources_successful = 4
        mock_result.items_scraped = 10
        mock_result.items_saved = 8
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
        data = response.json()

        assert data["status"] == "completed"
        assert data["items_scraped"] == 10
        assert data["items_saved"] == 8

    def test_scraper_run_invalid_type(self, client):
        """Test running scraper with invalid type"""
        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "invalid_type",
                "run_async": True,
            },
        )

        assert response.status_code == 400
        assert "detail" in response.json()

    @patch("nuzantara_scraper.api.routes.run_scraper_task")
    def test_scraper_status_endpoint(self, mock_task, client):
        """Test getting scraper job status"""
        # Create a job first
        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": True,
            },
        )

        job_id = response.json()["job_id"]

        # Get status
        response = client.get(f"/api/scraper/status/{job_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["job_id"] == job_id
        assert "status" in data
        assert "started_at" in data

    def test_scraper_status_invalid_job(self, client):
        """Test getting status of non-existent job"""
        response = client.get("/api/scraper/status/invalid_job_id")

        assert response.status_code == 404

    def test_scraper_jobs_list(self, client):
        """Test listing all jobs"""
        response = client.get("/api/scraper/jobs")

        assert response.status_code == 200
        data = response.json()

        assert "total" in data
        assert "jobs" in data
        assert isinstance(data["jobs"], list)


@pytest.mark.integration
class TestSchedulerAPIEndpoints:
    """Test scheduler API endpoints"""

    def test_scheduler_status(self, client):
        """Test getting scheduler status"""
        response = client.get("/api/scheduler/status")

        assert response.status_code == 200
        data = response.json()

        assert "running" in data
        assert "total_jobs" in data
        assert "enabled_jobs" in data

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.add_job")
    def test_schedule_job(self, mock_add_job, client):
        """Test scheduling a new job"""
        mock_add_job.return_value = "test_job_123"

        response = client.post(
            "/api/scheduler/schedule",
            json={
                "scraper_type": "property",
                "frequency": "daily",
                "enable_ai": True,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "job_id" in data
        assert data["scraper_type"] == "property"
        assert data["frequency"] == "daily"

    def test_schedule_job_invalid_frequency(self, client):
        """Test scheduling with invalid frequency"""
        response = client.post(
            "/api/scheduler/schedule",
            json={
                "scraper_type": "property",
                "frequency": "invalid",
            },
        )

        assert response.status_code == 400

    def test_schedule_job_custom_interval(self, client):
        """Test scheduling with custom interval"""
        response = client.post(
            "/api/scheduler/schedule",
            json={
                "scraper_type": "property",
                "frequency": "custom",
                "interval_seconds": 3600,
            },
        )

        # Should succeed with interval
        assert response.status_code == 200

    def test_scheduler_list_jobs(self, client):
        """Test listing scheduled jobs"""
        response = client.get("/api/scheduler/jobs")

        assert response.status_code == 200
        data = response.json()

        assert "running" in data
        assert "total_jobs" in data
        assert "jobs" in data

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.enable_job")
    def test_enable_job(self, mock_enable, client):
        """Test enabling a scheduled job"""
        mock_enable.return_value = True

        response = client.post("/api/scheduler/jobs/test_job/enable")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["status"] == "enabled"

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.enable_job")
    def test_enable_nonexistent_job(self, mock_enable, client):
        """Test enabling non-existent job"""
        mock_enable.return_value = False

        response = client.post("/api/scheduler/jobs/invalid_job/enable")

        assert response.status_code == 404

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.disable_job")
    def test_disable_job(self, mock_disable, client):
        """Test disabling a scheduled job"""
        mock_disable.return_value = True

        response = client.post("/api/scheduler/jobs/test_job/disable")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["status"] == "disabled"

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.remove_job")
    def test_remove_job(self, mock_remove, client):
        """Test removing a scheduled job"""
        mock_remove.return_value = True

        response = client.delete("/api/scheduler/jobs/test_job")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["status"] == "removed"

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.get_job")
    def test_get_job_details(self, mock_get_job, client):
        """Test getting job details"""
        # Mock job
        mock_job = Mock()
        mock_job.job_id = "test_job"
        mock_job.scraper_type = "property"
        mock_job.frequency.value = "daily"
        mock_job.enabled = True
        mock_job.run_count = 5
        mock_job.error_count = 0
        mock_job.last_run = None
        mock_job.next_run = None
        mock_job.last_error = None
        mock_job.interval_seconds = None

        mock_get_job.return_value = mock_job

        response = client.get("/api/scheduler/jobs/test_job")

        assert response.status_code == 200
        data = response.json()

        assert data["job_id"] == "test_job"
        assert data["scraper_type"] == "property"
        assert data["enabled"] is True

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.get_job")
    def test_get_nonexistent_job(self, mock_get_job, client):
        """Test getting non-existent job"""
        mock_get_job.return_value = None

        response = client.get("/api/scheduler/jobs/invalid_job")

        assert response.status_code == 404

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.start")
    def test_start_scheduler(self, mock_start, client):
        """Test starting the scheduler"""
        response = client.post("/api/scheduler/start")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["status"] == "running"
        mock_start.assert_called_once()

    @patch("nuzantara_scraper.scheduler.scheduler.ScraperScheduler.stop")
    def test_stop_scheduler(self, mock_stop, client):
        """Test stopping the scheduler"""
        response = client.post("/api/scheduler/stop")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["status"] == "stopped"
        mock_stop.assert_called_once()


@pytest.mark.integration
class TestAPIErrorHandling:
    """Test API error handling"""

    def test_invalid_json_body(self, client):
        """Test sending invalid JSON"""
        response = client.post(
            "/api/scraper/run",
            data="not valid json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422

    def test_missing_required_fields(self, client):
        """Test missing required fields"""
        response = client.post(
            "/api/scraper/run",
            json={
                # Missing scraper_type
                "run_async": True,
            },
        )

        assert response.status_code == 422

    def test_invalid_field_types(self, client):
        """Test invalid field types"""
        response = client.post(
            "/api/scraper/run",
            json={
                "scraper_type": "property",
                "run_async": "not_a_boolean",  # Should be boolean
            },
        )

        assert response.status_code == 422

    def test_nonexistent_endpoint(self, client):
        """Test accessing non-existent endpoint"""
        response = client.get("/api/nonexistent")

        assert response.status_code == 404
