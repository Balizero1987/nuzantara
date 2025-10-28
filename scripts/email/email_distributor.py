#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 4: Email Distributor
Sends generated articles to collaborators via email
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Directories
ARTICLES_DIR = Path(__file__).parent.parent / "INTEL_ARTICLES"

# Email configuration (from environment variables)
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER)

# Collaborators list
COLLABORATORS = [
    {
        'name': 'Intel Team',
        'email': os.getenv('COLLABORATOR_EMAIL_1', 'team@example.com'),
        'categories': 'all'  # Can filter by categories
    }
]

class EmailDistributor:
    """Distribute articles via email"""

    def __init__(self):
        self.articles_dir = ARTICLES_DIR
        self.smtp_configured = bool(SMTP_USER and SMTP_PASSWORD)

        if not self.smtp_configured:
            logger.warning("SMTP not configured - will generate email previews only")
            logger.info("To enable email: set SMTP_USER and SMTP_PASSWORD environment variables")

    def load_articles(self) -> List[Dict]:
        """Load all generated articles"""
        articles = []
        index_file = self.articles_dir / "INDEX.md"

        if not index_file.exists():
            logger.error("No INDEX.md found - run article generation first")
            return []

        # Parse index file to get article list
        with open(index_file, 'r') as f:
            content = f.read()

        # Extract article files from index
        import re
        pattern = r'\[(\d+_\w+\.md)\]'
        matches = re.findall(pattern, content)

        for match in matches:
            article_file = self.articles_dir / match
            json_file = article_file.with_suffix('.json')

            if article_file.exists() and json_file.exists():
                with open(json_file, 'r') as f:
                    metadata = json.load(f)

                with open(article_file, 'r') as f:
                    article_content = f.read()

                articles.append({
                    'metadata': metadata,
                    'content': article_content,
                    'file': match
                })

        logger.info(f"Loaded {len(articles)} articles")
        return articles

    def create_email_body(self, articles: List[Dict]) -> str:
        """Create email body with article summaries"""

        body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        .article {{ background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #3498db; }}
        .category {{ color: #7f8c8d; font-size: 0.9em; text-transform: uppercase; }}
        .stats {{ background: #ecf0f1; padding: 10px; margin: 10px 0; border-radius: 5px; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #bdc3c7; color: #7f8c8d; font-size: 0.9em; }}
        a {{ color: #3498db; text-decoration: none; }}
    </style>
</head>
<body>
    <h1>📊 Intel Automation Report</h1>

    <div class="stats">
        <strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
        <strong>Total Articles:</strong> {len(articles)}<br>
        <strong>Categories Covered:</strong> {len(set(a['metadata']['category'] for a in articles))}
    </div>

    <h2>📝 New Articles for Review</h2>

    <p>The following intel articles have been generated and are ready for your review:</p>
"""

        # Sort articles by category
        sorted_articles = sorted(articles, key=lambda x: x['metadata']['category'])

        for article in sorted_articles:
            meta = article['metadata']
            category = meta['category'].replace('_', ' ').title()

            # Extract first few lines as preview
            content_lines = article['content'].split('\n')
            preview_lines = [l for l in content_lines[:10] if l.strip()]
            preview = '\n'.join(preview_lines[:3])

            body += f"""
    <div class="article">
        <div class="category">{category}</div>
        <h3>{meta.get('file', 'Article')}</h3>
        <p><strong>Words:</strong> {meta.get('word_count', 'N/A')} |
           <strong>Generated:</strong> {meta.get('generated_at', 'N/A')}</p>
        <p><em>Preview:</em></p>
        <pre style="background: white; padding: 10px; overflow-x: auto;">{preview[:200]}...</pre>
    </div>
"""

        body += """
    <h2>📎 Access Articles</h2>
    <p>All articles are available in the <code>INTEL_ARTICLES/</code> directory. Please review and provide feedback.</p>

    <h2>✅ Next Steps</h2>
    <ol>
        <li>Review articles for accuracy and completeness</li>
        <li>Suggest edits or additional sources</li>
        <li>Approve for publication or request revisions</li>
    </ol>

    <div class="footer">
        <p><strong>NUZANTARA Intel Automation System</strong><br>
        Powered by Ollama (llama3.2:3b) + ChromaDB<br>
        🤖 Automated intel processing for expats and foreign businesses in Indonesia</p>
    </div>
</body>
</html>
"""
        return body

    def send_email(self, recipient: Dict, articles: List[Dict]):
        """Send email to recipient"""

        subject = f"📊 Intel Report - {len(articles)} New Articles - {datetime.now().strftime('%Y-%m-%d')}"
        body = self.create_email_body(articles)

        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = recipient['email']

        # Attach HTML body
        html_part = MIMEText(body, 'html')
        msg.attach(html_part)

        if not self.smtp_configured:
            # Save email preview to file
            preview_file = self.articles_dir / f"EMAIL_PREVIEW_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            with open(preview_file, 'w') as f:
                f.write(body)
            logger.info(f"✓ Email preview saved: {preview_file.name}")
            return

        # Send email via SMTP
        try:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()

            logger.info(f"✓ Email sent to {recipient['name']} ({recipient['email']})")

        except Exception as e:
            logger.error(f"✗ Failed to send email to {recipient['email']}: {e}")

    def distribute_all(self):
        """Distribute articles to all collaborators"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 4: EMAIL DISTRIBUTION")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        # Load articles
        articles = self.load_articles()

        if not articles:
            logger.error("No articles found - run article generation first")
            return

        # Distribute to collaborators
        for collaborator in COLLABORATORS:
            logger.info(f"\n📧 Sending to {collaborator['name']} ({collaborator['email']})...")
            self.send_email(collaborator, articles)

        logger.info("=" * 70)
        logger.info(f"EMAIL DISTRIBUTION COMPLETE - Sent to {len(COLLABORATORS)} recipients")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)


def main():
    """Main entry point"""
    distributor = EmailDistributor()
    distributor.distribute_all()


if __name__ == "__main__":
    main()
