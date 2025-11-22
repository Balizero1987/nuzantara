#!/usr/bin/env python3
"""
Generate Mixed Premium Dataset - CLAUDE 9

Generates 3,000 ultra-realistic mixed Indonesian dialect conversations:
- 600 Jakarta-Javanese
- 600 Jakarta-Sundanese
- 600 Jakarta-Balinese
- 600 Multi-dialect family
- 600 Inter-cultural relationship

Run:
    export ANTHROPIC_API_KEY='your-api-key-here'
    python generate_mixed_premium.py

Output:
    claude9_mixed_premium.json (3,000 conversations)
"""

import asyncio
import logging
import os
import sys
from pathlib import Path

# Add modules directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'modules'))

from mixed_dialect_generator import generate_mixed_premium_dataset

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main execution"""

    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")

    if not api_key:
        logger.error("=" * 80)
        logger.error("❌ ANTHROPIC_API_KEY not set!")
        logger.error("=" * 80)
        logger.error("Please set your Anthropic API key:")
        logger.error("  export ANTHROPIC_API_KEY='your-api-key-here'")
        logger.error("\nOr create a .env file with:")
        logger.error("  ANTHROPIC_API_KEY=your-api-key-here")
        logger.error("=" * 80)
        return 1

    logger.info("=" * 80)
    logger.info("🚀 MIXED PREMIUM DATASET GENERATION - CLAUDE 9")
    logger.info("=" * 80)
    logger.info("Target: 3,000 conversations")
    logger.info("Distribution:")
    logger.info("  - 600 Jakarta-Javanese mix")
    logger.info("  - 600 Jakarta-Sundanese mix")
    logger.info("  - 600 Jakarta-Balinese mix")
    logger.info("  - 600 Multi-dialect family")
    logger.info("  - 600 Inter-cultural relationship")
    logger.info("=" * 80)
    logger.info("⏱️  Estimated time: 4-6 hours")
    logger.info("💰 Estimated cost: ~$30-50 USD (API calls)")
    logger.info("=" * 80)

    # Confirm before starting
    response = input("\n⚠️  Ready to start generation? This will take several hours. (y/n): ")
    if response.lower() != 'y':
        logger.info("❌ Generation cancelled")
        return 0

    # Run generation
    await generate_mixed_premium_dataset(output_file="claude9_mixed_premium.json")

    logger.info("\n✅ Generation complete! File saved: claude9_mixed_premium.json")
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
