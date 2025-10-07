#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 2B: LLAMA Content Creator
Creates journalistic articles from scraped content using local LLAMA 3.2
Cost: $0 (fully local)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import logging

try:
    import ollama
except ImportError:
    print("Installing ollama...")
    os.system("pip install ollama")
    import ollama

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Directories
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

class LlamaContentCreator:
    """Create human-quality articles using LLAMA 3.2"""

    def __init__(self, model_name: str = "llama3.2:3b"):
        self.model_name = model_name
        self.base_dir = BASE_DIR
        self.ensure_ollama_model()

    def ensure_ollama_model(self):
        """Ensure LLAMA model is available"""
        try:
            models = ollama.list()
            model_names = [m.model for m in models.models]

            if self.model_name not in model_names:
                logger.info(f"Downloading {self.model_name}... This may take a few minutes.")
                ollama.pull(self.model_name)
                logger.info(f"Model {self.model_name} ready!")
        except Exception as e:
            logger.error(f"Error setting up Ollama: {e}")
            raise

    def create_article(self, document: Dict, category: str) -> Optional[Dict]:
        """Transform raw content into journalistic article"""

        # Determine article type based on category
        article_types = {
            "immigration": "visa and immigration guide",
            "bkpm_tax": "business and tax update",
            "real_estate": "property market analysis",
            "events": "event coverage",
            "social_trends": "trend analysis",
            "competitors": "market analysis",
            "bali_news": "news report",
            "weekly_roundup": "weekly summary"
        }

        article_type = article_types.get(category, "news article")

        prompt = f"""You are an expert journalist writing for expats and digital nomads in Bali.
Transform this raw content into an engaging, informative {article_type}.

Source: {document.get('source_name', 'Unknown')} (Tier {document.get('tier', 3)})
Raw Content:
{document['content'][:3000]}

Create a professional article following this structure:

TITLE: Catchy, SEO-friendly title that captures the essence

LEAD: 2-3 sentence hook that grabs attention and summarizes the key point

INTRODUCTION: Set the context, explain why this matters to expats/businesses in Bali

BODY:
- Use clear H2/H3 headings to structure information
- Explain complex terms in simple language
- Include specific examples and practical implications
- Address the "so what?" - why readers should care
- Use active voice and conversational tone
- Include relevant statistics or data points if mentioned

KEY TAKEAWAYS: 3-5 bullet points of the most important information

WHAT THIS MEANS FOR YOU: Practical implications for different reader groups (tourists, expats, investors, businesses)

ACTION ITEMS: If applicable, specific steps readers should take

CONCLUSION: Wrap up with forward-looking perspective

METADATA:
- Target audience: [tourists/expats/investors/businesses]
- Urgency level: [immediate/soon/future/informational]
- Impact level: [high/medium/low]

Style Guidelines:
- Professional yet friendly tone
- 800-1200 words
- No jargon without explanation
- Use "you" to address the reader directly
- Include transitions between paragraphs
- Fact-based, no speculation
- If the source is Tier 3 (community), note that it's unofficial

Format as clean markdown."""

        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.7,  # More creative for article writing
                    'num_predict': 2000,  # Longer output for full articles
                }
            )

            article_content = response['response'].strip()

            # Extract metadata from the article if present
            metadata = self.extract_article_metadata(article_content)

            article = {
                "title": metadata.get("title", "Untitled Article"),
                "content": article_content,
                "source_document": document.get('url', ''),
                "source_name": document.get('source_name', ''),
                "source_tier": document.get('tier', 3),
                "category": category,
                "created_at": datetime.now().isoformat(),
                "word_count": len(article_content.split()),
                "target_audience": metadata.get("target_audience", ["expats", "businesses"]),
                "urgency": metadata.get("urgency", "informational"),
                "impact_level": metadata.get("impact", "medium"),
                "content_hash": document.get('content_hash', ''),
                "model_used": self.model_name
            }

            return article

        except Exception as e:
            logger.error(f"Error creating article: {e}")
            return None

    def extract_article_metadata(self, content: str) -> Dict:
        """Extract metadata from article content"""
        metadata = {}

        # Try to extract title (first # heading)
        lines = content.split('\n')
        for line in lines:
            if line.startswith('# '):
                metadata['title'] = line[2:].strip()
                break

        # Try to extract other metadata
        if "Target audience:" in content:
            for line in lines:
                if "Target audience:" in line:
                    audience = line.split("Target audience:")[-1].strip()
                    metadata['target_audience'] = [a.strip() for a in audience.split('/')]
                elif "Urgency level:" in line:
                    metadata['urgency'] = line.split("Urgency level:")[-1].strip()
                elif "Impact level:" in line:
                    metadata['impact'] = line.split("Impact level:")[-1].strip()

        return metadata

    def enhance_article_quality(self, article: Dict) -> Dict:
        """Second pass to enhance article quality"""

        prompt = f"""Review and enhance this article for publication. Make it more engaging and polished.

Current Article:
{article['content'][:2000]}

Enhance by:
1. Making the lead more compelling
2. Adding smooth transitions between sections
3. Ensuring consistent tone throughout
4. Adding a call-to-action if missing
5. Checking facts are presented clearly
6. Making sure it addresses reader needs

Return the enhanced version maintaining the same structure and length."""

        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={'temperature': 0.5}
            )

            article['content'] = response['response'].strip()
            article['enhanced'] = True

            return article

        except Exception as e:
            logger.error(f"Error enhancing article: {e}")
            return article

    def process_category(self, category: str):
        """Process all raw documents in a category to create articles"""
        raw_dir = self.base_dir / category / "raw"
        articles_dir = self.base_dir / category / "articles"
        articles_dir.mkdir(parents=True, exist_ok=True)

        if not raw_dir.exists():
            logger.warning(f"No raw directory for {category}")
            return

        json_files = list(raw_dir.glob("*.json"))
        logger.info(f"Creating articles for {len(json_files)} documents in {category}")

        created = 0
        for json_file in json_files:
            # Check if article already exists
            article_file = articles_dir / f"article_{json_file.stem}.json"
            article_md = articles_dir / f"article_{json_file.stem}.md"

            if article_file.exists():
                logger.info(f"Article already exists: {json_file.name}")
                continue

            # Load document
            with open(json_file, 'r', encoding='utf-8') as f:
                document = json.load(f)

            # Skip if content too short
            if document.get('word_count', 0) < 100:
                logger.info(f"Skipping short content: {json_file.name}")
                continue

            # Create article
            logger.info(f"Creating article from: {document.get('title', json_file.name)[:50]}...")
            article = self.create_article(document, category)

            if article:
                # Enhance quality (optional second pass)
                if article['word_count'] > 500:
                    article = self.enhance_article_quality(article)

                # Save article JSON
                with open(article_file, 'w', encoding='utf-8') as f:
                    json.dump(article, f, ensure_ascii=False, indent=2)

                # Save article markdown
                with open(article_md, 'w', encoding='utf-8') as f:
                    f.write(article['content'])

                created += 1
                logger.info(f"Created article: {article['title'][:50]}...")

        logger.info(f"Created {created} articles in {category}")

    def create_category_digest(self, category: str):
        """Create a digest of all articles in a category"""
        articles_dir = self.base_dir / category / "articles"

        if not articles_dir.exists():
            return

        articles = []
        for json_file in articles_dir.glob("article_*.json"):
            with open(json_file, 'r') as f:
                articles.append(json.load(f))

        if not articles:
            return

        # Sort by impact and urgency
        priority_order = {"immediate": 0, "soon": 1, "future": 2, "informational": 3}
        impact_order = {"high": 0, "medium": 1, "low": 2}

        articles.sort(key=lambda x: (
            priority_order.get(x.get('urgency', 'informational'), 3),
            impact_order.get(x.get('impact_level', 'low'), 2)
        ))

        # Create digest
        digest_file = articles_dir / f"digest_{datetime.now().strftime('%Y%m%d')}.md"

        with open(digest_file, 'w') as f:
            f.write(f"# {category.replace('_', ' ').title()} - Daily Digest\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Articles**: {len(articles)}\n\n")

            if articles:
                f.write("## Priority Updates\n\n")

                # High priority items
                high_priority = [a for a in articles if a.get('urgency') in ['immediate', 'soon']]
                if high_priority:
                    for article in high_priority[:3]:
                        f.write(f"### 🔴 {article['title']}\n")
                        f.write(f"- **Urgency**: {article['urgency']}\n")
                        f.write(f"- **Impact**: {article['impact_level']}\n")
                        f.write(f"- **Source**: {article['source_name']} (Tier {article['source_tier']})\n\n")

                f.write("## All Articles\n\n")
                for article in articles:
                    f.write(f"- [{article['title']}](article_{article['content_hash'][:8]}.md)\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")

    def process_all(self):
        """Process all categories to create articles"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 2B: CONTENT CREATION")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]

        total_created = 0
        for category in categories:
            logger.info(f"\nProcessing category: {category}")
            self.process_category(category)

            # Create category digest
            self.create_category_digest(category)

            # Count articles
            articles_dir = self.base_dir / category / "articles"
            if articles_dir.exists():
                count = len(list(articles_dir.glob("article_*.json")))
                total_created += count

        # Generate overall content summary
        self.generate_content_summary(total_created)

        logger.info("=" * 70)
        logger.info(f"CONTENT CREATION COMPLETE: {total_created} articles")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

    def generate_content_summary(self, total_articles: int):
        """Generate summary of content creation"""
        summary_file = self.base_dir / f"content_summary_{datetime.now().strftime('%Y%m%d')}.md"

        with open(summary_file, 'w') as f:
            f.write(f"# Content Creation Summary\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Model**: {self.model_name}\n")
            f.write(f"**Total Articles**: {total_articles}\n\n")

            f.write("## Articles by Category\n\n")

            categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]
            for category in categories:
                articles_dir = self.base_dir / category / "articles"
                if articles_dir.exists():
                    count = len(list(articles_dir.glob("article_*.json")))
                    if count > 0:
                        f.write(f"- **{category}**: {count} articles\n")

                        # List top articles
                        articles = []
                        for json_file in list(articles_dir.glob("article_*.json"))[:3]:
                            with open(json_file, 'r') as jf:
                                article = json.load(jf)
                                articles.append(article)

                        for article in articles:
                            f.write(f"  - {article['title'][:60]}...\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")


def main():
    """Main entry point"""
    creator = LlamaContentCreator()
    creator.process_all()


if __name__ == "__main__":
    main()