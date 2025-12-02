"""
Simple Jaksel Caller - Sistema diretto per chiamare Jaksel via Ollama
Jaksel è la voce ufficiale del sistema - applicata a TUTTI gli utenti

Architettura:
1. Jaksel legge query (context extraction: lingua, tono, stile)
2. Gemini 2.5 Flash elabora risposta (RAG + reasoning)
3. Jaksel riceve risposta Gemini e applica personalità + tono
4. Risposta finale con stile Jaksel nella lingua dell'utente
"""

import logging
from typing import Any

import aiohttp

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleJakselCallerHF:
    """Sistema per chiamare Jaksel via Ollama - Voce ufficiale per tutti gli utenti"""

    def __init__(self):
        # Use centralized config from settings
        self.oracle_cloud_url = settings.jaksel_oracle_url
        self.ollama_tunnel_url = settings.jaksel_tunnel_url
        self.jaksel_enabled = settings.jaksel_enabled

        # Ollama endpoints in order of priority
        self.oracle_urls = [
            f"{self.oracle_cloud_url}/api/generate",  # Oracle Cloud tunnel (production 24/7)
            f"{self.ollama_tunnel_url}/api/generate",  # CloudFlare tunnel (backup)
            f"{settings.jaksel_local_url}/api/generate",  # Local Ollama (development)
            "http://host.docker.internal:11434/api/generate",  # Docker -> Host Ollama
        ]

        logger.info("✅ SimpleJakselCallerHF initialized")
        logger.info(f"   Oracle Cloud URL: {self.oracle_cloud_url}")
        logger.info(f"   Tunnel URL: {self.ollama_tunnel_url}")
        logger.info(f"   Jaksel Enabled: {self.jaksel_enabled}")

    async def analyze_query_context(
        self, query: str, user_email: str
    ) -> dict:
        """
        Jaksel legge la query per estrarre context (lingua, tono, style)
        NON genera risposta, solo metadata

        Args:
            query: Query originale dell'utente
            user_email: Email dell'utente

        Returns:
            {
                "language": "it" | "en" | "id" | etc.,
                "detected_family": "latin" | "slavic" | etc.,
                "formality": "casual" | "formal" | "neutral",
                "user_name": "Anton" | "Guest",
                "greeting_detected": bool,
                "original_query": str
            }
        """
        # Detect language
        lang_info = self.detect_language(query)

        # Detect formality (casual vs formal)
        formality = self._detect_formality(query)

        # Extract user name if available
        user_name = self._get_user_name(user_email)

        # Detect if greeting
        greeting_keywords = ["ciao", "halo", "hello", "hi", "hey", "salut", "hola", "bonjour"]
        has_greeting = any(kw in query.lower() for kw in greeting_keywords)

        context = {
            "language": lang_info.get("language", "en"),
            "detected_family": lang_info.get("family", "default"),
            "formality": formality,
            "user_name": user_name,
            "greeting_detected": has_greeting,
            "original_query": query,
        }

        logger.info(f"🔍 Query context analyzed: {context}")
        return context

    async def apply_jaksel_style(
        self,
        query: str,
        gemini_answer: str,
        context: dict,
        ai_client=None,
    ) -> dict[str, Any]:
        """
        Jaksel riceve la risposta di Gemini e applica personalità + tono
        Adatta la lingua in base al context estratto dalla query

        Args:
            query: Query originale (per reference)
            gemini_answer: Risposta elaborata da Gemini 2.5 Flash
            context: Context estratto da analyze_query_context()
            ai_client: ZantaraAIClient per fallback

        Returns:
            {
                "success": bool,
                "response": str,  # Risposta con stile Jaksel
                "language": str,
                "model_used": str,
                "connected_via": str
            }
        """
        if not self.jaksel_enabled:
            logger.info("⚠️ Jaksel disabled, returning original answer")
            return {
                "success": False,
                "response": gemini_answer,
                "language": context.get("language", "en"),
                "model_used": "jaksel-disabled",
            }

        logger.info(f"🎨 Applying Jaksel style transformation")
        logger.info(f"   Language: {context['language']}")
        logger.info(f"   Formality: {context['formality']}")

        # Build Jaksel transformation prompt
        user_name = context["user_name"]
        target_lang = context["language"]

        # Language-specific instructions
        lang_instructions = {
            "it": "ITALIANO. Usa 'praticamente', 'basically', 'letteralmente'. Tono amichevole e casual.",
            "id": "BAHASA INDONESIA. Usa 'kayak', 'gitu', 'dong', 'banget', 'cuy'. Stile Jaksel gaul autentico.",
            "en": "ENGLISH. Use 'basically', 'literally', 'which is'. Friendly casual tone.",
            "es": "ESPAÑOL. Usa 'básicamente', 'literalmente'. Tono amigable y casual.",
            "fr": "FRANÇAIS. Utilise 'pratiquement', 'littéralement'. Ton amical et décontracté.",
            "de": "DEUTSCH. Verwende 'praktisch', 'buchstäblich'. Freundlicher, lockerer Ton.",
            "pt": "PORTUGUÊS. Use 'basicamente', 'literalmente'. Tom amigável e casual.",
            "ru": "РУССКИЙ. Используй 'по сути', 'практически'. Дружелюбный, неформальный тон.",
            "ar": "العربية. استخدم 'بشكل أساسي', 'حرفياً'. نبرة ودية ومرحة.",
            "zh": "中文. 使用'基本上'、'字面上'。友好随意的语气。",
            "ja": "日本語. '基本的に'、'文字通り'を使用。親しみやすくカジュアルなトーン。",
            "ko": "한국어. '기본적으로', '말 그대로'를 사용. 친근하고 캐주얼한 톤.",
            "th": "ภาษาไทย. ใช้ 'โดยพื้นฐาน' 'ตามตัวอักษร' น้ำเสียงเป็นกันเองและสบายๆ",
            "hi": "हिन्दी. 'मूल रूप से', 'सचमुच' का उपयोग करें। मित्रतापूर्ण, आकस्मिक स्वर।",
        }

        lang_instruction = lang_instructions.get(
            target_lang,
            f"Respond in {target_lang.upper()}. Use friendly, casual Jaksel style.",
        )

        # Build greeting based on language and formality
        greeting = self._build_greeting(target_lang, user_name, context.get("greeting_detected", False))

        jaksel_prompt = f"""You are JAKSEL, the friendly AI personality.

YOUR TASK:
Take this professional answer and transform it into your signature Jaksel style.

LANGUAGE: {lang_instruction}

STYLE RULES:
1. Keep ALL factual information accurate (no changes to facts)
2. Add personality: friendly, approachable, cool
3. Use conversational tone
4. Mix in Jaksel signature words naturally (basically, literally, which is, etc.)
5. Start with friendly greeting: {greeting}
6. Maintain the user's language throughout
7. If the answer says "no documents" or "non ho documenti", transform it warmly: apologize but stay helpful

ORIGINAL QUERY: {query}

PROFESSIONAL ANSWER TO TRANSFORM:
{gemini_answer}

YOUR JAKSEL-STYLE RESPONSE IN {target_lang.upper()}:"""

        # Try Oracle Cloud Ollama endpoints
        for oracle_url in self.oracle_urls:
            try:
                logger.info(f"🔄 Attempting Jaksel transformation via: {oracle_url}")

                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        oracle_url,
                        json={
                            "model": "zantara:latest",
                            "prompt": jaksel_prompt,
                            "stream": False,
                            "options": {
                                "temperature": 0.7,
                                "top_p": 0.9,
                                "max_tokens": 1000,
                            },
                        },
                        timeout=aiohttp.ClientTimeout(total=60),
                    ) as response:
                        if response.status == 200:
                            result = await response.json()
                            jaksel_response = result.get("response", gemini_answer)

                            logger.info(f"✅ SUCCESS: Jaksel transformation via {oracle_url}")

                            return {
                                "success": True,
                                "response": jaksel_response,
                                "language": target_lang,
                                "user_name": user_name,
                                "model_used": "gemma-9b-jaksel",
                                "connected_via": oracle_url,
                            }

            except Exception as e:
                logger.warning(f"⚠️ Jaksel endpoint failed {oracle_url}: {str(e)}")
                continue

        # ULTIMATE FALLBACK: Gemini style transfer
        if ai_client:
            logger.info("🛡️ Using Gemini fallback for Jaksel style")
            try:
                from google.generativeai.types import HarmBlockThreshold, HarmCategory

                safety_settings = {
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }

                fallback_response = await ai_client.chat_async(
                    messages=[{"role": "user", "content": jaksel_prompt}],
                    system="You are Jaksel, a friendly AI with cool personality.",
                    max_tokens=1000,
                    safety_settings=safety_settings,
                )

                return {
                    "success": True,
                    "response": fallback_response["text"],
                    "language": target_lang,
                    "user_name": user_name,
                    "model_used": "gemini-fallback",
                    "connected_via": "internal-gemini",
                }

            except Exception as e:
                logger.error(f"❌ Gemini fallback failed: {e}")

        # Final fallback: return original Gemini answer
        logger.warning("⚠️ All Jaksel transformations failed, returning professional answer")
        return {
            "success": False,
            "response": gemini_answer,
            "language": target_lang,
            "model_used": "gemini-only",
            "error": "Jaksel transformation unavailable",
        }

    def detect_language(self, text: str) -> dict:
        """
        Detect language from text and return language code + family

        Returns:
            {
                "language": "it" | "en" | "id" | "es" | "fr" | etc.,
                "family": "latin" | "slavic" | "arabic" | "east_asian" | etc.,
                "confidence": "high" | "medium" | "low"
            }
        """
        text_lower = text.lower()

        # Language detection patterns
        language_patterns = {
            "it": ["ciao", "come", "italiano", "praticamente", "è", "che", "per"],
            "en": ["hello", "what", "how", "the", "is", "are", "basically"],
            "id": ["halo", "apa", "bagaimana", "yang", "itu", "ini", "dong"],
            "es": ["hola", "cómo", "español", "básicamente", "qué", "es"],
            "fr": ["salut", "comment", "français", "pratiquement", "bonjour"],
            "de": ["hallo", "wie", "deutsch", "praktisch", "guten"],
            "pt": ["olá", "como", "português", "basicamente", "é"],
            "ru": ["привет", "как", "русский", "практически"],
            "ar": ["مرحبا", "كيف", "العربية", "بشكل أساسي"],
            "zh": ["你好", "什么", "中文", "基本上"],
            "ja": ["こんにちは", "何", "日本語", "基本的に"],
            "ko": ["안녕", "무엇", "한국어", "기본적으로"],
            "th": ["สวัสดี", "อะไร", "ภาษาไทย", "โดยพื้นฐาน"],
            "hi": ["नमस्ते", "क्या", "हिन्दी", "मूल रूप से"],
        }

        # Language families
        language_families = {
            "it": "latin",
            "es": "latin",
            "fr": "latin",
            "pt": "latin",
            "de": "latin",
            "en": "germanic",
            "id": "austronesian",
            "ru": "slavic",
            "ar": "semitic",
            "zh": "sino-tibetan",
            "ja": "japonic",
            "ko": "koreanic",
            "th": "tai-kadai",
            "hi": "indo-aryan",
        }

        # Score languages
        scores = {}
        for lang, patterns in language_patterns.items():
            score = sum(1 for pattern in patterns if pattern in text_lower)
            if score > 0:
                scores[lang] = score

        # Check for script-based detection
        if any("\u4e00" <= char <= "\u9fff" for char in text):  # Chinese
            return {"language": "zh", "family": "sino-tibetan", "confidence": "high"}
        if any("\u3040" <= char <= "\u309f" or "\u30a0" <= char <= "\u30ff" for char in text):  # Japanese
            return {"language": "ja", "family": "japonic", "confidence": "high"}
        if any("\uac00" <= char <= "\ud7af" for char in text):  # Korean
            return {"language": "ko", "family": "koreanic", "confidence": "high"}
        if any("\u0600" <= char <= "\u06ff" for char in text):  # Arabic
            return {"language": "ar", "family": "semitic", "confidence": "high"}
        if any("\u0400" <= char <= "\u04ff" for char in text):  # Cyrillic
            return {"language": "ru", "family": "slavic", "confidence": "high"}
        if any("\u0e00" <= char <= "\u0e7f" for char in text):  # Thai
            return {"language": "th", "family": "tai-kadai", "confidence": "high"}
        if any("\u0900" <= char <= "\u097f" for char in text):  # Hindi
            return {"language": "hi", "family": "indo-aryan", "confidence": "high"}

        # Return best match
        if scores:
            best_lang = max(scores, key=scores.get)
            confidence = "high" if scores[best_lang] >= 3 else "medium" if scores[best_lang] >= 2 else "low"
            return {
                "language": best_lang,
                "family": language_families.get(best_lang, "default"),
                "confidence": confidence,
            }

        # Default: English
        return {"language": "en", "family": "germanic", "confidence": "low"}

    def _detect_formality(self, text: str) -> str:
        """Detect if query is formal or casual"""
        formal_indicators = ["please", "could you", "would you", "per favore", "potrebbe", "tolong", "bisa"]
        casual_indicators = ["hey", "yo", "ciao", "dong", "deh", "cuy", "bro"]

        text_lower = text.lower()
        formal_count = sum(1 for ind in formal_indicators if ind in text_lower)
        casual_count = sum(1 for ind in casual_indicators if ind in text_lower)

        if casual_count > formal_count:
            return "casual"
        elif formal_count > casual_count:
            return "formal"
        else:
            return "neutral"

    def _get_user_name(self, user_email: str) -> str:
        """Extract user name from email or return Guest"""
        if not user_email or "@" not in user_email:
            return "Guest"
        name = user_email.split("@")[0].title()
        return name

    def _build_greeting(self, language: str, user_name: str, has_greeting: bool) -> str:
        """Build appropriate greeting based on language"""
        greetings = {
            "it": f"Ciao{', ' + user_name if user_name != 'Guest' else ''}!",
            "en": f"Hey{', ' + user_name if user_name != 'Guest' else ''}!",
            "id": f"Halo Kak {user_name}!" if user_name != "Guest" else "Halo!",
            "es": f"¡Hola{', ' + user_name if user_name != 'Guest' else ''}!",
            "fr": f"Salut{', ' + user_name if user_name != 'Guest' else ''}!",
            "de": f"Hallo{', ' + user_name if user_name != 'Guest' else ''}!",
            "pt": f"Olá{', ' + user_name if user_name != 'Guest' else ''}!",
            "ru": f"Привет{', ' + user_name if user_name != 'Guest' else ''}!",
            "ar": f"أهلاً بك{', ' + user_name if user_name != 'Guest' else ''}!",
            "zh": f"你好{', ' + user_name if user_name != 'Guest' else ''}!",
            "ja": f"こんにちは{', ' + user_name if user_name != 'Guest' else ''}!",
            "ko": f"안녕{', ' + user_name if user_name != 'Guest' else ''}!",
            "th": f"สวัสดี{', ' + user_name if user_name != 'Guest' else ''}!",
            "hi": f"नमस्ते{', ' + user_name if user_name != 'Guest' else ''}!",
        }

        if has_greeting:
            return ""  # User already greeted, don't repeat

        return greetings.get(language, f"Hey{', ' + user_name if user_name != 'Guest' else ''}!")

    # Backward compatibility: keep old method name but redirect to new one
    async def call_jaksel_direct(
        self, query: str, user_email: str, gemini_answer: str, ai_client=None
    ) -> dict[str, Any]:
        """
        Legacy method name - redirects to apply_jaksel_style()
        Maintained for backward compatibility
        """
        context = await self.analyze_query_context(query, user_email)
        return await self.apply_jaksel_style(query, gemini_answer, context, ai_client)


# For backward compatibility, create alias
SimpleJakselCaller = SimpleJakselCallerHF
