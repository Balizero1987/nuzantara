"""
ZANTARA Conversation Service - Conversation History Persistence

Manages conversation storage and retrieval with Firestore.
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConversationService:
    """
    Service for managing conversation history.

    Features:
    - Save conversations to Firestore
    - Retrieve recent conversations
    - Metadata tracking (collaborator, timestamp, token usage)
    """

    def __init__(self, use_firestore: bool = True):
        """
        Initialize ConversationService.

        Args:
            use_firestore: Enable Firestore persistence
        """
        self.use_firestore = use_firestore
        self.conversations_cache: List[Dict] = []  # In-memory fallback

        if use_firestore:
            try:
                from google.cloud import firestore
                self.db = firestore.Client()
                logger.info("✅ Firestore enabled for conversation persistence")
            except Exception as e:
                logger.warning(f"⚠️ Firestore not available, using in-memory only: {e}")
                self.use_firestore = False

        logger.info("✅ ConversationService initialized")

    async def save_conversation(
        self,
        user_id: str,
        messages: List[Dict],
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Save conversation to Firestore.

        Args:
            user_id: User/collaborator ID
            messages: List of message dicts (role, content)
            metadata: Optional metadata (collaborator_name, model_used, tokens, etc.)

        Returns:
            True if saved successfully
        """
        conversation_data = {
            "user_id": user_id,
            "messages": messages,
            "metadata": metadata or {},
            "timestamp": datetime.now(),
            "message_count": len(messages)
        }

        # Save to cache
        self.conversations_cache.append(conversation_data)

        # Save to Firestore
        if self.use_firestore:
            try:
                self.db.collection('conversations').add(conversation_data)
                logger.info(f"✅ Conversation saved for {user_id} ({len(messages)} messages)")
                return True
            except Exception as e:
                logger.error(f"❌ Firestore save failed for {user_id}: {e}")
                return False

        logger.debug(f"💾 Conversation saved to cache only for {user_id}")
        return True

    async def get_recent_conversations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """
        Retrieve recent conversations for a user.

        Args:
            user_id: User/collaborator ID
            limit: Max number of conversations to retrieve

        Returns:
            List of conversation dicts
        """
        if self.use_firestore:
            try:
                query = (
                    self.db.collection('conversations')
                    .where('user_id', '==', user_id)
                    .order_by('timestamp', direction='DESCENDING')
                    .limit(limit)
                )
                docs = query.stream()
                conversations = [doc.to_dict() for doc in docs]
                logger.info(f"✅ Retrieved {len(conversations)} conversations for {user_id}")
                return conversations
            except Exception as e:
                logger.error(f"❌ Firestore query failed for {user_id}: {e}")

        # Fallback to cache
        user_convos = [c for c in self.conversations_cache if c.get("user_id") == user_id]
        user_convos.sort(key=lambda x: x.get("timestamp", datetime.now()), reverse=True)
        return user_convos[:limit]

    async def get_stats(self) -> Dict:
        """Get conversation statistics"""
        if self.use_firestore:
            try:
                # Count total conversations
                docs = self.db.collection('conversations').stream()
                total = sum(1 for _ in docs)
                return {
                    "total_conversations": total,
                    "firestore_enabled": True,
                    "cached_conversations": len(self.conversations_cache)
                }
            except Exception as e:
                logger.error(f"❌ Stats query failed: {e}")

        return {
            "total_conversations": len(self.conversations_cache),
            "firestore_enabled": False,
            "cached_conversations": len(self.conversations_cache)
        }
