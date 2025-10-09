#!/usr/bin/env python3
"""
Send Intel Articles to All Collaborators
"""
import json
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from email.mime.text import MIMEText
import base64

# Service Account
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
SERVICE_ACCOUNT_FILE = 'sa-key-backend.json'
DELEGATED_USER = 'zero@balizero.com'

# Collaborators list - All BaliZero Team
COLLABORATORS = [
    'zero@balizero.com',  # Already sent
    # Leadership
    'zainal@balizero.com',
    'ruslana@balizero.com',
    # Setup Team
    'amanda@balizero.com',
    'anton@balizero.com',
    'vino@balizero.com',
    'krisna@balizero.com',
    'adit@balizero.com',
    'ari@balizero.com',
    'dea@balizero.com',
    'surya@balizero.com',
    'damar@balizero.com',
    'marta@balizero.com',
    # Tax Department
    'veronika@balizero.com',
    'angel@balizero.com',
    'kadek@balizero.com',
    'dewaayu@balizero.com',
    'faisha@balizero.com',
    'olena@balizero.com',
    # Reception & Marketing
    'rina@balizero.com',
    'nina@balizero.com',
    'sahira@balizero.com',
    # Group emails
    'team@balizero.com',
    'intel@balizero.com',
]

# Create credentials
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)
delegated_credentials = credentials.with_subject(DELEGATED_USER)
service = build('gmail', 'v1', credentials=delegated_credentials)

# Read email HTML
email_html = Path("INTEL_ARTICLES/EMAIL_PREVIEW_20251009_115413.html").read_text()

print("📊 SENDING INTEL ARTICLES TO ALL COLLABORATORS\n")
print(f"Total recipients: {len(COLLABORATORS)}\n")

sent_count = 0
failed_count = 0

for email in COLLABORATORS:
    if email == 'zero@balizero.com':
        print(f"✓ {email} - Already sent (skipping)")
        continue

    try:
        # Create message
        message = MIMEText(email_html, 'html')
        message['to'] = email
        message['subject'] = '📊 Intel Report - 16 Articles Generated - Oct 9, 2025'

        # Encode and send
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        result = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()

        print(f"✅ {email} - Sent (ID: {result['id']})")
        sent_count += 1

    except Exception as e:
        print(f"❌ {email} - Failed: {e}")
        failed_count += 1

print(f"\n{'='*60}")
print(f"📧 EMAIL DISTRIBUTION COMPLETE")
print(f"✅ Sent: {sent_count}")
print(f"❌ Failed: {failed_count}")
print(f"{'='*60}\n")

print("📋 Article Summary:")
print("- 16 professional articles generated")
print("- Categories: Immigration, Business, Tax, Real Estate, and more")
print("- All based on latest scraped intel data")
print("- Processed with Ollama (llama3.2) + ChromaDB")
