# Bali Zero – Profil Perusahaan (v5.2.0)

## Profilo Aziendale
- Misi: layanan profesional untuk visa (C1/C2/C7/C22), izin tinggal (KITAS/KITAP), pendirian perusahaan (PT PMA) dan perpajakan di Indonesia.
- Struktur: C-Level, Setup Team, Tax, Marketing, Operations, Advisory, Bridge/Tech (23 orang, cakupan multibahasa).
- Platform: ZANTARA v5.2.0 di Google Cloud Run; integrasi Google Workspace lengkap; AI multi-provider dengan fallback.

## Kontak Resmi
- Email: info@balizero.com
- WhatsApp: +62 813 3805 1876
- Kantor: Canggu, Bali, Indonesia
- Jam Kerja: Sen–Jum 9:00–18:00; Sab 10:00–14:00
- Website: https://ayo.balizero.com

## Tim (Ringkasan)
- C-Level: Zainal Abidin (CEO), Ruslana (Board)
- Setup: Amanda, Anton, Krisna, Dea (Lead Exec), Adit (Lead Supervisor), Vino (Lead Junior), Ari & Surya (Lead Specialists), Damar (Junior Consultant)
- Tax: Veronika (Manager), Angel (Expert), Kadek, Dewa Ayu (Consultants), Faisha (Care)
- Marketing: Sahira (Specialist), Nina (Advisory)
- Operations: Rina (Reception)
- Advisory: Marta, Olena
- Bridge/Tech: Zero

## Layanan & Harga (Ekstrak 2025)
- Visa masuk tunggal: C1 Turismo (2.3M IDR), C2 Business (3.6M), C7 Professional (5.0M), C7 A&B (4.5M), C22A/B Internship (4.8–5.8M)
- Visa multi-masuk: D1 (5.0–7.0M), D2 (6.0–8.0M), D12 (7.5–10.0M)
- KITAS: Freelance E23 (26–28M), Working E23 (34.5–36M), Investor E28A (17–19M), Retirement E33F (14–16M), Remote E33G (12.5–14M), Spouse/Dependent (11–15M)
- KITAP: sesuai penawaran (Investor/Working/Family/Retirement)
- Business & Legal: PT PMA (dari 20M), Revisi (dari 7M), Alkohol (dari 15M), Real Estate/PBG/SLF (sesuai penawaran)
- Perpajakan: NPWP/NPWPD, laporan bulanan/tahunan, BPJS, LKPM

## Proses Kunci
1) Intake & Kualifikasi → 2) Penawaran & Kalender → 3) Checklist Dokumen → 4) Eksekusi → 5) Penutupan & Umpan Balik.
- Dukungan alat: Drive/Docs/Sheets/Slides/Calendar/Gmail/Contacts.
- KPI: waktu respons (SLA), akurasi dokumen, kepuasan klien.

## Platform ZANTARA v5.2.0
- Layanan: https://zantara-v520-production-1064094238013.europe-west1.run.app
- Auth: header `x-api-key` (internal/eksternal). OpenAPI: `/openapi.yaml`.
- Integrasi Workspace terverifikasi (Drive, Docs, Sheets, Slides, Calendar, Gmail, Contacts, Maps).
- AI: `ai.chat` dengan fallback OpenAI → Claude → Groq → Gemini → Cohere; handler khusus tersedia.
- Endpoint bisnis/sistem: `contact.info`, `lead.save`, `pricing.official`, `price.lookup`, `identity.resolve`, `team.*`, `oracle.*`, `memory.*`, `dashboard.*`.
- Storage: Firestore (memory); Shared Drive operasional.

## Keselamatan & Kepatuhan
- Data dan izin minimum yang diperlukan di Drive bersama.
- 2FA dan manajemen rahasia terpusat; tidak ada data sensitif di saluran tidak sah.
- Kebijakan privasi, KYC/AML dasar, persetujuan pengolahan data.

## Onboarding Kolaborator Baru (Ringkasan operasional)
- Akses: email, Calendar (Tim), Drive bersama, kontak tim/mitra, saluran internal.
- Pelatihan minggu ke-1: layanan/harga, alur lead→klien, alat Workspace, kualitas/kepatuhan, customer care.
- Tujuan 30/60/90: otonomi progresif pada penawaran standar, manajemen portofolio mini, kontribusi pada template/proses.

## Materi Terkait
- BALI_ZERO_COMPLETE_TEAM_SERVICES.md (tim lengkap, harga, kontak)
- AI_START_HERE.md, HANDOVER_LOG.md, TEST_SUITE.md (operasional teknis)

---
Saran: ekspor dokumen ini ke PDF untuk penggunaan presentasi.
