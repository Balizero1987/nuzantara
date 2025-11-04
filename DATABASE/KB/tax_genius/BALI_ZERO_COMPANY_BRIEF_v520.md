# Bali Zero – Company Brief (v5.2.0)

## Profilo Aziendale
- Missione: servizi professionali per visti (C1/C2/C7/C22), permessi di soggiorno (KITAS/KITAP), setup societario (PT PMA) e fiscalità in Indonesia.
- Struttura: C‑Level, Setup Team, Tax, Marketing, Operations, Advisory, Bridge/Tech (23 persone, copertura multilingue).
- Piattaforma: ZANTARA v5.2.0 su Google Cloud Run; integrazioni Google Workspace complete; AI multi‑provider con fallback.

## Contatti Ufficiali
- Email: info@balizero.com
- WhatsApp: +62 813 3805 1876
- Sede: Canggu, Bali, Indonesia
- Orari: Lun–Ven 9:00–18:00; Sab 10:00–14:00
- Sito: https://ayo.balizero.com

## Team (Sintesi)
- C‑Level: Zainal Abidin (CEO), Ruslana (Board)
- Setup: Amanda, Anton, Krisna, Dea (Lead Exec), Adit (Lead Supervisor), Vino (Lead Junior), Ari & Surya (Lead Specialists), Damar (Junior Consultant)
- Tax: Veronika (Manager), Angel (Expert), Kadek, Dewa Ayu (Consultants), Faisha (Care)
- Marketing: Sahira (Specialist), Nina (Advisory)
- Operations: Rina (Reception)
- Advisory: Marta, Olena
- Bridge/Tech: Zero

## Servizi & Prezzi (Estratto 2025)
- Visti singola entrata: C1 Turismo (2.3M IDR), C2 Business (3.6M), C7 Professional (5.0M), C7 A&B (4.5M), C22A/B Internship (4.8–5.8M)
- Visti multi‑entrata: D1 (5.0–7.0M), D2 (6.0–8.0M), D12 (7.5–10.0M)
- KITAS: Freelance E23 (26–28M), Working E23 (34.5–36M), Investor E28A (17–19M), Retirement E33F (14–16M), Remote E33G (12.5–14M), Spouse/Dependent (11–15M)
- KITAP: su preventivo (Investor/Working/Family/Retirement)
- Business & Legal: PT PMA (da 20M), Revisioni (da 7M), Alcol (da 15M), Real Estate/PBG/SLF (su preventivo)
- Taxation: NPWP/NPWPD, report mensili/annuali, BPJS, LKPM

## Processi Chiave
1) Intake & Qualifica → 2) Preventivo & Calendario → 3) Checklist Documentale → 4) Esecuzione → 5) Chiusura & Feedback.
- Supporto strumenti: Drive/Docs/Sheets/Slides/Calendar/Gmail/Contacts.
- KPI: tempi di risposta (SLA), accuratezza documenti, soddisfazione cliente.

## Piattaforma ZANTARA v5.2.0
- Servizio: https://zantara-v520-production-1064094238013.europe-west1.run.app
- Auth: header `x-api-key` (interno/esterno). OpenAPI: `/openapi.yaml`.
- Integrazioni Workspace verificate (Drive, Docs, Sheets, Slides, Calendar, Gmail, Contacts, Maps).
- AI: `ai.chat` con fallback OpenAI → Claude → Groq → Gemini → Cohere; handler dedicati disponibili.
- Endpoint business/sistema: `contact.info`, `lead.save`, `pricing.official`, `price.lookup`, `identity.resolve`, `team.*`, `oracle.*`, `memory.*`, `dashboard.*`.
- Storage: Firestore (memory); Shared Drive operativo.

## Safety & Compliance
- Dati e permessi minimi necessari su Drive condiviso.
- 2FA e gestione segreti centralizzata; nessun dato sensibile su canali non autorizzati.
- Policy riservatezza, KYC/AML di base, consenso trattamento dati.

## Onboarding Nuovi Collaboratori (Sintesi operativa)
- Accessi: email, Calendar (Team), Drive condiviso, rubrica team/partner, canali interni.
- Formazione 1ª settimana: servizi/pricing, flusso lead→cliente, strumenti Workspace, qualità/compliance, customer care.
- Obiettivi 30/60/90: autonomia progressiva su preventivi standard, gestione mini‑portafoglio, contributo a template/processi.

## Materiali Collegati
- BALI_ZERO_COMPLETE_TEAM_SERVICES.md (team completo, pricing, contatti)
- AI_START_HERE.md, HANDOVER_LOG.md, TEST_SUITE.md (operatività tecnica)

---
Suggerimento: esportare questo documento in PDF per uso presentazione.
