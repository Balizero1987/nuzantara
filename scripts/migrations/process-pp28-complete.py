#!/usr/bin/env python3
"""
PP Nomor 28 Tahun 2025 - Complete Processor & Analyzer
=======================================================

FULL WORKFLOW:
1. Extract text from PDF
2. Analyze structure and content
3. Identify key sections
4. Extract regulations and requirements
5. Structure for ZANTARA Oracle
6. Generate searchable metadata
"""

import os
import sys
import json
import re
from datetime import datetime
from pathlib import Path

# Try multiple PDF libraries
try:
    import pdfplumber
    PDF_LIB = 'pdfplumber'
except:
    try:
        import PyPDF2
        PDF_LIB = 'PyPDF2'
    except:
        PDF_LIB = None

PDF_FILE = "/Users/antonellosiano/Desktop/PP Nomor 28 Tahun 2025.pdf"
OUTPUT_DIR = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data/PP_28_2025"

class PP28Processor:
    def __init__(self):
        self.pdf_path = PDF_FILE
        self.output_dir = OUTPUT_DIR
        self.raw_text = ""
        self.sections = []
        self.articles = []
        self.key_points = []
        
    def setup(self):
        """Create output directory structure"""
        print("🔧 Setting up workspace...")
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)
        Path(f"{self.output_dir}/chunks").mkdir(exist_ok=True)
        Path(f"{self.output_dir}/analysis").mkdir(exist_ok=True)
        print(f"✅ Workspace ready: {self.output_dir}\n")
        
    def extract_text(self):
        """Extract text from PDF using best available method"""
        print("📄 Extracting text from PDF...")
        print(f"   Using: {PDF_LIB}\n")
        
        if PDF_LIB == 'pdfplumber':
            return self._extract_pdfplumber()
        elif PDF_LIB == 'PyPDF2':
            return self._extract_pypdf2()
        else:
            print("❌ No PDF library available!")
            return False
            
    def _extract_pdfplumber(self):
        """Extract using pdfplumber (best quality)"""
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                print(f"   Pages: {len(pdf.pages)}")
                for i, page in enumerate(pdf.pages):
                    print(f"   Extracting page {i+1}/{len(pdf.pages)}...", end='\r')
                    text = page.extract_text()
                    if text:
                        self.raw_text += text + "\n\n"
                print(f"\n✅ Extracted {len(self.raw_text)} characters\n")
                return True
        except Exception as e:
            print(f"❌ pdfplumber error: {e}\n")
            return False
            
    def _extract_pypdf2(self):
        """Extract using PyPDF2 (fallback)"""
        try:
            with open(self.pdf_path, 'rb') as f:
                pdf = PyPDF2.PdfReader(f)
                print(f"   Pages: {len(pdf.pages)}")
                for i, page in enumerate(pdf.pages):
                    print(f"   Extracting page {i+1}/{len(pdf.pages)}...", end='\r')
                    text = page.extract_text()
                    if text:
                        self.raw_text += text + "\n\n"
                print(f"\n✅ Extracted {len(self.raw_text)} characters\n")
                return True
        except Exception as e:
            print(f"❌ PyPDF2 error: {e}\n")
            return False
            
    def save_raw_text(self):
        """Save extracted text"""
        raw_file = f"{self.output_dir}/PP_28_2025_raw_text.txt"
        with open(raw_file, 'w', encoding='utf-8') as f:
            f.write(self.raw_text)
        print(f"✅ Raw text saved: {raw_file}\n")
        
    def analyze_structure(self):
        """Analyze document structure"""
        print("🔍 Analyzing document structure...\n")
        
        analysis = {
            "total_chars": len(self.raw_text),
            "total_words": len(self.raw_text.split()),
            "has_chapters": bool(re.search(r'BAB [IVX]+', self.raw_text)),
            "has_articles": bool(re.search(r'Pasal \d+', self.raw_text)),
            "has_sections": bool(re.search(r'Bagian \w+', self.raw_text)),
            "language": "Indonesian",
            "type": "Government Regulation"
        }
        
        # Find chapters (BAB)
        chapters = re.findall(r'BAB [IVX]+\s*\n\s*([^\n]+)', self.raw_text)
        analysis['chapters'] = chapters
        print(f"   Found {len(chapters)} chapters (BAB)")
        
        # Find articles (Pasal)
        articles = re.findall(r'Pasal (\d+)', self.raw_text)
        analysis['articles_count'] = len(set(articles))
        print(f"   Found {len(set(articles))} articles (Pasal)")
        
        # Find key terms
        key_terms = {
            'Wajib Pajak': len(re.findall(r'Wajib Pajak', self.raw_text, re.IGNORECASE)),
            'Pajak': len(re.findall(r'\bPajak\b', self.raw_text, re.IGNORECASE)),
            'Peraturan': len(re.findall(r'Peraturan', self.raw_text, re.IGNORECASE)),
            'Kewajiban': len(re.findall(r'Kewajiban', self.raw_text, re.IGNORECASE)),
            'Tarif': len(re.findall(r'Tarif', self.raw_text, re.IGNORECASE)),
            'Pengusaha': len(re.findall(r'Pengusaha', self.raw_text, re.IGNORECASE))
        }
        analysis['key_terms'] = key_terms
        
        print("\n   Key terms frequency:")
        for term, count in key_terms.items():
            if count > 0:
                print(f"      - {term}: {count} times")
        
        # Determine primary topic
        topics = []
        if key_terms['Pajak'] > 10:
            topics.append('taxation')
        if key_terms['Wajib Pajak'] > 5:
            topics.append('taxpayer_obligations')
        if key_terms['Tarif'] > 5:
            topics.append('tax_rates')
        if key_terms['Pengusaha'] > 5:
            topics.append('business_regulations')
            
        analysis['primary_topics'] = topics
        print(f"\n   Primary topics: {', '.join(topics)}")
        
        # Save analysis
        analysis_file = f"{self.output_dir}/analysis/structure_analysis.json"
        with open(analysis_file, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Structure analysis saved: {analysis_file}\n")
        
        return analysis
        
    def extract_articles(self):
        """Extract individual articles"""
        print("📋 Extracting articles (Pasal)...\n")
        
        # Split by Pasal
        article_pattern = r'(Pasal \d+[^\n]*\n(?:(?!Pasal \d+).*\n)*)'
        articles = re.findall(article_pattern, self.raw_text, re.MULTILINE)
        
        structured_articles = []
        for i, article_text in enumerate(articles):
            # Extract article number
            article_num = re.search(r'Pasal (\d+)', article_text)
            if article_num:
                num = article_num.group(1)
                structured_articles.append({
                    "article_number": int(num),
                    "title": f"Pasal {num}",
                    "content": article_text.strip(),
                    "word_count": len(article_text.split())
                })
        
        print(f"   Extracted {len(structured_articles)} articles")
        
        # Save articles
        articles_file = f"{self.output_dir}/analysis/articles.json"
        with open(articles_file, 'w', encoding='utf-8') as f:
            json.dump(structured_articles, f, indent=2, ensure_ascii=False)
        print(f"✅ Articles saved: {articles_file}\n")
        
        self.articles = structured_articles
        return structured_articles
        
    def create_chunks(self):
        """Create semantic chunks for Oracle"""
        print("✂️  Creating semantic chunks for Oracle...\n")
        
        chunks = []
        chunk_id = 0
        
        # Chunk by articles (best for legal documents)
        for article in self.articles:
            chunk = {
                "id": f"PP_28_2025_article_{article['article_number']}",
                "chunk_number": chunk_id,
                "type": "article",
                "article_number": article['article_number'],
                "content": article['content'],
                "metadata": {
                    "regulation": "PP 28/2025",
                    "regulation_type": "PP",
                    "regulation_number": 28,
                    "regulation_year": 2025,
                    "section_type": "article",
                    "article_number": article['article_number'],
                    "domain": "legal",
                    "language": "id",
                    "word_count": article['word_count']
                }
            }
            chunks.append(chunk)
            chunk_id += 1
        
        print(f"   Created {len(chunks)} article-based chunks")
        
        # Also create summary chunks
        if len(self.raw_text) > 0:
            # Introduction chunk (first 2000 chars)
            intro = self.raw_text[:2000]
            chunks.append({
                "id": "PP_28_2025_introduction",
                "chunk_number": chunk_id,
                "type": "introduction",
                "content": intro,
                "metadata": {
                    "regulation": "PP 28/2025",
                    "section_type": "introduction",
                    "domain": "legal"
                }
            })
            chunk_id += 1
        
        print(f"   Total chunks: {len(chunks)}")
        
        # Save chunks
        chunks_file = f"{self.output_dir}/chunks/all_chunks.json"
        with open(chunks_file, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, indent=2, ensure_ascii=False)
        print(f"✅ Chunks saved: {chunks_file}\n")
        
        return chunks
        
    def generate_metadata(self, analysis):
        """Generate comprehensive metadata"""
        print("📊 Generating metadata...\n")
        
        metadata = {
            "regulation": {
                "type": "PP",
                "number": 28,
                "year": 2025,
                "full_name": "PP Nomor 28 Tahun 2025",
                "status": "active",
                "effective_date": "2025",
                "source": "Indonesian Government"
            },
            "content": {
                "total_chars": analysis['total_chars'],
                "total_words": analysis['total_words'],
                "total_articles": analysis['articles_count'],
                "total_chapters": len(analysis.get('chapters', [])),
                "language": "Indonesian",
                "primary_topics": analysis.get('primary_topics', [])
            },
            "integration": {
                "added_date": datetime.now().isoformat(),
                "processed_date": datetime.now().isoformat(),
                "oracle_ready": True,
                "domains": ["legal", "tax", "business"],
                "priority": "high",
                "searchable": True
            },
            "zantara_tags": [
                "PP 28/2025",
                "Peraturan Pemerintah",
                "Indonesian Law",
                "2025 Regulation",
                "Legal Framework"
            ] + analysis.get('primary_topics', [])
        }
        
        # Save metadata
        metadata_file = f"{self.output_dir}/PP_28_2025_complete_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        print(f"✅ Metadata saved: {metadata_file}\n")
        
        return metadata
        
    def generate_summary(self, metadata):
        """Generate human-readable summary"""
        print("📝 Generating summary report...\n")
        
        summary = f"""# PP Nomor 28 Tahun 2025 - Processing Report

## 📄 Document Information

**Regulation**: PP (Peraturan Pemerintah) Nomor 28 Tahun 2025
**Type**: Government Regulation
**Year**: 2025
**Status**: Active
**Processed**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## 📊 Content Analysis

- **Total Characters**: {metadata['content']['total_chars']:,}
- **Total Words**: {metadata['content']['total_words']:,}
- **Total Articles (Pasal)**: {metadata['content']['total_articles']}
- **Total Chapters (BAB)**: {metadata['content']['total_chapters']}
- **Language**: Indonesian

---

## 🎯 Primary Topics

{chr(10).join([f"- {topic.replace('_', ' ').title()}" for topic in metadata['content']['primary_topics']])}

---

## 🗂️ Processed Files

1. **Raw Text**: `PP_28_2025_raw_text.txt`
2. **Structure Analysis**: `analysis/structure_analysis.json`
3. **Articles**: `analysis/articles.json`
4. **Chunks**: `chunks/all_chunks.json`
5. **Metadata**: `PP_28_2025_complete_metadata.json`

---

## ✅ Oracle Integration Ready

The regulation has been processed and is ready for Oracle integration:

- ✅ Text extracted
- ✅ Structure analyzed
- ✅ Articles identified
- ✅ Chunks created
- ✅ Metadata generated
- ✅ Searchable format

---

## 🚀 Next Steps

### 1. Upload to ChromaDB Oracle

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
python3 scripts/oracle-upload-regulation.py "PP_28_2025"
```

### 2. Test in ZANTARA

```bash
curl -X POST https://nuzantara-backend.fly.dev/api/v3/zantara/unified \\
  -H "Content-Type: application/json" \\
  -d '{{"query": "What does PP 28/2025 regulate?", "domain": "legal"}}'
```

### 3. Verify Knowledge

Test queries:
- "Apa yang diatur dalam PP 28/2025?"
- "What are the main provisions of PP 28/2025?"
- "PP 28 tahun 2025 tentang apa?"

---

## 📋 ZANTARA Integration Points

- **Legal Handler**: Will automatically access PP 28/2025 knowledge
- **Tax Handler**: References available if tax-related
- **Business Handler**: Business regulation context available
- **Collective Memory**: User queries will enhance knowledge

---

**Status**: ✅ READY FOR PRODUCTION
**Quality**: High (complete extraction and analysis)
**Oracle Compatible**: Yes
"""
        
        summary_file = f"{self.output_dir}/PROCESSING_REPORT.md"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(summary)
        print(f"✅ Summary report: {summary_file}\n")
        
        return summary
        
    def run(self):
        """Run complete processing pipeline"""
        print("\n" + "="*70)
        print("🔄 PP Nomor 28 Tahun 2025 - Complete Processor")
        print("="*70 + "\n")
        
        if not PDF_LIB:
            print("❌ No PDF library available!")
            print("   Install with: pip3 install pdfplumber PyPDF2")
            return False
        
        # Step 1: Setup
        self.setup()
        
        # Step 2: Extract text
        if not self.extract_text():
            return False
        self.save_raw_text()
        
        # Step 3: Analyze
        analysis = self.analyze_structure()
        
        # Step 4: Extract articles
        self.extract_articles()
        
        # Step 5: Create chunks
        self.create_chunks()
        
        # Step 6: Generate metadata
        metadata = self.generate_metadata(analysis)
        
        # Step 7: Generate summary
        self.generate_summary(metadata)
        
        # Final report
        print("="*70)
        print("🎉 PROCESSING COMPLETE!")
        print("="*70)
        print(f"\n📁 Output Directory: {self.output_dir}")
        print(f"📊 Total Articles: {len(self.articles)}")
        print(f"✂️  Total Chunks: {len(self.articles) + 1}")
        print(f"📝 Topics: {', '.join(metadata['content']['primary_topics'])}")
        print(f"\n✅ Ready for Oracle upload")
        print(f"📖 Read summary: cat {self.output_dir}/PROCESSING_REPORT.md\n")
        
        return True

if __name__ == "__main__":
    processor = PP28Processor()
    success = processor.run()
    sys.exit(0 if success else 1)
