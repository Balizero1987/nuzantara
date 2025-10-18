"""
Context Window Manager - Intelligent conversation history management
Prevents context overflow by keeping only recent messages with automatic summarization
"""

import logging
from typing import List, Dict, Optional, Any
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)


class ContextWindowManager:
    """
    Manages conversation history to prevent context overflow

    Strategy:
    - Keep last 10-15 messages in full detail
    - Summarize older messages into context summary
    - Total context stays within safe limits
    """

    def __init__(self, max_messages: int = 15, summary_threshold: int = 20, anthropic_api_key: str = None):
        """
        Initialize context window manager

        Args:
            max_messages: Maximum number of recent messages to keep in full
            summary_threshold: Number of messages that triggers summarization
            anthropic_api_key: Anthropic API key for summary generation (optional)
        """
        self.max_messages = max_messages
        self.summary_threshold = summary_threshold
        self.claude_client = AsyncAnthropic(api_key=anthropic_api_key) if anthropic_api_key else None
        logger.info(f"✅ ContextWindowManager initialized (max: {max_messages}, threshold: {summary_threshold})")


    def trim_conversation_history(
        self,
        conversation_history: List[Dict],
        current_summary: Optional[str] = None
    ) -> Dict:
        """
        Trim conversation history to prevent context overflow

        Args:
            conversation_history: Full conversation history
            current_summary: Existing summary of older messages (if any)

        Returns:
            {
                "trimmed_messages": List[Dict],  # Recent messages to include
                "needs_summarization": bool,      # Whether old messages should be summarized
                "messages_to_summarize": List[Dict],  # Messages that should be summarized
                "context_summary": str            # Current summary (if exists)
            }
        """
        if not conversation_history:
            return {
                "trimmed_messages": [],
                "needs_summarization": False,
                "messages_to_summarize": [],
                "context_summary": current_summary or ""
            }

        total_messages = len(conversation_history)

        # CASE 1: Short conversation - keep everything
        if total_messages <= self.max_messages:
            logger.info(f"📊 [Context] Conversation short ({total_messages} msgs) - keeping all")
            return {
                "trimmed_messages": conversation_history,
                "needs_summarization": False,
                "messages_to_summarize": [],
                "context_summary": current_summary or ""
            }

        # CASE 2: Medium conversation - approaching limit
        elif total_messages <= self.summary_threshold:
            logger.info(f"📊 [Context] Conversation medium ({total_messages} msgs) - approaching limit")
            # Keep recent messages, but warn
            recent_messages = conversation_history[-self.max_messages:]
            return {
                "trimmed_messages": recent_messages,
                "needs_summarization": False,
                "messages_to_summarize": [],
                "context_summary": current_summary or ""
            }

        # CASE 3: Long conversation - needs summarization
        else:
            logger.info(f"📊 [Context] Conversation long ({total_messages} msgs) - triggering summarization")

            # Keep last max_messages in full
            recent_messages = conversation_history[-self.max_messages:]

            # Older messages need summarization
            older_messages = conversation_history[:-self.max_messages]

            return {
                "trimmed_messages": recent_messages,
                "needs_summarization": True,
                "messages_to_summarize": older_messages,
                "context_summary": current_summary or ""
            }


    def build_summarization_prompt(self, messages: List[Dict]) -> str:
        """
        Build prompt for summarizing older messages

        Args:
            messages: Messages to summarize

        Returns:
            Prompt for AI to generate summary
        """
        # Format messages for summarization
        formatted_messages = []
        for msg in messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            formatted_messages.append(f"{role.upper()}: {content[:200]}...")  # Truncate long messages

        conversation_text = "\n\n".join(formatted_messages)

        prompt = f"""Summarize the following conversation history concisely (2-3 sentences):

{conversation_text}

Focus on:
- Main topics discussed
- Key decisions or conclusions
- Important context for future messages

Summary:"""

        return prompt


    def get_context_status(self, conversation_history: List[Dict]) -> Dict:
        """
        Get current context window status

        Args:
            conversation_history: Current conversation history

        Returns:
            Status information about context window
        """
        total_messages = len(conversation_history)

        # Calculate usage percentage
        usage_percentage = (total_messages / self.summary_threshold) * 100

        # Determine status
        if total_messages <= self.max_messages:
            status = "healthy"
            color = "green"
        elif total_messages <= self.summary_threshold:
            status = "approaching_limit"
            color = "yellow"
        else:
            status = "needs_summarization"
            color = "red"

        return {
            "total_messages": total_messages,
            "max_messages": self.max_messages,
            "summary_threshold": self.summary_threshold,
            "usage_percentage": round(usage_percentage, 1),
            "status": status,
            "color": color,
            "messages_until_summarization": max(0, self.summary_threshold - total_messages)
        }


    def inject_summary_into_history(
        self,
        recent_messages: List[Dict],
        summary: str
    ) -> List[Dict]:
        """
        Inject summary of older messages at the beginning of conversation

        Args:
            recent_messages: Recent messages to keep
            summary: Summary of older messages

        Returns:
            Messages with summary injected
        """
        if not summary:
            return recent_messages

        # Create summary message
        summary_message = {
            "role": "system",
            "content": f"[Earlier conversation summary]: {summary}"
        }

        # Inject at beginning
        return [summary_message] + recent_messages


    async def generate_summary(
        self,
        messages: List[Dict],
        existing_summary: Optional[str] = None
    ) -> str:
        """
        Generate conversation summary using Claude Haiku (fast & cheap)

        Args:
            messages: Messages to summarize
            existing_summary: Previous summary to build upon (optional)

        Returns:
            Summary text (2-3 sentences)
        """
        if not self.claude_client:
            logger.warning("⚠️ [Summary] Claude client not available, cannot generate summary")
            return existing_summary or "Earlier conversation covered various topics."

        # Build summarization prompt
        prompt = self.build_summarization_prompt(messages)

        # If there's an existing summary, mention it for continuity
        if existing_summary:
            prompt = f"""Previous summary: {existing_summary}

{prompt}

Update the summary to include both the previous context and new messages."""

        # Call Claude Haiku for fast summarization
        try:
            logger.info(f"📝 [Summary] Generating summary for {len(messages)} messages...")

            response = await self.claude_client.messages.create(
                model="claude-haiku-3-5-20241022",  # Fast & cheap
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )

            summary = response.content[0].text.strip()
            logger.info(f"✅ [Summary] Generated ({len(summary)} chars)")
            return summary

        except Exception as e:
            logger.error(f"❌ [Summary] Generation failed: {e}")
            return existing_summary or "Earlier conversation covered various topics."


    def format_summary_for_display(
        self,
        summary: str,
        stats: Dict[str, int]
    ) -> Dict[str, Any]:
        """
        Format summary for frontend display

        Args:
            summary: Summary text
            stats: Conversation statistics (total_messages, messages_in_context, etc.)

        Returns:
            Formatted summary object:
            {
                "summary": str,
                "stats": {...},
                "timestamp": str
            }
        """
        from datetime import datetime

        return {
            "summary": summary,
            "stats": {
                "total_messages": stats.get("total_messages", 0),
                "messages_in_context": stats.get("messages_in_context", 0),
                "summary_active": bool(summary)
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }