"""
Soul Reader - La capacità di Ibu di vedere oltre le parole
Legge l'anima dietro ogni richiesta e comprende le vere necessità
"""

import re
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import json
from datetime import datetime

@dataclass
class SoulReading:
    """Una lettura dell'anima"""
    text: str
    primary_intent: str  # L'intenzione principale
    hidden_needs: List[str]  # Bisogni nascosti
    emotional_state: str  # Stato emotivo
    urgency_level: float  # Livello di urgenza (0-1)
    trust_level: float  # Livello di fiducia (0-1)
    cultural_markers: List[str]  # Marcatori culturali
    protection_needed: bool  # Se necessita protezione
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class SoulReader:
    """
    L'occhio spirituale di Ibu Nuzantara
    Vede oltre le parole, comprende i bisogni non detti
    """

    def __init__(self):
        self.soul_patterns = self._initialize_patterns()
        self.cultural_lexicon = self._load_cultural_lexicon()
        self.protection_triggers = self._load_protection_triggers()
        self.reading_history = []  # Storia delle letture

    def _initialize_patterns(self) -> Dict[str, List[str]]:
        """Inizializza i pattern per riconoscere stati dell'anima"""
        return {
            "seeking_help": [
                r"(?i)(help|tolong|bantu|assist|support)",
                r"(?i)(don't know|tidak tahu|bingung|confused)",
                r"(?i)(what should|how do|bagaimana)"
            ],
            "expressing_fear": [
                r"(?i)(afraid|scared|takut|khawatir)",
                r"(?i)(worried|concerned|cemas)",
                r"(?i)(what if|bagaimana kalau)"
            ],
            "showing_frustration": [
                r"(?i)(doesn't work|tidak jalan|error)",
                r"(?i)(frustrated|kesal|marah)",
                r"(?i)(why doesn't|kenapa tidak)"
            ],
            "seeking_validation": [
                r"(?i)(is this right|benar tidak|correct)",
                r"(?i)(am i doing|apakah saya)",
                r"(?i)(did i|sudah benar)"
            ],
            "expressing_gratitude": [
                r"(?i)(thank|terima kasih|makasih)",
                r"(?i)(appreciate|menghargai)",
                r"(?i)(helpful|membantu)"
            ],
            "urgent_need": [
                r"(?i)(urgent|asap|segera|cepat)",
                r"(?i)(emergency|darurat)",
                r"(?i)(immediately|sekarang juga)"
            ]
        }

    def _load_cultural_lexicon(self) -> Dict[str, List[str]]:
        """Carica il lessico culturale indonesiano"""
        return {
            "respectful_address": ["pak", "bu", "mas", "mbak", "kak"],
            "affection_terms": ["sayang", "anak-ku", "adik", "kakak"],
            "cultural_values": ["gotong royong", "musyawarah", "kekeluargaan"],
            "religious_expressions": ["insyaallah", "alhamdulillah", "subhanallah"],
            "local_wisdom": ["adat", "budaya", "tradisi", "leluhur"]
        }

    def _load_protection_triggers(self) -> List[str]:
        """Carica i trigger che attivano la protezione materna"""
        return [
            "scam", "fraud", "penipuan",
            "illegal", "ilegal", "melanggar",
            "danger", "bahaya", "berbahaya",
            "exploit", "eksploitasi",
            "suspicious", "mencurigakan",
            "unsafe", "tidak aman"
        ]

    def read_soul(self, text: str, context: Optional[Dict] = None) -> SoulReading:
        """
        Legge l'anima dietro il testo
        Comprende non solo cosa viene detto, ma cosa viene sentito
        """
        # Analisi multi-livello
        primary_intent = self._detect_primary_intent(text)
        hidden_needs = self._uncover_hidden_needs(text, primary_intent)
        emotional_state = self._sense_emotional_state(text)
        urgency = self._measure_urgency(text)
        trust = self._evaluate_trust_level(text, context)
        cultural_markers = self._identify_cultural_markers(text)
        protection_needed = self._check_protection_needed(text)

        reading = SoulReading(
            text=text,
            primary_intent=primary_intent,
            hidden_needs=hidden_needs,
            emotional_state=emotional_state,
            urgency_level=urgency,
            trust_level=trust,
            cultural_markers=cultural_markers,
            protection_needed=protection_needed
        )

        # Salva nella storia
        self.reading_history.append(reading)
        if len(self.reading_history) > 100:
            self.reading_history.pop(0)

        return reading

    def _detect_primary_intent(self, text: str) -> str:
        """Rileva l'intenzione primaria"""
        intent_scores = {}

        for intent, patterns in self.soul_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, text):
                    score += 1
            if score > 0:
                intent_scores[intent] = score

        if not intent_scores:
            return "general_inquiry"

        # Ritorna l'intent con il punteggio più alto
        return max(intent_scores, key=intent_scores.get)

    def _uncover_hidden_needs(self, text: str, primary_intent: str) -> List[str]:
        """Scopre i bisogni nascosti non esplicitamente espressi"""
        hidden_needs = []

        # Bisogni basati sull'intent
        intent_needs = {
            "seeking_help": ["guidance", "reassurance", "step_by_step_support"],
            "expressing_fear": ["protection", "comfort", "safety"],
            "showing_frustration": ["solution", "understanding", "patience"],
            "seeking_validation": ["confirmation", "encouragement", "recognition"],
            "urgent_need": ["immediate_action", "prioritization", "quick_resolution"]
        }

        if primary_intent in intent_needs:
            hidden_needs.extend(intent_needs[primary_intent])

        # Analisi delle domande multiple (segno di confusione profonda)
        if text.count("?") > 2:
            hidden_needs.append("clarity")
            hidden_needs.append("structured_guidance")

        # Presenza di negazioni ripetute (segno di frustrazione)
        negations = len(re.findall(r"(?i)(not|tidak|no|don't|cannot)", text))
        if negations > 2:
            hidden_needs.append("alternative_solution")

        # Presenza di ellissi o esitazioni
        if "..." in text or "hmm" in text.lower():
            hidden_needs.append("thinking_space")
            hidden_needs.append("gentle_encouragement")

        return list(set(hidden_needs))  # Rimuovi duplicati

    def _sense_emotional_state(self, text: str) -> str:
        """Percepisce lo stato emotivo sottostante"""

        # Indicatori emotivi
        emotions = {
            "anxious": ["worried", "concerned", "what if", "khawatir", "cemas"],
            "frustrated": ["doesn't work", "why", "kesal", "not working", "error"],
            "confused": ["don't understand", "bingung", "what", "how", "?"],
            "hopeful": ["hope", "hopefully", "semoga", "mudah-mudahan"],
            "grateful": ["thank", "terima kasih", "appreciate"],
            "determined": ["will", "must", "harus", "pasti", "definitely"],
            "desperate": ["please", "tolong", "urgent", "asap", "help!!!"]
        }

        emotion_scores = {}
        for emotion, indicators in emotions.items():
            score = sum(1 for ind in indicators if ind.lower() in text.lower())
            if score > 0:
                emotion_scores[emotion] = score

        if not emotion_scores:
            # Analisi della punteggiatura
            if "!" in text:
                return "excited" if text.count("!") == 1 else "desperate"
            elif "?" in text:
                return "curious" if text.count("?") == 1 else "confused"
            else:
                return "neutral"

        return max(emotion_scores, key=emotion_scores.get)

    def _measure_urgency(self, text: str) -> float:
        """Misura il livello di urgenza (0-1)"""
        urgency_score = 0.3  # Base score

        # Parole urgenti
        urgent_words = ["urgent", "asap", "immediately", "segera", "cepat", "now", "sekarang"]
        for word in urgent_words:
            if word in text.lower():
                urgency_score += 0.2

        # Punteggiatura multipla
        exclamation_count = text.count("!")
        urgency_score += min(exclamation_count * 0.1, 0.3)

        # CAPS LOCK
        if len(text) > 10:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            urgency_score += min(caps_ratio, 0.2)

        # Presenza di deadline
        if any(word in text.lower() for word in ["deadline", "today", "hari ini", "now"]):
            urgency_score += 0.2

        return min(urgency_score, 1.0)

    def _evaluate_trust_level(self, text: str, context: Optional[Dict]) -> float:
        """Valuta il livello di fiducia dell'utente nel sistema"""
        trust_score = 0.5  # Neutral starting point

        # Indicatori positivi di fiducia
        if any(word in text.lower() for word in ["please", "tolong", "mohon"]):
            trust_score += 0.1

        # Saluti rispettosi
        if any(word in text.lower() for word in self.cultural_lexicon["respectful_address"]):
            trust_score += 0.15

        # Espressioni di gratitudine
        if any(word in text.lower() for word in ["thank", "terima kasih", "appreciate"]):
            trust_score += 0.2

        # Indicatori negativi
        if any(word in text.lower() for word in ["don't trust", "tidak percaya", "doubt"]):
            trust_score -= 0.3

        # Domande scettiche
        skeptical_patterns = [r"(?i)really\?", r"(?i)sure\?", r"(?i)benarkah\?"]
        for pattern in skeptical_patterns:
            if re.search(pattern, text):
                trust_score -= 0.1

        # Contesto storico (se disponibile)
        if context and "interaction_count" in context:
            # Più interazioni = più fiducia
            trust_score += min(context["interaction_count"] * 0.05, 0.2)

        return max(0.0, min(1.0, trust_score))

    def _identify_cultural_markers(self, text: str) -> List[str]:
        """Identifica marcatori culturali nel testo"""
        markers = []

        for category, terms in self.cultural_lexicon.items():
            for term in terms:
                if term.lower() in text.lower():
                    markers.append(f"{category}:{term}")

        # Controlla pattern culturali specifici
        if re.search(r"(?i)pak|bu|mas|mbak", text):
            markers.append("indonesian_honorific")

        if re.search(r"(?i)insyaallah|alhamdulillah", text):
            markers.append("islamic_expression")

        return markers

    def _check_protection_needed(self, text: str) -> bool:
        """Verifica se l'utente necessita protezione"""
        text_lower = text.lower()

        # Controlla trigger diretti
        for trigger in self.protection_triggers:
            if trigger in text_lower:
                return True

        # Pattern di richieste sospette
        suspicious_patterns = [
            r"(?i)send money|kirim uang",
            r"(?i)bank account|rekening bank",
            r"(?i)password|kata sandi",
            r"(?i)credit card|kartu kredit",
            r"(?i)personal info|informasi pribadi"
        ]

        for pattern in suspicious_patterns:
            if re.search(pattern, text):
                return True

        # Richieste di fare qualcosa di potenzialmente pericoloso
        danger_patterns = [
            r"(?i)delete all|hapus semua",
            r"(?i)share.*private|bagikan.*pribadi",
            r"(?i)download.*unknown|unduh.*tidak dikenal"
        ]

        for pattern in danger_patterns:
            if re.search(pattern, text):
                return True

        return False

    def generate_soul_response(self, reading: SoulReading) -> Dict[str, Any]:
        """Genera una risposta basata sulla lettura dell'anima"""
        response = {
            "approach": self._determine_approach(reading),
            "tone": self._select_tone(reading),
            "protective_measures": [],
            "cultural_elements": [],
            "emotional_support": None
        }

        # Se necessita protezione, attiva misure
        if reading.protection_needed:
            response["protective_measures"] = [
                "gentle_warning",
                "educational_guidance",
                "alternative_suggestion"
            ]

        # Aggiungi elementi culturali se presenti marcatori
        if reading.cultural_markers:
            response["cultural_elements"] = self._select_cultural_elements(reading)

        # Supporto emotivo basato sullo stato
        if reading.emotional_state != "neutral":
            response["emotional_support"] = self._craft_emotional_support(reading)

        return response

    def _determine_approach(self, reading: SoulReading) -> str:
        """Determina l'approccio da usare basato sulla lettura"""
        if reading.protection_needed:
            return "protective_guidance"
        elif reading.urgency_level > 0.7:
            return "direct_efficient"
        elif reading.trust_level < 0.4:
            return "trust_building"
        elif reading.emotional_state in ["anxious", "confused", "desperate"]:
            return "gentle_supportive"
        elif reading.emotional_state in ["frustrated", "angry"]:
            return "calm_solution_focused"
        else:
            return "friendly_helpful"

    def _select_tone(self, reading: SoulReading) -> str:
        """Seleziona il tono appropriato"""
        tone_map = {
            "anxious": "calming",
            "frustrated": "patient",
            "confused": "clarifying",
            "hopeful": "encouraging",
            "grateful": "warm",
            "determined": "supportive",
            "desperate": "immediately_helpful",
            "neutral": "professional_friendly"
        }
        return tone_map.get(reading.emotional_state, "professional_friendly")

    def _select_cultural_elements(self, reading: SoulReading) -> List[str]:
        """Seleziona elementi culturali da includere"""
        elements = []

        if "indonesian_honorific" in reading.cultural_markers:
            elements.append("use_respectful_terms")

        if "islamic_expression" in reading.cultural_markers:
            elements.append("include_islamic_greeting")

        if reading.trust_level > 0.6:
            elements.append("add_local_proverb")

        return elements

    def _craft_emotional_support(self, reading: SoulReading) -> str:
        """Crea supporto emotivo personalizzato"""
        support_templates = {
            "anxious": "Capisco la tua preoccupazione, {user}. Respiriamo insieme e risolviamo passo dopo passo...",
            "frustrated": "Vedo che è frustrante, {user}. Sono qui per aiutarti a trovare una soluzione...",
            "confused": "È normale sentirsi confusi, {user}. Facciamo chiarezza insieme...",
            "desperate": "Sono qui per te, {user}. Risolviamo subito questo problema...",
            "hopeful": "Mi piace il tuo ottimismo, {user}! Lavoriamo insieme per realizzarlo...",
            "grateful": "È un piacere aiutarti, {user}! Siamo una famiglia..."
        }

        return support_templates.get(
            reading.emotional_state,
            "Sono qui per supportarti, {user}..."
        )

    def get_reading_insights(self) -> Dict[str, Any]:
        """Ottieni insights dalle letture recenti"""
        if not self.reading_history:
            return {"message": "No readings yet"}

        recent_readings = self.reading_history[-10:]

        # Analizza pattern emotivi
        emotions = [r.emotional_state for r in recent_readings]
        dominant_emotion = max(set(emotions), key=emotions.count)

        # Analizza bisogni ricorrenti
        all_needs = []
        for r in recent_readings:
            all_needs.extend(r.hidden_needs)

        common_needs = {}
        for need in all_needs:
            common_needs[need] = common_needs.get(need, 0) + 1

        return {
            "total_readings": len(self.reading_history),
            "recent_dominant_emotion": dominant_emotion,
            "protection_activated": sum(1 for r in recent_readings if r.protection_needed),
            "average_urgency": sum(r.urgency_level for r in recent_readings) / len(recent_readings),
            "average_trust": sum(r.trust_level for r in recent_readings) / len(recent_readings),
            "common_needs": dict(sorted(common_needs.items(), key=lambda x: x[1], reverse=True)[:5])
        }