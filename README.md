🔸 Overview

Nuzantara è l'infrastruttura operativa che alimenta ZANTARA, il sistema di intelligenza legale e gestionale di Bali Zero.
Gestisce i flussi AI interni (immigrazione, licenze, tax, property, automazione) attraverso un'architettura modulare che integra:

Layer    Descrizione    Tecnologie
Frontend    Interfaccia chat e strumenti operativi    React + Tailwind + SSE
Backend    API gateway e orchestratore AI    Node + TypeScript
Vector Layer    Retrieval e RAG    ChromaDB (official) / Qdrant (standby)
Model Layer    Reasoning + dialogo    Haiku (frontend) + Flan-T5 Base (locale, non ancora operativo)
Data & Docs    Golden Answers, diari, knowledge base    JSONL + Markdown guardrails

⚙️ Nota: Flan-T5 è installato ma non ancora collegato all'orchestratore.
Al momento, l'orchestratore gestisce le risposte autonomamente tramite Haiku.

🔹 Setup rapido

git clone https://github.com/Balizero1987/nuzantara.git
cd nuzantara
cp .env.example .env
docker compose -f docker-compose.chroma.yml up -d
bash ./doctor.sh

🔹 Workflow sintetico

Branch principali:

main      → stabile (protetto)
develop   → integrazione e test
feat/*    → nuove funzionalità
fix/*     → correzioni rapide
docs/*    → documentazione
ops/*     → CI / DevOps

Esempio:

git checkout develop
git pull
git checkout -b feat/<nome>
git add .
git commit -m "feat(ai): connect flan stub"
git push origin feat/<nome>

🔹 Regole essenziali
• Nessun .md fuori da docs/ e DIARIES/.
• Lingue: ID → EN → IT.
• Ogni PR passa doctor.sh e CI.
• Nessun segreto nel repo.
• main è protetto.