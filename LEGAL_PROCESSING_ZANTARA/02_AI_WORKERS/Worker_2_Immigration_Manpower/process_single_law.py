#!/usr/bin/env python3
"""
Process a single Indonesian law file into JSONL format for AI knowledge base
Modified from Worker #1 processing script for Worker #2 Immigration & Manpower
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import hashlib

class ImmigrationLawProcessor:
    """Specialized processor for Indonesian Immigration and Manpower laws"""

    def __init__(self):
        self.pasal_pattern = re.compile(r'Pasal\s+(\d+)', re.IGNORECASE)
        self.ayat_pattern = re.compile(r'\((\d+)\)')
        self.huruf_pattern = re.compile(r'([a-z])\.\s*')

    def extract_law_metadata(self, filename: str, content: str) -> Dict[str, Any]:
        """Extract metadata from law filename and content"""

        # Parse law ID from filename
        law_id = self._extract_law_id(filename)

        # Extract law type and year
        if 'UU' in law_id:
            law_type = 'Undang-Undang'
        elif 'PP' in law_id:
            law_type = 'Peraturan Pemerintah'
        elif 'Perpres' in law_id:
            law_type = 'Peraturan Presiden'
        elif 'Permenaker' in law_id:
            law_type = 'Peraturan Menteri Ketenagakerjaan'
        else:
            law_type = 'Peraturan'

        # Extract year from law_id
        year_match = re.search(r'(\d{4})', law_id)
        year = int(year_match.group()) if year_match else None

        return {
            'law_id': law_id,
            'law_type': law_type,
            'year': year,
            'category': self._get_law_category(law_id),
            'worker_id': 2,
            'worker_name': 'Immigration & Manpower'
        }

    def _extract_law_id(self, filename: str) -> str:
        """Extract standardized law ID from filename"""
        # Remove file extension and normalize
        base = Path(filename).stem

        # Handle various formats
        if 'UU' in base.upper():
            # Extract UU number and year
            match = re.search(r'UU.*?(\d+).*?(\d{4})', base, re.IGNORECASE)
            if match:
                return f"UU-{match.group(1)}-{match.group(2)}"
        elif 'PP' in base.upper():
            # Extract PP number and year
            match = re.search(r'PP.*?(\d+).*?(\d{4})', base, re.IGNORECASE)
            if match:
                return f"PP-{match.group(1)}-{match.group(2)}"
        elif 'Permenaker' in base:
            # Extract Permenaker number and year
            match = re.search(r'Permenaker.*?(\d+).*?(\d{4})', base, re.IGNORECASE)
            if match:
                return f"Permenaker-{match.group(1)}-{match.group(2)}"
        elif 'Nomor' in base:
            # Extract Nomor and year
            match = re.search(r'Nomor.*?(\d+).*?(\d{4})', base, re.IGNORECASE)
            if match:
                return f"Nomor-{match.group(1)}-{match.group(2)}"

        # Fallback to filename cleanup
        return base.replace(' ', '-').replace('_', '-')

    def _get_law_category(self, law_id: str) -> str:
        """Determine law category based on law ID"""
        if 'immigration' in law_id.lower() or 'imigrasi' in law_id.lower():
            return 'Immigration'
        elif 'ketenagakerjaan' in law_id.lower() or 'manpower' in law_id.lower():
            return 'Manpower'
        elif 'TKA' in law_id:
            return 'Foreign Workers'
        elif 'Permenaker' in law_id:
            return 'Manpower Regulation'
        else:
            return 'General Employment'

    def chunk_law_content(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chunk law content into structured pieces"""

        chunks = []

        # Split into pasal sections
        pasal_sections = self.pasal_pattern.split(content)

        current_pasal = None
        current_text = ""

        for i, section in enumerate(pasal_sections):
            if i == 0:
                # Title section before first Pasal
                if section.strip():
                    chunk = self._create_chunk(
                        chunk_id=f"{metadata['law_id']}-TITLE",
                        chunk_type="title",
                        text=section.strip(),
                        metadata={**metadata, "section": "title"},
                        signals=self._extract_signals(section.strip(), metadata)
                    )
                    chunks.append(chunk)
            elif i % 2 == 1:
                # This is a pasal number
                current_pasal = section.strip()
                current_text = f"Pasal {current_pasal}\n"
            else:
                # This is pasal content
                current_text += section.strip()

                if current_pasal and current_text.strip():
                    chunk = self._create_chunk(
                        chunk_id=f"{metadata['law_id']}-Pasal-{current_pasal}",
                        chunk_type="pasal",
                        text=current_text,
                        metadata={**metadata, "pasal": current_pasal},
                        signals=self._extract_signals(current_text, metadata)
                    )
                    chunks.append(chunk)

        return chunks

    def _create_chunk(self, chunk_id: str, chunk_type: str, text: str,
                     metadata: Dict[str, Any], signals: Dict[str, Any]) -> Dict[str, Any]:
        """Create a standardized chunk"""

        return {
            "chunk_id": chunk_id,
            "type": chunk_type,
            "text": text,
            "metadata": {
                **metadata,
                "line_number": None,
                "word_count": len(text.split()),
                "char_count": len(text)
            },
            "signals": signals
        }

    def _extract_signals(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract signals and legal indicators from text"""

        signals = {
            "applies_to": [],
            "requires_permit": False,
            "permit_type": [],
            "has_penalty": False,
            "penalty_type": [],
            "deadline": None,
            "amount_threshold": None,
            "citizenship_requirement": None,
            "target_audience": []
        }

        text_lower = text.lower()

        # Immigration signals
        if any(word in text_lower for word in ['visa', 'izin tinggal', 'paspor', 'imigrasi']):
            signals["applies_to"].append("Foreign Nationals")
            signals["requires_permit"] = True

        if 'visa' in text_lower:
            signals["permit_type"].append("Visa")
        if 'izin tinggal' in text_lower:
            signals["permit_type"].append("Izin Tinggal")
        if 'kitap' in text_lower:
            signals["permit_type"].append("KITAP")
        if 'kitas' in text_lower:
            signals["permit_type"].append("KITAS")

        # Manpower signals
        if any(word in text_lower for word in ['tenaga kerja asing', 'tka', 'expatriate']):
            signals["applies_to"].append("Foreign Workers")
            signals["target_audience"].append("Employers")
            signals["requires_permit"] = True

        if 'rptka' in text_lower:
            signals["permit_type"].append("RPTKA")
        if 'imta' in text_lower:
            signals["permit_type"].append("IMTA")

        # Penalty detection
        if any(word in text_lower for word in ['pidana', 'denda', 'kurungan', 'penjara']):
            signals["has_penalty"] = True

        if 'denda' in text_lower:
            signals["penalty_type"].append("Fine")
        if 'pidana' in text_lower or 'penjara' in text_lower:
            signals["penalty_type"].append("Criminal")

        # Deadline detection
        deadline_match = re.search(r'(\d+)\s*(hari|bulan|tahun)', text_lower)
        if deadline_match:
            signals["deadline"] = f"{deadline_match.group(1)} {deadline_match.group(2)}"

        # Amount detection
        amount_match = re.search(r'rp\s*([\d,.]+)', text_lower)
        if amount_match:
            signals["amount_threshold"] = amount_match.group(1)

        return signals

    def process_file(self, input_path: str, output_dir: str = "OUTPUT") -> bool:
        """Process a single law file"""

        input_path = Path(input_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)

        print(f"📄 Processing: {input_path.name}")

        try:
            # Read file content
            with open(input_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip if too short or corrupted
            if len(content) < 1000:
                print(f"⚠️  File too short: {len(content)} chars")
                return False

            # Extract metadata
            metadata = self.extract_law_metadata(input_path.name, content)

            # Chunk content
            chunks = self.chunk_law_content(content, metadata)

            if not chunks:
                print(f"⚠️  No chunks generated")
                return False

            # Write JSONL output
            output_file = output_dir / f"{metadata['law_id']}_READY_FOR_KB.jsonl"

            with open(output_file, 'w', encoding='utf-8') as f:
                for chunk in chunks:
                    f.write(json.dumps(chunk, ensure_ascii=False) + '\n')

            print(f"✅ Processed: {len(chunks)} chunks → {output_file.name} ({output_file.stat().st_size} bytes)")

            # Generate supporting files
            self._generate_supporting_files(metadata, chunks, output_dir)

            return True

        except Exception as e:
            print(f"❌ Error processing {input_path.name}: {e}")
            return False

    def _generate_supporting_files(self, metadata: Dict[str, Any], chunks: List[Dict[str, Any]], output_dir: Path):
        """Generate supporting files (glossary, metadata, report)"""

        law_id = metadata['law_id']

        # Generate glossary
        glossary = self._extract_glossary(chunks)
        with open(output_dir / f"{law_id}_GLOSSARY.json", 'w', encoding='utf-8') as f:
            json.dump(glossary, f, ensure_ascii=False, indent=2)

        # Generate metadata file
        with open(output_dir / f"{law_id}_METADATA.json", 'w', encoding='utf-8') as f:
            json.dump({
                **metadata,
                "total_chunks": len(chunks),
                "total_pasal": len([c for c in chunks if c['type'] == 'pasal']),
                "processing_date": "2025-11-03"
            }, f, ensure_ascii=False, indent=2)

        # Generate processing report
        report = self._generate_processing_report(metadata, chunks)
        with open(output_dir / f"{law_id}_PROCESSING_REPORT.md", 'w', encoding='utf-8') as f:
            f.write(report)

    def _extract_glossary(self, chunks: List[Dict[str, Any]]) -> Dict[str, str]:
        """Extract legal terms from chunks"""
        glossary = {}

        for chunk in chunks:
            text = chunk['text']

            # Common Indonesian legal terms
            terms = [
                'Tenaga Kerja Asing', 'Izin Tinggal', 'Visa', 'Paspor',
                'RPTKA', 'IMTA', 'KITAS', 'KITAP', 'Perusahaan',
                'Pekerja', 'Buruh', 'Pengusaha', 'Pemerintah'
            ]

            for term in terms:
                if term.lower() in text.lower() and term not in glossary:
                    # Simple definition extraction
                    lines = text.split('\n')
                    for i, line in enumerate(lines):
                        if term.lower() in line.lower():
                            # Get next line or same line as definition
                            if i + 1 < len(lines) and len(lines[i+1]) > 20:
                                glossary[term] = lines[i+1].strip()
                                break
                            elif len(line) > 30:
                                # Extract definition from same line
                                parts = line.split(':', 1)
                                if len(parts) > 1:
                                    glossary[term] = parts[1].strip()
                                break

        return glossary

    def _generate_processing_report(self, metadata: Dict[str, Any], chunks: List[Dict[str, Any]]) -> str:
        """Generate processing report"""

        pasal_chunks = [c for c in chunks if c['type'] == 'pasal']

        report = f"""# Processing Report: {metadata['law_id']}

## Law Information
- **Law ID**: {metadata['law_id']}
- **Type**: {metadata['law_type']}
- **Year**: {metadata['year']}
- **Category**: {metadata['category']}

## Processing Statistics
- **Total Chunks**: {len(chunks)}
- **Pasal Count**: {len(pasal_chunks)}
- **Total Characters**: {sum(c['metadata']['char_count'] for c in chunks)}
- **Total Words**: {sum(c['metadata']['word_count'] for c in chunks)}

## Pasal Summary
"""

        for chunk in pasal_chunks[:10]:  # Show first 10 Pasal
            pasal_num = chunk['metadata']['pasal']
            word_count = chunk['metadata']['word_count']
            report += f"- Pasal {pasal_num}: {word_count} words\n"

        if len(pasal_chunks) > 10:
            report += f"... and {len(pasal_chunks) - 10} more Pasal\n"

        report += f"""
## Quality Assessment
- **Content Quality**: {'Good' if len(chunks) > 5 else 'Needs Review'}
- **Structure**: {'Well-structured' if pasal_chunks else 'Poor structure'}
- **Completeness**: {'Complete' if len(chunks) > 10 else 'Partial'}

## Processing Date
2025-11-03

## Notes
Processed by Worker #2 (Immigration & Manpower) specialized AI processor.
"""

        return report

def main():
    """Process specified law file"""

    processor = ImmigrationLawProcessor()

    # Files to process (the ones we just cleaned)
    files_to_process = [
        "INPUT_MD/UU 13:2003 Ketenagakerjaan.md",
        "INPUT_MD/PP 31:2013.md",
        "INPUT_MD/Nomor 8 Tahun 2025.md",
        "INPUT_MD/Permenaker 8:2021.md",
        "INPUT_MD/Nomor 3 Tahun 2024.md",
        "INPUT_MD/UU 13:2003.md",
        "INPUT_MD/UU 20:2016 TKA.md",
        "INPUT_MD/UU 6 Tahun 2011.md"
    ]

    print("🔧 PROCESSING CLEANED INDONESIAN LAWS")
    print("=" * 60)

    processed_count = 0

    for file_path in files_to_process:
        if Path(file_path).exists():
            if processor.process_file(file_path):
                processed_count += 1
        else:
            print(f"❌ File not found: {file_path}")

    print("=" * 60)
    print(f"📊 Successfully processed {processed_count}/{len(files_to_process)} files")

if __name__ == "__main__":
    main()