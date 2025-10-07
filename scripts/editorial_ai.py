#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 3: Editorial AI with Claude Opus 4
Reviews LLAMA articles, polishes prose, and creates multi-channel content
Cost: ~$5-10/month for daily volume
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

try:
    import anthropic
except ImportError:
    print("Installing anthropic...")
    os.system("pip install anthropic")
    import anthropic

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Directories
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

class EditorialAI:
    """Claude Opus 4 for editorial excellence"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found. Please set it in environment or pass directly.")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.base_dir = BASE_DIR
        self.model = "claude-3-opus-20240229"  # Best quality model

    def review_article(self, article: Dict) -> Tuple[bool, Dict]:
        """Review article and decide if it should be published"""

        prompt = f"""You are a world-class editor for a premium expat publication in Bali.
Review this article and provide editorial judgment.

Article Title: {article['title']}
Source Tier: {article['source_tier']} (1=official, 2=accredited, 3=community)
Category: {article['category']}
Impact Level: {article.get('impact_level', 'medium')}
Word Count: {article['word_count']}

Article Content:
{article['content'][:4000]}

Provide your editorial review:

1. QUALITY ASSESSMENT:
   - Writing quality (1-10):
   - Information value (1-10):
   - Relevance to expats/businesses (1-10):
   - Clarity and structure (1-10):
   - Overall rating (1-10):

2. PUBLICATION DECISION:
   - Should publish: yes/no
   - If no, reason:
   - If yes, priority: high/medium/low

3. EDITORIAL NOTES:
   - Key strengths:
   - Areas needing improvement:
   - Fact-checking concerns:
   - Suggested improvements:

4. TARGET CHANNELS:
   Which platforms would this work best on?
   - Blog: yes/no
   - Instagram: yes/no
   - Facebook: yes/no
   - Twitter/X: yes/no
   - WhatsApp: yes/no
   - Telegram: yes/no

Return as JSON format."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,  # Lower temperature for consistent judgment
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse response
            text = response.content[0].text.strip()

            # Clean markdown if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            review = json.loads(text)

            # Determine if should publish
            should_publish = review.get('publication_decision', {}).get('should_publish', 'no').lower() == 'yes'
            overall_rating = review.get('quality_assessment', {}).get('overall_rating', 0)

            # Auto-approve if rating >= 7
            if overall_rating >= 7:
                should_publish = True

            return should_publish, review

        except Exception as e:
            logger.error(f"Error reviewing article: {e}")
            # Default to not publishing if review fails
            return False, {"error": str(e)}

    def polish_article(self, article: Dict) -> str:
        """Polish article to premium quality"""

        prompt = f"""You are a world-class editor polishing an article for publication.
Transform this article into elegant, sophisticated prose while maintaining accuracy.

Original Article:
{article['content']}

Polish this article by:
1. Enhancing the prose quality - make it elegant and sophisticated
2. Improving sentence flow and rhythm
3. Strengthening the lead paragraph to hook readers
4. Adding smooth transitions between sections
5. Ensuring consistent tone throughout
6. Making complex information accessible
7. Adding subtle personality without compromising professionalism
8. Ensuring it speaks directly to expats/businesses in Bali
9. Checking for redundancy and tightening where needed
10. Adding a compelling conclusion if missing

Maintain:
- All factual information
- The overall structure
- The core message
- Appropriate length (800-1200 words ideal)

Style guidelines:
- Sophisticated yet accessible language
- Active voice preferred
- Show don't tell
- Vary sentence length for rhythm
- Use specific examples over generalizations
- Professional but warm tone

Return the polished article in clean markdown format."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.7,  # Higher creativity for polishing
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            polished_content = response.content[0].text.strip()
            return polished_content

        except Exception as e:
            logger.error(f"Error polishing article: {e}")
            return article['content']  # Return original if polishing fails

    def create_multi_channel_content(self, article: Dict, polished_content: str) -> Dict:
        """Create content adapted for each channel"""

        prompt = f"""You are a content strategist creating multi-channel content from this article.

Polished Article:
{polished_content[:3000]}

Create platform-specific content:

BLOG VERSION:
- SEO-optimized title (60 chars max)
- Meta description (155 chars max)
- Feature image suggestion
- Full article (already polished above)
- 3-5 relevant tags
- Internal link suggestions

INSTAGRAM:
- Carousel concept (3-5 slides)
- Slide 1: Hook text (image overlay)
- Slides 2-4: Key points (concise, visual)
- Slide 5: Call-to-action
- Caption (300 chars max, engaging)
- 15 relevant hashtags

FACEBOOK:
- Post text (500 chars, engaging, drives discussion)
- Question to spark comments
- Link preview text
- Best posting time suggestion

X/TWITTER:
- Thread structure (5-7 tweets)
- Tweet 1: Hook (280 chars)
- Tweets 2-6: Key points (280 chars each)
- Tweet 7: Call-to-action with link
- Relevant hashtags (2-3 per tweet)

WHATSAPP:
- Broadcast message (concise, scannable)
- Emoji usage for visual breaks
- Key points in bullet format
- Link to full article

TELEGRAM:
- Rich format message with markdown
- Summary + key points
- Related links/resources
- Discussion starter

Format as JSON with each platform as a key."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=6000,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            text = response.content[0].text.strip()

            # Parse JSON
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            channels = json.loads(text)

            # Add the polished full content to blog
            if 'blog' in channels:
                channels['blog']['full_content'] = polished_content

            return channels

        except Exception as e:
            logger.error(f"Error creating multi-channel content: {e}")
            return {
                "blog": {"full_content": polished_content},
                "error": str(e)
            }

    def process_article(self, article_path: Path) -> Optional[Dict]:
        """Complete editorial process for one article"""

        # Load article
        with open(article_path, 'r', encoding='utf-8') as f:
            article = json.load(f)

        logger.info(f"Reviewing: {article['title'][:50]}...")

        # Step 1: Editorial review
        should_publish, review = self.review_article(article)

        if not should_publish:
            logger.info(f"REJECTED: {article['title'][:50]} - {review.get('publication_decision', {}).get('reason', 'Quality threshold not met')}")
            return None

        logger.info(f"APPROVED: {article['title'][:50]} (Rating: {review.get('quality_assessment', {}).get('overall_rating', 'N/A')})")

        # Step 2: Polish the article
        logger.info("Polishing article...")
        polished_content = self.polish_article(article)

        # Step 3: Create multi-channel content
        logger.info("Creating multi-channel content...")
        channels = self.create_multi_channel_content(article, polished_content)

        # Compile final output
        editorial_output = {
            "original_article": article,
            "editorial_review": review,
            "polished_content": polished_content,
            "channels": channels,
            "processed_at": datetime.now().isoformat(),
            "model_used": self.model,
            "publication_status": "approved",
            "priority": review.get('publication_decision', {}).get('priority', 'medium')
        }

        return editorial_output

    def process_category(self, category: str) -> List[Dict]:
        """Process all articles in a category"""
        articles_dir = self.base_dir / category / "articles"
        editorial_dir = self.base_dir / category / "editorial"
        editorial_dir.mkdir(parents=True, exist_ok=True)

        if not articles_dir.exists():
            logger.warning(f"No articles directory for {category}")
            return []

        approved_articles = []

        # Get all article files
        article_files = list(articles_dir.glob("article_*.json"))
        logger.info(f"Processing {len(article_files)} articles in {category}")

        for article_file in article_files:
            # Check if already processed
            editorial_file = editorial_dir / f"editorial_{article_file.stem}.json"
            if editorial_file.exists():
                logger.info(f"Already processed: {article_file.name}")
                with open(editorial_file, 'r') as f:
                    approved_articles.append(json.load(f))
                continue

            # Process article
            editorial_output = self.process_article(article_file)

            if editorial_output:
                # Save editorial output
                with open(editorial_file, 'w', encoding='utf-8') as f:
                    json.dump(editorial_output, f, ensure_ascii=False, indent=2)

                # Save polished markdown
                polished_md = editorial_dir / f"polished_{article_file.stem}.md"
                with open(polished_md, 'w', encoding='utf-8') as f:
                    f.write(editorial_output['polished_content'])

                approved_articles.append(editorial_output)

        logger.info(f"Approved {len(approved_articles)} articles in {category}")
        return approved_articles

    def generate_publication_schedule(self, all_approved: List[Dict]):
        """Generate publication schedule for approved content"""

        # Sort by priority and impact
        priority_order = {"high": 0, "medium": 1, "low": 2}

        all_approved.sort(key=lambda x: (
            priority_order.get(x.get('priority', 'low'), 2),
            -x.get('editorial_review', {}).get('quality_assessment', {}).get('overall_rating', 0)
        ))

        schedule = {
            "date": datetime.now().strftime('%Y-%m-%d'),
            "total_approved": len(all_approved),
            "publication_order": []
        }

        # Assign publication times (starting at 9 AM)
        hour = 9
        for item in all_approved:
            title = item['original_article']['title']
            category = item['original_article']['category']

            schedule['publication_order'].append({
                "time": f"{hour:02d}:00",
                "title": title,
                "category": category,
                "priority": item.get('priority', 'medium'),
                "channels": list(item.get('channels', {}).keys())
            })

            # Stagger publications every 30 minutes for high priority, hourly for others
            if item.get('priority') == 'high':
                hour += 0.5
            else:
                hour += 1

            if hour >= 18:  # Stop at 6 PM
                break

        return schedule

    def process_all(self):
        """Process all categories through editorial review"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 3: EDITORIAL AI")
        logger.info(f"Model: {self.model}")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        all_approved = []
        categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]

        for category in categories:
            logger.info(f"\nProcessing category: {category}")
            approved = self.process_category(category)
            all_approved.extend(approved)

        # Generate publication schedule
        schedule = self.generate_publication_schedule(all_approved)

        # Save schedule
        schedule_file = self.base_dir / f"publication_schedule_{datetime.now().strftime('%Y%m%d')}.json"
        with open(schedule_file, 'w') as f:
            json.dump(schedule, f, indent=2)

        # Generate editorial summary
        self.generate_editorial_summary(all_approved, schedule)

        logger.info("=" * 70)
        logger.info(f"EDITORIAL COMPLETE: {len(all_approved)} articles approved")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        return all_approved

    def generate_editorial_summary(self, approved: List[Dict], schedule: Dict):
        """Generate editorial summary report"""
        summary_file = self.base_dir / f"editorial_summary_{datetime.now().strftime('%Y%m%d')}.md"

        with open(summary_file, 'w') as f:
            f.write(f"# Editorial Summary - Claude Opus Review\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Model**: {self.model}\n")
            f.write(f"**Total Approved**: {len(approved)}\n\n")

            f.write("## Quality Ratings\n\n")

            # Calculate average ratings
            if approved:
                ratings = []
                for item in approved:
                    rating = item.get('editorial_review', {}).get('quality_assessment', {}).get('overall_rating', 0)
                    if rating:
                        ratings.append(rating)

                if ratings:
                    avg_rating = sum(ratings) / len(ratings)
                    f.write(f"- **Average Rating**: {avg_rating:.1f}/10\n")
                    f.write(f"- **Highest Rating**: {max(ratings)}/10\n")
                    f.write(f"- **Lowest Rating**: {min(ratings)}/10\n\n")

            f.write("## Publication Schedule\n\n")

            for item in schedule['publication_order'][:10]:  # Top 10
                f.write(f"- **{item['time']}**: {item['title'][:60]}...\n")
                f.write(f"  - Priority: {item['priority']}\n")
                f.write(f"  - Channels: {', '.join(item['channels'])}\n\n")

            f.write("## By Category\n\n")

            # Group by category
            by_category = {}
            for item in approved:
                cat = item['original_article']['category']
                if cat not in by_category:
                    by_category[cat] = []
                by_category[cat].append(item)

            for category, items in by_category.items():
                f.write(f"- **{category}**: {len(items)} articles\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")


def main():
    """Main entry point"""
    # Check for API key
    if not os.environ.get("ANTHROPIC_API_KEY"):
        logger.error("Please set ANTHROPIC_API_KEY environment variable")
        logger.info("Get your key at: https://console.anthropic.com")
        return

    editor = EditorialAI()
    approved = editor.process_all()

    # Return approved articles for next stage
    return approved


if __name__ == "__main__":
    main()