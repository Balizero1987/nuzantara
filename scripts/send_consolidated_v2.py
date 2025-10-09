#!/usr/bin/env python3
"""
Send Consolidated V2 Intelligence Reports
ONE email per collaborator with ALL 14 categories
Uses Gmail API (not SMTP) via service account
"""

import os
import sys
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import team emails from scraper
sys.path.insert(0, str(Path(__file__).parent))
from crawl4ai_scraper import ALL_TEAM_EMAILS

# Gmail API imports
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    GMAIL_API_AVAILABLE = True
except ImportError:
    logger.error("Gmail API not available. Install: pip install google-api-python-client google-auth")
    GMAIL_API_AVAILABLE = False
    sys.exit(1)

SENDER_EMAIL = "zero@balizero.com"
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "sa-key.json")
INTEL_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

# V2 Categories
V2_CATEGORIES = [
    "regulatory_changes",
    "visa_immigration",
    "tax_compliance",
    "business_setup",
    "property_law",
    "banking_finance",
    "employment_law",
    "cost_of_living",
    "bali_lifestyle",
    "events_networking",
    "health_safety",
    "transport_connectivity",
    "competitor_intel",
    "macro_policy",
]

def init_gmail_service():
    """Initialize Gmail API service with service account"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/gmail.send']
        )

        # Impersonate sender email
        delegated_credentials = credentials.with_subject(SENDER_EMAIL)

        service = build('gmail', 'v1', credentials=delegated_credentials)
        logger.info(f"✅ Gmail API initialized - sending as {SENDER_EMAIL}")
        return service

    except Exception as e:
        logger.error(f"❌ Failed to initialize Gmail API: {e}")
        return None

def collect_all_articles():
    """Collect all articles from all V2 categories"""
    all_articles = {}

    for category in V2_CATEGORIES:
        category_dir = INTEL_DIR / category / "articles_md"

        if not category_dir.exists():
            logger.warning(f"⚠️  Category directory not found: {category_dir}")
            all_articles[category] = []
            continue

        # Get all markdown files
        articles = []
        for md_file in sorted(category_dir.glob("*.md")):
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Extract title from first line
                lines = content.split('\n')
                title = lines[0].replace('#', '').strip() if lines else md_file.stem

                articles.append({
                    'title': title,
                    'content': content,
                    'file': md_file.name
                })
            except Exception as e:
                logger.error(f"Error reading {md_file}: {e}")

        all_articles[category] = articles
        logger.info(f"📄 {category}: {len(articles)} articles")

    return all_articles

def create_consolidated_email(recipient_email: str, all_articles: dict, recipient_name: str = None) -> MIMEMultipart:
    """Create ONE email with ALL categories for a recipient"""

    # Count total articles
    total_articles = sum(len(articles) for articles in all_articles.values())

    # Build markdown report
    markdown_content = f"""# 📊 Bali Zero Intelligence Report
**Date**: {datetime.now().strftime('%Y-%m-%d')}
**Recipient**: {recipient_name or recipient_email}
**Total Articles**: {total_articles} across {len(V2_CATEGORIES)} categories

---

"""

    # Add each category section
    for category in V2_CATEGORIES:
        articles = all_articles.get(category, [])
        category_name = category.replace('_', ' ').title()

        markdown_content += f"\n## 📁 {category_name}\n"
        markdown_content += f"**Articles**: {len(articles)}\n\n"

        if not articles:
            markdown_content += "*No new articles in this category*\n\n"
            continue

        # Add article summaries
        for i, article in enumerate(articles, 1):
            markdown_content += f"### {i}. {article['title']}\n"
            markdown_content += f"*Source: {article['file']}*\n\n"

            # Add first 500 chars of content as preview
            content_preview = article['content'][:500].strip()
            markdown_content += f"{content_preview}...\n\n"
            markdown_content += "---\n\n"

    # Add footer
    markdown_content += f"""
---

## 📬 About This Report

This is a **consolidated intelligence report** from Bali Zero's automated scraping system.

**Categories Tracked**:
- 3 CRITICAL: Regulatory Changes, Visa/Immigration, Tax Compliance
- 2 HIGH: Business Setup, Property Law
- 6 MEDIUM: Banking/Finance, Employment Law, Cost of Living, Bali Lifestyle, Events/Networking, Health/Safety
- 3 LOW: Transport, Competitor Intel, Macro Policy

**Questions?** Reply to this email or contact zero@balizero.com

---
*Automated report generated by Bali Zero Intel System V2*
*Scraped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} WITA*
"""

    # Convert to HTML for better email rendering
    html_content = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
            h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
            h2 {{ color: #34495e; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; margin-top: 30px; }}
            h3 {{ color: #555; }}
            .metadata {{ color: #7f8c8d; font-size: 0.95em; margin: 10px 0; }}
            .stats {{
                background: #ecf0f1;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #3498db;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #ecf0f1;
                color: #7f8c8d;
                font-size: 0.9em;
            }}
            hr {{ border: none; border-top: 1px solid #ecf0f1; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <pre style="white-space: pre-wrap; font-family: inherit;">{markdown_content}</pre>
        </div>
    </body>
    </html>
    """

    # Create email
    message = MIMEMultipart('alternative')
    message['To'] = recipient_email
    message['From'] = SENDER_EMAIL
    message['Subject'] = f"📊 Bali Zero Intelligence Report - {datetime.now().strftime('%Y-%m-%d')} ({total_articles} articles)"

    # Add both plain text and HTML versions
    message.attach(MIMEText(markdown_content, 'plain', 'utf-8'))
    message.attach(MIMEText(html_content, 'html', 'utf-8'))

    return message

def send_via_gmail_api(service, message):
    """Send email via Gmail API"""
    try:
        # Encode message
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')

        # Send
        result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()

        return True, result.get('id')

    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False, str(e)

def main():
    """Main execution"""
    logger.info("=" * 70)
    logger.info("BALI ZERO - CONSOLIDATED V2 EMAIL SENDER")
    logger.info("=" * 70)

    # Initialize Gmail service
    service = init_gmail_service()
    if not service:
        logger.error("❌ Cannot initialize Gmail API - aborting")
        return 1

    # Collect all articles
    logger.info("\n📄 Collecting articles from all categories...")
    all_articles = collect_all_articles()

    total_articles = sum(len(articles) for articles in all_articles.values())
    logger.info(f"\n✅ Collected {total_articles} total articles across {len(V2_CATEGORIES)} categories")

    if total_articles == 0:
        logger.warning("⚠️  No articles found - nothing to send")
        return 0

    # Send one email to each collaborator
    logger.info(f"\n📧 Sending to {len(ALL_TEAM_EMAILS)} collaborators...")

    sent_count = 0
    failed_count = 0

    for email in ALL_TEAM_EMAILS:
        recipient_name = email.split('@')[0].title()
        logger.info(f"\n  → Sending to {recipient_name} ({email})...")

        # Create consolidated email
        message = create_consolidated_email(email, all_articles, recipient_name)

        # Send via Gmail API
        success, result = send_via_gmail_api(service, message)

        if success:
            logger.info(f"    ✅ Sent (message ID: {result})")
            sent_count += 1
        else:
            logger.error(f"    ❌ Failed: {result}")
            failed_count += 1

    # Summary
    logger.info("\n" + "=" * 70)
    logger.info(f"✅ Email sending complete!")
    logger.info(f"   Sent: {sent_count}/{len(ALL_TEAM_EMAILS)}")
    logger.info(f"   Failed: {failed_count}")
    logger.info(f"   Total articles: {total_articles}")
    logger.info("=" * 70)

    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
