# 🚀 Panduan Fine-Tuning Akhir ZANTARA

Dokumen ini merangkum komposisi dataset final, langkah persiapan, eksekusi fine-tuning, serta prosedur evaluasi. Seluruh instruksi ditulis dalam Bahasa Indonesia sesuai kebijakan terbaru.

---

## 1. Ringkasan Dataset Final
- **File**: `../FINE_TUNING/zantara_finetune_final_v1.jsonl`
- **Total contoh**: 25.233 pasangan dialog berbobot
- **Sumber campuran** (acak menggunakan `seed=42`):
  - `ultimate_20k` → 8.000 contoh
  - `supreme_15k` → 4.000
  - `complete_nusantara_identity` → 2.000
  - `nusantara_identity_v2` → 800 (seluruh dataset)
  - `bahasa_indonesia_core` → 2.000
  - `traditions_knowledge` → 69 (seluruh dataset tradisi terbaru)
  - `training_final_3000` → 1.500
  - `combined_training` → 664
  - `nusantara_multilingual_700` → 2.000
  - `deep_spiritual_layer` → 1.500
  - `eternal_foundations` → 1.500
  - `kb_training` → 1.200

Campuran ini menjaga keseimbangan antara identitas Nusantara, tradisi lokal, percakapan bisnis, spiritual, serta korpus pengetahuan formal. Susunan dapat disesuaikan dengan mengubah `data/nusantara/final_mix_config.json` dan menjalankan ulang `scripts/data/prepare_final_finetune.py`.

---

## 2. Persiapan Lingkungan
1. **Hardware minimal**
   - GPU 24GB (A10/A4500) untuk QLoRA; 48GB+ (A6000/H100) bila ingin full fine-tuning.
2. **Software**
   - Python 3.10+
   - `pip install -r requirements-finetune.txt` (buat daftar paket: `transformers`, `peft`, `accelerate`, `bitsandbytes`, `unsloth` bila digunakan).
3. **Model dasar**
   - Rekomendasi: `meta-llama/Llama-3.1-8B-Instruct` (sesuaikan kapasitas GPU).
4. **Token**
   - Pastikan access token Hugging Face diterapkan via `huggingface-cli login` jika model memerlukan autentikasi.

---

## 3. Eksekusi Fine-Tuning (QLoRA + Unsloth)
```bash
export MODEL_BASE="meta-llama/Llama-3.1-8B-Instruct"
export DATA_PATH="/Users/antonellosiano/Desktop/FINE_TUNING/zantara_finetune_final_v1.jsonl"
export OUTPUT_DIR="/Users/antonellosiano/Desktop/FINE_TUNING/output/zantara-ft-final"

accelerate launch --config_file configs/accelerate/default.yaml \
  scripts/train_unsloth_qlora.py \
  --model_name $MODEL_BASE \
  --dataset_path $DATA_PATH \
  --output_dir $OUTPUT_DIR \
  --num_epochs 3 \
  --learning_rate 2e-4 \
  --warmup_ratio 0.05 \
  --per_device_train_batch_size 4 \
  --gradient_accumulation_steps 8 \
  --max_seq_length 2048 \
  --save_strategy epoch \
  --logging_steps 50 \
  --seed 42
```
> *Catatan*: `scripts/train_unsloth_qlora.py` dapat diadaptasi dari template Unsloth; pastikan memasukkan prompt sistem (role `system`) dari dataset yang sudah distandardisasi.

Untuk full fine-tuning tanpa QLoRA, gunakan `--bnb_4bit false` dan tingkatkan batch size sesuai kapasitas.

---

## 4. Evaluasi & Validasi
1. **Sanity Check**: sampling 20 contoh dari dataset (`jq ' .messages' | head`) untuk memastikan format konsisten.
2. **Evaluasi otomatis**:
   - Jalankan skrip QA internal (`scripts/eval/evaluate_traditions.py` – *TODO*).
   - Ukur perplexity pada korpus validasi (misal `indonesia_final_clean.jsonl`).
3. **Evaluasi manual**:
   - Siapkan checklist 5 pertanyaan per provinsi (lihat `docs/data/PEMBELAJARAN_TRADISI_NUSANTARA.md`).
   - Uji respon terhadap scenario bisnis kritis (WhatsApp, pricing, visa).
   - Verifica code-switching (Bahasa Indonesia ↔ bahasa daerah ↔ Italia/Inggris).
4. **Guardrail**: monitor hallucination dengan prompt sensitif (legal, agama, adat).

---

## 5. Deployment Model Baru
1. Simpan adapter (`OUTPUT_DIR`) dan merge ke model dasar jika diperlukan (`python scripts/merge_lora.py`).
2. Publikasikan ke GCS/Hugging Face sesuai kebijakan.
3. Update konfigurasi backend RAG atau API (`config/model_config.json`) agar memuat checkpoint baru.
4. Jalankan regression test (`test_rag_comprehensive.sh`, `test-handlers-simple.mjs`).

---

## 6. Checklist Akhir
- [ ] Dataset final diverifikasi (`npx tsx scripts/data/check_nusantara_datasets.ts`).
- [ ] `final_mix_config.json` terdokumentasi perubahan.
- [ ] Training log tersimpan (`output/train_logs.jsonl`).
- [ ] Evaluasi manual + otomatis lulus.
- [ ] Model baru diarsipkan dan versi lama tetap tersedia fallback.

Dengan panduan ini, proses fine-tuning ZANTARA dapat dijalankan secara konsisten, transparan, dan selaras dengan visi “Satu Nusantara, Ribuan Bahasa, Satu Jiwa”.
