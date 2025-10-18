"""
ZANTARA Memory Service - PostgreSQL Backend (Railway)

Manages user memory (profile facts, conversation summary, counters) with PostgreSQL persistence.
Replaces Firestore with PostgreSQL for Railway deployment.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging
import os
import asyncpg
import json

logger = logging.getLogger(__name__)


@dataclass
class UserMemory:
    """User memory structure"""
    user_id: str
    profile_facts: List[str]  # Max 10 facts
    summary: str  # Max 500 characters
    counters: Dict[str, int]  # conversations, searches, tasks
    updated_at: datetime

    def to_dict(self) -> Dict:
        """Convert to dictionary for database"""
        return {
            "user_id": self.user_id,
            "profile_facts": self.profile_facts,
            "summary": self.summary,
            "counters": self.counters,
            "updated_at": self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }


class MemoryServicePostgres:
    """
    Service for managing persistent user memory with PostgreSQL.

    Features:
    - Profile facts (max 10, auto-deduplicated)
    - Conversation summary (max 500 chars)
    - Activity counters
    - PostgreSQL persistence with in-memory fallback
    """

    MAX_FACTS = 10
    MAX_SUMMARY_LENGTH = 500

    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize MemoryService with PostgreSQL.

        Args:
            database_url: PostgreSQL connection string (from Railway DATABASE_URL)
        """
        self.database_url = database_url or os.getenv("DATABASE_URL")
        self.pool: Optional[asyncpg.Pool] = None
        self.memory_cache: Dict[str, UserMemory] = {}  # In-memory fallback
        self.use_postgres = bool(self.database_url)

        logger.info("✅ MemoryServicePostgres initialized")

    async def connect(self):
        """Initialize PostgreSQL connection pool"""
        if not self.use_postgres:
            logger.warning("⚠️ No DATABASE_URL found, using in-memory only")
            return

        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("✅ PostgreSQL connection pool created")
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            self.use_postgres = False

    async def close(self):
        """Close PostgreSQL connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")

    async def get_memory(self, user_id: str) -> UserMemory:
        """
        Retrieve user memory.

        Lookup order:
        1. Cache (in-memory)
        2. PostgreSQL memory_facts table
        3. Create new empty memory

        Args:
            user_id: User/collaborator ID

        Returns:
            UserMemory with facts, summary, counters
        """
        # 1. Check cache
        if user_id in self.memory_cache:
            logger.debug(f"💾 Memory cache hit for {user_id}")
            return self.memory_cache[user_id]

        # 2. Check PostgreSQL
        if self.use_postgres and self.pool:
            try:
                async with self.pool.acquire() as conn:
                    # Get all memory facts for user
                    rows = await conn.fetch(
                        """
                        SELECT content, confidence, source, metadata, created_at
                        FROM memory_facts
                        WHERE user_id = $1
                        ORDER BY created_at DESC
                        LIMIT $2
                        """,
                        user_id,
                        self.MAX_FACTS
                    )

                    # Get user stats
                    stats_row = await conn.fetchrow(
                        """
                        SELECT conversations_count, searches_count, summary, updated_at
                        FROM user_stats
                        WHERE user_id = $1
                        """,
                        user_id
                    )

                    # Build UserMemory
                    profile_facts = [row['content'] for row in rows if row['content']]

                    counters = {
                        "conversations": stats_row['conversations_count'] if stats_row else 0,
                        "searches": stats_row['searches_count'] if stats_row else 0,
                        "tasks": 0  # Not tracked in user_stats yet
                    }

                    summary = stats_row['summary'] if stats_row else ""
                    updated_at = stats_row['updated_at'] if stats_row else datetime.now()

                    memory = UserMemory(
                        user_id=user_id,
                        profile_facts=profile_facts,
                        summary=summary,
                        counters=counters,
                        updated_at=updated_at
                    )

                    self.memory_cache[user_id] = memory
                    logger.info(f"✅ Loaded memory from PostgreSQL for {user_id}")
                    return memory

            except Exception as e:
                logger.error(f"❌ PostgreSQL load failed for {user_id}: {e}")

        # 3. Create new memory
        memory = UserMemory(
            user_id=user_id,
            profile_facts=[],
            summary="",
            counters={
                "conversations": 0,
                "searches": 0,
                "tasks": 0
            },
            updated_at=datetime.now()
        )
        self.memory_cache[user_id] = memory
        logger.info(f"📝 Created new memory for {user_id}")
        return memory

    async def save_memory(self, memory: UserMemory) -> bool:
        """
        Save user memory to PostgreSQL and cache.

        Args:
            memory: UserMemory object

        Returns:
            True if saved successfully
        """
        memory.updated_at = datetime.now()

        # Save to cache
        self.memory_cache[memory.user_id] = memory

        # Save to PostgreSQL
        if self.use_postgres and self.pool:
            try:
                async with self.pool.acquire() as conn:
                    # Upsert user_stats
                    await conn.execute(
                        """
                        INSERT INTO user_stats (user_id, conversations_count, searches_count, summary, updated_at, last_activity)
                        VALUES ($1, $2, $3, $4, $5, $5)
                        ON CONFLICT (user_id) DO UPDATE SET
                            conversations_count = EXCLUDED.conversations_count,
                            searches_count = EXCLUDED.searches_count,
                            summary = EXCLUDED.summary,
                            updated_at = EXCLUDED.updated_at,
                            last_activity = EXCLUDED.last_activity
                        """,
                        memory.user_id,
                        memory.counters.get('conversations', 0),
                        memory.counters.get('searches', 0),
                        memory.summary,
                        memory.updated_at
                    )

                    logger.info(f"✅ Memory saved to PostgreSQL for {memory.user_id}")
                    return True

            except Exception as e:
                logger.error(f"❌ PostgreSQL save failed for {memory.user_id}: {e}")
                return False

        logger.debug(f"💾 Memory saved to cache only for {memory.user_id}")
        return True

    async def add_fact(self, user_id: str, fact: str) -> bool:
        """
        Add a profile fact (auto-deduplicated, max 10).

        Args:
            user_id: User/collaborator ID
            fact: New fact to add

        Returns:
            True if added successfully
        """
        memory = await self.get_memory(user_id)

        # Deduplicate (case-insensitive)
        fact = fact.strip()
        if not fact:
            return False

        # Check if already exists
        existing_lower = [f.lower() for f in memory.profile_facts]
        if fact.lower() in existing_lower:
            logger.debug(f"Fact already exists for {user_id}: {fact}")
            return False

        # Save to PostgreSQL memory_facts table
        if self.use_postgres and self.pool:
            try:
                async with self.pool.acquire() as conn:
                    await conn.execute(
                        """
                        INSERT INTO memory_facts (user_id, content, fact_type, confidence, source, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        """,
                        user_id,
                        fact,
                        'profile_fact',
                        1.0,
                        'system',
                        datetime.now()
                    )

                    logger.info(f"✅ Added fact to PostgreSQL for {user_id}: {fact}")

            except Exception as e:
                logger.error(f"❌ Failed to add fact for {user_id}: {e}")
                return False

        # Add to memory and trim
        memory.profile_facts.append(fact)
        if len(memory.profile_facts) > self.MAX_FACTS:
            memory.profile_facts = memory.profile_facts[-self.MAX_FACTS:]
            logger.info(f"⚠️ Trimmed facts to {self.MAX_FACTS} for {user_id}")

        # Update cache
        self.memory_cache[user_id] = memory

        logger.info(f"✅ Added fact for {user_id}: {fact}")
        return True

    async def update_summary(self, user_id: str, summary: str) -> bool:
        """
        Update conversation summary (max 500 chars).

        Args:
            user_id: User/collaborator ID
            summary: New summary text

        Returns:
            True if updated successfully
        """
        memory = await self.get_memory(user_id)

        # Truncate if needed
        if len(summary) > self.MAX_SUMMARY_LENGTH:
            summary = summary[:self.MAX_SUMMARY_LENGTH - 3] + "..."
            logger.warning(f"⚠️ Summary truncated to {self.MAX_SUMMARY_LENGTH} chars for {user_id}")

        memory.summary = summary

        # Save
        success = await self.save_memory(memory)
        if success:
            logger.info(f"✅ Updated summary for {user_id}")
        return success

    async def increment_counter(self, user_id: str, counter_name: str) -> bool:
        """
        Increment activity counter.

        Args:
            user_id: User/collaborator ID
            counter_name: Counter name (conversations, searches, tasks)

        Returns:
            True if incremented successfully
        """
        memory = await self.get_memory(user_id)

        if counter_name not in memory.counters:
            memory.counters[counter_name] = 0

        memory.counters[counter_name] += 1

        # Save
        success = await self.save_memory(memory)
        if success:
            logger.debug(f"✅ Incremented {counter_name} for {user_id}: {memory.counters[counter_name]}")
        return success

    async def save_fact(self, user_id: str, content: str, fact_type: str = 'general') -> bool:
        """
        Save a fact to memory_facts table (alias for add_fact).

        Args:
            user_id: User ID
            content: Fact content
            fact_type: Type of fact

        Returns:
            True if saved successfully
        """
        return await self.add_fact(user_id, content)

    async def get_stats(self) -> Dict:
        """Get memory system statistics"""
        postgres_stats = {}

        if self.use_postgres and self.pool:
            try:
                async with self.pool.acquire() as conn:
                    # Count total users, facts, conversations
                    stats = await conn.fetchrow(
                        """
                        SELECT
                            (SELECT COUNT(*) FROM users) as total_users,
                            (SELECT COUNT(*) FROM memory_facts) as total_facts,
                            (SELECT COUNT(*) FROM conversations) as total_conversations,
                            (SELECT SUM(conversations_count) FROM user_stats) as total_conv_count
                        """
                    )

                    postgres_stats = {
                        "total_users": stats['total_users'],
                        "total_facts": stats['total_facts'],
                        "total_conversations": stats['total_conversations'],
                        "total_conv_count": stats['total_conv_count'] or 0
                    }

            except Exception as e:
                logger.error(f"Error getting PostgreSQL stats: {e}")

        return {
            "cached_users": len(self.memory_cache),
            "postgres_enabled": self.use_postgres,
            "max_facts": self.MAX_FACTS,
            "max_summary_length": self.MAX_SUMMARY_LENGTH,
            **postgres_stats
        }