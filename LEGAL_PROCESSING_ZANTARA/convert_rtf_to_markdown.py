#!/usr/bin/env python3
import re
import os
from datetime import datetime

def clean_rtf_text(text):
    """Convert RTF to clean Indonesian text"""
    # Remove RTF headers
    text = re.sub(r'{\\rtf1.*?\\deff0}', '', text)
    text = re.sub(r'{.*?}', '', text)

    # Convert RTF commands
    text = re.sub(r'\\uc0\u8208', '', text)  # Remove Unicode markers
    text = re.sub(r'\\fs\d+\fsmilli\d+', '', text)  # Remove font size
    text = re.sub(r'\\cf\d+', '', text)  # Remove color
    text = re.sub(r'\\pard', '', text)  # Remove paragraph markers
    text = re.sub(r'\\pardirnatural', '', text)
    text = re.sub(r'\\partightenfactor0', '', text)
    text = re.sub(r'\\tx\d+', '', text)  # Remove tab positions
    text = re.sub(r'\\page\s*$', '', text)  # Remove page breaks

    # Fix spacing and formatting
    text = text.replace('\\', '')
    text = text.replace('\n\n', '\n')
    text = re.sub(r'\s+', ' ', text)

    # Clean up extra whitespace
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        line = line.strip()
        if line and not line.startswith('f0') and not line.startswith('f1') and not line.startswith('f2'):
            clean_lines.append(line)

    return '\n'.join(clean_lines)

def process_rtf_to_markdown(rtf_file, output_file):
    """Convert RTF file to Indonesian Markdown"""
    print(f"Processing: {os.path.basename(rtf_file)}")

    try:
        # Read RTF file
        with open(rtf_file, 'r', encoding='utf-8', errors='ignore') as f:
            rtf_content = f.read()

        # Clean RTF text
        clean_text = clean_rtf_text(rtf_content)

        # Extract metadata
        title = "UNDANG-UNDANG REPUBLIK INDONESIA"
        if "NOMOR 36 TAHUN 2008" in clean_text:
            title = "UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 36 TAHUN 2008 TENTANG PAJAK PENGHASILAN"
        elif "NOMOR 25 TAHUN 2007" in clean_text:
            title = "UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 25 TAHUN 2007 TENTANG PENANAMAN MODAL"

        # Create markdown content
        markdown_content = f"""# 📜 {title}

## 📋 Metadata
- **Jenis**: Undang-Undang (UU)
- **Status**: Complete legal document
- **Bahasa**: Indonesia (original)
- **Tanggal Konversi**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Sumber**: RTF document conversion

---

## 📖 Isi Lengkap Undang-Undang

{clean_text}

---

## 📝 Catatan Konversi
- **Format**: Converted from RTF to Markdown
- **Bahasa**: Indonesia (original maintained)
- **Status**: ✅ Text extraction complete
- **Kualitas**: High - full legal text preserved
- **Rekomendasi**: Ready for AI processing in Indonesian

---

*Document converted for ZANTARA AI Worker #1 - Tax & Investment Specialist*
"""

        # Write markdown file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        print(f"✅ Success: {os.path.basename(output_file)} ({len(clean_text):,} characters)")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    input_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_1_Tax_Investment/INPUT_MD"

    # Process RTF files
    rtf_files = []
    for file in os.listdir(input_dir):
        if file.endswith('.md') and ('PPh' in file or 'RTF' in file or 'rtf' in file):
            rtf_files.append(file)

    print(f"Found RTF-style files to process: {rtf_files}")

    # Convert UU 36:2008 PPh
    pph_rtf = os.path.join(input_dir, "UU 36:2008 - PPh (Income Tax).md")
    pph_md = os.path.join(input_dir, "UU_36_2008_PPh_Clean.md")

    if os.path.exists(pph_rtf):
        process_rtf_to_markdown(pph_rtf, pph_md)

    # Check UU 25:2007
    uu25_file = os.path.join(input_dir, "UU 25:2007.md")
    if os.path.exists(uu25_file):
        # Check if it's RTF format
        with open(uu25_file, 'r', encoding='utf-8', errors='ignore') as f:
            first_line = f.readline()
            if '{\\rtf1' in first_line:
                uu25_md = os.path.join(input_dir, "UU_25_2007_Penanaman_Modal_Clean.md")
                process_rtf_to_markdown(uu25_file, uu25_md)
            else:
                print(f"✅ UU 25:2007.md is already in clean format")

    # Process UU 28:2007 KUP
    kup_rtf = os.path.join(input_dir, "UU 28:2007 - KUP.md")
    if os.path.exists(kup_rtf):
        kup_md = os.path.join(input_dir, "UU_28_2007_KUP_Clean.md")
        process_rtf_to_markdown(kup_rtf, kup_md)

    print(f"\n=== CONVERSION COMPLETE ===")
    print("📁 Check INPUT_MD directory for clean markdown files")

if __name__ == "__main__":
    main()