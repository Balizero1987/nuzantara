#!/usr/bin/env python3
"""
STAGE 3 Helper: ChromaDB Upload for RAG Data
=============================================

Uploads processed RAG data to ChromaDB for semantic search

Author: ZANTARA Team
Created: 2025-10-07
"""

import json
import os
from pathlib import Path
from typing import List, Dict
from datetime import datetime

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    print("❌ ChromaDB not installed. Run: pip install chromadb")
    exit(1)


class ChromaDBUploader:
    """Upload RAG data to ChromaDB"""
    
    def __init__(self, processed_dir: str = "THE SCRAPING/processed",
                 chroma_dir: str = "THE SCRAPING/chromadb"):
        self.processed_dir = Path(processed_dir)
        self.chroma_dir = Path(chroma_dir)
        self.chroma_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(self.chroma_dir),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Collection name mapping
        self.collections = {}
    
    def get_or_create_collection(self, category: str):
        """Get or create ChromaDB collection for category"""
        
        if category in self.collections:
            return self.collections[category]
        
        # Create collection with metadata filtering
        collection = self.client.get_or_create_collection(
            name=f"intel_{category}",
            metadata={
                "description": f"Intelligence data for {category}",
                "created_at": datetime.now().isoformat()
            }
        )
        
        self.collections[category] = collection
        return collection
    
    def upload_rag_file(self, rag_file: Path, category: str):
        """
        Upload a single RAG JSON file to ChromaDB
        
        Args:
            rag_file: Path to RAG JSON file
            category: Category name
        """
        
        try:
            # Read RAG data
            rag_data = json.loads(rag_file.read_text())
            
            # Skip if error
            if 'error' in rag_data:
                print(f"  ⚠️  Skipping {rag_file.name}: {rag_data['error']}")
                return
            
            # Get collection
            collection = self.get_or_create_collection(category)
            
            # Prepare document
            doc_id = rag_data.get('content_hash', rag_file.stem)
            
            # Create searchable text (title + summary)
            document_text = f"{rag_data.get('title_clean', '')} {rag_data.get('summary', '')}"
            
            # Prepare metadata (flatten entities)
            metadata = {
                "title": rag_data.get('title_clean', 'Untitled'),
                "category": category,
                "subcategory": rag_data.get('subcategory', 'general'),
                "impact_level": rag_data.get('impact_level', 'medium'),
                "language": rag_data.get('language', 'en'),
                "action_required": str(rag_data.get('action_required', False)),
                "source_url": rag_data.get('source_url', ''),
                "scraped_at": rag_data.get('scraped_at', ''),
                "processed_at": rag_data.get('processed_at', ''),
                # Flatten entities to strings for ChromaDB
                "people": ','.join(rag_data.get('entities', {}).get('people', [])),
                "organizations": ','.join(rag_data.get('entities', {}).get('organizations', [])),
                "locations": ','.join(rag_data.get('entities', {}).get('locations', [])),
                "keywords": ','.join(rag_data.get('keywords', []))
            }
            
            # Add deadline if present
            if rag_data.get('deadline_date'):
                metadata['deadline_date'] = rag_data['deadline_date']
            
            # Upload to ChromaDB
            collection.upsert(
                ids=[doc_id],
                documents=[document_text],
                metadatas=[metadata]
            )
            
            print(f"  ✅ Uploaded: {rag_data.get('title_clean', rag_file.name)[:60]}")
            
        except Exception as e:
            print(f"  ❌ Error uploading {rag_file.name}: {e}")
    
    def upload_category(self, category: str):
        """Upload all RAG files from a category"""
        
        rag_dir = self.processed_dir / category / "rag"
        
        if not rag_dir.exists():
            print(f"⚠️  RAG directory not found: {rag_dir}")
            return
        
        rag_files = list(rag_dir.glob("*.rag.json"))
        
        if not rag_files:
            print(f"⚠️  No RAG files in {category}")
            return
        
        print(f"\n📤 Uploading category: {category} ({len(rag_files)} files)")
        
        for rag_file in rag_files:
            self.upload_rag_file(rag_file, category)
        
        # Print collection stats
        collection = self.collections.get(category)
        if collection:
            count = collection.count()
            print(f"✅ Collection intel_{category}: {count} documents")
    
    def upload_all(self):
        """Upload all categories"""
        
        print("\n🚀 Starting ChromaDB Upload")
        print("=" * 60)
        
        # Get all category directories
        categories = [d.name for d in self.processed_dir.iterdir() if d.is_dir()]
        
        for category in sorted(categories):
            self.upload_category(category)
        
        print("\n" + "=" * 60)
        print(f"✅ ChromaDB upload complete!")
        print(f"📁 Database location: {self.chroma_dir.absolute()}")
        
        # Print total stats
        total_docs = sum(c.count() for c in self.collections.values())
        print(f"📊 Total documents: {total_docs} across {len(self.collections)} collections")
    
    def query_example(self, category: str, query: str, n_results: int = 5):
        """
        Example query function
        
        Args:
            category: Category to search
            query: Search query
            n_results: Number of results
        """
        
        collection = self.get_or_create_collection(category)
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            include=['documents', 'metadatas', 'distances']
        )
        
        print(f"\n🔍 Query: '{query}' in {category}")
        print("-" * 60)
        
        for i, (doc, meta, dist) in enumerate(zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        )):
            print(f"\n{i+1}. {meta['title']}")
            print(f"   Impact: {meta['impact_level']} | Language: {meta['language']}")
            print(f"   Distance: {dist:.3f}")
            print(f"   URL: {meta['source_url']}")


def main():
    """Main entry point"""
    
    uploader = ChromaDBUploader()
    uploader.upload_all()
    
    # Example queries
    print("\n" + "=" * 60)
    print("📝 Example Queries:")
    print("=" * 60)
    
    # Query immigration
    if '01_immigration' in uploader.collections:
        uploader.query_example('01_immigration', 'KITAS visa extension deadline', 3)
    
    # Query business
    if '02_business_bkpm' in uploader.collections:
        uploader.query_example('02_business_bkpm', 'PT PMA foreign investment', 3)


if __name__ == "__main__":
    main()
