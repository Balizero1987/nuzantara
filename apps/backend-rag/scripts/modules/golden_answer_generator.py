"""
Golden Answer Generator - Create comprehensive FAQ answers using LLAMA + RAG

For each query cluster:
1. Query RAG/vector DB for relevant legal documents
2. Pass to LLAMA 3.1 with cluster questions
3. Generate comprehensive, authoritative answer
4. Save to golden_answers table in PostgreSQL

CRITICAL: LLAMA must ALWAYS use RAG legal docs as source of truth
"""

import asyncpg
import logging
from typing import List, Dict, Optional
from datetime import datetime
import json
import httpx

logger = logging.getLogger(__name__)


class GoldenAnswerGenerator:
    """
    Generates comprehensive FAQ answers using LLAMA 3.1 + RAG
    """

    def __init__(
        self,
        database_url: str,
        runpod_endpoint: Optional[str] = None,
        runpod_api_key: Optional[str] = None,
        rag_backend_url: Optional[str] = None
    ):
        """
        Initialize generator

        Args:
            database_url: PostgreSQL connection string
            runpod_endpoint: RunPod LLAMA endpoint
            runpod_api_key: RunPod API key
            rag_backend_url: RAG backend URL for vector DB queries
        """
        self.database_url = database_url
        self.runpod_endpoint = runpod_endpoint
        self.runpod_api_key = runpod_api_key
        self.rag_backend_url = rag_backend_url
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initialize PostgreSQL connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ GoldenAnswerGenerator connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise

    async def close(self):
        """Close PostgreSQL connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")

    async def generate_golden_answer(
        self,
        cluster: 'QueryCluster',  # From query_clustering.py
        user_id: str = "system"
    ) -> Optional[Dict]:
        """
        Generate golden answer for a query cluster

        Args:
            cluster: QueryCluster object with canonical_question and variations
            user_id: User ID for RAG context (default: "system")

        Returns:
            Dict with answer, sources, confidence
        """
        logger.info(f"🔄 Generating golden answer for: {cluster.canonical_question}")

        try:
            # Step 1: Query RAG for relevant documents
            rag_results = await self._query_rag(
                query=cluster.canonical_question,
                user_id=user_id
            )

            if not rag_results:
                logger.warning(f"⚠️ No RAG results found for: {cluster.canonical_question}")
                return None

            # Step 2: Build context from RAG documents
            context = self._build_rag_context(rag_results)

            # Step 3: Generate answer with LLAMA
            answer_data = await self._generate_with_llama(
                canonical_question=cluster.canonical_question,
                variations=cluster.variations,
                rag_context=context
            )

            if not answer_data:
                logger.error(f"❌ LLAMA generation failed for: {cluster.canonical_question}")
                return None

            # Step 4: Save to golden_answers table
            await self._save_golden_answer(
                cluster_id=cluster.cluster_id,
                canonical_question=cluster.canonical_question,
                variations=cluster.variations,
                answer=answer_data['answer'],
                sources=rag_results[:5],  # Top 5 sources
                confidence=answer_data.get('confidence', 0.8)
            )

            logger.info(f"✅ Golden answer generated: {cluster.cluster_id}")

            return {
                "cluster_id": cluster.cluster_id,
                "canonical_question": cluster.canonical_question,
                "answer": answer_data['answer'],
                "sources": rag_results[:5],
                "confidence": answer_data.get('confidence', 0.8),
                "tokens_used": answer_data.get('tokens_used', 0)
            }

        except Exception as e:
            logger.error(f"❌ Failed to generate golden answer: {e}")
            return None

    async def _query_rag(
        self,
        query: str,
        user_id: str = "system",
        limit: int = 5
    ) -> List[Dict]:
        """
        Query RAG/vector DB for relevant documents

        Args:
            query: User query
            user_id: User ID for context
            limit: Max results to return

        Returns:
            List of {content, metadata, score} dicts
        """
        if not self.rag_backend_url:
            logger.warning("⚠️ RAG backend URL not configured")
            return []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.rag_backend_url}/search",
                    json={
                        "query": query,
                        "user_id": user_id,
                        "limit": limit
                    }
                )
                response.raise_for_status()
                data = response.json()

                results = data.get("results", [])
                logger.info(f"📚 RAG returned {len(results)} documents")

                return results

        except Exception as e:
            logger.error(f"❌ RAG query failed: {e}")
            return []

    def _build_rag_context(self, rag_results: List[Dict]) -> str:
        """
        Build context string from RAG documents

        Args:
            rag_results: List of RAG results

        Returns:
            Formatted context string
        """
        context_parts = []

        for i, result in enumerate(rag_results, 1):
            content = result.get('content', '')
            metadata = result.get('metadata', {})
            title = metadata.get('title', f'Document {i}')
            source_url = metadata.get('source_url', '')

            context_parts.append(f"### Source {i}: {title}")
            if source_url:
                context_parts.append(f"URL: {source_url}")
            context_parts.append(content[:1000])  # First 1000 chars
            context_parts.append("")

        return "\n".join(context_parts)

    async def _generate_with_llama(
        self,
        canonical_question: str,
        variations: List[str],
        rag_context: str
    ) -> Optional[Dict]:
        """
        Generate comprehensive answer using LLAMA 3.1

        Args:
            canonical_question: Main question
            variations: Alternative phrasings
            rag_context: RAG documents context

        Returns:
            Dict with answer and confidence
        """
        if not self.runpod_endpoint or not self.runpod_api_key:
            logger.warning("⚠️ LLAMA not configured")
            return None

        # Build prompt for LLAMA
        variations_text = "\n".join(f"- {v}" for v in variations[:5])

        prompt = f"""You are ZANTARA's legal expert AI. Generate a comprehensive FAQ answer.

**Question**: {canonical_question}

**Alternative Phrasings**:
{variations_text}

**Relevant Legal Documents**:
{rag_context}

**Instructions**:
1. Answer MUST be based ONLY on provided legal documents above
2. Be comprehensive but concise (300-500 words)
3. Include specific regulation names (Perpres, Permen, etc.) when relevant
4. Use clear, simple English for foreign clients
5. Organize answer with:
   - Direct answer first
   - Requirements/steps (if applicable)
   - Timeline expectations
   - Common pitfalls to avoid
6. Cite sources with [Source N] notation

**CRITICAL**: Do NOT use information from your training data. ONLY use the legal documents provided above.

Generate the FAQ answer now:"""

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.runpod_endpoint}/runsync",
                    headers={
                        "Authorization": f"Bearer {self.runpod_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "input": {
                            "prompt": prompt,
                            "max_tokens": 800,
                            "temperature": 0.3,
                            "top_p": 0.9
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()

                answer_text = data.get("output", {}).get("text", "")

                if not answer_text:
                    logger.error("❌ LLAMA returned empty response")
                    return None

                # Extract token usage from RunPod response
                usage = data.get("usage", {})
                tokens_used = usage.get("total_tokens", 0) or (
                    usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)
                )

                logger.info(f"✅ LLAMA generated answer ({len(answer_text)} chars, {tokens_used} tokens)")

                return {
                    "answer": answer_text.strip(),
                    "confidence": 0.85,  # Default confidence
                    "tokens_used": tokens_used
                }

        except httpx.TimeoutException:
            logger.error("❌ LLAMA timeout (>120s)")
            return None
        except Exception as e:
            logger.error(f"❌ LLAMA generation failed: {e}")
            return None

    async def _save_golden_answer(
        self,
        cluster_id: str,
        canonical_question: str,
        variations: List[str],
        answer: str,
        sources: List[Dict],
        confidence: float
    ):
        """
        Save golden answer to PostgreSQL

        Args:
            cluster_id: Cluster identifier
            canonical_question: Main question
            variations: Alternative phrasings
            answer: Generated answer
            sources: RAG sources used
            confidence: Confidence score (0-1)
        """
        if not self.pool:
            await self.connect()

        # Format sources as JSONB
        sources_json = [
            {
                "title": s.get('metadata', {}).get('title', 'Unknown'),
                "url": s.get('metadata', {}).get('source_url', ''),
                "score": s.get('score', 0.0)
            }
            for s in sources
        ]

        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO golden_answers (
                        cluster_id,
                        canonical_question,
                        variations,
                        answer,
                        sources,
                        generated_by,
                        generation_method,
                        confidence,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                    ON CONFLICT (cluster_id) DO UPDATE SET
                        canonical_question = EXCLUDED.canonical_question,
                        variations = EXCLUDED.variations,
                        answer = EXCLUDED.answer,
                        sources = EXCLUDED.sources,
                        confidence = EXCLUDED.confidence,
                        updated_at = NOW()
                """,
                    cluster_id,
                    canonical_question,
                    variations,
                    answer,
                    json.dumps(sources_json),
                    "llama-3.1-zantara",
                    "llama_rag",
                    confidence
                )

            logger.info(f"✅ Saved golden answer: {cluster_id}")

        except Exception as e:
            logger.error(f"❌ Failed to save golden answer: {e}")
            raise

    async def batch_generate_golden_answers(
        self,
        clusters: List['QueryCluster'],
        limit: Optional[int] = None
    ) -> Dict:
        """
        Generate golden answers for multiple clusters

        Args:
            clusters: List of QueryCluster objects
            limit: Max clusters to process (None = all)

        Returns:
            Dict with statistics
        """
        if limit:
            clusters = clusters[:limit]

        logger.info(f"🚀 Batch generating golden answers for {len(clusters)} clusters")

        stats = {
            "total_clusters": len(clusters),
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "tokens_used": 0
        }

        for i, cluster in enumerate(clusters, 1):
            logger.info(f"[{i}/{len(clusters)}] Processing: {cluster.canonical_question[:60]}...")

            try:
                result = await self.generate_golden_answer(cluster)

                if result:
                    stats["successful"] += 1
                    stats["tokens_used"] += result.get("tokens_used", 0)
                else:
                    stats["failed"] += 1

            except Exception as e:
                logger.error(f"❌ Cluster {cluster.cluster_id} failed: {e}")
                stats["failed"] += 1

            # Rate limiting (avoid LLAMA throttling)
            import asyncio
            await asyncio.sleep(5)

        logger.info(f"✅ Batch generation complete:")
        logger.info(f"   Successful: {stats['successful']}")
        logger.info(f"   Failed: {stats['failed']}")
        logger.info(f"   Tokens used: {stats['tokens_used']}")

        return stats


# Convenience function for testing
async def test_generator():
    """Test golden answer generator"""
    import os
    from query_clustering import QueryCluster

    database_url = os.getenv("DATABASE_URL")
    runpod_endpoint = os.getenv("RUNPOD_LLAMA_ENDPOINT")
    runpod_api_key = os.getenv("RUNPOD_API_KEY")
    rag_backend_url = os.getenv("RAG_BACKEND_URL", "https://nuzantara-rag.fly.dev")

    if not database_url:
        print("❌ DATABASE_URL not set")
        return

    generator = GoldenAnswerGenerator(
        database_url=database_url,
        runpod_endpoint=runpod_endpoint,
        runpod_api_key=runpod_api_key,
        rag_backend_url=rag_backend_url
    )

    # Test cluster
    test_cluster = QueryCluster(
        cluster_id="kitas_process_test",
        canonical_question="How to get KITAS in Indonesia?",
        variations=[
            "How to get KITAS in Indonesia?",
            "KITAS requirements?",
            "What is needed for KITAS?"
        ],
        query_hashes=["hash1", "hash2", "hash3"],
        avg_similarity=0.85,
        total_frequency=15
    )

    try:
        await generator.connect()

        print("\n🚀 TESTING GOLDEN ANSWER GENERATION")
        print("=" * 60)

        result = await generator.generate_golden_answer(test_cluster)

        if result:
            print(f"\n✅ SUCCESS!")
            print(f"Cluster ID: {result['cluster_id']}")
            print(f"Question: {result['canonical_question']}")
            print(f"\nAnswer ({len(result['answer'])} chars):")
            print(result['answer'][:500] + "...")
            print(f"\nSources: {len(result['sources'])}")
            print(f"Confidence: {result['confidence']}")
        else:
            print("\n❌ Generation failed")

    finally:
        await generator.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_generator())
