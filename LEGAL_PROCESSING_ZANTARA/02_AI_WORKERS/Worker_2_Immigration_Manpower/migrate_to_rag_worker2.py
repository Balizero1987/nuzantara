#!/usr/bin/env python3
"""
Migrate Worker #2 (Immigration & Manpower) JSONL files to RAG database
PostgreSQL + pgvector + Cohere embeddings for Indonesian legal content
"""

import json
import os
import psycopg2
from psycopg2.extras import execute_values
import cohere
from typing import List, Dict, Any, Optional
import hashlib
import time
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Worker2RAGMigrator:
    """Specialized migrator for Worker #2 Immigration & Manpower laws"""

    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'zantara_rag'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password')
        }

        self.cohere_api_key = os.getenv('COHERE_API_KEY')
        if not self.cohere_api_key:
            logger.warning("COHERE_API_KEY not found in environment variables")

        self.cohere = cohere.Client(self.cohere_api_key) if self.cohere_api_key else None

    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(**self.db_config)
            logger.info("✅ Connected to PostgreSQL database")
            return conn
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return None

    def setup_database_schema(self, conn):
        """Setup database schema for legal content"""
        with conn.cursor() as cur:
            # Enable pgvector extension
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

            # Create table for Worker #2 legal content
            cur.execute("""
                CREATE TABLE IF NOT EXISTS worker2_immigration_manpower (
                    id SERIAL PRIMARY KEY,
                    chunk_id VARCHAR(255) UNIQUE NOT NULL,
                    law_id VARCHAR(100) NOT NULL,
                    law_type VARCHAR(100) NOT NULL,
                    chunk_type VARCHAR(50) NOT NULL,
                    content TEXT NOT NULL,
                    metadata JSONB NOT NULL,
                    signals JSONB NOT NULL,
                    embedding vector(1024),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Create indexes for better performance
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_worker2_law_id
                ON worker2_immigration_manpower(law_id);
            """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_worker2_law_type
                ON worker2_immigration_manpower(law_type);
            """)

            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_worker2_chunk_type
                ON worker2_immigration_manpower(chunk_type);
            """)

            # Create vector index for similarity search
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_worker2_embedding
                ON worker2_immigration_manpower
                USING ivfflat (embedding vector_cosine_ops);
            """)

            # Create updated_at trigger
            cur.execute("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            """)

            cur.execute("""
                DROP TRIGGER IF EXISTS update_worker2_updated_at
                ON worker2_immigration_manpower;
            """)

            cur.execute("""
                CREATE TRIGGER update_worker2_updated_at
                BEFORE UPDATE ON worker2_immigration_manpower
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            """)

            conn.commit()
            logger.info("✅ Database schema setup completed")

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding using Cohere API"""
        if not self.cohere:
            logger.warning("⚠️  Cohere client not available, skipping embedding generation")
            return None

        try:
            # Clean and prepare text for embedding
            cleaned_text = text.strip()
            if len(cleaned_text) > 8000:  # Cohere limit
                cleaned_text = cleaned_text[:8000]

            response = self.cohere.embed(
                texts=[cleaned_text],
                model='embed-multilingual-v3.0',
                input_type='search_document'
            )

            return response.embeddings[0]

        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            return None

    def process_jsonl_file(self, file_path: Path, conn) -> Dict[str, Any]:
        """Process a single JSONL file and migrate to database"""
        results = {
            'file': file_path.name,
            'processed': 0,
            'embeddings_generated': 0,
            'errors': 0,
            'skipped': 0
        }

        logger.info(f"📄 Processing: {file_path.name}")

        with conn.cursor() as cur:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        chunk = json.loads(line.strip())

                        # Extract fields
                        chunk_id = chunk.get('chunk_id')
                        law_id = chunk.get('metadata', {}).get('law_id', 'unknown')
                        law_type = chunk.get('metadata', {}).get('law_type', 'unknown')
                        chunk_type = chunk.get('type', 'unknown')
                        content = chunk.get('text', '')
                        metadata = chunk.get('metadata', {})
                        signals = chunk.get('signals', {})

                        # Skip empty content
                        if not content or len(content.strip()) < 50:
                            results['skipped'] += 1
                            continue

                        # Generate embedding
                        embedding = None
                        if self.cohere:
                            embedding = self.generate_embedding(content)
                            if embedding:
                                results['embeddings_generated'] += 1

                        # Check if chunk already exists
                        cur.execute(
                            "SELECT id FROM worker2_immigration_manpower WHERE chunk_id = %s",
                            (chunk_id,)
                        )

                        if cur.fetchone():
                            # Update existing
                            cur.execute("""
                                UPDATE worker2_immigration_manpower
                                SET content = %s, metadata = %s, signals = %s,
                                    embedding = %s, updated_at = CURRENT_TIMESTAMP
                                WHERE chunk_id = %s
                            """, (content, json.dumps(metadata), json.dumps(signals),
                                  embedding, chunk_id))
                        else:
                            # Insert new
                            cur.execute("""
                                INSERT INTO worker2_immigration_manpower
                                (chunk_id, law_id, law_type, chunk_type, content, metadata, signals, embedding)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """, (chunk_id, law_id, law_type, chunk_type, content,
                                  json.dumps(metadata), json.dumps(signals), embedding))

                        results['processed'] += 1

                        # Progress reporting
                        if line_num % 50 == 0:
                            conn.commit()
                            logger.info(f"  Processed {line_num} chunks...")

                    except json.JSONDecodeError as e:
                        logger.error(f"❌ JSON decode error at line {line_num}: {e}")
                        results['errors'] += 1
                    except Exception as e:
                        logger.error(f"❌ Error processing line {line_num}: {e}")
                        results['errors'] += 1

        conn.commit()
        return results

    def generate_statistics(self, conn):
        """Generate migration statistics"""
        with conn.cursor() as cur:
            stats = {}

            # Total chunks
            cur.execute("SELECT COUNT(*) FROM worker2_immigration_manpower")
            stats['total_chunks'] = cur.fetchone()[0]

            # Chunks with embeddings
            cur.execute("SELECT COUNT(*) FROM worker2_immigration_manpower WHERE embedding IS NOT NULL")
            stats['chunks_with_embeddings'] = cur.fetchone()[0]

            # Laws by type
            cur.execute("""
                SELECT law_type, COUNT(*) as count
                FROM worker2_immigration_manpower
                GROUP BY law_type
                ORDER BY count DESC
            """)
            stats['laws_by_type'] = dict(cur.fetchall())

            # Chunk types
            cur.execute("""
                SELECT chunk_type, COUNT(*) as count
                FROM worker2_immigration_manpower
                GROUP BY chunk_type
                ORDER BY count DESC
            """)
            stats['chunks_by_type'] = dict(cur.fetchall())

            # Database size
            cur.execute("""
                SELECT pg_size_pretty(pg_total_relation_size('worker2_immigration_manpower'))
            """)
            stats['database_size'] = cur.fetchone()[0]

            return stats

    def migrate_worker2(self):
        """Main migration function for Worker #2"""
        logger.info("🚀 Starting Worker #2 migration to RAG database")

        # Connect to database
        conn = self.connect_db()
        if not conn:
            return False

        try:
            # Setup database schema
            self.setup_database_schema(conn)

            # Get all JSONL files
            output_dir = Path("OUTPUT")
            jsonl_files = list(output_dir.glob("*_READY_FOR_KB.jsonl"))

            if not jsonl_files:
                logger.error("❌ No JSONL files found in OUTPUT directory")
                return False

            logger.info(f"📁 Found {len(jsonl_files)} JSONL files to migrate")

            # Process each file
            total_results = {
                'total_files': len(jsonl_files),
                'total_processed': 0,
                'total_embeddings': 0,
                'total_errors': 0,
                'total_skipped': 0,
                'files': []
            }

            for file_path in sorted(jsonl_files):
                file_results = self.process_jsonl_file(file_path, conn)
                total_results['files'].append(file_results)
                total_results['total_processed'] += file_results['processed']
                total_results['total_embeddings'] += file_results['embeddings_generated']
                total_results['total_errors'] += file_results['errors']
                total_results['total_skipped'] += file_results['skipped']

            # Generate final statistics
            stats = self.generate_statistics(conn)

            # Print migration report
            logger.info("=" * 80)
            logger.info("📊 WORKER #2 MIGRATION REPORT")
            logger.info("=" * 80)
            logger.info(f"📁 Files processed: {total_results['total_files']}")
            logger.info(f"📝 Total chunks: {total_results['total_processed']}")
            logger.info(f"🔢 Embeddings generated: {total_results['total_embeddings']}")
            logger.info(f"❌ Errors: {total_results['total_errors']}")
            logger.info(f"⏭️  Skipped: {total_results['total_skipped']}")
            logger.info(f"💾 Database size: {stats['database_size']}")
            logger.info("")
            logger.info("📋 Laws by type:")
            for law_type, count in stats['laws_by_type'].items():
                logger.info(f"  {law_type}: {count} chunks")
            logger.info("")
            logger.info("📋 Chunks by type:")
            for chunk_type, count in stats['chunks_by_type'].items():
                logger.info(f"  {chunk_type}: {count} chunks")
            logger.info("=" * 80)

            # Create migration summary file
            summary = {
                'migration_date': '2025-11-03',
                'worker_id': 2,
                'worker_name': 'Immigration & Manpower',
                'results': total_results,
                'statistics': stats
            }

            with open('WORKER_2_RAG_MIGRATION_SUMMARY.json', 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)

            logger.info("✅ Migration completed successfully!")
            return True

        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            return False
        finally:
            conn.close()

def main():
    """Main execution function"""
    migrator = Worker2RAGMigrator()

    if not migrator.migrate_worker2():
        logger.error("❌ Worker #2 migration failed")
        exit(1)

    logger.info("🎉 Worker #2 migration to RAG database completed!")

if __name__ == "__main__":
    main()