import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

# Add parent directory to path
sys.path.append("/Users/antonellosiano/Desktop/NUZANTARA-CLEAN-ARCHITECT/apps/backend-rag/backend")

# Mock dependencies that might cause issues on import or startup
import app.dependencies as deps
deps.search_service = MagicMock()
deps.search_service.embedder.model = "mock-model"
deps.search_service.embedder.dimensions = 384
deps.search_service.embedder.provider = "mock-provider"

# Mock environment variables if needed
os.environ["QDRANT_URL"] = "http://mock-qdrant"
os.environ["OPENAI_API_KEY"] = "mock-key"

try:
    from app.main_cloud import app
except ImportError as e:
    print(f"❌ Failed to import app: {e}")
    sys.exit(1)

client = TestClient(app)

def test_health_check():
    print("Testing /health endpoint...")
    try:
        response = client.get("/health")
        # Note: TestClient follows redirects by default, but let's check
        if response.status_code == 307:
            print("⚠️ /health redirected (likely to /health/), following...")
            response = client.get("/health/")
            
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("✅ /health returned 200 OK and status=healthy")
                print(f"Response: {data}")
            else:
                print(f"⚠️ /health returned 200 but unexpected status: {data.get('status')}")
                print(f"Response: {data}")
        else:
            print(f"❌ /health failed with status {response.status_code}")
            print(f"Response: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ /health test crashed: {e}")
        sys.exit(1)

def test_backup_status():
    print("\nTesting /api/monitoring/backup-service endpoint...")
    try:
        response = client.get("/api/monitoring/backup-service")
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "disabled":
                print("✅ /api/monitoring/backup-service returned 200 OK and status=disabled")
            else:
                print(f"⚠️ /api/monitoring/backup-service returned 200 but unexpected status: {data.get('status')}")
        else:
            print(f"❌ /api/monitoring/backup-service failed with status {response.status_code}")
            print(f"Response: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ /api/monitoring/backup-service test crashed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_health_check()
    test_backup_status()
