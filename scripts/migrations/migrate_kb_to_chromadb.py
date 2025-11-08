#!/usr/bin/env python3
"""
Simple script to migrate KB from JSONL to ChromaDB
"""

import requests
import json
import time
from pathlib import Path

# ChromaDB API endpoint
CHROMA_URL = "https://nuzantara-rag.fly.dev"

def ingest_jsonl_file(jsonl_file, collection_name="legal_intelligence"):
    """Ingest a JSONL file to ChromaDB via API"""
    print(f"🔄 Processing {jsonl_file.name}...")
    
    with open(jsonl_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                data = json.loads(line.strip())
                
                # Convert to memory format
                memory_data = {
                    "user_id": "system_migrate",
                    "text": data.get('content', ''),
                    "document": data.get('document_id', ''),
                    "metadata": {
                        "pasal": data.get('pasal', ''),
                        "category": data.get('category', ''),
                        "document_title": data.get('document_title', ''),
                        "document_type": data.get('document_type', ''),
                        "tags": data.get('tags', []),
                        "collection": collection_name,
                        "source_file": jsonl_file.name,
                        "line_number": line_num
                    }
                }
                
                # Use embed endpoint
                response = requests.post(
                    f"{CHROMA_URL}/api/memory/embed",
                    json=memory_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    if line_num % 10 == 0:
                        print(f"  ✅ Processed {line_num} documents...")
                else:
                    print(f"  ❌ Error at line {line_num}: {response.status_code}")
                    print(f"     Response: {response.text}")
                    break
                    
                # Small delay to avoid rate limiting
                time.sleep(0.1)
                
            except json.JSONDecodeError as e:
                print(f"  ❌ JSON decode error at line {line_num}: {e}")
                continue
            except Exception as e:
                print(f"  ❌ Error processing line {line_num}: {e}")
                continue
    
    print(f"✅ Completed {jsonl_file.name}")

def main():
    """Main migration function"""
    print("🚀 Starting KB Migration to ChromaDB")
    print(f"📍 Target: {CHROMA_URL}")
    
    # PP 28/2025 JSONL file
    pp_file = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data/PP_28_2025_READY_FOR_KB.jsonl")
    
    if pp_file.exists():
        print(f"📄 Found PP 28/2025 with {sum(1 for _ in open(pp_file))} lines")
        ingest_jsonl_file(pp_file, "pp_28_2025")
    else:
        print(f"❌ File not found: {pp_file}")
    
    # Check for other JSONL files
    jsonl_files = list(Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY").rglob("*.jsonl"))
    print(f"\n📊 Found {len(jsonl_files)} JSONL files total:")
    
    for jsonl_file in jsonl_files:
        if "PP_28_2025" not in str(jsonl_file):
            file_size = jsonl_file.stat().st_size
            line_count = sum(1 for _ in open(jsonl_file, errors='ignore')) if file_size > 0 else 0
            print(f"  📄 {jsonl_file.name}: {line_count} lines, {file_size} bytes")
    
    print("\n🎯 Migration completed! Check stats:")
    stats_response = requests.get(f"{CHROMA_URL}/api/memory/stats", timeout=10)
    if stats_response.status_code == 200:
        print(f"📈 ChromaDB Stats: {stats_response.json()}")
    else:
        print(f"❌ Failed to get stats: {stats_response.status_code}")

if __name__ == "__main__":
    main()