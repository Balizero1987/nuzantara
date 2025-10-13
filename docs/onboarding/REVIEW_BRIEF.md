# Onboarding Review Brief

Obiettivo: raccogliere un feedback strutturato e azionabile sui 6 documenti di onboarding per portarli rapidamente a una versione pronta per nuovi ingressi.

Ambito documenti da rivedere:
- `docs/onboarding/INDEX.md`
- `docs/onboarding/ORIENTATION_ONE_PAGER.md`
- `docs/onboarding/NEW_JOINER_REPORT.md`
- `docs/onboarding/CAPABILITY_MAP_DIGEST.md`
- `docs/onboarding/FIRST_90_MINUTES.md`
- `docs/onboarding/WEEKLY_DELTA_NEXT.md`

Istruzioni per i reviewer (AI)
- Leggere `INDEX.md` per la mappa generale, poi i singoli file.
- Proporre modifiche concrete e localizzate, evitando testo generico non azionabile.
- Usare il Template di Output unico qui sotto (un solo file di review con 6 sezioni).
- Applicare la Rubrica di valutazione per i punteggi e le priorità (P0/P1/P2).
- Indicare sempre dove inserire ogni proposta: path:line, con razionale e impatto.

Vincoli
- Niente cambiamenti stilistici non motivati da chiarezza/efficacia.
- Evitare duplicazioni tra documenti; proporre cross‑link quando utile.
- Segnalare rischi di sicurezza/compliance e suggerire mitigazioni.
- Preferire checklists, esempi e snippet concreti rispetto a descrizioni astratte.

Template di Output (REVIEW)
1) Sommario complessivo (3–5 frasi)
   - Contesto e qualità generale dell’onboarding.
   - 3 priorità P0 da indirizzare subito.

2) Sezioni per ciascun file (ripetere per tutti i 6)
   - File: <path>
   - Punti di forza (3–5)
   - Lacune/gap (3–7)
   - Proposte di modifica
     - `path:line -> proposta` (razionale, impatto)
     - Esempio: `docs/onboarding/FIRST_90_MINUTES.md:12 -> Aggiungere checklist accessi GitHub (riduce time-to-first-commit)`
   - Domande aperte
   - Rischi/Implicazioni
   - Priorità: P0/P1/P2; Impatto/Effort: alto/medio/basso
   - Punteggi (1–5): Completezza, Chiarezza, Azionabilità, Consistenza, Misurabilità, Sicurezza, Manutenibilità

3) Piano d’azione finale
   - Lista P0→P2 con stima effort e owner suggerito.

Rubrica di Valutazione (1–5)
- Completezza: copre obiettivi, contesto, casi principali.
- Chiarezza/Navigazione: titoli, struttura, link coerenti e scorrevoli.
- Azionabilità: next‑step chiari, checklists, deliverable verificabili.
- Consistenza terminologica: ruoli, acronimi, glossario, naming.
- Misurabilità: KPI, definition of done, metriche e check di avanzamento.
- Sicurezza/Compliance: accessi minimi, PII, audit trail, policy.
- Manutenibilità: owner, versioni, change log, cadence di aggiornamento.

Focus per documento
- `INDEX.md`: scopi, mappa navigazione, dipendenze, owner, come contribuire.
- `ORIENTATION_ONE_PAGER.md`: mission/vision, mappa team/sistemi, accessi Day 0/Day 1, canali, lessico minimo.
- `NEW_JOINER_REPORT.md`: profilo, obiettivi 30/60/90, milestone, friction log, risk flags, learning plan.
- `CAPABILITY_MAP_DIGEST.md`: competenze chiave e livelli, mapping a ruoli/prodotti, gap e priorità formative.
- `FIRST_90_MINUTES.md`: checklist tecnica (account, repo, env, credenziali), social/HR, mini‑deliverable, tempi stimati.
- `WEEKLY_DELTA_NEXT.md`: rituale delta/next, metriche onboarding, blocchi e piani di sblocco, escalation.

Consegna
- File unico: `REVIEW_YYYYMMDD_<MODEL>.md` (800–1200 parole).
- Inserire alla fine: `Confidence: bassa | media | alta`.
- SLA: prima passata R1 entro 24–48h; poi R2 e sign‑off.

Note pratiche
- Usare riferimenti a linee reali: sezione iniziale di ogni file espone titoli; se mancano numeri di linea, indicare il primo heading di riferimento.
- Preferire esempi minimi funzionanti e checklists rispetto a prosa lunga.
- Se emergono duplicazioni, proporre refactor: spostare in `INDEX.md` o creare appendici.

Owner e contatti
- Owner iniziale: Onboarding Docs Maintainer (passare a team People Ops post sign‑off).
- Canale suggerito: `#onboarding-docs` (o equivalente) per Q&A e triage.

