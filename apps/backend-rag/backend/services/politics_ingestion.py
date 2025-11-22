from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

from core.embeddings import EmbeddingsGenerator
from core.qdrant_db import QdrantClient

logger = logging.getLogger(__name__)


class PoliticsIngestionService:
    """
    Ingest structured Indonesian politics KB (1999→today) into Qdrant.
    Stores in collection 'politics_id'.
    """

    def __init__(self, qdrant_url: Optional[str] = None):
        self.embedder = EmbeddingsGenerator()
        self.vector_db = QdrantClient(
            qdrant_url=qdrant_url,
            collection_name="politics_id",
        )

    def _build_text(self, record: Dict[str, Any]) -> str:
        t = record.get("type")
        if t == "person":
            name = record.get("name", "")
            dob = record.get("dob", "")
            pob = record.get("pob", "")
            offices = record.get("offices", [])
            office_lines = []
            for o in offices:
                office_lines.append(
                    f"- {o.get('office','')} ({o.get('from','?')}→{o.get('to','?')}) @ {o.get('jurisdiction_id','')}"
                )
            parties = record.get("party_memberships", [])
            party_lines = [
                f"- {p.get('party_id','')} ({p.get('from','?')}→{p.get('to','?')})" for p in parties
            ]
            text = (
                f"Tokoh: {name}\n"
                f"Lahir: {dob} | {pob}\n"
                f"Keanggotaan partai:\n" + ("\n".join(party_lines) if party_lines else "- tidak ada") + "\n"
                f"Jabatan:\n" + ("\n".join(office_lines) if office_lines else "- tidak ada")
            )
            return text

        if t == "party":
            name = record.get("name", "")
            ideol = ", ".join(record.get("ideology", []) or [])
            leaders = record.get("leaders", [])
            leader_lines = [
                f"- {l.get('person_id','')} ({l.get('from','?')}→{l.get('to','?')})" for l in leaders
            ]
            text = (
                f"Partai: {name} ({record.get('abbrev','')})\n"
                f"Berdiri: {record.get('founded','')} | Bubaran: {record.get('dissolved','')}\n"
                f"Ideologi: {ideol or 'tidak ada'}\n"
                f"Pimpinan:\n" + ("\n".join(leader_lines) if leader_lines else "- tidak ada")
            )
            return text

        if t == "election":
            text = (
                f"Pemilu: {record.get('id','')} pada {record.get('date','')}\n"
                f"Level: {record.get('level','')} | Ruang lingkup: {record.get('scope','')} | Yurisdiksi: {record.get('jurisdiction_id','')}\n"
            )
            contests = record.get("contests", [])
            for c in contests:
                text += f"Kontes: {c.get('office','')} | Daerah: {c.get('district','')}\n"
                for r in c.get("results", []):
                    text += (
                        f"- calon={r.get('candidate_id','')}, partai={r.get('party_id','')}, "
                        f"suara={r.get('votes',0)}, persen={r.get('pct',0.0)}\n"
                    )
            return text

        if t == "jurisdiction":
            return (
                f"Yurisdiksi: {record.get('id','')} {record.get('name','')} ({record.get('kind','')})\n"
                f"Induk: {record.get('parent_id','')} | Berlaku: {record.get('valid_from','?')}→{record.get('valid_to','?')}\n"
            )

        if t == "law":
            return (
                f"Regulasi: {record.get('number','')} {record.get('title','')} ({record.get('date','')})\n"
                f"Subjek: {record.get('subject','')}\n"
            )

        return json.dumps(record, ensure_ascii=False)

    def ingest_jsonl_files(self, paths: List[Path]) -> Dict[str, Any]:
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []
        ids: List[str] = []

        for p in paths:
            try:
                with p.open("r", encoding="utf-8") as f:
                    for line_idx, line in enumerate(f):
                        line = line.strip()
                        if not line:
                            continue
                        rec = json.loads(line)
                        text = self._build_text(rec)

                        documents.append(text)
                        metadatas.append(
                            {
                                "domain": "politics-id",
                                "record_type": rec.get("type"),
                                "record_id": rec.get("id"),
                                "qid": rec.get("qid"),
                                "period": rec.get("period", "1999-ongoing"),
                                "source_count": len(rec.get("sources", []) or []),
                            }
                        )
                        rid = rec.get("id") or f"record:{p.stem}:{line_idx}"
                        ids.append(f"pol:{rec.get('type','record')}:{rid}:{line_idx}")
            except Exception as e:
                logger.error(f"Failed to read {p}: {e}")

        if not documents:
            return {"success": False, "documents_added": 0, "message": "No records found"}

        embeddings = self.embedder.generate_embeddings(documents)
        self.vector_db.upsert_documents(chunks=documents, embeddings=embeddings, metadatas=metadatas, ids=ids)

        return {"success": True, "documents_added": len(documents)}

    def ingest_dir(self, root: Path) -> Dict[str, Any]:
        root = Path(root)
        jsonl_files = []
        for sub in ["persons", "parties", "elections", "jurisdictions"]:
            jsonl_files.extend(list((root / sub).glob("*.jsonl")))
        return self.ingest_jsonl_files(jsonl_files)


if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Ingest Indonesian politics KB into Qdrant")
    parser.add_argument("--kb-root", type=str, required=False,
                        default=str(Path(__file__).parent.parent / "kb" / "politics" / "id"))
    parser.add_argument("--chroma", type=str, required=False, default="/tmp/chroma_db")
    args = parser.parse_args()

    svc = PoliticsIngestionService(persist_directory=args.chroma)
    result = svc.ingest_dir(Path(args.kb_root))
    print(result)
