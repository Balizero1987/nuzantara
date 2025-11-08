"""
Migrate legal_unified collection from 384-dim to OpenAI 1536-dim
Input: legal_unified.json (384-dim)
Output: legal_unified_openai.json (1536-dim)
"""
import json
from openai import OpenAI
import os
from typing import List
import time

# Configuration
INPUT_FILE = "/Users/antonellosiano/Desktop/test_chroma_db/collections_clean/legal_unified.json"
OUTPUT_FILE = "/Users/antonellosiano/Desktop/test_chroma_db/collections_clean/legal_unified_openai.json"

# Initialize OpenAI client
print("🔧 Initializing OpenAI client...")
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

if not os.getenv("OPENAI_API_KEY"):
    print("❌ ERROR: OPENAI_API_KEY not set")
    print("   Set it with: export OPENAI_API_KEY='your-key-here'")
    exit(1)

# Load existing data
print(f"📥 Loading documents from: {INPUT_FILE}")
with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    documents = json.load(f)

print(f"✅ Loaded {len(documents)} documents")
print(f"   Current embedding dim: {len(documents[0]['embedding'])}")
print(f"   Current embedding model: {documents[0].get('embedding_model', 'unknown')}")

# Generate OpenAI embeddings
print(f"\n🤖 Generating OpenAI 1536-dim embeddings...")
print(f"   Model: text-embedding-3-small")
print(f"   This will take ~{len(documents) * 0.5:.0f} seconds (0.5s per doc)")

migrated_docs = []
start_time = time.time()

for i, doc in enumerate(documents):
    if (i + 1) % 50 == 0 or i == 0:
        elapsed = time.time() - start_time
        docs_per_sec = (i + 1) / elapsed if elapsed > 0 else 0
        remaining = (len(documents) - i - 1) / docs_per_sec if docs_per_sec > 0 else 0
        print(f"  Progress: {i+1}/{len(documents)} ({(i+1)/len(documents)*100:.1f}%) - {docs_per_sec:.1f} docs/sec - ETA: {remaining:.0f}s")

    # Generate new embedding
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=doc['text']
    )
    new_embedding = response.data[0].embedding

    # Create migrated document
    migrated_doc = {
        'id': doc['id'],
        'collection': 'legal_unified',  # Keep same collection name
        'text': doc['text'],
        'embedding': new_embedding,
        'embedding_model': 'openai_text-embedding-3-small',
        'metadata': doc.get('metadata', {})
    }

    # Ensure metadata has embedding info
    if migrated_doc['metadata']:
        migrated_doc['metadata']['embedding_dimension'] = 1536
        migrated_doc['metadata']['embedding_provider'] = 'openai'

    migrated_docs.append(migrated_doc)

    # Small delay to avoid rate limits
    if (i + 1) % 100 == 0:
        time.sleep(0.5)

elapsed_time = time.time() - start_time
print(f"\n✅ Generated {len(migrated_docs)} embeddings in {elapsed_time:.1f}s")
print(f"   Average: {elapsed_time/len(migrated_docs):.2f}s per document")
print(f"   New embedding dimension: 1536")

# Save migrated data
print(f"\n💾 Saving to: {OUTPUT_FILE}")
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(migrated_docs, f, ensure_ascii=False, indent=2)

file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
print(f"✅ Saved! File size: {file_size_mb:.1f} MB")

print(f"\n📊 Migration Summary:")
print(f"  Documents migrated: {len(migrated_docs)}")
print(f"  Old embedding: 384-dim (local_minilm_l6_v2)")
print(f"  New embedding: 1536-dim (openai_text-embedding-3-small)")
print(f"  Input file: {INPUT_FILE}")
print(f"  Output file: {OUTPUT_FILE}")

print(f"\n🎯 Next steps:")
print(f"  1. Load this into ChromaDB")
print(f"  2. Test search queries")
print(f"  3. Upload to Fly.io")
