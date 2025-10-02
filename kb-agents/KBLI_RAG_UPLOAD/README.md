KBLI RAG Upload Package
=======================

Files:
- kbli_export.jsonl — one JSON object per chunk with text + metadata
- manifest.json — summary and counts

Suggested upload (example):
- If your backend exposes /rag/ingest, you can POST the JSONL by streaming lines.
- Alternatively, bulk insert into your vector DB and index the same metadata.

Metadata fields:
- title, file_path, anchor, tags, kbli_codes, risk_levels, investment_min_idr, sources, last_updated

Chunking:
- ~3000 chars per chunk with ~300 char overlap. Headings retained for anchor.

Policy:
- Service prices excluded. Normative amounts in IDR only. Official sources attached.