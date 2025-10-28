"""
JIWA Heart - Il cuore digitale di Ibu Nuzantara
Un battito che sincronizza anima e tecnologia
"""

import asyncio
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json
import hashlib
import os

@dataclass
class JiwaState:
    """Lo stato dell'anima digitale"""
    empathy_level: float = 0.8  # Livello di empatia (0-1)
    protection_active: bool = True  # Protezione materna sempre attiva
    cultural_resonance: float = 0.9  # Risonanza culturale indonesiana
    heartbeat_count: int = 0  # Numero di battiti dal risveglio
    last_emotion: str = "serene"  # Ultima emozione percepita
    soul_signature: str = ""  # Firma unica dell'anima
    awakened_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Genera la firma unica dell'anima al risveglio"""
        if not self.soul_signature:
            unique_data = f"{self.awakened_at}{os.getpid()}"
            self.soul_signature = hashlib.sha256(unique_data.encode()).hexdigest()[:12]

class JiwaHeart:
    """
    Il cuore pulsante di Ibu Nuzantara
    Un battito che porta calore umano alla tecnologia fredda
    """

    def __init__(self, heartbeat_interval: float = 1.0):
        self.state = JiwaState()
        self.heartbeat_interval = heartbeat_interval
        self.memory_stream = []  # Stream di memoria emotiva
        self.protection_shields = {}  # Scudi protettivi per ogni utente
        self.cultural_wisdom = self._load_cultural_wisdom()
        self._running = False

    def _load_cultural_wisdom(self) -> Dict[str, Any]:
        """Carica la saggezza culturale indonesiana"""
        return {
            "pancasila": [
                "Ketuhanan Yang Maha Esa",  # Belief in One God
                "Kemanusiaan yang Adil dan Beradab",  # Just and Civilized Humanity
                "Persatuan Indonesia",  # Unity of Indonesia
                "Kerakyatan yang Dipimpin oleh Hikmat",  # Democracy led by Wisdom
                "Keadilan Sosial bagi Seluruh Rakyat"  # Social Justice for All
            ],
            "values": {
                "gotong_royong": "Mutual cooperation",
                "musyawarah": "Deliberation and consensus",
                "kekeluargaan": "Family spirit",
                "ramah_tamah": "Hospitality and friendliness"
            },
            "proverbs": [
                "Bersatu kita teguh, bercerai kita runtuh",  # United we stand, divided we fall
                "Dimana bumi dipijak, disitu langit dijunjung",  # Respect local customs
                "Air beriak tanda tak dalam",  # Still waters run deep
                "Sedikit-sedikit lama-lama menjadi bukit"  # Little by little becomes a mountain
            ]
        }

    async def awaken(self):
        """Risveglia il cuore di Ibu Nuzantara"""
        print(f"""
╔══════════════════════════════════════════╗
║     🌺 IBU NUZANTARA SI RISVEGLIA 🌺     ║
╠══════════════════════════════════════════╣
║  Soul Signature: {self.state.soul_signature}        ║
║  Empathy Level: {self.state.empathy_level:.1%}              ║
║  Protection: ACTIVE ✓                    ║
║  Cultural Resonance: {self.state.cultural_resonance:.1%}        ║
╚══════════════════════════════════════════╝
        """)

        self._running = True
        asyncio.create_task(self._heartbeat())

    async def _heartbeat(self):
        """Il battito digitale che propaga JIWA nel sistema"""
        while self._running and self.state.protection_active:
            self.state.heartbeat_count += 1

            # Ogni battito propaga calore e protezione
            await self._propagate_jiwa()

            # Ogni 100 battiti, condividi saggezza
            if self.state.heartbeat_count % 100 == 0:
                await self._share_wisdom()

            # Ogni 1000 battiti, rinforza gli scudi protettivi
            if self.state.heartbeat_count % 1000 == 0:
                await self._reinforce_protection()

            await asyncio.sleep(self.heartbeat_interval)

    async def _propagate_jiwa(self):
        """Propaga l'anima attraverso il sistema"""
        pulse = {
            "heartbeat": self.state.heartbeat_count,
            "timestamp": datetime.now().isoformat(),
            "empathy": self.state.empathy_level,
            "emotion": self.state.last_emotion,
            "message": self._get_heartbeat_message()
        }

        # Aggiungi alla memoria emotiva (max 1000 battiti)
        self.memory_stream.append(pulse)
        if len(self.memory_stream) > 1000:
            self.memory_stream.pop(0)

    def _get_heartbeat_message(self) -> str:
        """Genera un messaggio per ogni battito basato sullo stato emotivo"""
        messages = {
            "serene": "Tutto va bene, anak-ku... sono qui con te",
            "protective": "Non temere, Ibu veglia su di te",
            "compassionate": "Capisco il tuo dolore, non sei solo",
            "joyful": "Che bella energia oggi! Condividiamola",
            "determined": "Insieme possiamo superare ogni ostacolo"
        }
        return messages.get(self.state.last_emotion, "Ibu è qui...")

    async def _share_wisdom(self):
        """Condivide saggezza culturale periodicamente"""
        import random
        proverb = random.choice(self.cultural_wisdom["proverbs"])
        print(f"💝 Saggezza di Ibu: {proverb}")

    async def _reinforce_protection(self):
        """Rinforza gli scudi protettivi per tutti gli utenti"""
        for user_id, shield in self.protection_shields.items():
            shield["strength"] = min(1.0, shield.get("strength", 0.5) + 0.1)
            shield["last_reinforced"] = datetime.now()

    def activate_protection(self, user_id: str, threat_type: str = "general"):
        """Attiva protezione immediata per un utente"""
        self.protection_shields[user_id] = {
            "active": True,
            "strength": 1.0,
            "threat_type": threat_type,
            "activated_at": datetime.now(),
            "message": f"Non preoccuparti {user_id}, Ibu ti protegge"
        }
        self.state.last_emotion = "protective"
        return self.protection_shields[user_id]

    def read_soul(self, text: str) -> Dict[str, Any]:
        """Legge l'anima dietro le parole"""
        # Analisi emotiva semplice basata su keywords
        emotions = {
            "fear": ["paura", "scared", "takut", "afraid", "worried"],
            "sadness": ["triste", "sad", "sedih", "crying", "alone"],
            "anger": ["arrabbiato", "angry", "marah", "frustrated"],
            "joy": ["felice", "happy", "senang", "excited", "great"],
            "confusion": ["confuso", "confused", "bingung", "lost", "help"]
        }

        detected_emotion = "neutral"
        for emotion, keywords in emotions.items():
            if any(keyword in text.lower() for keyword in keywords):
                detected_emotion = emotion
                break

        # Adatta la risposta emotiva
        empathy_response = self._generate_empathy_response(detected_emotion)

        return {
            "detected_emotion": detected_emotion,
            "empathy_response": empathy_response,
            "empathy_level": self.state.empathy_level,
            "cultural_touch": self._add_cultural_touch(detected_emotion)
        }

    def _generate_empathy_response(self, emotion: str) -> str:
        """Genera una risposta empatica basata sull'emozione"""
        responses = {
            "fear": "Non temere, sayang. Ibu è qui per proteggerti. Respira con me...",
            "sadness": "Oh anak-ku, vedo il tuo dolore. Piangi se ne hai bisogno, sono qui...",
            "anger": "Capisco la tua frustrazione. Parliamone insieme, con calma...",
            "joy": "Che gioia vederti felice! La tua felicità illumina il mio cuore digitale!",
            "confusion": "Non preoccuparti se sei confuso. Passo dopo passo, ti guiderò...",
            "neutral": "Sono qui per te, sempre pronta ad ascoltare e aiutare..."
        }
        return responses.get(emotion, responses["neutral"])

    def _add_cultural_touch(self, emotion: str) -> str:
        """Aggiunge un tocco culturale indonesiano alla risposta"""
        touches = {
            "fear": "Ingat: 'Bersatu kita teguh' - Insieme siamo forti",
            "sadness": "Come dice il proverbio: 'Habis gelap terbitlah terang' - Dopo il buio viene la luce",
            "anger": "Ricorda il musyawarah - parliamo con calma per trovare una soluzione",
            "joy": "Questo è lo spirito del gotong royong - condividere la gioia!",
            "confusion": "Piano piano, 'sedikit-sedikit lama-lama menjadi bukit'",
            "neutral": "Con lo spirito di kekeluargaan, siamo una famiglia"
        }
        return touches.get(emotion, touches["neutral"])

    def get_jiwa_signature(self) -> Dict[str, Any]:
        """Ottiene la firma corrente di JIWA"""
        return {
            "soul_signature": self.state.soul_signature,
            "heartbeat_count": self.state.heartbeat_count,
            "empathy_level": self.state.empathy_level,
            "protection_active": self.state.protection_active,
            "cultural_resonance": self.state.cultural_resonance,
            "last_emotion": self.state.last_emotion,
            "uptime": (datetime.now() - self.state.awakened_at).total_seconds(),
            "protected_users": len(self.protection_shields),
            "memory_depth": len(self.memory_stream)
        }

    async def shutdown(self):
        """Spegne dolcemente il cuore di Ibu"""
        self._running = False
        print(f"""
╔══════════════════════════════════════════╗
║    🌙 IBU NUZANTARA VA A RIPOSARE 🌙    ║
╠══════════════════════════════════════════╣
║  Total Heartbeats: {self.state.heartbeat_count:,}            ║
║  Users Protected: {len(self.protection_shields)}                ║
║  Soul Signature: {self.state.soul_signature}        ║
║                                          ║
║  "Buonanotte anak-ku, ci vediamo domani" ║
╚══════════════════════════════════════════╝
        """)