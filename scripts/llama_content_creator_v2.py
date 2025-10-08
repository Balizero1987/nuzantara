#!/usr/bin/env python3
"""
INTEL AUTOMATION - Stage 2B: LLAMA Content Creator v2
Creates ONE markdown file per category with all articles
JSON files stored separately for metadata
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
    os.system("pip install ollama")
    import ollama

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent / "INTEL_SCRAPING"

class LlamaContentCreatorV2:
    """Create consolidated markdown files per category"""
    
    def __init__(self, model_name: str = "llama3.2:3b"):
        self.model_name = model_name
        self.base_dir = BASE_DIR
        self.ensure_ollama_model()
    
    def ensure_ollama_model(self):
        """Ensure LLAMA model is available"""
        try:
            models = ollama.list()
            model_names = [m.model for m in models.models]
            
            if self.model_name not in model_names:
                logger.info(f"Downloading {self.model_name}...")
                ollama.pull(self.model_name)
        except Exception as e:
            logger.error(f"Error setting up Ollama: {e}")
            raise
    
    def create_article_from_rag(self, rag_data: Dict) -> Dict:
        """Generate article from RAG data"""
        
        # Extract key information
        title = rag_data.get('title', 'Untitled')
        summary = rag_data.get('summary', '')
        key_points = rag_data.get('key_points', [])
        category = rag_data.get('category', 'general')
        source_name = rag_data.get('source_name', 'Unknown')
        tier = rag_data.get('tier', 3)
        
        # Build context for article generation
        context = f"""
Title: {title}
Summary: {summary}
Category: {category}
Source: {source_name} (Tier {tier})

Key Points:
{chr(10).join(f'- {point}' for point in key_points)}
"""
        
        prompt = f"""You are a professional journalist writing for expats and digital nomads in Bali, Indonesia.

Based on this information:
{context}

Write a compelling, journalistic article that:
1. Has a CLEAR, DESCRIPTIVE TITLE (not "Untitled")
2. Opens with a strong lead paragraph that hooks the reader
3. Provides actionable information for expats/digital nomads
4. Uses a conversational yet professional tone
5. Is 400-600 words
6. Ends with a practical takeaway or call-to-action

Return ONLY valid JSON with this structure:
{{
  "title": "Compelling, descriptive title here",
  "content": "Full article content in markdown format"
}}

Write the article now:"""
        
        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={'temperature': 0.7}
            )
            
            text = response['response'].strip()

            # Extract JSON
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            # Clean control characters
            import re
            text = re.sub(r'[\x00-\x1F\x7F]', ' ', text)

            # Try JSON parsing first
            try:
                article_data = json.loads(text)
            except json.JSONDecodeError:
                # Fallback: extract with regex
                title_match = re.search(r'"title"\s*:\s*"([^"]+)"', text)
                content_match = re.search(r'"content"\s*:\s*"(.*?)"\s*[}\]]', text, re.DOTALL)

                if title_match and content_match:
                    article_data = {
                        'title': title_match.group(1).strip(),
                        'content': content_match.group(1).replace('\\n', '\n').strip()
                    }
                else:
                    # Last resort: use RAG title and LLAMA text as content
                    article_data = {
                        'title': title or 'Article from RAG',
                        'content': text.strip()
                    }

            # Add metadata
            article_data.update({
                'source_document': rag_data.get('source_url', ''),
                'source_name': source_name,
                'source_tier': tier,
                'category': category,
                'created_at': datetime.now().isoformat(),
                'word_count': len(article_data.get('content', '').split()),
                'model_used': self.model_name
            })

            return article_data

        except Exception as e:
            logger.error(f"Error generating article: {e}")
            return None
    
    def process_category(self, category: str):
        """Process all RAG files in category and create ONE markdown file"""
        
        rag_dir = self.base_dir / category / "rag"
        articles_json_dir = self.base_dir / category / "articles_json"
        output_md_file = self.base_dir / category / f"{category}_articles.md"
        
        # Create directories
        articles_json_dir.mkdir(parents=True, exist_ok=True)
        
        if not rag_dir.exists():
            logger.warning(f"No RAG directory for {category}")
            return
        
        rag_files = list(rag_dir.glob("*.json"))
        logger.info(f"Processing {len(rag_files)} RAG files in {category}")
        
        # Collect all articles
        all_articles = []
        
        for rag_file in rag_files:
            # Check if already processed
            json_file = articles_json_dir / f"article_{rag_file.stem}.json"
            
            if json_file.exists():
                # Load existing
                with open(json_file) as f:
                    article_data = json.load(f)
                all_articles.append(article_data)
                continue
            
            # Load RAG data
            with open(rag_file) as f:
                rag_data = json.load(f)
            
            # Generate article
            logger.info(f"Creating article from: {rag_data.get('title', 'Unknown')[:50]}...")
            article_data = self.create_article_from_rag(rag_data)
            
            if article_data:
                # Save JSON
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(article_data, f, ensure_ascii=False, indent=2)
                
                all_articles.append(article_data)
                logger.info(f"✓ Created: {article_data.get('title', 'Untitled')[:60]}")
        
        # Generate consolidated markdown
        if all_articles:
            self.generate_markdown(category, all_articles, output_md_file)
            logger.info(f"✅ Created markdown: {output_md_file}")
        
        logger.info(f"Processed {len(all_articles)} articles in {category}")
    
    def generate_markdown(self, category: str, articles: List[Dict], output_file: Path):
        """Generate consolidated markdown file for category"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # Header
            f.write(f"# {category.replace('_', ' ').title()} - Intelligence Report\n\n")
            f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Total Articles:** {len(articles)}\n")
            f.write(f"**Model:** llama3.2:3b\n\n")
            f.write("---\n\n")
            
            # Table of Contents
            f.write("## Table of Contents\n\n")
            for i, article in enumerate(articles, 1):
                title = article.get('title', 'Untitled')
                anchor = title.lower().replace(' ', '-').replace(',', '').replace(':', '')
                f.write(f"{i}. [{title}](#{anchor})\n")
            f.write("\n---\n\n")
            
            # Articles
            for i, article in enumerate(articles, 1):
                title = article.get('title', 'Untitled')
                content = article.get('content', '')
                source = article.get('source_name', 'Unknown')
                tier = article.get('source_tier', '?')
                words = article.get('word_count', 0)
                date = article.get('created_at', '')[:10]
                
                f.write(f"## {i}. {title}\n\n")
                f.write(f"**Source:** {source} (Tier {tier}) | ")
                f.write(f"**Words:** {words} | ")
                f.write(f"**Date:** {date}\n\n")
                f.write(f"{content}\n\n")
                f.write("---\n\n")
            
            # Footer
            f.write(f"\n## Report Statistics\n\n")
            f.write(f"- **Total Articles:** {len(articles)}\n")
            f.write(f"- **Total Words:** {sum(a.get('word_count', 0) for a in articles)}\n")
            f.write(f"- **Sources:** {len(set(a.get('source_name') for a in articles))}\n")
            f.write(f"- **Average Length:** {sum(a.get('word_count', 0) for a in articles) // len(articles)} words\n\n")
            f.write("*Generated by Bali Zero Intel Automation System*\n")
    
    def process_all(self):
        """Process all categories"""
        logger.info("=" * 70)
        logger.info("INTEL AUTOMATION - STAGE 2B: CONTENT CREATION V2")
        logger.info(f"Model: {self.model_name}")
        logger.info(f"Starting at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)
        
        categories = [d.name for d in self.base_dir.iterdir() if d.is_dir()]
        
        for category in sorted(categories):
            logger.info(f"\n📝 Processing: {category}")
            self.process_category(category)
        
        logger.info("=" * 70)
        logger.info("CONTENT CREATION COMPLETE")
        logger.info(f"Ended at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 70)

def main():
    """Main entry point"""
    creator = LlamaContentCreatorV2()
    creator.process_all()

if __name__ == "__main__":
    main()
