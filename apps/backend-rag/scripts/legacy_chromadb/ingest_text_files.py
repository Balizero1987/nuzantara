#!/usr/bin/env python3
"""
Ingest TXT and MD files into ChromaDB
Adds to existing collection without removing PDF/EPUB data
"""

import os
import sys
from pathlib import Path
from tqdm import tqdm
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# Configuration
BOOKS_DIR = Path("zantara-rag/data/raw_books")
KB_DIR = Path("KB")
CHROMA_DIR = Path("zantara-rag/data/chroma_db")
COLLECTION_NAME = "zantara_books"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

print("=" * 70)
print("📚 ZANTARA RAG - TXT/MD Files Ingestion")
print("=" * 70)
print()

# Initialize embedding model
print("🔧 Loading sentence-transformers model...")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print("✅ Model loaded")

# Initialize ChromaDB
print("🔧 Connecting to ChromaDB...")
client = chromadb.PersistentClient(
    path=str(CHROMA_DIR),
    settings=Settings(anonymized_telemetry=False, allow_reset=False)
)
collection = client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"description": "ZANTARA Books Knowledge Base"}
)
existing_count = collection.count()
print(f"✅ ChromaDB connected: {existing_count} existing documents")
print()

def read_text_file(file_path):
    """Read text file with UTF-8 encoding"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # Try with latin-1 as fallback
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except Exception as e:
            print(f"❌ Encoding error: {e}")
            return None
    except Exception as e:
        print(f"❌ Read error: {e}")
        return None

def chunk_text(text, chunk_size=500, overlap=50):
    """Simple text chunking"""
    chunks = []
    words = text.split()

    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk.strip()) > 50:  # Skip tiny chunks
            chunks.append(chunk)

    return chunks

def classify_tier(file_path, content):
    """Enhanced tier classification for TXT/MD files"""
    name_lower = str(file_path).lower()
    content_lower = content.lower()[:1000]  # Check first 1000 chars

    # Tier S+: Bali Zero official documents (highest priority)
    if 'bali_zero' in name_lower or 'pricelist' in name_lower:
        return 'S+'

    # Tier S: ZANTARA curated knowledge
    if 'zantara_kb' in name_lower or 'zantara-personal' in name_lower:
        return 'S'

    # Tier A: Sacred texts, philosophy
    sacred_keywords = ['quran', 'bhagavad', 'upanishad', 'bible', 'dhammapada', 'gita']
    if any(kw in name_lower for kw in sacred_keywords):
        return 'A'

    philo_keywords = ['plato', 'aristotle', 'confucius', 'epictetus', 'marcus aurelius']
    if any(kw in name_lower for kw in philo_keywords):
        return 'A'

    # Tier B: Classics, literature
    classic_keywords = ['homer', 'dante', 'gilgamesh', 'iliad', 'odyssey', 'divine comedy']
    if any(kw in name_lower for kw in classic_keywords):
        return 'B'

    # Tier C: General culture
    if any(word in name_lower for word in ['wayang', 'gamelan', 'culture', 'history']):
        return 'C'

    # Default: Tier D
    return 'D'

# Collect all TXT and MD files
print("🔍 Scanning for TXT and MD files...")
txt_files = list(BOOKS_DIR.glob("**/*.txt")) + list(KB_DIR.glob("**/*.txt"))
md_files = list(BOOKS_DIR.glob("**/*.md")) + list(KB_DIR.glob("**/*.md"))
all_files = txt_files + md_files

# Remove duplicates
all_files = list(set(all_files))

print(f"✅ Found {len(all_files)} files ({len(txt_files)} TXT, {len(md_files)} MD)")
print()

if not all_files:
    print("❌ No TXT/MD files found!")
    sys.exit(1)

response = input(f"Proceed with ingestion? (y/N): ")
if response.lower() != 'y':
    print("Cancelled.")
    sys.exit(0)

print()
print("🚀 Starting ingestion...")
print()

# Process files
successful = 0
failed = 0
total_chunks = 0
tier_counts = {"S+": 0, "S": 0, "A": 0, "B": 0, "C": 0, "D": 0}

for file_path in tqdm(all_files, desc="Ingesting text files", unit="file"):
    try:
        # Read text
        text = read_text_file(file_path)

        if not text or len(text) < 100:
            tqdm.write(f"❌ {file_path.name}: No text extracted")
            failed += 1
            continue

        # Chunk text
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)

        if not chunks:
            tqdm.write(f"❌ {file_path.name}: No chunks created")
            failed += 1
            continue

        # Classify tier
        tier = classify_tier(file_path, text)
        tier_counts[tier] += 1

        # Generate embeddings
        embeddings = model.encode(chunks, show_progress_bar=False).tolist()

        # Determine category
        if 'zantara-personal' in str(file_path):
            category = 'zantara-personal'
        elif 'bali_zero' in str(file_path).lower():
            category = 'bali-zero-official'
        else:
            category = file_path.parent.name

        # Create metadata
        metadatas = [
            {
                "book_title": file_path.stem,
                "tier": tier,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "category": category,
                "file_type": file_path.suffix[1:],  # txt or md
                "source": "text_ingestion"
            }
            for i in range(len(chunks))
        ]

        # Create IDs
        ids = [f"{file_path.stem}_txt_{i}" for i in range(len(chunks))]

        # Upsert to ChromaDB
        collection.upsert(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        total_chunks += len(chunks)
        successful += 1
        tqdm.write(f"✅ {file_path.name}: {len(chunks)} chunks (Tier {tier})")

    except Exception as e:
        failed += 1
        tqdm.write(f"❌ {file_path.name}: {str(e)}")

# Final summary
print()
print("=" * 70)
print("🎉 TXT/MD Ingestion Complete!")
print("=" * 70)
print()
print(f"✅ Successful: {successful}")
print(f"❌ Failed: {failed}")
print(f"📊 New chunks added: {total_chunks:,}")
print()
print("📚 Tier Distribution:")
for tier, count in sorted(tier_counts.items()):
    if count > 0:
        print(f"   Tier {tier}: {count} files")
print()

# Database stats
new_total = collection.count()
print(f"📊 ChromaDB Updated:")
print(f"   Previous: {existing_count:,} documents")
print(f"   New Total: {new_total:,} documents")
print(f"   Added: {new_total - existing_count:,} documents")
print()
print("✨ Knowledge Base expanded!")
print()
