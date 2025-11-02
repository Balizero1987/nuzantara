#!/usr/bin/env python3
"""
Simple test for the migration functionality
"""

import sys
from pathlib import Path

# Add backend-rag to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "backend-rag" / "backend"))

try:
    from core.embeddings import EmbeddingsGenerator
    from core.vector_db import ChromaDBClient
    print("✅ Backend modules imported successfully")

    # Test embedding generation
    embedder = EmbeddingsGenerator()
    test_text = "This is a test document for ZANTARA migration."
    embedding = embedder.generate_single_embedding(test_text)
    print(f"✅ Embedding generated successfully (dimensions: {len(embedding)})")

    # Test ChromaDB connection to production
    print("🔍 Testing connection to ChromaDB...")
    # Note: This will try to connect to local ChromaDB
    # For production, we need to check if the backend is configured for remote ChromaDB

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()