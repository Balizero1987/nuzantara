#!/usr/bin/env python3
"""
Ingest Team Data into Qdrant
----------------------------
Reads team_members.json and upserts into 'bali_zero_team' collection.
"""

import json
import logging
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from core.embeddings import EmbeddingsGenerator
from core.qdrant_db import QdrantClient
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_PATH = backend_dir / "data" / "team_members.json"

def ingest_team_data():
    logger.info("🚀 Starting Team Data Ingestion...")

    if not DATA_PATH.exists():
        logger.error(f"❌ Data file not found: {DATA_PATH}")
        return

    # 1. Load Data
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        members = json.load(f)
    
    logger.info(f"📊 Loaded {len(members)} team members from JSON")

    # 2. Initialize Services
    embedder = EmbeddingsGenerator()
    qdrant = QdrantClient(collection_name="bali_zero_team")
    
    logger.info(f"✅ Services initialized. Embedder: {embedder.provider}")

    # 3. Prepare Documents
    documents = []
    metadatas = []
    ids = []

    for member in members:
        # Create a rich text representation for semantic search
        # This text is what the LLM will "read" when retrieving context
        text_parts = [
            f"Name: {member['name']}",
            f"Role: {member['role']}",
            f"Department: {member['department']}",
            f"Team: {member.get('team', member['department'])}",
            f"Email: {member['email']}",
            f"Location: {member.get('location', 'Unknown')}",
            f"Languages: {', '.join(member.get('languages', []))}",
            f"Expertise: {member.get('expertise_level', 'intermediate')}",
        ]
        
        if member.get('traits'):
            text_parts.append(f"Traits: {', '.join(member['traits'])}")
            
        if member.get('notes'):
            text_parts.append(f"Notes: {member['notes']}")
            
        if member.get('religion'):
            text_parts.append(f"Religion: {member['religion']}")
            
        if member.get('age'):
            text_parts.append(f"Age: {member['age']}")

        full_text = "\n".join(text_parts)
        
        documents.append(full_text)
        metadatas.append(member) # Store full JSON as metadata
        
        # Generate UUID for Qdrant ID requirement
        import uuid
        # Use a deterministic UUID based on the member ID to avoid duplicates on re-run
        member_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, member['id']))
        ids.append(member_uuid)

    # 4. Generate Embeddings
    logger.info("🧠 Generating embeddings...")
    embeddings = [embedder.generate_single_embedding(doc) for doc in documents]

    # 5. Upsert to Qdrant
    logger.info(f"💾 Upserting {len(documents)} documents to Qdrant...")
    qdrant.upsert_documents(
        chunks=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )

    logger.info("🎉 Team data ingestion complete!")

if __name__ == "__main__":
    ingest_team_data()
