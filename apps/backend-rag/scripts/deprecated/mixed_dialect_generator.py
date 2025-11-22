"""
Mixed Indonesian Dialect Conversation Generator

Generates ultra-realistic conversations mixing Indonesian dialects:
- Jakarta-Javanese
- Jakarta-Sundanese
- Jakarta-Balinese
- Multi-dialect family
- Inter-cultural relationships

Features natural code-switching, cultural markers, and authentic dialect mixing.
"""

import logging
import json
import asyncio
import os
from typing import Dict, List, Optional, Literal
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)


class MixedDialectGenerator:
    """Generates mixed Indonesian dialect conversations using Claude API"""

    PROMPT_TEMPLATE = """You are an expert at generating ultra-realistic mixed Indonesian dialect conversations.

# YOUR MISSION
Generate a completely natural conversation showing authentic code-switching between {primary_dialect} and {secondary_dialect}.

# DIALECT SPECIFICATIONS

## Jakarta Base (Always Present)
- Particles: dong, sih, deh, kok, kan, lho, tuh
- Slang: gue/lu, banget, parah, asoy, kepo, santuy
- Contractions: gapapa, udah, belom, gimana, emang

{dialect_features}

# CRITICAL REQUIREMENTS

## 1. NATURAL CODE-SWITCHING
- Switch dialects based on emotion, topic, or emphasis
- Emotional moments often trigger native dialect
- Formal topics may shift to Jakarta Indonesian
- Family/cultural topics trigger regional dialect
- Target: {code_switch_density}% dialect switches

## 2. CULTURAL MARKERS
{cultural_markers}

## 3. CONVERSATION CONTEXT: {context}
{context_details}

## 4. TOPIC: {topic}
{topic_details}

## 5. LENGTH TARGET
Generate {min_messages}-{max_messages} messages naturally distributed between user and assistant.

## 6. AUTHENTIC DYNAMICS
{relationship_dynamics}

# OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no explanations):

```json
{{
  "conversation_id": "{style}_{context}_{topic}_TIMESTAMP",
  "style": "{style}",
  "context": "{context}",
  "topic": "{topic}",
  "messages": [
    {{
      "speaker": "user",
      "message": "Ma, untuk resepsi nanti pake adat Jawa atau modern aja ya?",
      "timestamp_offset": 0,
      "metadata": {{
        "emotion": "uncertain",
        "primary_dialect": "jakarta",
        "secondary_dialect": "javanese",
        "code_switch": true
      }}
    }},
    {{
      "speaker": "assistant",
      "message": "Wah nek saya sih maunya tetep ada Jawanya dikit, tapi modern juga gapapa kok",
      "timestamp_offset": 4,
      "metadata": {{
        "emotion": "flexible",
        "primary_dialect": "javanese",
        "secondary_dialect": "jakarta",
        "code_switch": true
      }}
    }}
  ],
  "quality_metrics": {{
    "naturalness_score": 9,
    "dialect_balance": 8,
    "cultural_authenticity": 9,
    "code_switch_naturalness": 9
  }}
}}
```

# EXAMPLES OF AUTHENTICITY

## Jakarta-Javanese Mix
User: "Bu, aku lagi bingung nih soal pernikahan nanti"
Assistant: "Lho kenapa to nak? Ceritain aja sama Ibu"
User: "Mas kan orangnya modern banget, takutnya nggak cocok sama keluarga kita yang masih traditional"
Assistant: "Wah gapapa kok, yang penting saling menghormati. Nanti kita ajak ngobrol baik-baik"

## Jakarta-Sundanese Mix
User: "Mang, di Bandung teh gimana caranya cari tempat tinggal yang affordable?"
Assistant: "Tah kumaha ya... Di daerah Dago teh masih lumayan lah, tapi murah mah di Cimahi atuh"
User: "Oh iya? Kira-kira range harganya berapa Mang?"
Assistant: "Enya... sekitar 2-3 juta lah sebulan mah"

## Jakarta-Balinese Mix
User: "Bli, untuk upacara potong gigi nanti perlu persiapan apa aja nih?"
Assistant: "Nah niki penting nggih, pertama cari pedanda yang baik dulu, terus beli banten-banten"
User: "Wah pusing juga ya, banyak banget yang harus disiapkan"
Assistant: "Santai mawali, nanti keluarga pasti bantu kok. Ini tradisi penting di Bali"

NOW GENERATE THE CONVERSATION following all specifications above."""

    DIALECT_FEATURES = {
        "jakarta_javanese": """
## Javanese Elements to Mix In
- Particles: to, kok (Javanese usage), lho, nggih
- Pronouns: aku/kamu (familiar), saya (respectful)
- Words: nek (if), opo (what), sing (who/which), sak (one)
- Respectful: Bu/Pak, Mbak/Mas (older siblings)
- Common phrases: "Monggo" (please), "Nggih" (yes), "Matur nuwun" (thank you)
- Cultural: "jagongan" (chat), "kumpul-kumpul", "sungkem" (respect gesture)
""",
        "jakarta_sundanese": """
## Sundanese Elements to Mix In
- Particles: teh, mah, atuh, euy, pisan
- Pronouns: abdi/anjeun (polite), urang/sia (casual)
- Words: kumaha (how), naon (what), dimana (where), teu (no)
- Respectful: Mang/Bi, Teh/Kang
- Common phrases: "Punten" (excuse me), "Hatur nuhun" (thank you), "Muhun" (yes)
- Cultural: "ngarawat" (care for), "someah hade" (hospitality)
""",
        "jakarta_balinese": """
## Balinese Elements to Mix In
- Particles: nggih, niki, nika, to
- Pronouns: tiang/cai, icang/cai (very casual)
- Words: ken (what), bes (already), kaden (maybe), melah (good)
- Respectful: Bli/Mbok, Pak/Bu
- Common phrases: "Inggih" (yes), "Suksma" (thank you), "Ampura" (sorry)
- Cultural: "ngayah" (community service), "mepandes" (tooth filing), "otonan" (210-day birthday)
""",
        "multi_dialect": """
## Multi-Dialect Mixing (3+ dialects)
Mix elements from Jakarta + Javanese + Sundanese + Balinese naturally:
- Each speaker may have different dialect preferences
- Regional words slip in during emotional moments
- Cultural references from multiple regions
- Show mutual understanding despite different dialects
- Example: "Wah kumaha teh ini? Nek begini caranya, nanti susah nggih"
""",
        "intercultural": """
## Inter-Cultural Relationship Mix
- One partner: Jakarta Indonesian (base)
- Other partner: Regional dialect (Javanese/Sundanese/Balinese)
- Code-switch based on: emotion, family context, cultural topics
- Show cultural negotiation and learning
- Mixed vocabulary from both backgrounds
- Example: "Sayang, nanti pas ke rumah ortumu aku harus gimana? Harus ngomong Jawa halus ya?"
"""
    }

    CULTURAL_MARKERS = {
        "jakarta_javanese": """
- Family hierarchy: respect to elders, "sungkem" tradition
- Food: "gudeg", "tumpeng", "jenang"
- Events: "pengajian", "selamatan", "slapanan"
- Values: "nrimo" (acceptance), "tepo seliro" (empathy)
- Javanese calendar: "weton", "wetonan"
""",
        "jakarta_sundanese": """
- Hospitality: "someah hade", welcoming nature
- Food: "peuyeum", "oncom", "nasi timbel"
- Events: "rapat pasanakan" (family gathering)
- Values: "silih asah, silih asih, silih asuh" (mutual learning, love, care)
- Traditional clothing: "kebaya", "kampret"
""",
        "jakarta_balinese": """
- Daily offerings: "canang sari", "banten"
- Ceremonies: "ngaben" (cremation), "mepandes" (tooth filing), "nyepi"
- Community: "banjar", "subak", "ngayah"
- Calendar: "otonan" (210-day birthday), "galungan", "kuningan"
- Values: "Tri Hita Karana" (harmony)
""",
        "multi_dialect": """
- Mix cultural references from multiple regions
- Show cultural exchange and learning
- Different family traditions merging
- Food, events, values from various backgrounds
""",
        "intercultural": """
- Cultural negotiation and compromise
- Learning partner's traditions
- Mixed celebration of different cultural events
- Explaining cultural practices to partner
- Building new mixed-culture family traditions
"""
    }

    CONTEXTS = {
        "mixed_family": "Family with members from different regions living together",
        "wedding_planning": "Planning wedding with mixed cultural traditions",
        "relocation": "Someone relocating between regions, adapting to new culture",
        "business_partnership": "Business partners from different regions collaborating",
        "cultural_exchange": "People learning about each other's regional cultures",
        "family_visit": "Visiting in-laws or relatives from different region",
        "traditional_ceremony": "Planning/attending traditional ceremony from mixed backgrounds",
        "daily_life": "Daily interactions in mixed-culture household/community"
    }

    TOPICS = {
        "wedding_planning": "Planning wedding ceremony with mixed traditions",
        "food_preparation": "Cooking/preparing regional dishes together",
        "ceremony_preparation": "Preparing for traditional ceremony",
        "language_learning": "Teaching/learning regional dialect",
        "cultural_etiquette": "Learning proper behavior for different culture",
        "family_gathering": "Organizing/attending family events",
        "business_negotiation": "Business discussions across regions",
        "relocation_advice": "Advice on moving/adapting to new region",
        "mixed_celebration": "Celebrating holidays from different traditions",
        "cultural_conflict_resolution": "Resolving cultural misunderstandings"
    }

    RELATIONSHIP_DYNAMICS = {
        "jakarta_javanese": """
- Javanese speaker uses more respectful forms
- Jakarta speaker more casual but respectful
- Show "nrimo" (acceptance) in disagreements
- Family hierarchy important
""",
        "jakarta_sundanese": """
- Sundanese speaker shows "someah hade" (warm hospitality)
- Jakarta speaker appreciates Sundanese politeness
- Light, friendly banter common
- Mutual respect and warmth
""",
        "jakarta_balinese": """
- Balinese speaker references ceremonies/traditions
- Jakarta speaker learns about Balinese culture
- Show respect for spiritual/cultural practices
- Community-oriented mindset
""",
        "multi_dialect": """
- Multiple voices with different dialect backgrounds
- Natural mixing and mutual understanding
- Cultural references from various regions
- Cooperative and inclusive
""",
        "intercultural": """
- Partners teaching each other
- Cultural negotiation and compromise
- Mix of excitement and nervousness
- Building shared cultural understanding
"""
    }

    def __init__(self, anthropic_api_key: str, model: str = "claude-sonnet-4-5-20250929"):
        """Initialize generator"""
        self.api_key = anthropic_api_key
        self.model = model
        self.api_url = "https://api.anthropic.com/v1/messages"

    async def generate_conversation(
        self,
        style: Literal["jakarta_javanese", "jakarta_sundanese", "jakarta_balinese",
                      "multi_dialect", "intercultural"],
        context: str,
        topic: str,
        min_messages: int = 8,
        max_messages: int = 40
    ) -> Optional[Dict]:
        """Generate single mixed dialect conversation"""

        conversation_id = f"{style}_{context}_{topic}_{datetime.now().strftime('%Y%m%d_%H%M%S%f')}"

        logger.info(f"🔄 Generating: {conversation_id}")

        # Determine dialects
        dialect_map = {
            "jakarta_javanese": ("jakarta", "javanese", 30),
            "jakarta_sundanese": ("jakarta", "sundanese", 30),
            "jakarta_balinese": ("jakarta", "balinese", 30),
            "multi_dialect": ("jakarta", "mixed", 40),
            "intercultural": ("jakarta", "regional", 35)
        }

        primary, secondary, code_switch_density = dialect_map[style]

        # Build prompt
        prompt = self.PROMPT_TEMPLATE.format(
            primary_dialect=primary,
            secondary_dialect=secondary,
            dialect_features=self.DIALECT_FEATURES[style],
            code_switch_density=code_switch_density,
            cultural_markers=self.CULTURAL_MARKERS[style],
            context=context,
            context_details=self.CONTEXTS.get(context, "General mixed dialect conversation"),
            topic=topic,
            topic_details=self.TOPICS.get(topic, "Mixed cultural discussion"),
            min_messages=min_messages,
            max_messages=max_messages,
            style=style,
            relationship_dynamics=self.RELATIONSHIP_DYNAMICS[style]
        )

        try:
            result = await self._call_claude_api(prompt)

            if not result:
                logger.error(f"❌ Generation failed: {conversation_id}")
                return None

            conversation_data = self._parse_response(result, conversation_id)

            if conversation_data:
                logger.info(f"✅ Generated: {conversation_id} ({len(conversation_data.get('messages', []))} msgs)")

            return conversation_data

        except Exception as e:
            logger.error(f"❌ Failed to generate: {e}")
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
                        "temperature": 0.9,  # High creativity for natural mixing
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
        """Parse Claude's JSON response"""
        try:
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)

            if "messages" not in data:
                logger.error("❌ Missing 'messages' field")
                return None

            data["conversation_id"] = conversation_id

            return data

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Parse error: {e}")
            return None


async def generate_mixed_premium_dataset(output_file: str = "claude9_mixed_premium.json"):
    """Generate complete 3,000 conversation dataset"""

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("❌ ANTHROPIC_API_KEY not set")
        return

    generator = MixedDialectGenerator(anthropic_api_key=api_key)

    # Configuration for 3,000 conversations
    configs = [
        # 600 Jakarta-Javanese
        ("jakarta_javanese", 600, [
            ("mixed_family", "family_gathering", 100),
            ("wedding_planning", "wedding_planning", 100),
            ("relocation", "relocation_advice", 100),
            ("cultural_exchange", "language_learning", 100),
            ("traditional_ceremony", "ceremony_preparation", 100),
            ("daily_life", "food_preparation", 100),
        ]),
        # 600 Jakarta-Sundanese
        ("jakarta_sundanese", 600, [
            ("mixed_family", "family_gathering", 100),
            ("wedding_planning", "wedding_planning", 100),
            ("relocation", "relocation_advice", 100),
            ("cultural_exchange", "cultural_etiquette", 100),
            ("business_partnership", "business_negotiation", 100),
            ("daily_life", "food_preparation", 100),
        ]),
        # 600 Jakarta-Balinese
        ("jakarta_balinese", 600, [
            ("mixed_family", "family_gathering", 100),
            ("wedding_planning", "wedding_planning", 100),
            ("traditional_ceremony", "ceremony_preparation", 100),
            ("cultural_exchange", "language_learning", 100),
            ("family_visit", "cultural_etiquette", 100),
            ("daily_life", "mixed_celebration", 100),
        ]),
        # 600 Multi-dialect family
        ("multi_dialect", 600, [
            ("mixed_family", "family_gathering", 150),
            ("wedding_planning", "mixed_celebration", 150),
            ("relocation", "cultural_exchange", 150),
            ("daily_life", "food_preparation", 150),
        ]),
        # 600 Inter-cultural relationship
        ("intercultural", 600, [
            ("wedding_planning", "wedding_planning", 120),
            ("family_visit", "cultural_etiquette", 120),
            ("relocation", "relocation_advice", 120),
            ("cultural_exchange", "language_learning", 120),
            ("daily_life", "cultural_conflict_resolution", 120),
        ]),
    ]

    all_conversations = []
    total_generated = 0

    logger.info("🚀 Starting Mixed Premium Dataset Generation (3,000 conversations)")
    logger.info("=" * 80)

    for style, target_count, context_topic_pairs in configs:
        logger.info(f"\n📋 Generating {target_count} {style} conversations...")

        style_conversations = []

        for context, topic, count in context_topic_pairs:
            logger.info(f"  → {context}/{topic}: {count} conversations")

            # Generate conversations with variety in message length
            for i in range(count):
                # Vary message length naturally
                if i % 3 == 0:
                    min_msg, max_msg = 8, 15  # Short
                elif i % 3 == 1:
                    min_msg, max_msg = 16, 30  # Medium
                else:
                    min_msg, max_msg = 31, 40  # Long

                conv = await generator.generate_conversation(
                    style=style,
                    context=context,
                    topic=topic,
                    min_messages=min_msg,
                    max_messages=max_msg
                )

                if conv:
                    style_conversations.append(conv)
                    total_generated += 1

                    if (i + 1) % 10 == 0:
                        logger.info(f"    ✓ {i + 1}/{count} generated")

                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)

        all_conversations.extend(style_conversations)
        logger.info(f"✅ Completed {style}: {len(style_conversations)} conversations")

    # Build final dataset
    dataset = {
        "dataset_id": "mixed_premium_claude9",
        "total_conversations": len(all_conversations),
        "generated_at": datetime.now().isoformat(),
        "distribution": {
            "jakarta_javanese": sum(1 for c in all_conversations if c.get("style") == "jakarta_javanese"),
            "jakarta_sundanese": sum(1 for c in all_conversations if c.get("style") == "jakarta_sundanese"),
            "jakarta_balinese": sum(1 for c in all_conversations if c.get("style") == "jakarta_balinese"),
            "multi_dialect": sum(1 for c in all_conversations if c.get("style") == "multi_dialect"),
            "intercultural": sum(1 for c in all_conversations if c.get("style") == "intercultural"),
        },
        "conversations": all_conversations
    }

    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    logger.info("\n" + "=" * 80)
    logger.info(f"🎉 DATASET GENERATION COMPLETE!")
    logger.info(f"📊 Total conversations: {total_generated}")
    logger.info(f"💾 Saved to: {output_file}")
    logger.info(f"📈 Distribution:")
    for style, count in dataset["distribution"].items():
        logger.info(f"   - {style}: {count}")
    logger.info("=" * 80)


if __name__ == "__main__":
    asyncio.run(generate_mixed_premium_dataset())
