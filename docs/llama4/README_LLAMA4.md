# Llama 4 Scout 17B Fine-Tuning for ZANTARA

## 📚 Documentation Structure

**START HERE** → `.INIT_LLAMA4_FINETUNING.md` - Quick start per nuove sessioni

**FULL GUIDE** → `LLAMA4_FINETUNING_COMPLETE_GUIDE.md` - Guida completa con tutti i dettagli tecnici

**TRAINING SCRIPT** → `train_zantara_runpod.py` - Script corretto con QLoRA

**SETUP SCRIPT** → `setup_runpod.py` - Deployment automatico su RunPod

**DATASET** → `NUZANTARA_VISA_INDONESIAN.jsonl` - 22,009 esempi in Indonesiano

---

## ⚡ Quick Summary

**Problema**: Modal OOM con 2x H100 usando load_in_8bit

**Soluzione**: RunPod H100 SXM con QLoRA 4-bit NF4

**Stato**: Setup completo, deployment manuale necessario

**Prossimo Step**: Deploy files su RunPod via Jupyter Notebook

---

## 🎯 Come Procedere

1. Leggi `.INIT_LLAMA4_FINETUNING.md` per contesto immediato
2. Usa Jupyter Notebook su RunPod per deploy `setup_runpod.py`
3. Lancia test training (100 steps)
4. Se tutto OK, lancia full training (3000 steps)
5. Download model e integrazione su ZANTARA

Buon fine-tuning! 🚀
