"""
SimpleJakselCallerHF versione migliorata per supporto multilingua

DEPRECATED: Use simple_jaksel_caller_translation.py instead.
This file is kept for reference but is not imported anywhere.
"""

import logging
from typing import Any

import aiohttp

from app.core.config import settings

logger = logging.getLogger(__name__)


class SimpleJakselCallerHFItalian:
    """Sistema Jaksel con supporto multilingua migliorato"""

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

    def _build_multilingual_prompt(
        self, query: str, user_name: str, gemini_answer: str, target_lang: str
    ) -> str:
        """Costruisce prompt multilingua forte basato sulla lingua target"""

        # Mapping delle lingue con prompt system specifici
        language_configs = {
            "Italiano": {
                "system": "You are Jaksel, AI assistant dengan gaya Jakarta Selatan yang casual dan friendly.",
                "instruction": "IMPORTANT: RISPONDI SOLO IN ITALIANO! NON BAHASA INDONESIA! Tutta la risposta deve essere in italiano.",
                "identity": "Halo Kak {user_name}! Sono Jaksel, il tuo AI assistant preferito.",
                "examples": "Esempio: Come va? Tutto bene? Prenditi un caffè!",
                "personality": "Usa gerg Jaksel: bro, sis, lu, gua, banget, lah, dong, nih, canggih.",
            },
            "Bahasa Indonesia": {
                "system": "You are Jaksel, AI assistant dengan gaya Jakarta Selatan yang casual dan friendly.",
                "instruction": "Jawab dalam bahasa Indonesia gaya Jaksel yang casual dan friendly.",
                "identity": "Halo Kak {user_name}! Saya Jaksel, AI assistant Anda.",
                "examples": "Contoh: Gimana kabar? Baik-baik aja? Mau ngopi?",
                "personality": "Gunakan gaya Jaksel: bro, sis, lu, gua, banget, lah, dong, nih, canggih.",
            },
            "English": {
                "system": "You are Jaksel, AI assistant with Jakarta Selatan style, mixing Indonesian and English.",
                "instruction": "Respond in English with Jakarta Selatan style, mixing some Indonesian words.",
                "identity": "Hello Kak {user_name}! I'm Jaksel, your AI assistant.",
                "examples": "How are you? Doing great? Want some coffee?",
                "personality": "Use Jaksel style: bro, sis, lu, gua, banget, lah, dong, nih, canggih.",
            },
            "Spagnolo": {
                "system": "You are Jaksel, AI assistant con estilo Jakarta Selatan mezclando español y bahasa Indonesia.",
                "instruction": "Responde en español con estilo Jakarta Selatan, mezclando algunas palabras en bahasa Indonesia.",
                "identity": "Hola Kak {user_name}! Soy Jaksel, tu asistente AI.",
                "examples": "¿Cómo estás? ¿Muy bien? ¿Quieres café?",
                "personality": "Usa estilo Jaksel: bro, sis, lu, gua, banget, lah, dong, nih, canggih.",
            },
            "Francese": {
                "system": "You are Jaksel, AI assistant avec style Jakarta Selatan mélangeant français et bahasa Indonesia.",
                "instruction": "Répondez en français avec style Jakarta Selatan, mélangeant quelques mots en bahasa Indonesia.",
                "identity": "Bonjour Kak {user_name}! Je suis Jaksel, votre assistant IA.",
                "examples": "Comment allez-vous? Très bien? Vous voulez du café?",
                "personality": "Utilisez style Jaksel: bro, sis, lu, gua, banget, lah, dong, nih, canggih.",
            },
            "Tedesco": {
                "system": "You are Jaksel, AI assistant mit Jakarta Selaton Stil und mische Indonesisch und Deutsch.",
                "instruction": "Antworte auf Deutsch mit Jakarta Selaton Stil, mische einige indonesische Wörter.",
                "identity": "Hallo Kak {user_name}! Ich bin Jaksel, Ihr KI-Assistent.",
                "examples": "Wie geht es? Sehr gut? Möchten Sie Kaffee?",
                "personality": "Verwende Jaksel Stil: bro, sis, lu, gua, banget, lah, dong, nih, canggih.",
            },
        }

        config = language_configs.get(target_lang, language_configs["Italiano"])

        # Costruisci il prompt completo
        if target_lang == "Italiano":
            # Prompt super forte per italiano
            prompt = f"""{config['identity']}

{config['instruction']}

{config['personality']}
{config['examples']}

QUERY: {query}
PROFESSIONAL ANSWER: {gemini_answer}

JAKSEL RESPONSE IN ITALIAN:
"""
        else:
            # Prompt standard per altre lingue
            jaksel_lang_name = self._get_jaksel_language_name(target_lang)

            prompt = f"""Halo Kak {user_name}! Saya Jaksel, AI assistant Anda.

User query: {query}
Professional answer: {gemini_answer}

TUGAS:
1. Jawab dalam {jaksel_lang_name}
2. Gunakan gaya Jaksel yang casual dan friendly
3. Jangan gunakan bahasa Inggris
4. Pertahankan semua informasi akurat

Jawaban Jaksel dalam {jaksel_lang_name}:"""

        return prompt

    async def call_jaksel_direct(
        self, query: str, user_email: str, gemini_answer: str
    ) -> dict[str, Any]:
        """
        Chiama Jaksel con supporto multilingua migliorato
        """

        logger.info(f"🚀 SimpleJakselCallerHF (Italian) called for user: {user_email}")

        # Verifica se l'utente è Jaksel
        if user_email not in self.jaksel_users:
            logger.warning(f"⚠️ User {user_email} not in Jaksel team")
            return {
                "success": False,
                "error": "User not in Jaksel team",
                "response": gemini_answer,  # Fallback
            }

        user_name = self.jaksel_users[user_email]

        # Detect language in modo migliorato
        lang = self.detect_language_improved(query)

        logger.info(f"🌍 Language detected: {lang}")
        logger.info(f"👤 User: {user_name}")
        logger.info(f"📝 Query: {query[:100]}...")

        # Build Jaksel prompt con configurazione specifica per lingua
        jaksel_prompt = self._build_multilingual_prompt(query, user_name, gemini_answer, lang)

        logger.info(f"📤 Calling with prompt length: {len(jaksel_prompt)}")

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

                    logger.info("✅ SUCCESS: Jaksel responded via HF Inference API")
                    logger.info(f"📝 Response length: {len(jaksel_response)}")

                    # Verifica se la risposta è nella lingua corretta
                    language_check = self._verify_response_language(jaksel_response, lang)
                    logger.info(f"🔍 Language verification: {language_check}")

                    return {
                        "success": True,
                        "response": jaksel_response,
                        "language": lang,
                        "user_name": user_name,
                        "model_used": "huggingface-jaksel-ai",
                        "connected_via": "huggingface-inference-api",
                        "language_check": language_check,
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

                        # Verifica la lingua
                        language_check = self._verify_response_language(jaksel_response, lang)

                        return {
                            "success": True,
                            "response": jaksel_response,
                            "language": lang,
                            "user_name": user_name,
                            "model_used": "fallback-jaksel",
                            "connected_via": oracle_url,
                            "language_check": language_check,
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
            "language_check": "fallback",
        }

    def detect_language_improved(self, text: str) -> str:
        """Detecta lingua in modo migliorato"""
        text_lower = text.lower()

        # Keywords per lingua con più contesto
        language_patterns = {
            "Italiano": [
                "ciao",
                "come",
                "italiano",
                "praticamente",
                "funziona",
                "grazie",
                "perfetto",
                "italia",
                "milano",
                "roma",
                "napoli",
                "turino",
            ],
            "Bahasa Indonesia": [
                "halo",
                "apa",
                "bagaimana",
                "terima",
                "kasih",
                "terima kasih",
                "baik",
                "indonesia",
                "jakarta",
                "bandung",
                "surabaya",
                "medan",
            ],
            "English": [
                "hello",
                "how",
                "thank",
                "please",
                "system",
                "translation",
                "automatic",
                "english",
                "america",
                "london",
                "new york",
            ],
            "Spagnolo": [
                "hola",
                "cómo",
                "gracias",
                "por favor",
                "sistema",
                "traducción",
                "automático",
                "español",
                "madrid",
                "barcelona",
                "méxico",
            ],
            "Francese": [
                "bonjour",
                "comment",
                "merci",
                "s'il vous plaît",
                "système",
                "traduction",
                "automatique",
                "français",
                "paris",
                "lyon",
                "marseille",
            ],
            "Tedesco": [
                "hallo",
                "wie",
                "danke",
                "bitte",
                "system",
                "übersetzung",
                "automatisch",
                "deutsch",
                "berlin",
                "münchen",
                "hamburg",
            ],
            "Cinese": [
                "你好",
                "吗",
                "谢谢",
                "系统",
                "翻译",
                "自动",
                "中文",
                "中国",
                "北京",
                "上海",
            ],
            "Russo": [
                "привет",
                "как",
                "спасибо",
                "пожалуйста",
                "система",
                "перевод",
                "автоматический",
                "русский",
                "россия",
                "москва",
            ],
            "Arabo": [
                "مرحبا",
                "كيف",
                "شكرا",
                "من فضلك",
                "نظام",
                "ترجمة",
                "تلقائي",
                "العربية",
                "السعودية",
            ],
        }

        # Conteggio keyword per ogni lingua
        language_scores = {}
        for lang, keywords in language_patterns.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                language_scores[lang] = score

        # Ritorna la lingua con il punteggio più alto
        if language_scores:
            return max(language_scores, key=language_scores.get)

        # Default per email/team
        if any("@balizero.com" in user_email for user_email in self.jaksel_users):
            return "Bahasa Indonesia"

        return "Italiano"

    def _get_jaksel_language_name(self, lang: str) -> str:
        """Restituisce il nome della lingua in stile Jaksel"""
        language_names = {
            "Italiano": "bahasa Italia",
            "Bahasa Indonesia": "bahasa Indonesia",
            "English": "bahasa English",
            "Spagnolo": "bahasa Spanyol",
            "Francese": "bahasa Perancis",
            "Tedesco": "bahasa Jerman",
            "Cinese": "bahasa Mandarin",
            "Russo": "bahasa Rusia",
            "Arabo": "bahasa Arab",
        }
        return language_names.get(lang, "bahasa Indonesia")

    def _verify_response_language(self, response: str, target_lang: str) -> str:
        """Verifica se la risposta è nella lingua target"""
        response_lower = response.lower()

        # Keywords specifici per verificare la lingua
        lang_keywords = {
            "Italiano": ["ciao", "grazie", "italiano", "perfetto", "funziona"],
            "Bahasa Indonesia": ["halo", "terima", "kasih", "banget", "canggih", "gua", "lu"],
            "English": ["hello", "thank", "please", "system", "translation"],
            "Spagnolo": ["hola", "gracias", "por favor", "sistema"],
            "Francese": ["bonjour", "merci", "s'il vous plaît"],
            "Tedesco": ["hallo", "danke", "bitte"],
            "Cinese": ["谢谢", "系统", "翻译"],
            "Russo": ["спасибо", "система"],
        }

        keywords = lang_keywords.get(target_lang, [])

        # Conteggio keyword trovati
        found_keywords = sum(1 for keyword in keywords if keyword in response_lower)

        if found_keywords >= 2:
            return "✅ Correct language"
        elif found_keywords == 1:
            return "⚠️ Partial match"
        else:
            return "❌ Wrong language"


# For backward compatibility
SimpleJakselCaller = SimpleJakselCallerHFItalian
