# Combined Gemma Dataset

## Overview

Questo file contiene il dataset combinato in formato Gemma, pronto per il fine-tuning.

## Dettagli

- **File**: `combined_gemma_dataset.jsonl`
- **Formato**: JSONL (JSON Lines)
- **Totale conversazioni**: 27,015
- **Dimensione**: ~27 MB

## Struttura

Ogni riga del file è un oggetto JSON con la seguente struttura:

```json
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

## Dataset inclusi (13 file)

1. `claude14_team_dynamics_essential` - 3,000 conversazioni
2. `claude3_jakarta_mixed` - 15 conversazioni
3. `claude7_sundanese` - 3,000 conversazioni
4. `claude9_mixed_premium` - 3,000 conversazioni
5. `dataset_01_claude1_jakarta_casual` - 1,500 conversazioni
6. `dataset_02_claude2_jakarta_business` - 1,500 conversazioni
7. `dataset_04_claude4_jakarta_daily` - 1,500 conversazioni
8. `dataset_08_claude8_balinese_slang` - 3,000 conversazioni
9. `dataset_10_claude10_jakarta_youth` - 1,500 conversazioni
10. `dataset_11_claude11_jakarta_professional` - 1,500 conversazioni
11. `dataset_12_claude12_jakarta_authentic` - 1,500 conversazioni
12. `javanese_claude6` - 3,000 conversazioni
13. `zero-zantara` - 3,000 conversazioni

## Utilizzo

Il file è pronto per essere utilizzato con:
- Google Gemma fine-tuning
- Hugging Face Transformers
- Altri framework di fine-tuning compatibili con il formato Gemma

## Branch

Questo file è nel branch: `gemma-dataset-combined`

