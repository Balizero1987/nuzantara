#!/bin/bash
# Oracle Population Script for Railway Shell
# Run with: railway run bash populate_oracle_railway.sh

echo "================================"
echo "POPULATING ORACLE COLLECTIONS"
echo "================================"

cd apps/backend-rag/backend

python3 << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, '.')

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

print("\n📊 Populating Tax Updates...")
embedder = EmbeddingsGenerator()

# Tax Updates
tax_data = [
    ("tax_001", "PPh 21 Rate Change", "Top rate reduced from 25% to 22%"),
    ("tax_002", "VAT Increase to 12%", "VAT increases April 1, 2025")
]

texts = [f"Tax: {t[1]} - {t[2]}" for t in tax_data]
embeddings = [embedder.generate_single_embedding(t) for t in texts]
ids = [t[0] for t in tax_data]
meta = [{"id": t[0], "title": t[1]} for t in tax_data]

coll = ChromaDBClient(collection_name="tax_updates")
coll.upsert_documents(chunks=texts, embeddings=embeddings, metadatas=meta, ids=ids)

print(f"✅ Added {len(texts)} tax updates")

# Legal Updates
legal_data = [
    ("legal_001", "PT PMA Capital Reduced", "Min capital IDR 5B for tech"),
    ("legal_002", "Minimum Wage Increase", "6.5% average increase")
]

texts = [f"Legal: {t[1]} - {t[2]}" for t in legal_data]
embeddings = [embedder.generate_single_embedding(t) for t in texts]
ids = [t[0] for t in legal_data]
meta = [{"id": t[0], "title": t[1]} for t in legal_data]

coll = ChromaDBClient(collection_name="legal_updates")
coll.upsert_documents(chunks=texts, embeddings=embeddings, metadatas=meta, ids=ids)

print(f"✅ Added {len(texts)} legal updates")

# Property
prop_data = [
    ("prop_001", "Canggu Villa", "4BR IDR 15B ocean view"),
    ("prop_002", "Seminyak Villa", "6BR IDR 25B beachfront")
]

texts = [f"Property: {t[1]} - {t[2]}" for t in prop_data]
embeddings = [embedder.generate_single_embedding(t) for t in texts]
ids = [t[0] for t in prop_data]
meta = [{"id": t[0], "title": t[1]} for t in prop_data]

coll = ChromaDBClient(collection_name="property_listings")
coll.upsert_documents(chunks=texts, embeddings=embeddings, metadatas=meta, ids=ids)

print(f"✅ Added {len(texts)} property listings")
print("\n🎉 Oracle collections populated successfully!")

PYTHON_SCRIPT

echo "================================"
echo "DONE!"
echo "================================"
