#!/usr/bin/env python3
import os
import re
import json
import hashlib
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTDIR = ROOT / "RAG_UPLOAD"
VERSION = "2025-10-02"

EXCLUDE_DIRS = {".chroma", ".git", ".claude", "node_modules", ".venv", "tools", ".cursor", ".codex", ".github"}
EXCLUDE_FILES = {"AGENT_ASSIGNMENTS.md"}
INCLUDE_SUFFIXES = {".md", ".txt", ".csv"}

OFFICIAL_SOURCES = [
    "https://oss.go.id/informasi/kbli-berbasis-risiko",
    "https://peraturan.bpk.go.id/Details/161806",
    "https://peraturan.bpk.go.id/Details/168534",
    "https://www.bps.go.id",
]

def read_text(path: Path) -> str:
    for enc in ("utf-8", "latin-1"):
        try:
            return path.read_text(encoding=enc)
        except Exception:
            continue
    try:
        return path.read_bytes().decode("utf-8", errors="ignore")
    except Exception:
        return ""

def nearest_heading(lines, idx):
    for j in range(idx, -1, -1):
        if lines[j].startswith("### "):
            return lines[j].strip().lstrip('# ').strip()
        if lines[j].startswith("## "):
            return lines[j].strip().lstrip('# ').strip()
        if lines[j].startswith("# "):
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
        low = ln.lower().strip()
        # remove (~USD ...) currency conversion hints
        if "(~usd" in low or ") ~usd" in low:
            ln = re.sub(r"\(\s*~\s*USD[^\)]*\)", "", ln)
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
            anchor = nearest_heading(lines, i) or nearest_heading(lines, start_idx) or None
            chunk_text = "\n".join(buf).strip()
            yield (start_idx, i, anchor, chunk_text)
            if i == len(lines) - 1:
                break
            # compute overlap window
            back = 0
            char_sum = 0
            for k in range(len(buf) - 1, -1, -1):
                char_sum += len(buf[k]) + 1
                if char_sum >= overlap:
                    back = k
                    break
            start_idx = i - (len(buf) - 1 - back)
            start_idx = max(0, start_idx)
            buf = lines[start_idx:i+1]
        i += 1

def hash_id(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:24]

def main():
    OUTDIR.mkdir(parents=True, exist_ok=True)
    export_path = OUTDIR / "kb_export2.jsonl"
    manifest_path = OUTDIR / "manifest2.json"

    base = ROOT
    files = []
    for p in base.rglob("*"):
        if p.is_dir():
            # skip excluded dirs
            parts = [x for x in p.relative_to(base).parts]
            if any(part in EXCLUDE_DIRS for part in parts):
                continue
            continue
        if p.suffix.lower() not in INCLUDE_SUFFIXES:
            continue
        if p.name in EXCLUDE_FILES:
            continue
        try:
            rel = p.relative_to(base).as_posix()
        except Exception:
            rel = p.as_posix()
        # Skip any file under excluded directories
        rel_parts = Path(rel).parts
        if any(part in EXCLUDE_DIRS for part in rel_parts):
            continue
        files.append(rel)
    files.sort()

    count = 0
    with export_path.open("w", encoding="utf-8") as out:
        for rel in files:
            p = base / rel
            text = read_text(p)
            if not text.strip():
                continue
            lines = text.splitlines()
            title = file_title(lines) or Path(rel).stem
            mtime = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(p.stat().st_mtime))
            rel_upper = ("/" + rel).upper()
            in_kbli = "/KBLI/" in rel_upper or "/EYE KBLI/" in rel_upper
            if "/VISA ORACLE/" in rel_upper:
                domain = "immigration"
            elif "/TAX GENIUS/" in rel_upper:
                domain = "tax"
            elif "/LEGAL ARCHITECT/" in rel_upper:
                domain = "legal"
            elif in_kbli:
                domain = "kbli"
            else:
                domain = "general"
            for (s, e, anchor, chunk_text) in chunks_from_text(text):
                if not chunk_text:
                    continue
                tags = ["subset:kb-all", f"version:{VERSION}", f"domain:{domain}"]
                record = {
                    "id": hash_id(f"{rel}:{s}:{e}"),
                    "text": chunk_text,
                    "metadata": {
                        "title": title,
                        "file_path": rel,
                        "anchor": anchor,
                        "tags": ",".join(tags),
                        "subset": "kb-all",
                        "version": VERSION,
                        "domain": domain,
                        "sources": ";".join(OFFICIAL_SOURCES) if in_kbli else None,
                        "last_updated": mtime,
                    },
                }
                out.write(json.dumps(record, ensure_ascii=False) + "\n")
                count += 1

    manifest = {
        "export_file": export_path.name,
        "count": count,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base_dir": str(base),
        "note": "Full KB export (accessible files only).",
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
