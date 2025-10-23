#!/usr/bin/env python3
"""
Stage 2 Parallel Processor - Intel Automation Pipeline
Runs Stage 2A (RAG Processing), Stage 2B (Content Creation), and Stage 2C (Bali Zero Journal) IN PARALLEL

Supports:
- Ollama Local (Mistral 7B, Mixtral 8x7B, Llama 3.1, Qwen 2.5)
- RunPod Cloud (ZANTARA Llama via vLLM)

Quality filters: 5-day max age, quality score, tier validation
"""

import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import hashlib
import aiohttp
from loguru import logger
import chromadb

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# AI Configuration - Detect which backend to use
AI_BACKEND = os.environ.get("AI_BACKEND", "ollama")  # "ollama" or "runpod"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "mistral:7b")  # mistral:7b, mixtral:8x7b, llama3.1:8b, qwen2.5:7b
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

# RunPod configuration (if using cloud)
RUNPOD_LLAMA_ENDPOINT = os.environ.get("RUNPOD_LLAMA_ENDPOINT")
RUNPOD_API_KEY = os.environ.get("RUNPOD_API_KEY")

# Quality thresholds
MAX_NEWS_AGE_DAYS = 5
MIN_QUALITY_SCORE = 5.0
MIN_WORD_COUNT = 100
TIER_WEIGHTS = {"t1": 1.0, "t2": 0.7, "t3": 0.4}


class ZantaraLlamaClient:
    """ZANTARA Llama 3.1 client for intel processing"""

    def __init__(self):
        self.endpoint = RUNPOD_LLAMA_ENDPOINT
        self.api_key = RUNPOD_API_KEY
        self.timeout = aiohttp.ClientTimeout(total=60)

    async def generate(self, prompt: str, max_tokens: int = 2000) -> Optional[str]:
        """Generate text using ZANTARA Llama"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "input": {
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": 0.7,
                "top_p": 0.9,
            }
        }

        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.post(self.endpoint, json=payload, headers=headers) as resp:
                    if resp.status != 200:
                        logger.error(f"ZANTARA Llama error: {resp.status}")
                        return None

                    data = await resp.json()

                    # Handle RunPod response format
                    if "output" in data:
                        return data["output"]
                    elif "result" in data:
                        return data["result"]
                    else:
                        logger.error(f"Unexpected response format: {data}")
                        return None

        except asyncio.TimeoutError:
            logger.error("ZANTARA Llama timeout")
            return None
        except Exception as e:
            logger.error(f"ZANTARA Llama error: {e}")
            return None


class QualityFilter:
    """Quality filter for intel items"""

    @staticmethod
    def calculate_quality_score(item: Dict[str, Any]) -> float:
        """Calculate quality score (0-10)"""

        score = 5.0  # Base score

        # Tier bonus
        tier = item.get("tier", "t3").lower()
        score += TIER_WEIGHTS.get(tier, 0.4) * 2

        # Word count bonus
        content = item.get("content", "")
        word_count = len(content.split())
        if word_count >= 300:
            score += 2.0
        elif word_count >= 150:
            score += 1.0

        # Date bonus
        if item.get("published_date"):
            score += 0.5

        # Impact level bonus
        impact = item.get("impact_level", "low")
        if impact == "critical":
            score += 1.5
        elif impact == "high":
            score += 1.0

        # Sources bonus
        if item.get("source_url"):
            score += 0.5

        return min(score, 10.0)

    @staticmethod
    def is_too_old(published_date: Optional[str]) -> bool:
        """Check if news is older than MAX_NEWS_AGE_DAYS"""

        if not published_date:
            return False  # No date = can't filter

        try:
            pub_date = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
            age = datetime.now(pub_date.tzinfo) - pub_date
            return age.days > MAX_NEWS_AGE_DAYS
        except Exception as e:
            logger.warning(f"Invalid date format: {published_date} - {e}")
            return False

    @staticmethod
    def passes_filters(item: Dict[str, Any]) -> tuple[bool, str]:
        """Check if item passes all quality filters"""

        # Age filter
        if QualityFilter.is_too_old(item.get("published_date")):
            return False, f"Too old (>{MAX_NEWS_AGE_DAYS} days)"

        # Quality score filter
        score = QualityFilter.calculate_quality_score(item)
        if score < MIN_QUALITY_SCORE:
            return False, f"Quality score too low: {score:.1f} < {MIN_QUALITY_SCORE}"

        # Word count filter
        content = item.get("content", "")
        word_count = len(content.split())
        if word_count < MIN_WORD_COUNT:
            return False, f"Word count too low: {word_count} < {MIN_WORD_COUNT}"

        # Tier validation
        tier = item.get("tier", "").lower()
        if tier not in TIER_WEIGHTS:
            return False, f"Invalid tier: {tier}"

        return True, "OK"


class Stage2AProcessor:
    """Stage 2A: RAG Processing (Raw → ChromaDB JSON)"""

    def __init__(self, chroma_path: str = "./data/chroma_intel"):
        self.llama = ZantaraLlamaClient()
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.quality_filter = QualityFilter()

        # Intel collections
        self.collections = {
            "immigration": "bali_intel_immigration",
            "bkpm_tax": "bali_intel_bkpm_tax",
            "realestate": "bali_intel_realestate",
            "events": "bali_intel_events",
            "social": "bali_intel_social",
            "competitors": "bali_intel_competitors",
            "bali_news": "bali_intel_bali_news",
            "roundup": "bali_intel_roundup",
        }

        # Ensure collections exist
        for name, collection_name in self.collections.items():
            try:
                self.chroma_client.get_collection(collection_name)
            except:
                self.chroma_client.create_collection(collection_name)

    async def process_raw_file(self, raw_file: Path, category: str) -> Optional[Dict[str, Any]]:
        """Process single raw markdown file → ChromaDB JSON"""

        logger.info(f"Processing RAG: {raw_file.name} (category: {category})")

        # Read raw content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except Exception as e:
            logger.error(f"Failed to read {raw_file}: {e}")
            return None

        # Extract with ZANTARA Llama
        prompt = f"""Analyze this Indonesian business/regulatory content and extract structured information.

Category: {category}
Content: {raw_content[:3000]}

Extract as JSON:
{{
  "title": "Clear title of the news/article",
  "summary_id": "2-3 sentence summary in Indonesian",
  "summary_en": "2-3 sentence summary in English",
  "tier": "t1|t2|t3",
  "impact_level": "critical|high|medium|low",
  "category": "{category}",
  "published_date": "YYYY-MM-DD or null",
  "source_url": "URL of the source",
  "source_name": "Name of source",
  "key_changes": ["list of key changes or updates"],
  "affected_groups": ["who is affected"],
  "action_required": true|false,
  "urgency": "immediate|soon|future|none",
  "content": "full article text in original language"
}}

Output ONLY valid JSON, no markdown formatting."""

        result_text = await self.llama.generate(prompt, max_tokens=2500)

        if not result_text:
            logger.error(f"ZANTARA Llama failed for {raw_file.name}")
            return None

        # Parse JSON
        try:
            # Clean markdown if present
            clean_text = result_text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1]
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:]
                clean_text = clean_text.strip()

            extracted = json.loads(clean_text)

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error for {raw_file.name}: {e}")
            return None

        # Quality filtering
        passes, reason = self.quality_filter.passes_filters(extracted)
        if not passes:
            logger.warning(f"Quality filter REJECT: {raw_file.name} - {reason}")
            return None

        # Add metadata
        extracted["id"] = hashlib.sha256(raw_content.encode()).hexdigest()[:16]
        extracted["processed_at"] = datetime.now().isoformat()
        extracted["quality_score"] = self.quality_filter.calculate_quality_score(extracted)

        logger.info(f"✅ RAG processed: {raw_file.name} (score: {extracted['quality_score']:.1f})")

        return extracted

    async def store_to_chromadb(self, item: Dict[str, Any], category: str):
        """Store item to ChromaDB collection"""

        collection_name = self.collections.get(category)
        if not collection_name:
            logger.error(f"Unknown category: {category}")
            return

        try:
            collection = self.chroma_client.get_collection(collection_name)

            # Store with embedding (ChromaDB will auto-embed)
            collection.add(
                documents=[item.get("content", "")],
                metadatas=[{
                    "id": item["id"],
                    "title": item.get("title", ""),
                    "tier": item.get("tier", "t3"),
                    "impact_level": item.get("impact_level", "low"),
                    "published_date": item.get("published_date", ""),
                    "quality_score": str(item.get("quality_score", 0)),
                    "category": category,
                }],
                ids=[item["id"]]
            )

            logger.info(f"✅ Stored to ChromaDB: {item['id']} ({collection_name})")

        except Exception as e:
            logger.error(f"ChromaDB store error: {e}")


class Stage2BProcessor:
    """Stage 2B: Content Creation (Raw → Markdown articles)"""

    def __init__(self):
        self.llama = ZantaraLlamaClient()

    async def create_article(self, raw_file: Path, category: str) -> Optional[str]:
        """Create markdown article from raw content"""

        logger.info(f"Processing Content: {raw_file.name} (category: {category})")

        # Read raw content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except Exception as e:
            logger.error(f"Failed to read {raw_file}: {e}")
            return None

        # Generate article with ZANTARA Llama
        prompt = f"""You are an expert analyst for Bali Zero business services.

Create a professional markdown article from this Indonesian business/regulatory content.

Category: {category}
Source Content: {raw_content[:3000]}

Write a comprehensive article in ITALIAN (for Bali Zero team) with:
- Clear title (## format)
- Executive summary (2-3 sentences)
- Key changes section
- Impact analysis (who is affected, urgency)
- Action items (if needed)
- Source citation

Use markdown formatting. Be concise but thorough. Focus on practical implications for expats/businesses in Indonesia.

Write in Italian language."""

        article = await self.llama.generate(prompt, max_tokens=2000)

        if not article:
            logger.error(f"ZANTARA Llama failed for article: {raw_file.name}")
            return None

        logger.info(f"✅ Article created: {raw_file.name}")

        return article


async def run_stage2_parallel(raw_files: List[Path]) -> Dict[str, Any]:
    """Run Stage 2A and 2B in parallel for all raw files"""

    logger.info(f"Starting Stage 2 parallel processing for {len(raw_files)} files")

    start_time = datetime.now()

    stage_2a = Stage2AProcessor()
    stage_2b = Stage2BProcessor()

    # Organize files by category
    files_by_category = {}
    for raw_file in raw_files:
        # Extract category from path: INTEL_SCRAPING/{category}/raw/*.md
        parts = raw_file.parts
        if "INTEL_SCRAPING" in parts:
            idx = parts.index("INTEL_SCRAPING")
            if idx + 1 < len(parts):
                category = parts[idx + 1]
                if category not in files_by_category:
                    files_by_category[category] = []
                files_by_category[category].append(raw_file)

    # Results tracking
    results = {
        "stage_2a": {
            "processed": 0,
            "failed": 0,
            "filtered": 0,
        },
        "stage_2b": {
            "created": 0,
            "failed": 0,
            "emails_sent": 0,
        },
        "total_files": len(raw_files),
        "duration": 0,
    }

    # Process all files in parallel (2A and 2B together)
    tasks = []

    for category, files in files_by_category.items():
        for raw_file in files:
            # Stage 2A task
            task_2a = asyncio.create_task(
                process_stage_2a(stage_2a, raw_file, category, results)
            )
            tasks.append(task_2a)

            # Stage 2B task (in parallel!)
            task_2b = asyncio.create_task(
                process_stage_2b(stage_2b, raw_file, category, results)
            )
            tasks.append(task_2b)

    # Wait for all tasks to complete
    await asyncio.gather(*tasks, return_exceptions=True)

    # Calculate duration
    duration = (datetime.now() - start_time).total_seconds()
    results["duration"] = duration

    logger.info(f"✅ Stage 2 parallel complete: {duration:.1f}s")
    logger.info(f"   RAG: {results['stage_2a']['processed']} processed, {results['stage_2a']['filtered']} filtered")
    logger.info(f"   Content: {results['stage_2b']['created']} articles created")

    return results


async def process_stage_2a(processor: Stage2AProcessor, raw_file: Path, category: str, results: Dict):
    """Process single file for Stage 2A"""

    try:
        extracted = await processor.process_raw_file(raw_file, category)

        if extracted:
            # Store to ChromaDB
            await processor.store_to_chromadb(extracted, category)

            # Save JSON to disk
            rag_dir = raw_file.parent.parent / "rag"
            rag_dir.mkdir(parents=True, exist_ok=True)

            json_file = rag_dir / f"{raw_file.stem}.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(extracted, f, indent=2, ensure_ascii=False)

            results["stage_2a"]["processed"] += 1
        else:
            results["stage_2a"]["filtered"] += 1

    except Exception as e:
        logger.error(f"Stage 2A error for {raw_file.name}: {e}")
        results["stage_2a"]["failed"] += 1


async def process_stage_2b(processor: Stage2BProcessor, raw_file: Path, category: str, results: Dict):
    """Process single file for Stage 2B"""

    try:
        article = await processor.create_article(raw_file, category)

        if article:
            # Save markdown article
            articles_dir = Path("scripts/INTEL_SCRAPING/markdown_articles")
            articles_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            article_file = articles_dir / f"{timestamp}_{category}_{raw_file.stem}.md"

            with open(article_file, 'w', encoding='utf-8') as f:
                f.write(article)

            results["stage_2b"]["created"] += 1
        else:
            results["stage_2b"]["failed"] += 1

    except Exception as e:
        logger.error(f"Stage 2B error for {raw_file.name}: {e}")
        results["stage_2b"]["failed"] += 1


if __name__ == "__main__":
    # Test run
    import sys

    if len(sys.argv) > 1:
        test_dir = Path(sys.argv[1])
        raw_files = list(test_dir.rglob("*.md"))

        print(f"Testing with {len(raw_files)} files from {test_dir}")

        results = asyncio.run(run_stage2_parallel(raw_files))

        print(json.dumps(results, indent=2))
    else:
        print("Usage: python3 stage2_parallel_processor.py <raw_files_dir>")
        print("Example: python3 stage2_parallel_processor.py scripts/INTEL_SCRAPING/immigration/raw/")
