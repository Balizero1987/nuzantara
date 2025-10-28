#!/usr/bin/env python3
"""
Send Intel Articles via Zantara Gmail Handler
"""
import requests
import json
from pathlib import Path

ZANTARA_URL = "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call"
API_KEY = "zantara-internal-dev-key-2025"
EMAIL_PREVIEW = Path("INTEL_ARTICLES/EMAIL_PREVIEW_20251009_115413.html")

# Read email HTML
with open(EMAIL_PREVIEW, 'r') as f:
    email_html = f.read()

# Send via Zantara
response = requests.post(
    ZANTARA_URL,
    headers={
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    },
    json={
        "key": "gmail.send",
        "params": {
            "to": "zero@balizero.com",
            "subject": "📊 Intel Report - 16 New Articles - Oct 9, 2025",
            "html": email_html
        }
    }
)

print(json.dumps(response.json(), indent=2))
