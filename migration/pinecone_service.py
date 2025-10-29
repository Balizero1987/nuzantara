"""
Pinecone Service Integration for NUZANTARA
Replaces ChromaDB with Pinecone for production vector search
"""

import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
import logging

logger = logging.getLogger(__name__)


class PineconeService:
    """Production-grade vector search service using Pinecone"""
    
    def __init__(
        self,
        api_key: str = None,
        environment: str = "us-east-1",
        default_namespace: str = "default"
    ):
        """Initialize Pinecone service"""
        self.api_key = api_key or os.getenv('PINECONE_API_KEY')
        if not self.api_key:
            raise ValueError("Pinecone API key required")
        
        self.environment = environment
        self.default_namespace = default_namespace
        
        # Initialize Pinecone client
        self.pc = Pinecone(api_key=self.api_key)
        
        # Cache for index connections
        self._indexes = {}
        
        logger.info(f"Pinecone service initialized (environment: {environment})")
    
    def get_or_create_index(
        self,
        index_name: str,
        dimension: int = 1536,
        metric: str = 'cosine'
    ):
        """Get existing index or create new one"""
        # Normalize index name
        index_name = index_name.lower().replace('_', '-')
        
        # Check cache
        if index_name in self._indexes:
            return self._indexes[index_name]
        
        # Check if index exists
        existing_indexes = self.pc.list_indexes().names()
        
        if index_name not in existing_indexes:
            logger.info(f"Creating new index: {index_name}")
            self.pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud='aws',
                    region=self.environment
                )
            )
            
            # Wait for index to be ready
            import time
            while not self.pc.describe_index(index_name).status['ready']:
                logger.info(f"Waiting for index {index_name} to be ready...")
                time.sleep(2)
        
        # Get index connection
        index = self.pc.Index(index_name)
        self._indexes[index_name] = index
        
        return index
    
    def upsert(
        self,
        index_name: str,
        vectors: List[Dict[str, Any]],
        namespace: str = None
    ) -> Dict[str, int]:
        """Insert or update vectors"""
        index = self.get_or_create_index(index_name)
        namespace = namespace or self.default_namespace
        
        response = index.upsert(vectors=vectors, namespace=namespace)
        
        logger.info(f"Upserted {response['upserted_count']} vectors to {index_name}/{namespace}")
        
        return response
    
    def query(
        self,
        index_name: str,
        vector: List[float],
        top_k: int = 10,
        namespace: str = None,
        filter: Dict[str, Any] = None,
        include_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """Query vectors by similarity"""
        index = self.get_or_create_index(index_name)
        namespace = namespace or self.default_namespace
        
        response = index.query(
            vector=vector,
            top_k=top_k,
            namespace=namespace,
            filter=filter,
            include_metadata=include_metadata,
            include_values=False
        )
        
        # Format results
        results = []
        for match in response['matches']:
            results.append({
                'id': match['id'],
                'score': match['score'],
                'metadata': match.get('metadata', {})
            })
        
        logger.info(f"Query returned {len(results)} results from {index_name}/{namespace}")
        
        return results
    
    def delete(
        self,
        index_name: str,
        ids: List[str] = None,
        filter: Dict[str, Any] = None,
        namespace: str = None,
        delete_all: bool = False
    ):
        """Delete vectors"""
        index = self.get_or_create_index(index_name)
        namespace = namespace or self.default_namespace
        
        if delete_all:
            index.delete(delete_all=True, namespace=namespace)
            logger.info(f"Deleted all vectors from {index_name}/{namespace}")
        elif ids:
            index.delete(ids=ids, namespace=namespace)
            logger.info(f"Deleted {len(ids)} vectors from {index_name}/{namespace}")
        elif filter:
            index.delete(filter=filter, namespace=namespace)
            logger.info(f"Deleted vectors matching filter from {index_name}/{namespace}")
    
    def get_stats(self, index_name: str) -> Dict[str, Any]:
        """Get index statistics"""
        index = self.get_or_create_index(index_name)
        stats = index.describe_index_stats()
        
        return {
            'total_vector_count': stats['total_vector_count'],
            'dimension': stats.get('dimension'),
            'index_fullness': stats.get('index_fullness', 0),
            'namespaces': stats.get('namespaces', {})
        }
    
    def list_indexes(self) -> List[str]:
        """List all available indexes"""
        return self.pc.list_indexes().names()
    
    def delete_index(self, index_name: str):
        """Delete an index"""
        index_name = index_name.lower().replace('_', '-')
        
        if index_name in self._indexes:
            del self._indexes[index_name]
        
        self.pc.delete_index(index_name)
        logger.info(f"Deleted index: {index_name}")


# Oracle-specific Pinecone service
class OracleVectorService(PineconeService):
    """Specialized service for Oracle knowledge bases"""
    
    ORACLE_INDEXES = {
        'tax': 'nuzantara-oracle-tax',
        'legal': 'nuzantara-oracle-legal',
        'property': 'nuzantara-oracle-property',
        'visa': 'nuzantara-oracle-visa',
        'kbli': 'nuzantara-oracle-kbli'
    }
    
    def query_oracle(
        self,
        oracle_type: str,
        query_embedding: List[float],
        top_k: int = 5,
        filter: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Query specific Oracle knowledge base"""
        index_name = self.ORACLE_INDEXES.get(oracle_type)
        
        if not index_name:
            raise ValueError(f"Unknown oracle type: {oracle_type}")
        
        return self.query(
            index_name=index_name,
            vector=query_embedding,
            top_k=top_k,
            filter=filter,
            include_metadata=True
        )
    
    def upsert_oracle(
        self,
        oracle_type: str,
        documents: List[Dict[str, Any]]
    ):
        """Upsert documents to Oracle knowledge base"""
        index_name = self.ORACLE_INDEXES.get(oracle_type)
        
        if not index_name:
            raise ValueError(f"Unknown oracle type: {oracle_type}")
        
        # Prepare vectors
        vectors = []
        for doc in documents:
            vectors.append({
                'id': doc['id'],
                'values': doc['embedding'],
                'metadata': {
                    'text': doc.get('text', ''),
                    'source': doc.get('source', ''),
                    'oracle_type': oracle_type,
                    **doc.get('metadata', {})
                }
            })
        
        return self.upsert(index_name=index_name, vectors=vectors)


# Singleton instance
_pinecone_service = None


def get_pinecone_service() -> PineconeService:
    """Get singleton Pinecone service instance"""
    global _pinecone_service
    
    if _pinecone_service is None:
        _pinecone_service = PineconeService()
    
    return _pinecone_service


def get_oracle_service() -> OracleVectorService:
    """Get singleton Oracle vector service instance"""
    global _pinecone_service
    
    if _pinecone_service is None or not isinstance(_pinecone_service, OracleVectorService):
        _pinecone_service = OracleVectorService()
    
    return _pinecone_service
