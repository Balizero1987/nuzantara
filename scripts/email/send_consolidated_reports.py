#!/usr/bin/env python3
"""
Send Consolidated Intelligence Reports via Gmail SMTP
Sends markdown reports to category owners
"""

import os
import sys
import smtplib
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Category owners mapping
CATEGORY_OWNERS = {
    "immigration": "consulting@balizero.com",  # Adit
    "business_bkpm": "dea@balizero.com",
    "real_estate": "krisna@balizero.com",
    "events_culture": "zero@balizero.com",
    "test_category": "zero@balizero.com"  # Test goes to zero
}

SENDER_EMAIL = "zero@balizero.com"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "zero@balizero.com"
SMTP_PASSWORD = "aevy neut cctb lwmt"  # Gmail App Password for ZANTARA
INTEL_DIR = Path("INTEL_SCRAPING")

def init_smtp():
    """Initialize SMTP connection"""
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        return server
    except Exception as e:
        print(f"❌ Failed to connect to SMTP: {e}")
        return None

def create_email(to_email: str, category: str, markdown_content: str) -> MIMEMultipart:
    """Create email message with markdown report"""

    # Convert markdown to basic HTML for email
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }}
            h1 {{ color: #2c3e50; }}
            h2 {{ color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 5px; }}
            .metadata {{ color: #7f8c8d; font-size: 0.9em; }}
            .stats {{ background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            pre {{ background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }}
        </style>
    </head>
    <body>
        <pre style="white-space: pre-wrap; font-family: monospace;">{markdown_content}</pre>
    </body>
    </html>
    """

    message = MIMEMultipart('alternative')
    message['To'] = to_email
    message['From'] = SENDER_EMAIL
    message['Subject'] = f"📊 {category.replace('_', ' ').title()} - Daily Intelligence Report"

    # Add plain text version (markdown)
    text_part = MIMEText(markdown_content, 'plain', 'utf-8')
    message.attach(text_part)

    # Add HTML version
    html_part = MIMEText(html_content, 'html', 'utf-8')
    message.attach(html_part)

    return message

def send_report(smtp_server, category: str, md_file: Path):
    """Send report for a category"""

    owner_email = CATEGORY_OWNERS.get(category)
    if not owner_email:
        print(f"⚠️  No owner configured for {category}, skipping...")
        return False

    if not md_file.exists():
        print(f"⚠️  Report not found: {md_file}")
        return False

    # Read markdown content (truncate if too large for email)
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Truncate if larger than 1MB
    if len(content) > 1_000_000:
        print(f"⚠️  Report too large ({len(content)} bytes), truncating...")
        content = content[:1_000_000] + "\n\n[... Report truncated due to size ...]"

    # Create email message
    message = create_email(owner_email, category, content)

    try:
        smtp_server.send_message(message)
        print(f"✅ Sent {category} report to {owner_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending {category}: {e}")
        return False

def main():
    """Main entry point"""
    print("=" * 70)
    print("SENDING CONSOLIDATED INTELLIGENCE REPORTS VIA SMTP")
    print("=" * 70)

    # Initialize SMTP connection
    smtp_server = init_smtp()
    if not smtp_server:
        print("❌ Failed to initialize SMTP connection")
        sys.exit(1)

    print(f"✅ Connected to SMTP server ({SMTP_HOST})")

    # Find all markdown reports
    reports = list(INTEL_DIR.glob("*/*_articles.md"))
    print(f"\nFound {len(reports)} reports to send\n")

    sent = 0
    failed = 0

    try:
        for report in reports:
            category = report.stem.replace('_articles', '')

            if send_report(smtp_server, category, report):
                sent += 1
            else:
                failed += 1
    finally:
        # Always close SMTP connection
        try:
            smtp_server.quit()
        except:
            pass

    print("\n" + "=" * 70)
    print(f"SUMMARY: {sent} sent, {failed} failed")
    print("=" * 70)

if __name__ == "__main__":
    main()
