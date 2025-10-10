#!/usr/bin/env python3
"""
Send email via Zantara Gmail API handler
Uses existing backend infrastructure instead of direct SMTP
"""

import os
import requests

# Zantara API Configuration
ZANTARA_API_URL = os.getenv(
    "ZANTARA_API_URL",
    "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call",
)
API_KEY = os.getenv("ZANTARA_API_KEY")
IMPERSONATE_USER = os.getenv("ZANTARA_IMPERSONATE_USER", "zero@balizero.com")


def send_email_via_api(
    to_email: str, subject: str, body: str, retry_count: int = 3
) -> bool:
    """
    Send email via Zantara Gmail API handler.

    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Email body (plain text)
        retry_count: Number of retries on failure

    Returns:
        bool: True if email sent successfully
    """

    if not API_KEY:
        print("⚠️  Missing ZANTARA_API_KEY environment variable")
        print("   Would send via API with the configured payload")
        return False

    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "x-impersonate-user": IMPERSONATE_USER,
    }

    payload = {
        "key": "gmail.send",
        "params": {
            "to": to_email,
            "subject": subject,
            "body": body  # Changed from "text" to "body" to match handler interface
        }
    }

    for attempt in range(retry_count):
        try:
            response = requests.post(
                ZANTARA_API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    print(f"✅ Email sent to {to_email}")
                    return True
                else:
                    print(f"❌ API error: {result.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ HTTP {response.status_code}: {response.text[:200]}")
                if attempt < retry_count - 1:
                    print(f"   Retrying ({attempt + 2}/{retry_count})...")
                    continue
                return False

        except requests.exceptions.Timeout:
            print(f"❌ Timeout on attempt {attempt + 1}/{retry_count}")
            if attempt < retry_count - 1:
                continue
            return False

        except Exception as e:
            print(f"❌ Error: {e}")
            return False

    return False


if __name__ == "__main__":
    # Test
    import sys

    if len(sys.argv) < 4:
        print("Usage: python3 send_email_via_api.py <to> <subject> <body>")
        print("\nExample:")
        print('  python3 send_email_via_api.py "test@example.com" "Test Subject" "Test body"')
        sys.exit(1)

    to = sys.argv[1]
    subject = sys.argv[2]
    body = sys.argv[3]

    success = send_email_via_api(to, subject, body)
    sys.exit(0 if success else 1)
