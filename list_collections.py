#!/usr/bin/env python3
import chromadb

client = chromadb.PersistentClient(path="./chroma_data")
collections = client.list_collections()

print(f"\n📚 CHROMADB COLLECTIONS ({len(collections)} total):\n")
for coll in collections:
    try:
        count = coll.count()
        print(f"   • {coll.name}: {count} documents")
    except:
        print(f"   • {coll.name}: (error counting)")
