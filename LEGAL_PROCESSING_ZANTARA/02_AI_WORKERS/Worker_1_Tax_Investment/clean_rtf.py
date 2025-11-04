#!/usr/bin/env python3
"""
RTF to Clean Markdown Converter for Indonesian Legal Documents
Removes RTF formatting, preserves legal structure (BAB, Pasal, Ayat)
"""

import re
import sys
from pathlib import Path

class RTFCleaner:
    """Clean RTF files and convert to structured markdown"""
    
    def __init__(self, input_file: str, output_file: str):
        self.input_file = Path(input_file)
        self.output_file = Path(output_file)
        
    def remove_rtf_tags(self, content: str) -> str:
        """Remove all RTF control sequences"""
        
        # Remove RTF header and control words
        content = re.sub(r'\\rtf\d+.*?\\cocoatextscaling\d+\\cocoaplatform\d+', '', content)
        content = re.sub(r'\\fonttbl\{[^}]*\}', '', content)
        content = re.sub(r'\\colortbl;[^;]*;', '', content)
        content = re.sub(r'\\paperw\d+.*?\\viewkind\d+', '', content)
        
        # Remove common RTF control sequences
        rtf_patterns = [
            r'\\[a-z]+\d*\s*',  # Control words like \fs24, \par, etc
            r'\{\\[^}]*\}',      # Control groups
            r'\{\*\\[^}]*\}',    # Destination groups
            r'\\\'[0-9a-fA-F]{2}',  # Hex characters
            r'\\uc\d+\\u\d+',    # Unicode
            r'\\u8208',          # Special unicode
            r'\\_',              # Escaped underscore
            r'\\-',              # Soft hyphen
            r'\\page\s*',        # Page break
            r'\\pard[^\\]*',     # Paragraph formatting
            r'\\par\s*',         # Paragraph break
            r'\\tab\s*',         # Tab
            r'\\[{}]',           # Escaped braces
        ]
        
        for pattern in rtf_patterns:
            content = re.sub(pattern, '', content)
        
        # Remove remaining curly braces
        content = content.replace('{', '').replace('}', '')
        
        # Clean up unicode markers
        content = re.sub(r'uc\d+u\d+', '', content)
        
        return content
    
    def clean_text(self, content: str) -> str:
        """Clean and normalize text"""
        
        # Fix common OCR/RTF issues
        content = content.replace('u8208', '-')
        content = content.replace('uc0', '')
        
        # Remove excessive whitespace
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r' {2,}', ' ', content)
        
        # Fix spacing around punctuation
        content = re.sub(r'\s+([.,;:])', r'\1', content)
        
        return content.strip()
    
    def preserve_structure(self, content: str) -> str:
        """Preserve and enhance legal document structure"""
        
        lines = content.split('\n')
        structured = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Mark BAB
            if re.match(r'^BAB\s+[IVX]+', line):
                structured.append(f"\n## {line}\n")
                continue
            
            # Mark Bagian
            if re.match(r'^Bagian\s+', line):
                structured.append(f"\n### {line}\n")
                continue
            
            # Mark Pasal
            if re.match(r'^Pasal\s+\d+[A-Z]*\s*$', line):
                structured.append(f"\n**{line}**\n")
                continue
            
            # Regular content
            structured.append(line)
        
        return '\n'.join(structured)
    
    def convert(self):
        """Main conversion process"""
        print(f"\n{'='*80}")
        print(f"🧹 RTF Cleaning: {self.input_file.name}")
        print(f"{'='*80}\n")
        
        # Read input
        print(f"📖 Reading RTF file...")
        with open(self.input_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original_size = len(content)
        print(f"   Original size: {original_size:,} characters")
        
        # Remove RTF tags
        print(f"🧹 Removing RTF formatting...")
        content = self.remove_rtf_tags(content)
        
        # Clean text
        print(f"🧼 Cleaning text...")
        content = self.clean_text(content)
        
        # Preserve structure
        print(f"📐 Preserving legal structure...")
        content = self.preserve_structure(content)
        
        cleaned_size = len(content)
        reduction = ((original_size - cleaned_size) / original_size) * 100
        
        print(f"   Cleaned size: {cleaned_size:,} characters")
        print(f"   Size reduction: {reduction:.1f}%")
        
        # Count Pasal
        pasal_count = len(re.findall(r'\*\*Pasal\s+\d+', content))
        bab_count = len(re.findall(r'## BAB', content))
        
        print(f"\n📊 Structure detected:")
        print(f"   - BAB: {bab_count}")
        print(f"   - Pasal: {pasal_count}")
        
        # Add header
        header = f"""# {self.input_file.stem.replace('_', ' ').upper()}

## Metadata
- **Source**: {self.input_file.name}
- **Cleaned**: {Path(__file__).name}
- **Status**: RTF cleaned and structured
- **Pasal Count**: {pasal_count}
- **BAB Count**: {bab_count}

---

"""
        content = header + content
        
        # Write output
        print(f"\n💾 Saving to: {self.output_file.name}")
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"\n{'='*80}")
        print(f"✅ Cleaning Complete!")
        print(f"{'='*80}\n")
        
        return pasal_count, bab_count


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 clean_rtf.py <input_rtf_md> <output_clean_md>")
        print("Example: python3 clean_rtf.py 'INPUT_MD/UU 40:2007.md' 'INPUT_MD/UU_40_2007_Clean.md'")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    cleaner = RTFCleaner(input_file, output_file)
    cleaner.convert()
