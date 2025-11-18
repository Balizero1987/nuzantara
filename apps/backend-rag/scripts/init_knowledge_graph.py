#!/usr/bin/env python3
"""
Initialize Knowledge Graph Database Schema

Run this once to create the necessary PostgreSQL tables for the Knowledge Graph Builder agent.

Usage:
    python scripts/init_knowledge_graph.py

Environment:
    DATABASE_URL - PostgreSQL connection string (required)
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

import asyncio
from agents.knowledge_graph_builder import KnowledgeGraphBuilder


async def main():
    """Initialize Knowledge Graph schema"""

    # Check DATABASE_URL
    if not os.getenv("DATABASE_URL"):
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("   Set it to your PostgreSQL connection string")
        sys.exit(1)

    print("🕸️  Knowledge Graph Initialization")
    print("=" * 50)
    print(f"Database: {os.getenv('DATABASE_URL', '')[:30]}...")
    print()

    try:
        builder = KnowledgeGraphBuilder()

        print("Creating database schema...")
        await builder.init_graph_schema()

        print()
        print("=" * 50)
        print("✅ Knowledge Graph schema initialized successfully!")
        print()
        print("Tables created:")
        print("  - kg_entities (entities with types and metadata)")
        print("  - kg_relationships (connections between entities)")
        print("  - kg_entity_mentions (source references)")
        print()
        print("Next steps:")
        print("  1. Start the backend-rag server")
        print("  2. Call POST /api/autonomous-agents/knowledge-graph-builder/run")
        print("  3. Or setup cron for automated execution")

    except Exception as e:
        print()
        print("❌ Initialization failed:")
        print(f"   {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
