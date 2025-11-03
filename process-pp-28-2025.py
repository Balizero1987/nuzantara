#!/usr/bin/env python3
"""
PP Nomor 28 Tahun 2025 - New Regulation Processor
==================================================

Extracts and processes PP 28/2025 for ZANTARA Oracle integration
"""

import os
import sys
from datetime import datetime

# Configuration
PDF_FILE = "/Users/antonellosiano/Desktop/PP Nomor 28 Tahun 2025.pdf"
OUTPUT_DIR = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data"
METADATA_FILE = os.path.join(OUTPUT_DIR, "PP_28_2025_metadata.json")

def main():
    print("🔍 PP Nomor 28 Tahun 2025 - Processor")
    print("=" * 70)
    print(f"\nPDF File: {PDF_FILE}")
    print(f"Output Dir: {OUTPUT_DIR}\n")
    
    # Check file exists
    if not os.path.exists(PDF_FILE):
        print("❌ PDF file not found!")
        sys.exit(1)
    
    file_size = os.path.getsize(PDF_FILE)
    print(f"✅ PDF found: {file_size / 1024 / 1024:.2f} MB")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"✅ Output directory ready\n")
    
    # Extract metadata
    print("📊 Extracting metadata...")
    metadata = {
        "regulation_type": "PP",
        "number": 28,
        "year": 2025,
        "full_name": "PP Nomor 28 Tahun 2025",
        "file_path": PDF_FILE,
        "file_size_mb": round(file_size / 1024 / 1024, 2),
        "added_date": datetime.now().isoformat(),
        "status": "new_regulation",
        "category": "legal",
        "domains": ["legal", "tax", "business"],
        "keywords": [
            "PP 28/2025",
            "Peraturan Pemerintah",
            "Indonesian Regulation",
            "2025 Law"
        ],
        "description": "PP Nomor 28 Tahun 2025 - New Indonesian Government Regulation",
        "source": "Desktop upload",
        "priority": "high",
        "requires_processing": True
    }
    
    import json
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Metadata saved: {METADATA_FILE}\n")
    
    # Create integration instructions
    instructions_file = os.path.join(OUTPUT_DIR, "PP_28_2025_INTEGRATION.md")
    with open(instructions_file, 'w') as f:
        f.write(f"""# PP Nomor 28 Tahun 2025 - Integration Guide

## 📋 Document Information

- **Regulation**: PP (Peraturan Pemerintah) Nomor 28 Tahun 2025
- **File**: `{PDF_FILE}`
- **Size**: {file_size / 1024 / 1024:.2f} MB
- **Added**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- **Status**: Ready for processing

---

## 🎯 Integration Steps

### 1. PDF Text Extraction

The PDF needs to be processed with OCR or text extraction tools:

```bash
# Option 1: Using Python (recommended)
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
python3 << 'EOF'
import PyPDF2
with open("{PDF_FILE}", 'rb') as f:
    pdf = PyPDF2.PdfReader(f)
    text = ""
    for page in pdf.pages:
        text += page.extract_text()
    
    with open("oracle-data/PP_28_2025_extracted.txt", 'w') as out:
        out.write(text)
    
    print(f"Extracted {{len(text)}} characters")
EOF

# Option 2: Using pdftotext (if installed)
brew install poppler
pdftotext "{PDF_FILE}" oracle-data/PP_28_2025_extracted.txt

# Option 3: Using online OCR (if scanned images)
# Upload to Google Cloud Vision API or similar
```

### 2. Process for Oracle

Once text is extracted, chunk it for Oracle:

```python
# Process text into chunks
python3 << 'EOF'
import json

with open("oracle-data/PP_28_2025_extracted.txt", 'r') as f:
    full_text = f.read()

# Create chunks (2000 chars each)
chunk_size = 2000
chunks = []
for i in range(0, len(full_text), chunk_size):
    chunk = {{
        "id": f"PP_28_2025_chunk_{{i//chunk_size}}",
        "regulation": "PP 28/2025",
        "content": full_text[i:i+chunk_size],
        "metadata": {{
            "type": "legal_regulation",
            "year": 2025,
            "chunk_number": i//chunk_size,
            "domain": "legal"
        }}
    }}
    chunks.append(chunk)

with open("oracle-data/PP_28_2025_chunks.json", 'w') as f:
    json.dump(chunks, f, indent=2, ensure_ascii=False)

print(f"Created {{len(chunks)}} chunks")
EOF
```

### 3. Upload to Oracle

```python
# Add to ChromaDB Oracle collection
python3 << 'EOF'
import chromadb
import json
from datetime import datetime

# Load chunks
with open("oracle-data/PP_28_2025_chunks.json", 'r') as f:
    chunks = json.load(f)

# Connect to ChromaDB (Railway)
client = chromadb.HttpClient(
    host="your-railway-host",
    port=8000
)

# Get or create legal collection
collection = client.get_or_create_collection(
    name="legal_documents",
    metadata={{"description": "Indonesian Legal Regulations"}}
)

# Add documents
for chunk in chunks:
    collection.add(
        documents=[chunk['content']],
        metadatas=[chunk['metadata']],
        ids=[chunk['id']]
    )

print(f"✅ Added {{len(chunks)}} chunks to Oracle")
EOF
```

### 4. Update ZANTARA Knowledge

Add reference to legal handler:

```typescript
// In apps/backend-ts/src/handlers/legal/legal-query.ts

const PP_28_2025_CONTEXT = {{
  regulation: "PP Nomor 28 Tahun 2025",
  added_date: "{datetime.now().isoformat()}",
  status: "active",
  topics: [
    // Add relevant topics after analyzing content
  ]
}};

// Add to query context when legal questions asked
```

---

## 📊 Expected Oracle Structure

```json
{{
  "collection": "legal_documents",
  "document_type": "PP",
  "regulation_number": 28,
  "regulation_year": 2025,
  "chunks": [
    {{
      "id": "PP_28_2025_chunk_0",
      "content": "Full text content here...",
      "metadata": {{
        "type": "legal_regulation",
        "section": "introduction",
        "page": 1
      }}
    }}
  ],
  "embeddings": "auto-generated by ChromaDB",
  "searchable": true
}}
```

---

## 🎯 ZANTARA Integration Points

### Legal Domain Handler
- **File**: `apps/backend-ts/src/handlers/legal/legal-query.ts`
- **Action**: Add PP 28/2025 to legal knowledge base

### Tax Domain Handler (if relevant)
- **File**: `apps/backend-ts/src/handlers/tax/tax-query.ts`
- **Action**: Reference PP 28/2025 for tax-related queries

### Business Registration Handler (if relevant)
- **File**: `apps/backend-ts/src/handlers/kbli/kbli-query.ts`
- **Action**: Update business regulation references

---

## 🚀 Quick Integration (Automated)

```bash
# Run complete integration
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
./scripts/integrate-new-regulation.sh "PP Nomor 28 Tahun 2025.pdf"
```

---

## ✅ Verification

After integration, test with ZANTARA:

```bash
# Test query
curl -X POST https://nuzantara-backend.fly.dev/api/v3/zantara/unified \\
  -H "Content-Type: application/json" \\
  -d '{{
    "query": "What does PP 28/2025 say about...?",
    "domain": "legal",
    "mode": "detailed"
  }}'
```

---

**Status**: ✅ Metadata prepared, ready for text extraction
**Next Step**: Extract PDF text (see step 1 above)
**Priority**: High (new regulation 2025)
""")
    
    print(f"✅ Integration guide: {instructions_file}\n")
    
    # Create quick summary
    summary_file = os.path.join(OUTPUT_DIR, "PP_28_2025_SUMMARY.md")
    with open(summary_file, 'w') as f:
        f.write(f"""# PP Nomor 28 Tahun 2025 - Quick Summary

## 📄 Document Info
- **Type**: Peraturan Pemerintah (Government Regulation)
- **Number**: 28
- **Year**: 2025
- **File Size**: {file_size / 1024 / 1024:.2f} MB
- **Location**: `{PDF_FILE}`

## 🎯 Status
- ✅ Metadata extracted
- ⏳ Text extraction needed
- ⏳ Oracle upload pending
- ⏳ ZANTARA integration pending

## 🚀 Quick Actions

### 1. Extract Text (macOS)
```bash
# Install dependencies
pip3 install PyPDF2 pypdf

# Extract
python3 /Users/antonellosiano/Desktop/NUZANTARA-FLY/scripts/extract-pdf.py
```

### 2. Check Content
```bash
# View extracted text
cat oracle-data/PP_28_2025_extracted.txt | head -100
```

### 3. Upload to Oracle
```bash
# Add to knowledge base
python3 scripts/oracle-add-regulation.py "PP 28/2025"
```

---

**Generated**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Next Steps**: Text extraction → Chunking → Oracle upload → ZANTARA testing
""")
    
    print(f"✅ Summary: {summary_file}\n")
    
    print("=" * 70)
    print("🎉 PP 28/2025 Processing Complete!")
    print("=" * 70)
    print("\n📋 Files Created:")
    print(f"   1. {METADATA_FILE}")
    print(f"   2. {instructions_file}")
    print(f"   3. {summary_file}")
    
    print("\n🎯 Next Steps:")
    print("   1. Extract PDF text (see integration guide)")
    print("   2. Chunk content for Oracle")
    print("   3. Upload to ChromaDB")
    print("   4. Test in ZANTARA")
    
    print(f"\n💡 Quick start:")
    print(f"   cat {instructions_file}")
    print()

if __name__ == "__main__":
    main()
