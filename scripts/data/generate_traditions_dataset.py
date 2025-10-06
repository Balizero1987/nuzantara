#!/usr/bin/env python3
"""Konversi data tradisi Nusantara (CSV) menjadi dataset JSONL untuk pelatihan."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Dict, Iterable

BASE_PROMPT = (
    "Jawab dalam Bahasa Indonesia baku dengan memasukkan istilah adat seperlunya. "
    "Tegaskan nilai-nilai budaya yang melekat pada tradisi dan jelaskan konteks waktunya."
)


def load_rows(csv_path: Path) -> Iterable[Dict[str, str]]:
    with csv_path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            yield {k.strip(): (v or '').strip() for k, v in row.items()}


def build_answer(row: Dict[str, str]) -> str:
    tradisi = row.get('tradisi', '')
    provinsi = row.get('provinsi', '')
    region = row.get('region', '')
    kategori = row.get('kategori', '')
    penjelasan = row.get('penjelasan', '')
    nilai = row.get('nilai_kunci', '')
    waktu = row.get('waktu_pelaksanaan', '')
    bahasa = row.get('bahasa', '')

    bagian = [
        f"Tradisi {tradisi} di {provinsi} ({region}) merupakan {kategori.lower()} yang dijaga masyarakat setempat.",
        penjelasan,
        f"Nilai utama yang ditekankan: {nilai}.",
        f"Biasanya dilaksanakan pada {waktu} dengan penggunaan bahasa {bahasa}.",
        "Tradisi ini menegaskan prinsip gotong royong serta penghormatan terhadap leluhur dan alam dalam bingkai Bhinneka Tunggal Ika."
    ]

    return ' '.join(filter(None, bagian))


def build_question(row: Dict[str, str]) -> str:
    tradisi = row.get('tradisi', '')
    provinsi = row.get('provinsi', '')
    return f"Apa itu tradisi {tradisi} di {provinsi} dan nilai budaya apa yang dijaga?"


def build_metadata(row: Dict[str, str]) -> Dict[str, str]:
    return {
        'region': row.get('region', ''),
        'provinsi': row.get('provinsi', ''),
        'tradisi': row.get('tradisi', ''),
        'kategori': row.get('kategori', ''),
        'bahasa': row.get('bahasa', ''),
        'waktu': row.get('waktu_pelaksanaan', ''),
        'nilai': row.get('nilai_kunci', ''),
    }


def convert(csv_path: Path, output_path: Path) -> int:
    rows = list(load_rows(csv_path))
    output_path.parent.mkdir(parents=True, exist_ok=True)

    count = 0
    with output_path.open('w', encoding='utf-8') as handle:
        for row in rows:
            question = build_question(row)
            answer = build_answer(row)
            payload = {
                'messages': [
                    {'role': 'system', 'content': BASE_PROMPT},
                    {'role': 'user', 'content': question},
                    {'role': 'assistant', 'content': answer},
                ],
                'metadata': build_metadata(row),
            }
            handle.write(json.dumps(payload, ensure_ascii=False) + '\n')
            count += 1

    return count


def main() -> None:
    parser = argparse.ArgumentParser(description='Bangun dataset tradisi Nusantara untuk pelatihan ZANTARA.')
    parser.add_argument('--csv', type=Path, default=Path('data/nusantara/traditions.csv'), help='Lokasi file CSV tradisi.')
    parser.add_argument('--output', type=Path, default=Path('../FINE_TUNING/zantara_traditions_knowledge.jsonl'), help='Output JSONL.')
    args = parser.parse_args()

    jumlah = convert(args.csv, args.output)
    print(f"✅ Dataset tradisi selesai: {jumlah} contoh → {args.output}")


if __name__ == '__main__':
    main()
