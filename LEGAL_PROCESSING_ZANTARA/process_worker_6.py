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

def process_worker_6():
    """Process Worker #6 Specialized Laws files"""
    input_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_6_Specialized/INPUT"
    output_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_6_Specialized/INPUT_MD"

    os.makedirs(output_dir, exist_ok=True)

    # Expected critical laws for Worker #6
    target_files = [
        "KUHP_2025_New.pdf",               # New Criminal Code
        "KUHPerdata_Burgerlijk_Wetboek.pdf", # Civil Code
        "UU_40_2007_PT.pdf",              # Company Law
    ]

    working_files = []

    print(f"=== WORKER #6 - SPECIALIZED LAWS & CODES ===")
    print(f"Processing {len(target_files)} critical files...\n")

    # Check existing files
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

                # Extract full text
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
- **Focus**: Indonesian Legal Codes & Specialized Laws

---

## 📖 Full Content

{full_text}

---

*Converted for ZANTARA AI Worker #6 - Specialized Laws & Code Specialist*
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

    # Search for legal codes and specialized files in Desktop
    search_terms = [
        "KUHP", "criminal code", "kitab undang-undang hukum pidana",
        "KUHPerdata", "civil code", "burgerlijk wetboek",
        "Company Law", "PT", "perseroan terbatas",
        "KUHPerdata", "KUHData", "civil code",
        "UU 40 2007", "company law", "badan hukum"
    ]

    print("Searching Desktop for legal codes and specialized files...")
    desktop_path = "/Users/antonellosiano/Desktop"

    for search_term in search_terms:
        try:
            result = os.popen(f'find "{desktop_path}" -name "*{search_term}*" -type f 2>/dev/null | head -3').read().strip()
            if result:
                files = result.split('\n')
                for file_path in files:
                    if file_path and os.path.exists(file_path):
                        filename = os.path.basename(file_path)
                        if filename.endswith('.md') or filename.endswith('.pdf'):
                            file_size = os.path.getsize(file_path)
                            print(f"🔍 Found: {filename} ({file_size:,} bytes)")

                            if filename.endswith('.pdf'):
                                is_working, content, pages = test_pdf_file(file_path)
                                if is_working and file_size > 50000:  # Only substantial files
                                    print(f"✅ Additional working file: {filename}")
                                    working_files.append((filename, file_path, file_size))
                            else:
                                # Copy md files directly
                                md_path = os.path.join(output_dir, filename)
                                if not os.path.exists(md_path):
                                    os.system(f'cp "{file_path}" "{md_path}"')
                                    working_files.append((filename, md_path, file_size))
                                    print(f"✅ Copied markdown: {filename}")
        except:
            continue

    # Also check RAW_LAWS directory for large files
    raw_laws_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS"
    if os.path.exists(raw_laws_dir):
        print("Checking RAW_LAWS directory for specialized law files...")
        try:
            result = os.popen(f'find "{raw_laws_dir}" -name "*.pdf" -exec ls -la {{}} \; 2>/dev/null | grep -E "(KUHP|KUHPerdata|Civil|Company|40_2007)" | head -5').read().strip()
            if result:
                lines = result.split('\n')
                for line in lines:
                    if line.strip():
                        parts = line.split()
                        if len(parts) >= 9:
                            file_size = int(parts[4])
                            filename = parts[8:]
                            if file_size > 500000:  # Look for files > 500KB
                                file_path = os.path.join(raw_laws_dir, filename)
                                if os.path.exists(file_path):
                                    print(f"🔍 Large RAW_LAWS Found: {filename} ({file_size:,} bytes)")

                                    is_working, content, pages = test_pdf_file(file_path)
                                    if is_working:
                                        # Copy to Worker 6
                                        dest_path = os.path.join(input_dir, filename)
                                        os.system(f'cp "{file_path}" "{dest_path}"')
                                        print(f"✅ Copied to Worker 6: {filename}")

                                        # Convert to markdown
                                        md_filename = filename.replace('.pdf', '.md')
                                        md_path = os.path.join(output_dir, md_filename)

                                        with open(file_path, 'rb') as f:
                                            pdf_reader = PyPDF2.PdfReader(f)
                                            full_text = ""
                                            for page_num in range(len(pdf_reader.pages)):
                                                page = pdf_reader.pages[page_num]
                                                full_text += page.extract_text() + "\n\n"

                                        markdown_content = f"""# 📜 {filename.replace('.pdf', '').replace('_', ' ').upper()}

## 📋 Metadata
- **Filename**: {filename}
- **Pages**: {len(pdf_reader.pages)}
- **Size**: {file_size:,} bytes
- **Extraction Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Status**: ✅ Text extraction successful

---

## 📖 Full Content

{full_text}

---

*Converted for ZANTARA AI Worker #6 - Specialized Laws & Code Specialist*
"""

                                        with open(md_path, 'w', encoding='utf-8') as f:
                                            f.write(markdown_content)

                                        working_files.append((filename, md_path, file_size))
        except:
            pass

    return working_files

# Main execution
working_files = process_worker_6()

print(f"\n=== WORKER #6 SUMMARY ===")
print(f"✅ Working files found: {len(working_files)}")
for filename, path, size in working_files:
    print(f"   - {filename} ({size:,} bytes)")

print(f"\n🎯 Worker #6 ready with {len(working_files)} specialized law documents!")