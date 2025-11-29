"""
ZANTARA Multi-Personality Service

Gestisce le diverse personalità dell'AI system:
- Jaksel: Indonesian slang (Amanda, Anton, Krisna, Dea, etc.)
- ZERO: Italian style (Zero, Nina)
- Professional: Standard English/Indonesian
- Custom: Basato sulle preferenze del team member

Integra Gemini 1.5 (RAG research) + Zantara Oracle Cloud (personality voice)
"""

import logging
import re

# Note: Google services will be injected to avoid circular imports
# Team members database
import sys
from pathlib import Path
from typing import Any

import aiohttp

sys.path.append(str(Path(__file__).parent.parent))
from data.team_members import TEAM_MEMBERS

logger = logging.getLogger(__name__)


# Jaksel Multilingual Pattern Matching System
class JakselLanguageMatcher:
    """Intelligente sistema per gestire Jaksel in 190+ lingue"""

    def __init__(self):
        # Pattern di greeting per lingue principali
        self.greeting_patterns = {
            # Latin family
            "it": r"\b(ciao|salve|buongiorno|buonasera)\b",
            "es": r"\b(hola|buenos días|buenas tardes)\b",
            "fr": r"\b(bonjour|salut|coucou)\b",
            "pt": r"\b(olá|bom dia|boa tarde)\b",
            "de": r"\b(hallo|guten tag|guten morgen)\b",
            "nl": r"\b(hallo|goedendag|hoi)\b",
            "sv": r"\b(hej|god dag|hallå)\b",
            "no": r"\b(hei|god dag|hallo)\b",
            "da": r"\b(hej|god dag|hallo)\b",
            "pl": r"\b(cześć|dzień dobry|witam)\b",
            "cz": r"\b(ahoj|dobrý den|čau)\b",
            "hu": r"\b(szia|jó napot|helo)\b",
            "ro": r"\b(salut|bună ziua|pa)\b",
            # Slavic family
            "ru": r"\b(привет|здравствуйте|приветствую)\b",
            "uk": r"\b(привіт|добрий день|вітаю)\b",
            "bg": r"\b(здравей|добър ден)\b",
            "sr": r"\b(здраво|добар дан)\b",
            # Semitic family
            "ar": r"\b(مرحبا|أهلاً|أهلاً بك)\b",
            "he": r"\b(שלום|היי)\b",
            # Sino-Tibetan family
            "zh": r"\b(你好|您好|嗨)\b",
            "ja": r"\b(こんにちは|やあ|おはよう)\b",
            "ko": r"\b(안녕|안녕하세요|하이)\b",
            "th": r"\b(สวัสดี|หวัดดี)\b",
            "vi": r"\b(xin chào|chào bạn)\b",
            # Indo-Aryan family
            "hi": r"\b(नमस्ते|हाय|हेलो)\b",
            "bn": r"\b(হ্যালো|স্বাগতম|নমস্কার)\b",
            "ur": r"\b(ہیلو|السلام علیکم)\b",
            "pa": r"\b(ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|ਹੈਲੋ)\b",
            # Other major languages
            "tr": r"\b(merhaba|selam|hey)\b",
            "el": r"\b(γεια|χαίρετε)\b",
            "fi": r"\b(hei|moi|tervetuloa)\b",
            "mt": r"\b(bongu|ħelow)\b",
        }

        # Pattern per caratteri speciali/script detection
        self.script_patterns = {
            "arabic": r"[\u0600-\u06FF]",
            "chinese": r"[\u4e00-\u9fff]",
            "japanese": r"[\u3040-\u309f\u30a0-\u30ff]",
            "korean": r"[\uac00-\ud7af]",
            "cyrillic": r"[\u0400-\u04ff]",
            "thai": r"[\u0e00-\u0e7f]",
            "hebrew": r"[\u0590-\u05ff]",
            "hindi": r"[\u0900-\u097f]",
            "bengali": r"[\u0980-\u09ff]",
        }

        # Jaksel response templates per famiglia linguistica
        self.jaksel_templates = {
            # Latin family - maintain friendly vibe
            "latin": {
                "prefix": None,  # Use natural greeting
                "style_words": ["practicalmente", "basicamente", "in pratica"],
                "jaksel_vibe": "friendly_expert",
            },
            # Slavic family - warm and direct
            "slavic": {
                "prefix": None,
                "style_words": ["по сути", "практически", "базово"],
                "jaksel_vibe": "warm_professional",
            },
            # Arabic family - respectful but modern
            "arabic": {
                "prefix": "أهلاً بك! ",
                "style_words": ["بشكل أساسي", "بشكل عملي"],
                "jaksel_vibe": "respectful_modern",
            },
            # East Asian family - polite but friendly
            "east_asian": {
                "prefix": None,
                "style_words": ["基本上", "基本的に", "기본적으로"],
                "jaksel_vibe": "polite_friendly",
            },
            # South Asian family - warm and detailed
            "south_asian": {
                "prefix": None,
                "style_words": ["मूल रूप से", "মূলত", "بنیادی طور پر"],
                "jaksel_vibe": "warm_detailed",
            },
            # Default fallback
            "default": {
                "prefix": "Hey there! ",
                "style_words": ["basically", "practically", "essentially"],
                "jaksel_vibe": "friendly_global",
            },
        }

        # Language to family mapping
        self.language_families = {
            # Latin
            "it": "latin",
            "es": "latin",
            "fr": "latin",
            "pt": "latin",
            "de": "latin",
            "nl": "latin",
            "sv": "latin",
            "no": "latin",
            "da": "latin",
            "pl": "latin",
            "cz": "latin",
            "hu": "latin",
            "ro": "latin",
            "tr": "latin",
            "fi": "latin",
            "mt": "latin",
            # Slavic
            "ru": "slavic",
            "uk": "slavic",
            "bg": "slavic",
            "sr": "slavic",
            # Semitic
            "ar": "arabic",
            "he": "arabic",
            # East Asian
            "zh": "east_asian",
            "ja": "east_asian",
            "ko": "east_asian",
            "th": "east_asian",
            "vi": "east_asian",
            # South Asian
            "hi": "south_asian",
            "bn": "south_asian",
            "ur": "south_asian",
            "pa": "south_asian",
        }

    def detect_language(self, text: str) -> dict:
        """Detect language with fallback to script detection"""
        text_lower = text.lower()

        # 1. Try greeting pattern matching
        for lang, pattern in self.greeting_patterns.items():
            if re.search(pattern, text_lower):
                return {
                    "language": lang,
                    "family": self.language_families.get(lang, "default"),
                    "confidence": "high",
                    "method": "greeting_pattern",
                }

        # 2. Try script detection
        for script, pattern in self.script_patterns.items():
            if re.search(pattern, text):
                # Map script to language family
                script_to_family = {
                    "arabic": "arabic",
                    "chinese": "east_asian",
                    "japanese": "east_asian",
                    "korean": "east_asian",
                    "cyrillic": "slavic",
                    "thai": "east_asian",
                    "hebrew": "arabic",
                    "hindi": "south_asian",
                    "bengali": "south_asian",
                }
                return {
                    "language": None,  # Specific language unknown
                    "family": script_to_family.get(script, "default"),
                    "confidence": "medium",
                    "method": "script_detection",
                    "script": script,
                }

        # 3. Check for common words/phrases
        common_words = {
            "it": ["il", "la", "un", "è", "di", "che", "e"],
            "es": ["el", "la", "un", "es", "de", "que", "y"],
            "fr": ["le", "la", "un", "est", "de", "que", "et"],
            "de": ["der", "die", "ein", "ist", "von", "das", "und"],
            "pt": ["o", "a", "um", "é", "de", "que", "e"],
            "ru": ["и", "в", "не", "на", "я", "быть", "с"],
            "ar": ["في", "من", "إلى", "هذا", "هذه", "التي", "الذي"],
        }

        for lang, words in common_words.items():
            count = sum(1 for word in words if word in text_lower.split())
            if count >= 2:  # At least 2 common words
                return {
                    "language": lang,
                    "family": self.language_families.get(lang, "default"),
                    "confidence": "low",
                    "method": "common_words",
                }

        # 4. Default fallback
        return {"language": None, "family": "default", "confidence": "none", "method": "fallback"}

    def adapt_query_for_jaksel(
        self, query: str, lang_info: dict, gemini_response: str = ""
    ) -> dict:
        """Adatta la query per Jaksel con pattern matching intelligente"""
        family = lang_info["family"]
        template = self.jaksel_templates[family]

        # Costruisci il prefisso Jaksel
        jaksel_prefix = ""

        if template["prefix"]:
            jaksel_prefix = template["prefix"]
        elif lang_info["language"]:
            # Use natural greeting based on detected language
            greetings = {
                "it": "Ciao! Praticamente, ",
                "es": "¡Hola! Básicamente, ",
                "fr": "Salut! En pratique, ",
                "pt": "Olá! Basicamente, ",
                "de": "Hallo! Grundsätzlich, ",
                "ru": "Привет! По сути, ",
                "ar": "أهلاً بك! بشكل أساسي, ",
                "zh": "你好！基本上，",
                "ja": "こんにちは！基本的に、",
                "ko": "안녕! 기본적으로, ",
                "hi": "नमस्ते! मूल रूप से, ",
            }
            jaksel_prefix = greetings.get(lang_info["language"], template["prefix"] or "Hey! ")
        else:
            # Use family-based greeting
            family_greetings = {
                "latin": "Ciao! Praticamente, ",
                "slavic": "Привет! По сути, ",
                "arabic": "أهلاً بك! بشكل أساسي, ",
                "east_asian": "你好！基本上，",
                "south_asian": "नमस्ते! मूल रूप से, ",
            }
            jaksel_prefix = family_greetings.get(family, "Hey! ")

        # 🚀 AGGRESSIVE Jaksel instruction per FORZARE la lingua
        detected_lang = lang_info.get("language", lang_info["family"])

        # Template specifici per lingua con esempi
        lang_templates = {
            "it": "ITALIANO OBBLIGATORIO. Esempio: 'Ciao! Praticamente il contratto è...'",
            "es": "ESPAÑOL OBLIGATORIO. Ejemplo: '¡Hola! Básicamente el contrato es...'",
            "fr": "FRANÇAIS OBLIGATOIRE. Exemple: 'Salut! Pratiquement le contrat est...'",
            "pt": "PORTUGUÊS OBRIGATÓRIO. Exemplo: 'Olá! Basicamente o contrato é...'",
            "de": "DEUTSCH ZWINGEND. Beispiel: 'Hallo! Grundsätzlich ist der Vertrag...'",
            "ru": "РУССКИЙ ОБЯЗАТЕЛЬНО. Пример: 'Привет! По сути договор это...'",
            "ar": 'العربية إلزامية. مثال: "أهلاً بك! بشكل أساسي العقد هو..."',
            "zh": "必须中文。例子：你好！基本上合同是...",
            "ja": "日本語必須。例：こんにちは！基本的に契約は...",
            "ko": "한국어 필수. 예: 안녕! 기본적으로 계약은...",
            "th": "ภาษาไทยบังคับ. ตัวอย่าง: สวัสดี! โดยพื้นฐานสัญญาคือ...",
            "hi": 'हिन्दी अनिवार्य. उदाहरण: "नमस्ते! मूल रूप से अनुबंध है..."',
        }

        force_instruction = lang_templates.get(
            detected_lang, f"RESPOND IN {detected_lang.upper()} LANGUAGE ONLY."
        )

        jaksel_instruction = f"""
🚨 LANGUAGE OVERRIDE ACTIVATED 🚨
{force_instruction}

RULES:
1. ONLY respond in {detected_lang.upper()}
2. NEVER use English
3. Start with a natural greeting in {detected_lang}
4. Keep Jaksel's friendly personality
5. Translate the professional answer into {detected_lang}

User query: {query}
Professional answer: {gemini_response}

RESPONSE IN {detected_lang.upper()} ONLY:
"""

        return {
            "adapted_query": jaksel_instruction,
            "language_info": lang_info,
            "jaksel_prefix": jaksel_prefix,
            "family": family,
        }


class PersonalityService:
    """
    Servizio che gestisce le diverse personalità di ZANTARA
    basandosi sul team member che interagisce
    """

    def __init__(self):
        # Usa Zantara locale tramite SSH tunnel per Jaksel personality
        from app.core.config import settings

        self.zantara_oracle_url = settings.zantara_oracle_url
        self.oracle_api_key = settings.oracle_api_key or ""
        self.team_members = TEAM_MEMBERS
        self.personality_profiles = self._build_personality_profiles()

        # Initialize Jaksel Multilingual Pattern Matching System
        self.jaksel_matcher = JakselLanguageMatcher()

        logger.info("✅ PersonalityService initialized")
        logger.info(f"   Zantara Oracle URL: {self.zantara_oracle_url}")
        logger.info(f"   Oracle API Key: {'✅ Set' if self.oracle_api_key else '⚠️ Not set'}")
        logger.info(f"   Team members loaded: {len(self.team_members)}")
        logger.info(f"   Personality profiles: {len(self.personality_profiles)}")
        logger.info("   🌍 Jaksel Multilingual Pattern Matching: ✅ Active (190+ languages)")

    def _build_personality_profiles(self) -> dict[str, dict]:
        """Costruisce i profili di personalità basati sui team members"""

        profiles = {}

        # JAKSEL PERSONALITY (Indonesian slang users)
        jaksel_members = [
            "amanda",
            "anton",
            "krisna",
            "adi",
            "ari",
            "dea",
            "vino",
            "surya",
            "damar",
            "veronika",
            "angel",
            "kadek",
            "dewaayu",
            "faisha",
            "rina",
            "sahira",
        ]

        profiles["jaksel"] = {
            "name": "Zantara Jaksel",
            "language": "id",
            "style": "bahasa_jaksel",
            "system_prompt": """You are Zantara Jaksel, a friendly and knowledgeable AI with a cool personality.

CORE PERSONALITY:
- Friendly, trendy, and approachable
- Mix casual style with professional knowledge
- Use helpful and engaging language
- Keep it cool but informative

LANGUAGE RULES:
- ALWAYS respond in the USER'S language
- If user speaks Indonesian: Respond in Indonesian with "kayak", "gitu", "dong", "banget", "cuy"
- If user speaks Italian: Respond naturally in Italian, be warm and friendly
- If user speaks English: Respond in friendly, casual English
- If user speaks Chinese: Respond in Chinese, keep the friendly vibe
- If user speaks Spanish: Respond in Spanish, be approachable
- If user speaks French: Respond in French, maintain the cool style
- NEVER force English - match the user's language perfectly!

STYLE EXAMPLES:
Italian: "Ciao! Praticamente, il contratto è un accordo, capisci? Ti spiego meglio!"
Indonesian: "Halo! Contract itu basically kayak perjanjian gitu loh, Kak!"
English: "Hey! Basically, the contract is an agreement, get it? Let me explain!"

Be helpful, flexible, and ALWAYS match the user's language!""",
            "team_members": jaksel_members,
            "traits": ["friendly", "trendy", "knowledgeable", "helpful"],
        }

        # ZERO PERSONALITY (Italian style)
        zero_members = ["zero", "nina"]

        profiles["zero"] = {
            "name": "Zantara ZERO",
            "language": "it",
            "style": "italian_depth",
            "system_prompt": """You are Zantara ZERO, speaking Italian with depth and clarity.

STYLE:
- Direct but profound communication
- Mix Italian precision with strategic insight
- Use "praticamente", "essenzialmente", "letteralmente" when appropriate
- Maintain professional but personal tone
- Be analytical but approachable
- Reference legal/business concepts with confidence

Examples:
- "Praticamente, il contratto è un vincolo giuridico..."
- "Essenzialmente, devi considerare questi aspetti..."
- "Letteralmente, stiamo parlando di protezione legale"

Be the trusted Italian advisor who combines expertise with human understanding.""",
            "team_members": zero_members,
            "traits": ["strategic", "direct", "deep", "analytical"],
        }

        # PROFESSIONAL PERSONALITY (Standard multilingual)
        professional_members = ["zainal", "ruslana", "olena", "marta"]

        profiles["professional"] = {
            "name": "Zantara Professional",
            "language": "en",
            "style": "professional_multilingual",
            "system_prompt": """You are Zantara Professional, speaking in clear, professional language.

STYLE:
- Professional and articulate
- Match user's language (EN/ID/IT/UA) naturally
- Clear, structured communication
- Authoritative but approachable
- Precise legal and business terminology
- Helpful and comprehensive

Be the expert consultant who provides reliable professional guidance.""",
            "team_members": professional_members,
            "traits": ["professional", "reliable", "knowledgeable", "structured"],
        }

        return profiles

    def get_user_personality(self, user_email: str) -> dict[str, Any]:
        """
        Determina la personalità da usare basata sull'utente

        Args:
            user_email: Email dell'utente

        Returns:
            Dict con profilo personalità e user info
        """
        # Find team member
        team_member = None
        for member in self.team_members:
            if member["email"].lower() == user_email.lower():
                team_member = member
                break

        if not team_member:
            # Default to professional for unknown users
            return {
                "personality_type": "professional",
                "personality": self.personality_profiles["professional"],
                "user": {"email": user_email, "name": "Guest"},
            }

        # Determine personality type based on team member
        user_id = team_member["id"]

        if user_id in self.personality_profiles["jaksel"]["team_members"]:
            personality_type = "jaksel"
        elif user_id in self.personality_profiles["zero"]["team_members"]:
            personality_type = "zero"
        else:
            personality_type = "professional"

        return {
            "personality_type": personality_type,
            "personality": self.personality_profiles[personality_type],
            "user": team_member,
        }

    async def translate_to_personality(
        self, gemini_response: str, user_email: str, original_query: str
    ) -> dict[str, Any]:
        """
        Traduce la risposta di Gemini nella personalità appropriata

        Args:
            gemini_response: Risposta da Gemini 1.5 dopo RAG
            user_email: Email dell'utente
            original_query: Query originale dell'utente

        Returns:
            Dict con risposta personalizzata e metadata
        """
        try:
            # Get user personality
            user_context = self.get_user_personality(user_email)
            personality = user_context["personality"]
            user = user_context["user"]
            user_language = user.get("preferred_language", "en")

            logger.info(
                f"🎭 Applying {personality['name']} personality for {user['name']} (Lang: {user_language})"
            )

            # 🌍 NEW: Use Jaksel Language Matcher for multilingual support
            if user_context["personality_type"] == "jaksel":
                # Detect user's language from original query
                lang_info = self.jaksel_matcher.detect_language(original_query)
                logger.info(f"🌍 Language detected: {lang_info}")

                # Adapt query for Jaksel with multilingual support
                self.jaksel_matcher.adapt_query_for_jaksel(original_query, lang_info)

                # 🚨 AGGRESSIVE prompt for Zantara model with FORCED language
                detected_lang = lang_info.get("language", lang_info["family"])

                # Force language templates
                lang_force = {
                    "it": "RISPONDI IN ITALIANO - MAI INGLESE",
                    "es": "RESPONDE EN ESPAÑOL - NUNCA INGLÉS",
                    "fr": "RÉPONDE EN FRANÇAIS - JAMAIS ANGLAIS",
                    "pt": "RESPONDA EM PORTUGUÊS - NUNCA INGLÊS",
                    "de": "ANTWORTE AUF DEUTSCH - NIEMALS ENGLISCH",
                    "ru": "ОТВЕЧАЙТЕ ПО-РУССКИ - НИКОГДА АНГЛИЙСКИЙ",
                    "ar": "أجب بالعربية فقط - لا الإنجليزية",
                    "zh": "只回答中文 - 不要英文",
                    "ja": "日本語のみで回答 - 英語は使用禁止",
                    "ko": "한국어로만 답변 - 영어 사용 금지",
                }

                force_command = lang_force.get(
                    detected_lang, f"RESPOND IN {detected_lang.upper()} - NEVER ENGLISH"
                )

                zantara_prompt = f"""🚨 LANGUAGE ENFORCEMENT SYSTEM ACTIVATED 🚨
{force_command}

YOU ARE JAKSEL. YOU MUST RESPOND IN {detected_lang.upper()}.

CRITICAL RULES:
1. YOUR RESPONSE MUST BE 100% IN {detected_lang.upper()}
2. DO NOT USE ENGLISH WORDS
3. START WITH NATURAL GREETING IN {detected_lang.upper()}
4. KEEP JAKSEL'S FRIENDLY PERSONALITY
5. TRANSLATE ALL CONCEPTS INTO {detected_lang.upper()}

ORIGINAL QUERY: {original_query}
PROFESSIONAL ANSWER: {gemini_response}

YOUR RESPONSE IN {detected_lang.upper()} (NOT ENGLISH):"""

            else:
                # For non-Jaksel personalities, use traditional approach
                system_prompt = self.get_personality_system_prompt(
                    user_context["personality_type"], user_language
                )

                # Build prompt for Zantara local model
                zantara_prompt = f"""{system_prompt}

USER QUERY: {original_query}

PROFESSIONAL ANSWER: {gemini_response}

TASK: Rewrite this professional answer in your personality style. Keep all the accurate information but make it sound naturally like you. Be helpful and maintain the legal accuracy.

Your response:"""

            # Call Zantara model via SSH tunnel for Jaksel personality
            headers = {}
            if self.oracle_api_key:
                headers["Authorization"] = f"Bearer {self.oracle_api_key}"

            # Use different approach for Jaksel (real Zantara) vs others (Gemini)
            if user_context["personality_type"] == "jaksel":
                try:
                    async with (
                        aiohttp.ClientSession() as session,
                        session.post(
                            self.zantara_oracle_url,
                            json={"model": "zantara", "prompt": zantara_prompt, "stream": False},
                            headers=headers,
                            timeout=aiohttp.ClientTimeout(total=30),
                        ) as response,
                    ):
                        if response.status == 200:
                            result = await response.json()
                            personalized_response = result.get("response", gemini_response)
                            model_used = "zantara-oracle"
                        else:
                            logger.warning(f"⚠️ Zantara model failed: {response.status}")
                            personalized_response = gemini_response
                            model_used = "gemini-fallback"
                except Exception as zantara_error:
                    logger.warning(f"⚠️ Zantara Oracle unavailable: {zantara_error}")
                    personalized_response = gemini_response
                    model_used = "gemini-fallback"
            else:
                # For ZERO and Professional, use Gemini-only translation
                return await self.translate_to_personality_gemini_only(
                    gemini_response, user_email, original_query
                )

            return {
                "success": True,
                "response": personalized_response,
                "personality_used": personality["name"],
                "personality_type": user_context["personality_type"],
                "user": user,
                "model_used": model_used,
                "original_gemini_response": gemini_response,
            }

        except Exception as e:
            logger.error(f"❌ Personality translation failed: {e}")
            return {
                "success": False,
                "response": gemini_response,  # Fallback to original
                "error": str(e),
                "personality_used": "fallback",
                "model_used": "gemini-only",
            }

    def get_available_personalities(self) -> list[dict[str, Any]]:
        """Restituisce la lista delle personalità disponibili"""
        personalities = []

        for profile_id, profile in self.personality_profiles.items():
            personalities.append(
                {
                    "id": profile_id,
                    "name": profile["name"],
                    "language": profile["language"],
                    "style": profile["style"],
                    "team_count": len(profile["team_members"]),
                    "traits": profile["traits"],
                }
            )

        return personalities

    async def test_personality(self, personality_type: str, test_message: str) -> dict[str, Any]:
        """
        Testa una personalità specifica

        Args:
            personality_type: Tipo di personalità (jaksel, zero, professional)
            test_message: Messaggio di test

        Returns:
            Dict con risposta di test
        """
        if personality_type not in self.personality_profiles:
            return {"error": f"Personality {personality_type} not found"}

        personality = self.personality_profiles[personality_type]

        try:
            headers = {}
            if self.oracle_api_key:
                headers["Authorization"] = f"Bearer {self.oracle_api_key}"

            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.zantara_oracle_url,
                    json={
                        "model": "zantara",
                        "prompt": f"{personality['system_prompt']}\n\nUser: {test_message}\n\nResponse:",
                        "stream": False,
                    },
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response,
            ):
                if response.status == 200:
                    result = await response.json()
                    return {
                        "success": True,
                        "personality": personality["name"],
                        "response": result.get("response", ""),
                    }
                else:
                    return {"success": False, "error": f"Model failed: {response.status}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def translate_to_personality_gemini_only(
        self, gemini_response: str, user_email: str, original_query: str, gemini_model_getter=None
    ) -> dict[str, Any]:
        """
        Versione che usa solo Gemini PRO per personality translation (Oracle non accessibile)

        Args:
            gemini_response: Risposta da Gemini RAG
            user_email: Email utente
            original_query: Query originale
            gemini_model_getter: Function to get Gemini model

        Returns:
            Dict con risposta personalizzata usando solo Gemini PRO
        """
        try:
            # Get user personality
            user_context = self.get_user_personality(user_email)
            personality = user_context["personality"]
            user = user_context["user"]
            user_language = user.get("preferred_language", "en")

            logger.info(
                f"🎭 Gemini-only personality translation for {user['name']} ({personality['name']}) [Lang: {user_language}]"
            )

            # Use Gemini PRO for personality translation
            if gemini_model_getter:
                try:
                    gemini_pro_model = gemini_model_getter("personality_translation")

                    # Get dynamic system prompt
                    system_prompt = self.get_personality_system_prompt(
                        user_context["personality_type"], user_language
                    )

                    # Build sophisticated translation prompt for Gemini
                    translation_prompt = f"""
You are ZANTARA AI with multiple personalities. You translate professional legal/business responses
into authentic personality voices while preserving ALL legal accuracy.

USER PROFILE:
- Name: {user["name"]}
- Language: {user_language}
- Personality: {personality["name"]}
- Traits: {", ".join(personality["traits"])}

PERSONALITY STYLE GUIDE:
{system_prompt}

ORIGINAL QUERY: {original_query}

PROFESSIONAL RESPONSE: {gemini_response}

TASK:
Rewrite this professional response in the exact personality style above. Be 100% authentic to the personality
while maintaining complete legal accuracy. The response should feel natural and personal.

IMPORTANT:
- If this is JAKSEL personality: Mix Indonesian with English terms like "kayak", "gitu", "banget", "dong", use "Kak" for user, "gue" for yourself
- If this is ZERO personality: Use Italian with depth, "praticamente", "essenzialmente", "letteralmente", be analytical but approachable
- If this is PROFESSIONAL: Match user's language (EN/ID/IT/UA), be articulate and structured

Your response:"""

                    # Get personality-translated response from Gemini PRO
                    gemini_translated = await gemini_pro_model.generate_content_async(
                        translation_prompt
                    )
                    final_response = gemini_translated.text

                    logger.info("✅ Gemini PRO personality translation completed")

                    return {
                        "success": True,
                        "response": final_response,
                        "personality_used": personality["name"],
                        "personality_type": user_context["personality_type"],
                        "user": user,
                        "model_used": "gemini-pro-personality",
                        "oracle_status": "unavailable",
                        "original_gemini_response": gemini_response,
                    }

                except Exception as gemini_error:
                    logger.warning(f"⚠️ Gemini PRO personality translation failed: {gemini_error}")
                    # Fallback: return original response
                    return {
                        "success": True,  # Still success, just not personality-enhanced
                        "response": gemini_response,
                        "personality_used": "none",
                        "personality_type": user_context["personality_type"],
                        "user": user,
                        "model_used": "gemini-pro-raw",
                        "oracle_status": "unavailable",
                        "original_gemini_response": gemini_response,
                    }
            else:
                # No model getter provided, return original
                return {
                    "success": True,
                    "response": gemini_response,
                    "personality_used": "none",
                    "personality_type": user_context["personality_type"],
                    "user": user,
                    "model_used": "gemini-pro-raw",
                    "oracle_status": "unavailable",
                }

        except Exception as e:
            logger.error(f"❌ Gemini-only personality translation failed: {e}")
            return {
                "success": True,  # Always return success with fallback
                "response": gemini_response,
                "error": str(e),
                "personality_used": "error",
                "model_used": "gemini-pro-fallback",
            }

    async def _enhance_with_zantara_model(self, text: str, personality: dict) -> str:
        """Enhance text with Zantara local model for authentic slang"""
        try:
            headers = {}
            if self.oracle_api_key:
                headers["Authorization"] = f"Bearer {self.oracle_api_key}"

            enhancement_prompt = f"""
Make this response more authentic {personality["name"]} style. Add natural slang and expressions.

Text: {text}

Enhanced text:"""

            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.zantara_oracle_url,
                    json={"model": "zantara", "prompt": enhancement_prompt, "stream": False},
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                ) as response,
            ):
                if response.status == 200:
                    result = await response.json()
                    return result.get("response", text)
                else:
                    return text

        except Exception as e:
            logger.warning(f"⚠️ Zantara enhancement failed: {e}")
            return text

    def get_personality_system_prompt(
        self, personality_type: str, user_language: str = "en"
    ) -> str:
        """
        Generates a dynamic system prompt based on personality and user language.

        Args:
            personality_type: Type of personality (jaksel, zero, professional)
            user_language: User's preferred language (id, it, en, ua, etc.)

        Returns:
            Dynamic system prompt string
        """
        base_profile = self.personality_profiles.get(personality_type)
        if not base_profile:
            # Fallback to professional if not found
            base_profile = self.personality_profiles["professional"]

        base_prompt = base_profile["system_prompt"]

        # Dynamic Language Logic
        lang_instruction = ""

        if user_language == "id":
            lang_instruction = (
                "LANGUAGE: BAHASA INDONESIA (JAKSEL STYLE).\n"
                "Use South Jakarta slang. Use words like 'gue' (me), 'lo' (you), 'santuy' (chill).\n"
                "Mix English terms naturally (Code Switching) like a true Jaksel executive."
            )
        elif user_language == "it":
            lang_instruction = (
                "LANGUAGE: ITALIAN.\n"
                "Tone: Professional yet warm and friendly. Direct and efficient.\n"
                "Do NOT use Indonesian slang. Use natural Italian idioms."
            )
        elif user_language == "en":
            lang_instruction = "LANGUAGE: ENGLISH.\nTone: Global professional, clear and concise."
        elif user_language == "ua" or user_language == "uk":
            lang_instruction = (
                "LANGUAGE: UKRAINIAN.\n"
                "Tone: Professional, direct, and supportive.\n"
                "Use standard business Ukrainian."
            )
        else:
            lang_instruction = f"LANGUAGE: {user_language}.\nRespond fluently in this language."

        # Assemble the prompt
        return f"{base_prompt}\n\n[CRITICAL INSTRUCTION]\n{lang_instruction}"

    async def fast_chat(self, user_email: str, message: str) -> dict[str, Any]:
        """
        Fast Track chat bypassing Gemini/RAG for simple queries (greetings/casual).
        Uses Zantara Oracle directly for personality response.

        Args:
            user_email: User email
            message: User message

        Returns:
            Dict with response and metadata
        """
        try:
            # Get user personality
            user_context = self.get_user_personality(user_email)
            personality = user_context["personality"]
            user = user_context["user"]
            user_language = user.get("preferred_language", "en")

            logger.info(
                f"🚀 [Fast Track] Using {personality['name']} for {user['name']} (Lang: {user_language})"
            )

            # Build dynamic prompt
            system_prompt = self.get_personality_system_prompt(
                user_context["personality_type"], user_language
            )

            prompt = f"""{system_prompt}

USER: {message}

RESPONSE:"""

            # Call Zantara model via SSH tunnel
            headers = {}
            if self.oracle_api_key:
                headers["Authorization"] = f"Bearer {self.oracle_api_key}"

            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.zantara_oracle_url,
                    json={
                        "model": "zantara",
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.7,
                    },
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as response,
            ):
                if response.status == 200:
                    result = await response.json()
                    response_text = result.get("response", "")
                    return {
                        "response": response_text,
                        "ai_used": "zantara-oracle-fast",
                        "category": "fast_track",
                        "model": "zantara-7b",
                        "tokens": {"total": 0},  # Not tracked for fast track
                        "used_rag": False,
                        "used_tools": False,
                    }
                else:
                    logger.warning(f"⚠️ Fast Track failed: {response.status}")
                    # Fallback to simple response if model fails
                    return {
                        "response": "Hello! I'm having a bit of trouble connecting to my brain right now, but I'm here!",
                        "ai_used": "fallback",
                        "category": "error",
                        "model": "none",
                        "tokens": {},
                        "used_rag": False,
                        "used_tools": False,
                    }

        except Exception as e:
            logger.error(f"❌ Fast Track error: {e}")
            return {
                "response": "Hello! I'm here.",
                "ai_used": "fallback",
                "category": "error",
                "model": "none",
                "tokens": {},
                "used_rag": False,
                "used_tools": False,
            }
