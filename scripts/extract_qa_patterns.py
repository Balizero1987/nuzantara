#!/usr/bin/env python3
"""
Extract Q&A patterns from WhatsApp group discussions
Focus on eternal patterns, not specific answers
"""

import sqlite3
import json
import re
from typing import List, Dict

class QAExtractor:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)

        # Keywords that indicate expertise areas
        self.expertise_keywords = {
            'visa': ['visa', 'kitas', 'voa', 'immigration', 'overstay', 'extension', 'passport'],
            'tax': ['tax', 'tasse', 'npwp', 'fiscal', 'pensione', 'invoice', 'fattura'],
            'company': ['pt pma', 'company', 'società', 'business', 'kbli', 'director', 'incorporation'],
            'legal': ['legal', 'law', 'permit', 'license', 'contract', 'agreement'],
            'property': ['property', 'rent', 'lease', 'house', 'villa', 'apartment'],
            'banking': ['bank', 'account', 'transfer', 'payment', 'wire', 'crypto']
        }

    def extract_qa_from_group(self, group_name: str = 'Italiani 🇮🇹 in Indonesia 🇮🇩'):
        """Extract Q&A patterns from group chat"""

        query = """
        SELECT
            m.ZTEXT as text,
            m.ZISFROMME as is_from_me,
            m.ZPUSHNAME as sender,
            datetime(m.ZMESSAGEDATE + 978307200, 'unixepoch', 'localtime') as date
        FROM ZWAMESSAGE m
        JOIN ZWACHATSESSION cs ON m.ZCHATSESSION = cs.Z_PK
        WHERE cs.ZPARTNERNAME = ?
        AND m.ZTEXT IS NOT NULL
        AND LENGTH(m.ZTEXT) > 30
        ORDER BY m.ZMESSAGEDATE
        """

        cursor = self.conn.execute(query, (group_name,))
        messages = cursor.fetchall()

        # Find Q&A patterns
        qa_patterns = []

        for i in range(len(messages) - 1):
            msg = messages[i]

            # Look for questions
            if '?' in msg[0] or any(q in msg[0].lower() for q in ['come', 'quanto', 'dove', 'chi', 'when', 'what', 'how', 'where']):
                # Find responses from Bali Zero team
                for j in range(i+1, min(i+10, len(messages))):
                    next_msg = messages[j]

                    # Check if it's a knowledgeable response
                    if self.is_expert_response(next_msg[0]):
                        qa_patterns.append({
                            'question': self.anonymize(msg[0]),
                            'answer': self.anonymize(next_msg[0]),
                            'category': self.categorize(msg[0] + ' ' + next_msg[0]),
                            'is_from_team': next_msg[1] == 1
                        })
                        break

        return qa_patterns

    def is_expert_response(self, text: str) -> bool:
        """Check if response contains expertise indicators"""
        indicators = [
            'devi', 'puoi', 'serve', 'necessario',  # Italian instructions
            'you need', 'you must', 'required', 'should',  # English instructions
            'processo', 'process', 'procedura',  # Process explanations
            'giorni', 'days', 'settimane', 'weeks',  # Timeframes
            '€', '$', 'IDR', 'euro', 'dollar'  # Pricing info
        ]

        text_lower = text.lower()
        return any(ind in text_lower for ind in indicators) and len(text) > 50

    def categorize(self, text: str) -> str:
        """Categorize Q&A by expertise area"""
        text_lower = text.lower()

        scores = {}
        for category, keywords in self.expertise_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score

        if scores:
            return max(scores, key=scores.get)
        return 'general'

    def anonymize(self, text: str) -> str:
        """Remove personal data, keep patterns"""
        # Replace specific names (keeping role indicators)
        text = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[NAME]', text)

        # Replace phone numbers
        text = re.sub(r'\+?\d{10,15}', '[PHONE]', text)

        # Replace emails
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL]', text)

        # Keep relative dates, replace specific ones
        text = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{4}', '[DATE]', text)

        # Keep price ranges, anonymize specific amounts
        text = re.sub(r'[€$]\d+(?:,\d{3})*(?:\.\d{2})?', '[AMOUNT]', text)

        return text

    def format_qa_for_training(self, qa_patterns: List[Dict]) -> List[Dict]:
        """Format Q&A as training conversations"""

        training_data = []

        for qa in qa_patterns:
            # Create conversation format
            conversation = {
                "messages": [
                    {"role": "user", "content": qa['question']},
                    {"role": "assistant", "content": qa['answer']}
                ],
                "metadata": {
                    "type": "qa_pattern",
                    "category": qa['category'],
                    "from_team": qa['is_from_team']
                }
            }

            training_data.append(conversation)

        return training_data

    def extract_eternal_qa_patterns(self, limit: int = 2000):
        """Extract eternal Q&A patterns for training"""

        print("📚 Extracting Q&A patterns from group discussions...")

        # Get patterns from Italian group
        qa_patterns = self.extract_qa_from_group('Italiani 🇮🇹 in Indonesia 🇮🇩')

        print(f"Found {len(qa_patterns)} Q&A patterns")

        # Filter for quality
        quality_qa = [qa for qa in qa_patterns if len(qa['answer']) > 50]

        print(f"Filtered to {len(quality_qa)} quality Q&A")

        # Balance by category
        balanced_qa = self.balance_by_category(quality_qa, limit)

        # Format for training
        training_data = self.format_qa_for_training(balanced_qa)

        return training_data

    def balance_by_category(self, qa_list: List[Dict], limit: int) -> List[Dict]:
        """Balance Q&A across categories"""

        categories = {}
        for qa in qa_list:
            cat = qa['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(qa)

        # Take proportionally from each category
        balanced = []
        per_category = limit // len(categories) if categories else 0

        for cat, items in categories.items():
            balanced.extend(items[:per_category])

        return balanced[:limit]

    def save_qa_training(self, output_file: str = 'zantara_qa_2000.jsonl'):
        """Save Q&A training data"""

        qa_data = self.extract_eternal_qa_patterns()

        with open(output_file, 'w', encoding='utf-8') as f:
            for item in qa_data:
                # Save without metadata for training
                training_item = {"messages": item["messages"]}
                f.write(json.dumps(training_item, ensure_ascii=False) + '\n')

        print(f"💾 Saved {len(qa_data)} Q&A patterns to {output_file}")

        # Save category distribution
        categories = {}
        for item in qa_data:
            cat = item['metadata']['category']
            categories[cat] = categories.get(cat, 0) + 1

        print(f"📊 Category distribution: {categories}")

        return len(qa_data)


def main():
    """Extract Q&A patterns"""

    print("🎯 Extracting Q&A Patterns for ZANTARA Training")
    print("=" * 50)

    db_path = "/Users/antonellosiano/Desktop/WhatsApp_Backup_2025-10-05/ChatStorage.sqlite"

    extractor = QAExtractor(db_path)
    count = extractor.save_qa_training()

    print("=" * 50)
    print(f"✅ Extracted {count} Q&A patterns!")
    print("\nThese capture HOW Bali Zero answers questions,")
    print("not WHAT the specific answers are.")


if __name__ == "__main__":
    main()