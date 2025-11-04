#!/usr/bin/env python3
"""
Process Infrastructure and Environment laws for Worker #8
Specialized processor for Indonesian infrastructure, construction, and environmental regulations
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import hashlib

class InfrastructureEnvironmentLawProcessor:
    """Specialized processor for Indonesian Infrastructure and Environment laws"""

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
            'worker_id': 8,
            'worker_name': 'Infrastructure & Environment'
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

        # Handle special cases
        if 'PENDIDIKAN' in base.upper() or 'EDUCATION' in base.upper():
            return "UU-12-2012-PENDIDIKAN-TINGGI"
        elif 'PKWT' in base.upper():
            return "PP-35-2021-PKWT"
        elif 'INFRASTRUCTURE' in base.upper():
            return "INFRASTRUCTURE-REGULATION"

        # Fallback to filename cleanup
        return base.replace(' ', '-').replace('_', '-')

    def _get_law_category(self, law_id: str) -> str:
        """Determine law category based on law ID"""
        if 'PENDIDIKAN' in law_id.upper() or 'EDUCATION' in law_id.upper():
            return 'Higher Education'
        elif 'INFRASTRUCTURE' in law_id.upper() or 'INFRASTRUKTUR' in law_id.upper():
            return 'Infrastructure Development'
        elif 'ENVIRONMENT' in law_id.upper() or 'LINGKUNGAN' in law_id.upper():
            return 'Environmental Protection'
        elif 'CONSTRUCTION' in law_id.upper() or 'KONSTRUKSI' in law_id.upper():
            return 'Construction Regulation'
        else:
            return 'Infrastructure & Environment'

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
            "has_environmental_requirements": False,
            "environmental_requirement_type": [],
            "has_infrastructure_standards": False,
            "infrastructure_standard_type": [],
            "has_penalties": False,
            "penalty_type": [],
            "deadline": None,
            "target_audience": []
        }

        text_lower = text.lower()

        # Infrastructure signals
        if any(word in text_lower for word in ['infrastructure', 'infrastruktur', 'konstruksi', 'bangunan']):
            signals["has_infrastructure_standards"] = True

        if 'infrastruktur' in text_lower:
            signals["infrastructure_standard_type"].append("Infrastructure Development")
        if 'konstruksi' in text_lower:
            signals["infrastructure_standard_type"].append("Construction Standards")
        if 'bangunan' in text_lower:
            signals["infrastructure_standard_type"].append("Building Regulations")

        # Environmental signals
        if any(word in text_lower for word in ['lingkungan', 'environment', 'conservasi', 'perlindungan']):
            signals["has_environmental_requirements"] = True

        if 'lingkungan' in text_lower:
            signals["environmental_requirement_type"].append("Environmental Protection")
        if 'conservasi' in text_lower:
            signals["environmental_requirement_type"].append("Conservation")
        if 'perlindungan lingkungan' in text_lower:
            signals["environmental_requirement_type"].append("Environmental Conservation")

        # Permit signals
        if any(word in text_lower for word in ['izin', 'perizinan', 'persetujuan']):
            signals["requires_permit"] = True

        if 'izin lingkungan' in text_lower:
            signals["permit_type"].append("Environmental Permit")
        if 'izin konstruksi' in text_lower:
            signals["permit_type"].append("Construction Permit")
        if 'izin infrastruktur' in text_lower:
            signals["permit_type"].append("Infrastructure Permit")

        # Penalty detection
        if any(word in text_lower for word in ['pidana', 'denda', 'kurungan', 'penjara', 'sanksi']):
            signals["has_penalties"] = True

        if 'denda' in text_lower:
            signals["penalty_type"].append("Fine")
        if 'pidana' in text_lower or 'penjara' in text_lower:
            signals["penalty_type"].append("Criminal")
        if 'sanksi' in text_lower:
            signals["penalty_type"].append("Administrative Sanction")

        # Deadline detection
        deadline_match = re.search(r'(\d+)\s*(hari|bulan|tahun)', text_lower)
        if deadline_match:
            signals["deadline"] = f"{deadline_match.group(1)} {deadline_match.group(2)}"

        # Target audience
        if any(word in text_lower for word in ['kontraktor', 'pengembang', 'developer']):
            signals["target_audience"].append("Construction Companies")
        if 'institusi pendidikan' in text_lower or 'universitas' in text_lower:
            signals["target_audience"].append("Educational Institutions")
        if 'pemerintah' in text_lower:
            signals["target_audience"].append("Government")
        if 'masyarakat' in text_lower:
            signals["target_audience"].append("General Public")

        return signals

    def process_file(self, input_path: str, output_dir: str = "OUTPUT") -> bool:
        """Process a single law file"""

        input_path = Path(input_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)

        print(f"🏗️ Processing: {input_path.name}")

        try:
            # Read file content
            with open(input_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip if too short
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
        """Extract infrastructure and environment terms from chunks"""
        glossary = {}

        for chunk in chunks:
            text = chunk['text']

            # Infrastructure and environment terms
            terms = [
                'Infrastructure', 'Infrastruktur', 'Konstruksi', 'Construction',
                'Environmental Impact', 'Dampak Lingkungan', 'Building Permit',
                'Izin Mendirikan Bangunan', 'Educational Institution', 'Institusi Pendidikan',
                'Higher Education', 'Pendidikan Tinggi', 'Environmental Protection',
                'Perlindungan Lingkungan', 'Sustainable Development', 'Pembangunan Berkelanjutan'
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
Processed by Worker #8 (Infrastructure & Environment) specialized AI processor.
Content covers Indonesian infrastructure development and environmental regulations.
"""

        return report

def main():
    """Process infrastructure and environment laws for Worker #8"""

    processor = InfrastructureEnvironmentLawProcessor()

    # Files to process (the infrastructure laws we identified)
    files_to_process = [
        "INPUT_MD/PP Nomor 35 Tahun 2021.md",
        "INPUT_MD/PP Nomor 44 Tahun 2022.md",
        "INPUT_MD/PP Nomor 55 Tahun 2022.md",
        "INPUT_MD/UU Nomor 12 Tahun 2012.md"
    ]

    print("🏗️ PROCESSING INFRASTRUCTURE & ENVIRONMENT LAWS")
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