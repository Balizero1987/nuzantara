# Dataset Cleaning & Deduplication Report

**Date:** November 17, 2025
**Script:** `scripts/clean_deduplicate_jsonl.py`
**Input:** `datasets/gemma_format/combined_gemma_dataset.jsonl`
**Output:** `datasets/gemma_format/combined_gemma_dataset_cleaned.jsonl`

## Summary

Successfully cleaned and deduplicated the combined Gemma format dataset, removing 2,702 duplicate conversations while maintaining data quality.

## Results

| Metric | Value |
|--------|-------|
| **Input Conversations** | 7,500 |
| **Output Conversations** | 4,798 |
| **Duplicates Removed** | 2,702 |
| **Retention Rate** | 64.0% |
| **Input File Size** | 7.7 MB |
| **Output File Size** | 5.7 MB |

## Cleaning Rules Applied

### 1. Format Validation
- ✅ Validated `messages` array structure
- ✅ Ensured each message has `role` and `content` fields
- ✅ Verified roles are either "user" or "assistant"
- ✅ Checked for non-empty content strings

### 2. Low-Signal Removal
Dropped conversations that met any of these criteria:
- Single message only
- No assistant response
- Total content length < 30 characters
- Trivial exchanges (only "ok", "yes", etc.)

### 3. Whitespace Normalization
- Trimmed leading/trailing whitespace
- Collapsed multiple spaces into single space
- Preserved meaningful line breaks

### 4. Deduplication
- Removed exact duplicates based on conversation content
- Used SHA-256 hash of ordered message sequence
- Kept first occurrence of each unique conversation

## Breakdown of Dropped Conversations

| Reason | Count |
|--------|-------|
| Invalid format | 0 |
| Single message only | 0 |
| No assistant response | 0 |
| Too short (< 30 chars) | 0 |
| Low signal (trivial) | 0 |
| **Duplicates** | **2,702** |
| **TOTAL DROPPED** | **2,702** |

## Source Datasets

The cleaned dataset was created by combining and processing:

1. `claude12_jakarta_authentic.json` - 1,500 conversations (Indonesian)
2. `claude13_zero_zantara.json` - 3,000 conversations (Italian, Zero-ZANTARA)
3. `claude6_javanese.json` - 3,000 conversations (Javanese)

**Total source:** 7,500 conversations, 99,602 messages

## Quality Validation

✅ All 4,798 output conversations validated successfully
✅ Proper JSONL format maintained
✅ All messages have valid role/content structure
✅ No formatting errors or malformed JSON

## Dataset Format

Each line in the cleaned dataset is a valid JSON object:

```json
{
  "messages": [
    {"role": "user", "content": "Bu, es_campur harganya berapa sih?"},
    {"role": "assistant", "content": "Oke banget nih, pilih aja yang ente mau"},
    {"role": "user", "content": "Sekalian yang lain ada gak?"},
    {"role": "assistant", "content": "Langganan terus ya kalo cocok"}
  ]
}
```

## Usage

The cleaned dataset is ready for Gemma fine-tuning:

```bash
# Location (gitignored)
datasets/gemma_format/combined_gemma_dataset_cleaned.jsonl

# Use for training
python DATASET_GEMMA/gemma_finetuning_colab.ipynb
```

## Notes

- The `datasets/` directory is gitignored due to file size
- Original and cleaned datasets are stored locally
- Cleaning script is version-controlled in `scripts/clean_deduplicate_jsonl.py`
- The high duplicate rate (36%) suggests significant overlap between source datasets
