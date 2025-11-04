#!/usr/bin/env python3
import PyPDF2
import os

def test_pdf_file(pdf_path):
    """Test if PDF is readable and extract sample text"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)

            # Check if PDF has pages
            if len(pdf_reader.pages) == 0:
                return False, "No pages found"

            # Extract first page text
            first_page = pdf_reader.pages[0]
            text = first_page.extract_text()

            if len(text.strip()) < 50:
                return False, "Too little text extracted"

            return True, text[:200]

    except Exception as e:
        return False, str(e)

def find_working_pdfs():
    """Find all working PDFs for Worker #1 laws"""
    raw_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS"

    # Laws Worker #1 should process
    target_laws = [
        "UU_25_2007",  # Investment Law
        "UU_36_2008",  # PPh Income Tax
        "UU_42_2009",  # PPN VAT
        "UU_7_2021",   # Tax Harmonization
        "UU_28_2007"   # KUP Tax Admin
    ]

    working_files = []

    # List all files in RAW_LAWS
    for filename in os.listdir(raw_dir):
        if filename.endswith('.pdf'):
            file_path = os.path.join(raw_dir, filename)
            file_size = os.path.getsize(file_path)

            # Check if it matches target laws
            for target in target_laws:
                if target in filename:
                    print(f"\nTesting: {filename} ({file_size:,} bytes)")
                    is_working, content = test_pdf_file(file_path)

                    if is_working:
                        print(f"✅ WORKING - Sample: {content[:100]}...")
                        working_files.append((filename, file_path, file_size, content[:300]))
                    else:
                        print(f"❌ CORRUPTED - {content}")
                    break

    return working_files

# Main execution
working_pdfs = find_working_pdfs()

print(f"\n=== SUMMARY ===")
print(f"Found {len(working_pdfs)} working PDF files for Worker #1:")

for filename, path, size, sample in working_pdfs:
    print(f"✅ {filename} ({size:,} bytes)")
    print(f"   Sample: {sample[:100]}...")