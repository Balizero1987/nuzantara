"""
Query Clustering - Semantic grouping of similar queries using embeddings

Uses sentence-transformers to generate embeddings and DBSCAN for clustering.
Groups similar queries together (e.g., "How to get KITAS?" + "KITAS requirements?")

Dependencies:
    pip install sentence-transformers scikit-learn numpy

Usage:
    from query_clustering import QueryClusterer

    clusterer = QueryClusterer()
    clusters = await clusterer.cluster_queries(query_records)
"""

import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class QueryCluster:
    """A cluster of similar queries"""
    cluster_id: str
    canonical_question: str  # Most representative query
    variations: List[str]  # All query variations in cluster
    query_hashes: List[str]  # MD5 hashes of queries
    avg_similarity: float  # Average cosine similarity within cluster
    total_frequency: int  # Sum of all query frequencies


class QueryClusterer:
    """
    Semantic clustering of user queries using sentence embeddings
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize clusterer with sentence-transformers model

        Args:
            model_name: HuggingFace model for embeddings
        """
        self.model_name = model_name
        self.model: Optional[SentenceTransformer] = None
        logger.info(f"QueryClusterer initialized (model: {model_name})")

    def _load_model(self):
        """Lazy load sentence-transformers model"""
        if self.model is None:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("✅ Model loaded")

    async def cluster_queries(
        self,
        query_records: List,  # List[QueryRecord] from query_analyzer
        min_cluster_size: int = 3,
        similarity_threshold: float = 0.75
    ) -> List[QueryCluster]:
        """
        Cluster similar queries using semantic embeddings

        Args:
            query_records: List of QueryRecord objects from QueryAnalyzer
            min_cluster_size: Minimum queries per cluster
            similarity_threshold: Cosine similarity threshold (0.75 = 75%)

        Returns:
            List of QueryCluster objects
        """
        if not query_records:
            logger.warning("No queries to cluster")
            return []

        self._load_model()

        # Extract unique queries (by hash)
        unique_queries = {}  # query_hash -> QueryRecord
        for record in query_records:
            if record.query_hash not in unique_queries:
                unique_queries[record.query_hash] = record

        logger.info(f"📊 Clustering {len(unique_queries)} unique queries (from {len(query_records)} total)")

        # Generate embeddings
        query_texts = [record.query_text for record in unique_queries.values()]
        query_hashes = list(unique_queries.keys())

        logger.info("🔄 Generating embeddings...")
        embeddings = self.model.encode(query_texts, show_progress_bar=False)

        # Perform DBSCAN clustering
        logger.info("🔄 Clustering with DBSCAN...")

        # Convert similarity threshold to distance (eps parameter)
        # Cosine similarity: 0.75 → distance: 1 - 0.75 = 0.25
        eps = 1 - similarity_threshold

        clustering = DBSCAN(
            eps=eps,
            min_samples=min_cluster_size,
            metric='cosine'
        ).fit(embeddings)

        labels = clustering.labels_
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        n_noise = list(labels).count(-1)

        logger.info(f"✅ Found {n_clusters} clusters ({n_noise} outliers)")

        # Build clusters
        clusters = []
        for cluster_label in set(labels):
            if cluster_label == -1:
                continue  # Skip noise

            # Get queries in this cluster
            cluster_indices = [i for i, label in enumerate(labels) if label == cluster_label]
            cluster_queries = [query_texts[i] for i in cluster_indices]
            cluster_hashes = [query_hashes[i] for i in cluster_indices]
            cluster_embeddings = embeddings[cluster_indices]

            # Find canonical question (query closest to cluster centroid)
            centroid = np.mean(cluster_embeddings, axis=0)
            similarities = cosine_similarity([centroid], cluster_embeddings)[0]
            canonical_idx = np.argmax(similarities)
            canonical_question = cluster_queries[canonical_idx]

            # Calculate average similarity within cluster
            similarity_matrix = cosine_similarity(cluster_embeddings)
            avg_similarity = np.mean(similarity_matrix[np.triu_indices_from(similarity_matrix, k=1)])

            # Calculate total frequency (sum of individual query frequencies)
            total_frequency = sum(
                sum(1 for r in query_records if r.query_hash == hash_val)
                for hash_val in cluster_hashes
            )

            # Generate cluster_id from canonical question
            cluster_id = self._generate_cluster_id(canonical_question)

            cluster = QueryCluster(
                cluster_id=cluster_id,
                canonical_question=canonical_question,
                variations=cluster_queries,
                query_hashes=cluster_hashes,
                avg_similarity=float(avg_similarity),
                total_frequency=total_frequency
            )

            clusters.append(cluster)

        # Sort by frequency (most common clusters first)
        clusters.sort(key=lambda c: c.total_frequency, reverse=True)

        logger.info(f"📊 Created {len(clusters)} clusters")
        if clusters:
            logger.info(f"   Top cluster: '{clusters[0].canonical_question}' (freq: {clusters[0].total_frequency})")

        return clusters

    def _generate_cluster_id(self, canonical_question: str) -> str:
        """
        Generate cluster_id from canonical question

        Examples:
            "How to get KITAS?" → "kitas_process_a1b2c3"
            "KITAS requirements?" → "kitas_requirements_d4e5f6"
        """
        # Create descriptive prefix (first 3-4 keywords)
        words = canonical_question.lower().split()
        keywords = [w for w in words if len(w) > 3 and w.isalpha()][:3]
        prefix = "_".join(keywords) if keywords else "query"

        # Add unique hash suffix (first 6 chars of MD5)
        hash_suffix = hashlib.md5(canonical_question.encode('utf-8')).hexdigest()[:6]

        cluster_id = f"{prefix}_{hash_suffix}"

        # Truncate to max 100 chars (PostgreSQL VARCHAR limit)
        return cluster_id[:100]

    async def get_top_clusters(
        self,
        clusters: List[QueryCluster],
        limit: int = 50
    ) -> List[QueryCluster]:
        """
        Get top N clusters by frequency

        Args:
            clusters: List of QueryCluster objects
            limit: Number of top clusters to return

        Returns:
            Top N clusters sorted by frequency
        """
        sorted_clusters = sorted(
            clusters,
            key=lambda c: c.total_frequency,
            reverse=True
        )

        return sorted_clusters[:limit]

    async def calculate_coverage(
        self,
        clusters: List[QueryCluster],
        total_queries: int
    ) -> Dict:
        """
        Calculate what % of total queries are covered by clusters

        Args:
            clusters: List of QueryCluster objects
            total_queries: Total number of queries analyzed

        Returns:
            Dict with coverage statistics
        """
        if not clusters or total_queries == 0:
            return {
                "total_queries": total_queries,
                "clustered_queries": 0,
                "coverage_pct": 0.0,
                "top_10_coverage_pct": 0.0,
                "top_50_coverage_pct": 0.0
            }

        clustered_queries = sum(c.total_frequency for c in clusters)
        coverage_pct = (clustered_queries / total_queries * 100) if total_queries > 0 else 0

        # Top 10 coverage
        top_10 = clusters[:10]
        top_10_queries = sum(c.total_frequency for c in top_10)
        top_10_coverage_pct = (top_10_queries / total_queries * 100) if total_queries > 0 else 0

        # Top 50 coverage
        top_50 = clusters[:50]
        top_50_queries = sum(c.total_frequency for c in top_50)
        top_50_coverage_pct = (top_50_queries / total_queries * 100) if total_queries > 0 else 0

        logger.info(f"📊 Coverage Analysis:")
        logger.info(f"   Total queries: {total_queries}")
        logger.info(f"   Clustered: {clustered_queries} ({coverage_pct:.1f}%)")
        logger.info(f"   Top 10 clusters: {top_10_queries} ({top_10_coverage_pct:.1f}%)")
        logger.info(f"   Top 50 clusters: {top_50_queries} ({top_50_coverage_pct:.1f}%)")

        return {
            "total_queries": total_queries,
            "clustered_queries": clustered_queries,
            "coverage_pct": round(coverage_pct, 2),
            "top_10_coverage_pct": round(top_10_coverage_pct, 2),
            "top_50_coverage_pct": round(top_50_coverage_pct, 2)
        }


# Convenience function for testing
async def test_clustering():
    """Test query clustering with sample data"""
    from query_analyzer import QueryRecord
    from datetime import datetime

    # Sample queries (simulating real data)
    sample_queries = [
        QueryRecord("How to get KITAS?", "hash1", "sonnet", "...", datetime.now(), "user1", 100, 200),
        QueryRecord("KITAS requirements?", "hash2", "sonnet", "...", datetime.now(), "user2", 100, 200),
        QueryRecord("What is KITAS cost?", "hash3", "sonnet", "...", datetime.now(), "user3", 100, 200),
        QueryRecord("How to apply for KITAS", "hash4", "sonnet", "...", datetime.now(), "user4", 100, 200),
        QueryRecord("How to start PT PMA?", "hash5", "sonnet", "...", datetime.now(), "user5", 100, 200),
        QueryRecord("PT PMA requirements", "hash6", "sonnet", "...", datetime.now(), "user6", 100, 200),
        QueryRecord("Company registration Indonesia", "hash7", "sonnet", "...", datetime.now(), "user7", 100, 200),
    ]

    clusterer = QueryClusterer()
    clusters = await clusterer.cluster_queries(sample_queries, min_cluster_size=2)

    print(f"\n📊 CLUSTERING RESULTS")
    print(f"=" * 60)
    print(f"Total queries: {len(sample_queries)}")
    print(f"Clusters found: {len(clusters)}")

    print(f"\n🔝 TOP CLUSTERS:")
    for i, cluster in enumerate(clusters, 1):
        print(f"\n{i}. Cluster: {cluster.cluster_id}")
        print(f"   Canonical: {cluster.canonical_question}")
        print(f"   Variations ({len(cluster.variations)}):")
        for var in cluster.variations:
            print(f"      - {var}")
        print(f"   Frequency: {cluster.total_frequency}")
        print(f"   Avg Similarity: {cluster.avg_similarity:.2f}")

    # Coverage analysis
    coverage = await clusterer.calculate_coverage(clusters, len(sample_queries))
    print(f"\n📈 COVERAGE:")
    print(f"   Clustered: {coverage['clustered_queries']}/{coverage['total_queries']} ({coverage['coverage_pct']}%)")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_clustering())
