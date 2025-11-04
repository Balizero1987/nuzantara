"""
Intent Classifier Module
Fast pattern-based intent classification without AI cost
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)

# Pattern matching constants
SIMPLE_GREETINGS = [
    "ciao", "hello", "hi", "hey", "salve",
    "buongiorno", "buonasera", "halo", "hallo"
]

SESSION_PATTERNS = [
    # Login intents
    "login", "log in", "sign in", "signin", "masuk", "accedi",
    # Logout intents
    "logout", "log out", "sign out", "signout", "keluar", "esci",
    # Identity queries
    "who am i", "siapa aku", "siapa saya", "chi sono", "who is this",
    "do you know me", "recognize me", "mi riconosci", "kenal saya",
    "chi sono io", "sai chi sono"
]

CASUAL_PATTERNS = [
    "come stai", "how are you", "come va", "tutto bene",
    "apa kabar", "what's up", "whats up",
    "sai chi sono", "do you know me", "know who i am",
    "recognize me", "remember me", "mi riconosci"
]

EMOTIONAL_PATTERNS = [
    # Embarrassment / Shyness
    "aku malu", "saya malu", "i'm embarrassed", "i feel embarrassed", "sono imbarazzato",
    # Sadness / Upset
    "aku sedih", "saya sedih", "i'm sad", "i feel sad", "sono triste", "mi sento giù",
    # Anxiety / Worry
    "aku khawatir", "saya khawatir", "i'm worried", "i worry", "sono preoccupato", "mi preoccupa",
    # Loneliness
    "aku kesepian", "saya kesepian", "i'm lonely", "i feel lonely", "mi sento solo",
    # Stress / Overwhelm
    "aku stress", "saya stress", "i'm stressed", "sono stressato", "mi sento sopraffatto",
    # Fear
    "aku takut", "saya takut", "i'm scared", "i'm afraid", "ho paura",
    # Happiness / Excitement
    "aku senang", "saya senang", "i'm happy", "sono felice", "che bello"
]

BUSINESS_KEYWORDS = [
    "kitas", "visa", "pt pma", "company", "business", "investimento", "investment",
    "tax", "pajak", "immigration", "imigrasi", "permit", "license", "regulation",
    "real estate", "property", "kbli", "nib", "oss", "work permit"
]

COMPLEX_INDICATORS = [
    # Process-oriented
    "how to", "how do i", "come si", "bagaimana cara", "cara untuk",
    "step", "process", "procedure", "prosedur", "langkah",
    # Detail-oriented
    "explain", "spiegare", "jelaskan", "detail", "dettaglio", "rincian",
    # Requirement-oriented
    "requirement", "requisiti", "syarat", "what do i need", "cosa serve",
    # Multi-part questions
    " and ", " or ", " also ", " e ", " o ", " dan ", " atau "
]

SIMPLE_PATTERNS = [
    "what is", "what's", "cos'è", "apa itu", "cosa è",
    "who is", "chi è", "siapa",
    "when is", "quando", "kapan",
    "where is", "dove", "dimana"
]

DEVAI_KEYWORDS = [
    "code", "coding", "programming", "debug", "error", "bug", "function",
    "api", "devai", "typescript", "javascript", "python", "java", "react",
    "algorithm", "refactor", "optimize", "test", "unit test"
]


class IntentClassifier:
    """
    Fast pattern-based intent classifier

    Classifies user intents without AI cost using pattern matching:
    - greeting: Simple greetings (Ciao, Hello, Hi)
    - casual: Casual questions (Come stai? How are you?)
    - session_state: Login/logout/identity queries
    - business_simple: Simple business questions
    - business_complex: Complex business/legal questions
    - devai_code: Development/code queries
    - unknown: Fallback category
    """

    def __init__(self):
        """Initialize intent classifier with pattern constants"""
        logger.info("✅ IntentClassifier initialized (pattern-based, no AI cost)")

    async def classify_intent(self, message: str) -> Dict:
        """
        Classify user intent using fast pattern matching

        Args:
            message: User message to classify

        Returns:
            {
                "category": str,
                "confidence": float,
                "suggested_ai": "haiku"|"sonnet"|"devai",
                "require_memory": bool (optional)
            }
        """
        try:
            message_lower = message.lower().strip()

            # Check exact greetings first
            if message_lower in SIMPLE_GREETINGS:
                logger.info("🎯 [Classifier] Quick match: greeting")
                return {
                    "category": "greeting",
                    "confidence": 1.0,
                    "suggested_ai": "haiku",
                    "require_memory": True  # Always use memory for personalized greetings
                }

            # Check session state patterns
            if any(pattern in message_lower for pattern in SESSION_PATTERNS):
                logger.info("🎯 [Classifier] Quick match: session_state → Haiku with memory")
                return {
                    "category": "session_state",
                    "confidence": 1.0,
                    "suggested_ai": "haiku",
                    "require_memory": True  # Critical: need user identity
                }

            # Check casual questions
            if any(pattern in message_lower for pattern in CASUAL_PATTERNS):
                logger.info("🎯 [Classifier] Quick match: casual")
                return {
                    "category": "casual",
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            # Check emotional patterns
            if any(pattern in message_lower for pattern in EMOTIONAL_PATTERNS):
                logger.info("🎯 [Classifier] Quick match: emotional/empathetic → Haiku")
                return {
                    "category": "casual",  # Treat emotional as casual for warm response
                    "confidence": 1.0,
                    "suggested_ai": "haiku"
                }

            # Check business keywords
            has_business_term = any(keyword in message_lower for keyword in BUSINESS_KEYWORDS)

            if has_business_term:
                # Detect complexity
                has_complex_indicator = any(
                    indicator in message_lower for indicator in COMPLEX_INDICATORS
                )
                is_simple_question = any(
                    pattern in message_lower for pattern in SIMPLE_PATTERNS
                )

                # Decision logic:
                # 1. Simple question + short message → Haiku with RAG
                # 2. Complex indicators or long message → Sonnet
                if is_simple_question and len(message) < 50 and not has_complex_indicator:
                    logger.info("🎯 [Classifier] Quick match: business_simple → Haiku + RAG")
                    return {
                        "category": "business_simple",
                        "confidence": 0.9,
                        "suggested_ai": "haiku"
                    }
                elif has_complex_indicator or len(message) > 100:
                    logger.info("🎯 [Classifier] Quick match: business_complex → Sonnet + RAG")
                    return {
                        "category": "business_complex",
                        "confidence": 0.9,
                        "suggested_ai": "sonnet"
                    }
                else:
                    logger.info("🎯 [Classifier] Quick match: business_medium → Sonnet")
                    return {
                        "category": "business_simple",
                        "confidence": 0.8,
                        "suggested_ai": "sonnet"
                    }

            # Check DevAI keywords
            if any(keyword in message_lower for keyword in DEVAI_KEYWORDS):
                logger.info("🎯 [Classifier] Quick match: devai_code")
                return {
                    "category": "devai_code",
                    "confidence": 0.9,
                    "suggested_ai": "devai"
                }

            # Fast heuristic fallback: short messages → Haiku
            logger.info(f"🤔 [Classifier] Using fast pattern fallback for: '{message[:50]}...'")

            if len(message) < 50:
                category = "casual"
                suggested_ai = "haiku"
                logger.info("🎯 [Classifier] Fast fallback: SHORT message → Haiku")
            else:
                category = "business_simple"
                suggested_ai = "haiku"
                logger.info("🎯 [Classifier] Fast fallback: LONG message → Haiku")

            return {
                "category": category,
                "confidence": 0.7,  # Pattern matching confidence
                "suggested_ai": suggested_ai
            }

        except Exception as e:
            logger.error(f"❌ [Classifier] Classification error: {e}")
            # Fallback: route to Haiku
            return {
                "category": "unknown",
                "confidence": 0.0,
                "suggested_ai": "haiku"
            }
