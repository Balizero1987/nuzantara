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

def process_worker_5():
    """Process Worker #5 Healthcare & Social Security files"""
    input_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT"
    output_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/02_AI_WORKERS/Worker_5_Healthcare_Social/INPUT_MD"

    os.makedirs(output_dir, exist_ok=True)

    # Expected laws for Worker #5
    target_files = [
        "UU_24_2011_BPJS.pdf",             # BPJS Social Security
        "UU_36_2009_Kesehatan.pdf",         # Health Law
        "UU_29_2004_Praktik_Kedokteran.pdf", # Medical Practice
        "UU_44_2009_Rumah_Sakit.pdf",       # Hospital Law
    ]

    working_files = []

    print(f"=== WORKER #5 - HEALTHCARE & SOCIAL SECURITY ===")
    print(f"Processing {len(target_files)} target files...\n")

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
- **Focus**: Healthcare & Social Security Law

---

## 📖 Full Content

{full_text}

---

*Converted for ZANTARA AI Worker #5 - Healthcare & Social Security Specialist*
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

    # Search for healthcare and social security files in Desktop
    search_terms = [
        "BPJS", "social security", "kesehatan", "health", "rumah sakit",
        "hospital", "medical", "kedokteran", "praktik medis",
        "UU 24 2011", "UU 36 2009", "UU 29 2004", "UU 44 2009",
        "asuransi", "insurance", "jamsostek", "jKN", "mandiri"
    ]

    print("Searching Desktop for healthcare and social security files...")
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

    # Also check RAW_LAWS directory
    raw_laws_dir = "/Users/antonellosiano/Desktop/LEGAL_PROCESSING_ZANTARA/01_RAW_LAWS"
    if os.path.exists(raw_laws_dir):
        print("Checking RAW_LAWS directory for healthcare files...")
        try:
            result = os.popen(f'find "{raw_laws_dir}" -name "*24*2011*" -o -name "*36*2009*" -o -name "*29*2004*" -o -name "*44*2009*" -o -name "*kesehatan*" -o -name "*BPJS*" 2>/dev/null').read().strip()
            if result:
                files = result.split('\n')
                for file_path in files:
                    if file_path and os.path.exists(file_path):
                        filename = os.path.basename(file_path)
                        file_size = os.path.getsize(file_path)
                        print(f"🔍 RAW_LAWS Found: {filename} ({file_size:,} bytes)")

                        is_working, content, pages = test_pdf_file(file_path)
                        if is_working and file_size > 50000:
                            # Copy to Worker 5
                            dest_path = os.path.join(input_dir, filename)
                            os.system(f'cp "{file_path}" "{dest_path}"')
                            print(f"✅ Copied to Worker 5: {filename}")

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

*Converted for ZANTARA AI Worker #5 - Healthcare & Social Security Specialist*
"""

                            with open(md_path, 'w', encoding='utf-8') as f:
                                f.write(markdown_content)

                            working_files.append((filename, md_path, file_size))
        except:
            pass

    return working_files

# Main execution
working_files = process_worker_5()

print(f"\n=== WORKER #5 SUMMARY ===")
print(f"✅ Working files found: {len(working_files)}")
for filename, path, size in working_files:
    print(f"   - {filename} ({size:,} bytes)")

print(f"\n🎯 Worker #5 ready with {len(working_files)} healthcare/social documents!")