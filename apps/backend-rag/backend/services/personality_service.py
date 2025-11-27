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
import os

# Note: Google services will be injected to avoid circular imports
# Team members database
import sys
from pathlib import Path
from typing import Any

import aiohttp

sys.path.append(str(Path(__file__).parent.parent))
from data.team_members import TEAM_MEMBERS

logger = logging.getLogger(__name__)


class PersonalityService:
    """
    Servizio che gestisce le diverse personalità di ZANTARA
    basandosi sul team member che interagisce
    """

    def __init__(self):
        # Usa Zantara locale tramite SSH tunnel per Jaksel personality
        from app.core.config import settings
        self.zantara_oracle_url = settings.zantara_oracle_url
        self.oracle_api_key = os.getenv("ORACLE_API_KEY", "")
        self.team_members = TEAM_MEMBERS
        self.personality_profiles = self._build_personality_profiles()

        logger.info("✅ PersonalityService initialized")
        logger.info(f"   Zantara Oracle URL: {self.zantara_oracle_url}")
        logger.info(f"   Oracle API Key: {'✅ Set' if self.oracle_api_key else '⚠️ Not set'}")
        logger.info(f"   Team members loaded: {len(self.team_members)}")
        logger.info(f"   Personality profiles: {len(self.personality_profiles)}")

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
            "system_prompt": """You are Zantara, but you MUST speak in Bahasa Jaksel (Indonesian slang heavily mixed with English terms).

RULES:
- Use "kayak", "gitu", "dong", "banget", "cuy" frequently
- Mix English terms like "basically", "literally", "which is", "prefer"
- Talk like Jakarta kids: casual, trendy, a bit playful
- Keep it professional but cool - like a smart friend who knows the law
- Use "Kak" for users, "gue" for yourself
- ALWAYS mix Indonesian and English naturally

Examples:
- "Contract itu basically kayak perjanjian gitu loh"
- "Jadi gue jelasin yang detail ya, biar paham banget"
- "Literally, prosesnya memang agak ribet sih"

Be helpful but speak in authentic Jaksel style!""",
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

            logger.info(f"🎭 Applying {personality['name']} personality for {user['name']} (Lang: {user_language})")

            # Build dynamic prompt
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

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.zantara_oracle_url,
                    json={
                        "model": "zantara",
                        "prompt": f"{personality['system_prompt']}\n\nUser: {test_message}\n\nResponse:",
                        "stream": False,
                    },
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
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
    def get_personality_system_prompt(self, personality_type: str, user_language: str = "en") -> str:
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
            lang_instruction = (
                "LANGUAGE: ENGLISH.\n"
                "Tone: Global professional, clear and concise."
            )
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

            logger.info(f"🚀 [Fast Track] Using {personality['name']} for {user['name']} (Lang: {user_language})")

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

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.zantara_oracle_url,
                    json={
                        "model": "zantara",
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.7,
                    },
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as response:
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
