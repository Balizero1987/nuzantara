#!/usr/bin/env python3
import os
import re
import json
import hashlib
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTDIR = ROOT / "RAG_UPLOAD"

OFFICIAL_SOURCES_DEFAULT = []
OFFICIAL_SOURCES_KBLI = [
    "https://oss.go.id/informasi/kbli-berbasis-risiko",
    "https://peraturan.bpk.go.id/Details/161806",
    "https://peraturan.bpk.go.id/Details/168534",
    "https://www.bps.go.id",
]
OFFICIAL_SOURCES_LEGAL = [
    "https://oss.go.id", "https://peraturan.bpk.go.id", "https://www.bps.go.id"
]

DOMAIN_HINTS = {
    'kbli': [r'\bkbli\b'],
    'oss': [r'\boss\b', r'\bnib\b', r'\bbkpm\b'],
    'visa': [r'\bvisa\b', r'\bimigr', r'\bkitap\b', r'\bkitas\b'],
    'tax': [r'\btax\b', r'\bpajak\b', r'\bppn\b', r'\bpph\b'],
    'hospitality': [r'\bhotel\b', r'\bvilla\b', r'\bguest\s*house\b', r'\brestaurant\b'],
    'logistics': [r'\bforward(ing|er)\b', r'\bwarehouse', r'\btrucking\b', r'\bport\b', r'\bcargo\b'],
    'construction': [r'\bconstruction\b', r'\bLPJK\b', r'\bSBU\b', r'\bSKK\b'],
}

DOC_CLASS_HINTS = {
    'pack': [r'\bStarter Pack\b', r'_PACK_'],
    'handovers': [r'/.claude/handovers/'],
    'diary': [r'/.claude/diaries/'],
    'guide': [r'Guide', r'Complete', r'Overview'],
    'checklist': [r'Checklist'],
    'policy': [r'Policy'],
    'reference': [r'Golden Cards', r'Data Capture'],
}

def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in {'.md', '.txt', '.csv'}:
        return None
    try:
        return path.read_text(encoding='utf-8')
    except Exception:
        try:
            return path.read_text(encoding='latin-1')
        except Exception:
            return None

def normalize_pricing(text: str) -> str:
    # remove pricing notes duplicates; keep a single standard note in metadata only
    text = re.sub(r'^\s*>\s*Pricing\s+note:.*Bali Zero.*\n', '', text, flags=re.IGNORECASE|re.MULTILINE)
    text = re.sub(r'^\s*>\s*Nota\s+prezzi:.*Bali Zero.*\n', '', text, flags=re.IGNORECASE|re.MULTILINE)
    # remove cost sections
    out=[]; skip=False
    for ln in text.splitlines():
        if skip:
            if not ln.strip() or (not ln.startswith((' ','\t','-','*')) and not ln.strip().startswith(('*','-'))):
                skip=False
            else:
                continue
        if re.match(r'^\s*(\*\*\s*)?(Costs?|Costi|Costo|Cost Estimates)(\s*\*\*)?\s*:', ln, re.IGNORECASE):
            skip=True; continue
        # drop single-line USD costs (keep Investment Minimum lines)
        if 'USD' in ln and 'Investment Minimum' not in ln:
            continue
        out.append(ln)
    text='\n'.join(out)
    # remove (~USD …) conversions adjacent to IDR
    text=re.sub(r'(IDR[^\n\(]+)\([^\)]*USD[^\)]*\)', r'\1', text)
    return text

def detect_lang(text: str) -> str:
    id_hits = len(re.findall(r'\b(dan|yang|untuk|izin|usaha|perizinan|kbli)\b', text, re.IGNORECASE))
    it_hits = len(re.findall(r'\b(licenz|prezz|serviz|aziend|documenti|rischi|note|costi)\b', text, re.IGNORECASE))
    en_hits = len(re.findall(r'\b(license|risk|compliance|investment|minimum|sources|checklist)\b', text, re.IGNORECASE))
    if id_hits > max(it_hits, en_hits):
        return 'id'
    if it_hits > max(id_hits, en_hits):
        return 'it'
    return 'en'

def doc_tags(path: Path, text: str) -> list[str]:
    tags=[]
    # subset from first-level directory under KB agenti
    try:
        rel = path.relative_to(ROOT)
        parts = rel.parts
        if parts:
            tags.append(f"subset:{parts[0].replace(' ', '-').lower()}")
    except Exception:
        pass
    # domain hints from filename
    upname = path.name.lower()
    for dom, patterns in DOMAIN_HINTS.items():
        if any(re.search(p, upname, re.IGNORECASE) for p in patterns) or any(re.search(p, text, re.IGNORECASE) for p in patterns):
            tags.append(f"domain:{dom}")
    # doc class
    relstr = path.as_posix()
    for cls, patterns in DOC_CLASS_HINTS.items():
        if any(re.search(p, relstr) for p in patterns) or any(re.search(p, text) for p in patterns):
            tags.append(f"doc:{cls}")
    # language
    tags.append(f"lang:{detect_lang(text)}")
    return sorted(set(tags))

def official_sources_for(path: Path, tags: list[str]) -> list[str]:
    if any(t.startswith('domain:kbli') for t in tags) or 'subset:kbli' in tags:
        return OFFICIAL_SOURCES_KBLI
    if any(t.startswith('domain:oss') for t in tags) or any('legal' in t for t in tags):
        return OFFICIAL_SOURCES_LEGAL
    return OFFICIAL_SOURCES_DEFAULT

def heading_path(lines, idx):
    # Build H2>H3 trail
    h2=None; h3=None
    for j in range(idx, -1, -1):
        ln=lines[j]
        if ln.startswith('### '):
            h3=ln[4:].strip()
        if ln.startswith('## '):
            h2=ln[3:].strip(); break
    if h2 and h3:
        return f"{h2} > {h3}"
    return h2 or h3

def file_title(lines):
    for ln in lines:
        if ln.startswith('# '):
            return ln[2:].strip()
    return None

def chunk_text(text: str, max_chars=3000, overlap=300):
    lines=text.splitlines()
    buf=[]; start=0; i=0
    while i < len(lines):
        buf.append(lines[i]); cur=sum(len(x)+1 for x in buf)
        if cur>=max_chars or i==len(lines)-1:
            anchor=heading_path(lines, i) or heading_path(lines, start)
            yield (start, i, anchor, '\n'.join(buf).strip())
            if i==len(lines)-1:
                break
            # overlap
            back=0; cs=0
            for k in range(len(buf)-1, -1, -1):
                cs+=len(buf[k])+1
                if cs>=overlap:
                    back=k; break
            start = i - (len(buf)-1-back)
            start=max(0,start)
            buf = lines[start:i+1]
        i+=1

def hash_id(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()[:24]

def main():
    OUTDIR.mkdir(parents=True, exist_ok=True)
    export_path = OUTDIR / 'kb_export.jsonl'
    taxonomy_path = OUTDIR / 'taxonomy.json'
    manifest_path = OUTDIR / 'manifest.json'
    files=[]
    for p in ROOT.rglob('*'):
        if p.is_dir():
            continue
        # exclude hidden and export folders
        if any(part.startswith('.') for part in p.parts):
            continue
        if '/RAG_UPLOAD/' in p.as_posix() or '/KBLI_RAG_UPLOAD/' in p.as_posix():
            continue
        if p.suffix.lower() not in {'.md', '.txt', '.csv'}:
            continue
        # exclude assignment index files
        if p.name.lower() == 'agent_assignments.md':
            continue
        files.append(p)
    files.sort()

    tag_counts={}
    count=0
    with export_path.open('w', encoding='utf-8') as out:
        for p in files:
            raw = read_text(p)
            if raw is None:
                continue
            text = normalize_pricing(raw)
            if not text.strip():
                continue
            lines = text.splitlines()
            title = file_title(lines) or p.stem
            tags = doc_tags(p, text)
            for t in tags:
                tag_counts[t]=tag_counts.get(t,0)+1
            sources = official_sources_for(p, tags)
            mtime = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(p.stat().st_mtime))
            rel = p.relative_to(ROOT)
            for (s,e,anchor,chunk) in chunk_text(text):
                if not chunk:
                    continue
                record={
                    'id': hash_id(f"{rel}:{s}:{e}"),
                    'text': chunk,
                    'metadata': {
                        'title': title,
                        'file_path': str(rel),
                        'anchor': anchor,
                        'tags': tags,
                        'sources': sources,
                        'last_updated': mtime,
                        'policy': {'pricing_excluded': True, 'currency': 'IDR-only (normative)'}
                    }
                }
                out.write(json.dumps(record, ensure_ascii=False)+'\n')
                count+=1
    taxonomy_path.write_text(json.dumps({'tags': tag_counts}, indent=2), encoding='utf-8')
    manifest_path.write_text(json.dumps({'count': count, 'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'root': str(ROOT)}, indent=2), encoding='utf-8')
    print(f"Exported {count} chunks to {export_path}")

if __name__=='__main__':
    main()
