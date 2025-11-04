#!/usr/bin/env python3
import PyPDF2
import os

def test_pdf(pdf_path):
    """Test single PDF"""
    print(f"Testing: {os.path.basename(pdf_path)}")
    print(f"Size: {os.path.getsize(pdf_path):,} bytes")

    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"Pages: {len(pdf_reader.pages)}")

            # Extract first page text
            first_page = pdf_reader.pages[0]
            text = first_page.extract_text()[:500]
            print(f"First 500 chars:\n{text}")

            return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# Test the big file
big_file = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS/Salinan UU Nomor 7 Tahun 2021.pdf"
test_pdf(big_file)