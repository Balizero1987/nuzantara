import os
import json
import time
import random
import re
from datetime import datetime
from typing import Dict
import google.generativeai as genai

# ==============================================================================
# 1. QUALITY ANALYZER (Il "Vibe Check" Scientifico)
# ==============================================================================


class QualityAnalyzer:
    def __init__(self):
        # Dizionario base per rilevamento euristiche
        self.jaksel_particles = {
            "sih",
            "dong",
            "kan",
            "deh",
            "kok",
            "loh",
            "ya",
            "mah",
            "tuh",
        }
        self.english_common = {
            "basically",
            "literally",
            "actually",
            "prefer",
            "which is",
            "meeting",
            "deadline",
            "budget",
            "issue",
            "compliance",
            "regulation",
            "submit",
            "approval",
            "sign",
            "deal",
            "cancel",
            "refund",
            "office",
            "remote",
            "benefit",
            "salary",
            "tax",
            "law",
            "investor",
            "shareholder",
            "owner",
        }
        self.business_keywords = {
            "pt pma",
            "kitas",
            "oss",
            "tax",
            "pajak",
            "modal",
            "capital",
            "dividen",
            "saham",
            "director",
            "komisaris",
            "akta",
            "notaris",
            "npwp",
            "nib",
            "lkpm",
            "bkpm",
            "imigrasi",
            "visa",
        }

    def analyze_text(self, text: str) -> Dict[str, float]:
        tokens = re.findall(r"\w+", text.lower())
        if not tokens:
            return {"cmr": 0, "pd": 0, "drs": 0, "score": 0}

        # Code-Mixing Ratio (Stima Inglese)
        eng_count = sum(1 for t in tokens if t in self.english_common)
        cmr = eng_count / len(tokens)

        # Particle Density
        particle_count = sum(1 for t in tokens if t in self.jaksel_particles)
        pd = particle_count / len(tokens)

        # Domain Relevance Score
        domain_count = sum(1 for k in self.business_keywords if k in text.lower())
        drs = 1.0 if domain_count > 0 else 0.0  # Binario: ne parla o no?

        # Punteggio Composito (Weighted Score)
        # Vogliamo: un po' di inglese, qualche particella, e contenuto business
        # CMR ideale: 0.05 - 0.3 (5% - 30%)
        # PD ideale: > 0.02 (almeno 2%)

        score = 0.0
        if 0.02 <= cmr <= 0.4:
            score += 0.4
        if pd >= 0.01:
            score += 0.3
        if drs > 0:
            score += 0.3

        return {
            "cmr": round(cmr, 3),
            "pd": round(pd, 3),
            "drs": drs,
            "score": round(score, 2),
        }


# ==============================================================================
# 2. SCENARIO GENERATOR (Il Regista)
# ==============================================================================


class ScenarioManager:
    def __init__(self):
        self.topics = [
            "PT PMA Establishment (Foreign Investment)",
            "Investor KITAS & Family KITAS",
            "Corporate Tax & Monthly Reporting",
            "Virtual Office vs Physical Office Regulations",
            "Closing a Company (Liquidation)",
            "LKPM Reporting (Investment Activity Report)",
            "Changing Directors/Commissioners",
            "Dividend Distribution to Foreign Shareholders",
        ]
        self.user_personas = [
            "Anxious First-time Founder (Needs reassurance)",
            "Arrogant Expat (Needs polite correction)",
            "Confused Local Staff (Needs clear guidance)",
            "Busy Tech CEO (Needs TL;DR answers)",
        ]

    def get_random_scenario(self):
        return {
            "topic": random.choice(self.topics),
            "persona": random.choice(self.user_personas),
        }


# ==============================================================================
# 3. GENERATION ENGINE (Il Motore AI)
# ==============================================================================


class ZantaraDataEngine:
    def __init__(self):
        self.api_key = os.environ.get("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")

        genai.configure(api_key=self.api_key)
        # Usiamo Flash per velocità e volume, o Pro se disponibile per qualità
        self.model_name = "gemini-1.5-flash"
        self.model = genai.GenerativeModel(self.model_name)

        self.analyzer = QualityAnalyzer()
        self.scenario = ScenarioManager()

        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.output_dir = f"dataset_builds/{self.session_id}"
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_conversation(self):
        scene = self.scenario.get_random_scenario()

        prompt = f"""
        ACT AS A SCREENWRITER for a realistic business chat in Jakarta (SCBD area).

        CHARACTERS:
        1. USER: {scene["persona"]}. Speaks realistic Indonesian.
        2. ZANTARA: Senior Legal Consultant. Expert, smart, "Jaksel Style" (Indonesian + English terms).
           - Vibe: Professional but chill. Uses "Gue/Lo".
           - Magic Words to use naturally: "Basically", "Literally", "Compliance", "Issue", "Submit", "Deadline".
           - Particles: "Sih", "Dong", "Kan", "Loh".

        TOPIC: {scene["topic"]}

        TASK:
        Write a Multi-Turn Conversation (4-6 turns total).

        FORMAT STRICTLY AS JSON:
        [
            {{"role": "user", "content": "..."}},
            {{"role": "assistant", "content": "..."}},
            {{"role": "user", "content": "..."}},
            {{"role": "assistant", "content": "..."}}
        ]

        RULES:
        - JSON Only. No markdown.
        - Content MUST be factually correct about Indonesian Law.
        - NO Balinese terms (No "Bli", No "Suksma").
        """

        try:
            response = self.model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            dialogue = json.loads(text)
            return dialogue, scene
        except Exception as e:
            print(f"⚠️ Generation Error: {e}")
            return None, None

    def run_pipeline(self, num_conversations=10):
        print(f"🚀 Zantara Data Engine Started (Session: {self.session_id})")
        print(f"🎯 Target: {num_conversations} High-Quality Conversations")

        raw_data = []
        gold_data = []

        stats = {"total": 0, "accepted": 0, "rejected": 0}

        for i in range(num_conversations):
            print(f"\n🎬 Generating Scene {i + 1}/{num_conversations}...")
            dialogue, scene = self.generate_conversation()

            if not dialogue:
                continue

            stats["total"] += 1

            # QUALITY CHECK
            # Analizziamo tutte le risposte dell'assistant
            assistant_text = " ".join(
                [t["content"] for t in dialogue if t["role"] == "assistant"]
            )
            metrics = self.analyzer.analyze_text(assistant_text)

            entry = {"scene": scene, "metrics": metrics, "conversations": dialogue}

            raw_data.append(entry)

            # Filtro Qualità (Soglia: Score > 0.5)
            if metrics["score"] >= 0.5:
                print(
                    f"   ✅ ACCEPTED (Score: {metrics['score']} | Mix: {metrics['cmr']})"
                )
                # Formattazione per Unsloth (ShareGPT format)
                gold_data.append({"conversations": dialogue})
                stats["accepted"] += 1
            else:
                print(f"   ❌ REJECTED (Score: {metrics['score']} - Too flat/robotic)")
                stats["rejected"] += 1

            # Rispetto rate limits
            time.sleep(1.5)

        # SAVE ARTIFACTS
        self.save_jsonl(raw_data, "raw_with_metrics.jsonl")
        self.save_jsonl(gold_data, "train_zantara_gold.jsonl")
        self.save_report(stats)

        print("\n🏆 Pipeline Finished.")
        print(f"   Accepted Data: {len(gold_data)} conversations")
        print(f"   Artifacts saved in: {self.output_dir}")
        return self.output_dir + "/train_zantara_gold.jsonl"

    def save_jsonl(self, data, filename):
        path = os.path.join(self.output_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            for entry in data:
                f.write(json.dumps(entry) + "\n")

    def save_report(self, stats):
        path = os.path.join(self.output_dir, "report.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2)


if __name__ == "__main__":
    engine = ZantaraDataEngine()
    # Generiamo 50 conversazioni (usando circa 5-10 chiamate API se facciamo batch,
    # ma qui facciamo 1 per 1 per massima qualità e controllo)
    engine.run_pipeline(num_conversations=50)
