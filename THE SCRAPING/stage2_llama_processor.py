#!/usr/bin/env python3
"""
STAGE 2: AI Processing with LLAMA 3.2 (Local)
Dual-branch processing: RAG preparation + Article generation
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import logging

try:
    import ollama
except ImportError:
    print("⚠️ Ollama not installed. Installing...")
    os.system("pip install ollama")
    import ollama

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    print("⚠️ ChromaDB not installed. Installing...")
    os.system("pip install chromadb")
    import chromadb
    from chromadb.config import Settings

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LlamaProcessor:
    """LLAMA 3.2 processor for dual-branch AI processing"""
    
    def __init__(self, model: str = "llama3.2:3b"):
        self.model = model
        self.intel_dir = Path("./INTEL_SCRAPING")
        self.articles_dir = Path("./data/articles")
        self.rag_ready_dir = Path("./data/rag_ready")
        self.logs_dir = Path("./logs")
        
        # Create directories
        for dir_path in [self.articles_dir, self.rag_ready_dir, self.logs_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path="./data/chromadb",
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Verify LLAMA is available
        self.verify_llama()
        
        logger.info(f"✅ LlamaProcessor initialized with model: {self.model}")
    
    def verify_llama(self) -> bool:
        """Verify LLAMA model is available"""
        try:
            # Try to list models
            models = ollama.list()
            model_names = [m['name'] for m in models.get('models', [])]
            
            if self.model not in model_names and f"{self.model}:latest" not in model_names:
                logger.warning(f"⚠️ Model {self.model} not found. Pulling...")
                ollama.pull(self.model)
            
            logger.info(f"✅ LLAMA model verified: {self.model}")
            return True
        except Exception as e:
            logger.error(f"❌ LLAMA verification failed: {str(e)}")
            logger.info("💡 Install Ollama: https://ollama.ai/download")
            logger.info(f"💡 Then run: ollama pull {self.model}")
            return False
    
    def process_for_rag(self, content: Dict) -> Dict:
        """BRANCH A: Clean and structure content for RAG/ChromaDB"""
        
        prompt = f"""Clean and structure this content for a RAG knowledge base.

Original URL: {content['url']}
Title: {content['title']}
Category: {content['category']}

Content:
{content['content'][:3000]}  # Limit to prevent token overflow

Instructions:
1. Extract key facts and information
2. Remove ads, navigation, footers
3. Structure in clear sections
4. Add metadata tags
5. Keep factual, concise

Output format:
{{
  "title": "...",
  "summary": "...",
  "key_facts": ["...", "..."],
  "topics": ["...", "..."],
  "clean_content": "..."
}}

JSON output only:"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                options={
                    'temperature': 0.3,  # Low temperature for factual extraction
                }
            )
            
            # Parse JSON response
            rag_content = json.loads(response['message']['content'])
            
            # Add metadata
            rag_content['source_url'] = content['url']
            rag_content['category'] = content['category']
            rag_content['scraped_at'] = content['scraped_at']
            rag_content['processed_at'] = datetime.now().isoformat()
            
            logger.info(f"✅ RAG processed: {content['url']}")
            return rag_content
            
        except Exception as e:
            logger.error(f"❌ RAG processing failed: {str(e)}")
            return None
    
    def process_for_article(self, content: Dict) -> Dict:
        """BRANCH B: Generate human-readable journalistic article"""
        
        category_info = self.get_category_info(content['category'])
        
        prompt = f"""Transform this scraped content into a high-quality journalistic article.

Source: {content['url']}
Category: {content['category']} (Agent: {category_info.get('agent', 'Unknown')})
Title: {content['title']}

Raw Content:
{content['content'][:3000]}

Instructions:
1. Write in engaging journalistic style
2. Clear headline and subheadline
3. Well-structured paragraphs
4. Include quotes if present
5. Add context and analysis
6. Professional but accessible tone
7. 300-500 words
8. Language: English (or Indonesian if source is Indonesian)

Output format:
{{
  "headline": "...",
  "subheadline": "...",
  "article_body": "...",
  "key_points": ["...", "..."],
  "tags": ["...", "..."],
  "word_count": 0,
  "language": "en|id"
}}

JSON output only:"""

        try:
            response = ollama.chat(
                model=self.model,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }],
                options={
                    'temperature': 0.7,  # Higher temperature for creative writing
                }
            )
            
            # Parse JSON response
            article = json.loads(response['message']['content'])
            
            # Add metadata
            article['source_url'] = content['url']
            article['category'] = content['category']
            article['agent'] = category_info.get('agent', 'Unknown')
            article['scraped_at'] = content['scraped_at']
            article['processed_at'] = datetime.now().isoformat()
            article['llama_model'] = self.model
            
            logger.info(f"✅ Article generated: {article['headline'][:50]}...")
            return article
            
        except Exception as e:
            logger.error(f"❌ Article generation failed: {str(e)}")
            return None
    
    def get_category_info(self, category: str) -> Dict:
        """Get category configuration"""
        try:
            with open("./profiles/categories.json") as f:
                categories = json.load(f)
            return categories.get(category, {})
        except:
            return {}
    
    def save_to_chromadb(self, rag_content: Dict) -> bool:
        """Save RAG-ready content to ChromaDB"""
        try:
            collection_name = f"intel_{rag_content['category']}"
            collection = self.chroma_client.get_or_create_collection(
                name=collection_name,
                metadata={"category": rag_content['category']}
            )
            
            # Create document ID
            doc_id = f"{rag_content['category']}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Add to ChromaDB
            collection.add(
                documents=[rag_content['clean_content']],
                metadatas=[{
                    "title": rag_content['title'],
                    "source_url": rag_content['source_url'],
                    "category": rag_content['category'],
                    "scraped_at": rag_content['scraped_at'],
                    "processed_at": rag_content['processed_at']
                }],
                ids=[doc_id]
            )
            
            logger.info(f"✅ Saved to ChromaDB: {collection_name}/{doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ ChromaDB save failed: {str(e)}")
            return False
    
    def save_article(self, article: Dict) -> Path:
        """Save article to file"""
        category_dir = self.articles_dir / article['category']
        category_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{article['category']}_{timestamp}.json"
        filepath = category_dir / filename
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(article, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Article saved: {filepath}")
        return filepath
    
    def send_email_report(self, category: str, articles: List[Dict]) -> bool:
        """Send email report for RAG-only categories"""
        category_info = self.get_category_info(category)
        
        if not category_info.get('rag_only'):
            return False
        
        recipients = category_info.get('email_recipients', [])
        if not recipients:
            return False
        
        # Build email content
        subject = f"Intel Report: {category} - {datetime.now().strftime('%Y-%m-%d')}"
        
        body = f"""
<h2>Intelligence Report: {category}</h2>
<p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
<p><strong>Articles:</strong> {len(articles)}</p>

<hr>

"""
        
        for article in articles:
            body += f"""
<h3>{article['headline']}</h3>
<p><em>{article.get('subheadline', '')}</em></p>
<p>{article['article_body'][:500]}...</p>
<p><strong>Source:</strong> <a href="{article['source_url']}">{article['source_url']}</a></p>
<hr>
"""
        
        # TODO: Implement actual email sending with SMTP
        # For now, save to file
        email_file = self.logs_dir / f"email_{category}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(email_file, 'w', encoding='utf-8') as f:
            f.write(body)
        
        logger.info(f"📧 Email report prepared: {email_file}")
        return True
    
    def process_category(self, category: str) -> Dict:
        """Process all scraped content for a category"""
        category_dir = self.intel_dir / category
        
        if not category_dir.exists():
            logger.warning(f"⚠️ Category directory not found: {category}")
            return {"processed": 0, "rag": 0, "articles": 0}
        
        scraped_files = list(category_dir.glob("*.json"))
        logger.info(f"📂 Processing {category}: {len(scraped_files)} files")
        
        rag_count = 0
        article_count = 0
        articles = []
        
        for file in scraped_files:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                
                # BRANCH A: RAG Processing
                rag_content = self.process_for_rag(content)
                if rag_content:
                    if self.save_to_chromadb(rag_content):
                        rag_count += 1
                
                # BRANCH B: Article Generation
                article = self.process_for_article(content)
                if article:
                    self.save_article(article)
                    articles.append(article)
                    article_count += 1
                
            except Exception as e:
                logger.error(f"❌ Error processing {file}: {str(e)}")
        
        # Send email if RAG-only category
        category_info = self.get_category_info(category)
        if category_info.get('rag_only') and articles:
            self.send_email_report(category, articles)
        
        result = {
            "processed": len(scraped_files),
            "rag": rag_count,
            "articles": article_count
        }
        
        logger.info(f"✅ {category}: {rag_count} RAG, {article_count} articles")
        return result
    
    def process_all(self) -> Dict:
        """Process all categories"""
        logger.info("🤖 Starting LLAMA processing for all categories...")
        start_time = datetime.now()
        
        results = {}
        categories = [d.name for d in self.intel_dir.iterdir() if d.is_dir()]
        
        for category in categories:
            results[category] = self.process_category(category)
        
        duration = (datetime.now() - start_time).total_seconds()
        
        summary = {
            "started_at": start_time.isoformat(),
            "completed_at": datetime.now().isoformat(),
            "duration_seconds": duration,
            "categories_processed": len(results),
            "total_rag": sum(r['rag'] for r in results.values()),
            "total_articles": sum(r['articles'] for r in results.values()),
            "results_by_category": results
        }
        
        summary_file = self.logs_dir / f"processing_summary_{start_time.strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"✅ Processing complete: {summary['total_rag']} RAG, {summary['total_articles']} articles in {duration:.0f}s")
        return summary


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="STAGE 2: LLAMA AI Processor")
    parser.add_argument("--category", "-c", help="Process specific category only")
    parser.add_argument("--model", "-m", default="llama3.2:3b", help="LLAMA model to use")
    
    args = parser.parse_args()
    
    processor = LlamaProcessor(model=args.model)
    
    if args.category:
        print(f"🤖 Processing category: {args.category}")
        result = processor.process_category(args.category)
        print(f"✅ Processed: {result['rag']} RAG, {result['articles']} articles")
    else:
        print("🤖 Processing all categories...")
        summary = processor.process_all()
    
    print("\n✅ Processing complete!")


if __name__ == "__main__":
    main()
