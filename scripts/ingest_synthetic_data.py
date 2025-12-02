#!/usr/bin/env python3
"""
Ingest Synthetic Q&A Data into Qdrant

Loads Q&A pairs from a JSON file and stores them in Qdrant collection 'conversation_examples'.
The IntelligentRouter uses this collection for Few-Shot learning.

Usage:
    python scripts/ingest_synthetic_data.py [path_to_json_file]
    
Example:
    python scripts/ingest_synthetic_data.py data/synthetic_data.json
"""

import argparse
import json
import logging
import sys
import uuid
from pathlib import Path

import requests

# Add backend to path
backend_path = Path(__file__).parent.parent / "apps" / "backend-rag"
sys.path.insert(0, str(backend_path))

from backend.core.embeddings import EmbeddingsGenerator
from backend.core.qdrant_db import QdrantClient

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

COLLECTION_NAME = "conversation_examples"
DEFAULT_JSON_PATH = Path(__file__).parent.parent / "data" / "synthetic_data.json"


def create_collection_if_not_exists(
    qdrant_url: str, collection_name: str, vector_size: int = 1536
) -> bool:
    """
    Create Qdrant collection if it doesn't exist.
    
    Args:
        qdrant_url: Qdrant server URL
        collection_name: Name of the collection
        vector_size: Size of embedding vectors (default: 1536 for OpenAI)
        
    Returns:
        True if collection exists or was created successfully, False otherwise
    """
    try:
        # Check if collection exists
        check_url = f"{qdrant_url}/collections/{collection_name}"
        response = requests.get(check_url, timeout=10)

        if response.status_code == 200:
            logger.info(f"✅ Collection '{collection_name}' already exists")
            return True

        # Create collection
        logger.info(f"Creating collection '{collection_name}' with vector size {vector_size}...")
        create_url = f"{qdrant_url}/collections/{collection_name}"
        payload = {"vectors": {"size": vector_size, "distance": "Cosine"}}

        response = requests.put(create_url, json=payload, timeout=30)

        if response.status_code == 200:
            logger.info(f"✅ Collection '{collection_name}' created successfully")
            return True
        else:
            logger.error(
                f"❌ Failed to create collection: {response.status_code} - {response.text}"
            )
            return False

    except Exception as e:
        logger.error(f"❌ Error creating collection: {e}")
        return False


def load_synthetic_data(json_path: Path) -> list[dict]:
    """
    Load Q&A pairs from JSON file.
    
    Expected JSON structure:
    [
        {
            "Question": "...",
            "Answer": "...",
            "Context": "..." (optional)
        },
        ...
    ]
    
    Args:
        json_path: Path to JSON file
        
    Returns:
        List of Q&A dictionaries
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            raise ValueError("JSON file must contain a list of Q&A pairs")
        
        logger.info(f"✅ Loaded {len(data)} Q&A pairs from {json_path}")
        return data
        
    except FileNotFoundError:
        logger.error(f"❌ File not found: {json_path}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON format: {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Error loading JSON file: {e}")
        raise


def main():
    """Main ingestion function"""
    parser = argparse.ArgumentParser(
        description="Ingest synthetic Q&A data into Qdrant"
    )
    parser.add_argument(
        "json_file",
        nargs="?",
        type=str,
        default=None,
        help="Path to JSON file with Q&A pairs (default: data/synthetic_data.json)",
    )
    
    args = parser.parse_args()
    
    # Determine JSON file path
    if args.json_file:
        json_path = Path(args.json_file)
    elif DEFAULT_JSON_PATH.exists():
        json_path = DEFAULT_JSON_PATH
        logger.info(f"Using default path: {json_path}")
    else:
        logger.error(
            f"❌ No JSON file provided and default path doesn't exist: {DEFAULT_JSON_PATH}"
        )
        logger.info("Please provide a JSON file path as argument")
        return 1
    
    if not json_path.exists():
        logger.error(f"❌ File not found: {json_path}")
        return 1
    
    try:
        logger.info("=" * 60)
        logger.info("SYNTHETIC DATA INGESTION INTO QDRANT")
        logger.info("=" * 60)
        
        # Initialize services
        logger.info("Initializing Qdrant client and embeddings generator...")
        qdrant_client = QdrantClient(collection_name=COLLECTION_NAME)
        embedder = EmbeddingsGenerator()
        
        logger.info(
            f"✅ EmbeddingsGenerator ready: {embedder.provider} ({embedder.dimensions} dims)"
        )
        
        # Create collection if it doesn't exist
        vector_size = embedder.dimensions
        if not create_collection_if_not_exists(
            qdrant_client.qdrant_url, COLLECTION_NAME, vector_size=vector_size
        ):
            logger.error("Failed to create collection")
            return 1
        
        # Load synthetic data
        logger.info(f"Loading synthetic data from {json_path}...")
        qa_pairs = load_synthetic_data(json_path)
        
        if not qa_pairs:
            logger.warning("No Q&A pairs found in JSON file")
            return 0
        
        # Prepare data for ingestion
        logger.info("Preparing data for ingestion...")
        questions = []
        metadatas = []
        ids = []
        
        for idx, pair in enumerate(qa_pairs):
            # Extract question (required)
            question = pair.get("Question") or pair.get("question")
            if not question:
                logger.warning(f"Skipping pair {idx}: missing 'Question' field")
                continue
            
            # Extract answer (required)
            answer = pair.get("Answer") or pair.get("answer")
            if not answer:
                logger.warning(f"Skipping pair {idx}: missing 'Answer' field")
                continue
            
            # Extract context (optional)
            context = pair.get("Context") or pair.get("context") or ""
            
            questions.append(question)
            
            # Store answer and context in metadata payload
            metadata = {
                "answer": answer,
                "context": context,
                "index": idx,
            }
            
            # Include any additional fields from the JSON
            for key, value in pair.items():
                if key.lower() not in ["question", "answer", "context"]:
                    metadata[key] = value
            
            metadatas.append(metadata)
            
            # Generate unique ID
            pair_id = pair.get("id") or f"qa_{uuid.uuid4().hex[:12]}_{idx}"
            ids.append(pair_id)
        
        if not questions:
            logger.error("No valid Q&A pairs found after validation")
            return 1
        
        logger.info(f"✅ Prepared {len(questions)} Q&A pairs for ingestion")
        
        # Generate embeddings for questions
        logger.info(f"Generating embeddings for {len(questions)} questions...")
        embeddings = embedder.generate_batch_embeddings(questions)
        
        if len(embeddings) != len(questions):
            logger.error("Mismatch between questions and embeddings count")
            return 1
        
        logger.info(f"✅ Generated {len(embeddings)} embeddings")
        
        # Batch upload to Qdrant
        logger.info(f"Ingesting {len(questions)} points into '{COLLECTION_NAME}' collection...")
        result = qdrant_client.upsert_documents(
            chunks=questions,  # Store question as text for retrieval
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )
        
        if result.get("success"):
            points_inserted = result.get("documents_added", len(questions))
            logger.info("=" * 60)
            logger.info(f"✅ SUCCESS: Ingested {points_inserted} points into '{COLLECTION_NAME}'")
            logger.info("=" * 60)
            
            # Print summary
            print(f"\n📊 Summary:")
            print(f"   Collection: {COLLECTION_NAME}")
            print(f"   Points inserted: {points_inserted}")
            print(f"   Vector size: {vector_size}")
            print(f"   Embedding provider: {embedder.provider}")
            
            return 0
        else:
            logger.error(f"❌ Failed to ingest data: {result.get('error', 'Unknown error')}")
            return 1
            
    except KeyboardInterrupt:
        logger.info("\n⚠️  Interrupted by user")
        return 1
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())

