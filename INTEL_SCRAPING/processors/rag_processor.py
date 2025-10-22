#!/usr/bin/env python3
"""
RAG Processor - Swiss-Watch Edition

Handles embedding generation and ChromaDB storage for articles.
Uses RAG backend API for vector database operations.

Features:
- Article embedding generation
- ChromaDB storage via REST API
- Batch processing with parallelization
- Statistics tracking
- Error handling and retry logic
- Integration with state manager
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import requests
from concurrent.futures import ThreadPoolExecutor

from INTEL_SCRAPING.core.models import Article
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class RAGProcessor:
    """
    RAG Processor for embedding generation and vector storage.

    Workflow:
    1. Read articles (Article objects)
    2. Generate embeddings via RAG backend API
    3. Store in ChromaDB via RAG backend API
    4. Track statistics
    """

    def __init__(self, rag_backend_url: Optional[str] = None, max_workers: int = 5):
        """
        Initialize RAG processor.

        Args:
            rag_backend_url: RAG backend URL (defaults to settings)
            max_workers: Max parallel workers for API calls
        """
        self.rag_backend_url = rag_backend_url or settings.rag.backend_url
        self.max_workers = max_workers
        self.timeout = settings.rag.timeout_seconds

        # Statistics
        self.stats = {
            'total_articles': 0,
            'processed': 0,
            'failed': 0,
            'embeddings_generated': 0,
            'chromadb_stored': 0,
            'errors': []
        }

    def generate_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate embedding via RAG backend.

        Args:
            text: Text to embed (will be truncated to 5000 chars)

        Returns:
            List of floats (embedding vector) or None on failure
        """
        try:
            # Truncate to reasonable length
            text_truncated = text[:5000]

            response = requests.post(
                f"{self.rag_backend_url}/api/embed",
                json={"text": text_truncated},
                timeout=self.timeout
            )
            response.raise_for_status()

            embedding = response.json().get("embedding")
            if embedding:
                self.stats['embeddings_generated'] += 1
                return embedding

            logger.warning("No embedding returned from API")
            return None

        except requests.exceptions.Timeout:
            logger.error(f"Embedding generation timeout ({self.timeout}s)")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Embedding generation failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in embedding generation: {e}")
            return None

    def store_in_chromadb(
        self,
        article: Article,
        embedding: List[float]
    ) -> bool:
        """
        Store article in ChromaDB via RAG backend.

        Args:
            article: Article object
            embedding: Embedding vector

        Returns:
            True if successful, False otherwise
        """
        try:
            collection_name = f"bali_intel_{article.category}"

            response = requests.post(
                f"{self.rag_backend_url}/api/intel/store",
                json={
                    "collection": collection_name,
                    "id": article.id,
                    "document": article.content,
                    "embedding": embedding,
                    "metadata": {
                        "category": article.category,
                        "title": article.title,
                        "source": article.source,
                        "url": article.url,
                        "published_date": article.published_date.isoformat(),
                        "scraped_at": article.scraped_at.isoformat(),
                        "tier": article.tier.value,
                        "word_count": article.word_count,
                        "timestamp": datetime.now().isoformat(),
                    }
                },
                timeout=self.timeout
            )
            response.raise_for_status()

            self.stats['chromadb_stored'] += 1
            return True

        except requests.exceptions.Timeout:
            logger.error(f"ChromaDB storage timeout for article {article.id}")
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"ChromaDB storage failed for article {article.id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in ChromaDB storage: {e}")
            return False

    def process_article(self, article: Article) -> bool:
        """
        Process single article: generate embedding and store in ChromaDB.

        Args:
            article: Article object

        Returns:
            True if successful, False otherwise
        """
        try:
            # Generate embedding
            embedding = self.generate_embedding(article.content)

            if not embedding:
                logger.warning(f"No embedding for article: {article.title[:50]}...")
                self.stats['failed'] += 1
                self.stats['errors'].append({
                    'article_id': article.id,
                    'error': 'embedding_generation_failed'
                })
                return False

            # Store in ChromaDB
            success = self.store_in_chromadb(article, embedding)

            if success:
                self.stats['processed'] += 1
                logger.info(f"  ✅ RAG: {article.category}/{article.title[:50]}...")
                return True
            else:
                self.stats['failed'] += 1
                self.stats['errors'].append({
                    'article_id': article.id,
                    'error': 'chromadb_storage_failed'
                })
                return False

        except Exception as e:
            logger.error(f"RAG processing failed for article {article.id}: {e}")
            self.stats['failed'] += 1
            self.stats['errors'].append({
                'article_id': article.id,
                'error': str(e)[:200]
            })
            return False

    async def process_articles_async(self, articles: List[Article]) -> Dict[str, Any]:
        """
        Process articles in parallel (async with ThreadPoolExecutor).

        Args:
            articles: List of Article objects

        Returns:
            Statistics dictionary
        """
        self.stats['total_articles'] = len(articles)

        logger.info(f"🧠 RAG Processor: Processing {len(articles)} articles...")

        if not articles:
            logger.warning("No articles to process")
            return self.stats

        # Use ThreadPoolExecutor for I/O-bound API calls
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            loop = asyncio.get_event_loop()
            tasks = [
                loop.run_in_executor(executor, self.process_article, article)
                for article in articles
            ]
            await asyncio.gather(*tasks)

        logger.info(f"✅ RAG Processing complete: {self.stats['processed']}/{self.stats['total_articles']} processed")
        logger.info(f"   Embeddings generated: {self.stats['embeddings_generated']}")
        logger.info(f"   ChromaDB stored: {self.stats['chromadb_stored']}")
        logger.info(f"   Failed: {self.stats['failed']}")

        return self.stats

    def get_stats(self) -> Dict[str, Any]:
        """Get processing statistics"""
        return self.stats.copy()

    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            'total_articles': 0,
            'processed': 0,
            'failed': 0,
            'embeddings_generated': 0,
            'chromadb_stored': 0,
            'errors': []
        }


if __name__ == "__main__":
    # Test RAG processor
    from datetime import datetime, timedelta

    print("=" * 60)
    print("Testing RAG Processor")
    print("=" * 60)

    # Create test articles
    test_articles = [
        Article(
            url="https://example.com/article1",
            title="Test Article 1: Immigration Policy Changes",
            content="This is a test article about immigration policy changes in Indonesia. " * 50,
            published_date=datetime.now() - timedelta(hours=2),
            source="Test Source",
            category="visa_immigration",
            word_count=500
        ),
        Article(
            url="https://example.com/article2",
            title="Test Article 2: Business Registration Updates",
            content="This is a test article about business registration updates. " * 50,
            published_date=datetime.now() - timedelta(hours=5),
            source="Test Source",
            category="business_setup",
            word_count=400
        ),
    ]

    print(f"\n📝 Test Articles: {len(test_articles)}")
    for article in test_articles:
        print(f"   - {article.title}")

    # Create processor
    processor = RAGProcessor()

    print(f"\n🔧 Configuration:")
    print(f"   RAG Backend: {processor.rag_backend_url}")
    print(f"   Max Workers: {processor.max_workers}")
    print(f"   Timeout: {processor.timeout}s")

    # Test processing
    print(f"\n🚀 Starting RAG processing...")
    try:
        stats = asyncio.run(processor.process_articles_async(test_articles))

        print(f"\n✅ Results:")
        print(f"   Total: {stats['total_articles']}")
        print(f"   Processed: {stats['processed']}")
        print(f"   Failed: {stats['failed']}")
        print(f"   Embeddings: {stats['embeddings_generated']}")
        print(f"   ChromaDB: {stats['chromadb_stored']}")

        if stats['errors']:
            print(f"\n❌ Errors:")
            for error in stats['errors'][:5]:
                print(f"   - Article {error['article_id']}: {error['error']}")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")

    print("=" * 60)
