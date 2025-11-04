#!/usr/bin/env python3
"""
Test RAG functionality for Worker #2 (Immigration & Manpower)
Tests semantic search and query responses for Indonesian legal content
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import cohere
from typing import List, Dict, Any, Optional
import time
from datetime import datetime

class Worker2RAGTester:
    """Test RAG functionality for Worker #2"""

    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'zantara_rag'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password')
        }

        self.cohere_api_key = os.getenv('COHERE_API_KEY')
        self.cohere = cohere.Client(self.cohere_api_key) if self.cohere_api_key else None

    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return None

    def generate_query_embedding(self, query: str) -> Optional[List[float]]:
        """Generate embedding for user query"""
        if not self.cohere:
            return None

        try:
            response = self.cohere.embed(
                texts=[query],
                model='embed-multilingual-v3.0',
                input_type='search_query'
            )
            return response.embeddings[0]
        except Exception as e:
            print(f"❌ Query embedding generation failed: {e}")
            return None

    def semantic_search(self, conn, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search on Worker #2 content"""
        query_embedding = self.generate_query_embedding(query)
        if not query_embedding:
            return []

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    chunk_id,
                    law_id,
                    law_type,
                    chunk_type,
                    content,
                    metadata,
                    signals,
                    1 - (embedding <=> %s::vector) as similarity_score
                FROM worker2_immigration_manpower
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, query_embedding, limit))

            results = []
            for row in cur.fetchall():
                results.append({
                    'chunk_id': row['chunk_id'],
                    'law_id': row['law_id'],
                    'law_type': row['law_type'],
                    'chunk_type': row['chunk_type'],
                    'content': row['content'],
                    'metadata': json.loads(row['metadata']) if isinstance(row['metadata'], str) else row['metadata'],
                    'signals': json.loads(row['signals']) if isinstance(row['signals'], str) else row['signals'],
                    'similarity_score': float(row['similarity_score'])
                })

            return results

    def keyword_search(self, conn, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Perform keyword search"""
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    chunk_id,
                    law_id,
                    law_type,
                    chunk_type,
                    content,
                    metadata,
                    signals,
                    ts_rank(to_tsvector('indonesian', content), plainto_tsquery('indonesian', %s)) as rank
                FROM worker2_immigration_manpower
                WHERE to_tsvector('indonesian', content) @@ plainto_tsquery('indonesian', %s)
                ORDER BY rank DESC
                LIMIT %s
            """, (query, query, limit))

            results = []
            for row in cur.fetchall():
                results.append({
                    'chunk_id': row['chunk_id'],
                    'law_id': row['law_id'],
                    'law_type': row['law_type'],
                    'chunk_type': row['chunk_type'],
                    'content': row['content'],
                    'metadata': json.loads(row['metadata']) if isinstance(row['metadata'], str) else row['metadata'],
                    'signals': json.loads(row['signals']) if isinstance(row['signals'], str) else row['signals'],
                    'keyword_score': float(row['rank'])
                })

            return results

    def test_specific_queries(self, conn):
        """Test specific immigration and manpower queries"""
        print("🔍 TESTING SPECIFIC IMMIGRATION & MANPOWER QUERIES")
        print("=" * 80)

        test_queries = [
            {
                'query': 'visa untuk tenaga kerja asing',
                'category': 'Foreign Worker Visa',
                'expected_keywords': ['visa', 'tenaga kerja asing', 'TKA', 'izin']
            },
            {
                'query': 'paspor dan izin tinggal',
                'category': 'Passport & Stay Permit',
                'expected_keywords': ['paspor', 'izin tinggal', 'KITAS', 'KITAP']
            },
            {
                'query': 'hak pekerja dan kewajiban pengusaha',
                'category': 'Worker Rights',
                'expected_keywords': ['pekerja', 'hak', 'kewajiban', 'pengusaha']
            },
            {
                'query': 'prosedur imigrasi terbaru 2024',
                'category': 'Latest Immigration Procedures',
                'expected_keywords': ['prosedur', 'imigrasi', '2024', 'terbaru']
            },
            {
                'query': 'persyaratan kerja sama internasional',
                'category': 'International Cooperation',
                'expected_keywords': ['kerja sama', 'internasional', 'mitra', 'kerjasama']
            }
        ]

        results = []

        for i, test_case in enumerate(test_queries, 1):
            print(f"\n📋 Test {i}: {test_case['category']}")
            print(f"Query: '{test_case['query']}'")
            print("-" * 60)

            # Semantic search
            start_time = time.time()
            semantic_results = self.semantic_search(conn, test_case['query'], limit=3)
            semantic_time = time.time() - start_time

            # Keyword search
            start_time = time.time()
            keyword_results = self.keyword_search(conn, test_case['query'], limit=3)
            keyword_time = time.time() - start_time

            print(f"🔢 Semantic search: {len(semantic_results)} results ({semantic_time:.3f}s)")
            print(f"🔤 Keyword search: {len(keyword_results)} results ({keyword_time:.3f}s)")

            # Display best semantic result
            if semantic_results:
                best = semantic_results[0]
                print(f"\n✅ Best semantic match (score: {best['similarity_score']:.4f}):")
                print(f"   Law: {best['law_id']} ({best['law_type']})")
                print(f"   Content: {best['content'][:200]}...")

                # Check for expected keywords
                content_lower = best['content'].lower()
                found_keywords = [kw for kw in test_case['expected_keywords'] if kw.lower() in content_lower]
                print(f"   🎯 Found keywords: {found_keywords}")

            test_result = {
                'query': test_case['query'],
                'category': test_case['category'],
                'semantic_count': len(semantic_results),
                'keyword_count': len(keyword_results),
                'semantic_time': semantic_time,
                'keyword_time': keyword_time,
                'best_result': semantic_results[0] if semantic_results else None
            }
            results.append(test_result)

        return results

    def test_database_statistics(self, conn):
        """Test database statistics and content validation"""
        print("\n📊 DATABASE STATISTICS & CONTENT VALIDATION")
        print("=" * 80)

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Total content
            cur.execute("SELECT COUNT(*) as total FROM worker2_immigration_manpower")
            total = cur.fetchone()['total']
            print(f"📝 Total chunks: {total}")

            # Content with embeddings
            cur.execute("SELECT COUNT(*) as with_embeddings FROM worker2_immigration_manpower WHERE embedding IS NOT NULL")
            with_embeddings = cur.fetchone()['with_embeddings']
            print(f"🔢 Chunks with embeddings: {with_embeddings} ({with_embeddings/total*100:.1f}%)")

            # Laws by type
            cur.execute("""
                SELECT law_type, COUNT(*) as count
                FROM worker2_immigration_manpower
                GROUP BY law_type
                ORDER BY count DESC
            """)
            print(f"\n📋 Laws by type:")
            for row in cur.fetchall():
                print(f"   {row['law_type']}: {row['count']} chunks")

            # Chunk types
            cur.execute("""
                SELECT chunk_type, COUNT(*) as count
                FROM worker2_immigration_manpower
                GROUP BY chunk_type
                ORDER BY count DESC
            """)
            print(f"\n📋 Chunk types:")
            for row in cur.fetchall():
                print(f"   {row['chunk_type']}: {row['count']} chunks")

            # Content length statistics
            cur.execute("""
                SELECT
                    AVG(LENGTH(content)) as avg_length,
                    MIN(LENGTH(content)) as min_length,
                    MAX(LENGTH(content)) as max_length
                FROM worker2_immigration_manpower
            """)
            stats = cur.fetchone()
            print(f"\n📏 Content length stats:")
            print(f"   Average: {stats['avg_length']:.0f} chars")
            print(f"   Min: {stats['min_length']} chars")
            print(f"   Max: {stats['max_length']} chars")

    def run_comprehensive_tests(self):
        """Run comprehensive RAG tests for Worker #2"""
        print("🧪 WORKER #2 RAG COMPREHENSIVE TESTING")
        print("=" * 80)
        print(f"📅 Test date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🤖 Worker: #2 Immigration & Manpower")
        print("=" * 80)

        # Connect to database
        conn = self.connect_db()
        if not conn:
            return False

        try:
            # Test database statistics
            self.test_database_statistics(conn)

            # Test specific queries
            query_results = self.test_specific_queries(conn)

            # Generate test report
            test_report = {
                'test_date': datetime.now().isoformat(),
                'worker_id': 2,
                'worker_name': 'Immigration & Manpower',
                'query_tests': query_results,
                'cohere_available': self.cohere is not None
            }

            with open('WORKER_2_RAG_TEST_REPORT.json', 'w', encoding='utf-8') as f:
                json.dump(test_report, f, indent=2, ensure_ascii=False)

            print("\n" + "=" * 80)
            print("✅ WORKER #2 RAG TESTING COMPLETED")
            print("📄 Test report saved to: WORKER_2_RAG_TEST_REPORT.json")
            print("=" * 80)

            return True

        except Exception as e:
            print(f"❌ Testing failed: {e}")
            return False
        finally:
            conn.close()

def main():
    """Main execution function"""
    tester = Worker2RAGTester()

    if not tester.run_comprehensive_tests():
        print("❌ Worker #2 RAG testing failed")
        exit(1)

    print("🎉 Worker #2 RAG testing completed successfully!")

if __name__ == "__main__":
    main()