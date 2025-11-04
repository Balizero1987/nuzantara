#!/usr/bin/env python3
import PyPDF2
import os
import re
from datetime import datetime

def clean_indonesian_text(text):
    """Clean and format Indonesian legal text"""
    # Fix common OCR issues
    text = text.replace('Tahun 2O2I', 'Tahun 2021')  # Fix common error
    text = text.replace('REPU BLIK', 'REPUBLIK')
    text = text.replace('perpajakan', 'perpajakan')
    text = text.replace('  ', ' ')  # Remove double spaces

    # Add paragraph breaks for better readability
    text = re.sub(r'([.!?])\s+([A-Z])', r'\1\n\n\2', text)

    # Clean up extra whitespace
    text = '\n'.join(line.strip() for line in text.split('\n') if line.strip())

    return text

def extract_law_metadata(text):
    """Extract key metadata from Indonesian law"""
    metadata = {}

    # Find law number
    if 'UNDANG-UNDANG' in text:
        match = re.search(r'UNDANG-UNDANG.*?NOMOR (\d+) TAHUN (\d+)', text)
        if match:
            metadata['jenis'] = 'UU'
            metadata['nomor'] = match.group(1)
            metadata['tahun'] = match.group(2)

    elif 'PERATURAN PEMERINTAH' in text:
        match = re.search(r'PERATURAN PEMERINTAH.*?NOMOR (\d+) TAHUN (\d+)', text)
        if match:
            metadata['jenis'] = 'PP'
            metadata['nomor'] = match.group(1)
            metadata['tahun'] = match.group(2)

    # Find title
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if 'TENTANG' in line:
            if i + 1 < len(lines):
                metadata['judul'] = lines[i + 1].strip()
            break

    return metadata

def pdf_to_markdown(pdf_path, output_path):
    """Convert PDF to Indonesian Markdown format"""
    print(f"Converting: {os.path.basename(pdf_path)}")

    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)

            # Extract all text
            full_text = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                full_text += text + "\n\n--- PAGE BREAK ---\n\n"

            # Clean the text
            clean_text = clean_indonesian_text(full_text)

            # Extract metadata
            metadata = extract_law_metadata(clean_text)

            # Create markdown content
            markdown_content = f"""# 📜 {metadata.get('jenis', 'UNDANG-UNDANG')} NOMOR {metadata.get('nomor', '?')} TAHUN {metadata.get('tahun', '?')}

## 📋 Judul
**{metadata.get('judul', 'TIDAK DITEMUKAN')}**

## 📅 Metadata
- **Jenis**: {metadata.get('jenis', 'Unknown')}
- **Nomor**: {metadata.get('nomor', '?')}
- **Tahun**: {metadata.get('tahun', '?')}
- **Tanggal Ekstraksi**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Sumber**: File PDF {os.path.basename(pdf_path)}

---

## 📖 Isi Lengkap

{clean_text}

---

## 📝 Catatan Processing
- **Format**: Converted from PDF to Markdown for AI processing
- **Bahasa**: Indonesia (original)
- **Status**: ✅ Text extraction successful
- **Rekomendasi**: Process with Indonesian language AI worker
"""

            # Write markdown file
            with open(output_path, 'w', encoding='utf-8') as md_file:
                md_file.write(markdown_content)

            print(f"✅ Success: {os.path.basename(output_path)} ({len(clean_text):,} characters)")
            return True

    except Exception as e:
        print(f"❌ Error converting {os.path.basename(pdf_path)}: {e}")
        return False

def main():
    input_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT"
    output_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT_MD"

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Process all PDFs in INPUT directory
    pdf_files = [f for f in os.listdir(input_dir) if f.endswith('.pdf')]

    print(f"Found {len(pdf_files)} PDF files to convert:")
    for pdf_file in pdf_files:
        print(f"  - {pdf_file}")

    print(f"\nConverting to Indonesian Markdown...")

    converted_count = 0
    for pdf_file in pdf_files:
        pdf_path = os.path.join(input_dir, pdf_file)
        md_filename = pdf_file.replace('.pdf', '.md')
        md_path = os.path.join(output_dir, md_filename)

        if pdf_to_markdown(pdf_path, md_path):
            converted_count += 1

    print(f"\n=== CONVERSION COMPLETE ===")
    print(f"✅ Successfully converted: {converted_count}/{len(pdf_files)} files")
    print(f"📂 Output directory: {output_dir}")
    print(f"🇮🇩 Language: Indonesian (original)")
    print(f"🤖 Ready for AI processing")

if __name__ == "__main__":
    main()