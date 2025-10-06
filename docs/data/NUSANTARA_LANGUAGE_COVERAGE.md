# 🇮🇩 Nusantara Language Coverage & Continuous Training

This playbook tracks the multilingual scope of ZANTARA and formalises the loop for continuous dataset growth toward the 20k+ example objective.

---

## 1. Language Inventory (data/nusantara/languages.csv)

Columns:
- `language`, `iso_code`, `region`, `family`
- `estimated_speakers_millions`, `status`, `target_examples`, `notes`

The file enumerates 50+ strategic tongues across Sumatra, Java, Kalimantan, Sulawesi, Bali–Nusa Tenggara, Maluku, and Papua. Priority tiers:
- **core**: always include (Bahasa Indonesia, Javanese, Sundanese, Minang, Batak, Bugis)
- **priority**: >100k speakers or critical trade lingua franca (Betawi, Kupang Malay, Papuan Malay, Lampung, Gorontalo, Toraja)
- **expansion**: underrepresented dialects that need scheduled augmentation (Cia-Cia, Tunjung, Alune, Yamdena, Yali, etc.)

Use the CSV as the single source of truth for quota planning and to brief linguistic annotators.

---

## 2. Dataset Manifest (data/nusantara/dataset_manifest.json)

Each entry maps a dataset id to an on-disk JSONL file, the target example count, and qualitative notes (identity vs business vs spiritual layers). The manifest references the existing corpora stored in `../FINE_TUNING/` (20k ultimate blend, 15k supreme, 5k multilingual booster, etc.).

Fields per dataset:
- `id`, `path`, `category`, `region_scope`
- `target_examples` (planned volume)
- `priority` (critical/high/medium)
- `notes` (what linguistic/cultural gap it covers)

---

## 3. Coverage Check Script

`tsx scripts/data/check_nusantara_datasets.ts`

What it does:
1. Reads the manifest
2. Resolves absolute paths
3. Counts JSONL rows (streamed, low RAM)
4. Prints coverage vs. target and highlights missing files
5. Aggregates totals to monitor progress toward 20k+ examples

### Usage
```bash
# from repo root
npx tsx scripts/data/check_nusantara_datasets.ts
```

Expected output: a tabular coverage report plus a missing-files section if any corpus is absent.

Automate this in CI once dataset paths are synced into the repo or mounted locally.

---

## 4. Continuous Training Loop (recommended cadence)

1. **Ingestion & Expansion**
   - Weekly intake for under-covered `expansion` languages in the CSV
   - Use `scripts/generate_all_indonesian_languages.py` as the synthetic seed and layer real field data when available

2. **Quality Control**
   - Run dedupe + toxicity screening
   - Spot check with bilingual reviewers per island cluster
   - Tag each JSONL record with `metadata.language` for future automation

3. **Coverage Audit**
   - Run the coverage script before each training cycle
   - Update the CSV target counts when business priorities change

4. **Training Schedule**
   - Mini-finetunes every +1k clean examples (QLoRA batches)
   - Major refresh when the `ultimate_20k` corpus gains ≥10% new material
   - Track metrics per region (accuracy, code-switch fluency, cultural safety)

5. **Feedback Loop**
   - Log hallucination or language gaps from production conversations
   - Backfill missing intents in the CSV + manifest pipeline

---

## 5. Next Integrations

- Mirror the `../FINE_TUNING` corpora inside a storage bucket accessible in CI/CD
- Extend datasets with `metadata.language` so coverage reports can drill down per row
- Add evaluation suites per language (BLEU/COMET or custom scoring) for regression detection

---

📌 With the CSV inventory, manifest, and coverage script in place, we can systematically push toward and beyond the 20k Nusantara-language target while keeping quality under tight control.
