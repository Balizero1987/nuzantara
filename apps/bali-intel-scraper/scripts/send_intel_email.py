#!/usr/bin/env python3
"""
Email workflow differenziato per Intel System
- Categorie 1-17: Email a collaboratori con review request
- Categorie 18-20 (LLAMA): Email solo a zero@balizero.com con quality insights
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ========================================
# CONFIGURAZIONE EMAIL
# ========================================

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

# ========================================
# CATEGORY MAPPINGS (17 + 3)
# ========================================

# 17 Categorie Regolari (Social Media Pipeline)
REGULAR_CATEGORIES = {
    "immigration": {
        "name": "Immigration & Visas",
        "collaborator": "Adit",
        "email": "consulting@balizero.com"
    },
    "business": {
        "name": "Business (BKPM/OSS/Political)",
        "collaborator": "Dea",
        "email": "Dea@balizero.com"
    },
    "realestate": {
        "name": "Real Estate",
        "collaborator": "Krisna",
        "email": "Krisna@balizero.com"
    },
    "events": {
        "name": "Events & Culture",
        "collaborator": "Sahira",
        "email": "sahira@balizero.com"
    },
    "social": {
        "name": "Social Media Trends",
        "collaborator": "Sahira",
        "email": "sahira@balizero.com"
    },
    "competitors": {
        "name": "Competitors",
        "collaborator": "Ari",
        "email": "ari.firda@balizero.com"
    },
    "news": {
        "name": "General News",
        "collaborator": "Damar",
        "email": "damar@balizero.com"
    },
    "health": {
        "name": "Health & Wellness",
        "collaborator": "Surya",
        "email": "surya@balizero.com"
    },
    "tax": {
        "name": "Tax (DJP)",
        "collaborator": "Faisha",
        "email": "faisha@balizero.com"
    },
    "jobs": {
        "name": "Jobs & Employment Law",
        "collaborator": "Anton",
        "email": "Anton@balizero.com"
    },
    "lifestyle": {
        "name": "Lifestyle",
        "collaborator": "Dewa Ayu",
        "email": "dea.au.tax@balizero.com"
    },
    "banking": {
        "name": "Banking & Finance",
        "collaborator": "Surya",
        "email": "surya@balizero.com"
    },
    "transport": {
        "name": "Transportation & Connectivity",
        "collaborator": "Surya",
        "email": "surya@balizero.com"
    },
    "employment_law": {
        "name": "Employment Law (Detailed)",
        "collaborator": "Amanda",
        "email": "amanda@balizero.com"
    },
    "macro": {
        "name": "Macro Policy",
        "collaborator": "Dea",
        "email": "dea@balizero.com"
    },
    "regulatory": {
        "name": "Regulatory Changes",
        "collaborator": "Adit",
        "email": "consulting@balizero.com"
    },
    "business_setup": {
        "name": "Business Setup",
        "collaborator": "Krisna",
        "email": "krisna@balizero.com"
    }
}

# 3 Categorie LLAMA (Solo Antonio)
LLAMA_CATEGORIES = {
    "ai_tech": {
        "name": "AI & New Technologies (Global)",
        "recipient": "Antonio (LLAMA)",
        "email": "zero@balizero.com"
    },
    "dev_code": {
        "name": "Dev Code Library (Planetary Best Practices)",
        "recipient": "Antonio (LLAMA)",
        "email": "zero@balizero.com"
    },
    "future_trends": {
        "name": "Future Trends (Avant-Garde Ideas)",
        "recipient": "Antonio (LLAMA)",
        "email": "zero@balizero.com"
    }
}


# ========================================
# EMAIL TEMPLATE FUNCTIONS
# ========================================

def create_regular_email_body(category_key, article_data, article_file):
    """Template per categorie 1-17 (collaboratori)"""
    category = REGULAR_CATEGORIES[category_key]

    # Extract metrics from article_data
    sources_count = article_data.get("sources_analyzed", 0)
    quality_score = article_data.get("quality_score", 0)
    keywords = article_data.get("keywords", [])

    body = f"""Ciao {category['collaborator']},

Nuovo articolo Intel generato per la tua categoria:

📋 Categoria: {category['name']}
📅 Data: {datetime.now().strftime('%Y-%m-%d')}
🔗 File: {article_file}

📊 Metriche:
- Fonti analizzate: {sources_count}
- Qualità score: {quality_score}/100
- Keywords principali: {', '.join(keywords[:5]) if keywords else 'N/A'}

✅ Azioni richieste:
1. Review contenuto
2. Fact-check
3. Approva/Rigetta/Richiedi modifiche

Rispondi a questa email con feedback o approvazione.

Grazie!
ZANTARA Intel System
"""
    return body


def create_llama_email_body(category_key, article_data, article_file):
    """Template per categorie 18-20 (LLAMA → Antonio)"""
    category = LLAMA_CATEGORIES[category_key]

    # Extract LLAMA-specific metrics
    quality_score = article_data.get("llama_quality_score", 0)
    insights = article_data.get("key_insights", [])
    actionable = article_data.get("actionable_items", [])

    body = f"""Ciao Antonio,

LLAMA ha identificato una perla giornalistica:

📋 Categoria: {category['name']}
📅 Data: {datetime.now().strftime('%Y-%m-%d')}
🔗 File: {article_file}
⭐ LLAMA Quality Score: {quality_score}/100

📊 Highlights:
"""

    # Add insights
    for i, insight in enumerate(insights[:3], 1):
        body += f"- {insight}\n"

    if not insights:
        body += "- (Nessun insight specifico rilevato)\n"

    body += f"""
🎯 Actionable:
"""

    # Add actionable items
    for i, action in enumerate(actionable[:3], 1):
        body += f"- {action}\n"

    if not actionable:
        body += "- (Review manuale necessaria)\n"

    body += """
LLAMA Intel Research
🤖 Questa categoria NON va sui social media - uso interno only
"""
    return body


# ========================================
# SEND EMAIL FUNCTION
# ========================================

def send_email(to_email, subject, body):
    """Send email via SMTP"""
    if not SMTP_USER or not SMTP_PASS:
        print("⚠️  SMTP credentials not configured")
        print(f"   Would send to: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Body preview: {body[:200]}...")
        return False

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False


# ========================================
# MAIN WORKFLOW
# ========================================

def send_intel_email(category_key, article_file, article_data=None):
    """
    Main function: decide se è categoria regular o LLAMA e manda email appropriata

    Args:
        category_key: chiave categoria (es. "immigration", "ai_tech")
        article_file: path al file MD dell'articolo
        article_data: dict con metadata articolo (opzionale)
    """

    # Default article data if not provided
    if article_data is None:
        article_data = {
            "sources_analyzed": 0,
            "quality_score": 0,
            "keywords": [],
            "llama_quality_score": 0,
            "key_insights": [],
            "actionable_items": []
        }

    # Check if REGULAR category
    if category_key in REGULAR_CATEGORIES:
        category = REGULAR_CATEGORIES[category_key]
        subject = f"🔥 INTEL {category['name']} - {datetime.now().strftime('%Y%m%d')} - Articolo Pronto per Review"
        body = create_regular_email_body(category_key, article_data, article_file)
        to_email = category['email']

        print(f"\n📧 Sending to collaborator: {category['collaborator']}")
        print(f"   Category: {category['name']}")
        print(f"   Email: {to_email}")

        return send_email(to_email, subject, body)

    # Check if LLAMA category
    elif category_key in LLAMA_CATEGORIES:
        category = LLAMA_CATEGORIES[category_key]
        subject = f"🤖 LLAMA INTEL {category['name']} - {datetime.now().strftime('%Y%m%d')} - Perla Giornalistica"
        body = create_llama_email_body(category_key, article_data, article_file)
        to_email = category['email']

        print(f"\n🤖 Sending to LLAMA recipient: {category['recipient']}")
        print(f"   Category: {category['name']}")
        print(f"   Email: {to_email}")
        print(f"   ⚠️  NO SOCIAL MEDIA - Internal use only")

        return send_email(to_email, subject, body)

    else:
        print(f"❌ Unknown category: {category_key}")
        print(f"   Available categories: {list(REGULAR_CATEGORIES.keys()) + list(LLAMA_CATEGORIES.keys())}")
        return False


# ========================================
# CLI INTERFACE
# ========================================

def main():
    """CLI interface per testing"""
    if len(sys.argv) < 3:
        print("Usage: send_intel_email.py <category_key> <article_file> [metadata_json]")
        print("\nRegular categories:", list(REGULAR_CATEGORIES.keys()))
        print("LLAMA categories:", list(LLAMA_CATEGORIES.keys()))
        sys.exit(1)

    category_key = sys.argv[1]
    article_file = sys.argv[2]

    # Load metadata if provided
    article_data = None
    if len(sys.argv) > 3:
        try:
            with open(sys.argv[3], 'r') as f:
                article_data = json.load(f)
        except Exception as e:
            print(f"⚠️  Could not load metadata: {e}")

    # Send email
    print("=" * 70)
    print("📧 ZANTARA Intel Email System")
    print("=" * 70)

    success = send_intel_email(category_key, article_file, article_data)

    print("\n" + "=" * 70)
    if success:
        print("✅ Email workflow completed!")
    else:
        print("❌ Email workflow failed")
    print("=" * 70)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
