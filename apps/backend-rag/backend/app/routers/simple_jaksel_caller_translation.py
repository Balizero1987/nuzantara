"""
SimpleJakselCaller con Translation Layer per italiano
"""

import logging
from typing import Any

import aiohttp

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleJakselCallerTranslation:
    """Sistema Jaksel con translation layer per supporto italiano completo"""

    def __init__(self):
        # Hugging Face Inference API endpoints
        self.hf_api_url = "https://api-inference.huggingface.co/models/zeroai87/jaksel-ai"
        self.hf_headers = {
            "Authorization": f"Bearer {settings.hf_api_key}",
            "Content-Type": "application/json",
        }

        # Fallback URLs per compatibilità
        self.oracle_urls = [
            "https://zeroai87-jaksel-ai.hf.space/api/generate",
            "https://jaksel-ollama.nuzantara.com/api/generate",
            "https://raylene-unexasperated-cretaceously.ngrok-free.dev/api/generate",
            "http://127.0.0.1:11434/api/generate",
        ]

        self.jaksel_users = {
            "anton@balizero.com": "Anton",
            "amanda@balizero.com": "Amanda",
            "krisna@balizero.com": "Krisna",
        }

        # Translation API (Google Translate or similar)
        self.translation_api_url = "https://translate.googleapis.com/translate_a/single"

    def detect_language(self, text: str) -> str:
        """Detecta lingua del testo"""
        text_lower = text.lower()

        if any(
            word in text_lower
            for word in ["ciao", "come", "italiano", "grazie", "perfetto", "funziona", "traduzione"]
        ):
            return "Italiano"
        elif any(
            word in text_lower for word in ["halo", "apa", "bagaimana", "terima", "kasih", "baik"]
        ):
            return "Bahasa Indonesia"
        elif any(word in text_lower for word in ["hello", "how", "thank", "please", "english"]):
            return "English"
        else:
            return "Bahasa Indonesia"  # Default

    async def translate_text(self, text: str, target_lang: str = "it") -> str:
        """Traduce testo usando Google Translate API"""
        try:
            # Simple language detection and mapping
            detected = self.detect_language(text)

            # Skip translation if already in target language
            if (
                (detected == "Italiano" and target_lang == "it")
                or (detected == "Bahasa Indonesia" and target_lang == "id")
                or (detected == "English" and target_lang == "en")
            ):
                return text

            # Map languages for Google Translate
            lang_map = {"Italiano": "it", "Bahasa Indonesia": "id", "English": "en"}

            # Determine source language for translation
            source_lang = lang_map.get(detected, "id")  # Default to Indonesian

            # Only translate if we need Italian
            if target_lang != "it" or source_lang == "it":
                return text

            async with aiohttp.ClientSession() as session:
                url = f"{self.translation_api_url}?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q={aiohttp.helpers.quote(text)}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        result = await response.json()
                        translated = ""
                        if result and len(result) > 0 and result[0]:
                            for item in result[0]:
                                if item and len(item) > 0:
                                    translated += item[0]
                        return translated if translated else text
        except Exception as e:
            logger.warning(f"Translation failed: {str(e)}")

        return text  # Return original if translation fails

    def _build_jaksel_prompt(self, query: str, user_name: str, gemini_answer: str) -> str:
        """Build standard Jaksel prompt (no language forcing)"""
        prompt = f"""Halo Kak {user_name}! Saya Jaksel, AI assistant dengan gaya Jakarta Selatan yang casual dan friendly.

User query: {query}
Professional answer: {gemini_answer}

Jawab dengan gaya Jaksel yang casual dan friendly. Gunakan bahasa yang natural untuk kamu."""
        return prompt

    async def call_jaksel_with_translation(
        self, query: str, user_email: str, gemini_answer: str
    ) -> dict[str, Any]:
        """
        Chiama Jaksel e traduce se necessario
        """

        logger.info(f"🚀 SimpleJakselCallerTranslation called for user: {user_email}")

        # Verifica se l'utente è Jaksel
        if user_email not in self.jaksel_users:
            logger.warning(f"⚠️ User {user_email} not in Jaksel team")
            return {
                "success": False,
                "error": "User not in Jaksel team",
                "response": gemini_answer,  # Fallback
            }

        user_name = self.jaksel_users[user_email]

        # Detect language of original query
        query_lang = self.detect_language(query)

        logger.info(f"🌍 Query language detected: {query_lang}")
        logger.info(f"👤 User: {user_name}")
        logger.info(f"📝 Query: {query[:100]}...")

        # Build standard Jaksel prompt (no forcing)
        jaksel_prompt = self._build_jaksel_prompt(query, user_name, gemini_answer)

        logger.info(f"📤 Calling Jaksel with prompt length: {len(jaksel_prompt)}")

        # Try HF Inference API first
        try:
            async with (
                aiohttp.ClientSession() as session,
                session.post(
                    self.hf_api_url,
                    json={
                        "inputs": jaksel_prompt,
                        "parameters": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "max_new_tokens": 500,
                            "return_full_text": False,
                            "do_sample": True,
                        },
                    },
                    headers=self.hf_headers,
                    timeout=aiohttp.ClientTimeout(total=60),
                ) as response,
            ):
                logger.info(f"📡 HF Inference API response status: {response.status}")

                if response.status == 200:
                    result = await response.json()

                    # Handle HF API response format
                    if isinstance(result, list) and len(result) > 0:
                        jaksel_response = result[0].get("generated_text", "").strip()
                    elif isinstance(result, dict):
                        jaksel_response = result.get("generated_text", "").strip()
                    else:
                        jaksel_response = str(result).strip()

                    # Remove prompt from response if included
                    if jaksel_prompt in jaksel_response:
                        jaksel_response = jaksel_prompt.replace(jaksel_prompt, "").strip()

                    # Fallback if empty
                    if not jaksel_response:
                        jaksel_response = gemini_answer

                    # Apply translation if needed
                    final_response = await self._translate_response(jaksel_response, query_lang)

                    logger.info("✅ SUCCESS: Jaksel responded via HF Inference API")
                    logger.info(f"📝 Response length: {len(final_response)}")

                    return {
                        "success": True,
                        "response": final_response,
                        "original_response": jaksel_response,
                        "query_language": query_lang,
                        "translated": query_lang == "Italiano",
                        "user_name": user_name,
                        "model_used": "huggingface-jaksel-ai",
                        "connected_via": "huggingface-inference-api",
                    }
                else:
                    error_text = await response.text()
                    logger.warning(f"⚠️ HF Inference API failed: {response.status} - {error_text}")

        except Exception as e:
            logger.warning(f"⚠️ HF Inference API error: {str(e)}")

        # If HF fails, try fallback URLs
        logger.info("🔄 Trying fallback URLs...")
        for oracle_url in self.oracle_urls:
            try:
                logger.info(f"🔄 Attempting fallback: {oracle_url}")

                async with (
                    aiohttp.ClientSession() as session,
                    session.post(
                        oracle_url,
                        json={
                            "model": "zantara-jaksel:latest",
                            "prompt": jaksel_prompt,
                            "stream": False,
                            "options": {"temperature": 0.7, "top_p": 0.9, "max_tokens": 500},
                        },
                        timeout=aiohttp.ClientTimeout(total=60),
                    ) as response,
                ):
                    if response.status == 200:
                        result = await response.json()
                        jaksel_response = result.get("response", gemini_answer)

                        # Apply translation if needed
                        final_response = await self._translate_response(jaksel_response, query_lang)

                        logger.info(f"✅ SUCCESS: Jaksel responded via fallback: {oracle_url}")

                        return {
                            "success": True,
                            "response": final_response,
                            "original_response": jaksel_response,
                            "query_language": query_lang,
                            "translated": query_lang == "Italiano",
                            "user_name": user_name,
                            "model_used": "fallback-jaksel",
                            "connected_via": oracle_url,
                        }

            except Exception as e:
                logger.warning(f"⚠️ Fallback failed {oracle_url}: {str(e)}")
                continue

        # All attempts failed - create a Jaksel-style fallback response
        logger.error(f"❌ All connection attempts failed for {user_email}")

        jaksel_fallback = f"""Halo Kak {user_name}! Maaf banget nih, Jaksel lagi nggak bisa konek ke server sekarang.

Coba lagi ya sebentar! Sementara ini, jawaban profesionalnya:

{gemini_answer}

Jaksel bakal balik dengan gaya yang lebih asyik lagi kalau server udah normal lagi! 😊"""

        # Apply translation if needed
        final_fallback = await self._translate_response(jaksel_fallback, query_lang)

        return {
            "success": False,
            "error": "All endpoints failed",
            "response": final_fallback,
            "original_response": jaksel_fallback,
            "query_language": query_lang,
            "translated": query_lang == "Italiano",
            "model_used": "fallback-jaksel-style",
        }

    async def _translate_response(self, response: str, query_lang: str) -> str:
        """Translate response if query was in Italian"""

        if query_lang == "Italiano":
            # Detect if response is primarily Indonesian
            response_lower = response.lower()
            indonesian_words = [
                "halo",
                "terima",
                "kasih",
                "banget",
                "gua",
                "lu",
                "bro",
                "sis",
                "yang",
                "dengan",
                "jaksel",
            ]
            italian_words = [
                "ciao",
                "come",
                "funziona",
                "italiano",
                "sistema",
                "grazie",
                "perfetto",
            ]

            indonesian_count = sum(1 for word in indonesian_words if word in response_lower)
            italian_count = sum(1 for word in italian_words if word in response_lower)

            # If response is more Indonesian than Italian, translate it
            if indonesian_count > italian_count:
                logger.info("🔄 Translating Indonesian response to Italian...")
                translated = await self.translate_text(response, "it")

                # Add Italian Jaksel personality if needed
                if "bro" not in translated.lower() and "ciao" not in translated.lower():
                    translated = f"Ciao bro! {translated}"

                return translated

        return response


# For backward compatibility
SimpleJakselCaller = SimpleJakselCallerTranslation
