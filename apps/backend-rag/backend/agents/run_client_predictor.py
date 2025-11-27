#!/usr/bin/env python3
"""
Client Value Predictor - Standalone Runner
Usage: python run_client_predictor.py
"""

import asyncio
import logging
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.client_value_predictor import ClientValuePredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    logger.info("💰 Starting Client Value Predictor & Nurturing Agent")

    try:
        predictor = ClientValuePredictor()

        # Run daily nurturing cycle
        logger.info("🔄 Running daily client nurturing cycle...")
        results = await predictor.run_daily_nurturing()

        logger.info("📊 Nurturing Results:")
        logger.info(f"   VIP Clients Nurtured: {results['vip_nurtured']}")
        logger.info(f"   High-Risk Contacted: {results['high_risk_contacted']}")
        logger.info(f"   Total Messages Sent: {results['total_messages_sent']}")
        logger.info(f"   Errors: {len(results['errors'])}")

        if results["errors"]:
            for error in results["errors"][:5]:  # Show first 5 errors
                logger.error(f"   - {error}")

        logger.info("🎉 Client Value Predictor completed successfully!")
        return 0

    except Exception as e:
        logger.error(f"❌ Error in Client Value Predictor: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
