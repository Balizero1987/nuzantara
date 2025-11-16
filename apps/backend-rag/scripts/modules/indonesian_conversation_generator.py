"""
Indonesian Conversational Dataset Generator

Generates natural, authentic Indonesian conversations for fine-tuning Gemma2 9B.
Focuses on Jakarta millennial speech patterns with particles, slang, and emotional variety.

Features:
- 3 conversation styles: whatsapp, live_conversation, consultant_professional
- 4 topic domains: visa_immigration, business_legal, property_investment, cultural_daily
- 3 length variations: short (5-8 msgs), medium (10-15 msgs), long (18-25 msgs)
- Quality analysis: particles, slang density, code-switching, emotional progression
"""

import logging
from typing import Dict, List, Optional, Literal
from datetime import datetime
import json
import httpx
import re

logger = logging.getLogger(__name__)


class IndonesianConversationGenerator:
    """
    Generates Indonesian conversational datasets using Claude API
    """

    # Production prompt template (3,500+ words)
    PROMPT_TEMPLATE = """You are an expert at generating authentic Indonesian conversational data for Jakarta millennials (ages 25-40).

# YOUR MISSION
Generate a completely natural Indonesian conversation between a user and Zantara (BALI ZERO's AI assistant) that sounds EXACTLY like real WhatsApp/chat messages between Jakarta millennials in 2024.

# CRITICAL REQUIREMENTS

## 1. JAKARTA MILLENNIAL AUTHENTICITY
You MUST incorporate these linguistic features:

### Particles (Target: 40-60% of messages should have at least one)
- **dong** (emphasis/obviousness): "Iya dong!", "Susah dong kalo gitu"
- **sih** (softener/question): "Gimana sih?", "Emang gitu sih ya"
- **deh** (agreement/resignation): "Udah deh", "Oke deh gue coba"
- **kok** (surprise/confusion): "Kok lama banget?", "Kenapa kok gitu?"
- **kan** (seeking agreement): "Udah jelas kan?", "Enak kan?"
- **lho** (surprise): "Masa sih lho?", "Beneran lho?"
- **tuh** (pointing out): "Nah tuh kan", "Liat tuh"

### Jakarta Slang (Target: 10-15% word density)
- **gue/gw** (I/me), **lu/lo** (you)
- **banget** (very), **parah** (extreme)
- **gebetan** (crush), **baper** (emotional)
- **bokap/nyokap** (dad/mom)
- **asoy** (cool), **kepo** (curious)
- **santuy** (chill), **receh** (cheap/silly)
- **kuy** (let's go), **mager** (lazy)

### Code-Switching (Natural, 5-10% in business contexts)
- Mix English ONLY in business/tech contexts: "Deadline kapan?", "Bisa di-follow up ga?"
- NOT in casual contexts: "Gimana weekend lu?" (correct) vs "How was your weekend?" (wrong)

### Contractions & Informal Spelling
- **gapapa** (tidak apa-apa), **gamau** (tidak mau)
- **udah** (sudah), **belom** (belum)
- **gimana** (bagaimana), **kenapa** (mengapa)
- **emang** (memang), **kalo** (kalau)
- **abis** (habis), **trus** (terus)

### Emotional Progression (Essential for long conversations)
Vary emotions naturally across messages:
1. Curious/inquiring: "Btw gue mau tanya nih..."
2. Concerned/worried: "Wah serius? Gue agak khawatir deh..."
3. Relieved: "Oke sih kalo gitu, lumayan lega"
4. Excited: "Asik banget! Gue udah ga sabar deh"
5. Grateful: "Makasih banyak ya, helpful banget!"

### Memory References (Medium/Long conversations)
Reference earlier messages naturally:
- "Tadi lu bilang soal visa kan..."
- "Nah balik lagi ke yang gue tanya sebelumnya..."
- "Oh iya bener, hampir lupa gue"

## 2. CONVERSATION STYLE SPECIFICATIONS

### Style: {style}

{style_instructions}

## 3. TOPIC FOCUS: {topic}

{topic_context}

## 4. LENGTH TARGET: {length}

{length_instructions}

## 5. USER PERSONA: {user_persona}

{persona_context}

## 6. QUALITY SELF-ASSESSMENT

After generating the conversation, YOU MUST provide quality scores (1-10):

```json
{{
  "naturalness_score": 8,
  "particle_usage": 7,
  "slang_density": 8,
  "code_switching": 6,
  "emotional_variety": 7,
  "memory_references": 5,
  "overall_quality": 75
}}
```

Be HONEST in your self-assessment. If you didn't use enough particles, score yourself low.

# OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no explanations):

```json
{{
  "conversation_id": "unique_id",
  "metadata": {{
    "style": "{style}",
    "topic": "{topic}",
    "length": "{length}",
    "user_persona": "{user_persona}",
    "generated_at": "2024-11-16T12:00:00Z"
  }},
  "messages": [
    {{
      "role": "user",
      "content": "Halo! Gue mau tanya dong soal visa...",
      "timestamp": "2024-11-16T12:00:00Z"
    }},
    {{
      "role": "assistant",
      "content": "Halo! Boleh banget, mau tanya visa apa nih? 😊",
      "timestamp": "2024-11-16T12:00:15Z"
    }}
  ],
  "quality_scores": {{
    "naturalness_score": 8,
    "particle_usage": 7,
    "slang_density": 8,
    "code_switching": 6,
    "emotional_variety": 7,
    "memory_references": 5,
    "overall_quality": 75
  }},
  "linguistic_analysis": {{
    "particles_found": ["dong", "sih", "deh", "kok"],
    "slang_found": ["gue", "lu", "banget", "parah"],
    "code_switches": ["visa", "follow up"],
    "emotions_detected": ["curious", "helpful", "relieved"]
  }}
}}
```

# EXAMPLES OF AUTHENTICITY

## ❌ WRONG (Too formal/stiff):
User: "Permisi, saya ingin bertanya mengenai visa."
Assistant: "Tentu, silakan bertanya. Saya siap membantu."

## ✅ CORRECT (Natural Jakarta millennial):
User: "Halo! Gue mau tanya dong soal visa investor..."
Assistant: "Halo! Boleh banget, mau tanya visa investor ya? Gimana nih, udah ada rencana invest apa?"

## ❌ WRONG (No particles/slang):
User: "Berapa lama prosesnya?"
Assistant: "Prosesnya memakan waktu 3-6 bulan."

## ✅ CORRECT (Rich particles/slang):
User: "Wah lama banget ya? Emang segitu lho?"
Assistant: "Iya nih, visa investor emang agak lama sih prosesnya. Tapi tenang aja, nanti gue bantuin step by step kok! 😊"

# ANTI-PATTERNS TO AVOID

1. ❌ Overly formal Bahasa Indonesia
2. ❌ Robotic/templated responses
3. ❌ Missing particles in consecutive messages (use 1+ per message)
4. ❌ Excessive emojis (max 1-2 per message, if at all)
5. ❌ English in casual contexts (save for business topics only)
6. ❌ No emotional variety (sounds robotic)
7. ❌ Perfect grammar/spelling (millennials use shortcuts!)

# NOW GENERATE THE CONVERSATION

Remember:
- Sound like a real 28-year-old from Jakarta texting a friend
- Use particles liberally (don't be shy!)
- Mix slang naturally
- Show emotions through word choice
- Self-assess honestly

Generate now:"""

    STYLE_INSTRUCTIONS = {
        "whatsapp": """
**WhatsApp Casual Style**

Characteristics:
- Very informal, like texting a friend
- Liberal use of particles (dong, sih, deh, kok) - aim for 50%+ of messages
- High slang density (15-20% of words)
- Typos/corrections are REALISTIC: "Gue mikir... maksud gue, gue rasa..."
- Short bursts: 1-2 sentences per message
- Emojis sparingly (1 every 3-4 messages)
- Multi-message thoughts (like WhatsApp typing)

Example flow:
User: "Halo!"
User: "Gue mau tanya dong"
User: "Soal visa investor nih"
Assistant: "Halo! Boleh banget kok 😊"
Assistant: "Mau invest di bidang apa nih?"
""",
        "live_conversation": """
**Live Conversation Style**

Characteristics:
- More flowing than WhatsApp but still casual
- Moderate particle usage (30-40% of messages)
- Moderate slang (8-12% of words)
- Longer messages (2-4 sentences)
- Professional warmth (not stiff, not overly casual)
- Clear turn-taking (not multi-message bursts)

Example:
User: "Halo, gue lagi cari info soal visa investor nih. Kira-kira prosesnya gimana sih?"
Assistant: "Halo! Oke, jadi visa investor itu prosesnya ada beberapa tahap. First, lu harus udah punya rencana bisnis yang jelas dulu. Udah ada rencana invest apa belum nih?"
""",
        "consultant_professional": """
**Consultant Professional Style**

Characteristics:
- Professional but friendly (not robotic)
- Strategic particle usage (20-30% of messages) - for warmth
- Low slang (3-5% of words) - mostly neutral Jakarta Indonesian
- Code-switching natural in business context (10-15%)
- Structured, informative responses
- Still uses "gue/lu" (Jakarta professional norm)

Example:
User: "Saya tertarik dengan visa investor. Apa saja requirements yang dibutuhkan?"
Assistant: "Baik, untuk visa investor ada beberapa requirement utama nih. Pertama, minimum investment IDR 10 miliar untuk kategori tertentu. Kedua, business plan yang detailed dan feasible. Sudah punya draft business plan kah?"
"""
    }

    TOPIC_CONTEXTS = {
        "visa_immigration": """
**Visa & Immigration Context**

Common scenarios:
- Visa types: investor, retirement (KITAS), social/cultural, business, digital nomad
- Process questions: timeline, documents, costs
- Status checks: "Kapan ya kira-kira selesai?"
- Concerns: rejections, delays, bureaucracy frustration

Key vocabulary:
- KITAS (temporary stay permit)
- KITAP (permanent stay permit)
- Sponsorship, guarantor
- Immigration office (Kantor Imigrasi)
- Extension (perpanjang)

Emotional range: Anxiety → Hope → Relief
""",
        "business_legal": """
**Business & Legal Context**

Common scenarios:
- PT PMA setup (foreign investment company)
- Business licensing (NIB, OSS system)
- Tax questions (NPWP, PKP, PPh)
- Legal compliance: contracts, employment law
- Partnership structures

Key vocabulary:
- PT PMA (foreign investment company)
- NIB (business identification number)
- OSS (online single submission)
- NPWP (tax number)
- Notaris (notary)

Emotional range: Confusion → Understanding → Confidence
""",
        "property_investment": """
**Property & Investment Context**

Common scenarios:
- Buying property as foreigner (freehold/leasehold)
- Hak Pakai vs Hak Milik (usage rights vs ownership)
- Investment returns, rental yield
- Legal restrictions, areas foreigners can buy
- Property management

Key vocabulary:
- Hak Pakai (right to use)
- Hak Milik (freehold ownership)
- IMB (building permit)
- Strata title, leasehold
- ROI, yield

Emotional range: Excitement → Caution → Strategic thinking
""",
        "cultural_daily": """
**Cultural & Daily Life Context**

Common scenarios:
- Cultural adaptation (Indonesian etiquette, holidays)
- Daily life: banking, phone SIM, driving license
- Healthcare (BPJS, international insurance)
- Social integration, language learning
- Living costs, lifestyle questions

Key vocabulary:
- BPJS (national healthcare)
- SIM (driver's license)
- KTP (ID card for foreigners after KITAS)
- Ramadan, Nyepi, Galungan
- Warung, ojek, gojek

Emotional range: Curiosity → Cultural appreciation → Integration
"""
    }

    LENGTH_INSTRUCTIONS = {
        "short": """
**Short Conversation (5-8 messages total)**

Structure:
1. Opening question (1 message)
2. Initial response (1 message)
3. Follow-up question (1-2 messages)
4. Detailed answer (1-2 messages)
5. Closing/thank you (1-2 messages)

Focus: Quick, focused exchange. One main topic.
""",
        "medium": """
**Medium Conversation (10-15 messages total)**

Structure:
1. Opening (1-2 messages)
2. Main topic exploration (4-6 messages)
3. Sub-topic or clarification (3-4 messages)
4. Closing/next steps (2-3 messages)

Focus: Natural back-and-forth. Introduce 1-2 sub-topics. Show emotional progression.
""",
        "long": """
**Long Conversation (18-25 messages total)**

Structure:
1. Opening & rapport building (2-3 messages)
2. Main topic deep dive (6-8 messages)
3. Related questions/concerns (4-6 messages)
4. Tangent or personal context (2-3 messages)
5. Summary/next steps (3-5 messages)

Focus: Natural evolution. Multiple sub-topics. Memory references. Rich emotional arc.
CRITICAL: Must include callbacks to earlier messages ("Tadi lu bilang...").
"""
    }

    USER_PERSONAS = {
        "jakarta_millennial": """
Young professional (28-35), works in tech/startup, fluent English but prefers Indonesian casually, very familiar with slang, uses particles naturally.
""",
        "expat_professional": """
Foreign expat (30-40), working in Jakarta 2-3 years, understands Indonesian but still learning slang, mixes English frequently, polite but casual.
""",
        "mixed_couple": """
Indonesian married to foreigner, helping partner navigate bureaucracy, code-switches naturally, very familiar with both cultures, patient explainer.
""",
        "business_owner": """
Entrepreneur (35-45), wants to invest/expand in Indonesia, professional tone but warm, asks detailed questions, strategic mindset.
"""
    }

    def __init__(
        self,
        anthropic_api_key: str,
        model: str = "claude-sonnet-4-5-20250929"
    ):
        """
        Initialize generator

        Args:
            anthropic_api_key: Anthropic API key
            model: Claude model to use
        """
        self.api_key = anthropic_api_key
        self.model = model
        self.api_url = "https://api.anthropic.com/v1/messages"

    async def generate_conversation(
        self,
        style: Literal["whatsapp", "live_conversation", "consultant_professional"],
        topic: Literal["visa_immigration", "business_legal", "property_investment", "cultural_daily"],
        length: Literal["short", "medium", "long"],
        user_persona: Literal["jakarta_millennial", "expat_professional", "mixed_couple", "business_owner"]
    ) -> Optional[Dict]:
        """
        Generate single conversation with specified parameters

        Args:
            style: Conversation style
            topic: Topic domain
            length: Target length
            user_persona: User persona

        Returns:
            Dict with conversation data and quality scores
        """
        conversation_id = f"{style}_{topic}_{length}_{user_persona}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        logger.info(f"🔄 Generating conversation: {conversation_id}")

        # Build prompt from template
        prompt = self.PROMPT_TEMPLATE.format(
            style=style,
            style_instructions=self.STYLE_INSTRUCTIONS[style],
            topic=topic,
            topic_context=self.TOPIC_CONTEXTS[topic],
            length=length,
            length_instructions=self.LENGTH_INSTRUCTIONS[length],
            user_persona=user_persona,
            persona_context=self.USER_PERSONAS[user_persona]
        )

        try:
            result = await self._call_claude_api(prompt)

            if not result:
                logger.error(f"❌ Generation failed for: {conversation_id}")
                return None

            # Parse JSON response
            conversation_data = self._parse_conversation_response(result, conversation_id)

            if conversation_data:
                logger.info(f"✅ Generated conversation: {conversation_id}")
                logger.info(f"   Messages: {len(conversation_data.get('messages', []))}")
                logger.info(f"   Quality: {conversation_data.get('quality_scores', {}).get('overall_quality', 0)}/100")

            return conversation_data

        except Exception as e:
            logger.error(f"❌ Failed to generate conversation: {e}")
            return None

    async def _call_claude_api(self, prompt: str) -> Optional[str]:
        """
        Call Claude API with conversation generation prompt

        Args:
            prompt: Complete prompt

        Returns:
            Generated conversation JSON string
        """
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
                        "temperature": 0.8,  # Higher for creative natural conversations
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    }
                )
                response.raise_for_status()
                data = response.json()

                # Extract content from Claude response
                content = data.get("content", [])
                if content and len(content) > 0:
                    text = content[0].get("text", "")
                    return text

                logger.error(f"❌ Claude returned empty response")
                return None

        except httpx.TimeoutException:
            logger.error("❌ Claude API timeout (>180s)")
            return None
        except Exception as e:
            logger.error(f"❌ Claude API call failed: {e}")
            return None

    def _parse_conversation_response(self, response: str, conversation_id: str) -> Optional[Dict]:
        """
        Parse Claude's JSON response

        Args:
            response: Raw response string
            conversation_id: Conversation identifier

        Returns:
            Parsed conversation dict
        """
        try:
            # Remove markdown code blocks if present
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            # Parse JSON
            data = json.loads(cleaned)

            # Validate structure
            if "messages" not in data:
                logger.error("❌ Missing 'messages' field in response")
                return None

            if "quality_scores" not in data:
                logger.warning("⚠️ Missing 'quality_scores' field")
                data["quality_scores"] = {}

            # Add conversation_id if missing
            data["conversation_id"] = conversation_id

            return data

        except json.JSONDecodeError as e:
            logger.error(f"❌ Failed to parse JSON response: {e}")
            logger.error(f"Response preview: {response[:500]}...")
            return None
        except Exception as e:
            logger.error(f"❌ Failed to parse conversation: {e}")
            return None


# Convenience function for testing
async def test_generator():
    """Test Indonesian conversation generator"""
    import os

    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set")
        return

    generator = IndonesianConversationGenerator(
        anthropic_api_key=api_key
    )

    print("\n🚀 TESTING INDONESIAN CONVERSATION GENERATION")
    print("=" * 80)

    # Test single conversation
    result = await generator.generate_conversation(
        style="whatsapp",
        topic="visa_immigration",
        length="short",
        user_persona="jakarta_millennial"
    )

    if result:
        print(f"\n✅ SUCCESS!")
        print(f"Conversation ID: {result.get('conversation_id')}")
        print(f"Messages: {len(result.get('messages', []))}")
        print(f"\nQuality Scores:")
        for key, value in result.get('quality_scores', {}).items():
            print(f"  {key}: {value}")

        print(f"\nFirst 3 messages:")
        for i, msg in enumerate(result.get('messages', [])[:3], 1):
            print(f"\n[{i}] {msg['role'].upper()}: {msg['content']}")
    else:
        print("\n❌ Generation failed")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_generator())
