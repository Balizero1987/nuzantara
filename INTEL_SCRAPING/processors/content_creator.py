#!/usr/bin/env python3
"""
Content Creator - Swiss-Watch Edition

Creates final intelligence articles from raw scraped content using Claude API.
Optionally sends articles via email to collaborators.

Features:
- Claude API integration for article generation
- Structured intelligence report format
- Fallback formatting when API unavailable
- Email integration (optional)
- Batch processing with parallelization
- Statistics tracking
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor

from INTEL_SCRAPING.core.models import Article
from INTEL_SCRAPING.config.settings import settings

logger = logging.getLogger(__name__)


class ContentCreator:
    """
    Content Creator for generating intelligence articles.

    Workflow:
    1. Read raw articles (Article objects)
    2. Generate structured articles using Claude API
    3. Save articles to disk
    4. Optionally send via email
    5. Track statistics
    """

    def __init__(
        self,
        anthropic_api_key: Optional[str] = None,
        output_dir: Optional[Path] = None,
        max_workers: int = 3,
        send_emails: bool = False
    ):
        """
        Initialize content creator.

        Args:
            anthropic_api_key: Anthropic API key (defaults to settings)
            output_dir: Output directory for articles
            max_workers: Max parallel workers for API calls
            send_emails: Whether to send emails (requires email integration)
        """
        self.anthropic_api_key = anthropic_api_key or settings.content.anthropic_api_key
        self.output_dir = output_dir or Path(settings.output.data_dir) / "articles"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.max_workers = max_workers
        self.send_emails = send_emails

        # Claude client
        self.claude_client = None
        if self.anthropic_api_key:
            try:
                import anthropic
                self.claude_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
                logger.info("✅ Claude API client initialized")
            except ImportError:
                logger.warning("⚠️  anthropic package not installed, using fallback")
            except Exception as e:
                logger.warning(f"⚠️  Claude API client initialization failed: {e}")

        # Statistics
        self.stats = {
            'total_articles': 0,
            'created': 0,
            'failed': 0,
            'emails_sent': 0,
            'claude_api_calls': 0,
            'fallback_used': 0,
            'errors': []
        }

    def generate_article_with_claude(self, article: Article) -> Optional[str]:
        """
        Generate structured article using Claude API.

        Args:
            article: Article object with raw content

        Returns:
            Formatted article markdown or None on failure
        """
        if not self.claude_client:
            logger.debug("Claude client not available, using fallback")
            return self._fallback_article_format(article)

        try:
            prompt = f"""You are a professional intelligence analyst for Bali/Indonesia business news.

Transform this raw scraped content into a professional, structured intelligence report.

**Category**: {article.category}
**Source**: {article.source} ({article.tier.value})
**Published**: {article.published_date.strftime('%Y-%m-%d')}
**URL**: {article.url}

**Raw Content**:
{article.content[:3000]}

Create a well-structured article with:
1. **Clear title** (catchy but professional)
2. **Executive summary** (2-3 sentences highlighting key points)
3. **Key findings** (3-5 bullet points of most important info)
4. **Detailed analysis** (structured paragraphs with context)
5. **Action items** (if applicable - what readers should do)
6. **Relevant stakeholders** (who should care about this)

Format in clean markdown. Be concise and professional.
Focus on actionable intelligence, not just news reporting.
"""

            message = self.claude_client.messages.create(
                model=settings.content.claude_model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            article_content = message.content[0].text
            self.stats['claude_api_calls'] += 1

            # Format final article
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

            final_article = f"""---
**Generated**: {timestamp}
**Category**: {article.category}
**Source**: {article.source} ({article.tier.value})
**Published**: {article.published_date.strftime('%Y-%m-%d')}
**URL**: {article.url}
**Model**: {settings.content.claude_model}
---

{article_content}

---

**Original Metadata**:
- Word Count: {article.word_count}
- Quality Score: {article.quality_score:.3f}
- Scraped: {article.scraped_at.strftime('%Y-%m-%d %H:%M')}

*Generated by ZANTARA Intel System*
"""
            return final_article

        except Exception as e:
            logger.error(f"Claude API failed for article {article.id}: {e}")
            self.stats['fallback_used'] += 1
            return self._fallback_article_format(article)

    def _fallback_article_format(self, article: Article) -> str:
        """
        Fallback formatting when Claude API unavailable.

        Args:
            article: Article object

        Returns:
            Formatted article markdown
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        formatted_article = f"""# Intel Report: {article.title}

**Generated**: {timestamp}
**Category**: {article.category}
**Source**: {article.source} ({article.tier.value})
**Published**: {article.published_date.strftime('%Y-%m-%d')}
**URL**: {article.url}

---

## Executive Summary

{article.content[:500]}...

---

## Full Content

{article.content}

---

**Metadata**:
- Word Count: {article.word_count}
- Quality Score: {article.quality_score:.3f}
- Scraped: {article.scraped_at.strftime('%Y-%m-%d %H:%M')}

*Generated by ZANTARA Intel System (Fallback Mode)*
"""
        self.stats['fallback_used'] += 1
        return formatted_article

    def create_article(self, article: Article) -> Tuple[bool, Optional[Path]]:
        """
        Create final article from raw content.

        Args:
            article: Article object

        Returns:
            Tuple of (success, article_path)
        """
        try:
            # Generate article content
            article_content = self.generate_article_with_claude(article)

            if not article_content:
                logger.warning(f"No article generated for: {article.title[:50]}...")
                self.stats['failed'] += 1
                return False, None

            # Save article
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            article_filename = f"{timestamp}_{article.category}_{article.id[:8]}.md"

            category_dir = self.output_dir / article.category
            category_dir.mkdir(parents=True, exist_ok=True)

            article_path = category_dir / article_filename

            with open(article_path, 'w', encoding='utf-8') as f:
                f.write(article_content)

            self.stats['created'] += 1
            logger.info(f"  ✅ Article: {article.category}/{article_filename}")

            # Send email (if enabled)
            if self.send_emails:
                email_sent = self._send_email(article, article_path)
                if email_sent:
                    self.stats['emails_sent'] += 1

            return True, article_path

        except Exception as e:
            logger.error(f"Article creation failed for {article.id}: {e}")
            self.stats['failed'] += 1
            self.stats['errors'].append({
                'article_id': article.id,
                'error': str(e)[:200]
            })
            return False, None

    def _send_email(self, article: Article, article_path: Path) -> bool:
        """
        Send article via email to collaborator.

        Args:
            article: Article object
            article_path: Path to saved article

        Returns:
            True if sent, False otherwise
        """
        try:
            # TODO: Integrate with email system
            # For now, just log
            logger.info(f"  📧 Email would be sent for: {article.category}")
            return True

        except Exception as e:
            logger.error(f"Email failed for {article.category}: {e}")
            return False

    async def create_articles_async(self, articles: List[Article]) -> Dict[str, Any]:
        """
        Create articles in parallel (async with ThreadPoolExecutor).

        Args:
            articles: List of Article objects

        Returns:
            Statistics dictionary
        """
        self.stats['total_articles'] = len(articles)

        logger.info(f"✍️  Content Creator: Creating {len(articles)} articles...")

        if not articles:
            logger.warning("No articles to create")
            return self.stats

        # Use ThreadPoolExecutor for API calls
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            loop = asyncio.get_event_loop()
            tasks = [
                loop.run_in_executor(executor, self.create_article, article)
                for article in articles
            ]
            await asyncio.gather(*tasks)

        logger.info(f"✅ Content creation complete: {self.stats['created']}/{self.stats['total_articles']} created")
        logger.info(f"   Claude API calls: {self.stats['claude_api_calls']}")
        logger.info(f"   Fallback used: {self.stats['fallback_used']}")
        logger.info(f"   Emails sent: {self.stats['emails_sent']}")
        logger.info(f"   Failed: {self.stats['failed']}")

        return self.stats

    def get_stats(self) -> Dict[str, Any]:
        """Get creation statistics"""
        return self.stats.copy()

    def reset_stats(self):
        """Reset statistics"""
        self.stats = {
            'total_articles': 0,
            'created': 0,
            'failed': 0,
            'emails_sent': 0,
            'claude_api_calls': 0,
            'fallback_used': 0,
            'errors': []
        }


if __name__ == "__main__":
    # Test content creator
    from datetime import datetime, timedelta

    print("=" * 60)
    print("Testing Content Creator")
    print("=" * 60)

    # Create test articles
    test_articles = [
        Article(
            url="https://example.com/article1",
            title="Major Immigration Policy Changes Announced",
            content="""The Indonesian government announced significant changes to visa regulations today.

Key changes include:
- Extended stay periods for business visas
- Simplified application process
- New digital visa system

These changes will affect thousands of foreign workers and investors in Bali and Indonesia.
The new regulations take effect next month.""" * 10,
            published_date=datetime.now() - timedelta(hours=2),
            source="Government News",
            category="visa_immigration",
            word_count=800
        ),
    ]

    print(f"\n📝 Test Articles: {len(test_articles)}")
    for article in test_articles:
        print(f"   - {article.title}")

    # Create content creator (fallback mode - no API key)
    creator = ContentCreator(
        anthropic_api_key=None,  # Test fallback
        send_emails=False
    )

    print(f"\n🔧 Configuration:")
    print(f"   Claude Client: {'Available' if creator.claude_client else 'Fallback Mode'}")
    print(f"   Output Dir: {creator.output_dir}")
    print(f"   Max Workers: {creator.max_workers}")
    print(f"   Send Emails: {creator.send_emails}")

    # Test creation
    print(f"\n🚀 Starting content creation...")
    try:
        stats = asyncio.run(creator.create_articles_async(test_articles))

        print(f"\n✅ Results:")
        print(f"   Total: {stats['total_articles']}")
        print(f"   Created: {stats['created']}")
        print(f"   Failed: {stats['failed']}")
        print(f"   Claude API calls: {stats['claude_api_calls']}")
        print(f"   Fallback used: {stats['fallback_used']}")

        if stats['created'] > 0:
            print(f"\n📁 Check output:")
            print(f"   {creator.output_dir}")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")

    print("=" * 60)
