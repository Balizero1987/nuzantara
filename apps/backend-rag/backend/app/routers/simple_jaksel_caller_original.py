"""
Simple Jaksel Caller - Sistema diretto per chiamare Jaksel (Gemma 9B)
"""

import logging
from typing import Any

import aiohttp

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleJakselCaller:
    """Sistema semplice e diretto per chiamare Jaksel"""

    def __init__(self):
        # Multiple connection attempts for better reliability
        self.oracle_urls = [
            "https://zeroai87-jaksel-ai.hf.space/api/generate",  # Hugging Face Spaces (FREE GPU!)
            "https://jaksel-ollama.nuzantara.com/api/generate",  # CloudFlare tunnel (fallback)
            "https://raylene-unexasperated-cretaceously.ngrok-free.dev/api/generate",  # Fallback ngrok tunnel
            "http://127.0.0.1:11434/api/generate",  # Direct connection (for local testing)
        ]

        # Fallback URL se settings non ha l'URL corretto
        oracle_url = getattr(settings, "zantara_oracle_url", None)
        if oracle_url and "nlgate.nusantaracorp.com" not in oracle_url:
            self.oracle_urls.insert(0, oracle_url)  # Prefer Oracle Cloud if available
            logger.info(f"🔗 Using Oracle URL from settings: {oracle_url}")
        else:
            logger.info("🔗 Using ngrok tunnel to local Mac")

        self.api_key = settings.oracle_api_key or ""
        self.jaksel_users = {
            "anton@balizero.com": "Anton",
            "amanda@balizero.com": "Amanda",
            "krisna@balizero.com": "Krisna",
        }

    async def call_jaksel_direct(
        self, query: str, user_email: str, gemini_answer: str
    ) -> dict[str, Any]:
        """
        Chiama Jaksel (Gemma 9B) in modo diretto

        Args:
            query: Query originale dell'utente
            user_email: Email dell'utente
            gemini_answer: Risposta da Gemini

        Returns:
            Dict con risposta di Jaksel
        """

        logger.info(f"🚨 SimpleJakselCaller called for user: {user_email}")
        logger.info(f"🔧 Available Oracle URLs: {self.oracle_urls}")
        logger.info(f"🔑 API Key set: {'Yes' if self.api_key else 'No'}")

        # Verifica se l'utente è Jaksel
        if user_email not in self.jaksel_users:
            logger.warning(f"⚠️ User {user_email} not in Jaksel team")
            return {
                "success": False,
                "error": "User not in Jaksel team",
                "response": gemini_answer,  # Fallback
            }

        user_name = self.jaksel_users[user_email]
        logger.info(f"✅ User {user_name} recognized as Jaksel team member")

        # Detect language from query
        lang = self.detect_language(query)
        logger.info(f"🌍 Language detected: {lang}")

        # Build Jaksel prompt
        jaksel_prompt = f"""Halo Kak {user_name}! Saya Jaksel, AI assistant Anda.

User query: {query}
Professional answer: {gemini_answer}

TUGAS:
1. Jawab dalam bahasa {lang}
2. Gunakan gaya Jaksel yang casual dan friendly
3. Jangan gunakan bahasa Inggris
4. Pertahankan semua informasi akurat dari jawaban professional

Jawaban Jaksel dalam bahasa {lang}:"""

        logger.info(f"📤 Calling Oracle Cloud with prompt length: {len(jaksel_prompt)}")

        # Try each URL in sequence
        last_error = None

        for i, oracle_url in enumerate(self.oracle_urls):
            try:
                logger.info(
                    f"🔄 Attempting connection {i + 1}/{len(self.oracle_urls)}: {oracle_url}"
                )

                headers = {}
                if self.api_key and not oracle_url.startswith(
                    "http://127.0.0.1"
                ):  # Only add auth for external URLs
                    headers["Authorization"] = f"Bearer {self.api_key}"

                async with (
                    aiohttp.ClientSession() as session,
                    session.post(
                        oracle_url,
                        json={
                            "model": "zantara:latest",
                            "prompt": jaksel_prompt,
                            "stream": False,
                            "options": {"temperature": 0.7, "top_p": 0.9, "max_tokens": 1000},
                        },
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(
                            total=60
                        ),  # Increased timeout for ngrok latency
                    ) as response,
                ):
                    logger.info(f"📡 Oracle response status: {response.status}")

                    if response.status == 200:
                        result = await response.json()
                        jaksel_response = result.get("response", gemini_answer)

                        logger.info(f"✅ SUCCESS: Jaksel responded for {user_email} in {lang}")
                        logger.info(f"📝 Jaksel response length: {len(jaksel_response)}")
                        logger.info(f"🎯 Connected via: {oracle_url}")

                        return {
                            "success": True,
                            "response": jaksel_response,
                            "language": lang,
                            "user_name": user_name,
                            "model_used": "zantara-oracle-jaksel",
                            "connected_via": oracle_url,
                        }
                    else:
                        error_text = await response.text()
                        last_error = f"Oracle API error: {response.status} - {error_text}"
                        logger.warning(f"⚠️ Failed attempt {i + 1}: {last_error}")
                        continue

            except Exception as e:
                last_error = str(e)
                logger.warning(f"⚠️ Failed attempt {i + 1}: {last_error}")
                continue

        # All attempts failed - create a Jaksel-style fallback response
        logger.error(f"❌ All connection attempts failed for {user_email}")

        jaksel_fallback = f"""Halo Kak {user_name}! Maaf banget nih, Jaksel lagi nggak bisa konek ke server sekarang.

Coba lagi ya sebentar! Sementara ini, jawaban profesionalnya:

{gemini_answer}

Jaksel bakal balik dengan gaya yang lebih asyik lagi kalau server udah normal lagi! 😊"""

        return {
            "success": False,
            "error": last_error or "Unknown error",
            "response": jaksel_fallback,
            "model_used": "gemini-fallback-jaksel-style",
        }

    def detect_language(self, text: str) -> str:
        """Detecta lingua in modo semplice"""
        text_lower = text.lower()

        # Italiano
        if any(word in text_lower for word in ["ciao", "come", "italiano", "praticamente"]):
            return "bahasa Indonesia (dengan gaya Italia)"

        # Spagnolo
        elif any(word in text_lower for word in ["hola", "cómo", "español", "básicamente"]):
            return "bahasa Indonesia (dengan gaya Spanyol)"

        # Francese
        elif any(word in text_lower for word in ["salut", "comment", "français"]):
            return "bahasa Indonesia (dengan gaya Perancis)"

        # Cinese
        elif any(char in text for char in "你好吗"):
            return "bahasa Indonesia (dengan gaya Mandarin)"

        # Russo
        elif any(char in text for char in "привет как"):
            return "bahasa Indonesia (dengan gaya Rusia)"

        # Arabo
        elif any(char in text for char in "مرحبا كيف"):
            return "bahasa Indonesia (dengan gaya Arab)"

        # Default: Bahasa Indonesia
        else:
            return "bahasa Indonesia dengan gaya Jakarta Selatan"
