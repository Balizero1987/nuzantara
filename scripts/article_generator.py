#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 3: Article Generator
Generates professional articles from RAG-processed data using Ollama
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import logging

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
ARTICLES_DIR = Path(__file__).parent.parent / "INTEL_ARTICLES"

class ArticleGenerator:
    """Generate professional articles from RAG data"""

    def __init__(self, model_name: str = "llama3.2:3b"):
        self.model_name = model_name
        self.articles_dir = ARTICLES_DIR
        self.articles_dir.mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=Settings(anonymized_telemetry=False)
        )

    def get_collection_names(self) -> List[str]:
        """Get all ChromaDB collection names"""
        collections = self.chroma_client.list_collections()
        return [c.name for c in collections]

    def query_collection(self, collection_name: str, limit: int = 10) -> Dict:
        """Query all documents from a collection"""
        try:
            collection = self.chroma_client.get_collection(collection_name)

            # Get all documents
            results = collection.get(
                limit=limit,
                include=['documents', 'metadatas']
            )

            return {
                'count': len(results['ids']),
                'documents': results['documents'],
                'metadatas': results['metadatas']
            }
        except Exception as e:
            logger.error(f"Error querying collection {collection_name}: {e}")
            return {'count': 0, 'documents': [], 'metadatas': []}

    def generate_article(self, category: str, data: Dict) -> str:
        """Generate professional article for a category"""

        if data['count'] == 0:
            logger.warning(f"No data for {category}, skipping article generation")
            return None

        # Prepare context from documents
        context_parts = []
        for i, (doc, meta) in enumerate(zip(data['documents'], data['metadatas'])):
            context_parts.append(f"""
Document {i+1}:
Title: {meta.get('title', 'Untitled')}
Source: {meta.get('source_name', 'Unknown')}
Summary: {meta.get('summary', 'No summary')}
Keywords: {meta.get('keywords', 'N/A')}
Impact Level: {meta.get('impact_level', 'low')}
Urgency: {meta.get('urgency', 'informational')}
""")

        context = "\n".join(context_parts)

        # Map category to article title
        category_titles = {
            'regulatory_changes': 'Latest Regulatory Updates in Indonesia',
            'tax_compliance': 'Tax Compliance Updates for Foreign Businesses',
            'business_setup': 'Business Registration & Setup Guide',
            'employment_law': 'Employment Law Changes in Indonesia',
            'competitor_intel': 'Market Intelligence: Competitor Services Overview',
            'health_safety': 'Health & Safety Updates for Expats',
            'transport_connectivity': 'Transportation & Connectivity Developments',
            'banking_finance': 'Banking & Finance Updates',
            'macro_policy': 'Macro-Economic Policy Changes',
            'events_culture': 'Cultural Events & Lifestyle Updates',
            'social_media': 'Trending Topics & Social Media Insights'
        }

        article_title = category_titles.get(category.replace('bali_intel_', ''), f'{category.replace("_", " ").title()} Updates')

        prompt = f"""You are a professional business intelligence analyst writing for expats and foreign business owners in Indonesia.

Based on the following intel documents, write a comprehensive, professional article for our internal knowledge base.

CATEGORY: {category.replace('bali_intel_', '').replace('_', ' ').title()}

INTEL DOCUMENTS:
{context}

Write a detailed article with the following structure:

# {article_title}

**Published**: {datetime.now().strftime('%B %d, %Y')}
**Category**: {category.replace('bali_intel_', '').replace('_', ' ').title()}

## Executive Summary
[2-3 sentence overview of the most important developments]

## Key Developments

[For each major topic found in the documents, create a subsection with:]
### [Topic Name]
- Clear explanation of the development
- Impact on expats/foreign businesses
- Timeline and deadlines (if any)
- Action items (if any)

## Regulatory Implications
[If applicable: explain any regulatory changes and their impact]

## Business Impact
[Explain how these developments affect foreign businesses operating in Indonesia]

## Practical Recommendations
[Provide 3-5 actionable recommendations based on the intel]

## Sources
[List all sources cited with links]

## Next Steps for Our Team
[Suggest follow-up actions or areas requiring deeper investigation]

---

IMPORTANT GUIDELINES:
- Write in clear, professional business English
- Be concise but comprehensive
- Focus on actionable insights
- Highlight time-sensitive information
- Use bullet points for clarity
- Include specific dates and deadlines when mentioned
- Cite sources appropriately
- Maintain objective, analytical tone
- Prioritize information by impact level (critical > high > medium > low)

Write the complete article now:"""

        try:
            logger.info(f"Generating article for {category}...")
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={'temperature': 0.5, 'num_predict': 2000}
            )

            article_text = response['response'].strip()
            logger.info(f"✓ Generated {len(article_text)} characters for {category}")

            return article_text

        except Exception as e:
            logger.error(f"Error generating article for {category}: {e}")
            return None

    def save_article(self, category: str, article_text: str):
        """Save article to file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        category_name = category.replace('bali_intel_', '')

        # Save markdown version
        md_file = self.articles_dir / f"{timestamp}_{category_name}.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(article_text)

        logger.info(f"Saved article: {md_file.name}")

        # Save JSON metadata
        json_file = self.articles_dir / f"{timestamp}_{category_name}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({
                'category': category_name,
                'generated_at': timestamp,
                'word_count': len(article_text.split()),
                'char_count': len(article_text),
                'file': md_file.name
            }, f, indent=2)

        return md_file

    def generate_all_articles(self):
        """Generate articles for all categories with data"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 3: ARTICLE GENERATION")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        collection_names = self.get_collection_names()
        logger.info(f"Found {len(collection_names)} collections")

        generated_articles = []

        for collection_name in collection_names:
            category = collection_name.replace('bali_intel_', '')

            # Query documents
            data = self.query_collection(collection_name, limit=20)

            if data['count'] == 0:
                logger.info(f"Skipping {category} - no documents")
                continue

            logger.info(f"\n📝 Processing {category} ({data['count']} documents)...")

            # Generate article
            article_text = self.generate_article(category, data)

            if article_text:
                # Save article
                article_file = self.save_article(collection_name, article_text)
                generated_articles.append({
                    'category': category,
                    'file': article_file.name,
                    'document_count': data['count']
                })

        # Generate index
        self.generate_index(generated_articles)

        logger.info("=" * 70)
        logger.info(f"ARTICLE GENERATION COMPLETE - {len(generated_articles)} articles created")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

        return generated_articles

    def generate_index(self, articles: List[Dict]):
        """Generate index file for all articles"""
        index_file = self.articles_dir / "INDEX.md"

        with open(index_file, 'w') as f:
            f.write(f"# Intel Articles Index\n\n")
            f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Articles ({len(articles)} total)\n\n")

            for article in sorted(articles, key=lambda x: x['category']):
                f.write(f"- **{article['category'].replace('_', ' ').title()}** ({article['document_count']} docs) - [{article['file']}]({article['file']})\n")

            f.write(f"\n---\n")
            f.write(f"*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n")

        logger.info(f"Generated index: {index_file.name}")


def main():
    """Main entry point"""
    generator = ArticleGenerator()
    articles = generator.generate_all_articles()

    print(f"\n✅ Generated {len(articles)} articles")
    print(f"📁 Articles saved to: {ARTICLES_DIR}")


if __name__ == "__main__":
    main()
