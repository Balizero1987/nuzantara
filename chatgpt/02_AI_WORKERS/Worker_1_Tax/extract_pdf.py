#!/usr/bin/env python3
"""
PDF Text Extractor for Indonesian Legal Documents
Extracts text while preserving structure for legal processing
"""

import sys
import PyPDF2
import re

def extract_text_from_pdf(pdf_path, output_path):
    """Extract text from PDF with structure preservation"""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            total_pages = len(reader.pages)
            
            print(f"📄 Processing: {pdf_path}")
            print(f"📊 Total pages: {total_pages}")
            
            full_text = []
            
            for page_num in range(total_pages):
                page = reader.pages[page_num]
                text = page.extract_text()
                
                if text.strip():
                    full_text.append(f"\n{'='*80}\n")
                    full_text.append(f"PAGE {page_num + 1}\n")
                    full_text.append(f"{'='*80}\n")
                    full_text.append(text)
                
                # Progress indicator
                if (page_num + 1) % 10 == 0:
                    print(f"⏳ Processed {page_num + 1}/{total_pages} pages...")
            
            # Write to output file
            with open(output_path, 'w', encoding='utf-8') as out_file:
                out_file.write(''.join(full_text))
            
            print(f"✅ Extraction complete: {output_path}")
            print(f"📝 Total characters extracted: {len(''.join(full_text))}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error extracting PDF: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 extract_pdf.py <input.pdf> <output.txt>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    
    success = extract_text_from_pdf(pdf_path, output_path)
    sys.exit(0 if success else 1)
