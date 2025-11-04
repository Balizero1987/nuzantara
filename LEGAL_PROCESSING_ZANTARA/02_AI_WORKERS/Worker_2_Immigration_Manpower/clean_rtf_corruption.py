#!/usr/bin/env python3
"""
Script to clean RTF corruption from Indonesian law files
and convert them to clean Markdown format
"""

import re
import os
from pathlib import Path

def clean_rtf_content(content: str) -> str:
    """Clean RTF formatted content to plain text"""

    # If it's already clean, return as-is
    if not content.startswith('{\\rtf1') and not content.startswith('\x0c<('):
        return content

    # Handle RTF format
    if content.startswith('{\\rtf1'):
        # Remove RTF headers and formatting
        content = re.sub(r'\{[^}]+\}', '', content)
        content = re.sub(r'\\[^ ]+', '', content)
        content = re.sub(r'[{}]', '', content)

        # Clean up extra whitespace
        content = re.sub(r'\n\s*\n', '\n\n', content)
        content = re.sub(r' +', ' ', content)

        return content.strip()

    # Handle binary corruption (starting with <( )
    if content.startswith('\x0c<('):
        # This is severely corrupted, try to extract readable text
        content = re.sub(r'[^\x20-\x7E\n\r\t]', '', content)
        content = re.sub(r'[^\w\s\n\r\t.,;:()-]', '', content)

        # Try to reconstruct some structure
        lines = content.split('\n')
        clean_lines = []

        for line in lines:
            if len(line.strip()) > 3:  # Keep lines with substantial content
                clean_lines.append(line.strip())

        return '\n'.join(clean_lines)

    return content

def process_file(input_path: str, output_path: str = None):
    """Process a single corrupted file"""

    if output_path is None:
        output_path = input_path.replace('.md', '_CLEAN.md')

    print(f"Processing: {input_path}")

    try:
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        original_size = len(content)
        clean_content = clean_rtf_content(content)
        clean_size = len(clean_content)

        # Write clean version
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(clean_content)

        print(f"  ✅ Cleaned: {original_size} → {clean_size} chars")
        print(f"  📁 Output: {output_path}")

        # If cleaning was successful and significantly reduced content,
        # replace the original file
        if clean_size > 1000:  # Only replace if we have substantial content
            with open(input_path, 'w', encoding='utf-8') as f:
                f.write(clean_content)
            print(f"  ✅ Replaced original file")
            os.remove(output_path)

    except Exception as e:
        print(f"  ❌ Error: {e}")

def main():
    """Process all corrupted files in INPUT_MD directory"""

    input_dir = Path("INPUT_MD")

    # Files that need cleaning (based on our inspection)
    corrupted_files = [
        "UU 13:2003 Ketenagakerjaan.md",
        "PP_34_2021_TKA.md",
        "Nomor 8 Tahun 2025.md",
        "Permenaker 8:2021.md",
        "PP 31:2013.md",
        "Nomor 3 Tahun 2024.md",
        "UU 13:2003.md",
        "UU 20:2016 TKA.md",
        "UU 6 Tahun 2011.md"
    ]

    print("🧹 CLEANING RTF CORRUPTED FILES")
    print("=" * 50)

    processed_count = 0

    for filename in corrupted_files:
        file_path = input_dir / filename

        if file_path.exists():
            # Check if actually corrupted
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                first_line = f.readline()

            if first_line.startswith('{\\rtf1') or first_line.startswith('\x0c<('):
                process_file(str(file_path))
                processed_count += 1
            else:
                print(f"✅ Already clean: {filename}")
        else:
            print(f"❌ File not found: {filename}")

    print("=" * 50)
    print(f"📊 Processed {processed_count} corrupted files")

if __name__ == "__main__":
    main()