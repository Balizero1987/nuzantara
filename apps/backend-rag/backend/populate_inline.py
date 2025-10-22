#!/usr/bin/env python3
"""Minimal Oracle population script - run in Railway shell"""
import sys
sys.path.insert(0, '.')

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

print("🚀 Starting Oracle population...")
embedder = EmbeddingsGenerator()

# Tax
print("📊 Tax updates...")
tax_texts = ["Tax: PPh 21 reduced 25% to 22%", "Tax: VAT 12% April 2025"]
tax_emb = [embedder.generate_single_embedding(t) for t in tax_texts]
ChromaDBClient(collection_name="tax_updates").upsert_documents(
    tax_texts, tax_emb,
    [{"id": f"tax_{i}"} for i in range(len(tax_texts))],
    [f"tax_{i}" for i in range(len(tax_texts))]
)
print(f"✅ {len(tax_texts)} tax")

# Legal
print("⚖️  Legal updates...")
legal_texts = ["Legal: PT PMA IDR 5B", "Legal: Wage +6.5%"]
legal_emb = [embedder.generate_single_embedding(t) for t in legal_texts]
ChromaDBClient(collection_name="legal_updates").upsert_documents(
    legal_texts, legal_emb,
    [{"id": f"legal_{i}"} for i in range(len(legal_texts))],
    [f"legal_{i}" for i in range(len(legal_texts))]
)
print(f"✅ {len(legal_texts)} legal")

# Property
print("🏠 Properties...")
prop_texts = ["Property: Canggu 4BR IDR 15B", "Property: Seminyak 6BR IDR 25B"]
prop_emb = [embedder.generate_single_embedding(t) for t in prop_texts]
ChromaDBClient(collection_name="property_listings").upsert_documents(
    prop_texts, prop_emb,
    [{"id": f"prop_{i}"} for i in range(len(prop_texts))],
    [f"prop_{i}" for i in range(len(prop_texts))]
)
print(f"✅ {len(prop_texts)} property")

print("\n🎉 Done! Total: 6 documents")
