#!/usr/bin/env python3
"""
PP 28/2025 → ZANTARA KB Ingestion Script
Ingest processed law chunks into ZANTARA knowledge base
"""

import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

KB_DIR = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data/PP_28_2025/kb_ready")
OUTPUT_FILE = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data/PP_28_2025_READY_FOR_KB.jsonl")

def convert_to_jsonl():
    """Convert chunks to JSONL format for KB ingestion"""
    
    print("=" * 80)
    print("PP 28/2025 KB INGESTION CONVERTER")
    print("=" * 80)
    
    # Load chunks
    print("\n⏳ Loading chunks...")
    with open(KB_DIR / "chunks_articles.json", 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    
    print(f"✅ Loaded {len(chunks)} chunks")
    
    # Load obligations for enrichment
    print("⏳ Loading obligations...")
    with open(KB_DIR / "obligations_matrix.json", 'r', encoding='utf-8') as f:
        obligations = json.load(f)
    
    # Create obligation lookup by Pasal
    obligations_by_pasal = {}
    for ob in obligations:
        pasal = ob['pasal']
        if pasal not in obligations_by_pasal:
            obligations_by_pasal[pasal] = []
        obligations_by_pasal[pasal].append(ob)
    
    print(f"✅ Loaded {len(obligations)} obligations")
    
    # Convert to JSONL (one JSON per line)
    print("\n⏳ Converting to JSONL format...")
    
    jsonl_entries = []
    
    for chunk in chunks:
        # Enrich chunk with obligations if available
        pasal_id = chunk['chunk_id'].split('-')[-1]  # Extract Pasal number
        
        if pasal_id in obligations_by_pasal:
            chunk['obligations'] = obligations_by_pasal[pasal_id]
        
        # Create KB-ready entry
        kb_entry = {
            "id": chunk['chunk_id'],
            "document_id": "PP-28-2025",
            "document_title": "Peraturan Pemerintah No. 28 Tahun 2025",
            "document_type": "legal_regulation",
            "category": "business_licensing",
            "subcategory": "risk_based_licensing",
            
            # Content
            "content": chunk['text'],
            "pasal": chunk['pasal'],
            "ayat_count": chunk['ayat_count'],
            
            # Metadata for search
            "metadata": {
                **chunk['metadata'],
                "law_id": chunk['law_id'],
                "signals": chunk.get('signals', {}),
                "obligations": chunk.get('obligations', []),
                "searchable_fields": [
                    "PBBR", "OSS", "KBLI", "perizinan", "business licensing",
                    f"Pasal {chunk['pasal']}"
                ]
            },
            
            # Tags for filtering
            "tags": [
                "PP-28-2025",
                "legal",
                "business_licensing",
                "indonesia",
                "regulation"
            ],
            
            # Add KBLI tag if relevant
            "has_kbli": 'kbli' in chunk['text'].lower() or chunk.get('signals', {}).get('kbli_required', False),
            
            # Add system tags
            "systems": chunk.get('signals', {}).get('systems', []),
            
            # Language
            "language": "id",
            
            # Source attribution
            "source": {
                "type": "government_regulation",
                "issuer": "Pemerintah Republik Indonesia",
                "date": "2025-06-05",
                "lnri": "LNRI 2025/98"
            }
        }
        
        # Add to JSONL
        jsonl_entries.append(json.dumps(kb_entry, ensure_ascii=False))
    
    # Write JSONL file
    print(f"⏳ Writing JSONL to {OUTPUT_FILE}...")
    OUTPUT_FILE.write_text('\n'.join(jsonl_entries), encoding='utf-8')
    
    print(f"✅ Written {len(jsonl_entries)} entries")
    
    # Statistics
    print("\n" + "=" * 80)
    print("📊 INGESTION STATISTICS")
    print("=" * 80)
    
    with_kbli = len([e for e in chunks if 'kbli' in e['text'].lower()])
    with_signals = len([e for e in chunks if e.get('signals')])
    with_obligations = len([e for e in chunks if e['chunk_id'].split('-')[-1] in obligations_by_pasal])
    
    print(f"\n📜 Total entries: {len(jsonl_entries)}")
    print(f"📋 Entries with KBLI: {with_kbli}")
    print(f"🎯 Entries with signals: {with_signals}")
    print(f"⚖️  Entries with obligations: {with_obligations}")
    
    # Show sample entry
    print("\n" + "=" * 80)
    print("📋 SAMPLE ENTRY (First entry)")
    print("=" * 80)
    
    sample = json.loads(jsonl_entries[0])
    print(json.dumps(sample, indent=2, ensure_ascii=False)[:500] + "...")
    
    print("\n" + "=" * 80)
    print("✅ KB INGESTION FILE READY")
    print("=" * 80)
    print(f"\n📁 Output file: {OUTPUT_FILE}")
    print(f"📏 File size: {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")
    
    print("\n🎯 Next steps:")
    print("   1. Review JSONL file format")
    print("   2. Ingest into ChromaDB/Qdrant via standard pipeline")
    print("   3. Test queries: 'KBLI OSS requirement', 'Pasal 211'")
    print("   4. Validate retrieval accuracy")
    
    return jsonl_entries

def show_ingestion_commands():
    """Show commands to ingest into various backends"""
    print("\n" + "=" * 80)
    print("🚀 INGESTION COMMANDS")
    print("=" * 80)
    
    print("\n### For ChromaDB:")
    print("```python")
    print("import chromadb")
    print("from chromadb.utils import embedding_functions")
    print("")
    print("client = chromadb.PersistentClient(path='./chroma_db')")
    print("collection = client.get_or_create_collection('pp_28_2025')")
    print("")
    print("# Load JSONL and add to collection")
    print("with open('PP_28_2025_READY_FOR_KB.jsonl') as f:")
    print("    for line in f:")
    print("        doc = json.loads(line)")
    print("        collection.add(")
    print("            ids=[doc['id']],")
    print("            documents=[doc['content']],")
    print("            metadatas=[doc['metadata']]")
    print("        )")
    print("```")
    
    print("\n### For Qdrant:")
    print("```python")
    print("from qdrant_client import QdrantClient")
    print("from qdrant_client.models import PointStruct")
    print("")
    print("client = QdrantClient(url='http://localhost:6333')")
    print("collection_name = 'pp_28_2025'")
    print("")
    print("# Create collection and upload")
    print("points = []")
    print("with open('PP_28_2025_READY_FOR_KB.jsonl') as f:")
    print("    for idx, line in enumerate(f):")
    print("        doc = json.loads(line)")
    print("        points.append(PointStruct(")
    print("            id=idx,")
    print("            payload=doc,")
    print("            vector=get_embedding(doc['content'])  # Your embedding function")
    print("        ))")
    print("```")
    
    print("\n### For ZANTARA Oracle:")
    print("```bash")
    print("# Use existing oracle ingestion pipeline")
    print("python3 populate_oracle.py \\")
    print("  --source oracle-data/PP_28_2025_READY_FOR_KB.jsonl \\")
    print("  --collection pp_28_2025 \\")
    print("  --category legal")
    print("```")

def main():
    """Main execution"""
    try:
        # Convert and generate JSONL
        entries = convert_to_jsonl()
        
        # Show ingestion commands
        show_ingestion_commands()
        
        print("\n✅ ALL DONE! PP 28/2025 ready for KB ingestion.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
