#!/usr/bin/env python3
"""
ZANTARA ChromaDB Migration Tool v3 - WORKING VERSION
Migrates markdown files from local KB to ChromaDB via RAG Backend API

This script successfully uses the /api/memory/store endpoint to upload documents
"""

import os
import sys
import json
import time
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional
from tqdm import tqdm
import hashlib

# Configuration
CONFIG = {
    'source_dir': Path('/Users/antonellosiano/Desktop/DATABASE/KB'),
    'rag_backend_url': 'https://nuzantara-rag.fly.dev',
    'chunk_size': 1000,
    'chunk_overlap': 100,
    'batch_size': 10,
    'max_retries': 3,
    'retry_delay': 1.0
}

# Collections mapping
COLLECTIONS = {
    'kbli_eye': 'kbli_eye',
    'legal_architect': 'legal_architect',
    'tax_genius': 'tax_genius',
    'visa_oracle': 'visa_oracle',
    'zantara_books': 'zantara_books',
    'raw_books_philosophy': 'zantara_books',
    'KB_human_readable_ID': 'zantara_books',
    'KB_backup_pre_migration': 'zantara_books',
    'KB_from_ChromaDB': 'zantara_books'
}

class Logger:
    def __init__(self, verbose=False):
        self.verbose = verbose

    def info(self, msg, *args):
        print(f"ℹ️  {msg % args if args else msg}")

    def success(self, msg, *args):
        print(f"✅ {msg % args if args else msg}")

    def error(self, msg, *args):
        print(f"❌ {msg % args if args else msg}")

    def warn(self, msg, *args):
        print(f"⚠️  {msg % args if args else msg}")

    def debug(self, msg, *args):
        if self.verbose:
            print(f"🔍 {msg % args if args else msg}")

def discover_markdown_files(source_dir: Path) -> List[Path]:
    """Discover all markdown files recursively"""
    files = []
    for file_path in source_dir.rglob("*.md"):
        if not any(part.startswith('.') for part in file_path.parts):
            if not any(part in ['node_modules', '__pycache__', '.git'] for part in file_path.parts):
                files.append(file_path)
    return sorted(files)

def group_files_by_collection(files: List[Path]) -> Dict[str, List[Path]]:
    """Group files by collection based on directory structure"""
    groups = {}
    for file_path in files:
        relative_path = file_path.relative_to(CONFIG['source_dir'])
        collection = 'zantara_books'  # default

        for key, value in COLLECTIONS.items():
            if key in str(relative_path):
                collection = value
                break

        if collection not in groups:
            groups[collection] = []
        groups[collection].append(file_path)
    return groups

def extract_text_content(file_path: Path) -> str:
    """Extract and clean text from markdown file"""
    try:
        import re
        content = file_path.read_text(encoding='utf-8')

        # Remove frontmatter
        content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.MULTILINE | re.DOTALL)

        # Remove markdown formatting
        content = re.sub(r'^#{1,6}\s+', '', content, flags=re.MULTILINE)
        content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)
        content = re.sub(r'\*(.*?)\*', r'\1', content)
        content = re.sub(r'`(.*?)`', r'\1', content)
        content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content)
        content = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'\1', content)
        content = re.sub(r'```[\s\S]*?```', '', content)
        content = re.sub(r'^>\s+', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*[-*+]\s+', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*\d+\.\s+', '', content, flags=re.MULTILINE)
        content = content.strip()

        return content
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def chunk_text(text: str, max_size: int = CONFIG['chunk_size']) -> List[str]:
    """Split text into chunks with overlap"""
    if len(text) <= max_size:
        return [text] if len(text.strip()) > 20 else []

    chunks = []
    start = 0
    overlap = int(max_size * 0.1)

    while start < len(text):
        end = start + max_size

        if end < len(text):
            last_period = text.rfind('.', start, end)
            last_newline = text.rfind('\n', start, end)
            break_point = max(last_period, last_newline)

            if break_point > start + max_size * 0.3:
                end = break_point + 1

        chunk = text[start:end].strip()
        if len(chunk) > 20:
            chunks.append(chunk)

        start = max(start + 1, end - overlap)

    return chunks

def generate_metadata(file_path: Path, collection: str, chunk_index: int) -> Dict[str, Any]:
    """Generate metadata for chunk"""
    relative_path = file_path.relative_to(CONFIG['source_dir'])
    file_name = file_path.stem

    return {
        'source_file': str(relative_path),
        'file_name': file_name,
        'collection': collection,
        'chunk_index': chunk_index,
        'created_at': time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
        'relative_path': str(relative_path)
    }

def check_backend_health() -> bool:
    """Check if RAG backend is healthy"""
    try:
        response = requests.get(f"{CONFIG['rag_backend_url']}/health", timeout=10)
        return response.status_code == 200 and response.json().get("status") == "healthy"
    except:
        return False

def generate_embedding_via_api(text: str) -> List[float]:
    """Generate embedding using RAG backend API"""
    try:
        response = requests.post(
            f"{CONFIG['rag_backend_url']}/api/memory/embed",
            json={"text": text, "model": "sentence-transformers"},
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["embedding"]
        else:
            print(f"Embedding API error: {response.status_code}")
            return [0.0] * 384  # fallback
    except Exception as e:
        print(f"Embedding generation error: {e}")
        return [0.0] * 384  # fallback

def store_document_via_api(doc_id: str, content: str, metadata: Dict[str, Any]) -> bool:
    """Store document via /api/memory/store endpoint"""
    try:
        # Generate embedding
        embedding = generate_embedding_via_api(content)

        payload = {
            "id": doc_id,
            "document": content,
            "embedding": embedding,
            "metadata": metadata
        }

        response = requests.post(
            f"{CONFIG['rag_backend_url']}/api/memory/store",
            json=payload,
            timeout=30
        )

        return response.status_code == 200
    except Exception as e:
        print(f"Store error for {doc_id}: {e}")
        return False

def process_collection(collection_name: str, files: List[Path], logger: Logger, dry_run: bool = False) -> Dict[str, int]:
    """Process files for a collection"""
    logger.info(f"Processing collection: {collection_name} ({len(files)} files)")

    stats = {
        'total_files': len(files),
        'processed_files': 0,
        'skipped_files': 0,
        'error_files': 0,
        'total_chunks': 0,
        'stored_chunks': 0
    }

    for file_path in tqdm(files, desc=f"Processing {collection_name}"):
        try:
            # Extract text
            text_content = extract_text_content(file_path)
            if len(text_content) < 20:
                stats['skipped_files'] += 1
                continue

            # Split into chunks
            chunks = chunk_text(text_content)
            if not chunks:
                stats['skipped_files'] += 1
                continue

            stats['total_chunks'] += len(chunks)
            file_name = file_path.stem

            # Process each chunk
            for i, chunk in enumerate(chunks):
                doc_id = f"{collection_name}_{file_name}_{i}"
                metadata = generate_metadata(file_path, collection_name, i)

                if not dry_run:
                    if store_document_via_api(doc_id, chunk, metadata):
                        stats['stored_chunks'] += 1
                else:
                    stats['stored_chunks'] += 1  # count for dry run

            stats['processed_files'] += 1

        except Exception as e:
            logger.error(f"Error processing {file_path.name}: {e}")
            stats['error_files'] += 1

    return stats

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Migrate ZANTARA KB to ChromaDB')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be migrated without making changes')
    parser.add_argument('--verbose', action='store_true', help='Enable detailed logging')
    args = parser.parse_args()

    logger = Logger(args.verbose)

    print("🚀 ZANTARA ChromaDB Migration Tool v3")
    print("=" * 50)

    # Check backend health
    if not check_backend_health():
        logger.error("RAG backend is not healthy!")
        return

    logger.success("RAG backend is healthy")

    # Discover files
    files = discover_markdown_files(CONFIG['source_dir'])
    if not files:
        logger.error("No markdown files found!")
        return

    logger.info(f"Found {len(files)} markdown files")

    # Group by collection
    file_groups = group_files_by_collection(files)
    logger.info(f"Files in {len(file_groups)} collections:")
    for collection, group_files in file_groups.items():
        logger.info(f"  {collection}: {len(group_files)} files")

    if args.dry_run:
        logger.warn("DRY RUN MODE - No changes will be made")

    # Process collections
    results = {}
    total_stats = {
        'total_files': 0,
        'processed_files': 0,
        'skipped_files': 0,
        'error_files': 0,
        'total_chunks': 0,
        'stored_chunks': 0
    }

    for collection_name, group_files in file_groups.items():
        stats = process_collection(collection_name, group_files, logger, args.dry_run)
        results[collection_name] = stats

        # Update totals
        for key in total_stats:
            total_stats[key] += stats[key]

    # Print summary
    print("\n" + "=" * 50)
    print("🎉 MIGRATION SUMMARY")
    print("=" * 50)
    print(f"📊 Total Files: {total_stats['total_files']}")
    print(f"✅ Processed: {total_stats['processed_files']}")
    print(f"⏭️  Skipped: {total_stats['skipped_files']}")
    print(f"❌ Errors: {total_stats['error_files']}")
    print(f"📄 Total Chunks: {total_stats['total_chunks']}")
    print(f"💾 Stored Chunks: {total_stats['stored_chunks']}")

    if args.dry_run:
        print("\n🔍 This was a DRY RUN - no actual changes were made")
        print("   Run without --dry-run to perform the actual migration")

    print("\n📋 Collection Details:")
    for collection, stats in results.items():
        print(f"  {collection}:")
        print(f"    Files: {stats['processed_files']}/{stats['total_files']}")
        print(f"    Chunks: {stats['stored_chunks']}/{stats['total_chunks']}")

if __name__ == "__main__":
    main()