#!/usr/bin/env python3
"""
ZANTARA Knowledge Base Migration Script
Migrates .md documents from local DATABASE/KB/ to production ChromaDB

Usage:
    python scripts/migrate-kb-to-chromadb.py --dry-run
    python scripts/migrate-kb-to-chromadb.py --verbose
    python scripts/migrate-kb-to-chromadb.py --resume
"""

import os
import sys
import json
import argparse
import hashlib
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
import time

# Add backend-rag to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "backend-rag" / "backend"))

try:
    from core.embeddings import EmbeddingsGenerator
    from core.vector_db import ChromaDBClient
except ImportError as e:
    print(f"❌ Failed to import backend modules: {e}")
    print("Make sure you're running this from the NUZANTARA-FLY root directory")
    sys.exit(1)

# Configuration
CONFIG = {
    'source_dir': Path('/Users/antonellosiano/Desktop/DATABASE/KB'),
    'collections': {
        'kbli_eye': 'kbli_eye',
        'legal_architect': 'legal_architect',
        'tax_genius': 'tax_genius',
        'visa_oracle': 'visa_oracle',
        'zantara_books': 'zantara_books',
        'raw_books_philosophy': 'raw_books_philosophy',
        'KB_human_readable_ID': 'KB_human_readable_ID',
        'KB_backup_pre_migration': 'KB_backup_pre_migration'
    }
}

class ColoredLogger:
    """Colored logging utility"""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        logging.basicConfig(
            level=logging.DEBUG if verbose else logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        self.logger = logging.getLogger(__name__)

    def info(self, message: str, *args):
        self.logger.info(message, *args)

    def success(self, message: str, *args):
        print(f"✅ {message % args if args else message}")

    def error(self, message: str, *args):
        print(f"❌ {message % args if args else message}")
        self.logger.error(message, *args)

    def warn(self, message: str, *args):
        print(f"⚠️  {message % args if args else message}")
        self.logger.warning(message, *args)

    def debug(self, message: str, *args):
        if self.verbose:
            print(f"🔍 {message % args if args else message}")
            self.logger.debug(message, *args)

class ProgressTracker:
    """Track migration progress"""

    def __init__(self):
        self.total_files = 0
        self.processed_files = 0
        self.skipped_files = 0
        self.error_files = 0
        self.total_chunks = 0
        self.start_time = time.time()

    def set_total(self, total: int):
        self.total_files = total

    def increment_processed(self):
        self.processed_files += 1

    def increment_skipped(self):
        self.skipped_files += 1

    def increment_error(self):
        self.error_files += 1

    def add_chunks(self, count: int):
        self.total_chunks += count

    def print_progress(self):
        elapsed = time.time() - self.start_time
        progress = (self.processed_files / self.total_files * 100) if self.total_files > 0 else 0

        print(f"\n📊 Migration Progress:")
        print(f"   Files: {self.processed_files}/{self.total_files} ({progress:.1f}%)")
        print(f"   Skipped: {self.skipped_files} | Errors: {self.error_files}")
        print(f"   Chunks: {self.total_chunks}")
        print(f"   Time: {elapsed:.1f}s")

    def print_summary(self, dry_run: bool = False):
        elapsed = time.time() - self.start_time

        print('\n🎉 Migration Complete!')
        print('=' * 50)
        print(f'📊 Final Statistics:')
        print(f'   Total Files: {self.total_files}')
        print(f'   ✅ Processed: {self.processed_files}')
        print(f'   ⏭️  Skipped: {self.skipped_files}')
        print(f'   ❌ Errors: {self.error_files}')
        print(f'   📄 Total Chunks: {self.total_chunks}')
        print(f'   ⏱️  Total Time: {elapsed:.1f}s')

        if dry_run:
            print('\n🔍 This was a DRY RUN - no actual changes were made')
            print('   Run without --dry-run to perform the actual migration')

        print('=' * 50)

class FileDiscovery:
    """Discover and organize files"""

    def __init__(self, logger: ColoredLogger):
        self.logger = logger

    def discover_markdown_files(self, directory: Path) -> List[Path]:
        """Recursively discover all .md files"""
        files = []

        for file_path in directory.rglob("*.md"):
            # Skip hidden directories and common system directories
            if not any(part.startswith('.') for part in file_path.parts):
                if not any(part in ['node_modules', '__pycache__', '.git'] for part in file_path.parts):
                    files.append(file_path)
                    self.logger.debug(f"Found .md file: {file_path}")

        files.sort()
        self.logger.info(f"Discovered {len(files)} .md files")
        return files

    def group_files_by_collection(self, files: List[Path]) -> Dict[str, List[Path]]:
        """Group files by collection based on directory structure"""
        groups = {}

        for file_path in files:
            relative_path = file_path.relative_to(CONFIG['source_dir'])

            # Determine collection based on directory name
            collection = 'zantara_books'  # default

            # Check first-level directory against known collections
            first_level_dir = relative_path.parts[0] if relative_path.parts else ''

            for collection_key, collection_name in CONFIG['collections'].items():
                if collection_key in str(relative_path):
                    collection = collection_name
                    break

            if collection not in groups:
                groups[collection] = []

            groups[collection].append(file_path)

        return groups

class TextProcessor:
    """Process text content from markdown files"""

    def __init__(self, logger: ColoredLogger):
        self.logger = logger

    def extract_text(self, file_path: Path) -> str:
        """Extract and clean text from markdown file"""
        try:
            content = file_path.read_text(encoding='utf-8')

            # Remove frontmatter (YAML metadata between ---)
            content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.MULTILINE | re.DOTALL)

            # Remove excessive whitespace
            content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

            # Remove markdown formatting but keep content structure
            content = re.sub(r'^#{1,6}\s+', '', content, flags=re.MULTILINE)  # Remove headers
            content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)  # Remove bold
            content = re.sub(r'\*(.*?)\*', r'\1', content)  # Remove italic
            content = re.sub(r'`(.*?)`', r'\1', content)  # Remove inline code
            content = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content)  # Remove links
            content = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'\1', content)  # Remove images
            content = re.sub(r'```[\s\S]*?```', '', content)  # Remove code blocks
            content = re.sub(r'^>\s+', '', content, flags=re.MULTILINE)  # Remove blockquotes
            content = re.sub(r'^\s*[-*+]\s+', '', content, flags=re.MULTILINE)  # Remove list markers
            content = re.sub(r'^\s*\d+\.\s+', '', content, flags=re.MULTILINE)  # Remove numbered lists
            content = content.strip()

            if len(content) < 50:
                self.logger.warn(f"Very short content in {file_path}: {len(content)} chars")

            return content

        except Exception as e:
            self.logger.error(f"Failed to extract text from {file_path}: {e}")
            raise

    def chunk_text(self, text: str, max_size: int = 1000) -> List[str]:
        """Split text into chunks with overlap"""
        if len(text) <= max_size:
            return [text]

        chunks = []
        current_pos = 0
        overlap = int(max_size * 0.1)  # 10% overlap

        while current_pos < len(text):
            end_pos = current_pos + max_size

            # Try to break at sentence boundaries
            if end_pos < len(text):
                last_sentence = text.rfind('.', 0, end_pos)
                last_newline = text.rfind('\n', 0, end_pos)
                break_point = max(last_sentence, last_newline)

                if break_point > current_pos + max_size * 0.3:  # Don't go too far back
                    end_pos = break_point + 1

            chunk = text[current_pos:end_pos].strip()
            if len(chunk) > 20:  # Skip very small chunks
                chunks.append(chunk)

            current_pos = max(current_pos + 1, end_pos - overlap)

        return chunks

    def generate_metadata(self, file_path: Path, collection: str, chunk_index: int) -> Dict[str, Any]:
        """Generate metadata for a chunk"""
        relative_path = file_path.relative_to(CONFIG['source_dir'])
        file_name = file_path.stem
        directory = str(relative_path.parent)

        return {
            'source_file': str(relative_path),
            'file_name': file_name,
            'directory': directory,
            'collection': collection,
            'chunk_index': chunk_index,
            'created_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'file_path': str(file_path),
            'relative_path': str(relative_path)
        }

class ChromaDBMigrator:
    """Main migration class"""

    def __init__(self, dry_run: bool = False, verbose: bool = False, resume: bool = False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.resume = resume

        self.logger = ColoredLogger(verbose)
        self.progress = ProgressTracker()
        self.file_discovery = FileDiscovery(self.logger)
        self.text_processor = TextProcessor(self.logger)

        # Initialize embedding generator
        self.embedder = EmbeddingsGenerator()

        # Store existing collections to check for resume
        self.existing_docs = set()

    def check_existing_document(self, collection: ChromaDBClient, doc_id: str) -> bool:
        """Check if document already exists (for resume mode)"""
        if not self.resume:
            return False

        try:
            # Try to get the document
            result = collection.collection.get(ids=[doc_id])
            return len(result['ids']) > 0
        except:
            return False

    def migrate_collection(self, collection_name: str, files: List[Path]) -> Dict[str, Any]:
        """Migrate a single collection"""
        self.logger.info(f"\n📁 Processing collection: {collection_name} ({len(files)} files)")

        if not self.dry_run:
            # Initialize collection
            collection_client = ChromaDBClient(
                collection_name=collection_name,
                persist_directory=None  # Use default for production
            )

        total_chunks = 0
        processed_files = 0
        skipped_files = 0

        for file_path in files:
            try:
                # Generate document ID for first chunk
                file_name = file_path.stem
                first_chunk_id = f"{collection_name}_{file_name}_0"

                # Skip if resume mode and document exists
                if self.resume and not self.dry_run:
                    if self.check_existing_document(collection_client, first_chunk_id):
                        self.logger.debug(f"Skipping already processed: {file_path.name}")
                        self.progress.increment_skipped()
                        skipped_files += 1
                        continue

                # Extract text
                text_content = self.text_processor.extract_text(file_path)

                if len(text_content) < 20:
                    self.logger.warn(f"Skipping very short content: {file_path.name} ({len(text_content)} chars)")
                    self.progress.increment_skipped()
                    skipped_files += 1
                    continue

                # Split into chunks
                chunks = self.text_processor.chunk_text(text_content)

                if not chunks:
                    self.logger.warn(f"No chunks generated for: {file_path.name}")
                    self.progress.increment_skipped()
                    skipped_files += 1
                    continue

                # Prepare documents for ChromaDB
                documents = []
                metadatas = []
                ids = []

                for i, chunk in enumerate(chunks):
                    doc_id = f"{collection_name}_{file_name}_{i}"
                    metadata = self.text_processor.generate_metadata(file_path, collection_name, i)

                    documents.append(chunk)
                    metadatas.append(metadata)
                    ids.append(doc_id)

                if not self.dry_run:
                    # Generate embeddings
                    embeddings = []
                    for doc in documents:
                        embedding = self.embedder.generate_single_embedding(doc)
                        embeddings.append(embedding)

                    # Add to ChromaDB
                    collection_client.upsert_documents(
                        chunks=documents,
                        embeddings=embeddings,
                        metadatas=metadatas,
                        ids=ids
                    )
                else:
                    self.logger.info(f"[DRY RUN] Would upload {len(documents)} chunks to {collection_name}")

                total_chunks += len(chunks)
                processed_files += 1
                self.progress.add_chunks(len(chunks))
                self.progress.increment_processed()

                self.logger.debug(f"Processed {file_path.name}: {len(chunks)} chunks, {len(text_content)} total chars")

            except Exception as e:
                self.logger.error(f"Failed to process file {file_path.name}: {e}")
                self.progress.increment_error()

        self.logger.success(f"✅ Completed collection: {collection_name}")
        return {
            'collection': collection_name,
            'processed_files': processed_files,
            'skipped_files': skipped_files,
            'total_chunks': total_chunks
        }

    def run(self):
        """Run the complete migration"""
        try:
            self.logger.info('🚀 Starting ZANTARA Knowledge Base Migration')

            if self.dry_run:
                self.logger.warn('🔍 DRY RUN MODE - No changes will be made')

            # Discover all markdown files
            all_files = self.file_discovery.discover_markdown_files(CONFIG['source_dir'])
            self.progress.set_total(len(all_files))

            if not all_files:
                self.logger.warn('No markdown files found to migrate')
                return

            # Group files by collection
            file_groups = self.file_discovery.group_files_by_collection(all_files)

            self.logger.info(f"Found {len(all_files)} files in {len(file_groups)} collections:")
            for collection, files in file_groups.items():
                self.logger.info(f"  {collection}: {len(files)} files")

            # Process each collection
            results = {}
            for collection_name, files in file_groups.items():
                result = self.migrate_collection(collection_name, files)
                results[collection_name] = result

                # Print progress after each collection
                self.progress.print_progress()

            # Final summary
            self.progress.print_summary(self.dry_run)

            # Print results summary
            print(f"\n📋 Collection Summary:")
            for collection, result in results.items():
                print(f"  {collection}:")
                print(f"    Processed: {result['processed_files']}")
                print(f"    Skipped: {result['skipped_files']}")
                print(f"    Chunks: {result['total_chunks']}")

        except Exception as e:
            self.logger.error(f"Migration failed: {e}")
            if self.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Migrate ZANTARA KB to ChromaDB')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be migrated without making changes')
    parser.add_argument('--verbose', action='store_true', help='Enable detailed logging')
    parser.add_argument('--resume', action='store_true', help='Skip files that might already be processed')

    args = parser.parse_args()

    print('ZANTARA Knowledge Base Migration Tool')
    print('========================================')

    migrator = ChromaDBMigrator(
        dry_run=args.dry_run,
        verbose=args.verbose,
        resume=args.resume
    )

    migrator.run()

if __name__ == '__main__':
    main()