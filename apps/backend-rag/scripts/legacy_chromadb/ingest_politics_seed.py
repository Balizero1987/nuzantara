#!/usr/bin/env python3
import os
import sys
import logging
from pathlib import Path

# Ensure 'backend' parent is on sys.path when running this file directly
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = CURRENT_DIR.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from services.politics_ingestion import PoliticsIngestionService


def main():
    logging.basicConfig(level=logging.INFO)
    kb_root = Path(__file__).resolve().parents[1] / "kb" / "politics" / "id"
    chroma_path = os.environ.get("CHROMA_DB_PATH", "/tmp/chroma_db")

    print(f"KB root: {kb_root}")
    print(f"Chroma path: {chroma_path}")

    svc = PoliticsIngestionService(persist_directory=chroma_path)
    result = svc.ingest_dir(kb_root)
    print(result)


if __name__ == "__main__":
    main()
