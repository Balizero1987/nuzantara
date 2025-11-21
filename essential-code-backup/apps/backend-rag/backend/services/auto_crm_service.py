"""
ZANTARA CRM - Auto-Population Service
Automatically creates/updates clients and practices from chat conversations
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor, Json

from services.ai_crm_extractor import get_extractor

logger = logging.getLogger(__name__)


class AutoCRMService:
    """
    Automatically populate CRM from conversations using AI extraction
    """

    def __init__(self):
        """Initialize service"""
        self.extractor = get_extractor()

    def get_db_connection(self):
        """Get PostgreSQL connection"""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise Exception("DATABASE_URL environment variable not set")
        return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

    async def process_conversation(
        self,
        conversation_id: int,
        messages: List[Dict],
        user_email: Optional[str] = None,
        team_member: str = "system"
    ) -> Dict:
        """
        Process a conversation and auto-populate CRM

        Args:
            conversation_id: ID from conversations table
            messages: List of {role, content} messages
            user_email: Optional known user email
            team_member: Team member who handled conversation

        Returns:
            {
                "success": bool,
                "client_id": int or None,
                "client_created": bool,
                "client_updated": bool,
                "practice_id": int or None,
                "practice_created": bool,
                "interaction_id": int,
                "extracted_data": dict
            }
        """

        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()

            # Step 1: Check if client exists (by email if provided)
            existing_client = None
            if user_email:
                cursor.execute(
                    "SELECT * FROM clients WHERE email = %s",
                    (user_email,)
                )
                existing_client = cursor.fetchone()

            # Step 2: Extract data using AI
            logger.info(f"🧠 Extracting CRM data from conversation {conversation_id}...")

            extracted = await self.extractor.extract_from_conversation(
                messages=messages,
                existing_client_data=dict(existing_client) if existing_client else None
            )

            logger.info(f"📊 Extraction result: client_confidence={extracted['client']['confidence']:.2f}, practice_detected={extracted['practice_intent']['detected']}")

            # Step 3: Create or update client
            client_id = None
            client_created = False
            client_updated = False

            # Use extracted email if not provided
            if not user_email and extracted["client"]["email"]:
                user_email = extracted["client"]["email"]

            # Re-check with extracted email
            if user_email and not existing_client:
                cursor.execute(
                    "SELECT * FROM clients WHERE email = %s",
                    (user_email,)
                )
                existing_client = cursor.fetchone()

            if existing_client:
                # Update existing client if extraction confidence is good
                client_id = existing_client["id"]

                if extracted["client"]["confidence"] >= 0.6:
                    update_fields = []
                    params = []

                    # Update only if extracted value exists and current value is null
                    for field in ["full_name", "phone", "whatsapp", "nationality"]:
                        extracted_value = extracted["client"].get(field)
                        if extracted_value and not existing_client.get(field):
                            update_fields.append(f"{field} = %s")
                            params.append(extracted_value)

                    if update_fields:
                        query = f"""
                            UPDATE clients
                            SET {', '.join(update_fields)}, updated_at = NOW()
                            WHERE id = %s
                        """
                        params.append(client_id)
                        cursor.execute(query, params)
                        client_updated = True
                        logger.info(f"✅ Updated client {client_id} with extracted data")

            else:
                # Create new client if we have minimum data
                if extracted["client"]["confidence"] >= 0.5 and (
                    extracted["client"]["email"] or
                    extracted["client"]["phone"] or
                    user_email
                ):
                    cursor.execute("""
                        INSERT INTO clients (
                            full_name, email, phone, whatsapp, nationality,
                            status, first_contact_date, created_by, last_interaction_date
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s
                        )
                        RETURNING id
                    """, (
                        extracted["client"]["full_name"] or (user_email.split('@')[0] if user_email else "Unknown"),
                        extracted["client"]["email"] or user_email,
                        extracted["client"]["phone"],
                        extracted["client"]["whatsapp"],
                        extracted["client"]["nationality"],
                        "prospect",
                        datetime.now(),
                        team_member,
                        datetime.now()
                    ))

                    client_id = cursor.fetchone()["id"]
                    client_created = True
                    logger.info(f"✅ Created new client {client_id} from conversation")

            # Step 4: Create practice if intent detected
            practice_id = None
            practice_created = False

            if client_id and await self.extractor.should_create_practice(extracted):
                practice_intent = extracted["practice_intent"]

                # Get practice_type_id
                cursor.execute(
                    "SELECT id, base_price FROM practice_types WHERE code = %s",
                    (practice_intent["practice_type_code"],)
                )
                practice_type = cursor.fetchone()

                if practice_type:
                    # Check if similar practice already exists (avoid duplicates)
                    cursor.execute("""
                        SELECT id FROM practices
                        WHERE client_id = %s
                        AND practice_type_id = %s
                        AND status IN ('inquiry', 'quotation_sent', 'payment_pending', 'in_progress')
                        AND created_at >= NOW() - INTERVAL '7 days'
                    """, (client_id, practice_type["id"]))

                    existing_practice = cursor.fetchone()

                    if not existing_practice:
                        # Create new practice
                        cursor.execute("""
                            INSERT INTO practices (
                                client_id, practice_type_id, status, priority,
                                quoted_price, notes, inquiry_date, created_by
                            ) VALUES (
                                %s, %s, %s, %s, %s, %s, %s, %s
                            )
                            RETURNING id
                        """, (
                            client_id,
                            practice_type["id"],
                            "inquiry",
                            "high" if extracted["urgency"] == "urgent" else "normal",
                            practice_type["base_price"],
                            practice_intent["details"],
                            datetime.now(),
                            team_member
                        ))

                        practice_id = cursor.fetchone()["id"]
                        practice_created = True
                        logger.info(f"✅ Created practice {practice_id} ({practice_intent['practice_type_code']})")
                    else:
                        practice_id = existing_practice["id"]
                        logger.info(f"ℹ️  Practice already exists: {practice_id}")

            # Step 5: Log interaction
            conversation_summary = extracted["summary"] or "Chat conversation"
            full_content = "\n\n".join([
                f"{msg['role'].upper()}: {msg['content']}"
                for msg in messages
            ])

            cursor.execute("""
                INSERT INTO interactions (
                    client_id, practice_id, conversation_id,
                    interaction_type, channel, summary, full_content,
                    sentiment, team_member, direction,
                    extracted_entities, action_items, interaction_date
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                RETURNING id
            """, (
                client_id,
                practice_id,
                conversation_id,
                "chat",
                "web_chat",
                conversation_summary[:500],  # Limit summary length
                full_content,
                extracted["sentiment"],
                team_member,
                "inbound",
                Json(extracted["extracted_entities"]),
                Json(extracted["action_items"]),
                datetime.now()
            ))

            interaction_id = cursor.fetchone()["id"]

            # Update client last interaction if client exists
            if client_id:
                cursor.execute("""
                    UPDATE clients
                    SET last_interaction_date = NOW()
                    WHERE id = %s
                """, (client_id,))

            conn.commit()

            cursor.close()
            conn.close()

            result = {
                "success": True,
                "client_id": client_id,
                "client_created": client_created,
                "client_updated": client_updated,
                "practice_id": practice_id,
                "practice_created": practice_created,
                "interaction_id": interaction_id,
                "extracted_data": extracted
            }

            logger.info(f"✅ Auto-CRM complete: client_id={client_id}, practice_id={practice_id}")

            return result

        except Exception as e:
            logger.error(f"❌ Auto-CRM processing failed: {e}")
            import traceback
            traceback.print_exc()

            return {
                "success": False,
                "error": str(e),
                "client_id": None,
                "client_created": False,
                "client_updated": False,
                "practice_id": None,
                "practice_created": False,
                "interaction_id": None,
                "extracted_data": None
            }


# Singleton instance
_auto_crm_instance: Optional[AutoCRMService] = None


def get_auto_crm_service() -> AutoCRMService:
    """Get or create singleton auto-CRM service instance"""
    global _auto_crm_instance

    if _auto_crm_instance is None:
        try:
            _auto_crm_instance = AutoCRMService()
            logger.info("✅ Auto-CRM Service initialized")
        except Exception as e:
            logger.warning(f"⚠️  Auto-CRM Service not available: {e}")
            raise

    return _auto_crm_instance
