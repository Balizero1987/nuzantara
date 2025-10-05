ZANTARA RAG - Basis Pengetahuan (KB)

Ruang Lingkup
- Direktori ini menyimpan pengetahuan domain yang dikurasi untuk backend RAG (Python).
- Domain baru: Politik Indonesia (id) 1945→sekarang, dimulai dari 1999→sekarang (Fase 1).

Kebijakan Bahasa
- Semua dokumen KB dan README ditulis dalam Bahasa Indonesia.
- Skema/field JSON tetap berbahasa Inggris demi kompatibilitas kode.

Struktur
- kb/politics/id/
  - persons/          Biografi dan masa jabatan (JSONL)
  - parties/          Profil partai dan lini masa (JSONL)
  - elections/        Peristiwa pemilu dan hasilnya (JSONL)
  - jurisdictions/    Satuan administrasi dan perubahan (JSONL)
  - law/              Teks/rujukan regulasi utama (ID; TXT/MD/tautan)

Catatan
- Mulai dari templat seed, ganti dengan data terverifikasi dari sumber resmi.
- Setiap baris JSONL adalah satu rekaman lengkap; pertahankan konsistensi field.
