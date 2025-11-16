#!/usr/bin/env python3
"""
Jakarta Youth Conversational Dataset Generator (CLAUDE 10)

Generates 1,500 ultra-realistic Jakarta Gen-Z youth conversations for fine-tuning.
Focuses on authentic youth culture: campus life, K-pop/anime, gaming, TikTok, activism.

Distribution:
- 300 University life conversations
- 300 K-pop/anime culture conversations
- 300 Online gaming conversations
- 300 TikTok trends conversations
- 300 Youth activism conversations
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import httpx
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class JakartaYouthGenerator:
    """Generates Jakarta Gen-Z youth conversations using Claude API"""

    # Ultra-detailed prompt for Jakarta youth conversations
    PROMPT_TEMPLATE = """You are an expert at generating ultra-realistic Indonesian conversations in Jakarta Gen-Z youth style (ages 17-25).

# YOUR MISSION
Generate a completely natural conversation that sounds EXACTLY like real WhatsApp/DM messages between Jakarta youth in 2024-2025.

# CRITICAL: JAKARTA YOUTH (GEN-Z) AUTHENTICITY

## Latest Gen-Z Slang (MUST USE 15-25% word density):
- **bestie** (close friend): "bestie, dengerin deh!"
- **spill** (share/tell): "spill dong ceritanya"
- **healing** (self-care/relaxing): "weekend mau healing aja"
- **toxic** (unhealthy): "itu toxic banget sih relationship-nya"
- **red flag** (warning sign): "dia red flag parah"
- **green flag** (positive sign): "wah green flag banget!"
- **delulu** (delusional): "jangan delulu deh"
- **gaslighting** (manipulation): "itu gaslighting namanya"
- **ghosting** (ignoring): "dia ghosting gue sekarang"
- **valid** (understandable): "perasaan lu valid kok"
- **relate** (can relate): "gue relate banget sih"
- **vibe** (atmosphere/feeling): "vibe-nya enak banget"
- **cringe** (embarrassing): "aduh cringe banget"
- **slay** (do great): "kamu slay banget hari ini"
- **lewat/skip** (pass/skip): "lewat aja deh yang toxic"
- **fomo** (fear of missing out): "gue fomo nih ga ikut"
- **legit** (legitimate/real): "itu legit ga sih?"
- **stan** (strong fan): "gue stan dia parah"
- **ship** (support relationship): "gue ship kalian berdua"

## Particles (60%+ of messages MUST have at least one):
- **sih** (softener): "kenapa sih?", "enak sih"
- **dong** (emphasis): "kasih tau dong", "iya dong"
- **kan** (agreement): "udah jelas kan?", "enak kan?"
- **deh** (acceptance): "udah deh", "oke deh"
- **kok** (surprise): "kok gitu?", "kok bisa?"
- **lho** (surprise): "masa sih lho?"
- **tuh** (pointing): "nah tuh kan"

## Jakarta Youth Speech Patterns:
- Heavy use of **gue/gw** (I) and **lu/lo** (you)
- Contractions: **udah** (sudah), **gimana** (bagaimana), **emang** (memang), **kalo** (kalau), **trus** (terus), **abis** (habis)
- **banget** (very), **parah** (extreme), **anjir/anjay** (exclamation)
- **asli** (really), **beneran** (really/seriously)
- **gas/gaskeun** (let's go), **receh** (cheap/silly)

## English Code-Switching (Natural, 10-20%):
Mix English naturally in ALL contexts (youth do this constantly):
- "btw", "literally", "awkward banget", "vibe check"
- "gue relate", "she's slay", "that's so random"
- Topic-specific: "deadline", "assignment", "bias", "comeback", "rank", "push", "nerf"

## Emoji Usage (Youth love emojis!):
Use emojis frequently (30-40% of messages):
- 😭 (crying/laughing), 💀 (dead from laughing), ✨ (emphasis)
- 🥺 (pleading), 😩 (stressed), 🤡 (clown/foolish)
- 💯 (100/agreement), 🔥 (fire/cool), 💅 (sassy)
- Subject-specific: 📚 (study), 🎮 (gaming), 💜 (K-pop), 🎬 (content)

## Message Structure (Natural Youth Texting):
- Short bursts: 1-2 sentences per message
- Multi-message thoughts (like rapid texting)
- Typos/corrections are realistic: "gue... maksud gue..."
- Reactions/exclamations: "ANJIR", "WHATTT", "GASSS"

# TOPIC FOCUS: {topic}

{topic_context}

# CONVERSATION LENGTH: {length} messages (5-30 range)

Natural flow:
1. Opening (1-3 messages)
2. Main topic (varied based on length)
3. Natural tangents (youth conversations wander!)
4. Closing (1-2 messages or natural fade)

# OUTPUT FORMAT (STRICT JSON)

Return ONLY valid JSON (no markdown, no explanations):

```json
{{
  "conversation_id": "jkt_youth_{topic_code}_{timestamp}",
  "style": "{style}",
  "topic": "{topic}",
  "messages": [
    {{
      "speaker": "user",
      "message": "bestie help!! tugas pkn deadline besok blm gw sentuh sama sekali 😭",
      "timestamp_offset": 0,
      "metadata": {{
        "emotion": "panicked",
        "formality_level": 1,
        "contains_particles": false,
        "contains_slang": true,
        "gen_z_marker": true
      }}
    }},
    {{
      "speaker": "assistant",
      "message": "waduh parah sih lu! yaudah gaskeun sekarang, gw bantuin cari referensi deh",
      "timestamp_offset": 2,
      "metadata": {{
        "emotion": "supportive",
        "formality_level": 1,
        "contains_particles": true,
        "contains_slang": true,
        "gen_z_marker": true
      }}
    }}
  ],
  "quality_metrics": {{
    "naturalness_score": 9,
    "youth_authenticity": 10,
    "slang_current": 9,
    "trend_awareness": 8
  }}
}}
```

# EXAMPLES OF AUTHENTICITY

## ❌ WRONG (Too formal/outdated):
User: "Saya ingin bertanya tentang tugas kuliah."
Assistant: "Baik, silakan bertanya."

## ✅ CORRECT (Natural Jakarta youth):
User: "bestie gue mau nanya dong, lu udah ngerjain tugas statistik belum? 😭"
User: "gue literally ga ngerti sama sekali"
Assistant: "belom juga sih, parah banget emang dosennya"
Assistant: "yuk gaspol bareng nanti, gue udah nemu referensi lumayan"

## ❌ WRONG (No Gen-Z markers):
User: "Kamu suka K-pop tidak?"
Assistant: "Ya, saya suka."

## ✅ CORRECT (Youth energy + slang):
User: "LU UDAH LIAT MV BARU?? 😭😭"
User: "gue ga bisa move on, bias gue slay abis"
Assistant: "OMG IYA!! literally nonton 10x udah 💀"
Assistant: "choreo-nya insane sih, gue stan mereka parah"

# NOW GENERATE THE CONVERSATION

Generate {length} messages total with these requirements:
- 60%+ messages must contain particles (sih/dong/kan/deh/kok)
- 15-25% words must be Gen-Z slang
- Natural emoji usage (30-40% of messages)
- Authentic youth energy and trends awareness
- Completely unique content

Generate now:"""

    TOPIC_CONTEXTS = {
        "university": """
**University Life Context**

Scenarios: Assignments/deadlines, group projects, campus drama, lectures, exams, student orgs, kampus merdeka
Vocabulary: tugas, deadline, dosen, UTS/UAS, skripsi, magang, organisasi
Emotions: Stressed, procrastinating, relieved, competitive, collaborative
Youth elements: Study groups, deadline panic, campus gossip, professor complaints
""",
        "kpop_anime": """
**K-pop/Anime Culture Context**

Scenarios: Comebacks, bias discussions, concert plans, merchandise, fanwars, recommendations, watching parties
Vocabulary: bias, comeback, MV, photocard, lightstick, fancam, oshi, waifu/husbando, arc
Emotions: Excited, obsessed, defending favorites, sharing discoveries
Youth elements: Fan culture, streaming goals, collection showing, theory discussions
""",
        "gaming": """
**Online Gaming Context**

Scenarios: Rank grinding, team coordination, game updates, toxic teammates, winning/losing streaks, new releases
Vocabulary: rank, push, nerf, buff, toxic, carry, throw, AFK, lag, ping, meta
Emotions: Competitive, frustrated, hyped, tilted, victorious
Youth elements: Late night gaming, trash talk, team coordination, game updates discussion
""",
        "tiktok": """
**TikTok Trends Context**

Scenarios: Viral trends, dance challenges, FYP discussions, content creation, duets, trending sounds
Vocabulary: FYP (For You Page), sound, trend, viral, algorithm, duet, stitch, draft
Emotions: Excited, creative, FOMO, cringe at old trends, proud of views
Youth elements: Trend participation, view counting, creator mode, sound hunting
""",
        "activism": """
**Youth Activism Context**

Scenarios: Social issues, environmental concerns, mental health awareness, educational reform, equality discussions
Vocabulary: awareness, isu, campaign, petition, gerakan, hak, kesetaraan, sustainable
Emotions: Passionate, frustrated with system, hopeful, determined, empowered
Youth elements: Social media activism, peer education, collective action, progressive values
"""
    }

    def __init__(self, anthropic_api_key: str):
        """Initialize generator with API key"""
        self.api_key = anthropic_api_key
        self.model = "claude-sonnet-4-5-20250929"
        self.api_url = "https://api.anthropic.com/v1/messages"

    async def generate_conversation(
        self,
        style: str,
        topic: str,
        conversation_id: str
    ) -> Optional[Dict]:
        """Generate single conversation"""

        # Randomize length (5-30 messages)
        import random
        length = random.randint(5, 30)

        topic_code = topic[:3]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')

        logger.info(f"🔄 Generating: {conversation_id} ({topic}, {length} msgs)")

        prompt = self.PROMPT_TEMPLATE.format(
            topic=topic,
            topic_context=self.TOPIC_CONTEXTS[style],
            length=length,
            style=style,
            topic_code=topic_code,
            timestamp=timestamp
        )

        try:
            result = await self._call_claude_api(prompt)

            if not result:
                logger.error(f"❌ Generation failed: {conversation_id}")
                return None

            conversation_data = self._parse_response(result, conversation_id)

            if conversation_data:
                msg_count = len(conversation_data.get('messages', []))
                quality = conversation_data.get('quality_metrics', {}).get('youth_authenticity', 0)
                logger.info(f"✅ Generated: {conversation_id} ({msg_count} msgs, quality: {quality}/10)")

            return conversation_data

        except Exception as e:
            logger.error(f"❌ Failed {conversation_id}: {e}")
            return None

    async def _call_claude_api(self, prompt: str) -> Optional[str]:
        """Call Claude API"""
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 4000,
                        "temperature": 0.9,  # High creativity for youth conversations
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                response.raise_for_status()
                data = response.json()

                content = data.get("content", [])
                if content and len(content) > 0:
                    return content[0].get("text", "")

                return None

        except Exception as e:
            logger.error(f"❌ API call failed: {e}")
            return None

    def _parse_response(self, response: str, conversation_id: str) -> Optional[Dict]:
        """Parse JSON response"""
        try:
            # Clean markdown code blocks
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)

            # Validate structure
            if "messages" not in data:
                logger.error("❌ Missing 'messages' field")
                return None

            # Ensure conversation_id
            data["conversation_id"] = conversation_id

            return data

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.error(f"Response preview: {response[:500]}...")
            return None
        except Exception as e:
            logger.error(f"❌ Parse error: {e}")
            return None


async def generate_all_conversations():
    """Generate all 1,500 Jakarta youth conversations"""

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("❌ ANTHROPIC_API_KEY not set")
        return

    generator = JakartaYouthGenerator(anthropic_api_key=api_key)

    # Define distribution
    distribution = [
        ("university", 300),
        ("kpop_anime", 300),
        ("gaming", 300),
        ("tiktok", 300),
        ("activism", 300)
    ]

    all_conversations = []
    total_target = 1500

    logger.info("=" * 80)
    logger.info("🚀 JAKARTA YOUTH DATASET GENERATOR - CLAUDE 10")
    logger.info("=" * 80)
    logger.info(f"Target: {total_target} conversations")
    logger.info("Distribution:")
    for style, count in distribution:
        logger.info(f"  - {style}: {count} conversations")
    logger.info("=" * 80)

    # Generate conversations
    for style, count in distribution:
        logger.info(f"\n📝 Generating {count} {style} conversations...")

        for i in range(count):
            conversation_id = f"jkt_youth_{style}_{i+1:04d}"

            conversation = await generator.generate_conversation(
                style=style,
                topic=style,
                conversation_id=conversation_id
            )

            if conversation:
                all_conversations.append(conversation)

            # Progress update every 10 conversations
            if (i + 1) % 10 == 0:
                logger.info(f"  Progress: {i+1}/{count} ({(i+1)/count*100:.1f}%)")

            # Small delay to avoid rate limits
            await asyncio.sleep(0.5)

    logger.info("\n" + "=" * 80)
    logger.info(f"✅ Generation complete: {len(all_conversations)}/{total_target} conversations")
    logger.info("=" * 80)

    # Create final dataset
    dataset = {
        "dataset_id": "jakarta_youth_claude10",
        "total_conversations": len(all_conversations),
        "generated_at": datetime.now().isoformat(),
        "model": "claude-sonnet-4-5-20250929",
        "distribution": {
            "university": sum(1 for c in all_conversations if c.get("style") == "university"),
            "kpop_anime": sum(1 for c in all_conversations if c.get("style") == "kpop_anime"),
            "gaming": sum(1 for c in all_conversations if c.get("style") == "gaming"),
            "tiktok": sum(1 for c in all_conversations if c.get("style") == "tiktok"),
            "activism": sum(1 for c in all_conversations if c.get("style") == "activism")
        },
        "conversations": all_conversations
    }

    # Save to file
    output_file = Path(__file__).parent.parent.parent / "claude10_jakarta_youth.json"

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    logger.info(f"\n💾 Saved to: {output_file}")
    logger.info(f"📊 Total size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")

    # Print statistics
    logger.info("\n📈 Dataset Statistics:")
    logger.info(f"  Total conversations: {dataset['total_conversations']}")
    logger.info(f"  Distribution:")
    for key, value in dataset['distribution'].items():
        logger.info(f"    - {key}: {value}")

    total_messages = sum(len(c.get('messages', [])) for c in all_conversations)
    avg_messages = total_messages / len(all_conversations) if all_conversations else 0
    logger.info(f"  Total messages: {total_messages}")
    logger.info(f"  Average messages per conversation: {avg_messages:.1f}")

    # Quality metrics
    if all_conversations:
        avg_youth_auth = sum(
            c.get('quality_metrics', {}).get('youth_authenticity', 0)
            for c in all_conversations
        ) / len(all_conversations)

        avg_naturalness = sum(
            c.get('quality_metrics', {}).get('naturalness_score', 0)
            for c in all_conversations
        ) / len(all_conversations)

        logger.info(f"\n🎯 Quality Metrics (Average):")
        logger.info(f"  Youth Authenticity: {avg_youth_auth:.2f}/10")
        logger.info(f"  Naturalness: {avg_naturalness:.2f}/10")

    logger.info("\n✨ GENERATION COMPLETE! ✨")

    return dataset


if __name__ == "__main__":
    asyncio.run(generate_all_conversations())
