#!/usr/bin/env python3
import os
import re
import json
import hashlib
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "KBLI"
OUTDIR = Path(__file__).resolve().parents[1] / "KBLI_RAG_UPLOAD"
# Version tag for this export (used in metadata + tags)
VERSION = "2025-10-02"

OFFICIAL_SOURCES = [
    "https://oss.go.id/informasi/kbli-berbasis-risiko",
    "https://peraturan.bpk.go.id/Details/161806",
    "https://peraturan.bpk.go.id/Details/168534",
    "https://www.bps.go.id",
]

PACK_TAGS = {
    "KBLI_PACK_LOGISTICS.md": ["pack:logistics"],
    "KBLI_PACK_CONSTRUCTION.md": ["pack:construction"],
    "KBLI_PACK_FOOD.md": ["pack:food"],
    "KBLI_PACK_CONSULTING_CREATIVE.md": ["pack:consulting-creative"],
    "KBLI_PACK_HOSPITALITY_REALESTATE.md": ["pack:hospitality-realestate"],
}

CATEGORY_HINTS = [
    ("CONSTRUCTION_SPECIALIZED_TRANSPORTATION", "category:construction-transport"),
    ("METALS_ELECTRONICS_MACHINERY", "category:manufacturing-24-28"),
    ("FOOD_MANUFACTURING", "category:manufacturing-10"),
    ("CHEMICALS_PHARMACEUTICALS_MATERIALS", "category:manufacturing-18-23"),
    ("MINING_QUARRYING_SUPPORT_SERVICES", "category:mining-07-09"),
    ("VEHICLES_UTILITIES_WASTE", "category:c29-33-d35-e36-39"),
    ("CREATIVE_EDUCATION_HEALTH_PERSONAL_SERVICES", "category:m-n-p-q-r-s-t"),
    ("AUTOMOTIVE_MEDIA_FINANCE_PROFESSIONAL", "category:g45-j58-61-k64-66-m69-72"),
]


def read_text(path: Path) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            return path.read_text(encoding=enc)
        except Exception:
            continue
    return path.read_bytes().decode("utf-8", errors="ignore")


def nearest_heading(lines, idx):
    for j in range(idx, -1, -1):
        if lines[j].startswith("### "):
            return lines[j].strip().lstrip('# ').strip()
        if lines[j].startswith("## "):
            return lines[j].strip().lstrip('# ').strip()
    return None


def file_title(lines):
    for ln in lines:
        if ln.startswith("# "):
            return ln[2:].strip()
    return None


def clean_lines(lines):
    out = []
    for ln in lines:
        # remove pricing note lines
        if ln.strip().lower().startswith("> pricing note:"):
            continue
        out.append(ln)
    return out


def chunks_from_text(text, max_chars=3000, overlap=300):
    lines = text.splitlines()
    lines = clean_lines(lines)
    buf = []
    start_idx = 0
    i = 0
    while i < len(lines):
        buf.append(lines[i])
        cur_len = sum(len(x) + 1 for x in buf)
        if cur_len >= max_chars or i == len(lines) - 1:
            # define anchor as nearest heading above current i
            anchor = nearest_heading(lines, i) or nearest_heading(lines, start_idx) or None
            chunk_text = "\n".join(buf).strip()
            yield (start_idx, i, anchor, chunk_text)
            if i == len(lines) - 1:
                break
            # move window with overlap
            back = 0
            char_sum = 0
            for k in range(len(buf) - 1, -1, -1):
                char_sum += len(buf[k]) + 1
                if char_sum >= overlap:
                    back = k
                    break
            # next window
            start_idx = i - (len(buf) - 1 - back)
            start_idx = max(0, start_idx)
            buf = lines[start_idx:i+1]
        i += 1


def extract_kbli_codes(text):
    codes = set()
    for m in re.finditer(r"\bKBLI\s*(\d{5})\b", text):
        codes.add(m.group(1))
    for m in re.finditer(r"\b(\d{5})\b", text):
        # heuristic: keep only if near KBLI mention or in headings
        codes.add(m.group(1))
    return sorted(codes)


def extract_risk_levels(text):
    levels = set()
    for m in re.finditer(r"Risk Level \(OSS\):\s*([RMT]{1,2})", text):
        levels.add(m.group(1))
    return sorted(levels)


def extract_investment_min_idr(text):
    m = re.search(r"Investment Minimum:\s*IDR\s*([0-9,\.BMb]+)", text)
    if m:
        return m.group(1).strip()
    return None


def file_tags(path: Path):
    tags = []
    fname = path.name
    if fname in PACK_TAGS:
        tags += PACK_TAGS[fname]
    up = fname.upper()
    for hint, tag in CATEGORY_HINTS:
        if hint in up:
            tags.append(tag)
    # Always include subset + version tags for KBLI export
    tags.append("subset:kbli")
    tags.append(f"version:{VERSION}")
    # Deduplicate and sort for consistency
    return sorted(set(tags))


def hash_id(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:24]


def main():
    OUTDIR.mkdir(parents=True, exist_ok=True)
    export_path = OUTDIR / "kbli_export.jsonl"
    manifest_path = OUTDIR / "manifest.json"
    count = 0
    files = []
    for md in ROOT.rglob("*.md"):
        # skip internal .claude files
        if "/.claude/" in str(md.as_posix()):
            continue
        rel = md.relative_to(Path(__file__).resolve().parents[2])
        files.append(str(rel))
    files.sort()

    with export_path.open("w", encoding="utf-8") as out:
        for rel in files:
            p = Path(__file__).resolve().parents[2] / rel
            # exclude agent assignment index files
            if p.name.lower() == 'agent_assignments.md':
                continue
            text = read_text(p)
            lines = text.splitlines()
            title = file_title(lines) or p.stem
            tags = file_tags(p)
            mtime = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(p.stat().st_mtime))
            for (s, e, anchor, chunk_text) in chunks_from_text(text):
                if not chunk_text:
                    continue
                codes = extract_kbli_codes(chunk_text)
                risks = extract_risk_levels(chunk_text)
                inv = extract_investment_min_idr(chunk_text)
                doc_id = hash_id(f"{rel}:{s}:{e}")
                tag_list = file_tags(p)
                # Build metadata: use simple string fields for filtering in Chroma
                record = {
                    "id": doc_id,
                    "text": chunk_text,
                    "metadata": {
                        "title": title,
                        "file_path": rel,
                        "anchor": anchor,
                        # Tags stored as a single string for readability
                        "tags": ",".join(tag_list),
                        # Normalized fields for filtering
                        "subset": "kbli",
                        "version": VERSION,
                        "kbli_codes": ",".join(codes) if codes else None,
                        "risk_levels": ",".join(risks) if risks else None,
                        "investment_min_idr": inv,
                        "sources": ";".join(OFFICIAL_SOURCES),
                        "last_updated": mtime,
                    },
                }
                out.write(json.dumps(record, ensure_ascii=False) + "\n")
                count += 1

    manifest = {
        "export_file": export_path.name,
        "count": count,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base_dir": str(ROOT),
        "note": "JSONL ready for RAG ingestion: chunked content + metadata. No backend changes required.",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    readme = OUTDIR / "README.md"
    readme.write_text(
        """
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
""".strip(),
        encoding="utf-8",
    )

if __name__ == "__main__":
    main()
