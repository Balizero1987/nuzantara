#!/usr/bin/env python3
"""
Conversation Trainer - Standalone Runner
Usage: python run_conversation_trainer.py [--days DAYS]
"""

import argparse
import asyncio
import logging
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.agents.conversation_trainer import ConversationTrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    parser = argparse.ArgumentParser(description="Run Conversation Quality Trainer")
    parser.add_argument("--days", type=int, default=7, help="Days to look back for conversations")
    args = parser.parse_args()

    logger.info(f"🤖 Starting Conversation Trainer (looking back {args.days} days)")

    try:
        trainer = ConversationTrainer()

        # 1. Analyze winning patterns
        logger.info("📊 Analyzing winning patterns...")
        analysis = await trainer.analyze_winning_patterns(days_back=args.days)

        if not analysis:
            logger.info("No high-rated conversations found in the specified period")
            return 0

        logger.info(f"✅ Analysis complete: {len(analysis)} insights found")

        # 2. Generate improved prompt
        logger.info("✍️  Generating improved prompt...")
        improved_prompt = await trainer.generate_prompt_update(analysis)
        logger.info(f"✅ Improved prompt generated ({len(improved_prompt)} chars)")

        # 3. Create PR
        logger.info("🔀 Creating improvement PR...")
        pr_branch = await trainer.create_improvement_pr(improved_prompt, analysis)
        logger.info(f"✅ PR created on branch: {pr_branch}")

        logger.info("🎉 Conversation Trainer completed successfully!")
        return 0

    except Exception as e:
        logger.error(f"❌ Error in Conversation Trainer: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
