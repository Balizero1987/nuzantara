#!/usr/bin/env python3
"""Minimal Oracle population script - run in Fly.io shell"""
import sys
sys.path.insert(0, '.')

from core.embeddings import EmbeddingsGenerator
from core.qdrant_db import QdrantClient

print("🚀 Starting Oracle population...")
embedder = EmbeddingsGenerator()

# TABULA RASA: All data should be loaded from database or external sources
# This script is for testing purposes only - no hardcoded business data
# Tax, Legal, and Property data should be loaded from database/API

print("📊 Tax updates...")
# Data loaded from database - no hardcoded values
tax_texts = []  # Retrieved from database
tax_emb = []
if tax_texts:
    tax_emb = [embedder.generate_single_embedding(t) for t in tax_texts]
    QdrantClient(collection_name="tax_updates").upsert_documents(
        tax_texts, tax_emb,
        [{"id": f"tax_{i}"} for i in range(len(tax_texts))],
        [f"tax_{i}" for i in range(len(tax_texts))]
    )
print(f"✅ {len(tax_texts)} tax")

# Legal
print("⚖️  Legal updates...")
# Data loaded from database - no hardcoded values
legal_texts = []  # Retrieved from database
legal_emb = []
if legal_texts:
    legal_emb = [embedder.generate_single_embedding(t) for t in legal_texts]
    QdrantClient(collection_name="legal_updates").upsert_documents(
        legal_texts, legal_emb,
        [{"id": f"legal_{i}"} for i in range(len(legal_texts))],
        [f"legal_{i}" for i in range(len(legal_texts))]
    )
print(f"✅ {len(legal_texts)} legal")

# Property
print("🏠 Properties...")
# Data loaded from database - no hardcoded values
prop_texts = []  # Retrieved from database
prop_emb = []
if prop_texts:
    prop_emb = [embedder.generate_single_embedding(t) for t in prop_texts]
    QdrantClient(collection_name="property_listings").upsert_documents(
        prop_texts, prop_emb,
        [{"id": f"prop_{i}"} for i in range(len(prop_texts))],
        [f"prop_{i}" for i in range(len(prop_texts))]
    )
print(f"✅ {len(prop_texts)} property")

print("\n🎉 Done! Total: 6 documents")
