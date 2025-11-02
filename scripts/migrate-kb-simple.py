#!/usr/bin/env python3
"""
Simple ZANTARA Knowledge Base Migration Script
Migrates .md documents from local DATABASE/KB/ to production ChromaDB via API

Usage:
    python scripts/migrate-kb-simple.py --dry-run
    python scripts/migrate-kb-simple.py --verbose
    python scripts/migrate-kb-simple.py --resume
"""

import os
import sys
import json
import argparse
import hashlib
import time
import requests
from pathlib import Path
from typing import List, Dict, Any, Optional

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
    },
    'production_api': 'https://nuzantara-rag.fly.dev'
}

class SimpleLogger:
    """Simple logging utility"""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose

    def info(self, message: str, *args):
        print(f"ℹ️  {message % args if args else message}")

    def success(self, message: str, *args):
        print(f"✅ {message % args if args else message}")

    def error(self, message: str, *args):
        print(f"❌ {message % args if args else message}")

    def warn(self, message: str, *args):
        print(f"⚠️  {message % args if args else message}")

    def debug(self, message: str, *args):
        if self.verbose:
            print(f"🔍 {message % args if args else message}")

class FileProcessor:
    """Process files for migration"""

    def __init__(self, logger: SimpleLogger):
        self.logger = logger

    def clean_text(self, content: str) -> str:
        """Clean markdown text"""
        import re

        # Remove frontmatter
        content = re.sub(r'^---\n.*?\n---\n', '', content, flags=re.MULTILINE | re.DOTALL)

        # Remove excessive whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

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

        return content.strip()

    def chunk_text(self, text: str, max_size: int = 800) -> List[str]:
        """Split text into chunks"""
        if len(text) <= max_size:
            return [text]

        chunks = []
        current_pos = 0
        overlap = int(max_size * 0.1)

        while current_pos < len(text):
            end_pos = current_pos + max_size

            # Try to break at sentence boundaries
            if end_pos < len(text):
                last_sentence = text.rfind('.', 0, end_pos)
                last_newline = text.rfind('\n', 0, end_pos)
                break_point = max(last_sentence, last_newline)

                if break_point > current_pos + max_size * 0.3:
                    end_pos = break_point + 1

            chunk = text[current_pos:end_pos].strip()
            if len(chunk) > 20:
                chunks.append(chunk)

            current_pos = max(current_pos + 1, end_pos - overlap)

        return chunks

    def process_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Process a single markdown file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            clean_content = self.clean_text(content)

            if len(clean_content) < 50:
                self.logger.warn(f"Skipping very short content: {file_path.name} ({len(clean_content)} chars)")
                return []

            chunks = self.chunk_text(clean_content)
            if not chunks:
                self.logger.warn(f"No chunks generated for: {file_path.name}")
                return []

            file_name = file_path.stem
            relative_path = file_path.relative_to(CONFIG['source_dir'])

            result = []
            for i, chunk in enumerate(chunks):
                doc_id = f"{file_name}_{i}_{hashlib.md5(chunk.encode()).hexdigest()[:8]}"

                result.append({
                    'id': doc_id,
                    'text': chunk,
                    'metadata': {
                        'source_file': str(relative_path),
                        'file_name': file_name,
                        'chunk_index': i,
                        'total_chunks': len(chunks),
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    }
                })

            return result

        except Exception as e:
            self.logger.error(f"Failed to process {file_path.name}: {e}")
            return []

class SimpleMigrator:
    """Simple migration class using production API"""

    def __init__(self, dry_run: bool = False, verbose: bool = False, resume: bool = False):
        self.dry_run = dry_run
        self.verbose = verbose
        self.resume = resume
        self.logger = SimpleLogger(verbose)
        self.processor = FileProcessor(self.logger)

    def discover_files(self, directory: Path) -> Dict[str, List[Path]]:
        """Discover and group files by collection"""
        all_files = []

        for file_path in directory.rglob("*.md"):
            if not any(part.startswith('.') for part in file_path.parts):
                if not any(part in ['node_modules', '__pycache__', '.git'] for part in file_path.parts):
                    all_files.append(file_path)

        # Group by collection
        groups = {}
        for file_path in all_files:
            relative_path = file_path.relative_to(CONFIG['source_dir'])

            # Determine collection
            collection = 'zantara_books'  # default
            for collection_key, collection_name in CONFIG['collections'].items():
                if collection_key in str(relative_path):
                    collection = collection_name
                    break

            if collection not in groups:
                groups[collection] = []
            groups[collection].append(file_path)

        return groups

    def add_to_production(self, collection_name: str, documents: List[Dict[str, Any]]) -> bool:
        """Add documents to production via API"""
        if self.dry_run:
            self.logger.info(f"[DRY RUN] Would add {len(documents)} documents to {collection_name}")
            return True

        try:
            # Add each document to the production API
            success_count = 0
            for doc in documents:
                response = requests.post(
                    f"{CONFIG['production_api']}/api/memory/add",
                    json={
                        "text": doc['text'],
                        "metadata": {
                            **doc['metadata'],
                            "collection": collection_name,
                            "source": "kb_migration"
                        }
                    },
                    timeout=30
                )

                if response.status_code == 200:
                    success_count += 1
                    self.logger.debug(f"Added document {doc['id']}")
                else:
                    self.logger.error(f"Failed to add document {doc['id']}: {response.status_code}")

            self.logger.success(f"Added {success_count}/{len(documents)} documents to {collection_name}")
            return success_count == len(documents)

        except Exception as e:
            self.logger.error(f"Failed to add documents to {collection_name}: {e}")
            return False

    def migrate_collection(self, collection_name: str, files: List[Path]) -> Dict[str, Any]:
        """Migrate a single collection"""
        self.logger.info(f"📁 Processing collection: {collection_name} ({len(files)} files)")

        all_documents = []
        processed_files = 0
        skipped_files = 0

        for file_path in files:
            try:
                documents = self.processor.process_file(file_path)
                if documents:
                    all_documents.extend(documents)
                    processed_files += 1
                    self.logger.debug(f"Processed {file_path.name}: {len(documents)} chunks")
                else:
                    skipped_files += 1
                    self.logger.warn(f"Skipped {file_path.name}: no valid content")

            except Exception as e:
                self.logger.error(f"Failed to process {file_path.name}: {e}")
                skipped_files += 1

        # Add to production
        success = self.add_to_production(collection_name, all_documents)

        return {
            'collection': collection_name,
            'total_files': len(files),
            'processed_files': processed_files,
            'skipped_files': skipped_files,
            'total_documents': len(all_documents),
            'success': success
        }

    def run(self):
        """Run the complete migration"""
        try:
            self.logger.info('🚀 Starting ZANTARA Knowledge Base Migration')

            if self.dry_run:
                self.logger.warn('🔍 DRY RUN MODE - No changes will be made')

            # Discover files
            file_groups = self.discover_files(CONFIG['source_dir'])

            self.logger.info(f"Found {sum(len(files) for files in file_groups.values())} files in {len(file_groups)} collections:")
            for collection, files in file_groups.items():
                self.logger.info(f"  {collection}: {len(files)} files")

            if not file_groups:
                self.logger.warn('No files found to migrate')
                return

            # Process each collection
            results = {}
            total_processed = 0
            total_skipped = 0
            total_documents = 0
            successful_collections = 0

            for collection_name, files in file_groups.items():
                result = self.migrate_collection(collection_name, files)
                results[collection_name] = result
                total_processed += result['processed_files']
                total_skipped += result['skipped_files']
                total_documents += result['total_documents']
                if result['success']:
                    successful_collections += 1

            # Print summary
            print(f"\n🎉 Migration Complete!")
            print('=' * 50)
            print(f'📊 Final Statistics:')
            print(f'   Collections: {len(file_groups)}')
            print(f'   Successful: {successful_collections}')
            print(f'   Total Files: {sum(len(files) for files in file_groups.values())}')
            print(f'   ✅ Processed: {total_processed}')
            print(f'   ⏭️  Skipped: {total_skipped}')
            print(f'   📄 Total Documents: {total_documents}')

            if self.dry_run:
                print('\n🔍 This was a DRY RUN - no actual changes were made')
                print('   Run without --dry-run to perform the actual migration')

            print('=' * 50)

            # Print per-collection details
            print(f"\n📋 Collection Details:")
            for collection, result in results.items():
                status = "✅" if result['success'] else "❌"
                print(f"  {status} {collection}:")
                print(f"    Files: {result['processed_files']}/{result['total_files']}")
                print(f"    Documents: {result['total_documents']}")
                if not result['success']:
                    print(f"    Error: Migration failed")

        except Exception as e:
            self.logger.error(f"Migration failed: {e}")
            if self.verbose:
                import traceback
                traceback.print_exc()
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Migrate ZANTARA KB to Production ChromaDB')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be migrated without making changes')
    parser.add_argument('--verbose', action='store_true', help='Enable detailed logging')
    parser.add_argument('--resume', action='store_true', help='Resume interrupted migration')

    args = parser.parse_args()

    print('ZANTARA Knowledge Base Migration Tool (Simple Version)')
    print('==================================================')

    migrator = SimpleMigrator(
        dry_run=args.dry_run,
        verbose=args.verbose,
        resume=args.resume
    )

    migrator.run()

if __name__ == '__main__':
    main()