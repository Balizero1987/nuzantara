#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 2A: LLAMA RAG Processor
Processes scraped content for ChromaDB using local LLAMA 3.2
Cost: $0 (fully local)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import logging
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import ollama
except ImportError:
    print("Installing ollama...")
    os.system("pip install ollama")
    import ollama

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    print("Installing chromadb...")
    os.system("pip install chromadb")
    import chromadb
    from chromadb.config import Settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Directories
BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"
CHROMA_DIR = Path(__file__).parent.parent / "data" / "chroma_db"

class LlamaRAGProcessor:
    """Process scraped content for RAG using LLAMA 3.2"""

    def __init__(self, model_name: str = "llama3.2:3b"):
        self.model_name = model_name
        self.base_dir = BASE_DIR

        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False)
        )

        # Create collections for each category
        self.collections = {}
        self.ensure_ollama_model()

    def ensure_ollama_model(self):
        """Ensure LLAMA model is available"""
        try:
            # Check if model exists
            models = ollama.list()
            model_names = [m.model for m in models.models]

            if self.model_name not in model_names:
                logger.info(f"Downloading {self.model_name}... This may take a few minutes.")
                ollama.pull(self.model_name)
                logger.info(f"Model {self.model_name} ready!")
        except Exception as e:
            logger.error(f"Error setting up Ollama: {e}")
            logger.info("Please ensure Ollama is installed: https://ollama.com")
            raise

    def get_or_create_collection(self, category: str):
        """Get or create ChromaDB collection for category"""
        collection_name = f"bali_intel_{category}"

        if category not in self.collections:
            try:
                self.collections[category] = self.chroma_client.get_collection(collection_name)
                logger.info(f"Using existing collection: {collection_name}")
            except:
                self.collections[category] = self.chroma_client.create_collection(
                    name=collection_name,
                    metadata={"category": category}
                )
                logger.info(f"Created new collection: {collection_name}")

        return self.collections[category]

    def process_for_rag(self, document: Dict) -> Optional[Dict]:
        """Process document for RAG storage"""

        prompt = f"""Analyze this scraped content from {document.get('source_name', 'unknown')} and extract structured information for a RAG database.

Content:
{document['content'][:3000]}

Extract and return as JSON:
{{
  "title": "Clear, descriptive title",
  "summary": "2-3 sentence summary of key information",
  "category": "{document['category']}",
  "sub_category": "specific sub-category (visa, tax, property, event, trend, competitor, news)",
  "entities": {{
    "people": ["list of mentioned people"],
    "organizations": ["list of mentioned organizations"],
    "locations": ["list of specific locations mentioned"]
  }},
  "keywords": ["5-10 relevant keywords for search"],
  "dates": {{
    "published": "YYYY-MM-DD if found",
    "effective": "YYYY-MM-DD if mentioned",
    "deadline": "YYYY-MM-DD if mentioned"
  }},
  "impact": {{
    "level": "critical|high|medium|low",
    "affected_groups": ["tourists", "expats", "investors", "businesses", "workers"],
    "action_required": true/false,
    "urgency": "immediate|soon|future|informational"
  }},
  "language": {{
    "primary": "en|id|other",
    "needs_translation": true/false
  }},
  "tier": {document.get('tier', 3)},
  "source_reliability": "official|accredited|community",
  "key_points": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "regulatory_changes": ["if any regulatory changes mentioned"],
  "business_implications": "Brief description of business impact if relevant"
}}

Return ONLY valid JSON, no other text."""

        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={'temperature': 0.3}  # Lower temperature for structured extraction
            )

            # Parse response
            text = response['response'].strip()

            # Clean up markdown if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            # Try to extract JSON (improved handling)
            rag_data = self.extract_json_from_text(text)

            if rag_data is None:
                logger.error(f"Failed to parse LLAMA response as JSON")
                logger.debug(f"Response was: {text[:500]}")
                return None

            # Add original metadata
            rag_data['source_url'] = document['url']
            rag_data['source_name'] = document['source_name']
            rag_data['scraped_at'] = document['scraped_at']
            rag_data['content_hash'] = document['content_hash']
            rag_data['word_count'] = document['word_count']

            return rag_data

        except Exception as e:
            logger.error(f"Error processing document: {e}")
            return None

    def extract_json_from_text(self, text: str) -> Optional[Dict]:
        """Extract JSON from text, even if wrapped in other content"""
        import re

        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to find JSON block in text
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(json_pattern, text, re.DOTALL)

        for match in matches:
            try:
                parsed = json.loads(match)
                # Verify it has expected fields
                if 'title' in parsed or 'summary' in parsed:
                    return parsed
            except json.JSONDecodeError:
                continue

        # Last attempt: look for key-value pairs and construct JSON
        logger.warning("Could not extract valid JSON from response")
        return None

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using LLAMA"""
        try:
            # LLAMA can generate embeddings
            response = ollama.embeddings(
                model=self.model_name,
                prompt=text[:2000]  # Limit text length
            )
            return response['embedding']
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Fallback to simple hash-based pseudo-embedding
            hash_obj = hashlib.sha256(text.encode())
            # Create a simple 384-dimensional embedding from hash
            embedding = []
            for i in range(48):  # 48 * 8 = 384 dimensions
                byte_slice = hash_obj.digest()[i % 32]
                for j in range(8):
                    bit = (byte_slice >> j) & 1
                    embedding.append(float(bit))
            return embedding

    def clean_metadata_value(self, value):
        """Clean metadata value - remove None, convert to string if needed"""
        if value is None or value == '':
            return 'unknown'
        if isinstance(value, (list, dict)):
            return json.dumps(value)
        return str(value)

    def save_to_chromadb(self, rag_data: Dict, category: str, original_content: str):
        """Save processed data to ChromaDB"""
        collection = self.get_or_create_collection(category)

        # Prepare document text for embedding
        doc_text = f"""
Title: {rag_data.get('title', '')}
Summary: {rag_data.get('summary', '')}
Keywords: {', '.join(rag_data.get('keywords', []))}
Key Points: {' '.join(rag_data.get('key_points', []))}

{original_content[:1000]}
"""

        # Generate embedding
        embedding = self.generate_embedding(doc_text)

        # Prepare metadata (ChromaDB requires simple types, NO None values)
        raw_metadata = {
            'title': rag_data.get('title', ''),
            'summary': rag_data.get('summary', ''),
            'source_name': rag_data.get('source_name', ''),
            'source_url': rag_data.get('source_url', ''),
            'tier': str(rag_data.get('tier', 3)),
            'impact_level': rag_data.get('impact', {}).get('level', 'low'),
            'urgency': rag_data.get('impact', {}).get('urgency', 'informational'),
            'action_required': str(rag_data.get('impact', {}).get('action_required', False)),
            'published_date': rag_data.get('dates', {}).get('published'),
            'effective_date': rag_data.get('dates', {}).get('effective'),
            'deadline_date': rag_data.get('dates', {}).get('deadline'),
            'scraped_at': rag_data.get('scraped_at', ''),
            'content_hash': rag_data.get('content_hash', ''),
            'keywords': rag_data.get('keywords', []),
            'affected_groups': rag_data.get('impact', {}).get('affected_groups', []),
            'category': category,
            'sub_category': rag_data.get('sub_category', ''),
        }

        # Clean all metadata values (remove None, convert to strings)
        metadata = {k: self.clean_metadata_value(v) for k, v in raw_metadata.items()}

        # Add to collection
        try:
            collection.add(
                documents=[doc_text],
                embeddings=[embedding],
                metadatas=[metadata],
                ids=[rag_data['content_hash']]
            )
            logger.info(f"Saved to ChromaDB: {rag_data.get('title', 'Untitled')[:50]}...")
            return True
        except Exception as e:
            if "already exists" in str(e):
                logger.info(f"Document already in ChromaDB: {rag_data['content_hash']}")
            else:
                logger.error(f"Error saving to ChromaDB: {e}")
            return False

    def process_category(self, category: str):
        """Process all raw documents in a category"""
        raw_dir = self.base_dir / category / "raw"
        rag_dir = self.base_dir / category / "rag"
        rag_dir.mkdir(parents=True, exist_ok=True)

        if not raw_dir.exists():
            logger.warning(f"No raw directory for {category}")
            return

        json_files = list(raw_dir.glob("*.json"))
        logger.info(f"Processing {len(json_files)} files in {category}")

        processed = 0
        for json_file in json_files:
            # Check if already processed
            rag_file = rag_dir / json_file.name
            if rag_file.exists():
                logger.info(f"Already processed: {json_file.name}")
                continue

            # Load document
            with open(json_file, 'r', encoding='utf-8') as f:
                document = json.load(f)

            # Process for RAG
            try:
                logger.info(f"Processing: {document.get('title', json_file.name)[:50]}...")
                rag_data = self.process_for_rag(document)

                if rag_data:
                    # Save RAG data
                    with open(rag_file, 'w', encoding='utf-8') as f:
                        json.dump(rag_data, f, ensure_ascii=False, indent=2)

                    # Save to ChromaDB
                    self.save_to_chromadb(rag_data, category, document['content'])
                    processed += 1
                else:
                    logger.warning(f"Skipping {json_file.name} - no RAG data generated")
            except Exception as e:
                logger.error(f"Error processing {json_file.name}: {e}")
                continue

        logger.info(f"Processed {processed} new documents in {category}")

    def process_all(self, max_workers: int = 4):
        """Process all categories in parallel"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 2A: RAG PROCESSING (PARALLEL)")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"Max Workers: {max_workers}")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]

        # Process categories in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all category processing tasks
            future_to_category = {
                executor.submit(self.process_category, category): category
                for category in categories
            }

            # Process results as they complete
            for future in as_completed(future_to_category):
                category = future_to_category[future]
                try:
                    future.result()
                    logger.info(f"✓ Completed: {category}")
                except Exception as e:
                    logger.error(f"✗ Failed {category}: {str(e)}")

        # Generate RAG summary
        self.generate_rag_summary()

        logger.info("=" * 70)
        logger.info("RAG PROCESSING COMPLETE")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

    def generate_rag_summary(self):
        """Generate summary of RAG processing"""
        summary_file = self.base_dir / f"rag_summary_{datetime.now().strftime('%Y%m%d')}.md"

        with open(summary_file, 'w') as f:
            f.write(f"# RAG Processing Summary\n\n")
            f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**Model**: {self.model_name}\n\n")

            f.write("## Collections Status\n\n")

            for name, collection in self.collections.items():
                count = collection.count()
                f.write(f"- **{name}**: {count} documents\n")

            f.write(f"\n## Processing Details\n\n")

            categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]
            for category in categories:
                rag_dir = self.base_dir / category / "rag"
                if rag_dir.exists():
                    count = len(list(rag_dir.glob("*.json")))
                    f.write(f"- **{category}**: {count} documents processed\n")

            f.write(f"\n---\n")
            f.write(f"*Generated at {datetime.now().strftime('%H:%M:%S')}*\n")


def main():
    """Main entry point"""
    processor = LlamaRAGProcessor()
    processor.process_all()


if __name__ == "__main__":
    main()