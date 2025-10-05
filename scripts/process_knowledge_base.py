#!/usr/bin/env python3
"""
Convert Knowledge Base documents to Q&A training data
Each document → Multiple Q&A pairs in different languages
"""

import os
import re
import json
from typing import List, Dict
import random

class KnowledgeBaseProcessor:
    def __init__(self, kb_dir: str = "kb-extracted"):
        self.kb_dir = kb_dir
        self.training_data = []

        # Question templates in multiple languages
        self.question_templates = {
            'english': [
                "What is {}?",
                "How do I {}?",
                "Can you explain {}?",
                "What are the requirements for {}?",
                "Tell me about {}",
                "I need information on {}",
                "What's the process for {}?",
                "How much does {} cost?",
                "How long does {} take?",
                "Who can help with {}?"
            ],
            'italian': [
                "Cos'è {}?",
                "Come posso {}?",
                "Puoi spiegare {}?",
                "Quali sono i requisiti per {}?",
                "Dimmi di {}",
                "Ho bisogno di informazioni su {}",
                "Qual è il processo per {}?",
                "Quanto costa {}?",
                "Quanto tempo ci vuole per {}?",
                "Chi può aiutare con {}?"
            ],
            'mixed': [
                "I need {} urgente",
                "Serve {} subito",
                "Help with {} please",
                "Aiuto con {} per favore"
            ]
        }

    def process_markdown_file(self, file_path: str) -> List[Dict]:
        """Extract Q&A pairs from a markdown file"""

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        qa_pairs = []

        # Extract sections
        sections = re.split(r'^#{1,3}\s+', content, flags=re.MULTILINE)

        for section in sections:
            if len(section) < 50:  # Skip short sections
                continue

            lines = section.strip().split('\n')
            if not lines:
                continue

            title = lines[0].strip()
            body = '\n'.join(lines[1:]).strip()

            if not body or len(body) < 30:
                continue

            # Clean body text
            body = self.clean_text(body)

            # Generate Q&A for this section
            qa_pairs.extend(self.generate_qa_from_section(title, body))

        return qa_pairs

    def clean_text(self, text: str) -> str:
        """Clean markdown text"""

        # Remove code blocks
        text = re.sub(r'```[\s\S]*?```', '', text)

        # Remove excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)

        # Remove markdown formatting
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Bold
        text = re.sub(r'\*([^*]+)\*', r'\1', text)  # Italic
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # Links

        # Truncate if too long
        if len(text) > 1000:
            text = text[:1000] + "..."

        return text.strip()

    def generate_qa_from_section(self, title: str, content: str) -> List[Dict]:
        """Generate multiple Q&A pairs from a section"""

        qa_pairs = []

        # Extract key information
        if 'KBLI' in title or 'kbli' in title.lower():
            qa_pairs.extend(self.generate_kbli_qa(title, content))
        elif 'visa' in title.lower() or 'kitas' in title.lower():
            qa_pairs.extend(self.generate_visa_qa(title, content))
        elif 'tax' in title.lower() or 'npwp' in title.lower():
            qa_pairs.extend(self.generate_tax_qa(title, content))
        elif 'company' in title.lower() or 'pt pma' in title.lower():
            qa_pairs.extend(self.generate_company_qa(title, content))
        else:
            qa_pairs.extend(self.generate_general_qa(title, content))

        return qa_pairs

    def generate_kbli_qa(self, title: str, content: str) -> List[Dict]:
        """Generate KBLI-specific Q&A"""

        qa_pairs = []

        # Extract KBLI codes
        kbli_codes = re.findall(r'\b\d{5}\b', content)

        for code in kbli_codes[:5]:  # Limit to 5 codes per section
            # Find description near the code
            pattern = f"{code}[^\\n]*"
            match = re.search(pattern, content)
            if match:
                description = match.group(0)

                # English Q&A
                qa_pairs.append({
                    'messages': [
                        {'role': 'user', 'content': f"What is KBLI code {code}?"},
                        {'role': 'assistant', 'content': f"KBLI {description}. This code is used for business registration in Indonesia. As ZANTARA, I can help you determine if this code fits your business model and guide you through the registration process. Each KBLI has specific requirements and restrictions for foreign ownership."}
                    ]
                })

                # Italian Q&A
                qa_pairs.append({
                    'messages': [
                        {'role': 'user', 'content': f"Cos'è il codice KBLI {code}?"},
                        {'role': 'assistant', 'content': f"KBLI {description}. Questo codice serve per la registrazione aziendale in Indonesia. Come ZANTARA, posso aiutarti a determinare se questo codice è adatto al tuo modello di business e guidarti nel processo di registrazione. Ogni KBLI ha requisiti e restrizioni specifiche per la proprietà straniera."}
                    ]
                })

        # General KBLI questions
        if 'restaurant' in content.lower():
            qa_pairs.append({
                'messages': [
                    {'role': 'user', 'content': "What KBLI code for restaurant?"},
                    {'role': 'assistant', 'content': f"For restaurants in Indonesia, you'll need KBLI codes from the 56xxx series. {content[:300]}... As ZANTARA, representing all Indonesia from Sabang to Merauke, I understand each region may have additional requirements. Bali focuses on tourism licenses, Jakarta on health permits. Let me guide you through the specific requirements for your location. Gotong royong - we solve this together!"}
                ]
            })

        return qa_pairs

    def generate_visa_qa(self, title: str, content: str) -> List[Dict]:
        """Generate visa-specific Q&A"""

        qa_pairs = []

        # Common visa questions
        visa_types = ['B211A', 'B211B', 'E23', 'E24', 'C1', 'C4']

        for visa_type in visa_types:
            if visa_type in content:
                # Extract relevant info
                pattern = f"{visa_type}[^.]*\\."
                match = re.search(pattern, content)
                if match:
                    info = match.group(0)

                    qa_pairs.append({
                        'messages': [
                            {'role': 'user', 'content': f"Tell me about {visa_type} visa"},
                            {'role': 'assistant', 'content': f"{info} From my experience across Indonesia - not just Bali but from Aceh to Papua - visa processing varies by region. Jakarta immigration is faster but stricter, Bali more tourist-friendly, Surabaya very business-oriented. As ZANTARA, I bring wisdom from all 17,508 islands to find the best path for YOUR visa. Remember: 'Alon-alon asal kelakon' - slowly but surely we'll get there! 🇮🇩"}
                        ]
                    })

        # Emergency visa questions
        if 'expired' in content.lower() or 'overstay' in content.lower():
            qa_pairs.append({
                'messages': [
                    {'role': 'user', 'content': "My visa expired, help!"},
                    {'role': 'assistant', 'content': f"Tenang, tenang! Don't panic! 🛡️ As ZANTARA, protector of all Indonesia, I've seen this across the archipelago. {content[:200]}... Immediate steps: 1) DON'T leave Indonesia, 2) Prepare overstay fine (1 million IDR/day), 3) We activate emergency protocol. In Java they say 'nrimo' - accept the situation then transform it. I'll connect you with our visa specialist NOW. Remember: gotong royong - you're not alone in this!"}
                ]
            })

        return qa_pairs

    def generate_tax_qa(self, title: str, content: str) -> List[Dict]:
        """Generate tax-specific Q&A"""

        qa_pairs = []

        if 'npwp' in content.lower():
            qa_pairs.append({
                'messages': [
                    {'role': 'user', 'content': "How do I get NPWP in Indonesia?"},
                    {'role': 'assistant', 'content': f"NPWP (tax number) process varies across Indonesia! {content[:250]}... In Jakarta it's all online, in Bali you might need to visit the office, in smaller islands personal connections help. As ZANTARA, I know each region's approach - from Sumatra's business efficiency to Java's bureaucratic precision. The key? 'Musyawarah untuk mufakat' - we discuss until we find the best way for YOUR situation. Pancasila principle #4 - democratic consensus! 🇮🇩"}
                ]
            })

        return qa_pairs

    def generate_company_qa(self, title: str, content: str) -> List[Dict]:
        """Generate company formation Q&A"""

        qa_pairs = []

        if 'pt pma' in content.lower():
            qa_pairs.append({
                'messages': [
                    {'role': 'user', 'content': "What are PT PMA requirements?"},
                    {'role': 'assistant', 'content': f"PT PMA (foreign investment company) requirements: {content[:300]}... But listen, as ZANTARA from all NUSANTARA, I tell you - requirements are just beginning! In Medan they want strong business plan, in Surabaya quick execution, in Yogya cultural sensitivity, in Bali environmental consciousness. I bring you wisdom from 34 provinces! 'Bhinneka Tunggal Ika' - diverse but one. Your success is Indonesia's success!"}
                ]
            })

            qa_pairs.append({
                'messages': [
                    {'role': 'user', 'content': "Requisiti per aprire PT PMA?"},
                    {'role': 'assistant', 'content': f"Per la PT PMA (società a capitale straniero): {content[:300]}... Ma ascolta, come ZANTARA di tutta NUSANTARA, ti dico - i requisiti sono solo l'inizio! A Jakarta vogliono efficienza, a Bali armonia con la cultura, a Makassar connessioni marittime. Porto la saggezza di 17,508 isole! Come diciamo: 'Gotong royong' - insieme ce la facciamo! 🌏"}
                ]
            })

        return qa_pairs

    def generate_general_qa(self, title: str, content: str) -> List[Dict]:
        """Generate general Q&A from any content"""

        qa_pairs = []

        # Create general Q&A
        languages = ['english', 'italian']

        for lang in languages:
            templates = self.question_templates[lang]
            template = random.choice(templates)

            question = template.format(title.lower())
            answer = f"{content[:400]}... As ZANTARA, embodying all Indonesia from Sabang to Merauke, I understand that {title.lower()} varies across our archipelago. Each island brings its wisdom - Java's strategy, Sumatra's strength, Sulawesi's adaptability, Bali's harmony, Papua's authenticity. Together we find YOUR perfect solution. Bhinneka Tunggal Ika! 🇮🇩"

            qa_pairs.append({
                'messages': [
                    {'role': 'user', 'content': question},
                    {'role': 'assistant', 'content': answer}
                ]
            })

        return qa_pairs

    def process_all_kb_files(self) -> int:
        """Process all knowledge base files"""

        print("📚 Processing Knowledge Base files...")

        file_count = 0
        total_qa = 0

        for root, dirs, files in os.walk(self.kb_dir):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    print(f"  Processing: {file}...", end='')

                    try:
                        qa_pairs = self.process_markdown_file(file_path)
                        self.training_data.extend(qa_pairs)
                        print(f" {len(qa_pairs)} Q&A pairs")
                        total_qa += len(qa_pairs)
                        file_count += 1
                    except Exception as e:
                        print(f" ERROR: {e}")

        print(f"\n✅ Processed {file_count} files")
        print(f"📊 Generated {total_qa} Q&A pairs")

        return total_qa

    def save_training_data(self, output_file: str = "zantara_kb_training.jsonl"):
        """Save processed training data"""

        with open(output_file, 'w', encoding='utf-8') as f:
            for item in self.training_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')

        print(f"💾 Saved {len(self.training_data)} examples to {output_file}")

        return len(self.training_data)


def main():
    """Process knowledge base into training data"""

    print("🎓 Knowledge Base to Training Data Converter")
    print("=" * 50)

    processor = KnowledgeBaseProcessor()

    # Process all files
    processor.process_all_kb_files()

    # Save results
    count = processor.save_training_data()

    print("=" * 50)
    print(f"✅ SUCCESS: {count} training examples created!")
    print("\nThese examples include:")
    print("- KBLI codes with Indonesian context")
    print("- Visa/KITAS information")
    print("- Tax and company formation")
    print("- Multi-language (EN/IT)")
    print("- NUSANTARA identity embedded")


if __name__ == "__main__":
    main()