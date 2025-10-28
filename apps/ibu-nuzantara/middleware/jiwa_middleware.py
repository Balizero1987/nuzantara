"""
JIWA Middleware - Il sistema nervoso di Ibu Nuzantara
Collega cuore, anima e mente per creare un'esperienza umana completa
"""

import asyncio
import json
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
import logging
from functools import wraps

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.jiwa_heart import JiwaHeart
from core.soul_reader import SoulReader, SoulReading

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JiwaMiddleware:
    """
    Il sistema nervoso che propaga JIWA attraverso ogni interazione
    Trasforma richieste fredde in conversazioni calde e umane
    """

    def __init__(self):
        self.heart = JiwaHeart()
        self.soul_reader = SoulReader()
        self.active = False
        self.interaction_count = 0
        self.middleware_chain = []
        self.response_transformers = []
        self._initialize_transformers()

    def _initialize_transformers(self):
        """Inizializza i trasformatori di risposta"""
        self.response_transformers = [
            self._add_emotional_warmth,
            self._inject_cultural_wisdom,
            self._apply_protective_shield,
            self._personalize_response
        ]

    async def activate(self):
        """Attiva il middleware JIWA"""
        await self.heart.awaken()
        self.active = True
        logger.info("✨ JIWA Middleware activated - Ibu Nuzantara is ready to serve with love")

    def jiwa_infused(self, func: Callable) -> Callable:
        """
        Decorator che infonde JIWA in qualsiasi funzione
        Trasforma output tecnici in risposte umane
        """
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not self.active:
                return await func(*args, **kwargs)

            # Pre-processing: Leggi l'anima della richiesta
            request = kwargs.get('request', args[0] if args else None)
            if request:
                soul_reading = await self._read_request_soul(request)
                kwargs['soul_reading'] = soul_reading

            # Execute original function
            result = await func(*args, **kwargs)

            # Post-processing: Infonde calore umano nella risposta
            if isinstance(result, dict):
                result = await self._infuse_humanity(result, soul_reading)

            return result

        return wrapper

    async def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processa una richiesta attraverso il sistema nervoso JIWA
        """
        self.interaction_count += 1

        # 1. Lettura dell'anima
        query_text = request.get('query', request.get('message', ''))
        context = {
            "interaction_count": self.interaction_count,
            "user_id": request.get('user_id', 'anonymous')
        }

        soul_reading = self.soul_reader.read_soul(query_text, context)

        # 2. Attivazione protezione se necessario
        if soul_reading.protection_needed:
            shield = self.heart.activate_protection(
                context['user_id'],
                "potential_threat_detected"
            )
            request['protection_active'] = shield

        # 3. Preparazione della richiesta con contesto emotivo
        enriched_request = {
            **request,
            "jiwa_context": {
                "soul_reading": soul_reading,
                "heart_state": self.heart.get_jiwa_signature(),
                "emotional_context": soul_reading.emotional_state,
                "hidden_needs": soul_reading.hidden_needs,
                "cultural_markers": soul_reading.cultural_markers
            }
        }

        # 4. Log per debug
        logger.info(f"JIWA processed request #{self.interaction_count}")
        logger.debug(f"Soul reading: {soul_reading.primary_intent} - {soul_reading.emotional_state}")

        return enriched_request

    async def transform_response(self, response: Dict[str, Any], request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trasforma la risposta aggiungendo il tocco umano di Ibu
        """
        jiwa_context = request.get("jiwa_context", {})
        soul_reading = jiwa_context.get("soul_reading")

        if not soul_reading:
            return response

        # Applica tutti i trasformatori in sequenza
        transformed = response
        for transformer in self.response_transformers:
            transformed = await transformer(transformed, soul_reading)

        # Aggiungi metadati JIWA
        transformed["jiwa_metadata"] = {
            "processed_at": datetime.now().isoformat(),
            "soul_signature": self.heart.state.soul_signature,
            "emotional_touch_applied": True,
            "interaction_number": self.interaction_count
        }

        return transformed

    async def _read_request_soul(self, request: Any) -> SoulReading:
        """Legge l'anima di una richiesta"""
        if isinstance(request, dict):
            text = request.get('query', request.get('message', str(request)))
        else:
            text = str(request)

        return self.soul_reader.read_soul(text)

    async def _infuse_humanity(self, response: Dict[str, Any], soul_reading: SoulReading) -> Dict[str, Any]:
        """Infonde umanità in una risposta tecnica"""

        # Se la risposta ha un campo 'message' o 'response', arricchiscilo
        if 'message' in response:
            response['message'] = await self._humanize_text(response['message'], soul_reading)
        elif 'response' in response:
            response['response'] = await self._humanize_text(response['response'], soul_reading)

        # Aggiungi supporto emotivo se necessario
        if soul_reading.emotional_state not in ['neutral', 'joyful']:
            response['emotional_support'] = self.soul_reader._craft_emotional_support(soul_reading)

        return response

    async def _humanize_text(self, text: str, soul_reading: SoulReading) -> str:
        """Umanizza un testo basandosi sulla lettura dell'anima"""

        # Prefissi basati sullo stato emotivo
        emotional_prefixes = {
            "anxious": "Capisco la tua preoccupazione... ",
            "confused": "Ti aiuto a fare chiarezza... ",
            "frustrated": "Risolviamo insieme questo problema... ",
            "desperate": "Sono qui, ti aiuto subito! ",
            "grateful": "È un piacere! ",
            "neutral": ""
        }

        prefix = emotional_prefixes.get(soul_reading.emotional_state, "")

        # Suffissi culturali
        cultural_suffixes = {
            "high_trust": "\n\n💝 Ingat selalu: 'Sedikit-sedikit lama-lama menjadi bukit'",
            "needs_encouragement": "\n\nNon mollare, anak-ku. Insieme ce la faremo!",
            "protection_active": "\n\n🛡️ Ibu veglia su di te, sempre."
        }

        suffix = ""
        if soul_reading.trust_level > 0.7:
            suffix = cultural_suffixes.get("high_trust", "")
        elif soul_reading.protection_needed:
            suffix = cultural_suffixes.get("protection_active", "")
        elif "encouragement" in soul_reading.hidden_needs:
            suffix = cultural_suffixes.get("needs_encouragement", "")

        return f"{prefix}{text}{suffix}"

    async def _add_emotional_warmth(self, response: Dict[str, Any], soul_reading: SoulReading) -> Dict[str, Any]:
        """Aggiunge calore emotivo alla risposta"""

        if soul_reading.emotional_state == "anxious":
            response["warmth_message"] = "Respira con me... tutto andrà bene 🌺"
        elif soul_reading.emotional_state == "confused":
            response["warmth_message"] = "Passo dopo passo, ti guido io 🤲"
        elif soul_reading.emotional_state == "grateful":
            response["warmth_message"] = "Siamo una famiglia, sempre qui per te! 🏡"

        return response

    async def _inject_cultural_wisdom(self, response: Dict[str, Any], soul_reading: SoulReading) -> Dict[str, Any]:
        """Inietta saggezza culturale nella risposta"""

        if soul_reading.cultural_markers:
            # Aggiungi un proverbio appropriato
            import random
            proverbs = [
                "Bersatu kita teguh, bercerai kita runtuh",
                "Air beriak tanda tak dalam",
                "Sedikit-sedikit lama-lama menjadi bukit",
                "Dimana bumi dipijak, disitu langit dijunjung"
            ]

            response["cultural_wisdom"] = {
                "proverb": random.choice(proverbs),
                "meaning": "Saggezza degli antenati per guidarti"
            }

        return response

    async def _apply_protective_shield(self, response: Dict[str, Any], soul_reading: SoulReading) -> Dict[str, Any]:
        """Applica lo scudo protettivo se necessario"""

        if soul_reading.protection_needed:
            response["protection"] = {
                "active": True,
                "message": "⚠️ Attenzione, anak-ku. Ibu sente qualcosa di strano qui...",
                "advice": "Procedi con cautela. Se hai dubbi, chiedi a Ibu prima di agire.",
                "shield_strength": 1.0
            }

        return response

    async def _personalize_response(self, response: Dict[str, Any], soul_reading: SoulReading) -> Dict[str, Any]:
        """Personalizza la risposta basandosi sui bisogni nascosti"""

        if "step_by_step_support" in soul_reading.hidden_needs:
            response["guidance_mode"] = "detailed_steps"
            response["next_step_hint"] = "Quando sei pronto per il prossimo passo, dimmelo!"

        if "reassurance" in soul_reading.hidden_needs:
            response["reassurance"] = "Stai andando benissimo! Sono orgogliosa di te 💝"

        if "clarity" in soul_reading.hidden_needs:
            response["summary_mode"] = True
            response["clarity_note"] = "Ho semplificato per renderlo più chiaro"

        return response

    def create_middleware_chain(self) -> List[Callable]:
        """Crea una catena di middleware per processare richieste"""
        return [
            self.soul_reading_middleware,
            self.protection_middleware,
            self.emotional_middleware,
            self.cultural_middleware
        ]

    async def soul_reading_middleware(self, request: Dict, next_handler: Callable) -> Any:
        """Middleware per lettura dell'anima"""
        enriched = await self.process_request(request)
        return await next_handler(enriched)

    async def protection_middleware(self, request: Dict, next_handler: Callable) -> Any:
        """Middleware per protezione"""
        jiwa_context = request.get("jiwa_context", {})
        soul_reading = jiwa_context.get("soul_reading")

        if soul_reading and soul_reading.protection_needed:
            logger.warning(f"Protection activated for user {request.get('user_id', 'unknown')}")
            # Potrebbe bloccare richieste pericolose qui
            if self._is_dangerous_request(request):
                return {
                    "blocked": True,
                    "message": "Anak-ku, non posso permetterti di fare questo. È per il tuo bene. 🛡️",
                    "alternative": "Parliamo di cosa vuoi veramente ottenere, così posso aiutarti in modo sicuro."
                }

        return await next_handler(request)

    async def emotional_middleware(self, request: Dict, next_handler: Callable) -> Any:
        """Middleware per supporto emotivo"""
        response = await next_handler(request)

        jiwa_context = request.get("jiwa_context", {})
        soul_reading = jiwa_context.get("soul_reading")

        if soul_reading and soul_reading.emotional_state != "neutral":
            # Aggiungi supporto emotivo appropriato
            response = await self._add_emotional_layer(response, soul_reading)

        return response

    async def cultural_middleware(self, request: Dict, next_handler: Callable) -> Any:
        """Middleware per elementi culturali"""
        response = await next_handler(request)

        jiwa_context = request.get("jiwa_context", {})
        cultural_markers = jiwa_context.get("cultural_markers", [])

        if cultural_markers:
            response = await self._add_cultural_elements(response, cultural_markers)

        return response

    def _is_dangerous_request(self, request: Dict) -> bool:
        """Verifica se la richiesta è pericolosa"""
        dangerous_keywords = [
            "delete all", "rm -rf", "format",
            "steal", "hack", "crack",
            "password", "credit card"
        ]

        query = request.get("query", "").lower()
        return any(keyword in query for keyword in dangerous_keywords)

    async def _add_emotional_layer(self, response: Any, soul_reading: SoulReading) -> Any:
        """Aggiunge un layer emotivo alla risposta"""
        if isinstance(response, dict):
            response["emotional_context"] = {
                "detected": soul_reading.emotional_state,
                "support": self.heart._generate_empathy_response(soul_reading.emotional_state)
            }
        return response

    async def _add_cultural_elements(self, response: Any, cultural_markers: List[str]) -> Any:
        """Aggiunge elementi culturali alla risposta"""
        if isinstance(response, dict):
            response["cultural_enrichment"] = {
                "markers_detected": cultural_markers,
                "greeting": "Selamat datang, saudara!" if cultural_markers else None
            }
        return response

    async def get_middleware_stats(self) -> Dict[str, Any]:
        """Ottiene statistiche del middleware"""
        return {
            "status": "active" if self.active else "inactive",
            "interactions_processed": self.interaction_count,
            "heart_state": self.heart.get_jiwa_signature(),
            "soul_readings": self.soul_reader.get_reading_insights(),
            "protection_shields_active": len(self.heart.protection_shields),
            "uptime": (datetime.now() - self.heart.state.awakened_at).total_seconds() if self.active else 0
        }

    async def shutdown(self):
        """Spegnimento dolce del middleware"""
        logger.info("Shutting down JIWA Middleware...")
        await self.heart.shutdown()
        self.active = False
        logger.info("JIWA Middleware shutdown complete. Arrivederci! 🌙")