"""
NUZANTARA Database Migration Script
Migrates vector embeddings from ChromaDB to Pinecone

PATCH-5: Database Migration to Pinecone
- Improved scalability and performance
- Better multi-region support
- Production-grade vector search
"""

import os
import sys
import time
import json
from typing import List, Dict, Any
import chromadb
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseMigration:
    """Handles migration from ChromaDB to Pinecone"""
    
    def __init__(
        self,
        chroma_path: str,
        pinecone_api_key: str,
        pinecone_environment: str = "us-east-1",
        batch_size: int = 100
    ):
        self.chroma_path = chroma_path
        self.batch_size = batch_size
        
        # Initialize ChromaDB
        logger.info(f"Connecting to ChromaDB at {chroma_path}")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        
        # Initialize Pinecone
        logger.info("Connecting to Pinecone")
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.pinecone_environment = pinecone_environment
        
        self.migration_stats = {
            'collections_migrated': 0,
            'total_vectors': 0,
            'failed_vectors': 0,
            'start_time': time.time()
        }
    
    def list_collections(self) -> List[str]:
        """List all collections in ChromaDB"""
        collections = self.chroma_client.list_collections()
        collection_names = [col.name for col in collections]
        logger.info(f"Found {len(collection_names)} collections: {collection_names}")
        return collection_names
    
    def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """Get information about a ChromaDB collection"""
        collection = self.chroma_client.get_collection(collection_name)
        count = collection.count()
        
        # Get sample to determine dimension
        sample = collection.get(limit=1, include=['embeddings'])
        dimension = 1536  # default
        if sample.get('embeddings') is not None and len(sample['embeddings']) > 0:
            embedding = sample['embeddings'][0]
            if hasattr(embedding, '__len__'):
                dimension = len(embedding)
        
        return {
            'name': collection_name,
            'count': count,
            'dimension': dimension
        }
    
    def create_pinecone_index(
        self,
        index_name: str,
        dimension: int,
        metric: str = 'cosine'
    ):
        """Create a Pinecone index"""
        # Convert ChromaDB collection name to valid Pinecone index name
        index_name = index_name.lower().replace('_', '-')
        
        # Check if index exists
        existing_indexes = self.pc.list_indexes().names()
        
        if index_name in existing_indexes:
            logger.warning(f"Index {index_name} already exists, skipping creation")
            return index_name
        
        logger.info(f"Creating Pinecone index: {index_name} (dimension={dimension})")
        
        self.pc.create_index(
            name=index_name,
            dimension=dimension,
            metric=metric,
            spec=ServerlessSpec(
                cloud='aws',
                region=self.pinecone_environment
            )
        )
        
        # Wait for index to be ready
        while not self.pc.describe_index(index_name).status['ready']:
            logger.info(f"Waiting for index {index_name} to be ready...")
            time.sleep(5)
        
        logger.info(f"Index {index_name} created successfully")
        return index_name
    
    def migrate_collection(
        self,
        collection_name: str,
        namespace: str = None
    ) -> Dict[str, Any]:
        """Migrate a single collection from ChromaDB to Pinecone"""
        logger.info(f"\n{'='*60}")
        logger.info(f"Migrating collection: {collection_name}")
        logger.info(f"{'='*60}")
        
        # Get collection info
        info = self.get_collection_info(collection_name)
        total_count = info['count']
        dimension = info['dimension']
        
        logger.info(f"Collection has {total_count} vectors with dimension {dimension}")
        
        # Create Pinecone index
        index_name = self.create_pinecone_index(collection_name, dimension)
        index = self.pc.Index(index_name)
        
        # Get ChromaDB collection
        collection = self.chroma_client.get_collection(collection_name)
        
        # Migrate in batches
        migrated = 0
        failed = 0
        offset = 0
        
        with tqdm(total=total_count, desc=f"Migrating {collection_name}") as pbar:
            while offset < total_count:
                try:
                    # Fetch batch from ChromaDB
                    batch = collection.get(
                        limit=self.batch_size,
                        offset=offset,
                        include=['embeddings', 'metadatas', 'documents']
                    )
                    
                    if len(batch['ids']) == 0:
                        break
                    
                    # Prepare vectors for Pinecone
                    vectors = []
                    for i, vector_id in enumerate(batch['ids']):
                        # Safely check and get metadata
                        metadata = {}
                        if batch.get('metadatas') is not None and i < len(batch['metadatas']) and batch['metadatas'][i] is not None:
                            metadata = batch['metadatas'][i]
                        
                        # Safely check and get document
                        document = ""
                        if batch.get('documents') is not None and i < len(batch['documents']) and batch['documents'][i] is not None:
                            document = batch['documents'][i]
                        
                        # Get embedding
                        embedding = batch['embeddings'][i]
                        
                        # Convert numpy array to list if needed
                        if hasattr(embedding, 'tolist'):
                            embedding = embedding.tolist()
                        
                        # Add document to metadata
                        metadata['text'] = str(document) if document else ""
                        metadata['source_collection'] = collection_name
                        
                        vectors.append({
                            'id': vector_id,
                            'values': embedding,
                            'metadata': metadata
                        })
                    
                    # Upsert to Pinecone
                    if namespace:
                        index.upsert(vectors=vectors, namespace=namespace)
                    else:
                        index.upsert(vectors=vectors)
                    
                    migrated += len(vectors)
                    offset += self.batch_size
                    pbar.update(len(vectors))
                    
                except Exception as e:
                    logger.error(f"Error migrating batch at offset {offset}: {e}")
                    failed += len(batch['ids']) if batch.get('ids') else self.batch_size
                    offset += self.batch_size
                    pbar.update(self.batch_size)
        
        self.migration_stats['collections_migrated'] += 1
        self.migration_stats['total_vectors'] += migrated
        self.migration_stats['failed_vectors'] += failed
        
        result = {
            'collection': collection_name,
            'index': index_name,
            'migrated': migrated,
            'failed': failed,
            'total': total_count
        }
        
        logger.info(f"\nMigration complete for {collection_name}:")
        logger.info(f"  Migrated: {migrated}/{total_count}")
        logger.info(f"  Failed: {failed}")
        
        return result
    
    def migrate_all(self, collections: List[str] = None) -> Dict[str, Any]:
        """Migrate all or specified collections"""
        if collections is None:
            collections = self.list_collections()
        
        results = []
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Starting migration of {len(collections)} collections")
        logger.info(f"{'='*60}\n")
        
        for collection_name in collections:
            try:
                result = self.migrate_collection(collection_name)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to migrate collection {collection_name}: {e}")
                results.append({
                    'collection': collection_name,
                    'error': str(e)
                })
        
        # Calculate final stats
        elapsed = time.time() - self.migration_stats['start_time']
        self.migration_stats['elapsed_time'] = elapsed
        self.migration_stats['results'] = results
        
        logger.info(f"\n{'='*60}")
        logger.info("MIGRATION SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"Collections migrated: {self.migration_stats['collections_migrated']}")
        logger.info(f"Total vectors: {self.migration_stats['total_vectors']}")
        logger.info(f"Failed vectors: {self.migration_stats['failed_vectors']}")
        logger.info(f"Elapsed time: {elapsed:.2f}s")
        logger.info(f"{'='*60}\n")
        
        return self.migration_stats
    
    def verify_migration(self, collection_name: str) -> bool:
        """Verify that migration was successful"""
        logger.info(f"Verifying migration for {collection_name}")
        
        # Get counts
        chroma_collection = self.chroma_client.get_collection(collection_name)
        chroma_count = chroma_collection.count()
        
        index_name = collection_name.lower().replace('_', '-')
        index = self.pc.Index(index_name)
        stats = index.describe_index_stats()
        pinecone_count = stats['total_vector_count']
        
        logger.info(f"ChromaDB count: {chroma_count}")
        logger.info(f"Pinecone count: {pinecone_count}")
        
        if chroma_count == pinecone_count:
            logger.info(f"✅ Verification passed for {collection_name}")
            return True
        else:
            logger.warning(f"⚠️  Verification failed for {collection_name}")
            return False


def main():
    """Main migration script"""
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Migrate ChromaDB collections to Pinecone')
    parser.add_argument('--chroma-path', default=None, help='Path to ChromaDB database')
    parser.add_argument('collections', nargs='*', help='Collections to migrate (all if not specified)')
    args = parser.parse_args()
    
    # Load environment variables
    CHROMA_PATH = args.chroma_path or os.getenv('CHROMA_PATH', './data/chroma_db')
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
    PINECONE_ENVIRONMENT = os.getenv('PINECONE_ENVIRONMENT', 'us-east-1')
    
    if not PINECONE_API_KEY:
        logger.error("PINECONE_API_KEY environment variable not set")
        sys.exit(1)
    
    # Get collections to migrate
    collections_to_migrate = args.collections if args.collections else None
    
    # Initialize migration
    migration = DatabaseMigration(
        chroma_path=CHROMA_PATH,
        pinecone_api_key=PINECONE_API_KEY,
        pinecone_environment=PINECONE_ENVIRONMENT,
        batch_size=100
    )
    
    # Run migration
    stats = migration.migrate_all(collections=collections_to_migrate)
    
    # Save results
    results_file = f"migration_results_{int(time.time())}.json"
    with open(results_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    logger.info(f"Migration results saved to {results_file}")
    
    # Verify migrations
    if collections_to_migrate:
        collections = collections_to_migrate
    else:
        collections = migration.list_collections()
    
    logger.info("\nVerifying migrations...")
    for collection in collections:
        migration.verify_migration(collection)


if __name__ == '__main__':
    main()
