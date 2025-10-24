#!/usr/bin/env python3
"""Test Stage 2 sequentially with Ollama local"""
import asyncio
import sys
from pathlib import Path
from stage2_parallel_processor import Stage2AProcessor, Stage2BProcessor, Stage2CProcessor

async def test_sequential():
    raw_file = Path("INTEL_SCRAPING/test/raw").glob("*.md").__next__()
    category = "test"

    print(f"Testing with: {raw_file.name}")
    print("="*60)

    # Stage 2A
    print("\n🔄 Stage 2A (RAG Processing)...")
    stage_2a = Stage2AProcessor()
    result_2a = await stage_2a.process_raw_file(raw_file, category)
    if result_2a:
        print(f"✅ 2A: {result_2a['title'][:50]}...")
        print(f"   Date: {result_2a.get('published_date')}")
        print(f"   Score: {result_2a.get('quality_score')}")
    else:
        print("❌ 2A: Failed or filtered")

    # Stage 2B
    print("\n🔄 Stage 2B (Content Creation)...")
    stage_2b = Stage2BProcessor()
    result_2b = await stage_2b.create_article(raw_file, category)
    if result_2b:
        print(f"✅ 2B: Article created ({len(result_2b)} chars)")
        print(f"   Preview: {result_2b[:100]}...")
    else:
        print("❌ 2B: Failed")

    # Stage 2C
    print("\n🔄 Stage 2C (Bali Zero Journal)...")
    stage_2c = Stage2CProcessor()
    result_2c = await stage_2c.create_journal_post(raw_file, category)
    if result_2c:
        print(f"✅ 2C: Journal post created ({len(result_2c)} chars)")
        print(f"   Preview: {result_2c[:100]}...")
    else:
        print("❌ 2C: Failed")

    print("\n" + "="*60)
    print("DONE!")

if __name__ == "__main__":
    asyncio.run(test_sequential())
