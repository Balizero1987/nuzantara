#!/usr/bin/env python3
"""
MASSIVE WhatsApp Extraction for ZANTARA Training
Estrae TUTTO il possibile per arrivare a 10,000+ esempi
"""

import sqlite3
import json
import re
from datetime import datetime
from typing import Dict, List, Tuple
import hashlib

class MassiveWhatsAppExtractor:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

        # ALL business-related chats (expanded list)
        self.all_business_chats = [
            'Italiani 🇮🇹 in Indonesia 🇮🇩',
            'Bebe',
            'INVOICE BALI ZERO',
            'BZ Marketing',
            'Adit Bali Zero',
            'E ITK ONLINE',
            'Ari Bali Zero 20',
            'Nina Bonaccorso',
            'UkrBaliVisa ( for all types of visa and kitas)',
            'Sahira Bali Zero',
            'Gianluca Caldarelli',
            'Gelato Bali società Bali Zero',
            'Amanda Bali Zero New',
            'ALL E-VISA - BALI ZERO',
            'Legal Support Kasto Company',
            'Surya Bali Zero',
            'Krisna Bali Zero',
            'Visas pt rolling fork',
            'BALI ZERO - TEAM',
            'Dea Bali Zero',
            'Ruslana',
            'Veronika Bali Zero Tax',
            'Vino Bali Zero',
            'SET UP TEAM',
            'Tax department',
            'BALISTARZ VISAS & KITAS',
            # Add more specific client conversations
            'Marianna Arnaldi - working kitas',
            'Davide - Alchool license',
            'Agent | PT HOLISTIC LIVING CONCEPTS | Kitas',
            'PT Kinoh Real Estate (Paolo Maggiore)',
            'Greta&Fede - PMA',
            'Demetrio - Pma real estate',
            'Mirko - investor kitas',
            'Francesco - Maor',
            'Chiara - extension kitas',
            'Andrea - set up PMA',
        ]

        # Expanded pattern categories
        self.patterns = {
            'visa_inquiry': ['visa', 'kitas', 'voa', 'extension', 'overstay', 'immigration', 'passport', 'stay permit'],
            'company_setup': ['pt pma', 'company', 'business', 'kbli', 'incorporation', 'director', 'shareholder', 'notary'],
            'tax_consultation': ['tax', 'npwp', 'invoice', 'vat', 'pajak', 'fiscal', 'faktur', 'spt'],
            'emergency': ['urgent', 'emergency', 'help', 'asap', 'blocked', 'expired', 'stuck', 'problem'],
            'pricing': ['cost', 'price', 'quanto', 'berapa', 'fee', 'payment', 'transfer', 'pay'],
            'legal': ['legal', 'law', 'contract', 'agreement', 'permit', 'license', 'certificate'],
            'property': ['property', 'rent', 'lease', 'villa', 'apartment', 'house', 'real estate'],
            'documents': ['document', 'paper', 'form', 'application', 'letter', 'file', 'scan']
        }

        # Keep stats
        self.stats = {
            'total_messages': 0,
            'threads_extracted': 0,
            'quality_conversations': 0
        }

    def anonymize_text(self, text: str) -> str:
        """Anonymize but keep patterns"""
        if not text or len(text) < 10:
            return None

        # Skip pure invoice/payment messages
        if text.startswith('D') and len(text) < 50:
            return None

        # Replace personal info
        text = re.sub(r'\+?\d{10,15}', '[PHONE]', text)
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)
        text = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', '[DATE]', text)
        text = re.sub(r'[€$]?\d+(?:,\d{3})*(?:\.\d{2})?', '[PRICE]', text)
        text = re.sub(r'\b[A-Z]{1,2}\d{6,9}\b', '[DOCUMENT]', text)

        return text

    def extract_all_conversations(self, batch_size=1000):
        """Extract ALL possible conversations"""

        print(f"🔍 Extracting from {len(self.all_business_chats)} chat sources...")

        all_conversations = []

        for chat_name in self.all_business_chats:
            print(f"  Processing: {chat_name}...", end='')

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
            WHERE cs.ZPARTNERNAME = ?
            AND m.ZTEXT IS NOT NULL
            ORDER BY m.ZMESSAGEDATE
            """

            cursor = self.conn.execute(query, (chat_name,))
            messages = cursor.fetchall()

            if messages:
                threads = self.extract_threads_from_messages(messages, chat_name)
                all_conversations.extend(threads)
                print(f" {len(threads)} threads")
            else:
                print(" 0 threads")

            self.stats['total_messages'] += len(messages)

        return all_conversations

    def extract_threads_from_messages(self, messages: List, source: str) -> List[Dict]:
        """Extract conversation threads from messages"""

        threads = []
        current_thread = []
        last_time = None

        for msg in messages:
            msg_time = datetime.strptime(msg['msg_date'], '%Y-%m-%d %H:%M:%S')

            # New thread if gap > 30 minutes or thread > 20 messages
            if last_time and (msg_time - last_time).total_seconds() > 1800 or len(current_thread) > 20:
                if len(current_thread) >= 1:  # Even single messages can be useful
                    threads.append(self.process_thread(current_thread, source))
                current_thread = []

            # Add to current thread
            if msg['message']:
                current_thread.append({
                    'text': msg['message'],
                    'is_from_me': msg['is_from_me'],
                    'date': msg['msg_date'],
                    'sender': msg['sender_name'] or source
                })

            last_time = msg_time

        # Add last thread
        if current_thread:
            threads.append(self.process_thread(current_thread, source))

        self.stats['threads_extracted'] += len(threads)
        return threads

    def process_thread(self, messages: List[Dict], source: str) -> Dict:
        """Process a thread into training format"""

        # Clean and anonymize
        cleaned_messages = []
        for msg in messages:
            clean_text = self.anonymize_text(msg['text'])
            if clean_text:
                cleaned_messages.append({
                    'text': clean_text,
                    'is_from_me': msg['is_from_me']
                })

        if not cleaned_messages:
            return None

        # Ensure alternation for training
        formatted_messages = []
        last_role = None

        for msg in cleaned_messages:
            role = "assistant" if msg['is_from_me'] else "user"

            # Skip if same role consecutive (merge them)
            if role == last_role and formatted_messages:
                formatted_messages[-1]['content'] += f" {msg['text']}"
            else:
                formatted_messages.append({
                    'role': role,
                    'content': msg['text']
                })
                last_role = role

        # Must start with user and have at least 2 messages
        if len(formatted_messages) >= 2 and formatted_messages[0]['role'] == 'user':
            self.stats['quality_conversations'] += 1
            return {
                'messages': formatted_messages,
                'metadata': {
                    'source': source,
                    'length': len(formatted_messages),
                    'pattern': self.classify_pattern(formatted_messages)
                }
            }

        return None

    def classify_pattern(self, messages: List[Dict]) -> str:
        """Classify conversation pattern"""

        full_text = ' '.join([m['content'].lower() for m in messages])

        scores = {}
        for pattern_name, keywords in self.patterns.items():
            score = sum(1 for keyword in keywords if keyword in full_text)
            if score > 0:
                scores[pattern_name] = score

        if scores:
            return max(scores, key=scores.get)
        return 'general'

    def extract_single_qa_pairs(self):
        """Extract single Q&A pairs from groups"""

        print("\n📚 Extracting Q&A pairs from group discussions...")

        qa_pairs = []

        # Focus on group chats for Q&A
        group_query = """
        SELECT
            m.ZTEXT as text,
            m.ZISFROMME as is_from_me,
            datetime(m.ZMESSAGEDATE + 978307200, 'unixepoch', 'localtime') as date
        FROM ZWAMESSAGE m
        JOIN ZWACHATSESSION cs ON m.ZCHATSESSION = cs.Z_PK
        WHERE cs.ZPARTNERNAME LIKE '%Italia%' OR cs.ZPARTNERNAME LIKE '%TEAM%'
        AND m.ZTEXT IS NOT NULL
        AND (m.ZTEXT LIKE '%?%' OR LENGTH(m.ZTEXT) > 100)
        ORDER BY m.ZMESSAGEDATE
        """

        cursor = self.conn.execute(group_query)
        messages = cursor.fetchall()

        for i in range(len(messages) - 1):
            msg = messages[i]
            next_msg = messages[i+1]

            # Look for Q&A pattern
            if msg[0] and '?' in msg[0] and not msg[1]:  # Question from user
                if next_msg[0] and next_msg[1] and len(next_msg[0]) > 50:  # Answer from team
                    clean_q = self.anonymize_text(msg[0])
                    clean_a = self.anonymize_text(next_msg[0])

                    if clean_q and clean_a:
                        qa_pairs.append({
                            'messages': [
                                {'role': 'user', 'content': clean_q},
                                {'role': 'assistant', 'content': clean_a}
                            ],
                            'metadata': {'type': 'qa', 'source': 'group'}
                        })

        print(f"  Found {len(qa_pairs)} Q&A pairs")
        return qa_pairs

    def save_massive_dataset(self, output_file='zantara_massive_training.jsonl'):
        """Extract and save massive dataset"""

        print("🚀 MASSIVE WhatsApp Extraction Starting...")
        print("=" * 50)

        # Extract all conversations
        all_conversations = self.extract_all_conversations()

        # Extract Q&A pairs
        qa_pairs = self.extract_single_qa_pairs()

        # Filter None values and combine
        valid_conversations = [c for c in all_conversations if c]
        all_data = valid_conversations + qa_pairs

        print(f"\n📊 Extraction Complete:")
        print(f"  Total messages processed: {self.stats['total_messages']:,}")
        print(f"  Threads extracted: {self.stats['threads_extracted']:,}")
        print(f"  Quality conversations: {self.stats['quality_conversations']:,}")
        print(f"  Q&A pairs: {len(qa_pairs):,}")
        print(f"  TOTAL TRAINING EXAMPLES: {len(all_data):,}")

        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            for item in all_data:
                # Save without metadata
                training_item = {'messages': item['messages']}
                f.write(json.dumps(training_item, ensure_ascii=False) + '\n')

        # Save metadata separately
        metadata_file = output_file.replace('.jsonl', '_metadata.json')
        with open(metadata_file, 'w', encoding='utf-8') as f:
            metadata = [item.get('metadata', {}) for item in all_data]
            json.dump({
                'total_examples': len(all_data),
                'stats': self.stats,
                'pattern_distribution': self.get_pattern_distribution(metadata)
            }, f, indent=2)

        print(f"\n💾 Saved to {output_file}")
        file_size_mb = len(json.dumps(all_data)) / 1024 / 1024
        print(f"📦 Estimated size: {file_size_mb:.1f} MB")

        return len(all_data)

    def get_pattern_distribution(self, metadata_list):
        """Get distribution of patterns"""

        distribution = {}
        for m in metadata_list:
            pattern = m.get('pattern', 'unknown')
            distribution[pattern] = distribution.get(pattern, 0) + 1

        return distribution


def main():
    """Extract massive dataset from WhatsApp"""

    print("🌊 MASSIVE WhatsApp Data Extraction for ZANTARA")
    print("=" * 50)
    print("Target: 10,000+ training examples")
    print("=" * 50)

    db_path = "/Users/antonellosiano/Desktop/WhatsApp_Backup_2025-10-05/ChatStorage.sqlite"

    extractor = MassiveWhatsAppExtractor(db_path)
    count = extractor.save_massive_dataset('zantara_whatsapp_massive.jsonl')

    print("=" * 50)
    print(f"✅ SUCCESS: {count:,} training examples extracted!")

    if count < 5000:
        print("\n⚠️ Warning: Still need more data!")
        print("Consider:")
        print("1. Adding knowledge base conversion")
        print("2. More aggressive augmentation")
        print("3. Synthetic generation")
    else:
        print("\n🎯 Great! Now we have substantial data!")
        print("Next: Combine with cultural identity data")


if __name__ == "__main__":
    main()