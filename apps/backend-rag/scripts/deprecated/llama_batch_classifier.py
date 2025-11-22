#!/usr/bin/env python3
"""
LLAMA Batch Classification Script
Daily scheduled task to classify Intel Scraping documents using LLAMA 3.1

Usage:
    python scripts/llama_batch_classifier.py [--dry-run] [--limit N]

Features:
- Classifies documents from INTEL_SCRAPING/
- Uses LLAMA 3.1 on RunPod (when available)
- Falls back to Claude Sonnet if LLAMA unavailable
- Saves classification results to JSON
- Can be scheduled with Fly.io Cron Jobs

Classification Types:
1. Topic Classification (immigration, tax, business setup, etc.)
2. Priority/Urgency (high, medium, low)
3. Target Audience (entrepreneurs, investors, expats, locals)
4. Actionability (requires action, informational only)
"""

import os
import json
import glob
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import asyncio
import argparse

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LlamaClassifier:
    """Batch classifier using LLAMA 3.1"""

    def __init__(self, runpod_endpoint: Optional[str] = None, runpod_api_key: Optional[str] = None):
        """
        Initialize classifier

        Args:
            runpod_endpoint: RunPod LLAMA endpoint URL
            runpod_api_key: RunPod API key
        """
        self.runpod_endpoint = runpod_endpoint or os.getenv("RUNPOD_LLAMA_ENDPOINT")
        self.runpod_api_key = runpod_api_key or os.getenv("RUNPOD_API_KEY")
        self.use_llama = bool(self.runpod_endpoint and self.runpod_api_key)

        if self.use_llama:
            logger.info(f"✅ LLAMA classifier initialized (RunPod)")
        else:
            logger.warning("⚠️ LLAMA not configured, will use Claude fallback")


    async def classify_document(self, document: Dict) -> Dict:
        """
        Classify a single document

        Args:
            document: Document dict with title, content, category, etc.

        Returns:
            Classification dict with topic, priority, audience, actionability
        """
        title = document.get("title", "")
        content = document.get("content", "")[:2000]  # First 2000 chars
        category = document.get("category", "")

        # Build classification prompt
        prompt = f"""Classify this Indonesian regulatory document:

Title: {title}
Category: {category}
Content: {content[:500]}...

Provide classification in JSON format:
{{
    "topic": "one of: immigration, tax, business_setup, employment_law, real_estate, banking, health_safety",
    "priority": "high/medium/low",
    "target_audience": ["entrepreneurs", "investors", "expats", "locals"],
    "actionability": "requires_action" or "informational",
    "summary": "one sentence summary in English"
}}

Reply with ONLY the JSON, no other text."""

        try:
            if self.use_llama:
                # Use LLAMA via RunPod
                result = await self._call_llama(prompt)
            else:
                # Fallback to Claude
                result = await self._call_claude(prompt)

            # Parse JSON response
            import re
            json_match = re.search(r'\{[^}]+\}', result, re.DOTALL)
            if json_match:
                classification = json.loads(json_match.group(0))
                logger.info(f"✅ Classified: {title[:50]}... → {classification.get('topic')}")
                return classification
            else:
                logger.error(f"❌ No JSON found in response: {result[:100]}")
                return self._default_classification()

        except Exception as e:
            logger.error(f"❌ Classification failed for {title[:50]}...: {e}")
            return self._default_classification()


    async def _call_llama(self, prompt: str) -> str:
        """Call LLAMA via RunPod"""
        import httpx

        payload = {
            "input": {
                "prompt": prompt,
                "max_tokens": 300,
                "temperature": 0.1
            }
        }

        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{self.runpod_endpoint}/runsync",
                headers={
                    "Authorization": f"Bearer {self.runpod_api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return data.get("output", {}).get("text", "")


    async def _call_claude(self, prompt: str) -> str:
        """Fallback to Claude Sonnet"""
        import anthropic

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise Exception("Neither LLAMA nor Claude API key configured")

        client = anthropic.AsyncAnthropic(api_key=api_key)

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )

        return message.content[0].text


    def _default_classification(self) -> Dict:
        """Return default classification on error"""
        return {
            "topic": "unknown",
            "priority": "medium",
            "target_audience": ["general"],
            "actionability": "informational",
            "summary": "Classification failed"
        }


async def main(dry_run: bool = False, limit: Optional[int] = None):
    """
    Main batch classification function

    Args:
        dry_run: If True, don't save results
        limit: Maximum number of documents to process
    """
    logger.info("🚀 Starting LLAMA Batch Classifier")
    logger.info(f"   Dry run: {dry_run}")
    logger.info(f"   Limit: {limit or 'none'}")

    # Initialize classifier
    classifier = LlamaClassifier()

    # Find all unclassified documents
    intel_dir = Path("/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/INTEL_SCRAPING")
    if not intel_dir.exists():
        logger.error(f"❌ INTEL_SCRAPING directory not found: {intel_dir}")
        return

    # Find all JSON files
    json_files = list(intel_dir.rglob("*.json"))
    logger.info(f"📁 Found {len(json_files)} JSON files")

    # Filter for documents needing classification
    unclassified = []
    for json_file in json_files:
        # Skip non-document files
        if any(skip in json_file.name for skip in [
            "pipeline_report",
            "test_validation",
            "scraper_cache",
            "classification_batch"
        ]):
            continue

        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                doc = json.load(f)

                # Check if already classified AND has required fields
                if "llama_classification" not in doc and "title" in doc and "content" in doc:
                    unclassified.append((json_file, doc))
        except Exception as e:
            logger.warning(f"⚠️ Skipping {json_file.name}: {e}")

    logger.info(f"📊 Unclassified documents: {len(unclassified)}")

    if limit:
        unclassified = unclassified[:limit]
        logger.info(f"   Processing first {limit} documents")

    # Classify each document
    results = []
    for i, (file_path, doc) in enumerate(unclassified, 1):
        logger.info(f"[{i}/{len(unclassified)}] Classifying: {file_path.name}")

        classification = await classifier.classify_document(doc)

        # Add classification to document
        doc["llama_classification"] = classification
        doc["llama_classified_at"] = datetime.utcnow().isoformat()

        results.append({
            "file": str(file_path),
            "classification": classification
        })

        # Save updated document
        if not dry_run:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(doc, f, indent=2, ensure_ascii=False)
            logger.info(f"   ✅ Saved classification to {file_path.name}")
        else:
            logger.info(f"   [DRY RUN] Would save to {file_path.name}")

        # Rate limiting (avoid RunPod throttling)
        await asyncio.sleep(2)

    # Save batch summary
    summary = {
        "run_date": datetime.utcnow().isoformat(),
        "total_classified": len(results),
        "classifier_used": "llama" if classifier.use_llama else "claude",
        "results": results
    }

    summary_file = intel_dir / f"classification_batch_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

    if not dry_run:
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Batch summary saved: {summary_file}")
    else:
        logger.info(f"[DRY RUN] Would save summary to {summary_file}")

    logger.info("🎉 Batch classification complete!")
    logger.info(f"   Total classified: {len(results)}")
    logger.info(f"   AI used: {summary['classifier_used'].upper()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LLAMA Batch Classifier")
    parser.add_argument("--dry-run", action="store_true", help="Don't save results")
    parser.add_argument("--limit", type=int, help="Max documents to process")
    args = parser.parse_args()

    asyncio.run(main(dry_run=args.dry_run, limit=args.limit))
