#!/usr/bin/env python3
"""
Autonomous Agents Cron Scheduler

Schedules and executes autonomous agents on a recurring basis:
- Knowledge Graph Builder: Daily at 4 AM
- Conversation Trainer: Weekly Sunday at 4 AM
- Client Value Predictor: Daily at 10 AM (when Twilio is configured)

This script should be run as a background service or cron job.

Usage:
    # Run scheduler (blocks indefinitely)
    python scripts/autonomous_agents_scheduler.py

    # Run specific agent once
    python scripts/autonomous_agents_scheduler.py --agent knowledge_graph
    python scripts/autonomous_agents_scheduler.py --agent conversation_trainer

Environment:
    DATABASE_URL - PostgreSQL connection string (required)
    ANTHROPIC_API_KEY - Anthropic API key (required)
    GITHUB_TOKEN - GitHub token for PR creation (required for conversation_trainer)
    TWILIO_* - Twilio credentials (optional, for client_value_predictor)
"""

import os
import sys
from pathlib import Path
import argparse
import asyncio
from datetime import datetime, time
from typing import Optional
import logging

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from agents.knowledge_graph_builder import KnowledgeGraphBuilder
from agents.conversation_trainer import ConversationTrainer, run_conversation_trainer
from agents.client_value_predictor import ClientValuePredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AgentScheduler:
    """Scheduler for autonomous agents"""

    def __init__(self):
        self.running = True

    async def run_knowledge_graph_builder(self):
        """Execute Knowledge Graph Builder"""
        try:
            logger.info("🕸️ Starting Knowledge Graph Builder...")

            builder = KnowledgeGraphBuilder()

            # Build graph from last 30 days of conversations
            await builder.build_graph_from_all_conversations(days_back=30)

            # Get insights
            insights = await builder.get_entity_insights(top_n=20)

            logger.info(f"✅ Knowledge Graph Builder completed")
            logger.info(f"   - Top entities: {len(insights['top_entities'])}")
            logger.info(f"   - Hubs: {len(insights['hubs'])}")
            logger.info(f"   - Relationship types: {len(insights['relationship_types'])}")

            return insights

        except Exception as e:
            logger.error(f"❌ Knowledge Graph Builder failed: {e}", exc_info=True)
            raise

    async def run_conversation_trainer_agent(self):
        """Execute Conversation Trainer"""
        try:
            logger.info("🤖 Starting Conversation Trainer...")

            # Use the standalone function from conversation_trainer module
            await run_conversation_trainer()

            logger.info("✅ Conversation Trainer completed")

        except Exception as e:
            logger.error(f"❌ Conversation Trainer failed: {e}", exc_info=True)
            raise

    async def run_client_value_predictor_agent(self):
        """Execute Client Value Predictor"""
        try:
            logger.info("💰 Starting Client Value Predictor...")

            predictor = ClientValuePredictor()
            results = await predictor.run_daily_nurturing()

            logger.info(f"✅ Client Value Predictor completed")
            logger.info(f"   - VIP nurtured: {results['vip_nurtured']}")
            logger.info(f"   - High-risk contacted: {results['high_risk_contacted']}")
            logger.info(f"   - Total messages: {results['total_messages_sent']}")

            return results

        except Exception as e:
            logger.error(f"❌ Client Value Predictor failed: {e}", exc_info=True)
            raise

    async def wait_until(self, target_time: time):
        """Wait until a specific time of day"""
        now = datetime.now()
        target = datetime.combine(now.date(), target_time)

        # If target time has passed today, schedule for tomorrow
        if target <= now:
            from datetime import timedelta
            target += timedelta(days=1)

        wait_seconds = (target - now).total_seconds()
        logger.info(f"⏰ Next execution at {target.strftime('%Y-%m-%d %H:%M:%S')} ({wait_seconds/3600:.1f} hours)")

        await asyncio.sleep(wait_seconds)

    async def daily_schedule(self, agent_func, run_time: time, name: str):
        """Run agent daily at specified time"""
        while self.running:
            await self.wait_until(run_time)

            logger.info(f"⏰ Scheduled execution: {name}")
            try:
                await agent_func()
            except Exception as e:
                logger.error(f"Scheduled execution failed: {e}")

            # Sleep a bit to avoid double-execution
            await asyncio.sleep(60)

    async def weekly_schedule(self, agent_func, weekday: int, run_time: time, name: str):
        """Run agent weekly on specified weekday at specified time"""
        while self.running:
            now = datetime.now()

            # Calculate next occurrence of weekday
            days_ahead = weekday - now.weekday()
            if days_ahead <= 0:  # Target day already happened this week or is today
                days_ahead += 7

            from datetime import timedelta
            next_run = datetime.combine(
                (now + timedelta(days=days_ahead)).date(),
                run_time
            )

            # If it's today and time hasn't passed, use today
            if days_ahead == 7:
                target_today = datetime.combine(now.date(), run_time)
                if target_today > now:
                    next_run = target_today

            wait_seconds = (next_run - now).total_seconds()
            logger.info(f"⏰ Next {name} execution at {next_run.strftime('%Y-%m-%d %H:%M:%S')} ({wait_seconds/3600:.1f} hours)")

            await asyncio.sleep(wait_seconds)

            logger.info(f"⏰ Scheduled execution: {name}")
            try:
                await agent_func()
            except Exception as e:
                logger.error(f"Scheduled execution failed: {e}")

            # Sleep to avoid double-execution
            await asyncio.sleep(60)

    async def run_scheduler(self):
        """Run all agent schedules concurrently"""
        logger.info("🚀 Autonomous Agents Scheduler started")
        logger.info("=" * 60)

        # Schedule agents
        schedules = [
            # Knowledge Graph Builder: Daily at 4 AM
            self.daily_schedule(
                self.run_knowledge_graph_builder,
                time(4, 0),
                "Knowledge Graph Builder"
            ),

            # Conversation Trainer: Weekly Sunday at 4 AM
            self.weekly_schedule(
                self.run_conversation_trainer_agent,
                6,  # Sunday = 6
                time(4, 0),
                "Conversation Trainer"
            ),

            # Client Value Predictor: Daily at 10 AM (uncomment when Twilio is configured)
            # self.daily_schedule(
            #     self.run_client_value_predictor_agent,
            #     time(10, 0),
            #     "Client Value Predictor"
            # ),
        ]

        # Run all schedules concurrently
        await asyncio.gather(*schedules)


async def main():
    """Main entry point"""

    # Parse arguments
    parser = argparse.ArgumentParser(description="Autonomous Agents Scheduler")
    parser.add_argument(
        "--agent",
        choices=["knowledge_graph", "conversation_trainer", "client_value_predictor"],
        help="Run specific agent once (for testing)"
    )
    args = parser.parse_args()

    # Check required environment variables
    required_vars = ["DATABASE_URL", "ANTHROPIC_API_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)

    scheduler = AgentScheduler()

    # Run specific agent if requested
    if args.agent:
        logger.info(f"Running {args.agent} once...")

        if args.agent == "knowledge_graph":
            await scheduler.run_knowledge_graph_builder()
        elif args.agent == "conversation_trainer":
            await scheduler.run_conversation_trainer_agent()
        elif args.agent == "client_value_predictor":
            await scheduler.run_client_value_predictor_agent()

        logger.info("✅ Agent execution completed")
        return

    # Run scheduler
    try:
        await scheduler.run_scheduler()
    except KeyboardInterrupt:
        logger.info("\n👋 Scheduler stopped by user")
    except Exception as e:
        logger.error(f"❌ Scheduler crashed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
