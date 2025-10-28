#!/usr/bin/env python3
"""
INTEL AUTOMATION - Email Routing System
Sends articles to category owners based on category configuration
Uses Gmail API with service account impersonation (no SMTP password needed)
"""

import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import category owners from scraper config
import sys
sys.path.append(str(Path(__file__).parent))
from crawl4ai_scraper import CATEGORY_OWNERS, SPECIAL_CATEGORIES

# Gmail API imports
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    GMAIL_API_AVAILABLE = True
except ImportError:
    logger.warning("Gmail API not available. Install: pip install google-api-python-client google-auth")
    GMAIL_API_AVAILABLE = False


class EmailSender:
    """Send articles to category owners via Gmail API"""

    def __init__(self):
        # Email configuration
        self.sender_email = os.getenv("SENDER_EMAIL", "zero@balizero.com")
        self.service_account_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "sa-key.json")

        self.enabled = False
        self.gmail_service = None

        if not GMAIL_API_AVAILABLE:
            logger.warning("Gmail API libraries not installed - email sending disabled")
            return

        try:
            # Create Gmail service with service account impersonation
            credentials = service_account.Credentials.from_service_account_file(
                self.service_account_file,
                scopes=['https://www.googleapis.com/auth/gmail.send']
            )

            # Impersonate the sender email (zero@balizero.com)
            delegated_credentials = credentials.with_subject(self.sender_email)

            self.gmail_service = build('gmail', 'v1', credentials=delegated_credentials)
            self.enabled = True
            logger.info(f"✅ Gmail API initialized - sending as {self.sender_email}")

        except Exception as e:
            logger.error(f"Failed to initialize Gmail API: {e}")
            logger.warning("Email sending disabled - will continue without email")

    def create_article_email(
        self,
        article: Dict,
        category: str,
        is_special: bool = False
    ) -> MIMEMultipart:
        """Create email message for article"""

        msg = MIMEMultipart('alternative')

        # Email metadata
        recipient = CATEGORY_OWNERS.get(category, "zero@balizero.com")
        msg['From'] = self.sender_email
        msg['To'] = recipient

        # Different subject lines for special vs standard categories
        if is_special:
            msg['Subject'] = f"[Intel Alert] {category.replace('_', ' ').title()} - {article['title']}"
        else:
            msg['Subject'] = f"[New Article] {category.replace('_', ' ').title()} - {article['title']}"

        # Create email body
        body = self.format_email_body(article, category, is_special)

        # Attach as HTML
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)

        return msg

    def format_email_body(self, article: Dict, category: str, is_special: bool) -> str:
        """Format article as HTML email"""

        # Get article metadata
        title = article.get('title', 'Untitled')
        content = article.get('content', '')
        source = article.get('source_name', 'Unknown')
        tier = article.get('source_tier', '?')
        created_at = article.get('created_at', datetime.now().isoformat())
        word_count = article.get('word_count', 0)

        # Special vs Standard workflow indicator
        workflow_type = "Intelligence Alert (Email Only)" if is_special else "Content Pipeline (Social Media + Email)"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                }}
                .metadata {{
                    background: #f7f9fc;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    border-left: 4px solid #667eea;
                }}
                .metadata-item {{
                    display: inline-block;
                    margin-right: 20px;
                    margin-bottom: 10px;
                }}
                .metadata-label {{
                    font-weight: 600;
                    color: #667eea;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .content h2 {{
                    color: #667eea;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                }}
                .footer {{
                    margin-top: 40px;
                    padding: 20px;
                    background: #f7f9fc;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    color: #666;
                }}
                .badge {{
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    background: #667eea;
                    color: white;
                }}
                .special-badge {{
                    background: #f59e0b;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{title}</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">{category.replace('_', ' ').title()}</p>
            </div>

            <div class="metadata">
                <div class="metadata-item">
                    <span class="metadata-label">Source:</span> {source} <span class="badge">Tier {tier}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Category:</span> {category.replace('_', ' ').title()}
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Word Count:</span> {word_count}
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Created:</span> {created_at[:10]}
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Workflow:</span>
                    <span class="badge {'special-badge' if is_special else ''}">{workflow_type}</span>
                </div>
            </div>

            <div class="content">
                {self.markdown_to_html(content)}
            </div>

            <div class="footer">
                <p><strong>🤖 Bali Zero Intel Automation System</strong></p>
                <p>Generated with LLAMA 3.2 | Powered by Crawl4AI + ChromaDB</p>
                <p style="font-size: 12px; color: #999;">
                    {'This is an intelligence alert - not published to social media' if is_special else 'This article will be published to social media channels'}
                </p>
            </div>
        </body>
        </html>
        """

        return html

    def markdown_to_html(self, markdown_text: str) -> str:
        """Simple markdown to HTML conversion"""
        # This is a basic converter - for production use a proper library like markdown2

        html = markdown_text

        # Headers
        html = html.replace('### ', '<h3>').replace('\n\n', '</h3>\n\n')
        html = html.replace('## ', '<h2>').replace('\n\n', '</h2>\n\n')
        html = html.replace('# ', '<h1>').replace('\n\n', '</h1>\n\n')

        # Bold
        import re
        html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)

        # Lists
        html = re.sub(r'^• (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
        html = re.sub(r'(<li>.*</li>\n)+', r'<ul>\n\g<0></ul>\n', html)

        # Paragraphs
        html = re.sub(r'\n\n', '</p><p>', html)
        html = '<p>' + html + '</p>'

        return html

    def send_article_email(
        self,
        article: Dict,
        category: str
    ) -> bool:
        """Send article to category owner"""

        if not self.enabled:
            logger.warning("Email sending disabled - skipping")
            return False

        try:
            # Check if special category
            is_special = category in SPECIAL_CATEGORIES

            # Create email
            msg = self.create_article_email(article, category, is_special)
            recipient = CATEGORY_OWNERS.get(category, "zero@balizero.com")

            logger.info(f"Sending article to {recipient} (category: {category})")

            # Send via Gmail API
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            message_body = {'raw': raw_message}

            self.gmail_service.users().messages().send(
                userId='me',
                body=message_body
            ).execute()

            logger.info(f"✅ Email sent successfully to {recipient}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def send_daily_digest(
        self,
        articles_by_category: Dict[str, List[Dict]],
        category: str
    ) -> bool:
        """Send daily digest for a category"""

        if not self.enabled:
            logger.warning("Email sending disabled - skipping digest")
            return False

        articles = articles_by_category.get(category, [])
        if not articles:
            logger.info(f"No articles for {category} digest")
            return False

        try:
            recipient = CATEGORY_OWNERS.get(category, "zero@balizero.com")
            is_special = category in SPECIAL_CATEGORIES

            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender_email
            msg['To'] = recipient
            msg['Subject'] = f"[Daily Digest] {category.replace('_', ' ').title()} - {len(articles)} articles"

            # Create digest body
            body = self.format_digest_body(articles, category, is_special)
            html_part = MIMEText(body, 'html')
            msg.attach(html_part)

            # Send via Gmail API
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            message_body = {'raw': raw_message}

            self.gmail_service.users().messages().send(
                userId='me',
                body=message_body
            ).execute()

            logger.info(f"✅ Digest sent to {recipient} ({len(articles)} articles)")
            return True

        except Exception as e:
            logger.error(f"Failed to send digest: {e}")
            return False

    def format_digest_body(
        self,
        articles: List[Dict],
        category: str,
        is_special: bool
    ) -> str:
        """Format daily digest as HTML"""

        articles_html = ""
        for i, article in enumerate(articles, 1):
            articles_html += f"""
            <div style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h3 style="color: #667eea; margin-top: 0;">{i}. {article.get('title', 'Untitled')}</h3>
                <p style="color: #666; font-size: 14px;">
                    <strong>Source:</strong> {article.get('source_name', 'Unknown')} (Tier {article.get('source_tier', '?')}) |
                    <strong>Words:</strong> {article.get('word_count', 0)}
                </p>
                <p>{article.get('content', '')[:300]}...</p>
            </div>
            """

        workflow_note = "These articles are for intelligence purposes only and will not be published to social media." if is_special else "These articles will be reviewed and published to social media channels."

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    background: #f7f9fc;
                    padding: 20px;
                }}
                .container {{
                    max-width: 800px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Daily Digest: {category.replace('_', ' ').title()}</h1>
                    <p>{datetime.now().strftime('%B %d, %Y')}</p>
                    <p style="font-size: 18px; margin-top: 20px;">{len(articles)} articles generated today</p>
                </div>

                {articles_html}

                <div style="text-align: center; padding: 20px; color: #666;">
                    <p>{workflow_note}</p>
                    <p><strong>🤖 Bali Zero Intel Automation</strong></p>
                </div>
            </div>
        </body>
        </html>
        """

        return html


def main():
    """Test email sending"""
    sender = EmailSender()

    # Test article
    test_article = {
        "title": "Test Article",
        "content": "**Test content** with markdown.\n\n## Section 1\n\nSome text here.\n\n• Point 1\n• Point 2",
        "source_name": "Test Source",
        "source_tier": 2,
        "category": "immigration",
        "created_at": datetime.now().isoformat(),
        "word_count": 50
    }

    # Test sending
    result = sender.send_article_email(test_article, "immigration")
    print(f"Test email result: {result}")


if __name__ == "__main__":
    main()
