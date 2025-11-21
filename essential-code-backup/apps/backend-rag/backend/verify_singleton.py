import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append("/Users/antonellosiano/Desktop/NUZANTARA-CLEAN-ARCHITECT/apps/backend-rag/backend")

# Mock settings
class MockSettings:
    embedding_provider = "sentence-transformers"
    embedding_model = "sentence-transformers/all-MiniLM-L6-v2"

import app.config
app.config.settings = MockSettings()

from core.embeddings import EmbeddingsGenerator

def test_singleton():
    print("Creating first instance...")
    e1 = EmbeddingsGenerator()
    print(f"First instance: {id(e1)}")
    
    print("Creating second instance...")
    e2 = EmbeddingsGenerator()
    print(f"Second instance: {id(e2)}")
    
    if e1 is e2:
        print("✅ Singleton works: Both instances are the same object")
    else:
        print("❌ Singleton failed: Instances are different")
        sys.exit(1)

    # Check if initialized only once (mocking _init methods would be better but checking attributes works)
    if not hasattr(e1, "provider"):
        print("❌ Instance not initialized correctly")
        sys.exit(1)
        
    print(f"Provider: {e1.provider}")

if __name__ == "__main__":
    test_singleton()
