#!/usr/bin/env python3
"""
Populate Oracle collections on Railway - uses volume path
"""
import sys
import os

# Set ChromaDB to use Railway volume
os.environ['CHROMA_DB_PATH'] = '/data/chroma_db'

# Add backend to path
sys.path.insert(0, 'apps/backend-rag/backend')

print("🚀 Oracle Population - Railway Volume")
print(f"📁 ChromaDB Path: {os.environ['CHROMA_DB_PATH']}")

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

embedder = EmbeddingsGenerator()

# TAX
print("\n📊 Tax updates...")
tax_texts = [
    "Tax Update: PPh 21 rate reduced from 25% to 22% for high earners",
    "Tax Update: VAT increased from 11% to 12% effective April 2025",
    "Tax Update: Carbon tax IDR 30,000/ton implemented for coal power",
    "Tax Update: E-invoicing mandatory for all PKP by July 2025",
    "Tax Update: Tax amnesty program extended until June 2025",
    "Tax Update: Transfer pricing CbCR threshold reduced to IDR 10 trillion"
]
tax_emb = [embedder.generate_single_embedding(t) for t in tax_texts]
tax_meta = [{"id": f"tax_{i}", "category": "tax_update"} for i in range(len(tax_texts))]
tax_ids = [f"tax_{i}" for i in range(len(tax_texts))]

ChromaDBClient(collection_name="tax_updates").upsert_documents(
    chunks=tax_texts, embeddings=tax_emb, metadatas=tax_meta, ids=tax_ids
)
print(f"✅ {len(tax_texts)} tax updates")

# LEGAL
print("\n⚖️  Legal updates...")
legal_texts = [
    "Legal Update: PT PMA minimum capital reduced from IDR 10B to IDR 5B for tech sectors",
    "Legal Update: Minimum wage increased 6.5% average - Jakarta IDR 5.3M",
    "Legal Update: OSS biometric face recognition required for new business licenses",
    "Legal Update: AMDAL environmental assessment required for projects above 2 hectares",
    "Legal Update: IMB building permits now fully digital - 7 day processing",
    "Legal Update: Leasehold extension process streamlined to 30 days",
    "Legal Update: Expatriate quotas increased - IT 50%, healthcare 40%"
]
legal_emb = [embedder.generate_single_embedding(t) for t in legal_texts]
legal_meta = [{"id": f"legal_{i}", "category": "legal_update"} for i in range(len(legal_texts))]
legal_ids = [f"legal_{i}" for i in range(len(legal_texts))]

ChromaDBClient(collection_name="legal_updates").upsert_documents(
    chunks=legal_texts, embeddings=legal_emb, metadatas=legal_meta, ids=legal_ids
)
print(f"✅ {len(legal_texts)} legal updates")

# PROPERTY
print("\n🏠 Property listings...")
prop_texts = [
    "Property: Luxury Villa in Canggu - 4BR, ocean view, IDR 15B, private pool, modern kitchen",
    "Property: Seminyak Beachfront Villa - 6BR, IDR 25B, direct beach access, staff quarters",
    "Property: Ubud Rice Field Villa - 3BR, IDR 8.5B, eco-friendly, yoga pavilion, organic garden",
    "Property: Sanur Commercial Building - IDR 45B, 1200m² land, hotel/restaurant zoning, beach road"
]
prop_emb = [embedder.generate_single_embedding(t) for t in prop_texts]
prop_meta = [{"id": f"prop_{i}", "category": "listing"} for i in range(len(prop_texts))]
prop_ids = [f"prop_{i}" for i in range(len(prop_texts))]

ChromaDBClient(collection_name="property_listings").upsert_documents(
    chunks=prop_texts, embeddings=prop_emb, metadatas=prop_meta, ids=prop_ids
)
print(f"✅ {len(prop_texts)} property listings")

total = len(tax_texts) + len(legal_texts) + len(prop_texts)
print(f"\n🎉 DONE! Total: {total} documents")
print("✅ Oracle collections ready for queries")
