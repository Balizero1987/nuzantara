#!/usr/bin/env python3
import PyPDF2
import os
from datetime import datetime

def test_pdf_file(pdf_path):
    """Test if PDF is readable and extract sample text"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)

            # Check if PDF has pages
            if len(pdf_reader.pages) == 0:
                return False, "No pages found", 0

            # Extract first page text
            first_page = pdf_reader.pages[0]
            text = first_page.extract_text()

            if len(text.strip()) < 50:
                return False, "Too little text extracted", 0

            return True, text[:200], len(pdf_reader.pages)

    except Exception as e:
        return False, str(e), 0

def process_worker_2():
    """Process Worker #2 Immigration & Manpower files"""
    input_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_2_Immigration_Manpower/INPUT"
    output_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_2_Immigration_Manpower/INPUT_MD"

    os.makedirs(output_dir, exist_ok=True)

    # Expected laws for Worker #2
    target_files = [
        "UU_6_2011_Keimigrasian.pdf",     # Immigration Law
        "PP_31_2013_Immigration_Detail.pdf", # Immigration Implementation
        "UU_13_2003_Ketenagakerjaan.pdf",   # Manpower Law
        "UU_20_2016_TKA.pdf",             # Foreign Workers
    ]

    working_files = []

    print(f"=== WORKER #2 - IMMIGRATION & MANPOWER ===")
    print(f"Processing {len(target_files)} target files...\n")

    for filename in target_files:
        file_path = os.path.join(input_dir, filename)

        if os.path.exists(file_path):
            print(f"Testing: {filename}")
            is_working, content, pages = test_pdf_file(file_path)
            file_size = os.path.getsize(file_path)

            if is_working:
                print(f"✅ WORKING - {pages} pages, {file_size:,} bytes")
                print(f"   Sample: {content[:100]}...")

                # Convert to markdown
                md_filename = filename.replace('.pdf', '.md')
                md_path = os.path.join(output_dir, md_filename)

                # Create simple markdown
                with open(file_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    full_text = ""
                    for page_num in range(len(pdf_reader.pages)):
                        page = pdf_reader.pages[page_num]
                        full_text += page.extract_text() + "\n\n--- PAGE BREAK ---\n\n"

                # Create markdown content
                markdown_content = f"""# 📜 {filename.replace('.pdf', '').replace('_', ' ').upper()}

## 📋 Metadata
- **Filename**: {filename}
- **Pages**: {pages}
- **Size**: {file_size:,} bytes
- **Extraction Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Status**: ✅ Text extraction successful

---

## 📖 Full Content

{full_text}

---

*Converted for ZANTARA AI Worker #2 - Immigration & Manpower Specialist*
"""

                with open(md_path, 'w', encoding='utf-8') as f:
                    f.write(markdown_content)

                working_files.append((filename, md_path, file_size))
                print(f"✅ Converted to markdown: {md_filename}")

            else:
                print(f"❌ CORRUPTED - {content}")
        else:
            print(f"❌ NOT FOUND: {filename}")

        print()

    # Search for additional files in Desktop
    desktop_search = [
        "immigration", "keimigrasian", "visa", "kitas", "kitap",
        "ketenagakerjaan", "manpower", "TKA", "work permit"
    ]

    print("Searching Desktop for additional immigration/manpower files...")
    desktop_path = "/Users/antonellosiano/Desktop"

    for search_term in desktop_search:
        try:
            result = os.popen(f'find "{desktop_path}" -name "*{search_term}*" -type f 2>/dev/null | head -3').read().strip()
            if result:
                files = result.split('\n')
                for file_path in files:
                    if file_path and os.path.exists(file_path):
                        filename = os.path.basename(file_path)
                        if filename.endswith('.md') or filename.endswith('.pdf'):
                            print(f"🔍 Found: {filename}")

                            # Test if it's a working file
                            if filename.endswith('.pdf'):
                                is_working, content, pages = test_pdf_file(file_path)
                                if is_working:
                                    print(f"✅ Additional working file: {filename}")
                                    working_files.append((filename, file_path, os.path.getsize(file_path)))
        except:
            continue

    return working_files

# Main execution
working_files = process_worker_2()

print(f"\n=== WORKER #2 SUMMARY ===")
print(f"✅ Working files found: {len(working_files)}")
for filename, path, size in working_files:
    print(f"   - {filename} ({size:,} bytes)")

print(f"\n🎯 Worker #2 ready with {len(working_files)} immigration/manpower documents!")