#!/usr/bin/env python3
"""
ChromaDB Ingestion Script - KB_FINAL_2025-10-05
Ingests operational docs (no philosophy books) to ChromaDB production
"""

import os
import chromadb
from chromadb.config import Settings
from pathlib import Path
import hashlib
from datetime import datetime

# Configuration
CHROMA_PATH = "/tmp/chroma_db_new"
KB_BASE_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/DATABASE/KB"

# Collections to ingest (NO raw_books_philosophy)
COLLECTIONS_CONFIG = {
    "visa_oracle": {
        "path": "visa_oracle",
        "description": "Immigration, KITAS, KITAP, visas, Golden Visa",
        "file_extensions": [".txt", ".md", ".json"]
    },
    "kbli_eye": {
        "path": "kbli_eye",
        "description": "Business classification KBLI 2020, OSS, PT PMA",
        "file_extensions": [".txt", ".md", ".json"]
    },
    "tax_genius": {
        "path": "tax_genius",
        "description": "Indonesian tax regulations, NPWPs, compliance",
        "file_extensions": [".txt", ".md", ".json"]
    },
    "legal_architect": {
        "path": "legal_architect",
        "description": "Indonesian legal framework, contracts, property",
        "file_extensions": [".txt", ".md", ".json"]
    },
    "zantara_books": {
        "path": "zantara_books",
        "description": "Bali Zero pricelist and internal docs",
        "file_extensions": [".txt", ".md", ".json"]
    },
    "kb_indonesian": {
        "path": "KB_human_readable_ID",
        "description": "Indonesian language operational guides",
        "file_extensions": [".md", ".txt"]
    },
    "kbli_comprehensive": {
        "path": "KB_backup_pre_migration",
        "description": "English KBLI comprehensive guides",
        "file_extensions": [".md", ".txt"]
    }
}

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size

        # Try to break at sentence boundary
        if end < text_len:
            # Look for period followed by space or newline
            for i in range(end, max(start, end - 100), -1):
                if text[i] in '.!?\n':
                    end = i + 1
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap if end < text_len else text_len

    return chunks

def generate_doc_id(filepath, chunk_index=0):
    """Generate unique document ID"""
    content = f"{filepath}_{chunk_index}"
    return hashlib.md5(content.encode()).hexdigest()

def ingest_collection(client, collection_name, config):
    """Ingest documents into a ChromaDB collection"""
    print(f"\n{'='*80}")
    print(f"Processing collection: {collection_name}")
    print(f"{'='*80}")

    # Create or get collection
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"description": config["description"]}
    )

    # Find all files
    collection_path = Path(KB_BASE_PATH) / config["path"]
    if not collection_path.exists():
        print(f"⚠️  Path not found: {collection_path}")
        return 0

    files = []
    for ext in config["file_extensions"]:
        files.extend(collection_path.rglob(f"*{ext}"))

    # Filter out metadata files and inventory files
    files = [f for f in files if not f.name.endswith('.meta.json')
             and not f.name.startswith('00_')
             and not f.name == 'README.md'
             and '.meta.' not in f.name]

    print(f"Found {len(files)} files to process")

    total_chunks = 0

    for file_path in files:
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            if not content.strip():
                print(f"⚠️  Empty file: {file_path.name}")
                continue

            # Determine if we should chunk (TXT guides are clean, don't over-chunk)
            if file_path.suffix == '.txt' and len(content) > 5000:
                # These are comprehensive guides - chunk at section boundaries
                chunks = chunk_text(content, chunk_size=1500, overlap=300)
            elif file_path.suffix == '.md' and len(content) > 3000:
                # Markdown files - chunk at reasonable size
                chunks = chunk_text(content, chunk_size=1000, overlap=200)
            else:
                # Small files - keep as single chunk
                chunks = [content]

            # Prepare metadata
            relative_path = str(file_path.relative_to(KB_BASE_PATH))

            # Add chunks to collection
            for idx, chunk in enumerate(chunks):
                doc_id = generate_doc_id(relative_path, idx)

                metadata = {
                    "source": relative_path,
                    "filename": file_path.name,
                    "collection": collection_name,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                    "file_type": file_path.suffix,
                    "ingested_at": datetime.now().isoformat(),
                    "title": file_path.stem.replace('_', ' ').title()
                }

                collection.add(
                    documents=[chunk],
                    metadatas=[metadata],
                    ids=[doc_id]
                )

                total_chunks += 1

            print(f"✅ {file_path.name}: {len(chunks)} chunks")

        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")

    print(f"\nCollection {collection_name}: {total_chunks} total chunks")
    return total_chunks

def main():
    print(f"""
{'='*80}
CHROMADB INGESTION - KB_FINAL_2025-10-05
{'='*80}

Source: {KB_BASE_PATH}
Target: {CHROMA_PATH}
Collections: {len(COLLECTIONS_CONFIG)}
Timestamp: {datetime.now().isoformat()}

{'='*80}
""")

    # Initialize ChromaDB client
    if os.path.exists(CHROMA_PATH):
        print(f"⚠️  Removing existing ChromaDB at {CHROMA_PATH}")
        import shutil
        shutil.rmtree(CHROMA_PATH)

    os.makedirs(CHROMA_PATH, exist_ok=True)

    client = chromadb.PersistentClient(
        path=CHROMA_PATH,
        settings=Settings(anonymized_telemetry=False)
    )

    # Ingest each collection
    total_docs = 0
    for collection_name, config in COLLECTIONS_CONFIG.items():
        chunks = ingest_collection(client, collection_name, config)
        total_docs += chunks

    # Summary
    print(f"""
{'='*80}
INGESTION COMPLETE
{'='*80}

Total collections: {len(COLLECTIONS_CONFIG)}
Total documents: {total_docs}
ChromaDB size: {sum(f.stat().st_size for f in Path(CHROMA_PATH).rglob('*') if f.is_file()) / (1024*1024):.2f} MB

Next steps:
1. Upload to GCS: gsutil -m cp -r {CHROMA_PATH}/* gs://nuzantara-chromadb-2025/chroma_db/
2. Restart Cloud Run service to load new ChromaDB
3. Test RAG: curl https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat

{'='*80}
""")

if __name__ == "__main__":
    main()
