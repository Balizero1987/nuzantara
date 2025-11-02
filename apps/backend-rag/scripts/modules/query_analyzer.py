"""
Query Analyzer - Extract and analyze user queries from conversation logs

Reads from PostgreSQL conversations table and extracts:
- User queries
- AI responses
- Metadata (model used, tokens, etc.)
- Frequency analysis
"""

import asyncpg
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import json
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class QueryRecord:
    """Single query record from conversation logs"""
    query_text: str
    query_hash: str
    ai_used: str  # 'sonnet', 'haiku', 'llama'
    response_text: str
    timestamp: datetime
    user_id: str
    tokens_input: int
    tokens_output: int


class QueryAnalyzer:
    """
    Analyzes conversation logs to extract and cluster user queries
    """

    def __init__(self, database_url: str):
        """
        Initialize QueryAnalyzer

        Args:
            database_url: PostgreSQL connection string
        """
        self.database_url = database_url
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
            logger.info("✅ QueryAnalyzer connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise

    async def close(self):
        """Close PostgreSQL connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")

    async def extract_queries_from_period(
        self,
        days: int = 1,
        ai_filter: Optional[List[str]] = None
    ) -> List[QueryRecord]:
        """
        Extract user queries from conversation logs for specified period

        Args:
            days: Number of days to look back
            ai_filter: Filter by AI used (e.g., ['sonnet', 'haiku'])

        Returns:
            List of QueryRecord objects
        """
        if not self.pool:
            await self.connect()

        try:
            since_date = datetime.now() - timedelta(days=days)

            # Build query
            query = """
                SELECT
                    messages,
                    metadata,
                    user_id,
                    created_at
                FROM conversations
                WHERE created_at >= $1
            """

            params = [since_date]

            # Add AI filter if specified
            if ai_filter:
                query += " AND metadata->>'ai_used' = ANY($2)"
                params.append(ai_filter)

            query += " ORDER BY created_at DESC"

            async with self.pool.acquire() as conn:
                rows = await conn.fetch(query, *params)

            logger.info(f"📊 Fetched {len(rows)} conversations from last {days} day(s)")

            # Extract queries from conversation messages
            query_records = []

            for row in rows:
                try:
                    messages = row['messages']  # JSONB
                    metadata = row['metadata']  # JSONB

                    # Parse messages (list of {role, content})
                    if isinstance(messages, str):
                        messages = json.loads(messages)

                    # Find last user message (skip system/assistant messages)
                    user_message = None
                    assistant_message = None

                    for i, msg in enumerate(messages):
                        if isinstance(msg, dict):
                            if msg.get('role') == 'user':
                                user_message = msg.get('content', '')
                            elif msg.get('role') == 'assistant':
                                assistant_message = msg.get('content', '')

                    if not user_message:
                        continue

                    # Extract metadata
                    if isinstance(metadata, str):
                        metadata = json.loads(metadata)

                    ai_used = metadata.get('ai_used', 'unknown')
                    tokens_input = metadata.get('input_tokens', 0) or 0
                    tokens_output = metadata.get('output_tokens', 0) or 0

                    # Generate query hash (for deduplication)
                    query_hash = hashlib.md5(
                        user_message.lower().strip().encode('utf-8')
                    ).hexdigest()

                    # Create QueryRecord
                    record = QueryRecord(
                        query_text=user_message,
                        query_hash=query_hash,
                        ai_used=ai_used,
                        response_text=assistant_message or "",
                        timestamp=row['created_at'],
                        user_id=row['user_id'],
                        tokens_input=tokens_input,
                        tokens_output=tokens_output
                    )

                    query_records.append(record)

                except Exception as e:
                    logger.warning(f"⚠️ Failed to parse conversation row: {e}")
                    continue

            logger.info(f"✅ Extracted {len(query_records)} queries")
            return query_records

        except Exception as e:
            logger.error(f"❌ Query extraction failed: {e}")
            raise

    async def get_query_frequency_distribution(
        self,
        queries: List[QueryRecord]
    ) -> Dict[str, int]:
        """
        Get frequency distribution of queries (by hash)

        Args:
            queries: List of QueryRecord objects

        Returns:
            Dict mapping query_hash -> frequency
        """
        frequency = {}

        for query in queries:
            freq = frequency.get(query.query_hash, 0)
            frequency[query.query_hash] = freq + 1

        # Sort by frequency
        sorted_freq = dict(
            sorted(frequency.items(), key=lambda x: x[1], reverse=True)
        )

        logger.info(f"📊 Query frequency distribution: {len(sorted_freq)} unique queries")
        logger.info(f"   Top query: {sorted_freq[list(sorted_freq.keys())[0]]} occurrences")

        return sorted_freq

    async def get_top_queries(
        self,
        queries: List[QueryRecord],
        limit: int = 50
    ) -> List[Dict]:
        """
        Get top N most frequent queries

        Args:
            queries: List of QueryRecord objects
            limit: Number of top queries to return

        Returns:
            List of dicts with query details and frequency
        """
        # Build frequency map
        frequency_map = {}  # query_hash -> {record, count}

        for query in queries:
            if query.query_hash in frequency_map:
                frequency_map[query.query_hash]['count'] += 1
            else:
                frequency_map[query.query_hash] = {
                    'record': query,
                    'count': 1
                }

        # Sort by count
        sorted_queries = sorted(
            frequency_map.values(),
            key=lambda x: x['count'],
            reverse=True
        )[:limit]

        # Format output
        top_queries = []
        for item in sorted_queries:
            record = item['record']
            top_queries.append({
                'query_text': record.query_text,
                'query_hash': record.query_hash,
                'frequency': item['count'],
                'ai_used': record.ai_used,
                'avg_tokens': record.tokens_input,  # Simplified
                'first_seen': record.timestamp.isoformat()
            })

        logger.info(f"📊 Top {len(top_queries)} queries identified")
        return top_queries

    async def analyze_ai_distribution(
        self,
        queries: List[QueryRecord]
    ) -> Dict[str, int]:
        """
        Analyze which AI handled each query

        Args:
            queries: List of QueryRecord objects

        Returns:
            Dict mapping ai_used -> count
        """
        distribution = {}

        for query in queries:
            ai = query.ai_used
            distribution[ai] = distribution.get(ai, 0) + 1

        logger.info(f"🤖 AI distribution: {distribution}")
        return distribution

    async def get_analytics_summary(
        self,
        days: int = 1
    ) -> Dict:
        """
        Get comprehensive analytics summary

        Args:
            days: Number of days to analyze

        Returns:
            Dict with analytics data
        """
        queries = await self.extract_queries_from_period(days=days)

        if not queries:
            return {
                "period_days": days,
                "total_queries": 0,
                "message": "No queries found in period"
            }

        top_queries = await self.get_top_queries(queries, limit=50)
        ai_distribution = await self.analyze_ai_distribution(queries)

        # Calculate potential golden answer coverage
        # (top 50 queries = what % of total traffic?)
        top_50_coverage = sum(q['frequency'] for q in top_queries[:50])
        total_queries = len(queries)
        coverage_pct = (top_50_coverage / total_queries * 100) if total_queries > 0 else 0

        return {
            "period_days": days,
            "total_queries": total_queries,
            "unique_queries": len(set(q.query_hash for q in queries)),
            "top_queries_count": len(top_queries),
            "top_50_coverage": {
                "queries_covered": top_50_coverage,
                "coverage_percentage": round(coverage_pct, 2)
            },
            "ai_distribution": ai_distribution,
            "top_queries": top_queries[:10]  # Top 10 for preview
        }


# Convenience function for testing
async def test_query_analyzer(database_url: str):
    """Test query analyzer with sample data"""
    analyzer = QueryAnalyzer(database_url)

    try:
        await analyzer.connect()

        # Get queries from last 7 days
        queries = await analyzer.extract_queries_from_period(days=7)

        print(f"\n📊 QUERY ANALYSIS RESULTS")
        print(f"=" * 60)
        print(f"Total queries: {len(queries)}")

        # Get top queries
        top = await analyzer.get_top_queries(queries, limit=10)
        print(f"\n🔝 TOP 10 QUERIES:")
        for i, q in enumerate(top, 1):
            print(f"{i}. [{q['frequency']}x] {q['query_text'][:60]}...")

        # Get analytics
        analytics = await analyzer.get_analytics_summary(days=7)
        print(f"\n📈 ANALYTICS SUMMARY:")
        print(json.dumps(analytics, indent=2))

    finally:
        await analyzer.close()


if __name__ == "__main__":
    import os
    import asyncio

    # Test with Fly.io DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        asyncio.run(test_query_analyzer(database_url))
    else:
        print("❌ DATABASE_URL not set")
