#!/usr/bin/env python3
"""
Upload JSONL chunks to a ChromaDB collection with safe delta semantics.

Usage:
  python3 upload_to_chroma.py \
    --jsonl "Desktop/KB agenti/RAG_UPLOAD/kb_export.jsonl" \
    --collection "kb-agenti" \
    --persist "Desktop/KB agenti/.chroma" \
    --delete-tags "subset:kbli"  # optional, for delta

Offline option (no internet for embeddings):
  add --offline-zero-embeddings --embed-dim 384
  This inserts zero vectors so ingestion works offline; replace later with real embeddings.

Requires: pip install chromadb
"""
import argparse
import json
import sys
from pathlib import Path

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument('--jsonl', required=True)
    ap.add_argument('--collection', default='kb-agenti')
    ap.add_argument('--persist', default='Desktop/KB agenti/.chroma')
    ap.add_argument('--delete-tags', default='', help='comma-separated tags or key:value pairs to delete before upload (e.g., subset:kbli)')
    ap.add_argument('--offline-zero-embeddings', action='store_true', help='Insert zero vectors to avoid online model download (fallback).')
    ap.add_argument('--embed-dim', type=int, default=384, help='Embedding dimension for offline zero vectors (default 384 for MiniLM).')
    ap.add_argument('--batch', type=int, default=256)
    return ap.parse_args()

def main():
    args = parse_args()
    try:
        import chromadb
        from chromadb.config import Settings
    except Exception:
        print('Error: chromadb not installed. pip install chromadb', file=sys.stderr)
        sys.exit(1)

    persist_path = str(Path(args.persist))
    client = chromadb.PersistentClient(path=persist_path, settings=Settings(anonymized_telemetry=False))
    col = client.get_or_create_collection(name=args.collection, metadata={"hnsw:space":"cosine"})

    # Optional delta delete by tags
    delete_tags = [t.strip() for t in args.delete_tags.split(',') if t.strip()]
    if delete_tags:
        for tag in delete_tags:
            try:
                if ':' in tag:
                    k, v = tag.split(':', 1)
                    col.delete(where={k: v})
                else:
                    # fallback: exact match on tags string
                    col.delete(where={"tags": tag})
                print(f"Deleted existing docs with selector: {tag}")
            except Exception as e:
                print(f"Warning: delete selector {tag} failed: {e}")

    # Stream JSONL and upsert in batches
    ids, docs, metas = [], [], []
    count = 0
    def _sanitize(v):
        from numbers import Number
        if v is None:
            return None
        if isinstance(v, (str, bool)):
            return v
        if isinstance(v, Number):
            return v
        if isinstance(v, list):
            # flatten list to CSV string
            return ",".join(str(_sanitize(x)) for x in v)
        if isinstance(v, dict):
            # preserve in JSON string
            import json as _json
            return _json.dumps(v, ensure_ascii=False)
        # fallback to string
        return str(v)
    with open(args.jsonl, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip():
                continue
            obj = json.loads(line)
            ids.append(obj['id'])
            docs.append(obj['text'])
            raw_meta = obj.get('metadata', {}) or {}
            metas.append({k: _sanitize(v) for k, v in raw_meta.items()})
            if len(ids) >= args.batch:
                if args.offline_zero_embeddings:
                    embs = [[0.0]*args.embed_dim for _ in docs]
                    col.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=embs)
                else:
                    col.upsert(ids=ids, documents=docs, metadatas=metas)
                count += len(ids)
                print(f"Upserted {count}...")
                ids, docs, metas = [], [], []
    if ids:
        if args.offline_zero_embeddings:
            embs = [[0.0]*args.embed_dim for _ in docs]
            col.upsert(ids=ids, documents=docs, metadatas=metas, embeddings=embs)
        else:
            col.upsert(ids=ids, documents=docs, metadatas=metas)
        count += len(ids)
        print(f"Upserted {count} (final)")

if __name__ == '__main__':
    main()
