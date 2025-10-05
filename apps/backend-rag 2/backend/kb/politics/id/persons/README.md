persons/ Skema JSONL

Setiap baris adalah objek JSON:
{
  "type": "person",
  "id": "person:local:slug-or-qid",
  "qid": "QXXXX" ,               // opsional
  "name": "Nama Lengkap",
  "aliases": ["..."],
  "dob": "YYYY-MM-DD",
  "pob": "Kota, Provinsi, Negara",
  "education": ["..."],
  "party_memberships": [
    {"party_id": "party:local:slug-or-qid", "from": "YYYY", "to": "YYYY"}
  ],
  "offices": [
    {
      "office": "Presiden | Gubernur | Anggota DPR | ...",
      "jurisdiction_id": "jur:ID-31",   // kode wilayah atau skema ID
      "from": "YYYY-MM-DD",
      "to": "YYYY-MM-DD",
      "elected": true,
      "sources": ["https://..."]
    }
  ],
  "cases": [
    {"authority": "KPK | MK | MA", "type": "...", "outcome": "...", "date": "YYYY-MM-DD", "sources": ["https://..."]}
  ],
  "sources": ["https://..."]
}

Berkas seed
- Mulai dari subset kecil yang terverifikasi; kembangkan bertahap.
