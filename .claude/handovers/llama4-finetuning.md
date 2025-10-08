# LLAMA 4 Fine-Tuning — Handover

Questa categoria copre tutte le attività di fine-tuning di Llama 4 (Scout 17B) per ZANTARA.

## Start Here
- Quick Start: `docs/llama4/.INIT_LLAMA4_FINETUNING.md:1`
- Full Guide: `docs/llama4/LLAMA4_FINETUNING_COMPLETE_GUIDE.md:1`
- README sezione: `docs/llama4/README_LLAMA4.md:1`

Se assenti, fallback ai file locali su Desktop:
- `/Users/antonellosiano/Desktop/FINE TUNING/.INIT_LLAMA4_FINETUNING.md:1`
- `/Users/antonellosiano/Desktop/FINE TUNING/LLAMA4_FINETUNING_COMPLETE_GUIDE.md:1`
- `/Users/antonellosiano/Desktop/FINE TUNING/README_LLAMA4.md:1`

## Parole Chiave
`llama 4`, `qlora`, `runpod`, `h100`, `fine-tuning`, `modal`, `dataset`, `oom`, `checkpointing`, `sft`, `peft`

## Note Operative
- Ambiente: preferenza RunPod H100 o Modal (vedi guida completa per setup e limiti).
- Training: usa lo script aggiornato indicato in README_LLAMA4, con QLoRA e gradient checkpointing.
- Dataset: vedi `DATASET_FINAL_README.md` in `~/Desktop/FINE TUNING/` per formati e split.
- Log: allega sempre output chiave (throughput, VRAM, step/sec, val loss) nel diario sessione.

## Check Rapidi prima di partire
1) Verifica credenziali e quota (Modal/RunPod).
2) Conferma modello base e LoRA target (vedi Quick Start).
3) Testa un dry-run su batch ridotto per prevenire OOM.

## Cross-Reference
Annota gli aggiornamenti nel diario corrente e linka qui le modifiche significative.
