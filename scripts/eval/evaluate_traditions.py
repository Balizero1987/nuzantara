#!/usr/bin/env python3
"""Ringkasan cepat cakupan tradisi dan generator prompt evaluasi manual."""

from __future__ import annotations

import csv
import random
from collections import Counter, defaultdict
from pathlib import Path

TRADITIONS_CSV = Path('data/nusantara/traditions.csv')


def load_traditions():
    with TRADITIONS_CSV.open(encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def summarise(traditions):
    by_region = Counter(row['region'] for row in traditions)
    by_province = Counter(row['provinsi'] for row in traditions)

    print('📊 Rekap tradisi per wilayah besar:')
    for region, count in by_region.most_common():
        print(f" - {region}: {count} tradisi")

    print('\n🌍 Top 10 provinsi berdasarkan jumlah entri:')
    for province, count in by_province.most_common(10):
        print(f" - {province}: {count}")


def generate_prompts(traditions, total=12):
    random.seed(42)
    grouped = defaultdict(list)
    for row in traditions:
        grouped[row['region']].append(row)

    prompts = []
    for region, rows in grouped.items():
        sample_count = max(1, min(2, len(rows)))
        for row in random.sample(rows, sample_count):
            tradisi = row['tradisi']
            provinsi = row['provinsi']
            nilai = row['nilai_kunci']
            prompts.append(
                f"Jelaskan secara rinci tradisi {tradisi} di {provinsi}. "
                f"Tekankan nilai {nilai} dan jelaskan kapan dilakukan."
            )

    prompts = prompts[:total]
    print('\n📝 Daftar prompt evaluasi manual (gunakan pada model setelah fine-tuning):')
    for idx, prompt in enumerate(prompts, 1):
        print(f" {idx}. {prompt}")


def main() -> None:
    if not TRADITIONS_CSV.exists():
        raise FileNotFoundError(f"Tidak menemukan {TRADITIONS_CSV}. Pastikan repositori sudah diperbarui.")

    traditions = load_traditions()
    print(f"✅ Tradisi dimuat: {len(traditions)} entri")
    summarise(traditions)
    generate_prompts(traditions)


if __name__ == '__main__':
    main()
