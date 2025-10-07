#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 4: Multi-Channel Publisher
Publishes approved content to all channels
Cost: $0-5/month (mostly free API tiers)
"""

import json
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import logging
import time
import hashlib

# Optional imports (install as needed)
try:
    import tweepy
except ImportError:
    print("Note: Install tweepy for Twitter support: pip install tweepy")
    tweepy = None

try:
    import telegram
except ImportError:
    print("Note: Install python-telegram-bot for Telegram: pip install python-telegram-bot")
    telegram = None

try:
    import requests
except ImportError:
    os.system("pip install requests")
    import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Directories
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"
WEBAPP_DIR = Path(__file__).parent.parent.parent / "zantara_webapp"

class MultiChannelPublisher:
    """Publish to all channels"""

    def __init__(self):
        self.base_dir = BASE_DIR
        self.webapp_dir = WEBAPP_DIR
        self.published_cache = self.load_published_cache()

    def load_published_cache(self) -> set:
        """Load cache of already published content"""
        cache_file = self.base_dir / "published_cache.json"
        if cache_file.exists():
            with open(cache_file, 'r') as f:
                return set(json.load(f))
        return set()

    def save_published_cache(self):
        """Save published cache"""
        cache_file = self.base_dir / "published_cache.json"
        with open(cache_file, 'w') as f:
            json.dump(list(self.published_cache), f)

    def get_content_id(self, editorial: Dict) -> str:
        """Generate unique ID for content"""
        title = editorial['original_article']['title']
        date = editorial['processed_at'][:10]
        return hashlib.md5(f"{title}{date}".encode()).hexdigest()[:12]

    def publish_to_blog(self, editorial: Dict) -> bool:
        """Publish to GitHub Pages blog"""
        try:
            blog_data = editorial['channels'].get('blog', {})
            if not blog_data:
                logger.warning("No blog data found")
                return False

            # Prepare blog post
            title = blog_data.get('title', editorial['original_article']['title'])
            content = blog_data.get('full_content', editorial['polished_content'])
            category = editorial['original_article']['category']
            tags = blog_data.get('tags', [])
            meta_description = blog_data.get('meta_description', '')

            # Create Jekyll-compatible post
            date_str = datetime.now().strftime('%Y-%m-%d')
            slug = self.slugify(title)
            filename = f"{date_str}-{slug}.md"

            # Blog directory (create if doesn't exist)
            if not self.webapp_dir.exists():
                self.webapp_dir = self.base_dir / "blog"
                self.webapp_dir.mkdir(exist_ok=True)

            blog_posts_dir = self.webapp_dir / "_posts"
            blog_posts_dir.mkdir(parents=True, exist_ok=True)

            # Create post content
            post_content = f"""---
layout: post
title: "{title}"
date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} +0000
categories: {category}
tags: {' '.join(tags)}
description: "{meta_description}"
author: ZANTARA Intelligence
featured: true
---

{content}

---

*This article was automatically generated and reviewed by ZANTARA Intelligence System.*
*Source: {editorial['original_article']['source_name']}*
"""

            # Save post
            post_file = blog_posts_dir / filename
            with open(post_file, 'w', encoding='utf-8') as f:
                f.write(post_content)

            logger.info(f"Blog post created: {filename}")

            # Git commit and push (if in git repo)
            self.git_push(f"New post: {title}")

            return True

        except Exception as e:
            logger.error(f"Error publishing to blog: {e}")
            return False

    def publish_to_instagram(self, editorial: Dict) -> bool:
        """Publish to Instagram (requires Business Account + Graph API)"""
        try:
            instagram_data = editorial['channels'].get('instagram', {})
            if not instagram_data:
                return False

            # Instagram requires manual setup or paid services
            # This is a placeholder for the API integration
            logger.info("Instagram publishing requires Graph API setup")

            # Save content for manual posting
            instagram_dir = self.base_dir / "instagram_queue"
            instagram_dir.mkdir(exist_ok=True)

            content_id = self.get_content_id(editorial)
            instagram_file = instagram_dir / f"{datetime.now().strftime('%Y%m%d')}_{content_id}.json"

            with open(instagram_file, 'w') as f:
                json.dump({
                    'carousel': instagram_data.get('carousel', []),
                    'caption': instagram_data.get('caption', ''),
                    'hashtags': instagram_data.get('hashtags', []),
                    'created_at': datetime.now().isoformat()
                }, f, indent=2)

            logger.info(f"Instagram content queued: {instagram_file.name}")
            return True

        except Exception as e:
            logger.error(f"Error preparing Instagram content: {e}")
            return False

    def publish_to_facebook(self, editorial: Dict) -> bool:
        """Publish to Facebook Page"""
        try:
            facebook_data = editorial['channels'].get('facebook', {})
            if not facebook_data:
                return False

            page_access_token = os.environ.get('FACEBOOK_PAGE_ACCESS_TOKEN')
            page_id = os.environ.get('FACEBOOK_PAGE_ID')

            if not page_access_token or not page_id:
                logger.warning("Facebook credentials not configured")
                # Save for manual posting
                self.save_for_manual_posting('facebook', editorial)
                return False

            # Post to Facebook
            url = f"https://graph.facebook.com/v18.0/{page_id}/feed"

            post_data = {
                'message': facebook_data.get('post_text', ''),
                'link': facebook_data.get('article_url', ''),
                'access_token': page_access_token
            }

            response = requests.post(url, data=post_data)

            if response.status_code == 200:
                logger.info(f"Published to Facebook: {response.json()}")
                return True
            else:
                logger.error(f"Facebook API error: {response.text}")
                return False

        except Exception as e:
            logger.error(f"Error publishing to Facebook: {e}")
            return False

    def publish_to_twitter(self, editorial: Dict) -> bool:
        """Publish thread to X/Twitter"""
        try:
            twitter_data = editorial['channels'].get('twitter', {})
            if not twitter_data and 'x' in editorial['channels']:
                twitter_data = editorial['channels']['x']

            if not twitter_data:
                return False

            if not tweepy:
                logger.warning("Tweepy not installed")
                self.save_for_manual_posting('twitter', editorial)
                return False

            # Twitter API credentials
            bearer_token = os.environ.get('TWITTER_BEARER_TOKEN')
            consumer_key = os.environ.get('TWITTER_API_KEY')
            consumer_secret = os.environ.get('TWITTER_API_SECRET')
            access_token = os.environ.get('TWITTER_ACCESS_TOKEN')
            access_token_secret = os.environ.get('TWITTER_ACCESS_SECRET')

            if not all([consumer_key, consumer_secret, access_token, access_token_secret]):
                logger.warning("Twitter credentials not configured")
                self.save_for_manual_posting('twitter', editorial)
                return False

            # Initialize Twitter client
            client = tweepy.Client(
                bearer_token=bearer_token,
                consumer_key=consumer_key,
                consumer_secret=consumer_secret,
                access_token=access_token,
                access_token_secret=access_token_secret
            )

            # Post thread
            thread = twitter_data.get('thread', [])
            previous_tweet_id = None

            for i, tweet_text in enumerate(thread):
                response = client.create_tweet(
                    text=tweet_text,
                    in_reply_to_tweet_id=previous_tweet_id
                )
                previous_tweet_id = response.data['id']
                logger.info(f"Posted tweet {i+1}/{len(thread)}")
                time.sleep(2)  # Rate limiting

            return True

        except Exception as e:
            logger.error(f"Error publishing to Twitter: {e}")
            return False

    def publish_to_whatsapp(self, editorial: Dict) -> bool:
        """Send to WhatsApp (via Twilio or save for manual)"""
        try:
            whatsapp_data = editorial['channels'].get('whatsapp', {})
            if not whatsapp_data:
                return False

            # For now, save for manual broadcast
            whatsapp_dir = self.base_dir / "whatsapp_queue"
            whatsapp_dir.mkdir(exist_ok=True)

            content_id = self.get_content_id(editorial)
            whatsapp_file = whatsapp_dir / f"{datetime.now().strftime('%Y%m%d')}_{content_id}.txt"

            with open(whatsapp_file, 'w', encoding='utf-8') as f:
                f.write(whatsapp_data.get('broadcast_message', ''))

            logger.info(f"WhatsApp message queued: {whatsapp_file.name}")
            return True

        except Exception as e:
            logger.error(f"Error preparing WhatsApp content: {e}")
            return False

    def publish_to_telegram(self, editorial: Dict) -> bool:
        """Post to Telegram channel"""
        try:
            telegram_data = editorial['channels'].get('telegram', {})
            if not telegram_data:
                return False

            if not telegram:
                logger.warning("python-telegram-bot not installed")
                self.save_for_manual_posting('telegram', editorial)
                return False

            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            channel_id = os.environ.get('TELEGRAM_CHANNEL_ID')

            if not bot_token or not channel_id:
                logger.warning("Telegram credentials not configured")
                self.save_for_manual_posting('telegram', editorial)
                return False

            # Initialize bot
            bot = telegram.Bot(token=bot_token)

            # Send message
            message = telegram_data.get('message', '')
            bot.send_message(
                chat_id=channel_id,
                text=message,
                parse_mode='Markdown',
                disable_web_page_preview=False
            )

            logger.info("Published to Telegram")
            return True

        except Exception as e:
            logger.error(f"Error publishing to Telegram: {e}")
            return False

    def save_for_manual_posting(self, platform: str, editorial: Dict):
        """Save content for manual posting when API not available"""
        manual_dir = self.base_dir / "manual_posting" / platform
        manual_dir.mkdir(parents=True, exist_ok=True)

        content_id = self.get_content_id(editorial)
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M')}_{content_id}.json"

        with open(manual_dir / filename, 'w', encoding='utf-8') as f:
            json.dump({
                'title': editorial['original_article']['title'],
                'content': editorial['channels'].get(platform, {}),
                'created_at': datetime.now().isoformat()
            }, f, indent=2)

        logger.info(f"Content saved for manual {platform} posting: {filename}")

    def slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug"""
        import re
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s-]', '', text)
        text = re.sub(r'[\s-]+', '-', text)
        return text[:50].strip('-')

    def git_push(self, commit_message: str):
        """Git commit and push changes"""
        try:
            subprocess.run(['git', 'add', '.'], cwd=self.webapp_dir, check=False)
            subprocess.run(['git', 'commit', '-m', commit_message], cwd=self.webapp_dir, check=False)
            subprocess.run(['git', 'push'], cwd=self.webapp_dir, check=False)
            logger.info(f"Git pushed: {commit_message}")
        except Exception as e:
            logger.warning(f"Git operations not available: {e}")

    def publish_content(self, editorial_file: Path) -> Dict[str, bool]:
        """Publish single piece of content to all channels"""

        # Load editorial content
        with open(editorial_file, 'r') as f:
            editorial = json.load(f)

        # Check if already published
        content_id = self.get_content_id(editorial)
        if content_id in self.published_cache:
            logger.info(f"Already published: {editorial['original_article']['title'][:50]}")
            return {}

        logger.info(f"Publishing: {editorial['original_article']['title'][:50]}...")

        results = {}

        # Publish to each channel
        if 'blog' in editorial['channels']:
            results['blog'] = self.publish_to_blog(editorial)

        if 'instagram' in editorial['channels']:
            results['instagram'] = self.publish_to_instagram(editorial)

        if 'facebook' in editorial['channels']:
            results['facebook'] = self.publish_to_facebook(editorial)

        if 'twitter' in editorial['channels'] or 'x' in editorial['channels']:
            results['twitter'] = self.publish_to_twitter(editorial)

        if 'whatsapp' in editorial['channels']:
            results['whatsapp'] = self.publish_to_whatsapp(editorial)

        if 'telegram' in editorial['channels']:
            results['telegram'] = self.publish_to_telegram(editorial)

        # Mark as published
        self.published_cache.add(content_id)
        self.save_published_cache()

        return results

    def publish_all_approved(self):
        """Publish all approved content"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 4: MULTI-CHANNEL PUBLISHING")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        # Load publication schedule
        schedule_files = list(self.base_dir.glob("publication_schedule_*.json"))
        if not schedule_files:
            logger.warning("No publication schedule found. Run editorial_ai.py first.")
            return

        # Use most recent schedule
        schedule_file = sorted(schedule_files)[-1]
        with open(schedule_file, 'r') as f:
            schedule = json.load(f)

        logger.info(f"Loading schedule: {schedule_file.name}")
        logger.info(f"Total approved for publishing: {schedule['total_approved']}")

        # Process each category
        published_count = 0
        categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]

        for category in categories:
            editorial_dir = self.base_dir / category / "editorial"
            if not editorial_dir.exists():
                continue

            # Find approved editorial files
            editorial_files = list(editorial_dir.glob("editorial_*.json"))

            for editorial_file in editorial_files:
                results = self.publish_content(editorial_file)

                if results:
                    published_count += 1
                    logger.info(f"Published to: {', '.join([k for k, v in results.items() if v])}")

                    # Rate limiting between publications
                    time.sleep(5)

        # Generate publishing report
        self.generate_publishing_report(published_count)

        logger.info("=" * 70)
        logger.info(f"PUBLISHING COMPLETE: {published_count} items published")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

    def generate_publishing_report(self, published_count: int):
        """Generate publishing report"""
        report_file = self.base_dir / f"publishing_report_{datetime.now().strftime('%Y%m%d')}.md"

        with open(report_file, 'w') as f:
            f.write(f"# Publishing Report\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Published**: {published_count} items\n\n")

            # Check manual posting queues
            f.write("## Manual Posting Required\n\n")

            manual_dir = self.base_dir / "manual_posting"
            if manual_dir.exists():
                for platform_dir in manual_dir.iterdir():
                    if platform_dir.is_dir():
                        count = len(list(platform_dir.glob("*.json")))
                        if count > 0:
                            f.write(f"- **{platform_dir.name}**: {count} items\n")

            # Check platform-specific queues
            f.write("\n## Platform Queues\n\n")

            instagram_queue = self.base_dir / "instagram_queue"
            if instagram_queue.exists():
                count = len(list(instagram_queue.glob("*.json")))
                f.write(f"- **Instagram**: {count} items queued\n")

            whatsapp_queue = self.base_dir / "whatsapp_queue"
            if whatsapp_queue.exists():
                count = len(list(whatsapp_queue.glob("*.txt")))
                f.write(f"- **WhatsApp**: {count} messages queued\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")


def main():
    """Main entry point"""
    publisher = MultiChannelPublisher()
    publisher.publish_all_approved()


if __name__ == "__main__":
    main()