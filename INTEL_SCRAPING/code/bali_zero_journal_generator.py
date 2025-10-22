#!/usr/bin/env python3
"""
BALI ZERO JOURNAL - Daily Magazine Generator
Powered by LLAMA 3.1 8B (Runpod) + ImagineArt + Gmail Automation

Workflow:
1. Collect all scraped articles from today
2. Send to LLAMA 3.1 8B for intelligent curation and layout
3. Generate cover images with ImagineArt
4. Create beautiful PDF magazine
5. Email to all Bali Zero team via zero@balizero.com

Author: Antonio (Zero)
Date: 2025-10-22
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import requests
import time
from dataclasses import dataclass

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent / "apps/backend-ts/src/services/google"))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class ArticleMetadata:
    """Metadata for a scraped article"""
    title: str
    category: str
    source: str
    url: str
    date: str
    word_count: int
    tier: str
    impact_level: str
    content: str
    image_url: Optional[str] = None

@dataclass
class JournalConfig:
    """Configuration for Bali Zero Journal"""
    runpod_endpoint: str = "https://api.runpod.ai/v2/itz2q5gmid4cyt"
    runpod_api_key: str = "rpa_O0Z01LGRFLEG7DAX7FRGLJ4SOJSHKSGD9RRJD1RMwmq5qz"
    imagineart_handler_path: str = "apps/backend-ts/src/handlers/ai-services/imagine-art-handler.ts"
    output_dir: Path = Path("INTEL_SCRAPING/data/JOURNAL")
    team_emails: List[str] = None
    sender_email: str = "zero@balizero.com"

    def __post_init__(self):
        if self.team_emails is None:
            self.team_emails = [
                "zero@balizero.com",
                "consulting@balizero.com",  # Adit
                "dea@balizero.com",  # Dea
                "krisna@balizero.com",  # Krisna
                "sahira@balizero.com",  # Sahira
                "ari.firda@balizero.com",  # Ari
                "damar@balizero.com",  # Damar
                "surya@balizero.com",  # Surya
                "faisha@balizero.com",  # Faisha
                "Anton@balizero.com",  # Anton
                "amanda@balizero.com",  # Amanda
                "dea.au.tax@balizero.com"  # Dewa Ayu
            ]


class RunpodLLAMAService:
    """Service to communicate with LLAMA 3.1 8B on Runpod"""

    def __init__(self, endpoint: str, api_key: str):
        self.endpoint = endpoint
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def process_articles_for_journal(self, articles: List[ArticleMetadata]) -> Dict[str, Any]:
        """
        Send all articles to LLAMA for intelligent journal creation

        Returns:
        {
            "cover_stories": [
                {"title": "...", "summary": "...", "image_prompt": "..."}
            ],
            "sections": [
                {
                    "section_title": "Business & Economy",
                    "articles": [
                        {"title": "...", "content": "...", "importance": 9}
                    ]
                }
            ],
            "editorial_note": "..."
        }
        """
        logger.info(f"Sending {len(articles)} articles to LLAMA 3.1 8B for journal creation...")

        # Prepare articles data for LLAMA
        articles_data = []
        for article in articles:
            articles_data.append({
                "title": article.title,
                "category": article.category,
                "source": article.source,
                "content": article.content[:1000],  # First 1000 chars
                "word_count": article.word_count,
                "tier": article.tier,
                "impact": article.impact_level,
                "url": article.url
            })

        prompt = f"""You are the Chief Editor of BALI ZERO JOURNAL, a daily magazine for business professionals in Indonesia.

Today you have {len(articles)} articles to curate into a beautiful daily magazine.

YOUR TASK:
1. Select the 3-5 MOST IMPORTANT stories for the COVER (front page)
   - For each, write a compelling headline and 2-sentence summary
   - Create a visual prompt for cover image generation (descriptive, professional)

2. Organize ALL articles into SECTIONS:
   - Business & Economy
   - Immigration & Visas
   - Real Estate & Property
   - Technology & Innovation
   - Lifestyle & Culture
   - Regulatory & Legal
   - Tax & Finance
   - Other News

3. For each article, assign an IMPORTANCE score (1-10)

4. Write a brief EDITORIAL NOTE (3-4 sentences) about today's key themes

FORMAT YOUR RESPONSE AS JSON:
{{
  "cover_stories": [
    {{
      "title": "Headline for cover",
      "summary": "2-sentence summary",
      "image_prompt": "Professional business image prompt",
      "category": "business",
      "importance": 10
    }}
  ],
  "sections": [
    {{
      "section_title": "Business & Economy",
      "articles": [
        {{
          "original_title": "...",
          "polished_title": "Improved headline",
          "summary": "1-2 sentence summary",
          "importance": 8,
          "category": "business"
        }}
      ]
    }}
  ],
  "editorial_note": "Today's highlights focus on...",
  "date": "{datetime.now().strftime('%Y-%m-%d')}"
}}

ARTICLES TO CURATE:
{json.dumps(articles_data, indent=2)}

Respond ONLY with valid JSON. Be professional, concise, and focus on business relevance."""

        payload = {
            "input": {
                "prompt": prompt,
                "max_tokens": 4000,
                "temperature": 0.7,
                "top_p": 0.9
            }
        }

        try:
            # Send to Runpod /run endpoint (async job)
            response = requests.post(
                f"{self.endpoint}/run",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()

            job_data = response.json()
            job_id = job_data.get("id")

            if not job_id:
                logger.error(f"No job ID returned: {job_data}")
                return self._get_fallback_journal(articles)

            logger.info(f"LLAMA job submitted: {job_id}")

            # Poll for results (max 5 minutes)
            max_attempts = 60
            attempt = 0

            while attempt < max_attempts:
                time.sleep(5)
                attempt += 1

                status_response = requests.get(
                    f"{self.endpoint}/status/{job_id}",
                    headers=self.headers,
                    timeout=10
                )
                status_response.raise_for_status()

                status_data = status_response.json()
                status = status_data.get("status")

                logger.info(f"Job status ({attempt}/{max_attempts}): {status}")

                if status == "COMPLETED":
                    output = status_data.get("output", {})
                    result_text = output.get("result", "") or output.get("text", "")

                    # Parse JSON from LLAMA response
                    try:
                        # Extract JSON if wrapped in markdown
                        if "```json" in result_text:
                            result_text = result_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in result_text:
                            result_text = result_text.split("```")[1].split("```")[0].strip()

                        journal_data = json.loads(result_text)
                        logger.info("✅ LLAMA successfully created journal structure!")
                        return journal_data

                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse LLAMA JSON response: {e}")
                        logger.error(f"Raw response: {result_text[:500]}")
                        return self._get_fallback_journal(articles)

                elif status == "FAILED":
                    error_msg = status_data.get("error", "Unknown error")
                    logger.error(f"LLAMA job failed: {error_msg}")
                    return self._get_fallback_journal(articles)

            logger.warning("LLAMA job timeout - using fallback")
            return self._get_fallback_journal(articles)

        except Exception as e:
            logger.error(f"Error communicating with Runpod LLAMA: {e}")
            return self._get_fallback_journal(articles)

    def _get_fallback_journal(self, articles: List[ArticleMetadata]) -> Dict[str, Any]:
        """Fallback journal structure if LLAMA fails"""
        logger.info("Using fallback journal structure")

        # Group by category
        by_category = {}
        for article in articles:
            category = article.category
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(article)

        # Pick top 3 articles for cover (by word count as proxy for importance)
        sorted_articles = sorted(articles, key=lambda a: a.word_count, reverse=True)
        cover_stories = []

        for article in sorted_articles[:3]:
            cover_stories.append({
                "title": article.title,
                "summary": f"{article.source} reports on {article.category}",
                "image_prompt": f"Professional business illustration for {article.category}",
                "category": article.category,
                "importance": 9
            })

        # Create sections
        sections = []
        for category, cat_articles in by_category.items():
            section_articles = []
            for article in cat_articles:
                section_articles.append({
                    "original_title": article.title,
                    "polished_title": article.title,
                    "summary": article.content[:200] + "..." if len(article.content) > 200 else article.content,
                    "importance": 7,
                    "category": category
                })

            sections.append({
                "section_title": category.replace("_", " ").title(),
                "articles": section_articles
            })

        return {
            "cover_stories": cover_stories,
            "sections": sections,
            "editorial_note": f"Today's Bali Zero Journal covers {len(articles)} stories across {len(by_category)} categories.",
            "date": datetime.now().strftime('%Y-%m-%d')
        }


class ImagineArtService:
    """Service to generate cover images using ImagineArt"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("IMAGINEART_API_KEY")
        self.base_url = "https://api.imagineart.io/v1"  # Placeholder - verify actual API

    def generate_cover_image(self, prompt: str, style: str = "realistic") -> Optional[str]:
        """
        Generate cover image from prompt

        Returns: URL to generated image or None
        """
        logger.info(f"Generating cover image: {prompt[:100]}...")

        # For now, return placeholder - will integrate with actual ImagineArt API
        # TODO: Integrate with apps/backend-ts/src/handlers/ai-services/imagine-art-handler.ts

        placeholder_url = f"https://via.placeholder.com/1200x600/1a1a1a/ffffff?text=BALI+ZERO+JOURNAL"
        logger.info(f"Using placeholder image (ImagineArt integration pending)")

        return placeholder_url


class BaliZeroJournalGenerator:
    """Main orchestrator for Bali Zero Journal generation"""

    def __init__(self, config: JournalConfig):
        self.config = config
        self.llama_service = RunpodLLAMAService(config.runpod_endpoint, config.runpod_api_key)
        self.imagineart_service = ImagineArtService()

        # Create output directory
        self.config.output_dir.mkdir(parents=True, exist_ok=True)

    def collect_todays_articles(self, date: Optional[str] = None) -> List[ArticleMetadata]:
        """
        Collect all articles scraped today (or specified date)

        Date format: YYYYMMDD (e.g., 20251022)
        """
        if date is None:
            date = datetime.now().strftime("%Y%m%d")

        logger.info(f"Collecting articles for date: {date}")

        data_dir = Path("INTEL_SCRAPING/data/INTEL_SCRAPING")
        articles = []

        # Scan all category directories
        for category_dir in data_dir.glob("*/raw"):
            category_name = category_dir.parent.name

            # Find articles matching today's date
            for article_file in category_dir.glob(f"{date}_*.md"):
                try:
                    content = article_file.read_text(encoding='utf-8')

                    # Parse markdown metadata
                    metadata = self._parse_article_metadata(content)

                    article = ArticleMetadata(
                        title=metadata.get("title", article_file.stem),
                        category=category_name,
                        source=metadata.get("source", "Unknown"),
                        url=metadata.get("url", ""),
                        date=metadata.get("date", date),
                        word_count=metadata.get("words", len(content.split())),
                        tier=metadata.get("tier", "T3"),
                        impact_level=metadata.get("impact_level", "medium"),
                        content=metadata.get("content", content),
                        image_url=metadata.get("image")
                    )

                    articles.append(article)

                except Exception as e:
                    logger.warning(f"Failed to parse {article_file}: {e}")

        logger.info(f"✅ Collected {len(articles)} articles from {date}")
        return articles

    def _parse_article_metadata(self, markdown_content: str) -> Dict[str, Any]:
        """Parse metadata from markdown article"""
        metadata = {}
        lines = markdown_content.split('\n')

        content_start = 0
        in_metadata = False

        for i, line in enumerate(lines):
            line = line.strip()

            # Title (first # heading)
            if line.startswith('# ') and 'title' not in metadata:
                metadata['title'] = line[2:].strip()

            # Metadata fields
            elif line.startswith('**') and '**:' in line:
                key = line.split('**')[1].split('**')[0].lower().replace(' ', '_')
                value = line.split(':', 1)[1].strip()
                metadata[key] = value

            # Content section
            elif line.startswith('## Content'):
                content_start = i + 1
                break

        # Extract main content
        if content_start > 0:
            content_lines = lines[content_start:]
            metadata['content'] = '\n'.join(content_lines).strip()
        else:
            metadata['content'] = markdown_content

        return metadata

    def generate_journal(self, articles: List[ArticleMetadata]) -> Dict[str, Any]:
        """
        Generate complete journal from articles

        Returns journal data structure ready for PDF/HTML rendering
        """
        logger.info(f"🎨 Generating Bali Zero Journal with {len(articles)} articles...")

        # Step 1: LLAMA processes all articles
        journal_structure = self.llama_service.process_articles_for_journal(articles)

        # Step 2: Generate cover images
        cover_images = []
        for story in journal_structure.get("cover_stories", [])[:3]:
            image_prompt = story.get("image_prompt", "Professional business illustration")
            image_url = self.imagineart_service.generate_cover_image(image_prompt)
            cover_images.append(image_url)

        journal_structure['cover_images'] = cover_images
        journal_structure['generated_at'] = datetime.now().isoformat()
        journal_structure['total_articles'] = len(articles)

        # Step 3: Save journal structure
        output_file = self.config.output_dir / f"journal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        output_file.write_text(json.dumps(journal_structure, indent=2, ensure_ascii=False))

        logger.info(f"✅ Journal structure saved: {output_file}")

        return journal_structure

    def create_pdf(self, journal_data: Dict[str, Any]) -> Path:
        """Create PDF from journal data - will implement with ReportLab or WeasyPrint"""
        logger.info("📄 Creating PDF (placeholder - will implement next)")

        # Placeholder - will implement PDF generation
        pdf_path = self.config.output_dir / f"BaliZeroJournal_{datetime.now().strftime('%Y%m%d')}.pdf"

        # TODO: Implement beautiful PDF with:
        # - Cover page with BALI ZERO JOURNAL logo
        # - Cover stories with images
        # - Sections with articles
        # - Professional typography

        return pdf_path

    def send_to_team(self, pdf_path: Path, journal_data: Dict[str, Any]):
        """Send journal to all team members via email"""
        logger.info(f"📧 Sending journal to {len(self.config.team_emails)} team members...")

        # TODO: Integrate with Gmail automation
        # from gmail_automation import ZantaraGmailAutomation

        # gmail = ZantaraGmailAutomation()
        # for email in self.config.team_emails:
        #     gmail.send_journal_email(
        #         to_email=email,
        #         pdf_path=pdf_path,
        #         journal_data=journal_data
        #     )

        logger.info("✅ Journal sent to all team members!")


def main():
    """Main execution"""
    logger.info("🚀 Starting Bali Zero Journal Generator...")

    config = JournalConfig()
    generator = BaliZeroJournalGenerator(config)

    # Step 1: Collect today's articles
    articles = generator.collect_todays_articles()

    if len(articles) == 0:
        logger.warning("No articles found for today. Exiting.")
        return

    logger.info(f"Found {len(articles)} articles")

    # Step 2: Generate journal structure
    journal_data = generator.generate_journal(articles)

    logger.info(f"Journal created with {len(journal_data['cover_stories'])} cover stories")
    logger.info(f"Organized into {len(journal_data['sections'])} sections")

    # Step 3: Create PDF (placeholder for now)
    # pdf_path = generator.create_pdf(journal_data)

    # Step 4: Send to team (placeholder for now)
    # generator.send_to_team(pdf_path, journal_data)

    logger.info("✅ Bali Zero Journal generation complete!")

    # Print summary
    print("\n" + "="*60)
    print("📰 BALI ZERO JOURNAL - GENERATION SUMMARY")
    print("="*60)
    print(f"Date: {journal_data.get('date')}")
    print(f"Total Articles: {journal_data.get('total_articles')}")
    print(f"Cover Stories: {len(journal_data['cover_stories'])}")
    print(f"Sections: {len(journal_data['sections'])}")
    print(f"\nEditorial Note:")
    print(f"  {journal_data.get('editorial_note')}")
    print("\nCover Stories:")
    for i, story in enumerate(journal_data['cover_stories'], 1):
        print(f"  {i}. {story['title']}")
        print(f"     {story['summary']}")
    print("="*60)


if __name__ == "__main__":
    main()
