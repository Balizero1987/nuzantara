KB Politik Indonesia (1945→sekarang)

Fase 1
- Fokus: 1999→sekarang (era Reformasi): lembaga nasional (Presiden, DPR/DPD, kabinet), gubernur, Pilkada utama, partai politik.
- Format data: JSONL per kategori untuk fakta terstruktur; MD/TXT untuk teks regulasi (Bahasa Indonesia).

Direktori
- persons/: rekaman tokoh dengan masa jabatan, keanggotaan partai, sumber.
- parties/: rekaman partai dengan pimpinan, ideologi, sejarah.
- elections/: pemilu dengan kontes dan hasil.
- jurisdictions/: provinsi/kabupaten/kota dengan versi (pemekaran).
- law/: rujukan/teks UU/PP/Perpu/Permendagri (ID).

Konvensi
- Gunakan QID Wikidata bila tersedia (opsional saat seed).
- Gunakan `kode_wilayah` Kemendagri/BPS dengan interval keberlakuan.
- Tanggal ISO 8601 (YYYY-MM-DD). Hari/bulan tak diketahui → gunakan parsial (YYYY atau YYYY-MM).
- Setiap rekaman memuat URL `sources[]` (utamakan sumber resmi).

Keamanan
- Jangan menambahkan tuduhan tanpa sumber resmi (KPK/MK/MA).
- Tandai fakta diperdebatkan dengan `disputed: true` dan sertakan beberapa sumber.
