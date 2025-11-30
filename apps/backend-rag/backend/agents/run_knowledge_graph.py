#!/usr/bin/env python3
"""
Knowledge Graph Builder - Standalone Runner
Usage: python run_knowledge_graph.py [--days DAYS] [--init-schema]
"""

import argparse
import asyncio
import logging
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.agents.knowledge_graph_builder import KnowledgeGraphBuilder

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def main():
    parser = argparse.ArgumentParser(description="Run Knowledge Graph Builder")
    parser.add_argument("--days", type=int, default=30, help="Days to look back for conversations")
    parser.add_argument("--init-schema", action="store_true", help="Initialize graph schema")
    args = parser.parse_args()

    logger.info("🕸️  Starting Knowledge Graph Builder")

    try:
        builder = KnowledgeGraphBuilder()

        # Initialize schema if requested
        if args.init_schema:
            logger.info("📊 Initializing knowledge graph schema...")
            await builder.init_graph_schema()
            logger.info("✅ Schema initialized")

        # Build graph from conversations
        logger.info(f"🔄 Building graph from last {args.days} days of conversations...")
        await builder.build_graph_from_all_conversations(days_back=args.days)

        # Get insights
        logger.info("📈 Generating insights...")
        insights = await builder.get_entity_insights(top_n=10)

        logger.info("📊 Knowledge Graph Insights:")
        logger.info(f"   Top Entities: {len(insights['top_entities'])}")
        for entity in insights["top_entities"][:5]:
            logger.info(
                f"      - {entity['type']}: {entity['name']} ({entity['mentions']} mentions)"
            )

        logger.info(f"   Hubs (most connected): {len(insights['hubs'])}")
        for hub in insights["hubs"][:5]:
            logger.info(f"      - {hub['type']}: {hub['name']} ({hub['connections']} connections)")

        logger.info(f"   Relationship Types: {len(insights['relationship_types'])}")
        for rel_type, count in list(insights["relationship_types"].items())[:5]:
            logger.info(f"      - {rel_type}: {count}")

        logger.info("🎉 Knowledge Graph Builder completed successfully!")
        return 0

    except Exception as e:
        logger.error(f"❌ Error in Knowledge Graph Builder: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
