#!/usr/bin/env python3
import re
from pathlib import Path
import csv

BASE = Path(__file__).resolve().parents[1]

def load_titles(csv_path: Path):
    mapping = {}
    if not csv_path.exists():
        return mapping
    with csv_path.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('code', '').strip()
            title = (row.get('official_title') or '').strip()
            if code and title:
                mapping[code] = title
    return mapping

def process_file(path: Path, titles: dict):
    text = path.read_text(encoding='utf-8')
    # Pattern: ### KBLI 12345 — Title (optional VERIFY)
    def repl(m):
        code = m.group('code')
        title = titles.get(code, m.group('title'))
        return f"### KBLI {code} — {title}"

    pattern = re.compile(r"^###\s+KBLI\s+(?P<code>\d{5})\s+—\s+(?P<title>.*?)(?:\s*\(VERIFY\))?\s*$", re.MULTILINE)
    new = pattern.sub(repl, text)
    if new != text:
        path.write_text(new, encoding='utf-8')
        return True
    return False

def main():
    titles_csv = BASE/ 'tools' / 'kbli_titles_template.csv'
    titles = load_titles(titles_csv)
    changed = []
    for md in BASE.glob('*STRUCTURED.md'):
        if process_file(md, titles):
            changed.append(md.name)
    # Construction file also has sections; try to normalize VERIFY there too
    cons = BASE / 'KBLI_CONSTRUCTION_SPECIALIZED_TRANSPORTATION.md'
    if cons.exists():
        txt = cons.read_text(encoding='utf-8')
        new = re.sub(r"^(####?\s+KBLI\s+\d{5}.*?)(\s*\(VERIFY\))\s*$", r"\1", txt, flags=re.MULTILINE)
        if new != txt:
            cons.write_text(new, encoding='utf-8')
            changed.append(cons.name)
    if changed:
        print('Updated headings in:', ', '.join(changed))
    else:
        print('No changes needed')

if __name__ == '__main__':
    main()

