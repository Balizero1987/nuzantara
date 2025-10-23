#!/usr/bin/env python3
"""
Extract Mermaid diagrams from Galaxy Map markdown files and generate standalone .mmd files
"""

import re
import os
from pathlib import Path

def extract_mermaid_blocks(markdown_file):
    """Extract all mermaid code blocks from a markdown file"""
    with open(markdown_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all ```mermaid ... ``` blocks
    pattern = r'```mermaid\n(.*?)```'
    blocks = re.findall(pattern, content, re.DOTALL)

    return blocks

def main():
    docs_dir = Path('docs/galaxy-map')
    output_dir = Path('docs/galaxy-map/diagrams')
    output_dir.mkdir(exist_ok=True)

    print("📊 Extracting Mermaid diagrams from Galaxy Map documentation...\n")

    total_diagrams = 0

    for md_file in docs_dir.glob('*.md'):
        print(f"📄 Processing {md_file.name}...")

        blocks = extract_mermaid_blocks(md_file)

        if not blocks:
            print(f"   ⚠️  No diagrams found\n")
            continue

        for idx, block in enumerate(blocks, 1):
            # Create filename: README-01.mmd, 01-system-overview-01.mmd, etc.
            base_name = md_file.stem
            diagram_file = output_dir / f"{base_name}-{idx:02d}.mmd"

            with open(diagram_file, 'w', encoding='utf-8') as f:
                f.write(block.strip())

            print(f"   ✅ Extracted: {diagram_file.name}")
            total_diagrams += 1

        print()

    print(f"✨ Done! Extracted {total_diagrams} diagrams to {output_dir}/")
    print(f"\n📌 Next steps:")
    print(f"   1. Install mermaid-cli: npm install -g @mermaid-js/mermaid-cli")
    print(f"   2. Generate PNGs: cd {output_dir} && for f in *.mmd; do mmdc -i \"$f\" -o \"${{f%.mmd}}.png\" -b transparent; done")
    print(f"   3. View diagrams: open {output_dir}/*.png")

if __name__ == '__main__':
    main()
