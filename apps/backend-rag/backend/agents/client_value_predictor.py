"""
💰 CLIENT LIFETIME VALUE PREDICTOR
Predicts high-value clients and automatically nurtures them
"""

import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from anthropic import AsyncAnthropic
import json
from typing import Dict, List, Optional

class ClientValuePredictor:
    """
    Autonomous agent that:
    1. Analyzes client interaction patterns
    2. Predicts lifetime value (LTV)
    3. Identifies at-risk high-value clients
    4. Automatically sends personalized nurturing messages
    5. Schedules follow-ups
    """

    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.anthropic = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER")

    async def calculate_client_score(self, client_id: str) -> Dict:
        """Calculate comprehensive client value score"""

        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Get client data
        cursor.execute("""
            SELECT
                c.name,
                c.email,
                c.phone,
                c.created_at,
                COUNT(DISTINCT i.id) as interaction_count,
                AVG(CASE WHEN i.sentiment IS NOT NULL THEN i.sentiment ELSE 0 END) as avg_sentiment,
                COUNT(DISTINCT CASE WHEN i.created_at >= NOW() - INTERVAL '30 days' THEN i.id END) as recent_interactions,
                MAX(i.created_at) as last_interaction,
                COUNT(DISTINCT conv.id) as conversation_count,
                AVG(conv.rating) as avg_rating,
                ARRAY_AGG(DISTINCT p.status) as practice_statuses,
                COUNT(DISTINCT p.id) as practice_count
            FROM crm_clients c
            LEFT JOIN crm_interactions i ON c.id = i.client_id
            LEFT JOIN conversations conv ON c.id::text = conv.client_id
            LEFT JOIN crm_practices p ON c.id = p.client_id
            WHERE c.id = %s
            GROUP BY c.id, c.name, c.email, c.phone, c.created_at
        """, (client_id,))

        data = cursor.fetchone()
        cursor.close()
        conn.close()

        if not data:
            return None

        # Calculate scores (0-100)
        engagement_score = min(100, (data[4] * 5))  # interaction_count
        sentiment_score = (data[5] + 1) * 50  # avg_sentiment (-1 to 1 -> 0 to 100)
        recency_score = min(100, (data[6] * 10))  # recent_interactions
        quality_score = (data[9] or 0) * 20  # avg_rating (0-5 -> 0-100)
        practice_score = min(100, (data[11] * 15))  # practice_count

        # Days since last interaction
        days_since_last = (datetime.now() - data[7]).days if data[7] else 999

        # Weighted LTV prediction
        ltv_score = (
            engagement_score * 0.3 +
            sentiment_score * 0.2 +
            recency_score * 0.2 +
            quality_score * 0.2 +
            practice_score * 0.1
        )

        return {
            "client_id": client_id,
            "name": data[0],
            "email": data[1],
            "phone": data[2],
            "ltv_score": round(ltv_score, 2),
            "engagement_score": round(engagement_score, 2),
            "sentiment_score": round(sentiment_score, 2),
            "recency_score": round(recency_score, 2),
            "quality_score": round(quality_score, 2),
            "practice_score": round(practice_score, 2),
            "days_since_last_interaction": days_since_last,
            "total_interactions": data[4],
            "total_conversations": data[8],
            "practice_statuses": data[10] or [],
            "risk_level": self._calculate_risk(ltv_score, days_since_last),
            "segment": self._get_segment(ltv_score)
        }

    def _calculate_risk(self, ltv_score: float, days_since_last: int) -> str:
        """Calculate churn risk"""
        if ltv_score >= 70 and days_since_last > 30:
            return "HIGH_RISK"  # High-value but inactive
        elif ltv_score >= 70:
            return "LOW_RISK"  # High-value and active
        elif days_since_last > 60:
            return "MEDIUM_RISK"  # Low-value and inactive
        else:
            return "LOW_RISK"

    def _get_segment(self, ltv_score: float) -> str:
        """Segment clients"""
        if ltv_score >= 80:
            return "VIP"
        elif ltv_score >= 60:
            return "HIGH_VALUE"
        elif ltv_score >= 40:
            return "MEDIUM_VALUE"
        else:
            return "LOW_VALUE"

    async def generate_nurturing_message(self, client_data: Dict) -> str:
        """Generate personalized nurturing message with Claude"""

        prompt = f"""Generate a personalized WhatsApp message to nurture this client:

Client Profile:
- Name: {client_data['name']}
- Segment: {client_data['segment']}
- LTV Score: {client_data['ltv_score']}/100
- Risk Level: {client_data['risk_level']}
- Days Since Last Contact: {client_data['days_since_last_interaction']}
- Total Interactions: {client_data['total_interactions']}
- Practice Count: {client_data.get('practice_count', 0)}
- Avg Sentiment: {client_data['sentiment_score']}/100

Guidelines:
1. Warm and personal tone (use their name)
2. Reference their specific situation if known
3. Provide genuine value (not just a check-in)
4. Include a clear, low-friction call-to-action
5. Max 2-3 sentences
6. In Italian if client is Italian

Output ONLY the message text, no explanations."""

        response = await self.anthropic.messages.create(
            model="claude-3-5-haiku-20241022",  # Fast + cheap for this
            max_tokens=300,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text.strip()

    async def send_whatsapp_message(self, phone: str, message: str):
        """Send WhatsApp message via Twilio"""
        from twilio.rest import Client

        client = Client(self.twilio_sid, self.twilio_token)

        # Format phone number
        if not phone.startswith('+'):
            phone = '+' + phone

        try:
            message = client.messages.create(
                from_=f'whatsapp:{self.whatsapp_number}',
                body=message,
                to=f'whatsapp:{phone}'
            )
            return message.sid
        except Exception as e:
            print(f"Error sending WhatsApp: {e}")
            return None

    async def run_daily_nurturing(self):
        """Daily job to identify and nurture clients"""

        conn = psycopg2.connect(self.db_url)
        cursor = conn.cursor()

        # Get all active clients
        cursor.execute("SELECT id FROM crm_clients WHERE status = 'active'")
        client_ids = [row[0] for row in cursor.fetchall()]

        results = {
            "vip_nurtured": 0,
            "high_risk_contacted": 0,
            "total_messages_sent": 0,
            "errors": []
        }

        for client_id in client_ids:
            try:
                # Calculate score
                client_data = await self.calculate_client_score(client_id)

                if not client_data:
                    continue

                # Update client score in DB
                cursor.execute("""
                    UPDATE crm_clients
                    SET
                        metadata = metadata || %s::jsonb,
                        updated_at = NOW()
                    WHERE id = %s
                """, (json.dumps({
                    "ltv_score": client_data["ltv_score"],
                    "segment": client_data["segment"],
                    "risk_level": client_data["risk_level"],
                    "last_score_update": datetime.now().isoformat()
                }), client_id))

                # Decide if we should reach out
                should_nurture = False
                reason = ""

                if client_data["segment"] == "VIP" and client_data["days_since_last_interaction"] > 14:
                    should_nurture = True
                    reason = "VIP inactive for 14+ days"
                elif client_data["risk_level"] == "HIGH_RISK":
                    should_nurture = True
                    reason = "High-value client at risk of churn"
                elif client_data["segment"] in ["HIGH_VALUE", "VIP"] and client_data["days_since_last_interaction"] > 30:
                    should_nurture = True
                    reason = "High-value client inactive for 30+ days"

                if should_nurture and client_data.get("phone"):
                    # Generate personalized message
                    message = await self.generate_nurturing_message(client_data)

                    # Send WhatsApp
                    message_sid = await self.send_whatsapp_message(client_data["phone"], message)

                    if message_sid:
                        # Log interaction
                        cursor.execute("""
                            INSERT INTO crm_interactions (client_id, type, notes, created_at)
                            VALUES (%s, 'whatsapp_nurture', %s, NOW())
                        """, (client_id, f"Auto-nurture: {reason}\nMessage: {message}"))

                        results["total_messages_sent"] += 1

                        if client_data["segment"] == "VIP":
                            results["vip_nurtured"] += 1
                        if client_data["risk_level"] == "HIGH_RISK":
                            results["high_risk_contacted"] += 1

                        print(f"✅ Nurtured {client_data['name']} ({reason})")

            except Exception as e:
                results["errors"].append(f"Client {client_id}: {str(e)}")
                print(f"❌ Error processing client {client_id}: {e}")

        conn.commit()
        cursor.close()
        conn.close()

        # Send summary to team
        if os.getenv("SLACK_WEBHOOK_URL"):
            import requests
            requests.post(os.getenv("SLACK_WEBHOOK_URL"), json={
                "text": f"""💰 Daily Client Nurturing Report

VIP Clients Nurtured: {results['vip_nurtured']}
High-Risk Contacted: {results['high_risk_contacted']}
Total Messages Sent: {results['total_messages_sent']}
Errors: {len(results['errors'])}

All clients scored and segmented automatically!
"""
            })

        return results

# Cron entry (add to backend-ts)
# CRON_CLIENT_NURTURING="0 10 * * *"  # Daily at 10 AM
