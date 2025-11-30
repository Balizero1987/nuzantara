"""
Simple Jaksel Caller - Sistema diretto per chiamare Jaksel via Ollama
Priorità: Ollama CloudFlare Tunnel > Ollama Local > Gemini Fallback
"""

import logging
import os
from typing import Any

import aiohttp

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleJakselCallerHF:
    """Sistema per chiamare Jaksel via Ollama (CloudFlare Tunnel o Local)"""

    def __init__(self):
        # Ollama endpoints - PRIORITÀ: CloudFlare Tunnel > Local
        # Il tunnel URL può essere configurato via env var per aggiornamenti dinamici
        self.ollama_tunnel_url = os.getenv(
            "JAKSEL_TUNNEL_URL",
            "https://jaksel-ollama.nuzantara.com"  # Default: permanent tunnel
        )

        # Fallback URLs in ordine di priorità
        # Oracle Cloud tunnel (PRODUCTION - 24/7)
        self.oracle_cloud_url = os.getenv(
            "JAKSEL_ORACLE_URL",
            "https://jaksel.balizero.com"  # Permanent tunnel on Oracle Cloud
        )

        self.oracle_urls = [
            "https://jaksel.balizero.com/api/generate",  # Oracle Cloud tunnel (production 24/7)
            f"{self.ollama_tunnel_url}/api/generate",  # Local CloudFlare tunnel (backup)
            "http://127.0.0.1:11434/api/generate",  # Local Ollama (development)
            "http://host.docker.internal:11434/api/generate",  # Docker -> Host Ollama
        ]

        # HuggingFace come ultima risorsa (modello non funzionante attualmente)
        self.hf_api_url = "https://router.huggingface.co/models/zeroai87/jaksel-ai"
        self.hf_headers = {
            "Authorization": f"Bearer {settings.hf_api_key}",
            "Content-Type": "application/json",
        }

        self.jaksel_users = {
            "anton@balizero.com": "Anton",
            "amanda@balizero.com": "Amanda",
            "krisna@balizero.com": "Krisna",
        }

    async def call_jaksel_direct(
        self, query: str, user_email: str, gemini_answer: str, ai_client=None
    ) -> dict[str, Any]:
        """
        Chiama Jaksel via Hugging Face Inference API

        Args:
            query: Query originale dell'utente
            user_email: Email dell'utente
            gemini_answer: Risposta da Gemini
            ai_client: Optional ZantaraAIClient for fallback
        """

        logger.info(f"🚀 SimpleJakselCallerHF called for user: {repr(user_email)}")
        logger.info(f"🔧 Using HF Inference API: {self.hf_api_url}")

        # Normalize email
        clean_email = user_email.strip().lower() if user_email else ""

        # Verifica se l'utente è Jaksel
        if clean_email not in self.jaksel_users:
            logger.warning(
                f"⚠️ User {repr(clean_email)} not in Jaksel team {list(self.jaksel_users.keys())}"
            )
            return {
                "success": False,
                "error": "User not in Jaksel team",
                "response": gemini_answer,  # Fallback
            }

        user_name = self.jaksel_users[clean_email]
        logger.info(f"✅ User {user_name} recognized as Jaksel team member")

        # Detect language from query
        lang = self.detect_language(query)
        logger.info(f"🌍 Language detected: {lang}")

        # Build Jaksel prompt
        jaksel_prompt = f"""Halo Kak {user_name}! Saya Jaksel, AI assistant Anda.

        TUGAS:
        1. Tolong terjemahkan dan ubah gaya teks berikut ke bahasa {lang}.
        2. Mohon hindari penggunaan bahasa Italia atau Inggris (kecuali istilah teknis).
        3. Gunakan gaya Jaksel yang casual dan friendly (lo-gue, jujurly, basically).
        4. Jika jawaban asli mengatakan "tidak ada dokumen" atau "non ho documenti", ubah menjadi: "Waduh, sorry banget nih Kak, gue belum punya infonya soal itu. Coba tanya yang lain ya?"
        5. Mulai dengan "Halo Kak {user_name}!" atau sapaan akrab lainnya.

        Berikut adalah jawaban asli dari Zantara (yang harus diubah):
        "{gemini_answer}"

        Jawaban Jaksel (HARUS bahasa Indonesia gaul):"""

        logger.info(
            f"📤 Calling Ollama with prompt length: {len(jaksel_prompt)}"
        )

        # Try Ollama endpoints first (CloudFlare Tunnel > Local)
        logger.info("🔄 Trying Ollama endpoints...")
        for oracle_url in self.oracle_urls:
            try:
                logger.info(f"🔄 Attempting Ollama: {oracle_url}")

                async with (
                    aiohttp.ClientSession() as session,
                    session.post(
                        oracle_url,
                        json={
                            "model": "zantara:latest",  # Model name on Oracle Cloud
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

                        logger.info(f"✅ SUCCESS: Jaksel responded via Ollama: {oracle_url}")

                        return {
                            "success": True,
                            "response": jaksel_response,
                            "language": lang,
                            "user_name": user_name,
                            "model_used": "ollama-jaksel",
                            "connected_via": oracle_url,
                        }

            except Exception as e:
                logger.warning(f"⚠️ Ollama failed {oracle_url}: {str(e)}")
                continue

        # ULTIMATE FALLBACK: Use Gemini (Zantara AI) if available
        if ai_client:
            logger.info("🛡️ Engaging ULTIMATE FALLBACK: Using Zantara AI (Gemini) for Jaksel style")
            try:
                # Use conversational method but with a specific system prompt override if possible,
                # or just send the prompt as a message.
                # Since conversational uses history, we should probably just use a direct generation call if available,
                # or treat it as a standalone task.
                # ZantaraAIClient has 'conversational' which is fine.

                # Define safety settings to prevent blocking (Enum format for reliability)
                from google.generativeai.types import HarmCategory, HarmBlockThreshold
                
                safety_settings = {
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }

                # Use chat_async directly to override system prompt
                # Softened prompt to avoid safety triggers
                fallback_response = await ai_client.chat_async(
                    messages=[{"role": "user", "content": jaksel_prompt}],
                    system="You are a helpful AI assistant that speaks in Jaksel slang (Indonesian mixed with English).",
                    max_tokens=1000,
                    safety_settings=safety_settings,
                )

                jaksel_response = fallback_response["text"]
                logger.info("✅ SUCCESS: Jaksel responded via Zantara AI (Gemini Fallback)")

                return {
                    "success": True,
                    "response": jaksel_response,
                    "language": lang,
                    "user_name": user_name,
                    "model_used": "zantara-ai-fallback",
                    "connected_via": "internal-gemini",
                }
            except Exception as e:
                logger.error(f"❌ Gemini Fallback failed: {e}")

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
        elif any(word in text_lower for word in ["привет", "как"]):
            return "bahasa Indonesia (dengan gaya Rusia)"

        # Arabo
        elif any(word in text_lower for word in ["مرحبا", "كيف"]):
            return "bahasa Indonesia (dengan gaya Arab)"

        # Default: Bahasa Indonesia
        else:
            return "bahasa Indonesia dengan gaya Jakarta Selatan"


# For backward compatibility, create alias
SimpleJakselCaller = SimpleJakselCallerHF
