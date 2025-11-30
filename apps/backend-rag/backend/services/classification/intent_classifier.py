"""
Intent Classifier Module
Fast pattern-based intent classification without AI cost
"""

import logging

logger = logging.getLogger(__name__)

# Pattern matching constants
SIMPLE_GREETINGS = [
    "ciao",
    "hello",
    "hi",
    "hey",
    "salve",
    "buongiorno",
    "buonasera",
    "halo",
    "hallo",
]

# Identity keywords (highest priority - self-recognition queries)
IDENTITY_KEYWORDS = [
    # Italian
    "chi sono",
    "chi sono io",
    "chi sei",
    "mi conosci",
    "sai chi sono",
    "cosa sai di me",
    "il mio nome",
    "il mio ruolo",
    "mi riconosci",
    # English
    "who am i",
    "who am i?",
    "do you know me",
    "my name",
    "my role",
    "recognize me",
    "who is this",
    # Indonesian
    "siapa saya",
    "siapa aku",
    "apakah kamu kenal saya",
    "nama saya",
    "kenal saya",
]

# Team query keywords (team enumeration queries)
TEAM_QUERY_KEYWORDS = [
    # Italian
    "team",
    "membri",
    "colleghi",
    "chi lavora",
    "quanti siamo",
    "dipartimento",
    "bali zero team",
    "conosci i membri",
    "parlami del team",
    # English
    "team members",
    "colleagues",
    "who works",
    "department",
    "know the members",
    "tell me about the team",
    # Indonesian
    "tim",
    "anggota tim",
    "rekan kerja",
]

SESSION_PATTERNS = [
    # Login intents
    "login",
    "log in",
    "sign in",
    "signin",
    "masuk",
    "accedi",
    # Logout intents
    "logout",
    "log out",
    "sign out",
    "signout",
    "keluar",
    "esci",
]

CASUAL_PATTERNS = [
    "come stai",
    "how are you",
    "come va",
    "tutto bene",
    "apa kabar",
    "what's up",
    "whats up",
    "sai chi sono",
    "do you know me",
    "know who i am",
    "recognize me",
    "remember me",
    "mi riconosci",
]

EMOTIONAL_PATTERNS = [
    # Embarrassment / Shyness
    "aku malu",
    "saya malu",
    "i'm embarrassed",
    "i feel embarrassed",
    "sono imbarazzato",
    # Sadness / Upset
    "aku sedih",
    "saya sedih",
    "i'm sad",
    "i feel sad",
    "sono triste",
    "mi sento giù",
    # Anxiety / Worry
    "aku khawatir",
    "saya khawatir",
    "i'm worried",
    "i worry",
    "sono preoccupato",
    "mi preoccupa",
    # Loneliness
    "aku kesepian",
    "saya kesepian",
    "i'm lonely",
    "i feel lonely",
    "mi sento solo",
    # Stress / Overwhelm
    "aku stress",
    "saya stress",
    "i'm stressed",
    "sono stressato",
    "mi sento sopraffatto",
    # Fear
    "aku takut",
    "saya takut",
    "i'm scared",
    "i'm afraid",
    "ho paura",
    # Happiness / Excitement
    "aku senang",
    "saya senang",
    "i'm happy",
    "sono felice",
    "che bello",
]

BUSINESS_KEYWORDS = [
    # Generic business keywords only - no specific codes (KITAS, PT PMA are in database)
    "visa",
    "company",
    "business",
    "investimento",
    "investment",
    "tax",
    "pajak",
    "immigration",
    "imigrasi",
    "permit",
    "license",
    "regulation",
    "real estate",
    "property",
    "kbli",
    "nib",
    "oss",
    "work permit",
]

COMPLEX_INDICATORS = [
    # Process-oriented
    "how to",
    "how do i",
    "come si",
    "bagaimana cara",
    "cara untuk",
    "step",
    "process",
    "procedure",
    "prosedur",
    "langkah",
    # Detail-oriented
    "explain",
    "spiegare",
    "jelaskan",
    "detail",
    "dettaglio",
    "rincian",
    # Requirement-oriented
    "requirement",
    "requisiti",
    "syarat",
    "what do i need",
    "cosa serve",
    # Multi-part questions
    " and ",
    " or ",
    " also ",
    " e ",
    " o ",
    " dan ",
    " atau ",
]

SIMPLE_PATTERNS = [
    "what is",
    "what's",
    "cos'è",
    "apa itu",
    "cosa è",
    "who is",
    "chi è",
    "siapa",
    "when is",
    "quando",
    "kapan",
    "where is",
    "dove",
    "dimana",
]

DEVAI_KEYWORDS = [
    "code",
    "coding",
    "programming",
    "debug",
    "error",
    "bug",
    "function",
    "api",
    "devai",
    "typescript",
    "javascript",
    "python",
    "java",
    "react",
    "algorithm",
    "refactor",
    "optimize",
    "test",
    "unit test",
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
        logger.info("🏷️ [IntentClassifier] Initialized (pattern-based, no AI cost)")

    async def classify_intent(self, message: str) -> dict:
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
                logger.info("🏷️ [IntentClassifier] Classified: greeting")
                return {
                    "category": "greeting",
                    "confidence": 1.0,
                    "suggested_ai": "haiku",
                    "require_memory": True,  # Always use memory for personalized greetings
                }

            # PRIORITY 1: Identity queries (highest priority - before session_state)
            if any(pattern in message_lower for pattern in IDENTITY_KEYWORDS):
                logger.info("🏷️ [IntentClassifier] Classified: identity")
                return {
                    "category": "identity",
                    "confidence": 0.95,
                    "suggested_ai": "zantara-ai",
                    "requires_team_context": True,  # Critical: need collaborator profile
                }

            # PRIORITY 2: Team queries
            if any(pattern in message_lower for pattern in TEAM_QUERY_KEYWORDS):
                logger.info("🏷️ [IntentClassifier] Classified: team_query")
                return {
                    "category": "team_query",
                    "confidence": 0.9,
                    "suggested_ai": "zantara-ai",
                    "requires_rag_collection": "bali_zero_team",  # Force team collection
                }

            # Check session state patterns
            if any(pattern in message_lower for pattern in SESSION_PATTERNS):
                logger.info("🏷️ [IntentClassifier] Classified: session_state")
                return {
                    "category": "session_state",
                    "confidence": 1.0,
                    "suggested_ai": "haiku",
                    "require_memory": True,  # Critical: need user identity
                }

            # Check casual questions
            if any(pattern in message_lower for pattern in CASUAL_PATTERNS):
                logger.info("🏷️ [IntentClassifier] Classified: casual")
                return {"category": "casual", "confidence": 1.0, "suggested_ai": "haiku"}

            # Check emotional patterns
            if any(pattern in message_lower for pattern in EMOTIONAL_PATTERNS):
                logger.info("🏷️ [IntentClassifier] Classified: casual (emotional)")
                return {
                    "category": "casual",  # Treat emotional as casual for warm response
                    "confidence": 1.0,
                    "suggested_ai": "haiku",
                }

            # Check business keywords
            has_business_term = any(keyword in message_lower for keyword in BUSINESS_KEYWORDS)

            if has_business_term:
                # Detect complexity
                has_complex_indicator = any(
                    indicator in message_lower for indicator in COMPLEX_INDICATORS
                )
                is_simple_question = any(pattern in message_lower for pattern in SIMPLE_PATTERNS)

                # Decision logic:
                # 1. Simple question + short message → Haiku with RAG
                # 2. Complex indicators or long message → Sonnet
                if is_simple_question and len(message) < 50 and not has_complex_indicator:
                    logger.info("🏷️ [IntentClassifier] Classified: business_simple")
                    return {
                        "category": "business_simple",
                        "confidence": 0.9,
                        "suggested_ai": "haiku",
                    }
                elif has_complex_indicator or len(message) > 100:
                    logger.info("🏷️ [IntentClassifier] Classified: business_complex")
                    return {
                        "category": "business_complex",
                        "confidence": 0.9,
                        "suggested_ai": "sonnet",
                    }
                else:
                    logger.info("🏷️ [IntentClassifier] Classified: business_medium")
                    return {
                        "category": "business_simple",
                        "confidence": 0.8,
                        "suggested_ai": "sonnet",
                    }

            # Check DevAI keywords
            if any(keyword in message_lower for keyword in DEVAI_KEYWORDS):
                logger.info("🏷️ [IntentClassifier] Classified: devai_code")
                return {"category": "devai_code", "confidence": 0.9, "suggested_ai": "devai"}

            # Fast heuristic fallback: short messages → Haiku
            logger.info(f"🏷️ [IntentClassifier] Fallback classification for: '{message[:50]}...'")

            if len(message) < 50:
                category = "casual"
                suggested_ai = "haiku"
                logger.info("🏷️ [IntentClassifier] Fallback: casual (short message)")
            else:
                category = "business_simple"
                suggested_ai = "haiku"
                logger.info("🏷️ [IntentClassifier] Fallback: business_simple (long message)")

            return {
                "category": category,
                "confidence": 0.7,  # Pattern matching confidence
                "suggested_ai": suggested_ai,
            }

        except Exception as e:
            logger.error(f"🏷️ [IntentClassifier] Error: {e}")
            # Fallback: route to Haiku
            return {"category": "unknown", "confidence": 0.0, "suggested_ai": "haiku"}
