"""
Simple Jaksel Caller - Sistema diretto per chiamare Jaksel (Hugging Face)

DEPRECATED: Use simple_jaksel_caller_translation.py instead.
This file is kept for reference but is not imported anywhere.
"""

import logging
from typing import Any

import aiohttp

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleJakselCallerHF:
    """Sistema semplice e diretto per chiamare Jaksel via Hugging Face Inference API"""

    def __init__(self):
        # Hugging Face Inference API endpoints
        self.hf_api_url = "https://api-inference.huggingface.co/models/zeroai87/jaksel-ai"
        self.hf_headers = {
            "Authorization": f"Bearer {settings.hf_api_key}",
            "Content-Type": "application/json",
        }

        # Fallback URLs per compatibilità
        self.oracle_urls = [
            "https://zeroai87-jaksel-ai.hf.space/api/generate",  # Hugging Face Spaces (se attivo)
            "https://jaksel-ollama.nuzantara.com/api/generate",  # CloudFlare tunnel (fallback)
            "https://raylene-unexasperated-cretaceously.ngrok-free.dev/api/generate",  # Fallback ngrok tunnel
            "http://127.0.0.1:11434/api/generate",  # Direct connection (for local testing)
        ]

        self.jaksel_users = {
            "anton@balizero.com": "Anton",
            "amanda@balizero.com": "Amanda",
            "krisna@balizero.com": "Krisna",
        }

    async def call_jaksel_direct(
        self, query: str, user_email: str, gemini_answer: str
    ) -> dict[str, Any]:
        """
        Chiama Jaksel via Hugging Face Inference API

        Args:
            query: Query originale dell'utente
            user_email: Email dell'utente
            gemini_answer: Risposta da Gemini

        Returns:
            Dict con risposta di Jaksel
        """

        logger.info(f"🚀 SimpleJakselCallerHF called for user: {user_email}")
        logger.info(f"🔧 Using HF Inference API: {self.hf_api_url}")

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

        logger.info(
            f"📤 Calling Hugging Face Inference API with prompt length: {len(jaksel_prompt)}"
        )

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
                        jaksel_response = jaksel_response.replace(jaksel_prompt, "").strip()

                    # Fallback if empty
                    if not jaksel_response:
                        jaksel_response = gemini_answer

                    logger.info("✅ SUCCESS: Jaksel responded via HF Inference API")
                    logger.info(f"📝 Jaksel response length: {len(jaksel_response)}")

                    return {
                        "success": True,
                        "response": jaksel_response,
                        "language": lang,
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

                        logger.info(f"✅ SUCCESS: Jaksel responded via fallback: {oracle_url}")

                        return {
                            "success": True,
                            "response": jaksel_response,
                            "language": lang,
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

        return {
            "success": False,
            "error": "All endpoints failed",
            "response": jaksel_fallback,
            "model_used": "fallback-jaksel-style",
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


# For backward compatibility, create alias
SimpleJakselCaller = SimpleJakselCallerHF
