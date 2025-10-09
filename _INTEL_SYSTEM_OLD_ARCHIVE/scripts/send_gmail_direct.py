#!/usr/bin/env python3
"""
Send email directly via Gmail API with service account impersonation
"""
import json
import base64
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Load service account
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
SERVICE_ACCOUNT_FILE = 'sa-key-backend.json'
DELEGATED_USER = 'zero@balizero.com'

# Create credentials with delegation
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)
delegated_credentials = credentials.with_subject(DELEGATED_USER)

# Build Gmail service
service = build('gmail', 'v1', credentials=delegated_credentials)

# Create email message
from email.mime.text import MIMEText

# Read HTML email
email_html = Path("INTEL_ARTICLES/EMAIL_PREVIEW_20251009_115413.html").read_text()

message = MIMEText(email_html, 'html')
message['to'] = 'zero@balizero.com'
message['subject'] = '📊 Intel Report - 16 Articles Generated - Oct 9, 2025'

# Encode message
raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

try:
    # Send email
    result = service.users().messages().send(
        userId='me',
        body={'raw': raw_message}
    ).execute()

    print(f"✅ Email sent successfully!")
    print(f"Message ID: {result['id']}")
    print(json.dumps(result, indent=2))

except Exception as e:
    print(f"❌ Error: {e}")

    # Try simple text version
    print("\nTrying simple text version...")
    message_text = MIMEText("""INTEL AUTOMATION COMPLETE

✅ Stage 1: Scraping - 15 documents
✅ Stage 2: RAG Processing - 27 documents
✅ Stage 3: Article Generation - 16 professional articles

📁 All articles in: INTEL_ARTICLES/

Categories: Immigration, Business, Real Estate, Tax, Employment Law, Competitors, and more!

--
NUZANTARA Intel Automation""")

    message_text['to'] = 'zero@balizero.com'
    message_text['subject'] = '📊 Intel Report - 16 Articles Ready'

    raw_text = base64.urlsafe_b64encode(message_text.as_bytes()).decode()

    try:
        result = service.users().messages().send(
            userId='me',
            body={'raw': raw_text}
        ).execute()

        print(f"✅ Simple email sent!")
        print(f"Message ID: {result['id']}")

    except Exception as e2:
        print(f"❌ Still failed: {e2}")
