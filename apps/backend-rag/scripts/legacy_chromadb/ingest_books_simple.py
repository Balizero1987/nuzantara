#!/usr/bin/env python3
"""
Simple ChromaDB book ingestion script
Processes PDFs and EPUBs into ChromaDB using sentence-transformers
"""

import os
import sys
from pathlib import Path
from tqdm import tqdm
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import PyPDF2
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

# Configuration
BOOKS_DIR = Path("zantara-rag/data/raw_books")
CHROMA_DIR = Path("zantara-rag/data/chroma_db")
COLLECTION_NAME = "zantara_books"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

print("=" * 70)
print("📚 ZANTARA RAG - Simple Book Ingestion")
print("=" * 70)
print()

# Initialize embedding model (FREE, no API key)
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
print(f"✅ ChromaDB connected: {collection.count()} existing documents")
print()

def extract_pdf_text(pdf_path):
    """Extract text from PDF"""
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"❌ PDF extraction failed: {e}")
        return None

def extract_epub_text(epub_path):
    """Extract text from EPUB"""
    try:
        book = epub.read_epub(epub_path)
        text = ""
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                text += soup.get_text() + "\n"
        return text
    except Exception as e:
        print(f"❌ EPUB extraction failed: {e}")
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

def classify_tier(book_name):
    """Simple tier classification"""
    name_lower = book_name.lower()

    # Tier S: Quantum, consciousness, advanced metaphysics
    if any(word in name_lower for word in ['quantum', 'consciousness', 'metaphysics', 'hermetic', 'kabbalah']):
        return 'S'
    # Tier A: Philosophy, psychology, spiritual
    elif any(word in name_lower for word in ['philosophy', 'psychology', 'zen', 'tao', 'vedanta', 'upanishad']):
        return 'A'
    # Tier B: History, culture
    elif any(word in name_lower for word in ['history', 'culture', 'myth', 'tradition']):
        return 'B'
    # Tier C: Business, self-help
    elif any(word in name_lower for word in ['business', 'management', 'success', 'habit']):
        return 'C'
    # Tier D: General
    else:
        return 'D'

# Get all books
pdf_files = list(BOOKS_DIR.glob("**/*.pdf"))
epub_files = list(BOOKS_DIR.glob("**/*.epub"))
all_books = pdf_files + epub_files

print(f"✅ Found {len(all_books)} books ({len(pdf_files)} PDF, {len(epub_files)} EPUB)")
print()

if not all_books:
    print("❌ No books found!")
    sys.exit(1)

response = input(f"Proceed with ingestion? (y/N): ")
if response.lower() != 'y':
    print("Cancelled.")
    sys.exit(0)

print()
print("🚀 Starting ingestion...")
print()

# Process books
successful = 0
failed = 0
total_chunks = 0
tier_counts = {"S": 0, "A": 0, "B": 0, "C": 0, "D": 0}

for book_path in tqdm(all_books, desc="Ingesting books", unit="book"):
    try:
        # Extract text
        if book_path.suffix == '.pdf':
            text = extract_pdf_text(book_path)
        else:
            text = extract_epub_text(book_path)

        if not text or len(text) < 100:
            tqdm.write(f"❌ {book_path.name}: No text extracted")
            failed += 1
            continue

        # Chunk text
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)

        if not chunks:
            tqdm.write(f"❌ {book_path.name}: No chunks created")
            failed += 1
            continue

        # Classify tier
        tier = classify_tier(book_path.stem)
        tier_counts[tier] += 1

        # Generate embeddings
        embeddings = model.encode(chunks, show_progress_bar=False).tolist()

        # Create metadata
        metadatas = [
            {
                "book_title": book_path.stem,
                "tier": tier,
                "chunk_index": i,
                "total_chunks": len(chunks),
                "category": book_path.parent.name
            }
            for i in range(len(chunks))
        ]

        # Create IDs
        ids = [f"{book_path.stem}_{i}" for i in range(len(chunks))]

        # Upsert to ChromaDB
        collection.upsert(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        total_chunks += len(chunks)
        successful += 1
        tqdm.write(f"✅ {book_path.name}: {len(chunks)} chunks (Tier {tier})")

    except Exception as e:
        failed += 1
        tqdm.write(f"❌ {book_path.name}: {str(e)}")

# Final summary
print()
print("=" * 70)
print("🎉 Ingestion Complete!")
print("=" * 70)
print()
print(f"✅ Successful: {successful}")
print(f"❌ Failed: {failed}")
print(f"📊 Total chunks created: {total_chunks:,}")
print()
print("📚 Tier Distribution:")
for tier, count in sorted(tier_counts.items()):
    if count > 0:
        print(f"   Tier {tier}: {count} books")
print()

# Database stats
db_count = collection.count()
print(f"📊 ChromaDB: {db_count:,} total documents")
print(f"   Location: {CHROMA_DIR}")
print()
print("✨ Ready for search!")
print()
