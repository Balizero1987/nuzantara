"""
ZANTARA Memory Service - Persistent User Memory with Firestore

Manages user memory (profile facts, conversation summary, counters) with Firestore persistence.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

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
        """Convert to dictionary for Firestore"""
        return {
            "user_id": self.user_id,
            "profile_facts": self.profile_facts,
            "summary": self.summary,
            "counters": self.counters,
            "updated_at": self.updated_at
        }


class MemoryService:
    """
    Service for managing persistent user memory.

    Features:
    - Profile facts (max 10, auto-deduplicated)
    - Conversation summary (max 500 chars)
    - Activity counters
    - Firestore persistence with in-memory fallback
    """

    MAX_FACTS = 10
    MAX_SUMMARY_LENGTH = 500

    def __init__(self, use_firestore: bool = True):
        """
        Initialize MemoryService.

        Args:
            use_firestore: Enable Firestore persistence
        """
        self.use_firestore = use_firestore
        self.memory_cache: Dict[str, UserMemory] = {}  # In-memory fallback

        if use_firestore:
            try:
                from google.cloud import firestore
                self.db = firestore.Client()
                logger.info("✅ Firestore enabled for memory persistence")
            except Exception as e:
                logger.warning(f"⚠️ Firestore not available, using in-memory only: {e}")
                self.use_firestore = False

        logger.info("✅ MemoryService initialized")

    async def get_memory(self, user_id: str) -> UserMemory:
        """
        Retrieve user memory.

        Lookup order:
        1. Cache (in-memory)
        2. Firestore (if enabled)
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

        # 2. Check Firestore
        if self.use_firestore:
            try:
                doc = self.db.collection('memories').document(user_id).get()
                if doc.exists:
                    data = doc.to_dict()
                    memory = UserMemory(
                        user_id=user_id,
                        profile_facts=data.get("profile_facts", []),
                        summary=data.get("summary", ""),
                        counters=data.get("counters", {}),
                        updated_at=data.get("updated_at", datetime.now())
                    )
                    self.memory_cache[user_id] = memory
                    logger.info(f"✅ Loaded memory from Firestore for {user_id}")
                    return memory
            except Exception as e:
                logger.error(f"❌ Firestore load failed for {user_id}: {e}")

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
        Save user memory to Firestore and cache.

        Args:
            memory: UserMemory object

        Returns:
            True if saved successfully
        """
        memory.updated_at = datetime.now()

        # Save to cache
        self.memory_cache[memory.user_id] = memory

        # Save to Firestore
        if self.use_firestore:
            try:
                self.db.collection('memories').document(memory.user_id).set(
                    memory.to_dict(),
                    merge=True
                )
                logger.info(f"✅ Memory saved to Firestore for {memory.user_id}")
                return True
            except Exception as e:
                logger.error(f"❌ Firestore save failed for {memory.user_id}: {e}")
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

        # Add new fact
        memory.profile_facts.append(fact)

        # Keep only last 10
        if len(memory.profile_facts) > self.MAX_FACTS:
            memory.profile_facts = memory.profile_facts[-self.MAX_FACTS:]
            logger.info(f"⚠️ Trimmed facts to {self.MAX_FACTS} for {user_id}")

        # Save
        success = await self.save_memory(memory)
        if success:
            logger.info(f"✅ Added fact for {user_id}: {fact}")
        return success

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

    async def get_stats(self) -> Dict:
        """Get memory system statistics"""
        return {
            "cached_users": len(self.memory_cache),
            "firestore_enabled": self.use_firestore,
            "max_facts": self.MAX_FACTS,
            "max_summary_length": self.MAX_SUMMARY_LENGTH
        }
