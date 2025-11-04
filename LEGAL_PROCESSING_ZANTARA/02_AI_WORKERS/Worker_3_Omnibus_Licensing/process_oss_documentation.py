#!/usr/bin/env python3
"""
Process OSS/NIB Business Licensing documentation for Worker #3
Specialized processor for Indonesian business licensing procedures
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional
import hashlib

class OmnibusLicensingProcessor:
    """Specialized processor for Indonesian Omnibus Licensing laws and procedures"""

    def __init__(self):
        self.pasal_pattern = re.compile(r'Pasal\s+(\d+)', re.IGNORECASE)
        self.section_pattern = re.compile(r'^#{1,6}\s+(.+)$', re.MULTILINE)

    def extract_document_metadata(self, filename: str, content: str) -> Dict[str, Any]:
        """Extract metadata from documentation file"""

        # Parse document ID from filename
        doc_id = self._extract_doc_id(filename)

        # Extract document type
        if 'OSS' in filename.upper() or 'NIB' in filename.upper():
            doc_type = 'OSS/NIB Procedure'
        elif 'PP' in filename.upper():
            doc_type = 'Peraturan Pemerintah'
        elif 'UU' in filename.upper():
            doc_type = 'Undang-Undang'
        else:
            doc_type = 'Business Licensing Documentation'

        # Extract year from filename
        year_match = re.search(r'(\d{4})', filename)
        year = int(year_match.group()) if year_match else 2025

        return {
            'doc_id': doc_id,
            'doc_type': doc_type,
            'year': year,
            'category': 'Omnibus Licensing',
            'worker_id': 3,
            'worker_name': 'Omnibus Licensing'
        }

    def _extract_doc_id(self, filename: str) -> str:
        """Extract standardized document ID from filename"""
        base = Path(filename).stem

        # Clean and normalize
        doc_id = base.replace(' ', '-').replace('_', '-')

        # Handle special cases
        if 'OSS_NIB' in doc_id:
            return 'OSS-NIB-BUSINESS-LICENSING-2025'
        elif 'BRIEF' in doc_id:
            return 'BRIEF-AUTONOMIA-LOCALE'
        else:
            return doc_id

    def _get_document_category(self, doc_id: str) -> str:
        """Determine document category based on doc ID"""
        if 'OSS' in doc_id.upper() or 'NIB' in doc_id.upper():
            return 'OSS/NIB Procedures'
        elif 'AUTONOMIA' in doc_id.upper():
            return 'Local Autonomy'
        elif 'LICENSING' in doc_id.upper():
            return 'Business Licensing'
        else:
            return 'General Procedure'

    def chunk_document_content(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chunk document content into structured pieces"""

        chunks = []

        # Split into sections using markdown headers
        sections = self._split_by_sections(content)

        current_section = "Introduction"
        section_content = ""

        for section in sections:
            if section.strip():
                # Check if this is a header
                header_match = re.match(r'^#{1,6}\s+(.+)$', section.strip(), re.MULTILINE)

                if header_match:
                    # Save previous section content
                    if section_content.strip():
                        chunk = self._create_chunk(
                            chunk_id=f"{metadata['doc_id']}-{self._clean_section_name(current_section)}",
                            chunk_type="section",
                            text=section_content.strip(),
                            metadata={**metadata, "section": current_section},
                            signals=self._extract_signals(section_content, metadata)
                        )
                        chunks.append(chunk)

                    # Start new section
                    current_section = header_match.group(1).strip()
                    section_content = section
                else:
                    # Continue current section
                    section_content += "\n\n" + section

        # Don't forget the last section
        if section_content.strip():
            chunk = self._create_chunk(
                chunk_id=f"{metadata['doc_id']}-{self._clean_section_name(current_section)}",
                chunk_type="section",
                text=section_content.strip(),
                metadata={**metadata, "section": current_section},
                signals=self._extract_signals(section_content, metadata)
            )
            chunks.append(chunk)

        # If no sections found, treat as single document
        if not chunks:
            chunk = self._create_chunk(
                chunk_id=f"{metadata['doc_id']}-DOCUMENT",
                chunk_type="document",
                text=content.strip(),
                metadata={**metadata, "section": "Full Document"},
                signals=self._extract_signals(content, metadata)
            )
            chunks.append(chunk)

        return chunks

    def _split_by_sections(self, content: str) -> List[str]:
        """Split content by markdown headers"""
        # Split by headers (lines starting with #)
        sections = re.split(r'\n(?=#{1,6}\s+)', content)
        return [section.strip() for section in sections if section.strip()]

    def _clean_section_name(self, section_name: str) -> str:
        """Clean section name for use in chunk_id"""
        # Remove special characters and replace spaces
        clean_name = re.sub(r'[^a-zA-Z0-9\s-]', '', section_name)
        clean_name = re.sub(r'\s+', '-', clean_name.strip())
        return clean_name[:50]  # Limit length

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
        """Extract signals and indicators from text"""

        signals = {
            "applies_to": [],
            "requires_permit": False,
            "permit_type": [],
            "has_procedures": False,
            "procedure_type": [],
            "has_timeline": False,
            "timeline_type": [],
            "business_types": [],
            "compliance_required": False,
            "target_audience": []
        }

        text_lower = text.lower()

        # Business licensing signals
        if any(word in text_lower for word in ['izin', 'perizinan', 'license', 'licensi']):
            signals["requires_permit"] = True

        if 'nib' in text_lower:
            signals["permit_type"].append("NIB")
        if 'oss' in text_lower:
            signals["permit_type"].append("OSS")
        if 'izin komersial' in text_lower:
            signals["permit_type"].append("Izin Komersial")
        if 'izin operasional' in text_lower:
            signals["permit_type"].append("Izin Operasional")

        # Procedure detection
        if any(word in text_lower for word in ['prosedur', 'procedure', 'langkah', 'tahapan']):
            signals["has_procedures"] = True

        if 'risk-based' in text_lower:
            signals["procedure_type"].append("Risk-Based Assessment")
        if 'standard' in text_lower:
            signals["procedure_type"].append("Standard Certificate")

        # Timeline detection
        if any(word in text_lower for word in ['hari', 'bulan', 'tahun', 'waktu', 'timeline']):
            signals["has_timeline"] = True

        if 'timeline' in text_lower:
            signals["timeline_type"].append("Processing Timeline")
        if 'deadline' in text_lower:
            signals["timeline_type"].append("Deadline")

        # Business types
        if any(word in text_lower for word in ['usaha kecil', 'umkm', 'small business']):
            signals["business_types"].append("UMKM")
        if 'penanaman modal' in text_lower:
            signals["business_types"].append("Investment")
        if 'usaha besar' in text_lower:
            signals["business_types"].append("Large Enterprise")

        # Compliance detection
        if any(word in text_lower for word in ['pelaporan', 'reporting', 'lkpm', 'compliance']):
            signals["compliance_required"] = True

        # Target audience
        if any(word in text_lower for word in ['pengusaha', 'entrepreneur', 'business owner']):
            signals["target_audience"].append("Business Owners")
        if 'investor' in text_lower:
            signals["target_audience"].append("Investors")
        if 'konsultan' in text_lower:
            signals["target_audience"].append("Consultants")

        return signals

    def process_file(self, input_path: str, output_dir: str = "OUTPUT") -> bool:
        """Process a single documentation file"""

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

            # Skip if PDF binary data
            if content.startswith('%PDF-'):
                print(f"⚠️  PDF binary file detected, skipping")
                return False

            # Extract metadata
            metadata = self.extract_document_metadata(input_path.name, content)

            # Chunk content
            chunks = self.chunk_document_content(content, metadata)

            if not chunks:
                print(f"⚠️  No chunks generated")
                return False

            # Write JSONL output
            output_file = output_dir / f"{metadata['doc_id']}_READY_FOR_KB.jsonl"

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

        doc_id = metadata['doc_id']

        # Generate glossary
        glossary = self._extract_glossary(chunks)
        with open(output_dir / f"{doc_id}_GLOSSARY.json", 'w', encoding='utf-8') as f:
            json.dump(glossary, f, ensure_ascii=False, indent=2)

        # Generate metadata file
        with open(output_dir / f"{doc_id}_METADATA.json", 'w', encoding='utf-8') as f:
            json.dump({
                **metadata,
                "total_chunks": len(chunks),
                "total_sections": len([c for c in chunks if c['type'] == 'section']),
                "processing_date": "2025-11-03"
            }, f, ensure_ascii=False, indent=2)

        # Generate processing report
        report = self._generate_processing_report(metadata, chunks)
        with open(output_dir / f"{doc_id}_PROCESSING_REPORT.md", 'w', encoding='utf-8') as f:
            f.write(report)

    def _extract_glossary(self, chunks: List[Dict[str, Any]]) -> Dict[str, str]:
        """Extract business licensing terms from chunks"""
        glossary = {}

        for chunk in chunks:
            text = chunk['text']

            # Business licensing terms
            terms = [
                'OSS', 'NIB', 'BKPM', 'Izin Usaha', 'Izin Komersial',
                'Izin Operasional', 'Risk-Based Approach', 'Sertifikat Standar',
                'Penanaman Modal', 'UMKM', 'Investasi', 'Perizinan',
                'LKPM', 'Pelaporan Kegiatan Penanaman Modal'
            ]

            for term in terms:
                if term in text and term not in glossary:
                    # Try to extract definition
                    lines = text.split('\n')
                    for i, line in enumerate(lines):
                        if term in line:
                            # Look for definition in next line or same line
                            if i + 1 < len(lines) and len(lines[i+1]) > 20:
                                glossary[term] = lines[i+1].strip()
                                break
                            elif '**' in line and ':' in line:
                                parts = line.split(':', 1)
                                if len(parts) > 1:
                                    glossary[term] = parts[1].strip().replace('*', '')
                                    break

        return glossary

    def _generate_processing_report(self, metadata: Dict[str, Any], chunks: List[Dict[str, Any]]) -> str:
        """Generate processing report"""

        sections = [c for c in chunks if c['type'] == 'section']

        report = f"""# Processing Report: {metadata['doc_id']}

## Document Information
- **Document ID**: {metadata['doc_id']}
- **Type**: {metadata['doc_type']}
- **Year**: {metadata['year']}
- **Category**: {metadata['category']}

## Processing Statistics
- **Total Chunks**: {len(chunks)}
- **Sections**: {len(sections)}
- **Total Characters**: {sum(c['metadata']['char_count'] for c in chunks)}
- **Total Words**: {sum(c['metadata']['word_count'] for c in chunks)}

## Content Sections
"""

        for chunk in sections[:10]:  # Show first 10 sections
            section_name = chunk['metadata']['section']
            word_count = chunk['metadata']['word_count']
            report += f"- {section_name}: {word_count} words\n"

        if len(sections) > 10:
            report += f"... and {len(sections) - 10} more sections\n"

        report += f"""
## Quality Assessment
- **Content Quality**: {'Good' if len(chunks) > 3 else 'Needs Review'}
- **Structure**: {'Well-structured' if sections else 'Single document'}
- **Completeness**: {'Complete' if len(chunks) > 5 else 'Partial'}

## Processing Date
2025-11-03

## Notes
Processed by Worker #3 (Omnibus Licensing) specialized AI processor.
Document covers Indonesian business licensing procedures and regulations.
"""

        return report

def main():
    """Process OSS/NIB documentation for Worker #3"""

    processor = OmnibusLicensingProcessor()

    # Files to process (focus on the large OSS documentation)
    files_to_process = [
        "INPUT_MD/OSS_NIB_BUSINESS_LICENSING_LEGAL_PROCESSES_2025.md"
    ]

    print("🔧 PROCESSING OMNIBUS LICENSING DOCUMENTATION")
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