# KB Agents — Pedoman Kerja

Ruang lingkup: berlaku untuk seluruh tree `Desktop/KB agenti` (KBLI + Visa oracle).

Kebijakan: Pricing Separation (Bali Zero)
- Jangan memasukkan harga layanan Bali Zero ke dalam dokumen KB normatif (KBLI, panduan sektor, ringkasan regulasi).
- Tampilkan harga hanya ketika pengguna secara eksplisit memintanya, bersumber dari `Visa oracle/pricing/normalized.json`.
- Untuk contoh/simulasi dalam `Visa oracle/examples`, sertakan hanya referensi (`balizero_price_ref`) ke overlay harga; jangan menuliskan angka harga secara default.

Defaults
- hide_prices_by_default: true

Catatan
- Dokumen regulasi dapat menyebutkan bahwa harga disediakan secara terpisah melalui daftar harga Bali Zero.
- Jaga agar konten regulasi tetap independen dari penetapan harga komersial untuk mencegah pergeseran dan mempermudah pembaruan.
