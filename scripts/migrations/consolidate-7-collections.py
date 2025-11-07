#!/usr/bin/env python3
"""
Consolidate 13 collections → 7 collections
Preserving all 25,427 documents
"""
import chromadb
from pathlib import Path

source_path = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_FULL_deploy"
target_path = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_7_collections"

# Create target directory
Path(target_path).mkdir(parents=True, exist_ok=True)

# Source client (13 collections)
source_client = chromadb.PersistentClient(path=source_path)

# Target client (7 collections)
target_client = chromadb.PersistentClient(path=target_path)

print("📊 CONSOLIDATION PLAN:\n")

# LAYER ACTION
print("🎯 LAYER ACTION (esecuzione immediata):")

# 1. kbli_unified (8,887 docs)
print("\n1️⃣ kbli_unified...")
kbli_unified = target_client.get_or_create_collection("kbli_unified")
for source_name in ["kbli_eye", "kbli_comprehensive"]:
    source_coll = source_client.get_collection(source_name)
    data = source_coll.get(include=["documents", "metadatas", "embeddings"])
    if data["ids"]:
        # Add in batches of 5000 to avoid max batch size error
        batch_size = 5000
        for i in range(0, len(data["ids"]), batch_size):
            end_idx = min(i + batch_size, len(data["ids"]))
            kbli_unified.add(
                ids=data["ids"][i:end_idx],
                documents=data["documents"][i:end_idx] if data["documents"] is not None else None,
                metadatas=data["metadatas"][i:end_idx] if data["metadatas"] is not None else None,
                embeddings=data["embeddings"][i:end_idx] if data["embeddings"] is not None else None
            )
            print(f"   📤 {source_name}: batch {i//batch_size + 1} ({end_idx - i} docs)")
        print(f"   ✅ {source_name}: {len(data['ids'])} docs total")
print(f"   🎯 Total: {kbli_unified.count()} docs")

# 2. legal_unified (5,041 docs)
print("\n2️⃣ legal_unified...")
legal_unified = target_client.get_or_create_collection("legal_unified")
for source_name in ["legal_intelligence", "legal_updates", "legal_architect"]:
    source_coll = source_client.get_collection(source_name)
    data = source_coll.get(include=["documents", "metadatas", "embeddings"])
    if data["ids"]:
        batch_size = 5000
        for i in range(0, len(data["ids"]), batch_size):
            end_idx = min(i + batch_size, len(data["ids"]))
            legal_unified.add(
                ids=data["ids"][i:end_idx],
                documents=data["documents"][i:end_idx] if data["documents"] is not None else None,
                metadatas=data["metadatas"][i:end_idx] if data["metadatas"] is not None else None,
                embeddings=data["embeddings"][i:end_idx] if data["embeddings"] is not None else None
            )
        print(f"   ✅ {source_name}: {len(data['ids'])} docs")
print(f"   🎯 Total: {legal_unified.count()} docs")

# 3. property_unified (40 docs)
print("\n3️⃣ property_unified...")
property_unified = target_client.get_or_create_collection("property_unified")
for source_name in ["property_listings", "property_knowledge"]:
    source_coll = source_client.get_collection(source_name)
    data = source_coll.get(include=["documents", "metadatas", "embeddings"])
    if data["ids"]:
        property_unified.add(
            ids=data["ids"],
            documents=data["documents"] if data["documents"] is not None else None,
            metadatas=data["metadatas"] if data["metadatas"] is not None else None,
            embeddings=data["embeddings"] if data["embeddings"] is not None else None
        )
        print(f"   ✅ {source_name}: {len(data['ids'])} docs")
print(f"   🎯 Total: {property_unified.count()} docs")

# LAYER BUSINESS
print("\n\n💼 LAYER BUSINESS (intelligenza specializzata):")

# 4. knowledge_base (8,923 docs)
print("\n4️⃣ knowledge_base...")
knowledge_base = target_client.get_or_create_collection("knowledge_base")
for source_name in ["books_intelligence", "tech_knowledge", "cultural_insights"]:
    source_coll = source_client.get_collection(source_name)
    data = source_coll.get(include=["documents", "metadatas", "embeddings"])
    if data["ids"]:
        batch_size = 5000
        for i in range(0, len(data["ids"]), batch_size):
            end_idx = min(i + batch_size, len(data["ids"]))
            knowledge_base.add(
                ids=data["ids"][i:end_idx],
                documents=data["documents"][i:end_idx] if data["documents"] is not None else None,
                metadatas=data["metadatas"][i:end_idx] if data["metadatas"] is not None else None,
                embeddings=data["embeddings"][i:end_idx] if data["embeddings"] is not None else None
            )
        print(f"   ✅ {source_name}: {len(data['ids'])} docs")
print(f"   🎯 Total: {knowledge_base.count()} docs")

# 5. tax_genius (895 docs) - preserved
print("\n5️⃣ tax_genius...")
tax_genius = target_client.get_or_create_collection("tax_genius")
source_coll = source_client.get_collection("tax_genius")
data = source_coll.get(include=["documents", "metadatas", "embeddings"])
if data["ids"]:
    tax_genius.add(
        ids=data["ids"],
        documents=data["documents"] if data["documents"] is not None else None,
        metadatas=data["metadatas"] if data["metadatas"] is not None else None,
        embeddings=data["embeddings"] if data["embeddings"] is not None else None
    )
    print(f"   ✅ tax_genius: {len(data['ids'])} docs")
print(f"   🎯 Total: {tax_genius.count()} docs")

# 6. visa_oracle (1,612 docs) - preserved
print("\n6️⃣ visa_oracle...")
visa_oracle = target_client.get_or_create_collection("visa_oracle")
source_coll = source_client.get_collection("visa_oracle")
data = source_coll.get(include=["documents", "metadatas", "embeddings"])
if data["ids"]:
    visa_oracle.add(
        ids=data["ids"],
        documents=data["documents"] if data["documents"] is not None else None,
        metadatas=data["metadatas"] if data["metadatas"] is not None else None,
        embeddings=data["embeddings"] if data["embeddings"] is not None else None
    )
    print(f"   ✅ visa_oracle: {len(data['ids'])} docs")
print(f"   🎯 Total: {visa_oracle.count()} docs")

# LAYER REFERENCE
print("\n\n📋 LAYER REFERENCE (pricing/zero tariffe):")

# 7. bali_zero_pricing (29 docs) - preserved
print("\n7️⃣ bali_zero_pricing...")
bali_zero_pricing = target_client.get_or_create_collection("bali_zero_pricing")
source_coll = source_client.get_collection("bali_zero_pricing")
data = source_coll.get(include=["documents", "metadatas", "embeddings"])
if data["ids"]:
    bali_zero_pricing.add(
        ids=data["ids"],
        documents=data["documents"] if data["documents"] is not None else None,
        metadatas=data["metadatas"] if data["metadatas"] is not None else None,
        embeddings=data["embeddings"] if data["embeddings"] is not None else None
    )
    print(f"   ✅ bali_zero_pricing: {len(data['ids'])} docs")
print(f"   🎯 Total: {bali_zero_pricing.count()} docs")

# FINAL SUMMARY
print("\n\n" + "="*60)
print("✅ CONSOLIDATION COMPLETE")
print("="*60)

all_collections = target_client.list_collections()
total_docs = sum(c.count() for c in all_collections)

print(f"\n📊 COLLECTIONS: {len(all_collections)}")
for coll in all_collections:
    print(f"   - {coll.name}: {coll.count():,} docs")

print(f"\n🎯 TOTAL DOCUMENTS: {total_docs:,}")
print(f"📁 TARGET PATH: {target_path}")
