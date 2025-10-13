#!/usr/bin/env python3
"""Susun dataset final untuk fine-tuning ZANTARA sesuai konfigurasi campuran."""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Dict, List

CONFIG_PATH = Path('data/nusantara/final_mix_config.json')
MANIFEST_PATH = Path('data/nusantara/dataset_manifest.json')


def load_manifest() -> Dict[str, str]:
    manifest = json.loads(MANIFEST_PATH.read_text())
    mapping: Dict[str, str] = {}
    for entry in manifest['datasets']:
        mapping[entry['id']] = entry['path']
    return mapping


def load_config() -> Dict:
    return json.loads(CONFIG_PATH.read_text())


def load_jsonl(path: Path) -> List[str]:
    with path.open(encoding='utf-8') as handle:
        return handle.readlines()


def main() -> None:
    config = load_config()
    manifest = load_manifest()

    seed = config.get('seed', 42)
    random.seed(seed)

    collected: List[str] = []
    stats: List[Dict[str, int]] = []

    for item in config['datasets']:
        ds_id = item['id']
        max_examples = item.get('max_examples')
        rel_path = manifest.get(ds_id)
        if not rel_path:
            raise ValueError(f"Dataset '{ds_id}' tidak ditemukan di manifest.")

        abs_path = Path(rel_path).resolve()
        rows = load_jsonl(abs_path)
        if max_examples is None or max_examples >= len(rows):
            selected = rows
        else:
            selected = random.sample(rows, max_examples)

        collected.extend(selected)
        stats.append({
            'id': ds_id,
            'available': len(rows),
            'selected': len(selected)
        })

    random.shuffle(collected)

    output_path = Path(config['output']).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', encoding='utf-8') as handle:
        handle.writelines(collected)

    total = len(collected)
    print("✅ Berhasil menyusun dataset final fine-tuning")
    print(f"📦 Output : {output_path}")
    print(f"🧮 Total contoh : {total}")
    print("📊 Rincian campuran:")
    for stat in stats:
        print(f" - {stat['id']}: {stat['selected']} dipilih dari {stat['available']}")


if __name__ == '__main__':
    main()
