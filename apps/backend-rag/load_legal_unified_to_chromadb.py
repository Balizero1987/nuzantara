"""
Load legal_unified_openai.json into ChromaDB
Creates a new collection with 1536-dim embeddings
"""
import json
import chromadb
import os

# Configuration
INPUT_FILE = "/Users/antonellosiano/Desktop/test_chroma_db/collections_clean/legal_unified_openai.json"
CHROMA_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_local"
COLLECTION_NAME = "legal_unified"

# Create chroma_db_local directory if doesn't exist
os.makedirs(CHROMA_PATH, exist_ok=True)

print(f"🔧 Initializing ChromaDB at: {CHROMA_PATH}")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Delete old collection if exists
try:
    chroma_client.delete_collection(COLLECTION_NAME)
    print(f"  Deleted existing collection: {COLLECTION_NAME}")
except:
    pass

# Create new collection
print(f"📦 Creating collection: {COLLECTION_NAME}")
collection = chroma_client.create_collection(
    name=COLLECTION_NAME,
    metadata={
        "embedding_dimension": 1536,
        "embedding_provider": "openai",
        "model": "text-embedding-3-small"
    }
)

# Load migrated data
print(f"📥 Loading data from: {INPUT_FILE}")
with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    documents = json.load(f)

print(f"✅ Loaded {len(documents)} documents")

# Prepare data for ChromaDB
ids = [doc['id'] for doc in documents]
texts = [doc['text'] for doc in documents]
embeddings = [doc['embedding'] for doc in documents]
metadatas = [doc.get('metadata', {}) for doc in documents]

# Add to collection in batches
BATCH_SIZE = 100
total_batches = (len(documents) + BATCH_SIZE - 1) // BATCH_SIZE

print(f"\n💾 Adding documents in {total_batches} batches of {BATCH_SIZE}...")
for i in range(0, len(documents), BATCH_SIZE):
    batch_num = i // BATCH_SIZE + 1
    end_idx = min(i + BATCH_SIZE, len(documents))

    collection.add(
        ids=ids[i:end_idx],
        documents=texts[i:end_idx],
        embeddings=embeddings[i:end_idx],
        metadatas=metadatas[i:end_idx]
    )

    print(f"  Batch {batch_num}/{total_batches}: Added {end_idx - i} documents")

print(f"\n✅ Collection created successfully!")
print(f"   Collection: {COLLECTION_NAME}")
print(f"   Documents: {collection.count()}")
print(f"   Path: {CHROMA_PATH}")

# Test query
print(f"\n🧪 Testing search...")
from openai import OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

test_query = "visa B211A requirements documents"
test_response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=test_query
)
test_embedding = test_response.data[0].embedding

results = collection.query(
    query_embeddings=[test_embedding],
    n_results=3
)

print(f"✅ Test query: '{test_query}'")
print(f"   Results found: {len(results['documents'][0])}")
for i, (doc, distance) in enumerate(zip(results['documents'][0], results['distances'][0])):
    print(f"   {i+1}. Distance: {distance:.4f} | Text: {doc[:100]}...")

print(f"\n🎯 Next step: Upload {CHROMA_PATH} to Fly.io /data/chroma_db_FULL_deploy")
