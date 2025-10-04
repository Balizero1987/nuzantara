# ADR-001 — Runtime Endpoints & Deployment Matrix (2025-09-24)

## Decision
Manteniamo una matrice ufficiale degli endpoint Cloud Run di Zantara Bridge. Questa ADR è la fonte di verità per URL, regioni e versioni distribuite.

## Stato attuale
| Environment   | Region          | URL                                                                 | Version | Note |
|---------------|-----------------|----------------------------------------------------------------------|---------|------|
| Primary       | europe-west1    | https://zantara-bridge-v2-prod-1064094238013.europe-west1.run.app   | v5.2.0  | Deploy 2025-09-24 (rev `zantara-bridge-v2-prod-00027-xwr`) |
| Stable        | asia-southeast2 | https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app | v4.0.0  | LTS/stabile |
| ChatGPT Patch | europe-west1    | https://zantara-v520-chatgpt-patch-himaadsxua-ew.a.run.app (alias https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app) | v5.2.0  | Feature branch azioni GPT |
| Local Dev     | localhost       | http://localhost:8080                                                | dev     | `npm run dev` / `npm start` |

## Conseguenze
- Ogni deploy deve aggiornare questa ADR con revision/URL correnti.
- Runbook e strumenti di monitoraggio devono usare gli URL elencati.
- Le pipeline GitOps e CI prendono `Primary` come target di default.

## Storico
- 2025-09-24 — creazione ADR aggiornata dopo il deploy Cloud Run v5.2.0.
