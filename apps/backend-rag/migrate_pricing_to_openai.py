"""
Migrate bali_zero_pricing collection from 384-dim to OpenAI 1536-dim
"""
import chromadb
from openai import OpenAI
import os
from typing import List, Dict
import json

# Configuration
CHROMA_PATH = "/data/chroma_db_FULL_deploy"
OLD_COLLECTION = "bali_zero_pricing"
NEW_COLLECTION = "bali_zero_pricing_openai"  # Create new collection to avoid downtime

# Initialize clients
print("🔧 Initializing clients...")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Get old collection
print(f"📥 Reading from collection: {OLD_COLLECTION}")
old_coll = chroma_client.get_collection(OLD_COLLECTION)

# Get all documents
result = old_coll.get(include=["documents", "metadatas"])
documents = result["documents"]
metadatas = result["metadatas"]
ids = result["ids"]

print(f"✅ Found {len(documents)} documents")

# Generate OpenAI embeddings
print("🤖 Generating OpenAI embeddings...")
embeddings = []
for i, doc in enumerate(documents):
    if i % 5 == 0:
        print(f"  Progress: {i+1}/{len(documents)}")
    
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=doc
    )
    embeddings.append(response.data[0].embedding)

print(f"✅ Generated {len(embeddings)} embeddings (1536-dim)")

# Create new collection with OpenAI embeddings
print(f"📤 Creating new collection: {NEW_COLLECTION}")
try:
    chroma_client.delete_collection(NEW_COLLECTION)
    print(f"  Deleted existing {NEW_COLLECTION}")
except:
    pass

new_coll = chroma_client.create_collection(
    name=NEW_COLLECTION,
    metadata={"embedding_dimension": 1536, "embedding_provider": "openai"}
)

# Add documents with new embeddings
print("💾 Adding documents to new collection...")
new_coll.add(
    ids=ids,
    documents=documents,
    metadatas=metadatas,
    embeddings=embeddings
)

print("✅ Migration complete!")
print(f"\n📊 Summary:")
print(f"  Old collection: {OLD_COLLECTION} (384-dim)")
print(f"  New collection: {NEW_COLLECTION} (1536-dim)")
print(f"  Documents migrated: {len(documents)}")

# Test query
print(f"\n🧪 Testing new collection...")
test_query = "pricing information for PT PMA"
test_response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=test_query
)
test_embedding = test_response.data[0].embedding

results = new_coll.query(
    query_embeddings=[test_embedding],
    n_results=3
)

print(f"✅ Test query successful! Found {len(results['documents'][0])} results")
print(f"\nNext step: Update search_service.py to use '{NEW_COLLECTION}' for pricing queries")
