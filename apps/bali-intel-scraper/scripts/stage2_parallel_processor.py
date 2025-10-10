#!/usr/bin/env python3
"""
Stage 2: Parallel Processing (2A + 2B IN CONTEMPORANEA)

Stage 2A: RAG Processing
  - Input: INTEL_SCRAPING/{category}/raw/*.md
  - Output: Embeddings → ChromaDB (via RAG backend)
  - Process: Generate embeddings, store in vector DB

Stage 2B: Content Creation
  - Input: INTEL_SCRAPING/{category}/raw/*.md
  - Output: YYYYMMDD_HHMMSS_{category}.md articles
  - Process: Claude API creates final markdown articles
  - Email: Send to collaborators (regular) or zero@balizero.com (LLAMA)

Both stages run IN PARALLEL using Python asyncio/multiprocessing
"""

import asyncio
import json
import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple
import requests

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_BASE = SCRIPT_DIR / "INTEL_SCRAPING"

# Configuration
RAG_BACKEND_URL = os.getenv("RAG_BACKEND_URL", "https://zantara-rag-backend-himaadsxua-ew.a.run.app")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Import send_intel_email function
sys.path.insert(0, str(SCRIPT_DIR))
try:
    from send_intel_email import send_intel_email, REGULAR_CATEGORIES, LLAMA_CATEGORIES
except ImportError:
    logger.warning("⚠️  send_intel_email.py not found, email disabled")
    send_intel_email = None
    REGULAR_CATEGORIES = {}
    LLAMA_CATEGORIES = {}


# ========================================
# STAGE 2A: RAG PROCESSING
# ========================================

class RAGProcessor:
    """Handles Stage 2A: RAG processing and ChromaDB upload."""

    def __init__(self):
        self.stats = {
            'total_files': 0,
            'processed': 0,
            'failed': 0,
            'embeddings_generated': 0
        }

    def process_file(self, md_file: Path) -> bool:
        """Process single markdown file → RAG backend."""
        try:
            # Read markdown content
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract category from path
            # Expected: INTEL_SCRAPING/{category}/raw/{file}.md
            category = md_file.parent.parent.name

            # Generate embedding
            embedding = self._generate_embedding(content[:5000])  # First 5K chars

            if not embedding:
                logger.warning(f"⚠️  No embedding for {md_file.name}")
                self.stats['failed'] += 1
                return False

            # Store in ChromaDB via RAG backend
            success = self._store_in_chromadb(
                category=category,
                file_id=md_file.stem,
                content=content,
                embedding=embedding
            )

            if success:
                self.stats['processed'] += 1
                self.stats['embeddings_generated'] += 1
                logger.info(f"  ✅ RAG: {category}/{md_file.name}")
                return True
            else:
                self.stats['failed'] += 1
                return False

        except Exception as e:
            logger.error(f"❌ RAG processing failed for {md_file}: {e}")
            self.stats['failed'] += 1
            return False

    def _generate_embedding(self, text: str) -> list:
        """Generate embedding via RAG backend."""
        try:
            response = requests.post(
                f"{RAG_BACKEND_URL}/api/embed",
                json={"text": text},
                timeout=30
            )
            response.raise_for_status()
            return response.json().get("embedding")
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
            return None

    def _store_in_chromadb(self, category: str, file_id: str, content: str, embedding: list) -> bool:
        """Store document in ChromaDB via RAG backend."""
        try:
            response = requests.post(
                f"{RAG_BACKEND_URL}/api/intel/store",
                json={
                    "collection": f"bali_intel_{category}",
                    "id": file_id,
                    "document": content,
                    "embedding": embedding,
                    "metadata": {
                        "category": category,
                        "timestamp": datetime.now().isoformat(),
                        "source": "intel_scraper"
                    }
                },
                timeout=30
            )
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"ChromaDB storage failed: {e}")
            return False

    async def process_all_files_async(self, md_files: List[Path]) -> Dict:
        """Process all markdown files in parallel."""
        self.stats['total_files'] = len(md_files)

        logger.info(f"🧠 Stage 2A (RAG): Processing {len(md_files)} files...")

        # Use ThreadPoolExecutor for I/O-bound tasks (API calls)
        with ThreadPoolExecutor(max_workers=5) as executor:
            loop = asyncio.get_event_loop()
            tasks = [
                loop.run_in_executor(executor, self.process_file, md_file)
                for md_file in md_files
            ]
            await asyncio.gather(*tasks)

        logger.info(f"✅ Stage 2A complete: {self.stats['processed']}/{self.stats['total_files']} processed")
        return self.stats


# ========================================
# STAGE 2B: CONTENT CREATION
# ========================================

class ContentCreator:
    """Handles Stage 2B: Content creation and email sending."""

    def __init__(self):
        self.stats = {
            'total_files': 0,
            'created': 0,
            'failed': 0,
            'emails_sent': 0
        }
        self.output_dir = OUTPUT_BASE / "articles"
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def create_article(self, md_file: Path) -> Tuple[bool, str]:
        """Create final article from raw markdown."""
        try:
            # Read raw content
            with open(md_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()

            # Extract category
            category = md_file.parent.parent.name

            # Generate article using Claude API (simplified for now)
            article_content = self._generate_article_with_claude(raw_content, category)

            if not article_content:
                logger.warning(f"⚠️  No article generated for {md_file.name}")
                self.stats['failed'] += 1
                return False, ""

            # Save article
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            article_filename = f"{timestamp}_{category}.md"
            article_path = self.output_dir / category
            article_path.mkdir(parents=True, exist_ok=True)

            article_file = article_path / article_filename
            with open(article_file, 'w', encoding='utf-8') as f:
                f.write(article_content)

            self.stats['created'] += 1
            logger.info(f"  ✅ Article: {category}/{article_filename}")

            # Send email
            if send_intel_email:
                email_sent = self._send_email(category, str(article_file))
                if email_sent:
                    self.stats['emails_sent'] += 1

            return True, str(article_file)

        except Exception as e:
            logger.error(f"❌ Article creation failed for {md_file}: {e}")
            self.stats['failed'] += 1
            return False, ""

    def _generate_article_with_claude(self, raw_content: str, category: str) -> str:
        """Generate article using Claude API."""
        # This is a placeholder - real implementation would use Claude API
        # For now, return formatted version of raw content

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        article = f"""# Intel Report: {category.upper()}
**Generated**: {timestamp}
**Category**: {category}

---

## Summary

{raw_content[:500]}...

---

## Full Content

{raw_content}

---

*Generated by ZANTARA Intel System*
"""
        return article

    def _send_email(self, category: str, article_file: str) -> bool:
        """Send email to collaborator or LLAMA."""
        try:
            # Determine if regular or LLAMA category
            if category in REGULAR_CATEGORIES or category in LLAMA_CATEGORIES:
                return send_intel_email(category, article_file)
            else:
                logger.warning(f"⚠️  Unknown category {category}, skipping email")
                return False
        except Exception as e:
            logger.error(f"Email failed for {category}: {e}")
            return False

    async def create_all_articles_async(self, md_files: List[Path]) -> Dict:
        """Create all articles in parallel."""
        self.stats['total_files'] = len(md_files)

        logger.info(f"✍️  Stage 2B (Content): Creating {len(md_files)} articles...")

        # Use ThreadPoolExecutor for I/O-bound tasks (API calls)
        with ThreadPoolExecutor(max_workers=3) as executor:
            loop = asyncio.get_event_loop()
            tasks = [
                loop.run_in_executor(executor, self.create_article, md_file)
                for md_file in md_files
            ]
            await asyncio.gather(*tasks)

        logger.info(f"✅ Stage 2B complete: {self.stats['created']}/{self.stats['total_files']} articles created")
        logger.info(f"📧 Emails sent: {self.stats['emails_sent']}")
        return self.stats


# ========================================
# PARALLEL ORCHESTRATOR
# ========================================

async def run_stage2_parallel(md_files: List[Path]) -> Dict:
    """
    Run Stage 2A (RAG) and Stage 2B (Content) IN CONTEMPORANEA (parallel).

    Returns:
        Dict with combined stats from both stages
    """

    logger.info("=" * 80)
    logger.info("STAGE 2: PARALLEL PROCESSING (2A + 2B IN CONTEMPORANEA)")
    logger.info("=" * 80)
    logger.info(f"Total files: {len(md_files)}")
    logger.info("Stage 2A: RAG Processing → ChromaDB")
    logger.info("Stage 2B: Content Creation → Email Collaborators")
    logger.info("")

    start_time = datetime.now()

    # Create processors
    rag_processor = RAGProcessor()
    content_creator = ContentCreator()

    # Run both stages IN PARALLEL
    logger.info("🚀 Starting parallel processing...")

    stage2a_task = rag_processor.process_all_files_async(md_files)
    stage2b_task = content_creator.create_all_articles_async(md_files)

    # Wait for both to complete
    stage2a_stats, stage2b_stats = await asyncio.gather(stage2a_task, stage2b_task)

    duration = (datetime.now() - start_time).total_seconds()

    # Combined stats
    combined_stats = {
        'duration': duration,
        'stage_2a': stage2a_stats,
        'stage_2b': stage2b_stats,
        'total_files': len(md_files),
        'success': True
    }

    logger.info("")
    logger.info("=" * 80)
    logger.info("STAGE 2: PARALLEL PROCESSING - COMPLETE")
    logger.info("=" * 80)
    logger.info(f"⏱️  Duration: {duration:.1f}s ({duration/60:.1f} min)")
    logger.info(f"🧠 Stage 2A (RAG): {stage2a_stats['processed']}/{stage2a_stats['total_files']} processed")
    logger.info(f"✍️  Stage 2B (Content): {stage2b_stats['created']}/{stage2b_stats['total_files']} created")
    logger.info(f"📧 Emails sent: {stage2b_stats['emails_sent']}")
    logger.info("=" * 80)

    return combined_stats


# ========================================
# MAIN ENTRY POINT
# ========================================

def main():
    """CLI interface for testing."""

    # Find all raw markdown files
    raw_files = list(OUTPUT_BASE.rglob("*/raw/*.md"))

    if not raw_files:
        logger.error("❌ No raw markdown files found in INTEL_SCRAPING/*/raw/")
        logger.info(f"   Expected location: {OUTPUT_BASE}/{{category}}/raw/*.md")
        sys.exit(1)

    logger.info(f"Found {len(raw_files)} raw markdown files")

    # Run parallel processing
    stats = asyncio.run(run_stage2_parallel(raw_files))

    # Save stats report
    report_file = OUTPUT_BASE / f"stage2_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(stats, f, indent=2)

    logger.info(f"📊 Report saved: {report_file}")

    sys.exit(0 if stats['success'] else 1)


if __name__ == "__main__":
    main()
