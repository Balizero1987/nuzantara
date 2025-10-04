"""
Bali Zero Router - Haiku vs Sonnet decision
"""

from typing import List, Dict
from loguru import logger


class BaliZeroRouter:
    """Routes queries to Haiku (cheap/fast) or Sonnet (smart/complex)"""

    def __init__(self):
        self.complexity_threshold = 5  # 0-10 scale

    def route(
        self,
        query: str,
        conversation_history: List[Dict] = None,
        user_role: str = "member"
    ) -> str:
        """
        Decide which model to use

        Returns: "haiku" or "sonnet"
        """

        score = self.calculate_complexity(query, conversation_history)

        # Team leads get lower threshold (more Sonnet access)
        threshold = self.complexity_threshold
        if user_role == "lead":
            threshold -= 2

        decision = "sonnet" if score >= threshold else "haiku"

        logger.info(f"Router: complexity={score}, threshold={threshold}, model={decision}")
        return decision

    def calculate_complexity(
        self,
        query: str,
        history: List[Dict] = None
    ) -> int:
        """
        Calculate query complexity (0-10)

        Higher score = more complex = needs Sonnet
        """

        score = 0
        query_lower = query.lower()

        # 1. Conditional logic (0-2)
        if "if" in query_lower or "se" in query_lower or "jika" in query_lower:
            score += 1
            if query_lower.count("if") > 1:
                score += 1

        # 2. Multi-domain query (0-3)
        domains = ["visa", "tax", "business", "legal", "property", "immigration"]
        domains_mentioned = sum(1 for d in domains if d in query_lower)
        if domains_mentioned > 1:
            score += 2
        elif domains_mentioned == 1:
            score += 1

        # 3. Advisory keywords (0-2)
        advisory = ["should i", "recommend", "advice", "suggest",
                   "dovrei", "consiglio", "sebaiknya", "saran"]
        if any(k in query_lower for k in advisory):
            score += 2

        # 4. Query length (0-2)
        words = len(query.split())
        if words > 50:
            score += 2
        elif words > 20:
            score += 1

        # 5. Complex language (0-2)
        complex_words = ["however", "although", "considering", "notwithstanding",
                        "tuttavia", "nonostante", "namun", "walaupun"]
        if any(w in query_lower for w in complex_words):
            score += 1

        # 6. Urgency (0-1)
        urgent = ["urgent", "asap", "deadline", "scadenza", "segera", "mendesak"]
        if any(u in query_lower for u in urgent):
            score += 1

        # 7. Conversation context (0-2)
        if history and len(history) > 3:
            score += 1
            # Check if previous turns were complex
            if any("sonnet" in str(h).lower() for h in history[-2:]):
                score += 1

        return min(score, 10)  # Cap at 10