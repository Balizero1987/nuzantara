# Gemma Format Dataset - Cleaned & Deduplicated

This directory contains the Gemma-format JSONL datasets for fine-tuning.

## Files

- `combined_gemma_dataset.jsonl` - Original combined dataset (7,500 conversations)
- `combined_gemma_dataset_cleaned.jsonl` - Cleaned and deduplicated dataset (4,798 conversations)

## Cleaning Process

The dataset was processed using `scripts/clean_deduplicate_jsonl.py` with the following rules:

### Cleaning Rules

1. **Format Validation**
   - Kept only conversations with valid `messages` array
   - Each message must have `role` ("user" or "assistant") and `content` fields
   - Dropped malformed conversations

2. **Low-Signal Removal**
   - Dropped conversations with only one message
   - Dropped conversations with no assistant response
   - Dropped conversations with total content < 30 characters
   - Dropped trivial exchanges (only "ok", "yes", etc.)

3. **Whitespace Normalization**
   - Trimmed leading/trailing whitespace
   - Collapsed multiple spaces into single space
   - Preserved meaningful line breaks

### Deduplication Rules

- Removed exact duplicates based on conversation content
- Used SHA-256 hash of ordered message sequence
- Kept first occurrence of each unique conversation

## Statistics

| Metric | Count |
|--------|-------|
| Total input conversations | 7,500 |
| Duplicates removed | 2,702 |
| **Total output conversations** | **4,798** |
| **Retention rate** | **64.0%** |

### Breakdown of Dropped Conversations

- Invalid format: 0
- Single message only: 0
- No assistant response: 0
- Too short (< 30 chars): 0
- Low signal (trivial): 0
- Duplicates: 2,702

## Format

Each line is a valid JSON object with the structure:

```json
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

## Usage

The cleaned dataset is ready for Gemma fine-tuning:

```bash
# Use the cleaned dataset for training
python train_gemma.py --data datasets/gemma_format/combined_gemma_dataset_cleaned.jsonl
```

## Source Datasets

Combined from:
- `claude12_jakarta_authentic.json` (1,500 conversations)
- `claude13_zero_zantara.json` (3,000 conversations)
- `claude6_javanese.json` (3,000 conversations)
