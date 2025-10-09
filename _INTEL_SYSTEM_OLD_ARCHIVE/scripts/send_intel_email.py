#!/usr/bin/env python3
import requests
import json
from pathlib import Path

# Read email preview
email_html = Path("INTEL_ARTICLES/EMAIL_PREVIEW_20251009_115413.html").read_text()

# Send via Zantara
response = requests.post(
    "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call",
    headers={
        "Content-Type": "application/json",
        "x-api-key": "zantara-internal-dev-key-2025"
    },
    json={
        "key": "gmail.send",
        "params": {
            "to": "zero@balizero.com",
            "subject": "📊 Intel Report - 16 Articles Generated - Oct 9, 2025",
            "html": email_html
        }
    }
)

result = response.json()
print(json.dumps(result, indent=2))

if result.get("ok"):
    print("\n✅ Email sent successfully!")
else:
    print(f"\n❌ Error: {result.get('error')}")

    # Try alternative: send simple text email
    print("\nTrying simple text version...")
    response2 = requests.post(
        "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call",
        headers={
            "Content-Type": "application/json",
            "x-api-key": "zantara-internal-dev-key-2025"
        },
        json={
            "key": "gmail.send",
            "params": {
                "to": "zero@balizero.com",
                "subject": "📊 Intel Report - 16 Articles Ready",
                "text": """INTEL AUTOMATION COMPLETE

✅ Stage 1: Scraping - 15 documents
✅ Stage 2: RAG Processing - 27 documents
✅ Stage 3: Article Generation - 16 professional articles
✅ Stage 4: Email Distribution - Ready

📁 All articles available in: INTEL_ARTICLES/
📧 Email preview: INTEL_ARTICLES/EMAIL_PREVIEW_20251009_115413.html

Categories covered:
- Immigration (20 docs)
- Business BKPM (20 docs)
- Real Estate (13 docs)
- Regulatory Changes (5 docs)
- Social Media (5 docs)
- Competitors (4 docs)
- Events & Culture (3 docs)
- And 9 more categories...

--
NUZANTARA Intel Automation System
Powered by Ollama (llama3.2) + ChromaDB"""
            }
        }
    )

    result2 = response2.json()
    print(json.dumps(result2, indent=2))

    if result2.get("ok"):
        print("\n✅ Simple email sent successfully!")
    else:
        print(f"\n❌ Still failing: {result2.get('error')}")
