"""
Cultural Knowledge Generator - Create cultural context chunks for Haiku

Generates 10-15 dynamic knowledge chunks about Indonesian business culture
that Haiku can inject into conversations when contextually relevant.

Examples:
- Indonesian greetings and relationship-building
- Bureaucracy navigation and patience
- Face-saving communication patterns
- Bali's Tri Hita Karana philosophy
- Meeting etiquette and hierarchy respect

These are NOT fixed responses - they're contextual knowledge that Haiku
uses to generate natural, culturally-aware responses.
"""

import asyncpg
import logging
from typing import List, Dict, Optional
from datetime import datetime
import json
import httpx

logger = logging.getLogger(__name__)


class CulturalKnowledgeGenerator:
    """
    Generates cultural knowledge chunks using LLAMA 3.1
    """

    def __init__(
        self,
        database_url: str,
        runpod_endpoint: Optional[str] = None,
        runpod_api_key: Optional[str] = None,
        search_service=None  # NEW: SearchService for ChromaDB integration
    ):
        """
        Initialize generator

        Args:
            database_url: PostgreSQL connection string
            runpod_endpoint: RunPod LLAMA endpoint
            runpod_api_key: RunPod API key
            search_service: SearchService instance for ChromaDB integration (optional)
        """
        self.database_url = database_url
        self.runpod_endpoint = runpod_endpoint
        self.runpod_api_key = runpod_api_key
        self.search_service = search_service
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
            logger.info("✅ CulturalKnowledgeGenerator connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise

    async def close(self):
        """Close PostgreSQL connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")

    async def generate_cultural_chunk(
        self,
        topic: str,
        when_to_use: List[str],
        tone: str
    ) -> Optional[Dict]:
        """
        Generate single cultural knowledge chunk

        Args:
            topic: Topic identifier (e.g., 'indonesian_greetings')
            when_to_use: List of usage contexts (e.g., ['first_contact', 'greeting'])
            tone: Desired tone (e.g., 'friendly_welcoming')

        Returns:
            Dict with topic, content, metadata
        """
        logger.info(f"🔄 Generating cultural chunk: {topic}")

        try:
            result = await self._generate_with_llama(topic, when_to_use, tone)

            if not result:
                logger.error(f"❌ Generation failed for: {topic}")
                return None

            content = result.get("content", "")
            tokens_used = result.get("tokens_used", 0)

            # Save to PostgreSQL cultural_knowledge table
            await self._save_cultural_chunk(
                topic=topic,
                content=content,
                when_to_use=when_to_use,
                tone=tone
            )

            # Save to ChromaDB for fast retrieval (if SearchService available)
            if self.search_service:
                await self._save_to_chromadb(
                    topic=topic,
                    content=content,
                    when_to_use=when_to_use,
                    tone=tone
                )

            logger.info(f"✅ Cultural chunk generated: {topic}")

            return {
                "topic": topic,
                "content": content,
                "when_to_use": when_to_use,
                "tone": tone,
                "tokens_used": tokens_used
            }

        except Exception as e:
            logger.error(f"❌ Failed to generate cultural chunk: {e}")
            return None

    async def _generate_with_llama(
        self,
        topic: str,
        when_to_use: List[str],
        tone: str
    ) -> Optional[str]:
        """
        Generate cultural content with LLAMA 3.1

        Args:
            topic: Topic to generate
            when_to_use: Usage contexts
            tone: Desired tone

        Returns:
            Generated content string
        """
        if not self.runpod_endpoint or not self.runpod_api_key:
            logger.warning("⚠️ LLAMA not configured")
            return None

        # Topic-specific prompts
        prompts = {
            "indonesian_greetings": """Write a concise cultural knowledge chunk (100-150 words) about Indonesian greetings and relationship-building in business contexts.

Focus on:
- Importance of "Selamat pagi/siang/sore" greetings
- Building personal connection before business (small talk)
- Asking "Apa kabar?" shows genuine interest
- Patience in relationship-building

Tone: Friendly, welcoming, practical
Audience: Foreign business clients working with Indonesian bureaucracy
Purpose: Help Haiku AI explain why BALI ZERO takes time to build relationships with officials

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "bureaucracy_patience": """Write a concise cultural knowledge chunk (100-150 words) about navigating Indonesian bureaucracy with patience and cultural sensitivity.

Focus on:
- Indonesian bureaucracy operates at its own pace
- Rushing officials is counterproductive and disrespectful
- "Jam karet" (rubber time) is normal
- BALI ZERO knows when to push gently vs wait patiently
- This isn't inefficiency - it's thoroughness and relationship-based

Tone: Empathetic, reassuring, educational
Audience: Frustrated foreign clients asking "Why so slow?"
Purpose: Help Haiku explain delays compassionately

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "face_saving_culture": """Write a concise cultural knowledge chunk (100-150 words) about Indonesian face-saving communication and indirect negotiation.

Focus on:
- Indonesians avoid direct confrontation to preserve "muka" (face)
- "Sulit" (difficult) ≠ impossible, means negotiation needed
- Indirect communication is respectful, not evasive
- BALI ZERO navigates subtle communications on client's behalf
- Understanding this prevents misunderstandings

Tone: Diplomatic, wise, culturally-informed
Audience: Clients confused by indirect responses from officials
Purpose: Help Haiku decode Indonesian communication patterns

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "tri_hita_karana": """Write a concise cultural knowledge chunk (100-150 words) about Bali's "Tri Hita Karana" philosophy and its business impact.

Focus on:
- Tri Hita Karana = harmony with God, people, nature
- Not just spirituality - affects decisions, timelines, relationships
- Ceremony schedules can impact business timelines
- Understanding this helps work WITH Bali, not against it
- BALI ZERO respects these cultural rhythms

Tone: Educational, warm, appreciative
Audience: Clients curious about Balinese culture or frustrated by ceremony delays
Purpose: Help Haiku explain cultural context when relevant

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "hierarchy_respect": """Write a concise cultural knowledge chunk (100-150 words) about Indonesian hierarchy and respectful communication.

Focus on:
- Indonesia has strong hierarchical culture
- Address senior officials with respect (Bapak/Ibu + title)
- Junior staff cannot make decisions alone
- Patience needed for approvals to go up chain
- BALI ZERO understands who to approach at what level

Tone: Respectful, practical, insider-knowledge
Audience: Foreign clients wanting to approach officials directly
Purpose: Help Haiku guide proper escalation paths

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "meeting_etiquette": """Write a concise cultural knowledge chunk (100-150 words) about Indonesian business meeting etiquette.

Focus on:
- Arrive on time even if others may be late
- Handshakes common but wait for women to initiate
- Business cards exchanged with both hands
- Small talk before business discussion (essential)
- Tea/coffee offered = hospitality, not just beverage

Tone: Practical, friendly, confidence-building
Audience: First-time visitors to Indonesian offices
Purpose: Help Haiku prepare clients for meetings

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "ramadan_business": """Write a concise cultural knowledge chunk (100-150 words) about doing business during Ramadan in Indonesia.

Focus on:
- Government offices have reduced hours (7am-2pm typical)
- Meetings best scheduled morning (officials fasting)
- Slower processing times expected
- Avoid lunch meetings or food/drink in front of fasting colleagues
- Extra patience and flexibility needed

Tone: Respectful, practical, empathetic
Audience: Clients with deadlines during Ramadan
Purpose: Help Haiku explain timeline adjustments

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "relationship_capital": """Write a concise cultural knowledge chunk (100-150 words) about "relationship capital" in Indonesian business.

Focus on:
- Personal relationships = business currency
- Officials more helpful to known/trusted contacts
- BALI ZERO's value = years of relationship-building
- Can't be rushed or bought, only cultivated
- This is why local partners essential

Tone: Insider-wisdom, value-focused, strategic
Audience: Clients questioning why they need BALI ZERO
Purpose: Help Haiku explain BALI ZERO's relationship assets

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "flexibility_expectations": """Write a concise cultural knowledge chunk (100-150 words) about managing expectations with Indonesian flexibility.

Focus on:
- Timelines are estimates, not guarantees
- Regulation changes can happen mid-process
- "Soon" is relative (could be days or weeks)
- Flexibility is survival skill, not lack of planning
- BALI ZERO provides realistic timelines, not optimistic ones

Tone: Honest, managing-expectations, trust-building
Audience: Type-A foreign clients wanting exact dates
Purpose: Help Haiku set realistic expectations

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):""",

            "language_barrier_navigation": """Write a concise cultural knowledge chunk (100-150 words) about navigating language barriers in Indonesian bureaucracy.

Focus on:
- Official documents in Bahasa Indonesia (legally required)
- Translators needed for accuracy, not just Google Translate
- Subtle meanings lost in translation
- BALI ZERO provides certified translations + cultural interpretation
- Misunderstandings can delay applications months

Tone: Practical, expert-guidance, problem-solving
Audience: DIY clients considering handling alone
Purpose: Help Haiku explain translation service value

Write ONLY the knowledge chunk (no introduction, no "Here's the content"):"""
        }

        prompt = prompts.get(topic, f"Write a 100-150 word cultural knowledge chunk about {topic} in Indonesian business context.")

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:  # Increased to 300s (5min) for pod initialization
                response = await client.post(
                    self.runpod_endpoint,  # Fixed: removed duplicate /runsync
                    headers={
                        "Authorization": f"Bearer {self.runpod_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "input": {
                            "prompt": prompt,
                            "max_tokens": 300,
                            "temperature": 0.4,
                            "top_p": 0.9
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()

                # Handle RunPod response format
                # If IN_QUEUE with /runsync, worker is cold starting - wait and retry
                if data.get("status") == "IN_QUEUE":
                    logger.warning(f"⚠️ Worker cold start detected (IN_QUEUE), waiting 90s for initialization...")
                    import asyncio
                    await asyncio.sleep(90)  # Wait for worker to initialize

                    # Retry request after cold start
                    response = await client.post(
                        self.runpod_endpoint,
                        headers={
                            "Authorization": f"Bearer {self.runpod_api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "input": {
                                "prompt": prompt,
                                "max_tokens": 300,
                                "temperature": 0.4,
                                "top_p": 0.9
                            }
                        }
                    )
                    response.raise_for_status()
                    data = response.json()

                    # If still IN_QUEUE after retry, fail
                    if data.get("status") == "IN_QUEUE":
                        logger.error(f"❌ Worker still IN_QUEUE after 90s wait - endpoint may be paused")
                        return None

                # Extract content from completed job
                # RunPod vLLM format: {"output": {"text": "..."}}
                # or {"output": {"choices": [{"text": "..."}]}}
                output = data.get("output", {})

                # Try multiple response formats
                content = None
                if isinstance(output, dict):
                    # Format 1: {"output": {"text": "..."}}
                    content = output.get("text", "")

                    # Format 2: {"output": {"choices": [{"text": "..."}]}}
                    if not content and "choices" in output:
                        choices = output.get("choices", [])
                        if choices and len(choices) > 0:
                            content = choices[0].get("text", "")

                    # Format 3: {"output": "direct string"}
                elif isinstance(output, str):
                    content = output

                if not content:
                    logger.error(f"❌ LLAMA returned empty response. Data: {data}")
                    return None

                # Extract token usage from RunPod response
                usage = data.get("usage", {})
                tokens_used = usage.get("total_tokens", 0) or (
                    usage.get("prompt_tokens", 0) + usage.get("completion_tokens", 0)
                )

                logger.info(f"✅ LLAMA generated cultural chunk ({len(content)} chars, {tokens_used} tokens)")

                return {
                    "content": content.strip(),
                    "tokens_used": tokens_used
                }

        except httpx.TimeoutException:
            logger.error("❌ LLAMA timeout (>300s)")
            return None
        except Exception as e:
            logger.error(f"❌ LLAMA generation failed: {e}")
            return None

    async def _save_cultural_chunk(
        self,
        topic: str,
        content: str,
        when_to_use: List[str],
        tone: str
    ):
        """
        Save cultural chunk to PostgreSQL

        Args:
            topic: Topic identifier
            content: Generated content
            when_to_use: Usage contexts
            tone: Tone identifier
        """
        if not self.pool:
            await self.connect()

        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO cultural_knowledge (
                        topic,
                        content,
                        when_to_use,
                        tone,
                        generated_by,
                        quality_score,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        content = EXCLUDED.content,
                        when_to_use = EXCLUDED.when_to_use,
                        tone = EXCLUDED.tone,
                        updated_at = NOW()
                """,
                    topic,
                    content,
                    when_to_use,
                    tone,
                    "llama-3.1-zantara",
                    0.85  # Default quality score
                )

            logger.info(f"✅ Saved cultural chunk: {topic}")

        except Exception as e:
            logger.error(f"❌ Failed to save cultural chunk: {e}")
            raise

    async def _save_to_chromadb(
        self,
        topic: str,
        content: str,
        when_to_use: List[str],
        tone: str
    ):
        """
        Save cultural chunk to ChromaDB for fast retrieval

        Args:
            topic: Topic identifier
            content: Generated content
            when_to_use: Usage contexts
            tone: Tone identifier
        """
        if not self.search_service:
            logger.warning("⚠️ SearchService not available, skipping ChromaDB save")
            return

        try:
            metadata = {
                "type": "cultural_insight",
                "source": "llama_zantara",
                "topic": topic,
                "when_to_use": when_to_use,
                "tone": tone,
                "language": "multi"  # Cultural insights work across IT/EN/ID
            }

            success = await self.search_service.add_cultural_insight(
                text=content,
                metadata=metadata
            )

            if success:
                logger.info(f"✅ Saved to ChromaDB: {topic}")
            else:
                logger.warning(f"⚠️ ChromaDB save failed for: {topic}")

        except Exception as e:
            logger.error(f"❌ Failed to save to ChromaDB: {e}")
            # Don't raise - ChromaDB save is optional, PostgreSQL is primary

    async def batch_generate_cultural_chunks(self) -> Dict:
        """
        Generate all cultural knowledge chunks

        Returns:
            Dict with statistics
        """
        # Define all cultural topics to generate
        topics = [
            {
                "topic": "indonesian_greetings",
                "when_to_use": ["first_contact", "casual_chat", "greeting"],
                "tone": "friendly_welcoming"
            },
            {
                "topic": "bureaucracy_patience",
                "when_to_use": ["timeline_questions", "frustration_handling", "delay_response"],
                "tone": "empathetic_reassuring"
            },
            {
                "topic": "face_saving_culture",
                "when_to_use": ["rejection_handling", "difficult_cases", "negotiation"],
                "tone": "diplomatic_wise"
            },
            {
                "topic": "tri_hita_karana",
                "when_to_use": ["cultural_question", "philosophy_interest", "bali_lifestyle"],
                "tone": "educational_warm"
            },
            {
                "topic": "hierarchy_respect",
                "when_to_use": ["escalation_advice", "official_communication", "status_questions"],
                "tone": "respectful_practical"
            },
            {
                "topic": "meeting_etiquette",
                "when_to_use": ["meeting_preparation", "first_visit", "cultural_guidance"],
                "tone": "practical_friendly"
            },
            {
                "topic": "ramadan_business",
                "when_to_use": ["ramadan_period", "timeline_adjustment", "holiday_questions"],
                "tone": "respectful_empathetic"
            },
            {
                "topic": "relationship_capital",
                "when_to_use": ["value_proposition", "why_local_partner", "trust_building"],
                "tone": "insider_wisdom"
            },
            {
                "topic": "flexibility_expectations",
                "when_to_use": ["timeline_management", "expectation_setting", "uncertainty_handling"],
                "tone": "honest_realistic"
            },
            {
                "topic": "language_barrier_navigation",
                "when_to_use": ["translation_questions", "diy_concerns", "service_value"],
                "tone": "practical_expert"
            }
        ]

        logger.info(f"🚀 Batch generating {len(topics)} cultural chunks")

        stats = {
            "total_topics": len(topics),
            "successful": 0,
            "failed": 0,
            "tokens_used": 0
        }

        for i, topic_spec in enumerate(topics, 1):
            logger.info(f"[{i}/{len(topics)}] Processing: {topic_spec['topic']}")

            try:
                result = await self.generate_cultural_chunk(
                    topic=topic_spec["topic"],
                    when_to_use=topic_spec["when_to_use"],
                    tone=topic_spec["tone"]
                )

                if result:
                    stats["successful"] += 1
                    stats["tokens_used"] += result.get("tokens_used", 0)
                else:
                    stats["failed"] += 1

            except Exception as e:
                logger.error(f"❌ Topic {topic_spec['topic']} failed: {e}")
                stats["failed"] += 1

            # Rate limiting
            import asyncio
            await asyncio.sleep(5)

        logger.info(f"✅ Batch generation complete:")
        logger.info(f"   Successful: {stats['successful']}")
        logger.info(f"   Failed: {stats['failed']}")
        logger.info(f"   Tokens used: {stats['tokens_used']}")

        return stats


# Convenience function for testing
async def test_generator():
    """Test cultural knowledge generator"""
    import os

    database_url = os.getenv("DATABASE_URL")
    runpod_endpoint = os.getenv("RUNPOD_LLAMA_ENDPOINT")
    runpod_api_key = os.getenv("RUNPOD_API_KEY")

    if not database_url:
        print("❌ DATABASE_URL not set")
        return

    generator = CulturalKnowledgeGenerator(
        database_url=database_url,
        runpod_endpoint=runpod_endpoint,
        runpod_api_key=runpod_api_key
    )

    try:
        await generator.connect()

        print("\n🚀 TESTING CULTURAL CHUNK GENERATION")
        print("=" * 60)

        # Test single chunk
        result = await generator.generate_cultural_chunk(
            topic="indonesian_greetings",
            when_to_use=["first_contact", "greeting"],
            tone="friendly_welcoming"
        )

        if result:
            print(f"\n✅ SUCCESS!")
            print(f"Topic: {result['topic']}")
            print(f"Tone: {result['tone']}")
            print(f"When to use: {', '.join(result['when_to_use'])}")
            print(f"\nContent:")
            print(result['content'])
        else:
            print("\n❌ Generation failed")

    finally:
        await generator.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_generator())
