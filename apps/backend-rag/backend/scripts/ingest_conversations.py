import json
import logging
import os
import sys
import uuid
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.http import models

# Add backend directory to path so we can import 'app'
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.embeddings import EmbeddingsGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def ingest_conversations(file_path: str):
    """
    Ingest conversation examples from JSON file into Qdrant
    """
    if not os.path.exists(file_path):
        logger.error(f"❌ File not found: {file_path}")
        return

    # Initialize Qdrant
    client = QdrantClient(
        url=settings.qdrant_url,
        api_key=settings.api_keys.split(",")[0] if settings.api_keys else None,
    )
    collection_name = "conversation_examples"

    # Initialize Embeddings
    embeddings_generator = EmbeddingsGenerator()
    vector_size = embeddings_generator.dimensions

    # Create collection if not exists
    logger.info(f"🔨 Recreating collection '{collection_name}'...")
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(size=vector_size, distance=models.Distance.COSINE),
    )

    # Load data
    with open(file_path) as f:
        data = json.load(f)

    # Handle different JSON formats (list of dicts or dict with "conversations" key)
    conversations = data.get("conversations", data) if isinstance(data, dict) else data

    if not isinstance(conversations, list):
        logger.error("❌ Invalid JSON format. Expected list of conversations.")
        return

    logger.info(f"📥 Processing {len(conversations)} conversations...")

    points = []
    for i, conv in enumerate(conversations):
        question = conv.get("question") or conv.get("input")
        answer = conv.get("answer") or conv.get("output")
        persona = conv.get("persona", "general")

        if not question or not answer:
            continue

        # Generate embedding for the QUESTION (for retrieval)
        vector = embeddings_generator.generate_single_embedding(question)

        payload = {
            "question": question,
            "answer": answer,
            "persona": persona,
            "source": "synthetic_dataset",
        }

        points.append(models.PointStruct(id=str(uuid.uuid4()), vector=vector, payload=payload))

        if (i + 1) % 50 == 0:
            logger.info(f"   Prepared {i + 1} points...")

    # Upsert in batches
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=collection_name, points=batch)
        logger.info(f"🚀 Upserted batch {i // batch_size + 1} ({len(batch)} points)")

    logger.info("✅ Ingestion complete!")


if __name__ == "__main__":
    # Default path
    DATA_FILE = "data/conversations.json"
    ingest_conversations(DATA_FILE)
