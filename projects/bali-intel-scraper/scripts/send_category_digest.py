#!/usr/bin/env python3
"""
Category Digest Email Sender
Sends 1 email per category with ALL articles grouped together.
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from collections import defaultdict

# Import category mappings
sys.path.insert(0, str(Path(__file__).parent))
from send_intel_email import REGULAR_CATEGORIES, LLAMA_CATEGORIES, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS


def create_category_digest_email(category_key, articles, is_llama=False):
    """
    Create email body with ALL articles for a category.

    Args:
        category_key: Category identifier
        articles: List of article file paths
        is_llama: Whether this is a LLAMA category
    """

    if is_llama:
        category = LLAMA_CATEGORIES[category_key]
        recipient = category['recipient']

        body = f"""Ciao Antonio,

LLAMA Intel Digest - {category['name']}
📅 Data: {datetime.now().strftime('%Y-%m-%d')}
📊 Articoli totali: {len(articles)}

---

"""

        for i, article_path in enumerate(articles, 1):
            article_name = Path(article_path).name
            body += f"{i}. {article_name}\n"
            body += f"   📂 {article_path}\n\n"

        body += """---

⚠️  NOTA: Questi articoli sono per uso interno LLAMA.
NON pubblicare sui social media.

LLAMA Intel System
🤖 Generated with AI Research Pipeline
"""

    else:
        category = REGULAR_CATEGORIES[category_key]
        collaborator = category['collaborator']

        body = f"""Ciao {collaborator},

Intel Digest - {category['name']}
📅 Data: {datetime.now().strftime('%Y-%m-%d')}
📊 Articoli totali: {len(articles)}

Sono stati generati {len(articles)} nuovi articoli per la tua categoria.

---

LISTA ARTICOLI:

"""

        for i, article_path in enumerate(articles, 1):
            article_name = Path(article_path).name
            body += f"{i}. {article_name}\n"
            body += f"   📂 {article_path}\n\n"

        body += """---

✅ AZIONI RICHIESTE:
1. Review contenuti
2. Fact-check informazioni
3. Approva/Rigetta/Richiedi modifiche

Rispondi a questa email con feedback o approvazione.

Grazie!
ZANTARA Intel System
"""

    return body


def send_email_with_retry(to_email, subject, body, max_retries=3):
    """Send email via SMTP with retry logic."""

    if not SMTP_USER or not SMTP_PASS:
        print("⚠️  SMTP credentials not configured")
        print(f"   Would send to: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Body length: {len(body)} chars")
        return False

    for attempt in range(max_retries):
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USER
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain', 'utf-8'))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)

            print(f"✅ Email sent to {to_email}")
            return True

        except Exception as e:
            print(f"❌ Attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 2
                print(f"   Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"❌ All retries exhausted for {to_email}")
                return False


def send_category_digest(category_key, articles, dry_run=False):
    """
    Send digest email for a category.

    Args:
        category_key: Category identifier
        articles: List of article paths
        dry_run: If True, don't actually send emails

    Returns:
        bool: True if email sent successfully
    """

    # Determine if LLAMA category
    is_llama = category_key in LLAMA_CATEGORIES

    if is_llama:
        category = LLAMA_CATEGORIES[category_key]
        to_email = category['email']
        subject = f"🤖 LLAMA Intel Digest - {category['name']} - {datetime.now().strftime('%Y%m%d')}"
    else:
        category = REGULAR_CATEGORIES[category_key]
        to_email = category['email']
        subject = f"🔥 Intel Digest - {category['name']} - {datetime.now().strftime('%Y%m%d')} ({len(articles)} articoli)"

    # Create email body
    body = create_category_digest_email(category_key, articles, is_llama)

    # Log
    if is_llama:
        print(f"\n🤖 LLAMA Category: {category['name']}")
    else:
        print(f"\n📧 Category: {category['name']}")
        print(f"   Collaborator: {category['collaborator']}")

    print(f"   Email: {to_email}")
    print(f"   Articles: {len(articles)}")

    if dry_run:
        print(f"   [DRY RUN] Would send digest email")
        return True

    # Send email
    return send_email_with_retry(to_email, subject, body)


if __name__ == "__main__":
    # Test mode
    if len(sys.argv) < 3:
        print("Usage: send_category_digest.py <category_key> <article1.md> [article2.md] ...")
        print("\nExample:")
        print("  python3 send_category_digest.py immigration article1.md article2.md article3.md")
        sys.exit(1)

    category_key = sys.argv[1]
    articles = sys.argv[2:]

    print("=" * 70)
    print("📧 Category Digest Email Sender")
    print("=" * 70)

    success = send_category_digest(category_key, articles, dry_run=False)

    print("\n" + "=" * 70)
    if success:
        print("✅ Digest email sent!")
    else:
        print("❌ Digest email failed")
    print("=" * 70)

    sys.exit(0 if success else 1)
