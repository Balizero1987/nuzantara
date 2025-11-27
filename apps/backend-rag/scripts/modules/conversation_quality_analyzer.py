"""
Conversation Quality Analyzer

Analyzes Indonesian conversational datasets for naturalness and authenticity.
Provides detailed metrics and recommendations for improvement.

Metrics:
- Particle usage (dong, sih, deh, kok, kan, lho, tuh)
- Slang density (gue, lu, banget, parah, etc.)
- Code-switching patterns
- Emotional variety
- Memory references
- Turn-taking naturalness
"""

import json
import logging
import re
from collections import Counter

logger = logging.getLogger(__name__)


class ConversationQualityAnalyzer:
    """
    Analyzes quality and naturalness of Indonesian conversations
    """

    # Indonesian particles
    PARTICLES = ["dong", "sih", "deh", "kok", "kan", "lho", "tuh", "ya", "nih", "gitu", "gini"]

    # Jakarta millennial slang
    SLANG_WORDS = [
        # Pronouns
        "gue",
        "gw",
        "lu",
        "lo",
        "elu",
        # Intensifiers
        "banget",
        "parah",
        "bgt",
        "anjir",
        "asoy",
        # Adjectives/States
        "santuy",
        "santai",
        "receh",
        "keren",
        "mantap",
        "mantul",
        "kepo",
        "baper",
        "mager",
        "gabut",
        "garing",
        # Verbs/Actions
        "bokap",
        "nyokap",
        "gebetan",
        "nongkrong",
        "ngobrol",
        # Shortcuts
        "gapapa",
        "gamau",
        "gaboleh",
        "gatau",
        "gimana",
        "kenapa",
        "udah",
        "belom",
        "emang",
        "kalo",
        "trus",
        "abis",
        # Casual
        "kuy",
        "yuk",
        "sip",
        "oke",
        "cuy",
        "bro",
        "gan",
    ]

    # Code-switching indicators (English in Indonesian context)
    ENGLISH_BUSINESS_TERMS = [
        "deadline",
        "meeting",
        "follow up",
        "update",
        "feedback",
        "business plan",
        "investment",
        "roi",
        "timeline",
        "process",
    ]

    # Emotional indicators
    EMOTIONAL_MARKERS = {
        "curious": ["tanya", "gimana", "kenapa", "apa", "bisa"],
        "worried": ["khawatir", "takut", "bingung", "ribet", "susah"],
        "relieved": ["lega", "oke sih", "lumayan", "gapapa", "tenang"],
        "excited": ["asik", "keren", "mantap", "wah", "seru"],
        "grateful": ["makasih", "thanks", "terima kasih", "helpful", "appreciate"],
        "frustrated": ["aduh", "cape", "lama banget", "parah", "males"],
    }

    # Memory reference patterns
    MEMORY_PATTERNS = [
        r"tadi\s+(lu|kamu|elu)\s+bilang",
        r"yang\s+(gue|aku)\s+tanya\s+sebelumnya",
        r"balik\s+lagi\s+ke",
        r"nah\s+itu\s+dia",
        r"hampir\s+lupa",
        r"oh\s+iya\s+bener",
    ]

    def analyze_conversation(self, conversation: dict) -> dict:
        """
        Analyze conversation quality

        Args:
            conversation: Conversation dict with messages

        Returns:
            Analysis results with scores and recommendations
        """
        messages = conversation.get("messages", [])

        if not messages:
            return {"error": "No messages found"}

        # Extract all text
        all_text = " ".join([msg.get("content", "") for msg in messages])
        user_messages = [msg.get("content", "") for msg in messages if msg.get("role") == "user"]
        assistant_messages = [
            msg.get("content", "") for msg in messages if msg.get("role") == "assistant"
        ]

        # Run all analyses
        particle_analysis = self._analyze_particles(messages)
        slang_analysis = self._analyze_slang(all_text)
        code_switch_analysis = self._analyze_code_switching(all_text)
        emotional_analysis = self._analyze_emotions(messages)
        memory_analysis = self._analyze_memory_references(messages)
        flow_analysis = self._analyze_conversation_flow(messages)

        # Calculate overall quality score (weighted 100-point scale)
        quality_score = self._calculate_quality_score(
            particle_analysis,
            slang_analysis,
            code_switch_analysis,
            emotional_analysis,
            memory_analysis,
            flow_analysis,
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            particle_analysis, slang_analysis, emotional_analysis, memory_analysis, quality_score
        )

        return {
            "conversation_id": conversation.get("conversation_id", "unknown"),
            "message_count": len(messages),
            "metrics": {
                "particles": particle_analysis,
                "slang": slang_analysis,
                "code_switching": code_switch_analysis,
                "emotions": emotional_analysis,
                "memory_references": memory_analysis,
                "flow": flow_analysis,
            },
            "quality_score": quality_score,
            "recommendations": recommendations,
        }

    def _analyze_particles(self, messages: list[dict]) -> dict:
        """Analyze particle usage"""
        total_messages = len(messages)
        messages_with_particles = 0
        particle_counts = Counter()

        for msg in messages:
            content = msg.get("content", "").lower()
            found_particles = []

            for particle in self.PARTICLES:
                # Match particle as whole word
                if re.search(rf"\b{particle}\b", content):
                    found_particles.append(particle)
                    particle_counts[particle] += 1

            if found_particles:
                messages_with_particles += 1

        coverage = (messages_with_particles / total_messages * 100) if total_messages > 0 else 0

        return {
            "total_messages": total_messages,
            "messages_with_particles": messages_with_particles,
            "coverage_percentage": round(coverage, 2),
            "particle_counts": dict(particle_counts.most_common()),
            "score": min(10, int(coverage / 5)),  # 50% coverage = 10/10
        }

    def _analyze_slang(self, text: str) -> dict:
        """Analyze slang density"""
        text_lower = text.lower()
        words = re.findall(r"\b\w+\b", text_lower)
        total_words = len(words)

        slang_found = Counter()
        for word in words:
            if word in self.SLANG_WORDS:
                slang_found[word] += 1

        slang_count = sum(slang_found.values())
        density = (slang_count / total_words * 100) if total_words > 0 else 0

        # Target: 10-15% for natural conversations
        if 10 <= density <= 15:
            score = 10
        elif 5 <= density < 10:
            score = 7
        elif 15 < density <= 20:
            score = 8
        else:
            score = 5

        return {
            "total_words": total_words,
            "slang_count": slang_count,
            "density_percentage": round(density, 2),
            "slang_found": dict(slang_found.most_common(10)),
            "score": score,
        }

    def _analyze_code_switching(self, text: str) -> dict:
        """Analyze code-switching patterns"""
        text_lower = text.lower()

        # Count English business terms
        english_terms_found = Counter()
        for term in self.ENGLISH_BUSINESS_TERMS:
            count = len(re.findall(rf"\b{term}\b", text_lower))
            if count > 0:
                english_terms_found[term] = count

        total_switches = sum(english_terms_found.values())

        return {
            "total_code_switches": total_switches,
            "terms_found": dict(english_terms_found.most_common()),
            "is_natural": total_switches > 0 and total_switches < 20,  # Not too much, not none
            "score": 8 if (0 < total_switches < 15) else 5,
        }

    def _analyze_emotions(self, messages: list[dict]) -> dict:
        """Analyze emotional variety and progression"""
        emotion_timeline = []

        for msg in messages:
            content = msg.get("content", "").lower()
            detected_emotions = []

            for emotion, markers in self.EMOTIONAL_MARKERS.items():
                for marker in markers:
                    if marker in content:
                        detected_emotions.append(emotion)
                        break

            if detected_emotions:
                emotion_timeline.append({"role": msg.get("role"), "emotions": detected_emotions})

        unique_emotions = set()
        for entry in emotion_timeline:
            unique_emotions.update(entry["emotions"])

        variety_score = min(10, len(unique_emotions) * 2)  # 5 different emotions = 10/10

        return {
            "unique_emotions_count": len(unique_emotions),
            "emotions_detected": list(unique_emotions),
            "emotion_timeline": emotion_timeline,
            "variety_score": variety_score,
        }

    def _analyze_memory_references(self, messages: list[dict]) -> dict:
        """Analyze memory references between messages"""
        memory_refs_found = []

        for i, msg in enumerate(messages):
            content = msg.get("content", "").lower()

            for pattern in self.MEMORY_PATTERNS:
                if re.search(pattern, content):
                    memory_refs_found.append(
                        {"message_index": i, "role": msg.get("role"), "pattern": pattern}
                    )

        count = len(memory_refs_found)
        score = min(10, count * 2)  # 5 references = 10/10

        return {"total_references": count, "references_found": memory_refs_found, "score": score}

    def _analyze_conversation_flow(self, messages: list[dict]) -> dict:
        """Analyze conversation flow and turn-taking"""
        turns = []
        current_role = None
        consecutive_count = 0

        for msg in messages:
            role = msg.get("role")

            if role == current_role:
                consecutive_count += 1
            else:
                if current_role:
                    turns.append({"role": current_role, "consecutive_messages": consecutive_count})
                current_role = role
                consecutive_count = 1

        # Add last turn
        if current_role:
            turns.append({"role": current_role, "consecutive_messages": consecutive_count})

        # Natural flow: some multi-message bursts but not too many
        multi_message_turns = [t for t in turns if t["consecutive_messages"] > 1]
        is_natural = len(multi_message_turns) > 0 and len(multi_message_turns) < len(turns)

        return {
            "total_turns": len(turns),
            "multi_message_turns": len(multi_message_turns),
            "is_natural_flow": is_natural,
            "score": 9 if is_natural else 6,
        }

    def _calculate_quality_score(
        self,
        particle_analysis: dict,
        slang_analysis: dict,
        code_switch_analysis: dict,
        emotional_analysis: dict,
        memory_analysis: dict,
        flow_analysis: dict,
    ) -> int:
        """
        Calculate overall quality score (weighted 100-point scale)

        Weights:
        - Particles: 25% (critical for naturalness)
        - Slang: 20% (Jakarta millennial authenticity)
        - Emotions: 20% (variety and engagement)
        - Flow: 15% (natural turn-taking)
        - Memory: 10% (coherence for longer conversations)
        - Code-switching: 10% (contextual appropriateness)
        """
        weights = {
            "particles": 0.25,
            "slang": 0.20,
            "emotions": 0.20,
            "flow": 0.15,
            "memory": 0.10,
            "code_switching": 0.10,
        }

        score = (
            particle_analysis["score"] * weights["particles"] * 10
            + slang_analysis["score"] * weights["slang"] * 10
            + emotional_analysis["variety_score"] * weights["emotions"] * 10
            + flow_analysis["score"] * weights["flow"] * 10
            + memory_analysis["score"] * weights["memory"] * 10
            + code_switch_analysis["score"] * weights["code_switching"] * 10
        )

        return int(score)

    def _generate_recommendations(
        self,
        particle_analysis: dict,
        slang_analysis: dict,
        emotional_analysis: dict,
        memory_analysis: dict,
        quality_score: int,
    ) -> list[str]:
        """Generate improvement recommendations"""
        recommendations = []

        # Particle recommendations
        if particle_analysis["coverage_percentage"] < 30:
            recommendations.append(
                f"❌ LOW PARTICLE USAGE ({particle_analysis['coverage_percentage']}%): "
                f"Increase usage of particles (dong, sih, deh, kok) to 40-60% of messages for naturalness."
            )
        elif particle_analysis["coverage_percentage"] < 40:
            recommendations.append(
                f"⚠️ MODERATE PARTICLE USAGE ({particle_analysis['coverage_percentage']}%): "
                f"Good start, but aim for 50%+ coverage for authentic Jakarta speech."
            )
        else:
            recommendations.append(
                f"✅ EXCELLENT PARTICLE USAGE ({particle_analysis['coverage_percentage']}%): "
                f"Natural Jakarta millennial speech patterns achieved."
            )

        # Slang recommendations
        if slang_analysis["density_percentage"] < 5:
            recommendations.append(
                f"❌ LOW SLANG DENSITY ({slang_analysis['density_percentage']}%): "
                f"Add more Jakarta slang (gue/lu, banget, parah) to reach 10-15% density."
            )
        elif 5 <= slang_analysis["density_percentage"] < 10:
            recommendations.append(
                f"⚠️ MODERATE SLANG DENSITY ({slang_analysis['density_percentage']}%): "
                f"Increase to 10-15% for authentic millennial voice."
            )
        elif 10 <= slang_analysis["density_percentage"] <= 15:
            recommendations.append(
                f"✅ OPTIMAL SLANG DENSITY ({slang_analysis['density_percentage']}%): "
                f"Perfect balance for natural Jakarta conversations."
            )
        else:
            recommendations.append(
                f"⚠️ HIGH SLANG DENSITY ({slang_analysis['density_percentage']}%): "
                f"May feel forced. Reduce slightly to 10-15% range."
            )

        # Emotional recommendations
        if emotional_analysis["unique_emotions_count"] < 3:
            recommendations.append(
                f"❌ LIMITED EMOTIONAL VARIETY ({emotional_analysis['unique_emotions_count']} emotions): "
                f"Add more emotional range (curious, worried, relieved, excited, grateful) for engagement."
            )
        elif emotional_analysis["unique_emotions_count"] < 4:
            recommendations.append(
                f"⚠️ MODERATE EMOTIONAL VARIETY ({emotional_analysis['unique_emotions_count']} emotions): "
                f"Good start, aim for 5+ different emotions in conversation."
            )
        else:
            recommendations.append(
                f"✅ RICH EMOTIONAL VARIETY ({emotional_analysis['unique_emotions_count']} emotions): "
                f"Natural emotional progression achieved."
            )

        # Memory recommendations (for medium/long conversations)
        if memory_analysis["total_references"] == 0:
            recommendations.append(
                "⚠️ NO MEMORY REFERENCES: "
                "For longer conversations, add callbacks to earlier messages (e.g., 'Tadi lu bilang...')."
            )
        elif memory_analysis["total_references"] < 3:
            recommendations.append(
                f"⚠️ FEW MEMORY REFERENCES ({memory_analysis['total_references']}): "
                f"Add more callbacks for better coherence in longer conversations."
            )
        else:
            recommendations.append(
                f"✅ GOOD MEMORY REFERENCES ({memory_analysis['total_references']}): "
                f"Strong conversational coherence."
            )

        # Overall quality
        if quality_score >= 80:
            recommendations.append(
                f"\n🎉 OVERALL QUALITY: {quality_score}/100 - EXCELLENT! Ready for dataset."
            )
        elif quality_score >= 70:
            recommendations.append(
                f"\n✅ OVERALL QUALITY: {quality_score}/100 - GOOD. Minor improvements recommended."
            )
        elif quality_score >= 60:
            recommendations.append(
                f"\n⚠️ OVERALL QUALITY: {quality_score}/100 - ACCEPTABLE. Needs improvement."
            )
        else:
            recommendations.append(
                f"\n❌ OVERALL QUALITY: {quality_score}/100 - BELOW THRESHOLD. Major revisions needed."
            )

        return recommendations


def analyze_conversation_from_file(file_path: str) -> dict:
    """
    Convenience function to analyze conversation from JSON file

    Args:
        file_path: Path to conversation JSON file

    Returns:
        Analysis results
    """
    try:
        with open(file_path, encoding="utf-8") as f:
            conversation = json.load(f)

        analyzer = ConversationQualityAnalyzer()
        results = analyzer.analyze_conversation(conversation)

        return results

    except Exception as e:
        logger.error(f"❌ Failed to analyze file {file_path}: {e}")
        return {"error": str(e)}


def print_analysis_report(analysis: dict):
    """
    Print formatted analysis report

    Args:
        analysis: Analysis results dict
    """
    print("\n" + "=" * 80)
    print("CONVERSATION QUALITY ANALYSIS REPORT")
    print("=" * 80)

    print(f"\nConversation ID: {analysis.get('conversation_id')}")
    print(f"Message Count: {analysis.get('message_count')}")
    print(f"Overall Quality Score: {analysis.get('quality_score')}/100")

    print("\n" + "-" * 80)
    print("METRICS BREAKDOWN")
    print("-" * 80)

    metrics = analysis.get("metrics", {})

    # Particles
    particles = metrics.get("particles", {})
    print("\n📝 PARTICLES:")
    print(
        f"   Coverage: {particles.get('coverage_percentage')}% ({particles.get('messages_with_particles')}/{particles.get('total_messages')} messages)"
    )
    print(f"   Score: {particles.get('score')}/10")
    if particles.get("particle_counts"):
        print(
            f"   Most used: {', '.join([f'{k}({v})' for k, v in list(particles['particle_counts'].items())[:5]])}"
        )

    # Slang
    slang = metrics.get("slang", {})
    print("\n🗣️  SLANG:")
    print(
        f"   Density: {slang.get('density_percentage')}% ({slang.get('slang_count')}/{slang.get('total_words')} words)"
    )
    print(f"   Score: {slang.get('score')}/10")
    if slang.get("slang_found"):
        print(
            f"   Most used: {', '.join([f'{k}({v})' for k, v in list(slang['slang_found'].items())[:5]])}"
        )

    # Emotions
    emotions = metrics.get("emotions", {})
    print("\n😊 EMOTIONS:")
    print(f"   Unique emotions: {emotions.get('unique_emotions_count')}")
    print(f"   Detected: {', '.join(emotions.get('emotions_detected', []))}")
    print(f"   Score: {emotions.get('variety_score')}/10")

    # Memory
    memory = metrics.get("memory_references", {})
    print("\n🧠 MEMORY REFERENCES:")
    print(f"   Total: {memory.get('total_references')}")
    print(f"   Score: {memory.get('score')}/10")

    # Flow
    flow = metrics.get("flow", {})
    print("\n🔄 CONVERSATION FLOW:")
    print(f"   Natural flow: {'Yes' if flow.get('is_natural_flow') else 'No'}")
    print(f"   Multi-message turns: {flow.get('multi_message_turns')}/{flow.get('total_turns')}")
    print(f"   Score: {flow.get('score')}/10")

    # Code-switching
    code_switch = metrics.get("code_switching", {})
    print("\n🌐 CODE-SWITCHING:")
    print(f"   Total switches: {code_switch.get('total_code_switches')}")
    print(f"   Natural: {'Yes' if code_switch.get('is_natural') else 'No'}")
    print(f"   Score: {code_switch.get('score')}/10")

    print("\n" + "-" * 80)
    print("RECOMMENDATIONS")
    print("-" * 80)

    for rec in analysis.get("recommendations", []):
        print(f"\n{rec}")

    print("\n" + "=" * 80)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python conversation_quality_analyzer.py <conversation_json_file>")
        sys.exit(1)

    file_path = sys.argv[1]
    analysis = analyze_conversation_from_file(file_path)

    if "error" in analysis:
        print(f"❌ Error: {analysis['error']}")
        sys.exit(1)

    print_analysis_report(analysis)
