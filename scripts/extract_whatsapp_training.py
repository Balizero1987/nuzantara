#!/usr/bin/env python3
"""
WhatsApp to ZANTARA Training Data Extractor
Estrae pattern ETERNI dalle conversazioni per fine-tuning Llama 4
"""

import sqlite3
import json
import re
from datetime import datetime
from typing import Dict, List, Tuple
import hashlib

class WhatsAppExtractor:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

        # Business-related chat IDs
        self.business_chats = [
            'Italiani 🇮🇹 in Indonesia 🇮🇩',  # Group with Q&A
            'Adit Bali Zero',
            'BZ Marketing',
            'E ITK ONLINE',
            'UkrBaliVisa ( for all types of visa and kitas)',
            'Amanda Bali Zero New',
            'Legal Support Kasto Company',
            'Sahira Bali Zero',
            'Ari Bali Zero 20',
            'Nina Bonaccorso',
            'Gianluca Caldarelli',
            'Gelato Bali società Bali Zero'
        ]

        # Pattern categories
        self.patterns = {
            'visa_inquiry': ['visa', 'kitas', 'voa', 'extension', 'overstay', 'immigration'],
            'company_setup': ['pt pma', 'company', 'business', 'kbli', 'incorporation', 'director'],
            'tax_consultation': ['tax', 'npwp', 'invoice', 'vat', 'pajak', 'fiscal'],
            'emergency': ['urgent', 'emergency', 'help', 'asap', 'blocked', 'expired', 'stuck'],
            'pricing': ['cost', 'price', 'quanto', 'berapa', 'fee', 'payment']
        }

    def anonymize_text(self, text: str) -> str:
        """Remove personal info, keep eternal patterns"""
        if not text:
            return text

        # Replace phone numbers
        text = re.sub(r'\+?\d{10,15}', '[PHONE]', text)

        # Replace emails
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)

        # Replace specific dates with relative
        text = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', '[DATE]', text)

        # Replace specific prices with [PRICE] for training
        # (actual prices stay in ChromaDB)
        text = re.sub(r'[€$]?\d+(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:EUR|USD|IDR))?', '[PRICE]', text)

        # Replace passport/document numbers
        text = re.sub(r'\b[A-Z]{1,2}\d{6,9}\b', '[DOCUMENT]', text)

        return text

    def extract_conversation_threads(self, min_messages: int = 1) -> List[Dict]:
        """Extract complete conversation threads"""

        query = """
        SELECT
            cs.ZPARTNERNAME as contact_name,
            cs.Z_PK as session_id,
            m.ZTEXT as message,
            m.ZISFROMME as is_from_me,
            datetime(m.ZMESSAGEDATE + 978307200, 'unixepoch', 'localtime') as msg_date,
            m.ZPUSHNAME as sender_name
        FROM ZWAMESSAGE m
        JOIN ZWACHATSESSION cs ON m.ZCHATSESSION = cs.Z_PK
        WHERE cs.ZPARTNERNAME IN ({})
        AND m.ZTEXT IS NOT NULL
        AND LENGTH(m.ZTEXT) > 10
        ORDER BY cs.Z_PK, m.ZMESSAGEDATE
        """.format(','.join(['?'] * len(self.business_chats)))

        cursor = self.conn.execute(query, self.business_chats)

        # Group by conversation session
        conversations = {}
        for row in cursor:
            session_id = row['session_id']
            if session_id not in conversations:
                conversations[session_id] = {
                    'contact': row['contact_name'],
                    'messages': []
                }

            conversations[session_id]['messages'].append({
                'text': row['message'],
                'is_from_me': row['is_from_me'],
                'date': row['msg_date'],
                'sender': row['sender_name'] or ('Bali Zero' if row['is_from_me'] else row['contact_name'])
            })

        # Filter for quality conversations
        quality_threads = []
        for session_id, conv in conversations.items():
            if len(conv['messages']) >= min_messages:
                # Find conversation threads (messages within 30 minutes)
                threads = self.group_into_threads(conv['messages'])
                quality_threads.extend(threads)

        return quality_threads

    def group_into_threads(self, messages: List[Dict], gap_minutes: int = 30) -> List[List[Dict]]:
        """Group messages into conversation threads based on time gaps"""
        threads = []
        current_thread = []

        for i, msg in enumerate(messages):
            if i == 0:
                current_thread.append(msg)
            else:
                # Parse dates and check gap
                curr_time = datetime.strptime(msg['date'], '%Y-%m-%d %H:%M:%S')
                prev_time = datetime.strptime(messages[i-1]['date'], '%Y-%m-%d %H:%M:%S')

                gap = (curr_time - prev_time).total_seconds() / 60

                if gap <= gap_minutes:
                    current_thread.append(msg)
                else:
                    if len(current_thread) >= 2:  # Save thread if meaningful
                        threads.append(current_thread)
                    current_thread = [msg]

        if len(current_thread) >= 2:
            threads.append(current_thread)

        return threads

    def classify_pattern(self, thread: List[Dict]) -> str:
        """Classify conversation pattern type"""
        full_text = ' '.join([msg['text'].lower() for msg in thread])

        scores = {}
        for pattern_name, keywords in self.patterns.items():
            score = sum(1 for keyword in keywords if keyword in full_text)
            scores[pattern_name] = score

        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return 'general_support'

    def extract_eternal_patterns(self, thread: List[Dict]) -> Dict:
        """Extract eternal communication patterns"""

        # Analyze conversation flow
        flow = []
        for i, msg in enumerate(thread):
            if i == 0:
                flow.append('opening')
            elif 'grazie' in msg['text'].lower() or 'thanks' in msg['text'].lower():
                flow.append('gratitude')
            elif '?' in msg['text']:
                flow.append('question')
            elif msg['is_from_me'] and i > 0 and not thread[i-1]['is_from_me']:
                flow.append('response')
            elif 'urgente' in msg['text'].lower() or 'urgent' in msg['text'].lower():
                flow.append('urgency')

        # Extract style elements
        style = {
            'professional': any('regarding' in m['text'].lower() or 'concerning' in m['text'].lower() for m in thread),
            'friendly': any('😊' in m['text'] or '👍' in m['text'] for m in thread),
            'educational': any('significa' in m['text'].lower() or 'means' in m['text'].lower() for m in thread),
            'reassuring': any('worry' in m['text'].lower() or 'preoccup' in m['text'].lower() for m in thread)
        }

        return {
            'flow_pattern': '->'.join(flow[:5]),  # Limit to first 5 steps
            'communication_style': style,
            'thread_length': len(thread),
            'pattern_type': self.classify_pattern(thread)
        }

    def format_for_training(self, thread: List[Dict], metadata: Dict) -> Dict:
        """Format conversation for Llama 4 fine-tuning"""

        # Build conversation in ChatML format
        messages = []

        for msg in thread:
            # Anonymize but keep patterns
            clean_text = self.anonymize_text(msg['text'])

            if msg['is_from_me']:
                # Bali Zero / ZANTARA response
                messages.append({
                    "role": "assistant",
                    "content": clean_text
                })
            else:
                # Client message
                messages.append({
                    "role": "user",
                    "content": clean_text
                })

        # Only keep conversations with proper alternation
        if len(messages) >= 2 and messages[0]['role'] == 'user':
            return {
                "messages": messages,
                "metadata": metadata
            }
        return None

    def extract_top_conversations(self, limit: int = 3000) -> List[Dict]:
        """Extract top quality conversations for training"""

        print("🔍 Extracting conversation threads...")
        threads = self.extract_conversation_threads()

        print(f"📊 Found {len(threads)} conversation threads")

        training_data = []
        pattern_counts = {p: 0 for p in self.patterns.keys()}
        pattern_counts['general_support'] = 0

        for thread in threads:
            # Extract eternal patterns
            metadata = self.extract_eternal_patterns(thread)

            # Format for training
            formatted = self.format_for_training(thread, metadata)

            if formatted:
                # Check pattern diversity
                pattern = metadata['pattern_type']
                if pattern_counts[pattern] < limit // 5:  # Max 20% per category
                    training_data.append(formatted)
                    pattern_counts[pattern] += 1

                    if len(training_data) >= limit:
                        break

        print(f"✅ Extracted {len(training_data)} quality conversations")
        print(f"📊 Pattern distribution: {pattern_counts}")

        return training_data

    def save_training_data(self, output_file: str = 'zantara_training.jsonl'):
        """Save training data in JSONL format"""

        conversations = self.extract_top_conversations()

        with open(output_file, 'w', encoding='utf-8') as f:
            for conv in conversations:
                # Remove metadata from final output (keep for analysis)
                training_example = {
                    "messages": conv["messages"]
                }
                f.write(json.dumps(training_example, ensure_ascii=False) + '\n')

        print(f"💾 Saved to {output_file}")

        # Save metadata separately for analysis
        metadata_file = output_file.replace('.jsonl', '_metadata.json')
        with open(metadata_file, 'w', encoding='utf-8') as f:
            metadata = [conv["metadata"] for conv in conversations]
            json.dump(metadata, f, indent=2)

        print(f"📊 Metadata saved to {metadata_file}")

        return len(conversations)


def main():
    """Main extraction process"""

    print("🚀 ZANTARA Training Data Extractor")
    print("=" * 50)

    # Path to WhatsApp backup
    db_path = "/Users/antonellosiano/Desktop/WhatsApp_Backup_2025-10-05/ChatStorage.sqlite"

    # Initialize extractor
    extractor = WhatsAppExtractor(db_path)

    # Extract and save
    count = extractor.save_training_data('zantara_training_3000.jsonl')

    print("=" * 50)
    print(f"✅ SUCCESS: {count} training examples ready!")
    print("\nNext steps:")
    print("1. Review zantara_training_3000.jsonl")
    print("2. Add 2000 Q&A examples from knowledge base")
    print("3. Add 1000 style/pattern examples")
    print("4. Fine-tune Llama 4 with QLoRA")


if __name__ == "__main__":
    main()