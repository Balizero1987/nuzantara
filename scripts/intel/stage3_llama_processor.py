#!/usr/bin/env python3
"""
STAGE 3: LLAMA 3.2 Processing - Dual Branch System
====================================================

Branch A: RAG Pipeline (Clean data for ChromaDB)
Branch B: Content Creation (Journalistic articles)

Author: ZANTARA Team
Created: 2025-10-07
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import hashlib

# Ollama for LLAMA 3.2
try:
    import ollama
except ImportError:
    print("❌ Ollama not installed. Run: pip install ollama")
    exit(1)


class LlamaProcessor:
    """LLAMA 3.2 Dual Branch Processor"""
    
    def __init__(self, scraped_dir: str = "THE SCRAPING/scraped", 
                 processed_dir: str = "THE SCRAPING/processed"):
        self.scraped_dir = Path(scraped_dir)
        self.processed_dir = Path(processed_dir)
        self.model = "llama3.2:3b"
        
        # Category pipeline mapping
        self.pipeline_config = {
            "01_immigration": "public",
            "02_business_bkpm": "public",
            "03_real_estate": "public",
            "04_events_culture": "public",
            "05_social_media": "public",
            "06_competitors": "public",
            "07_general_news": "public",
            "08_health_wellness": "public",
            "09_tax_djp": "public",
            "10_jobs_employment": "public",
            "11_lifestyle_living": "public",
            "12_ai_technology": "email_only",
            "13_dev_code_libraries": "email_only",
            "14_future_innovation": "email_only"
        }
    
    def check_ollama(self):
        """Check if Ollama is running and model is available"""
        try:
            models = ollama.list()
            
            # Handle both dict and list responses
            if isinstance(models, dict) and 'models' in models:
                model_list = models['models']
            else:
                model_list = models if isinstance(models, list) else []
            
            # Extract model names (handle various formats)
            model_names = []
            for m in model_list:
                if isinstance(m, dict):
                    name = m.get('name', m.get('model', ''))
                    model_names.append(name)
                elif isinstance(m, str):
                    model_names.append(m)
            
            if self.model not in model_names:
                print(f"❌ Model {self.model} not found. Pulling...")
                ollama.pull(self.model)
                print(f"✅ Model {self.model} pulled successfully")
            else:
                print(f"✅ Model {self.model} is ready")
            return True
        except Exception as e:
            print(f"❌ Ollama error: {e}")
            print("Make sure Ollama is running: ollama serve")
            return False
    
    async def branch_a_rag_pipeline(self, content: str, metadata: Dict) -> Dict:
        """
        BRANCH A: Clean and structure for ChromaDB (RAG)
        
        Args:
            content: Raw markdown content
            metadata: Source metadata
            
        Returns:
            Structured data for ChromaDB
        """
        
        prompt = f"""You are a data cleaning specialist for a RAG database.

Clean and structure this scraped content for semantic search and retrieval.

CONTENT:
{content[:3000]}  # Limit to first 3000 chars

METADATA:
Category: {metadata.get('category', 'unknown')}
Source: {metadata.get('url', 'unknown')}
Date: {metadata.get('scraped_at', 'unknown')}

OUTPUT REQUIRED (JSON format):
{{
  "title_clean": "Clear, concise title without formatting",
  "summary": "2-3 sentence factual summary",
  "category": "{metadata.get('category', 'unknown')}",
  "subcategory": "specific topic (e.g., 'visa_policy', 'tax_regulation')",
  "entities": {{
    "people": ["list of person names mentioned"],
    "organizations": ["list of organizations"],
    "locations": ["list of locations"],
    "dates": ["list of important dates"]
  }},
  "keywords": ["5-10 relevant keywords"],
  "language": "en or id",
  "impact_level": "critical, high, medium, or low",
  "action_required": true or false,
  "deadline_date": "YYYY-MM-DD or null",
  "source_url": "{metadata.get('url', '')}",
  "content_hash": "{metadata.get('content_hash', '')}",
  "scraped_at": "{metadata.get('scraped_at', '')}"
}}

RULES:
- Only factual information, no opinions
- Clean all HTML/markdown artifacts
- Extract key entities accurately
- Determine impact level based on content importance
- Set action_required=true if deadlines or urgent actions mentioned

OUTPUT JSON ONLY (no explanation):"""

        try:
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={
                    'temperature': 0.3,  # Low for factual accuracy
                    'num_predict': 1000
                }
            )
            
            # Parse JSON response
            rag_data = json.loads(response['response'])
            
            # Add processing metadata
            rag_data['processed_at'] = datetime.now().isoformat()
            rag_data['processor'] = 'llama3.2:3b'
            rag_data['branch'] = 'rag_pipeline'
            
            return rag_data
            
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "title_clean": metadata.get('title', 'Untitled'),
                "summary": "Failed to parse content",
                "category": metadata.get('category', 'unknown'),
                "error": "JSON parse error",
                "raw_response": response['response'][:500]
            }
        except Exception as e:
            print(f"❌ Branch A error: {e}")
            return {"error": str(e)}
    
    async def branch_b_content_creation(self, content: str, metadata: Dict, pipeline: str) -> Dict:
        """
        BRANCH B: Create human-quality content
        
        For public pipeline: Journalistic articles
        For email pipeline: Concise digests
        
        Args:
            content: Raw markdown content
            metadata: Source metadata
            pipeline: "public" or "email_only"
            
        Returns:
            Article or digest content
        """
        
        if pipeline == "public":
            # Journalistic article for social media
            prompt = f"""You are an expert journalist writing for expats in Bali/Indonesia.

Transform this raw content into an engaging, informative article.

CONTENT:
{content[:4000]}

METADATA:
Category: {metadata.get('category', 'unknown')}
Source: {metadata.get('url', 'unknown')}

ARTICLE REQUIREMENTS:

1. TITLE: Catchy, SEO-friendly (50-70 chars)

2. INTRO: Hook the reader (2-3 sentences)
   - Why this matters now
   - Who is affected
   - What's changing

3. BODY:
   - Clear structure with H2/H3 headings
   - Explain complex terms simply
   - Include practical implications
   - Use examples when helpful
   - Bilingual where appropriate (IT/EN terms)

4. KEY POINTS: 3-5 bullet points of main takeaways

5. CONCLUSION: Actionable next steps

6. STYLE:
   - Professional yet friendly
   - No jargon without explanation
   - Conversational tone
   - Short paragraphs (3-4 sentences)

7. LENGTH: 600-800 words

OUTPUT FORMAT (Markdown):
# [Title]

## Introduction
[Hook paragraph]

## What's Changing
[Main content with H3 subheadings as needed]

## Key Takeaways
- Point 1
- Point 2
- Point 3

## What This Means for You
[Practical implications]

## Next Steps
[Actionable advice]

---
*Source: {metadata.get('url', '')}*

BEGIN ARTICLE:"""

        else:  # email_only
            # Concise digest for email
            prompt = f"""You are a tech intelligence analyst preparing a digest for a busy executive.

Create a concise, informative digest from this content.

CONTENT:
{content[:4000]}

METADATA:
Category: {metadata.get('category', 'unknown')}

DIGEST REQUIREMENTS:

1. HEADLINE: Clear, direct (one line)

2. SUMMARY: Core information (3-4 sentences)
   - What happened
   - Why it matters
   - What's the impact

3. KEY DETAILS: 3-5 bullet points

4. VERDICT: One sentence on significance

5. STYLE:
   - Factual, no hype
   - Technical accuracy
   - Executive-level brevity

OUTPUT FORMAT (Markdown):
## [Headline]

**Summary:**
[3-4 sentence summary]

**Key Details:**
- Detail 1
- Detail 2
- Detail 3

**Verdict:** [One sentence significance]

**Link:** {metadata.get('url', '')}

---

BEGIN DIGEST:"""

        try:
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={
                    'temperature': 0.7,  # Higher for creativity
                    'num_predict': 1500
                }
            )
            
            article_content = response['response'].strip()
            
            return {
                "content": article_content,
                "type": "article" if pipeline == "public" else "digest",
                "category": metadata.get('category', 'unknown'),
                "source_url": metadata.get('url', ''),
                "word_count": len(article_content.split()),
                "created_at": datetime.now().isoformat(),
                "processor": 'llama3.2:3b',
                "branch": 'content_creation',
                "pipeline": pipeline
            }
            
        except Exception as e:
            print(f"❌ Branch B error: {e}")
            return {"error": str(e)}
    
    async def process_file(self, md_file: Path) -> Dict:
        """
        Process a single markdown file through both branches
        
        Args:
            md_file: Path to markdown file
            
        Returns:
            Processing results
        """
        
        # Extract category from path
        category = md_file.parent.parent.name
        pipeline = self.pipeline_config.get(category, "public")
        
        # Read content
        content = md_file.read_text(encoding='utf-8')
        
        # Read metadata if exists
        meta_file = md_file.with_suffix('.meta.json')
        if meta_file.exists():
            metadata = json.loads(meta_file.read_text())
        else:
            metadata = {
                "title": md_file.stem,
                "category": category,
                "url": "unknown",
                "scraped_at": datetime.now().isoformat(),
                "content_hash": hashlib.md5(content.encode()).hexdigest()
            }
        
        print(f"\n📄 Processing: {md_file.name} ({category})")
        
        # Run both branches in parallel
        rag_task = self.branch_a_rag_pipeline(content, metadata)
        content_task = self.branch_b_content_creation(content, metadata, pipeline)
        
        rag_data, content_data = await asyncio.gather(rag_task, content_task)
        
        return {
            "source_file": str(md_file),
            "category": category,
            "pipeline": pipeline,
            "rag_data": rag_data,
            "content_data": content_data
        }
    
    def save_results(self, category: str, results: List[Dict]):
        """
        Save processing results to structured directories
        
        Args:
            category: Category name
            results: List of processing results
        """
        
        # Create category directories
        rag_dir = self.processed_dir / category / "rag"
        articles_dir = self.processed_dir / category / "articles"
        
        rag_dir.mkdir(parents=True, exist_ok=True)
        articles_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y-%m-%d")
        
        for result in results:
            if 'error' in result:
                print(f"  ⚠️  Skipping due to error: {result.get('source_file')}")
                continue
            
            # Save RAG data
            rag_data = result.get('rag_data', {})
            if rag_data and 'error' not in rag_data:
                title_slug = rag_data.get('title_clean', 'untitled')[:50]
                title_slug = "".join(c for c in title_slug if c.isalnum() or c in (' ', '-', '_')).strip()
                
                rag_file = rag_dir / f"{timestamp}_{title_slug}.rag.json"
                rag_file.write_text(json.dumps(rag_data, indent=2, ensure_ascii=False))
                print(f"  ✅ RAG: {rag_file.name}")
            
            # Save content (article or digest)
            content_data = result.get('content_data', {})
            if content_data and 'error' not in content_data:
                content_type = content_data.get('type', 'article')
                title = content_data.get('content', '').split('\n')[0].replace('#', '').strip()[:50]
                title_slug = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
                
                article_file = articles_dir / f"{timestamp}_{title_slug}.{content_type}.md"
                article_file.write_text(content_data.get('content', ''))
                print(f"  ✅ {content_type.upper()}: {article_file.name}")
    
    async def process_category(self, category: str):
        """
        Process all files in a category
        
        Args:
            category: Category name (e.g., "01_immigration")
        """
        
        category_dir = self.scraped_dir / category / "raw"
        
        if not category_dir.exists():
            print(f"⚠️  Category directory not found: {category_dir}")
            return
        
        md_files = list(category_dir.glob("*.md"))
        
        if not md_files:
            print(f"⚠️  No markdown files in {category}")
            return
        
        print(f"\n📂 Processing category: {category} ({len(md_files)} files)")
        
        # Process all files in category
        results = []
        for md_file in md_files:
            result = await self.process_file(md_file)
            results.append(result)
        
        # Save results
        self.save_results(category, results)
        
        print(f"✅ Category {category} complete!")
    
    async def process_all(self):
        """Process all categories"""
        
        print("\n🚀 Starting LLAMA 3.2 Dual Branch Processing")
        print("=" * 60)
        
        # Check Ollama
        if not self.check_ollama():
            return
        
        start_time = datetime.now()
        
        # Process all categories
        for category in self.pipeline_config.keys():
            await self.process_category(category)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "=" * 60)
        print(f"✅ All processing completed in {duration:.1f} seconds")
        print(f"📁 Results saved to: {self.processed_dir.absolute()}")


async def main():
    """Main entry point"""
    processor = LlamaProcessor()
    await processor.process_all()


if __name__ == "__main__":
    # Run the processor
    asyncio.run(main())
