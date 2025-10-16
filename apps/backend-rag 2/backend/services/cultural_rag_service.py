"""
Cultural RAG Service - Inject Indonesian cultural context into Haiku responses

Retrieves relevant cultural knowledge chunks based on conversation context
and injects them into Haiku's system prompt.

This is NOT fixed responses - Haiku uses cultural knowledge dynamically
to generate natural, culturally-aware answers.

Example contexts that trigger cultural knowledge:
- First contact → indonesian_greetings
- Timeline frustration → bureaucracy_patience
- Official rejection → face_saving_culture
- Meeting preparation → meeting_etiquette
"""

import asyncpg
import logging
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)


class CulturalRAGService:
    """
    Retrieves and injects cultural knowledge for Haiku
    """

    def __init__(self, database_url: str):
        """
        Initialize service

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
                command_timeout=30
            )
            logger.info("✅ CulturalRAGService connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise

    async def close(self):
        """Close PostgreSQL connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("CulturalRAGService connection closed")

    async def get_cultural_context(
        self,
        conversation_context: Dict,
        limit: int = 3
    ) -> List[Dict]:
        """
        Retrieve relevant cultural knowledge chunks based on conversation context

        Args:
            conversation_context: Dict with:
                - intent: str (e.g., 'greeting', 'timeline_question', 'frustration')
                - conversation_stage: str (e.g., 'first_contact', 'ongoing', 'closing')
                - tone_needed: str (e.g., 'friendly', 'empathetic', 'reassuring')
            limit: Max chunks to return

        Returns:
            List of cultural knowledge chunks
        """
        if not self.pool:
            await self.connect()

        try:
            # Determine which cultural topics are relevant
            relevant_topics = self._determine_relevant_topics(conversation_context)

            if not relevant_topics:
                logger.debug("No relevant cultural topics for this context")
                return []

            # Fetch cultural chunks
            async with self.pool.acquire() as conn:
                chunks = await conn.fetch("""
                    SELECT
                        topic,
                        content,
                        when_to_use,
                        tone,
                        usage_count
                    FROM cultural_knowledge
                    WHERE topic = ANY($1)
                    ORDER BY usage_count DESC
                    LIMIT $2
                """, relevant_topics, limit)

            # Increment usage counts
            for chunk in chunks:
                await self._increment_usage(chunk['topic'])

            logger.info(f"📚 Retrieved {len(chunks)} cultural chunks: {[c['topic'] for c in chunks]}")

            return [
                {
                    "topic": chunk["topic"],
                    "content": chunk["content"],
                    "when_to_use": chunk["when_to_use"],
                    "tone": chunk["tone"]
                }
                for chunk in chunks
            ]

        except Exception as e:
            logger.error(f"❌ Failed to retrieve cultural context: {e}")
            return []

    def _determine_relevant_topics(self, context: Dict) -> List[str]:
        """
        Determine which cultural topics are relevant for this conversation

        Args:
            context: Conversation context dict

        Returns:
            List of relevant topic names
        """
        intent = context.get("intent", "").lower()
        stage = context.get("conversation_stage", "").lower()
        tone_needed = context.get("tone_needed", "").lower()
        query_text = context.get("query", "").lower()

        relevant_topics = []

        # First contact / greetings
        if stage == "first_contact" or intent in ["greeting", "introduction"]:
            relevant_topics.append("indonesian_greetings")

        # Timeline / delay questions
        if any(keyword in query_text for keyword in ["how long", "timeline", "when", "delay", "slow"]):
            relevant_topics.append("bureaucracy_patience")
            relevant_topics.append("flexibility_expectations")

        # Frustration / difficulty
        if intent in ["frustration", "complaint"] or tone_needed == "empathetic":
            relevant_topics.append("bureaucracy_patience")
            relevant_topics.append("face_saving_culture")

        # Official meetings / communication
        if any(keyword in query_text for keyword in ["meeting", "office", "official", "embassy"]):
            relevant_topics.append("meeting_etiquette")
            relevant_topics.append("hierarchy_respect")

        # Cultural curiosity
        if any(keyword in query_text for keyword in ["culture", "bali", "indonesian way", "custom"]):
            relevant_topics.append("tri_hita_karana")
            relevant_topics.append("indonesian_greetings")

        # Rejection / difficulty
        if any(keyword in query_text for keyword in ["rejected", "denied", "difficult", "impossible"]):
            relevant_topics.append("face_saving_culture")
            relevant_topics.append("relationship_capital")

        # Ramadan period (if current date in Ramadan)
        # TODO: Add date-based logic for Ramadan
        # if self._is_ramadan_period():
        #     relevant_topics.append("ramadan_business")

        # Why BALI ZERO / value proposition
        if any(keyword in query_text for keyword in ["why need", "why bali zero", "diy", "myself"]):
            relevant_topics.append("relationship_capital")
            relevant_topics.append("language_barrier_navigation")

        # Translation / language questions
        if any(keyword in query_text for keyword in ["translate", "bahasa", "language", "document"]):
            relevant_topics.append("language_barrier_navigation")

        # Default: friendly greeting for casual chats
        if not relevant_topics and intent in ["casual_chat", "general_question"]:
            relevant_topics.append("indonesian_greetings")

        return relevant_topics[:3]  # Max 3 topics

    async def _increment_usage(self, topic: str):
        """
        Increment usage_count and update last_used_at for cultural chunk

        Args:
            topic: Cultural topic name
        """
        if not self.pool:
            return

        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    UPDATE cultural_knowledge
                    SET
                        usage_count = usage_count + 1,
                        last_used_at = NOW()
                    WHERE topic = $1
                """, topic)

        except Exception as e:
            logger.warning(f"⚠️ Failed to increment usage for {topic}: {e}")

    def build_cultural_prompt_injection(self, chunks: List[Dict]) -> str:
        """
        Build prompt injection text from cultural chunks

        Args:
            chunks: List of cultural knowledge chunks

        Returns:
            Formatted text to inject into Haiku system prompt
        """
        if not chunks:
            return ""

        injection_parts = [
            "**Cultural Context (use naturally in your response when relevant):**",
            ""
        ]

        for chunk in chunks:
            injection_parts.append(f"**{chunk['topic'].replace('_', ' ').title()}**")
            injection_parts.append(chunk['content'])
            injection_parts.append("")

        injection_parts.append("**Note**: Use this cultural knowledge naturally - don't repeat it verbatim. Weave insights into your response where contextually appropriate.")

        return "\n".join(injection_parts)

    async def get_cultural_stats(self) -> Dict:
        """
        Get statistics about cultural knowledge usage

        Returns:
            Dict with statistics
        """
        if not self.pool:
            await self.connect()

        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT
                    COUNT(*) as total_chunks,
                    SUM(usage_count) as total_uses,
                    AVG(quality_score) as avg_quality
                FROM cultural_knowledge
            """)

            top_used = await conn.fetch("""
                SELECT
                    topic,
                    usage_count,
                    DATE(last_used_at) as last_used
                FROM cultural_knowledge
                ORDER BY usage_count DESC
                LIMIT 10
            """)

        return {
            "total_chunks": stats["total_chunks"],
            "total_uses": stats["total_uses"] or 0,
            "avg_quality": float(stats["avg_quality"] or 0),
            "top_used": [
                {
                    "topic": row["topic"],
                    "usage_count": row["usage_count"],
                    "last_used": row["last_used"].isoformat() if row["last_used"] else None
                }
                for row in top_used
            ]
        }


# Convenience function for testing
async def test_service():
    """Test cultural RAG service"""
    import os

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not set")
        return

    service = CulturalRAGService(database_url)

    try:
        await service.connect()

        print("\n🎭 TESTING CULTURAL RAG SERVICE")
        print("=" * 60)

        # Test context 1: First contact
        print("\n1. First Contact Context")
        print("-" * 60)
        context1 = {
            "intent": "greeting",
            "conversation_stage": "first_contact",
            "query": "Hello, I need help with KITAS"
        }

        chunks1 = await service.get_cultural_context(context1)
        if chunks1:
            print(f"Retrieved {len(chunks1)} chunks:")
            for chunk in chunks1:
                print(f"  - {chunk['topic']}")

            prompt_injection = service.build_cultural_prompt_injection(chunks1)
            print(f"\nPrompt Injection ({len(prompt_injection)} chars):")
            print(prompt_injection[:300] + "...")
        else:
            print("No cultural context retrieved")

        # Test context 2: Timeline frustration
        print("\n2. Timeline Frustration Context")
        print("-" * 60)
        context2 = {
            "intent": "frustration",
            "tone_needed": "empathetic",
            "query": "Why is this taking so long? It's been 3 weeks!"
        }

        chunks2 = await service.get_cultural_context(context2)
        if chunks2:
            print(f"Retrieved {len(chunks2)} chunks:")
            for chunk in chunks2:
                print(f"  - {chunk['topic']}")

        # Get stats
        print("\n📊 CULTURAL KNOWLEDGE STATISTICS")
        print("=" * 60)
        stats = await service.get_cultural_stats()
        print(f"Total chunks: {stats['total_chunks']}")
        print(f"Total uses: {stats['total_uses']}")
        print(f"Average quality: {stats['avg_quality']:.2f}")
        print(f"\nTop used:")
        for item in stats['top_used'][:5]:
            print(f"  - {item['topic']}: {item['usage_count']} uses")

    finally:
        await service.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_service())
