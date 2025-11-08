#!/usr/bin/env python3
import chromadb
import json
from collections import Counter

# Connect to ChromaDB
client = chromadb.PersistentClient(path="./chroma_data")

# Legal collections
legal_collections = [
    "legal_intelligence",
    "regulatory_updates", 
    "business_ecosystem",
    "kbli_eye"
]

print("=" * 80)
print("INDONESIAN LAWS IN ZANTARA KNOWLEDGE BASE")
print("=" * 80)

all_laws = []

for coll_name in legal_collections:
    try:
        collection = client.get_collection(coll_name)
        results = collection.get(limit=10000, include=['metadatas'])
        
        print(f"\n📚 Collection: {coll_name}")
        print(f"   Total docs: {len(results['ids'])}")
        
        # Extract law references
        laws_found = []
        for metadata in results['metadatas']:
            if metadata:
                # Check various fields for law references
                for key in ['source', 'title', 'document_type', 'law_id']:
                    if key in metadata:
                        val = str(metadata[key])
                        if any(x in val.upper() for x in ['UU', 'PP ', 'PERATURAN', 'KUHP', 'TAX LAW', 'PAJAK']):
                            laws_found.append(val)
                            all_laws.append(val)
        
        if laws_found:
            law_counts = Counter(laws_found)
            print(f"\n   Laws found ({len(law_counts)}):")
            for law, count in law_counts.most_common(20):
                print(f"      • {law} ({count} chunks)")
        else:
            print("   ⚠️  No law documents detected")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

print("\n" + "=" * 80)
print("SUMMARY - UNIQUE LAWS ACROSS ALL COLLECTIONS")
print("=" * 80)

if all_laws:
    unique_laws = Counter(all_laws)
    print(f"\nTotal unique laws: {len(unique_laws)}\n")
    for law, count in unique_laws.most_common():
        print(f"   • {law} ({count} total chunks)")
else:
    print("\n⚠️  NO INDONESIAN LAWS FOUND IN KB")
    print("\nRECOMMENDATION: Ingest the following:")
    print("   1. PP 28/2025 (PBBR) - READY")
    print("   2. UU Cipta Kerja (Job Creation Law)")
    print("   3. UU Perpajakan (Tax Law)")
    print("   4. KUHP (Criminal Code)")
    print("   5. KUHPerdata (Civil Code)")

print("\n" + "=" * 80)
