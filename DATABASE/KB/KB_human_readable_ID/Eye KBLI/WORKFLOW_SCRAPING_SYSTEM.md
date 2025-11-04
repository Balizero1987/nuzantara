# 🕷️ ZANTARA Agent Scraping System - Alur Lengkap

**Created**: 2025-10-02
**Version**: 1.0
**Status**: Desain Selesai - Siap Implementasi

---

## 🎯 Ringkasan

Sistem scraping harian otomatis dengan:
- ✅ Scraping multi-domain (5 agent)
- ✅ Pemrosesan AI (Ollama)
- ✅ Persetujuan manusia (Kolaborator Bali Zero)
- ✅ Upload otomatis ke ChromaDB
- ✅ Zero downtime (auto-refresh)

---

## 📊 Workflow Lengkap (7 Langkah)

### **STEP 1: Daily Scraping (Cron 02.00) - Otomatis**

**Pelaksana**: TypeScript Agents (eksekusi paralel)
**Waktu**: Setiap hari pukul 02:00
**Lokasi kode**: `src/agents/*-scraper.ts`

**Agents**:
```
├─ visa-oracle-scraper.ts → imigrasi.go.id
├─ legal-architect-scraper.ts → mahkamahagung.go.id
├─ kbli-eye-scraper.ts → oss.go.id
├─ tax-genius-scraper.ts → pajak.go.id
└─ property-sage-scraper.ts → atrbpn.go.id
```

**Output**: `data/raw/YYYY-MM-DD_[domain]_raw.json`

**Contoh Output**:
```json
[
  {
    "id": "visa-c1-20251002",
    "raw_content": "C1 Tourism Visa 60 days IDR 2,300,000 extendable 2x60 days...",
    "metadata": {
      "source": "imigrasi.go.id",
      "scraped_at": "2025-10-02T02:00:00Z",
      "status": "raw"
    }
  }
]
```

---

### **STEP 2: Pemrosesan Ollama - Otomatis**

**Pelaksana**: Ollama Lokal (llama3.2:3b)
**Waktu**: Setelah scraping (02:01-02:30)
**Lokasi kode**: `src/services/ollama-processor.ts`

**Tugas Ollama**:
1. ✅ Membersihkan HTML/teks berantakan
2. ✅ Mengekstrak field terstruktur (harga, tanggal, persyaratan)
3. ✅ Membuat ringkasan 2 kalimat
4. ✅ Mendeteksi perubahan vs scrape sebelumnya
5. ✅ Scoring kualitas (0-1)
6. ✅ Menandai data mencurigakan (anomali harga, field kosong)

**Output**: `data/processed/YYYY-MM-DD_[domain]_processed.json`

**Contoh Output**:
```json
{
  "domain": "visa",
  "scrape_date": "2025-10-02T02:15:00Z",
  "documents": [
    {
      "id": "visa-c1-20251002",
      "content": "C1 Tourism Visa: 60 days duration, IDR 2,300,000 initial cost, extendable 2x60 days...",
      "ollama_summary": "No changes from previous scrape. All visa details confirmed.",
      "quality_score": 0.95,
      "flags": [],
      "changes": {
        "new_document": false,
        "updated": false,
        "price_changed": false
      }
    }
  ],
  "summary": {
    "total_scraped": 52,
    "new_documents": 3,
    "updated_documents": 2,
    "unchanged": 47,
    "suspicious": 0,
    "quality_avg": 0.93
  }
}
```

---

### **STEP 3: Email ke Kolaborator - Otomatis**

**Pelaksana**: TypeScript Email Notifier
**Waktu**: 02:30 (setelah pemrosesan Ollama)
**Penerima**: collaborator@balizero.com (+ CC admin@balizero.com)
**Lokasi kode**: `src/services/email-notifier.ts`

**Isi Email**:
```
Subject: 🕷️ ZANTARA Daily Scraping - 2025-10-02 - Review Required

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕷️ ZANTARA Daily Scraping Report
Date: October 2, 2025 02:30 AM

📊 SUMMARY BY DOMAIN:

1. 🛂 VISA ORACLE (imigrasi.go.id)
   • Total scraped: 52 documents
   • New: 3
   • Updated: 2
   • Unchanged: 47
   • Quality: 95%
   • ⚠️ Suspicious: 0

2. ⚖️ LEGAL ARCHITECT (mahkamahagung.go.id)
   • Total scraped: 8 documents
   • New: 1 (MA 4521 K/Pdt/2024)
   • Quality: 92%

[... domain lainnya ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ACTION REQUIRED:

🔗 Review Portal: https://zantara-admin.balizero.com/review/2025-10-02

OR

📁 Manual Review: data/processed/2025-10-02_*.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ITEMS REQUIRING ATTENTION:
[Daftar dokumen yang di-flag Ollama, jika ada]

📊 NEXT STEPS:
1. Review data via portal atau file
2. Approve/Reject/Edit dokumen
3. Klik "Upload to ChromaDB" jika sudah siap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### **STEP 4: Review Manual - Manual**

**Pelaksana**: Collaborator Bali Zero
**Tool**: Portal admin (`/review/YYYY-MM-DD`) atau file JSON lokal
**Checkpoints**:
- Validasi ringkasan & konten terstruktur
- Tandai `accepted` / `rejected` / `needs_edit`
- Tambahkan catatan (mis. perubahan harga, kesalahan regulasi)

**Output**: `data/reviewed/YYYY-MM-DD_[domain]_reviewed.json`

**Contoh Entry**:
```json
{
  "id": "visa-c1-20251002",
  "status": "accepted",
  "reviewed_by": "bali-zero-collab",
  "reviewed_at": "2025-10-02T03:15:00Z",
  "notes": [],
  "content": "C1 Tourism Visa: 60 days duration..."
}
```

---

### **STEP 5: Commit & Backup - Otomatis + Manual**

1. **Auto**: Sistem membuat commit Git (branch `daily-scrape/YYYY-MM-DD`)
   - Menambahkan file `raw`, `processed`, `reviewed`
   - Update `logs/scraping/YYYY-MM-DD.md`

2. **Manual**: Collaborator membuat PR → Team lead review → merge ke `main`

3. **Backup**: Script `scripts/backup_to_gcs.sh`
```bash
bash scripts/backup_to_gcs.sh 2025-10-02
```
- Upload `data/raw`, `data/processed`, `data/reviewed`, `logs`
- Bucket: `gs://zantara-scraping-backups/2025-10-02/`

---

### **STEP 6: Upload to ChromaDB - Semi Otomatis**

**Pelaksana**: Collaborator (setelah review OK)
**Script**: `tools/upload_scraped_documents.py`

```bash
python3 tools/upload_scraped_documents.py \
  --date 2025-10-02 \
  --domain visa \
  --persist /Users/antonellosiano/Desktop/NUZANTARA/zantara-rag/backend/data/chroma_db
```

**Behaviour**:
1. Baca file `reviewed`
2. Generate chunks + metadata (domain, content_type, tags, source_url)
3. Upsert ke collection domain (visa_oracle, legal_architect, dll.)
4. Update `logs/chromadb_uploads.md`

---

### **STEP 7: Auto-Refresh & Notification - Otomatis**

**Pelaksana**: Backend Hook (`apps/backend/src/services/notifier.ts`)
- Trigger setelah upload sukses
- Mengirim Webhook ke `zantara-admin` untuk refresh dashboards
- Mengirim Slack `#kb-updates` (opsional)

**Contoh Webhook Payload**:
```json
{
  "event": "chromadb_upload_complete",
  "date": "2025-10-02",
  "domain": "visa",
  "documents": 52,
  "new": 3,
  "updated": 2,
  "deleted": 0
}
```

---

## 🧱 Struktur Direktori
```
Desktop/ZANTARA/scraping-pipeline/
├── src/
│   ├── agents/
│   │   ├── visa-oracle-scraper.ts
│   │   ├── legal-architect-scraper.ts
│   │   ├── kbli-eye-scraper.ts
│   │   ├── tax-genius-scraper.ts
│   │   └── property-sage-scraper.ts
│   ├── services/
│   │   ├── ollama-processor.ts
│   │   ├── email-notifier.ts
│   │   └── uploader.ts
│   └── utils/
│       ├── chromadb.ts
│       ├── logger.ts
│       └── config.ts
├── data/
│   ├── raw/
│   │   └── 2025-10-02_visa_raw.json
│   ├── processed/
│   │   └── 2025-10-02_visa_processed.json
│   └── reviewed/
│       └── 2025-10-02_visa_reviewed.json
├── logs/
│   └── scraping/2025-10-02.md
├── tools/
│   ├── upload_scraped_documents.py
│   └── validate_processed_files.py
└── scripts/
    └── backup_to_gcs.sh
```

---

## 🔐 Autenticazione & Secrets

| Komponen | Secret | Lokasi |
|----------|--------|--------|
| Email Notifier | SMTP creds | `.env.production` |
| Kominfo APIs | API keys | `~/.config/zantara/kominfo.json` |
| OSS Login | Username/password | Keychain Bali Zero |
| BPOM Portal | Cookie refresh | Script `scripts/bpom_refresh.sh` |
| Google Cloud | Service account JSON | `~/.config/gcloud/zantara-scraping.json` |

**Rotate**: minimal setiap 90 hari atau segera jika ada insiden keamanan.

---

## 🛡️ Monitoring & Alerting

- **Health Checks**: `scripts/run_health_checks.sh`
  - Verifikasi scraping berhasil (file raw ada)
  - Memastikan output processed & reviewed size > 0
  - Validasi upload log (documents > 0)

- **Alerts**:
  - Slack channel `#ops-alerts`
  - Email on-call
  - PagerDuty (severity High)

- **Error Handling**:
  - Retries pemanggilan HTTP (3x)
  - Circuit breaker per domain (cooldown 15 menit)
  - Logging ke `logs/errors/YYYY-MM-DD.log`

---

## 🧪 QA & UAT

1. **Pre-prod testing** (`env=staging`)
   - Jalankan scraping manual dengan date override
   - Verifikasi output processed (struktur, metadata)
   - Simulasikan review (approve/reject)
   - Upload ke ChromaDB staging

2. **User Acceptance**
   - Collaborator menjalankan 2 siklus penuh
   - Konfirmasi email & portal berfungsi
   - Validasi notifikasi webhook/Slack

3. **Go-Live Checklist**
   - Cron aktif (server utama)
   - Secrets valid
   - Bucket GCS tersedia
   - Koleksi ChromaDB kosongkan sebelum upload pertama

---

## 📅 SLA & Operasi

| Aktivitas | SLA | Owner |
|-----------|-----|-------|
| Scraping selesai | 02:10 | DevOps |
| Pemrosesan Ollama | 02:30 | DevOps |
| Email terkirim | 02:35 | DevOps |
| Review manusia | 08:00 | Collaborator |
| Upload ChromaDB | 10:00 | Collaborator |
| Backup GCS | 12:00 | DevOps |

**Incident Response**:
- P0 (data hilang / upload gagal): respon < 30 menit
- P1 (scraping gagal 1 domain): respon < 1 jam
- P2 (perubahan minor): respon < 4 jam

---

## 🤝 Roles & Pemilik

| Role | Tugas |
|------|-------|
| DevOps Lead | Jaga cron, server, secrets |
| Data Engineer | Maintenance agents, Ollama prompts |
| Collaborator Bali Zero | Review & approval manual |
| QA Analyst | Monitor kualitas, regression tests |
| Product Owner | Prioritas roadmap, koordinasi domain |

---

## 🗺️ Roadmap (Q4 2025)

1. **Automated Diff Summaries**: highlight perubahan per dokumen
2. **AI-Assisted Review**: rekomendasi accept/reject
3. **Integration BPOM API**: login otomatis + pagination
4. **Real-time Alerts**: Slack bot untuk flag High risk
5. **Self-healing Scraper**: fallback proxies + captcha solver

---

## 📚 Referensi
- `docs/agents/setup_manual.md`
- `docs/infra/chromadb_deployment.md`
- `docs/ops/runbook_scraping_incidents.md`
- `tools/validate_processed_files.py`

---

## ✅ Ringkasan Eksekutif
- Scraping harian otomatis → diproses AI → direview manusia → diunggah ke ChromaDB
- Semua artefak dibackup dan terintegrasi ke pipeline KB
- Metrik & notifikasi siap untuk menjaga kualitas + ketahanan operasional

