#!/usr/bin/env python3
"""
Merge ChromaDB Collections for Full Deployment
Unisce le forze agentiche con legal_intelligence e books_intelligence
"""
import chromadb
import shutil
import os

# Paths
SOURCE_BACKUP = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/backend/data/chroma_db_full_backup"
SOURCE_CURRENT = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_deploy"
TARGET = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_FULL_deploy"

print("🔄 MERGE CHROMADB - Forze Agentiche + Legal/Books\n")

# Create fresh target directory
if os.path.exists(TARGET):
    print(f"⚠️  Rimuovo vecchio target: {TARGET}")
    shutil.rmtree(TARGET)

os.makedirs(TARGET)
print(f"✅ Creato target: {TARGET}\n")

# Initialize clients
source_backup_client = chromadb.PersistentClient(path=SOURCE_BACKUP)
source_current_client = chromadb.PersistentClient(path=SOURCE_CURRENT)
target_client = chromadb.PersistentClient(path=TARGET)

print("📚 Collections da unire:\n")

# Get all collections from backup (11 agentiche)
backup_colls = source_backup_client.list_collections()
print(f"💾 BACKUP (Forze Agentiche): {len(backup_colls)} collections")
for c in sorted(backup_colls, key=lambda x: x.name):
    print(f"   • {c.name}: {c.count():,} docs")

# Get current collections (legal + books)
current_colls = source_current_client.list_collections()
print(f"\n📦 CURRENT (Legal/Books): {len(current_colls)} collections")
for c in sorted(current_colls, key=lambda x: x.name):
    print(f"   • {c.name}: {c.count():,} docs")

print(f"\n🎯 TOTALE: {len(backup_colls) + len(current_colls)} collections")
print(f"📊 DOCUMENTI: {sum(c.count() for c in backup_colls) + sum(c.count() for c in current_colls):,} docs\n")

# Copy all collections
print("🔄 Copiando collections...\n")

# Copy from backup (agentiche)
for source_coll in backup_colls:
    print(f"   Copiando {source_coll.name} ({source_coll.count():,} docs)...", end=" ")
    
    # Get all data
    all_data = source_coll.get(include=["embeddings", "documents", "metadatas"])
    
    # Create collection in target
    target_coll = target_client.get_or_create_collection(
        name=source_coll.name,
        metadata=source_coll.metadata
    )
    
    # Add data in batches
    batch_size = 500
    for i in range(0, len(all_data['ids']), batch_size):
        batch_ids = all_data['ids'][i:i+batch_size]
        batch_embeddings = all_data['embeddings'][i:i+batch_size] if all_data['embeddings'] is not None else None
        batch_documents = all_data['documents'][i:i+batch_size] if all_data['documents'] is not None else None
        batch_metadatas = all_data['metadatas'][i:i+batch_size] if all_data['metadatas'] is not None else None
        
        target_coll.add(
            ids=batch_ids,
            embeddings=batch_embeddings,
            documents=batch_documents,
            metadatas=batch_metadatas
        )
    
    print("✅")

# Copy from current (legal + books)
for source_coll in current_colls:
    print(f"   Copiando {source_coll.name} ({source_coll.count():,} docs)...", end=" ")
    
    # Get all data
    all_data = source_coll.get(include=["embeddings", "documents", "metadatas"])
    
    # Create collection in target
    target_coll = target_client.get_or_create_collection(
        name=source_coll.name,
        metadata=source_coll.metadata
    )
    
    # Add data in batches
    batch_size = 500
    for i in range(0, len(all_data['ids']), batch_size):
        batch_ids = all_data['ids'][i:i+batch_size]
        batch_embeddings = all_data['embeddings'][i:i+batch_size] if all_data['embeddings'] is not None else None
        batch_documents = all_data['documents'][i:i+batch_size] if all_data['documents'] is not None else None
        batch_metadatas = all_data['metadatas'][i:i+batch_size] if all_data['metadatas'] is not None else None
        
        target_coll.add(
            ids=batch_ids,
            embeddings=batch_embeddings,
            documents=batch_documents,
            metadatas=batch_metadatas
        )
    
    print("✅")

# Verify
print("\n✅ MERGE COMPLETATO!\n")
print("📊 VERIFICA DATABASE FINALE:\n")
final_colls = target_client.list_collections()
for c in sorted(final_colls, key=lambda x: x.name):
    print(f"   • {c.name}: {c.count():,} docs")

print(f"\n🎯 TOTALE: {len(final_colls)} collections, {sum(c.count() for c in final_colls):,} documenti")
print(f"\n📁 Path: {TARGET}")
print("💾 Dimensione: ", end="")
os.system(f"du -sh {TARGET}")
