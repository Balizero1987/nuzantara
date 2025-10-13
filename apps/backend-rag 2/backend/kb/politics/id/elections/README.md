elections/ Skema JSONL

{
  "type": "election",
  "id": "election:id-YYYY",
  "date": "YYYY-MM-DD",
  "level": "national | province | regency | city",
  "scope": "DPR | DPD | Presidential | Pilkada",
  "jurisdiction_id": "jur:ID-31",    // Jika subnasional
  "contests": [
    {
      "office": "President | DPR | DPRD | Governor | ...",
      "district": "...",             // opsional
      "results": [
        {"candidate_id": "person:...", "party_id": "party:...", "votes": 0, "pct": 0.0}
      ]
    }
  ],
  "turnout_pct": 0.0,
  "sources": ["https://kpu.go.id/...", "..."]
}
