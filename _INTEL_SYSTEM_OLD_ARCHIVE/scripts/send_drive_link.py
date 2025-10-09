#!/usr/bin/env python3
"""Send Drive link to all team members"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from email.mime.text import MIMEText
import base64

# Service Account
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
SERVICE_ACCOUNT_FILE = 'sa-key-backend.json'
DELEGATED_USER = 'zero@balizero.com'

# Team list
COLLABORATORS = [
    'zainal@balizero.com',
    'ruslana@balizero.com',
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
    'veronika@balizero.com',
    'angel@balizero.com',
    'kadek@balizero.com',
    'dewaayu@balizero.com',
    'faisha@balizero.com',
    'olena@balizero.com',
    'rina@balizero.com',
    'nina@balizero.com',
    'sahira@balizero.com',
    'team@balizero.com',
    'intel@balizero.com',
    'zero@balizero.com',
]

# Create credentials
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE,
    scopes=SCOPES
)
delegated_credentials = credentials.with_subject(DELEGATED_USER)
service = build('gmail', 'v1', credentials=delegated_credentials)

# Email body
email_html = """
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .highlight { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db; }
        .button { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .stats { background: #ecf0f1; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #bdc3c7; color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Intel Report - 16 Articles Ready for Download</h1>

        <p>Dear Team,</p>

        <p>Your intel automation pipeline has completed successfully! All 16 professional articles are now available for download.</p>

        <div class="highlight">
            <h2>📥 Download All Articles</h2>
            <p>Click the button below to download the complete ZIP file (78KB) containing all 16 articles:</p>
            <a href="https://drive.google.com/file/d/1ccqQUcf58c8NMZOaKnJTH6ITPkS8O48D/view?usp=drivesdk" class="button">📦 Download Intel Articles</a>
            <p style="margin-top: 15px;"><small>Direct download link: <a href="https://drive.google.com/uc?id=1ccqQUcf58c8NMZOaKnJTH6ITPkS8O48D&export=download">Click here</a></small></p>
        </div>

        <div class="stats">
            <h3>📋 Report Summary</h3>
            <ul>
                <li><strong>Total Articles:</strong> 16</li>
                <li><strong>Source Documents:</strong> 84</li>
                <li><strong>Categories:</strong> Immigration, Business, Tax, Real Estate, Regulatory Changes, and more</li>
                <li><strong>Processing:</strong> Ollama (llama3.2) + ChromaDB</li>
                <li><strong>Date:</strong> October 9, 2025</li>
            </ul>
        </div>

        <h3>📂 What's Inside</h3>
        <ul>
            <li>16 professional markdown articles</li>
            <li>JSON metadata for each article</li>
            <li>Complete article index (INDEX.md)</li>
            <li>HTML email preview</li>
        </ul>

        <h3>✅ Categories Covered</h3>
        <ul>
            <li>Immigration (20 source docs)</li>
            <li>Business BKPM (20 source docs)</li>
            <li>Real Estate (13 source docs)</li>
            <li>Regulatory Changes (5 source docs)</li>
            <li>Social Media Trends (5 source docs)</li>
            <li>Competitor Intel (3 source docs)</li>
            <li>Tax Compliance (2 source docs)</li>
            <li>Employment Law (2 source docs)</li>
            <li>And 8 more categories...</li>
        </ul>

        <div class="footer">
            <p><strong>NUZANTARA Intel Automation System</strong><br>
            Powered by Ollama (llama3.2:3b) + ChromaDB<br>
            🤖 100% local AI processing - Zero API costs</p>

            <p><em>This is an automated intel report. For questions, contact zero@balizero.com</em></p>
        </div>
    </div>
</body>
</html>
"""

print("📧 SENDING GOOGLE DRIVE LINK TO ALL TEAM MEMBERS\n")
print(f"Total recipients: {len(COLLABORATORS)}\n")

sent_count = 0
failed_count = 0

for email in COLLABORATORS:
    try:
        message = MIMEText(email_html, 'html')
        message['to'] = email
        message['subject'] = '📊 Intel Articles Ready - Download from Google Drive'

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
print(f"📧 DRIVE LINK DISTRIBUTION COMPLETE")
print(f"✅ Sent: {sent_count}")
print(f"❌ Failed: {failed_count}")
print(f"{'='*60}")
