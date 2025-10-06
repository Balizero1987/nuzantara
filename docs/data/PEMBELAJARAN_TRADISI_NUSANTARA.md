# 📚 Rencana Pembelajaran Tradisi Nasional & Lokal Nusantara

Dokumen ini menjadi pedoman untuk mengajari ZANTARA seluruh tradisi nasional dan adat lokal Indonesia melalui pendekatan dataset terstruktur, pipeline kurasi, dan siklus pelatihan berkelanjutan.

---

## 1. Tujuan
- Memberikan pemahaman mendalam tentang ritual kebangsaan, adat religius, tradisi agraris, maritim, dan seni performatif di seluruh provinsi.
- Memastikan ZANTARA mampu menjelaskan makna, nilai kearifan lokal, waktu pelaksanaan, bahasa pengantar, dan konteks sosial setiap tradisi.
- Menjaga keseimbangan narasi nasional (NKRI, Pancasila) dengan kekhasan daerah.

---

## 2. Sumber Data Utama
1. `data/nusantara/traditions.csv` → master list tradisi per wilayah.
2. `data/nusantara/dataset_manifest.json` → registri dataset yang dapat diperluas untuk memasukkan korpus tradisi.
3. `../FINE_TUNING/zantara_*.jsonl` → dataset identitas Nusantara, fondasi bahasa, dan spiritual yang sudah ada (referensi nilai/narasi).

---

## 3. Struktur Data Tradisi
Kolom penting pada `tradicions.csv`:
- `region` & `provinsi`: level geografi.
- `tradisi` & `kategori`: nama dan tipe ritual (kebangsaan, adat, seni, maritim, agraris, dsb.).
- `penjelasan`: narasi ringkas (≤ 2 kalimat) tentang sejarah & proses.
- `nilai_kunci`: nilai budaya (gotong royong, harmoni alam, toleransi, dst.).
- `waktu_pelaksanaan`: siklus kalender atau momentum adat.
- `bahasa`: bahasa pengantar utama yang lazim digunakan.

Dataset ini dapat diperluas dengan kolom tambahan seperti `tokoh_adat`, `alat_musik`, atau `status_warisan_unesco` sesuai kebutuhan pelatihan.

---

## 4. Pipeline Kurasi
1. **Inventarisasi**: tambahkan tradisi baru per provinsi ke CSV beserta sumber referensi (catat di kolom `notes` bila diperlukan).
2. **Validasi**: lakukan pemeriksaan lintas sumber (dokumen adat, portal budaya daerah, wawancara) sebelum masuk ke dataset pelatihan.
3. **Konversi ke JSONL**: gunakan skrip (lihat bagian 6) untuk menghasilkan pasangan dialog tanya-jawab dalam bahasa Indonesia.
4. **Integrasi**: daftarkan file JSONL baru di `dataset_manifest.json` dengan kategori `tradisi_budaya`.
5. **Pelatihan**: gabungkan dengan dataset identitas + spiritual untuk menjaga konsistensi narasi.
6. **Evaluasi**: buat daftar pertanyaan uji per daerah untuk memastikan akurasi pasca training.

---

## 5. Contoh Prompt Pelatihan
- "Jelaskan makna Upacara Grebeg Maulud dan nilai yang diajarkan." → ditargetkan ke pengetahuan keraton Yogyakarta.
- "Apa itu Rambu Solo' di Toraja dan bagaimana struktur prosesi lengkapnya?"
- "Mengapa tradisi Bakar Batu penting bagi komunitas Pegunungan Tengah Papua?"
- "Bagaimana prinsip konservasi yang terjaga dalam sistem Sasi di Maluku?"

Semua jawaban harap menggunakan Bahasa Indonesia baku, dengan sisipan istilah lokal bila relevan.

---

## 6. Otomatisasi Generasi Dataset (TODO)
- Buat skrip `scripts/data/generate_traditions_dataset.ts` yang:
  1. Membaca CSV tradisi.
  2. Membentuk pasangan Q&A atau penjelasan naratif untuk setiap tradisi.
  3. Menambahkan metadata `language`, `region`, `kategori` di JSONL.
- Output rekomendasi: `../FINE_TUNING/zantara_traditions_knowledge.jsonl` (target awal 500 contoh, bertambah seiring update).

---

## 7. Siklus Pembaruan
| Tahap | Frekuensi | Aktivitas |
|-------|-----------|-----------|
| Audit Tradisi | Triwulanan | Cek provinsi / tradisi yang belum terwakili, update CSV |
| Pengayaan Data | Bulanan | Tambah narasi, foto, atau transkrip wawancara (opsional) |
| Pelatihan | Setelah +250 contoh | Fine-tuning incremental atau LoRA |
| Evaluasi | Pasca training | Jalankan tes tanya-jawab per wilayah |

---

## 8. Catatan Implementasi
- Pastikan seluruh penulisan file referensi menggunakan Bahasa Indonesia sesuai arahan pengguna.
- Saat menambahkan tradisi baru, prioritaskan keseimbangan antar pulau agar tidak bias Jawa-Bali.
- Kolaborasi dengan pakar adat (bila memungkinkan) untuk memastikan sensitivitas budaya.

---

Dengan fondasi ini, ZANTARA dapat menyerap tradisi nasional dan lokal secara sistematis, menjaga ketepatan historis, dan menampilkan empati budaya dalam setiap percakapan.
