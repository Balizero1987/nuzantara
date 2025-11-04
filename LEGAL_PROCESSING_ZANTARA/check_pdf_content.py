#!/usr/bin/env python3
import PyPDF2
import sys
import os

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page_num in range(min(3, len(pdf_reader.pages))):  # First 3 pages only
                page = pdf_reader.pages[page_num]
                text += page.extract_text() + "\n"
            return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def analyze_content(text, filename, full_path):
    """Analyze PDF content for language and format"""
    print(f"\n=== ANALYZING: {filename} ===")
    print(f"File size: {os.path.getsize(full_path):,} bytes")

    # Show first 500 characters
    preview = text[:500]
    print(f"\nFirst 500 characters:\n{preview}")

    # Check for language indicators
    indonesian_words = ['undang-undang', 'nomor', 'tahun', 'republik indonesia', 'presiden', 'menetapkan', 'pasal']
    english_words = ['law', 'number', 'year', 'republic', 'president', 'enacts', 'article']

    text_lower = text.lower()
    indo_count = sum(1 for word in indonesian_words if word in text_lower)
    eng_count = sum(1 for word in english_words if word in text_lower)

    print(f"\nLanguage detection:")
    print(f"Indonesian indicators found: {indo_count}")
    print(f"English indicators found: {eng_count}")

    if indo_count > eng_count:
        print("🇮🇩 Language: INDONESIAN")
    elif eng_count > indo_count:
        print("🇺🇸 Language: ENGLISH")
    else:
        print("🤷 Language: UNCLEAR")

    # Check if it's readable or scanned
    if len(text.strip()) < 100:
        print("⚠️  WARNING: Very little text extracted - likely scanned image PDF")
    else:
        print("✅ Text extraction successful")

def main():
    input_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT"

    pdf_files = [f for f in os.listdir(input_dir) if f.endswith('.pdf')]

    print(f"Found {len(pdf_files)} PDF files for Worker #1:")
    for pdf_file in pdf_files:
        print(f"  - {pdf_file}")

    for pdf_file in pdf_files:
        pdf_path = os.path.join(input_dir, pdf_file)
        text = extract_pdf_text(pdf_path)
        analyze_content(text, pdf_file, pdf_path)
        print("\n" + "="*60)

if __name__ == "__main__":
    main()