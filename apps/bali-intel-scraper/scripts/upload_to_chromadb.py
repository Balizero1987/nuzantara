#!/usr/bin/env python3
"""
Upload structured JSON to ChromaDB
Connects to ZANTARA RAG backend for embedding generation and storage
"""

import json
import sys
import os
import requests
from datetime import datetime

# Configuration
RAG_BACKEND_URL = os.getenv("RAG_BACKEND_URL", "https://zantara-rag-backend-himaadsxua-ew.a.run.app")
CHROMADB_COLLECTION_PREFIX = "bali_intel_"

# Emoji for better UX
EMOJI = {
    "upload": "📤",
    "success": "✅",
    "error": "❌",
    "info": "ℹ️",
    "warning": "⚠️",
    "timer": "⏱️",
}


def load_json(filepath):
    """Load and validate structured JSON"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except json.JSONDecodeError as e:
        print(f"{EMOJI['error']} JSON parsing error: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print(f"{EMOJI['error']} File not found: {filepath}")
        sys.exit(1)


def generate_embedding(text):
    """Generate embedding via RAG backend"""
    try:
        response = requests.post(
            f"{RAG_BACKEND_URL}/api/embed",
            json={"text": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()["embedding"]
    except Exception as e:
        print(f"{EMOJI['warning']} Embedding generation failed: {e}")
        return None


def upload_to_chromadb(collection_name, item, embedding):
    """Upload single item to ChromaDB via RAG backend"""
    try:
        # Prepare document text (title + summary for embedding search)
        document_text = f"{item['title_clean']}\n{item['summary_english']}\n{item.get('key_changes', '')}"

        # Prepare metadata
        metadata = {
            "id": item["id"],
            "url": item["original_url"],
            "title": item["title_clean"],
            "source": item["source"],
            "tier": str(item["tier"]),
            "published_date": item["published_date"],
            "category": item["category"],
            "impact_level": item["impact_level"],
            "sentiment": item["sentiment"],
            "action_required": str(item.get("action_required", False)),
            "deadline_date": item.get("deadline_date") or "",
            "language": item["language"],
            "keywords": ",".join(item.get("keywords", [])),
            "stakeholders": ",".join(item.get("stakeholders", [])),
        }

        # Upload via RAG backend
        response = requests.post(
            f"{RAG_BACKEND_URL}/api/intel/store",
            json={
                "collection": collection_name,
                "id": item["id"],
                "document": document_text,
                "embedding": embedding,
                "metadata": metadata,
                "full_data": item  # Store complete JSON for retrieval
            },
            timeout=30
        )
        response.raise_for_status()
        return True

    except Exception as e:
        print(f"{EMOJI['error']} Upload failed for item {item.get('id', 'unknown')}: {e}")
        return False


def main():
    """Main upload function"""
    if len(sys.argv) < 2:
        print(f"Usage: python3 upload_to_chromadb.py <structured_json_file>")
        print(f"Example: python3 upload_to_chromadb.py immigration_structured_20250110.json")
        sys.exit(1)

    filepath = sys.argv[1]

    # If relative path, look in data/structured/
    if not os.path.isabs(filepath):
        filepath = os.path.join("../data/structured", filepath)

    print("=" * 70)
    print(f"{EMOJI['upload']} Uploading to ChromaDB")
    print("=" * 70)
    print()

    # Load JSON
    print(f"{EMOJI['info']} Loading: {filepath}")
    data = load_json(filepath)

    # Extract metadata
    metadata = data.get("metadata", {})
    news_items = data.get("news_items", [])

    # Determine collection name from filename or metadata
    filename = os.path.basename(filepath)
    topic = filename.split('_structured_')[0]  # e.g., "immigration"
    collection_name = f"{CHROMADB_COLLECTION_PREFIX}{topic}"

    print(f"{EMOJI['info']} Collection: {collection_name}")
    print(f"{EMOJI['info']} Items to upload: {len(news_items)}")
    print()

    # Upload each item
    start_time = datetime.now()
    uploaded = 0
    failed = 0

    for idx, item in enumerate(news_items, 1):
        # Generate embedding for item
        embedding_text = f"{item['title_clean']} {item['summary_english']}"
        embedding = generate_embedding(embedding_text)

        if embedding is None:
            print(f"  {idx}/{len(news_items)} ❌ No embedding")
            failed += 1
            continue

        # Upload to ChromaDB
        success = upload_to_chromadb(collection_name, item, embedding)

        if success:
            print(f"  {idx}/{len(news_items)} ✅ {item['title_clean'][:50]}...")
            uploaded += 1
        else:
            print(f"  {idx}/{len(news_items)} ❌ Upload failed")
            failed += 1

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    # Summary
    print()
    print("=" * 70)
    print(f"{EMOJI['success']} Upload Complete")
    print("=" * 70)
    print(f"  Collection: {collection_name}")
    print(f"  Uploaded: {uploaded} items")
    print(f"  Failed: {failed} items")
    print(f"  {EMOJI['timer']} Time: {duration:.1f} seconds")
    print()

    # Save upload report
    report_path = filepath.replace('_structured_', '_upload_report_').replace('.json', '.txt')
    with open(report_path, 'w') as f:
        f.write(f"Upload Report - {datetime.now().isoformat()}\n")
        f.write(f"Collection: {collection_name}\n")
        f.write(f"Uploaded: {uploaded}\n")
        f.write(f"Failed: {failed}\n")
        f.write(f"Duration: {duration:.1f}s\n")

    print(f"{EMOJI['info']} Report saved: {report_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
