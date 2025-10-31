#!/usr/bin/env python3
"""Quick migration script with increased timeout"""
import os
import sys
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import chromadb

# Setup
chroma_path = "backend/data/chroma"
qdrant_url = "https://qdrant-production-e4f4.up.railway.app"

print(f"🚀 Connecting to Qdrant: {qdrant_url}")
qdrant = QdrantClient(url=qdrant_url, timeout=60)  # 60 second timeout

print(f"📂 Loading ChromaDB from: {chroma_path}")
chroma = chromadb.PersistentClient(path=chroma_path)

collections = chroma.list_collections()
print(f"✅ Found {len(collections)} collections")

for coll in collections:
    print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📦 Migrating: {coll.name}")
    
    # Get all documents
    result = coll.get(include=["embeddings", "documents", "metadatas"])
    count = len(result['ids'])
    print(f"   Documents: {count}")
    
    if count == 0:
        print("   ⚠️  Empty collection, skipping")
        continue
    
    # Get vector dimension
    vector_size = len(result['embeddings'][0])
    print(f"   Vector size: {vector_size}")
    
    # Create collection in Qdrant
    print(f"   Creating Qdrant collection...")
    try:
        qdrant.create_collection(
            collection_name=coll.name,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )
        print(f"   ✅ Collection created")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"   ℹ️  Collection exists, continuing...")
        else:
            print(f"   ❌ Error: {e}")
            continue
    
    # Prepare points
    points = []
    for i, (id, emb, doc, meta) in enumerate(zip(
        result['ids'],
        result['embeddings'],
        result['documents'],
        result['metadatas']
    )):
        payload = meta or {}
        payload['document'] = doc
        points.append(PointStruct(id=i, vector=emb, payload=payload))
    
    # Upload to Qdrant
    print(f"   Uploading {len(points)} points...")
    qdrant.upsert(collection_name=coll.name, points=points)
    print(f"   ✅ Migration complete!")

print(f"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
print(f"🎉 MIGRATION COMPLETE!")
print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
