"""
Gmail Service for ZANTARA
Handles email reading and sending using Google API.
"""

import logging
import os
import base64
from typing import List, Dict, Any
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']

class GmailService:
    """
    Service to interact with Gmail API.
    """

    def __init__(self):
        self.creds = None
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Google API"""
        try:
            # In a real deployment, we would load from environment or a secure vault
            # For now, we check for a local token.json or credentials.json
            if os.path.exists('token.json'):
                self.creds = Credentials.from_authorized_user_file('token.json', SCOPES)
            
            # If no valid credentials available, let the user know
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                elif os.path.exists('credentials.json'):
                    # This flow requires browser interaction, might not work in headless server
                    # flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                    # self.creds = flow.run_local_server(port=0)
                    logger.warning("⚠️ credentials.json found but interactive login required. Skipping real auth.")
                else:
                    logger.warning("⚠️ No Gmail credentials found. Service will run in MOCK mode.")

            if self.creds:
                self.service = build('gmail', 'v1', credentials=self.creds)
                logger.info("✅ Gmail Service initialized (Authenticated)")
            else:
                logger.info("⚠️ Gmail Service initialized (MOCK MODE)")

        except Exception as e:
            logger.error(f"❌ Gmail authentication failed: {e}")

    def list_messages(self, query: str = 'is:unread', max_results: int = 5) -> List[Dict[str, Any]]:
        """List messages matching query"""
        if not self.service:
            # Mock behavior
            return []

        try:
            results = self.service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
            messages = results.get('messages', [])
            return messages
        except Exception as e:
            logger.error(f"❌ Failed to list messages: {e}")
            return []

    def get_message_details(self, message_id: str) -> Dict[str, Any]:
        """Get full details of a message"""
        if not self.service:
            return {}

        try:
            message = self.service.users().messages().get(userId='me', id=message_id).execute()
            payload = message.get('payload', {})
            headers = payload.get('headers', [])
            
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            
            # Extract body (simplified)
            body = "No content"
            if 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/plain':
                        data = part['body'].get('data')
                        if data:
                            body = base64.urlsafe_b64decode(data).decode()
                            break
            elif 'body' in payload:
                data = payload['body'].get('data')
                if data:
                    body = base64.urlsafe_b64decode(data).decode()

            return {
                "id": message_id,
                "subject": subject,
                "sender": sender,
                "date": date,
                "body": body,
                "snippet": message.get('snippet', '')
            }
        except Exception as e:
            logger.error(f"❌ Failed to get message details: {e}")
            return {}

    def create_draft(self, to: str, subject: str, body: str) -> Dict[str, Any]:
        """Create a draft email"""
        if not self.service:
            logger.info(f"📝 [MOCK] Draft created for {to}: {subject}")
            return {"id": "mock_draft_id", "labelIds": ["DRAFT"]}

        try:
            message = MIMEText(body)
            message['to'] = to
            message['subject'] = subject
            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            body = {'message': {'raw': raw}}
            
            draft = self.service.users().drafts().create(userId='me', body=body).execute()
            logger.info(f"✅ Draft created: {draft['id']}")
            return draft
        except Exception as e:
            logger.error(f"❌ Failed to create draft: {e}")
            return {}

# Singleton
_gmail_service = None

def get_gmail_service():
    global _gmail_service
    if not _gmail_service:
        _gmail_service = GmailService()
    return _gmail_service
