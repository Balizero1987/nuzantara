#!/usr/bin/env python3
"""
Convert all books (PDF/TXT/EPUB) to JSONL format for ChromaDB ingestion
Handles 218 books across 14 categories in raw_books_philosophy/
"""

import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any
import re

# PDF extraction
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    print("⚠️  PyPDF2 not installed. Install: pip3 install PyPDF2")
    PDF_AVAILABLE = False

# EPUB extraction
try:
    import ebooklib
    from ebooklib import epub
    from bs4 import BeautifulSoup
    EPUB_AVAILABLE = True
except ImportError:
    print("⚠️  ebooklib/beautifulsoup4 not installed. Install: pip3 install ebooklib beautifulsoup4")
    EPUB_AVAILABLE = False


def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from PDF using PyPDF2"""
    if not PDF_AVAILABLE:
        return ""
    
    try:
        text = []
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            total_pages = len(reader.pages)
            
            # Limit to first 500 pages for massive books
            pages_to_read = min(total_pages, 500)
            
            for page_num in range(pages_to_read):
                page = reader.pages[page_num]
                text.append(page.extract_text())
        
        full_text = "\n".join(text)
        
        # Cleanup
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)  # Remove excessive newlines
        full_text = re.sub(r'[ \t]+', ' ', full_text)     # Normalize spaces
        
        return full_text.strip()
    
    except Exception as e:
        print(f"   ❌ Error extracting PDF {pdf_path.name}: {e}")
        return ""


def extract_text_from_epub(epub_path: Path) -> str:
    """Extract text from EPUB using ebooklib"""
    if not EPUB_AVAILABLE:
        return ""
    
    try:
        book = epub.read_epub(epub_path)
        chapters = []
        
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_body_content(), 'html.parser')
                chapters.append(soup.get_text())
        
        full_text = "\n\n".join(chapters)
        
        # Cleanup
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        full_text = re.sub(r'[ \t]+', ' ', full_text)
        
        return full_text.strip()
    
    except Exception as e:
        print(f"   ❌ Error extracting EPUB {epub_path.name}: {e}")
        return ""


def extract_text_from_txt(txt_path: Path) -> str:
    """Extract text from TXT file"""
    try:
        with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        
        # Cleanup
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        
        return text.strip()
    
    except Exception as e:
        print(f"   ❌ Error reading TXT {txt_path.name}: {e}")
        return ""


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Split text into overlapping chunks by sentences
    
    Args:
        text: Full text to chunk
        chunk_size: Target characters per chunk
        overlap: Characters to overlap between chunks
    
    Returns:
        List of text chunks
    """
    # Split by sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence)
        
        if current_length + sentence_length > chunk_size and current_chunk:
            # Save current chunk
            chunks.append(" ".join(current_chunk))
            
            # Start new chunk with overlap
            overlap_text = " ".join(current_chunk)
            if len(overlap_text) > overlap:
                # Keep last part for overlap
                overlap_sentences = []
                overlap_length = 0
                for s in reversed(current_chunk):
                    if overlap_length + len(s) <= overlap:
                        overlap_sentences.insert(0, s)
                        overlap_length += len(s)
                    else:
                        break
                current_chunk = overlap_sentences
                current_length = overlap_length
            else:
                current_chunk = []
                current_length = 0
        
        current_chunk.append(sentence)
        current_length += sentence_length
    
    # Add final chunk
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks


def generate_book_id(book_path: Path, category: str) -> str:
    """Generate unique book_id from filename and category"""
    # Clean filename (remove extension and normalize)
    book_name = book_path.stem
    book_name = re.sub(r'[^a-zA-Z0-9_-]', '_', book_name)
    book_name = re.sub(r'_+', '_', book_name).strip('_')
    
    # Format: category_bookname (e.g., philosophy_plato_republic)
    book_id = f"{category.lower()}_{book_name.lower()}"
    
    return book_id


def process_book(book_path: Path, category: str, output_dir: Path) -> Dict[str, Any]:
    """
    Process single book: extract text, chunk, create JSONL
    
    Returns:
        Statistics dict
    """
    print(f"\n📖 Processing: {book_path.name}")
    
    # Extract text based on extension
    if book_path.suffix.lower() == '.pdf':
        text = extract_text_from_pdf(book_path)
    elif book_path.suffix.lower() == '.epub':
        text = extract_text_from_epub(book_path)
    elif book_path.suffix.lower() == '.txt':
        text = extract_text_from_txt(book_path)
    else:
        print(f"   ⚠️  Unsupported format: {book_path.suffix}")
        return {"status": "skipped", "reason": "unsupported_format"}
    
    if not text or len(text) < 100:
        print(f"   ⚠️  No text extracted or too short ({len(text)} chars)")
        return {"status": "failed", "reason": "no_text"}
    
    print(f"   ✅ Extracted {len(text):,} characters")
    
    # Chunk text
    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    print(f"   ✅ Created {len(chunks)} chunks")
    
    # Generate book_id
    book_id = generate_book_id(book_path, category)
    
    # Create JSONL entries
    jsonl_entries = []
    for idx, chunk in enumerate(chunks):
        # Generate unique chunk_id
        chunk_hash = hashlib.md5(chunk.encode()).hexdigest()[:8]
        chunk_id = f"{book_id}_chunk_{idx:04d}_{chunk_hash}"
        
        entry = {
            "id": chunk_id,
            "text": chunk,
            "metadata": {
                "book_id": book_id,
                "book_title": book_path.stem,
                "category": category.lower(),
                "chunk_index": idx,
                "total_chunks": len(chunks),
                "source_file": book_path.name,
                "file_type": book_path.suffix[1:].lower(),
                "char_count": len(chunk)
            }
        }
        jsonl_entries.append(entry)
    
    # Write JSONL file
    output_file = output_dir / f"{book_id}_READY_FOR_KB.jsonl"
    with open(output_file, 'w', encoding='utf-8') as f:
        for entry in jsonl_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    print(f"   ✅ Saved to: {output_file.name}")
    
    return {
        "status": "success",
        "book_id": book_id,
        "chunks": len(chunks),
        "chars": len(text),
        "output_file": str(output_file)
    }


def main():
    """Main conversion pipeline"""
    print("=" * 80)
    print("📚 BOOKS → JSONL CONVERTER FOR CHROMADB")
    print("=" * 80)
    
    # Paths
    base_dir = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/DATABASE/KB/raw_books_philosophy")
    output_base = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/DATABASE/KB/books_processed_jsonl")
    output_base.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📂 Source: {base_dir}")
    print(f"📂 Output: {output_base}\n")
    
    # Check dependencies
    if not PDF_AVAILABLE:
        print("⚠️  WARNING: PyPDF2 not available - PDFs will be skipped")
        print("   Install: pip3 install PyPDF2\n")
    
    if not EPUB_AVAILABLE:
        print("⚠️  WARNING: ebooklib not available - EPUBs will be skipped")
        print("   Install: pip3 install ebooklib beautifulsoup4\n")
    
    # Process each category
    categories = [d for d in base_dir.iterdir() if d.is_dir()]
    
    total_stats = {
        "categories": 0,
        "books_processed": 0,
        "books_failed": 0,
        "books_skipped": 0,
        "total_chunks": 0,
        "total_chars": 0
    }
    
    for category_dir in sorted(categories):
        category_name = category_dir.name
        print(f"\n{'=' * 80}")
        print(f"📂 CATEGORY: {category_name.upper()}")
        print(f"{'=' * 80}")
        
        # Create output directory for category
        category_output = output_base / category_name.lower()
        category_output.mkdir(parents=True, exist_ok=True)
        
        # Find all books
        books = []
        for ext in ['*.pdf', '*.txt', '*.epub']:
            books.extend(list(category_dir.glob(ext)))
        
        if not books:
            print(f"   ⚠️  No books found")
            continue
        
        print(f"   Found {len(books)} books")
        
        # Process each book
        category_stats = {
            "processed": 0,
            "failed": 0,
            "skipped": 0
        }
        
        for book_path in sorted(books):
            result = process_book(book_path, category_name, category_output)
            
            if result["status"] == "success":
                category_stats["processed"] += 1
                total_stats["total_chunks"] += result["chunks"]
                total_stats["total_chars"] += result["chars"]
            elif result["status"] == "failed":
                category_stats["failed"] += 1
            elif result["status"] == "skipped":
                category_stats["skipped"] += 1
        
        print(f"\n   ✅ Category complete: {category_stats['processed']} processed, "
              f"{category_stats['failed']} failed, {category_stats['skipped']} skipped")
        
        total_stats["categories"] += 1
        total_stats["books_processed"] += category_stats["processed"]
        total_stats["books_failed"] += category_stats["failed"]
        total_stats["books_skipped"] += category_stats["skipped"]
    
    # Final summary
    print("\n" + "=" * 80)
    print("📊 FINAL SUMMARY")
    print("=" * 80)
    print(f"   Categories processed: {total_stats['categories']}")
    print(f"   Books successfully processed: {total_stats['books_processed']}")
    print(f"   Books failed: {total_stats['books_failed']}")
    print(f"   Books skipped: {total_stats['books_skipped']}")
    print(f"   Total chunks created: {total_stats['total_chunks']:,}")
    print(f"   Total characters: {total_stats['total_chars']:,}")
    print(f"\n✅ JSONL files saved to: {output_base}")
    print("=" * 80)


if __name__ == "__main__":
    main()
