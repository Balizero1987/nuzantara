#!/usr/bin/env python3
"""
DEPLOY PP 28/2025 TO ZANTARA KB
Deploy NOW - Complete ingestion script
"""
import chromadb
import json
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Paths
JSONL_FILE = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data/PP_28_2025_READY_FOR_KB.jsonl")
CHROMA_PATH = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/chroma_data")

print("=" * 80)
print("🚀 PP 28/2025 DEPLOYMENT TO ZANTARA KB")
print("=" * 80)

# Initialize ChromaDB
print("\n⏳ Initializing ChromaDB...")
CHROMA_PATH.mkdir(exist_ok=True)
client = chromadb.PersistentClient(path=str(CHROMA_PATH))

# Create collection
print("⏳ Creating 'legal_intelligence' collection...")
try:
    collection = client.get_or_create_collection(
        name="legal_intelligence",
        metadata={
            "description": "Indonesian Legal Regulations",
            "hnsw:space": "cosine"
        }
    )
    print(f"✅ Collection created/retrieved: {collection.count()} existing docs")
except Exception as e:
    print(f"❌ Error creating collection: {e}")
    exit(1)

# Load embedding model
print("\n⏳ Loading embedding model...")
try:
    model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
    print("✅ Model loaded")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit(1)

# Load and ingest JSONL
print(f"\n⏳ Loading chunks from {JSONL_FILE}...")
chunks_ingested = 0
batch_size = 50
batch_ids = []
batch_docs = []
batch_metas = []
batch_embeddings = []

try:
    with open(JSONL_FILE, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                doc = json.loads(line.strip())
                
                # Extract data
                doc_id = doc['id']
                content = doc['content']
                metadata = {
                    "document_id": doc['document_id'],
                    "document_title": doc['document_title'],
                    "pasal": doc['pasal'],
                    "law_id": doc['metadata']['law_id'],
                    "category": doc['category'],
                    "language": doc['language'],
                    "has_kbli": doc['has_kbli'],
                    "systems": ",".join(doc['systems']) if doc['systems'] else ""
                }
                
                # Generate embedding
                embedding = model.encode(content).tolist()
                
                # Add to batch
                batch_ids.append(doc_id)
                batch_docs.append(content)
                batch_metas.append(metadata)
                batch_embeddings.append(embedding)
                
                # Ingest batch
                if len(batch_ids) >= batch_size:
                    collection.add(
                        ids=batch_ids,
                        documents=batch_docs,
                        metadatas=batch_metas,
                        embeddings=batch_embeddings
                    )
                    chunks_ingested += len(batch_ids)
                    print(f"   ✅ Batch {chunks_ingested//batch_size}: {chunks_ingested} chunks ingested")
                    
                    # Reset batch
                    batch_ids = []
                    batch_docs = []
                    batch_metas = []
                    batch_embeddings = []
                    
            except json.JSONDecodeError as e:
                print(f"   ⚠️  Skipping line {line_num}: Invalid JSON")
                continue
            except Exception as e:
                print(f"   ⚠️  Error on line {line_num}: {e}")
                continue
    
    # Ingest remaining batch
    if batch_ids:
        collection.add(
            ids=batch_ids,
            documents=batch_docs,
            metadatas=batch_metas,
            embeddings=batch_embeddings
        )
        chunks_ingested += len(batch_ids)
        print(f"   ✅ Final batch: {chunks_ingested} total chunks ingested")
    
    print(f"\n✅ Successfully ingested {chunks_ingested} chunks")
    
except FileNotFoundError:
    print(f"❌ File not found: {JSONL_FILE}")
    exit(1)
except Exception as e:
    print(f"❌ Error during ingestion: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Verify ingestion
print("\n⏳ Verifying ingestion...")
final_count = collection.count()
print(f"✅ Collection now contains: {final_count} documents")

# Test queries
print("\n" + "=" * 80)
print("🧪 TESTING QUERIES")
print("=" * 80)

test_queries = [
    "KBLI 5 digit OSS",
    "Pasal 211",
    "TKA foreign workers",
    "perizinan berusaha berbasis risiko"
]

for query in test_queries:
    print(f"\n🔍 Query: '{query}'")
    query_embedding = model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=3
    )
    
    if results['documents'] and results['documents'][0]:
        print(f"   ✅ Found {len(results['documents'][0])} results")
        print(f"   📄 Top result: {results['documents'][0][0][:100]}...")
        print(f"   🏷️  Metadata: Pasal {results['metadatas'][0][0].get('pasal', 'N/A')}")
    else:
        print("   ⚠️  No results found")

print("\n" + "=" * 80)
print("✅ DEPLOYMENT COMPLETE")
print("=" * 80)
print(f"\n📊 Final Statistics:")
print(f"   • Collection: legal_intelligence")
print(f"   • Documents: {final_count}")
print(f"   • Law: PP 28/2025 (PBBR)")
print(f"   • Status: DEPLOYED ✅")

print("\n🎯 Next: Test with ZANTARA queries in the webapp!")

