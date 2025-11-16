#!/usr/bin/env python3
"""
Generate Test Conversations

Generates 10 diverse Indonesian conversations for quality testing
before full 20K dataset generation.

Coverage Matrix:
- Styles: whatsapp (4), live_conversation (3), consultant_professional (3)
- Topics: visa_immigration (3), business_legal (3), property_investment (2), cultural_daily (2)
- Lengths: short (3), medium (4), long (3)
- Personas: All 4 personas represented

Run:
    python generate_test_conversations.py

Outputs:
    - test_conversations/conversation_001.json
    - test_conversations/conversation_002.json
    - ... (10 total)
    - test_conversations_summary.json
"""

import asyncio
import logging
import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'modules'))

from indonesian_conversation_generator import IndonesianConversationGenerator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 10 Diverse Test Parameter Sets
TEST_CONVERSATIONS = [
    {
        "id": "001",
        "style": "whatsapp",
        "topic": "visa_immigration",
        "length": "short",
        "user_persona": "jakarta_millennial",
        "description": "WhatsApp casual - visa quick question"
    },
    {
        "id": "002",
        "style": "whatsapp",
        "topic": "business_legal",
        "length": "medium",
        "user_persona": "jakarta_millennial",
        "description": "WhatsApp casual - PT PMA setup discussion"
    },
    {
        "id": "003",
        "style": "whatsapp",
        "topic": "property_investment",
        "length": "long",
        "user_persona": "mixed_couple",
        "description": "WhatsApp casual - property buying journey"
    },
    {
        "id": "004",
        "style": "whatsapp",
        "topic": "cultural_daily",
        "length": "medium",
        "user_persona": "expat_professional",
        "description": "WhatsApp casual - cultural adaptation questions"
    },
    {
        "id": "005",
        "style": "live_conversation",
        "topic": "visa_immigration",
        "length": "medium",
        "user_persona": "business_owner",
        "description": "Live conversation - investor visa inquiry"
    },
    {
        "id": "006",
        "style": "live_conversation",
        "topic": "business_legal",
        "length": "long",
        "user_persona": "expat_professional",
        "description": "Live conversation - comprehensive business setup"
    },
    {
        "id": "007",
        "style": "live_conversation",
        "topic": "cultural_daily",
        "length": "short",
        "user_persona": "jakarta_millennial",
        "description": "Live conversation - quick cultural question"
    },
    {
        "id": "008",
        "style": "consultant_professional",
        "topic": "visa_immigration",
        "length": "long",
        "user_persona": "business_owner",
        "description": "Consultant professional - detailed visa consultation"
    },
    {
        "id": "009",
        "style": "consultant_professional",
        "topic": "business_legal",
        "length": "medium",
        "user_persona": "business_owner",
        "description": "Consultant professional - tax compliance discussion"
    },
    {
        "id": "010",
        "style": "consultant_professional",
        "topic": "property_investment",
        "length": "short",
        "user_persona": "mixed_couple",
        "description": "Consultant professional - property ownership rules"
    }
]


async def generate_test_dataset():
    """Generate all 10 test conversations"""

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("❌ ANTHROPIC_API_KEY not set")
        logger.error("Set it with: export ANTHROPIC_API_KEY='your-key-here'")
        return

    # Create output directory
    output_dir = Path("test_conversations")
    output_dir.mkdir(exist_ok=True)

    # Initialize generator
    generator = IndonesianConversationGenerator(anthropic_api_key=api_key)

    logger.info("🚀 INDONESIAN CONVERSATION TEST GENERATION")
    logger.info("=" * 80)
    logger.info(f"Total conversations to generate: {len(TEST_CONVERSATIONS)}")
    logger.info(f"Output directory: {output_dir.absolute()}")
    logger.info("=" * 80)

    results = []
    successful = 0
    failed = 0

    for i, params in enumerate(TEST_CONVERSATIONS, 1):
        logger.info(f"\n[{i}/{len(TEST_CONVERSATIONS)}] Generating conversation {params['id']}")
        logger.info(f"   Style: {params['style']}")
        logger.info(f"   Topic: {params['topic']}")
        logger.info(f"   Length: {params['length']}")
        logger.info(f"   Persona: {params['user_persona']}")
        logger.info(f"   Description: {params['description']}")

        try:
            # Generate conversation
            conversation = await generator.generate_conversation(
                style=params["style"],
                topic=params["topic"],
                length=params["length"],
                user_persona=params["user_persona"]
            )

            if conversation:
                # Save to file
                output_file = output_dir / f"conversation_{params['id']}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(conversation, f, indent=2, ensure_ascii=False)

                logger.info(f"   ✅ SUCCESS - Saved to {output_file}")
                logger.info(f"   Messages: {len(conversation.get('messages', []))}")
                logger.info(f"   Quality: {conversation.get('quality_scores', {}).get('overall_quality', 0)}/100")

                results.append({
                    "id": params["id"],
                    "status": "success",
                    "file": str(output_file),
                    "messages": len(conversation.get('messages', [])),
                    "quality": conversation.get('quality_scores', {}).get('overall_quality', 0),
                    **params
                })
                successful += 1
            else:
                logger.error(f"   ❌ FAILED - No conversation generated")
                results.append({
                    "id": params["id"],
                    "status": "failed",
                    "error": "No conversation generated",
                    **params
                })
                failed += 1

        except Exception as e:
            logger.error(f"   ❌ FAILED - {e}")
            results.append({
                "id": params["id"],
                "status": "failed",
                "error": str(e),
                **params
            })
            failed += 1

        # Rate limiting (avoid API throttling)
        if i < len(TEST_CONVERSATIONS):
            logger.info("   ⏳ Waiting 5 seconds before next generation...")
            await asyncio.sleep(5)

    # Generate summary
    summary = {
        "generated_at": datetime.now().isoformat(),
        "total_conversations": len(TEST_CONVERSATIONS),
        "successful": successful,
        "failed": failed,
        "success_rate": f"{(successful / len(TEST_CONVERSATIONS) * 100):.1f}%",
        "results": results
    }

    summary_file = output_dir / "test_conversations_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    # Print final summary
    logger.info("\n" + "=" * 80)
    logger.info("GENERATION COMPLETE")
    logger.info("=" * 80)
    logger.info(f"Total: {len(TEST_CONVERSATIONS)}")
    logger.info(f"✅ Successful: {successful}")
    logger.info(f"❌ Failed: {failed}")
    logger.info(f"Success Rate: {(successful / len(TEST_CONVERSATIONS) * 100):.1f}%")
    logger.info(f"\nSummary saved to: {summary_file.absolute()}")
    logger.info("=" * 80)

    # Next steps
    logger.info("\n📊 NEXT STEPS:")
    logger.info("1. Run quality analysis:")
    logger.info("   python analyze_test_quality.py")
    logger.info("\n2. Review quality reports in test_conversations/")
    logger.info("\n3. If quality is good (>70/100 average), proceed to full generation")
    logger.info("   python generate_full_dataset.py --size 20000")


if __name__ == "__main__":
    asyncio.run(generate_test_dataset())
