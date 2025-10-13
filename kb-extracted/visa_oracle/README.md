# Bali Zero Pricing Integration

This folder contains normalized Bali Zero 2025 prices and the example overlay used to always show prices in simulations.

Files
- `normalized.json` – Canonical price list (IDR) extracted from `BalizeroPricelist2025.txt`.
- `../examples/_price_overlay.json` – Map from example `visa_code` to relevant Bali Zero price entries, with numbers embedded for quick use.

Usage
- In every example JSONL, the field `balizero_price_ref` points to a key in `_price_overlay.json`.
- Clients should render the matching prices (offshore/onshore/extension or public price) directly from the overlay.

Notes
- Business visit examples use `C2_BUSINESS` pricing for historical alias `C1_BUSINESS` (see regulatory renaming); keep aliasing until the internal codes are fully aligned.
- Some visas (Second Home E33, Golden Visa, Student KITAS) are not listed in the 2025 pricelist; for these entries the overlay marks `contact for quote`.
- All amounts are in IDR; convert to other currencies at display time if needed.


# Visa Oracle Examples

Esempi strutturati per tutti i principali visti coperti dalla KB Indonesia.

Contenuti:
- `schema.json` – struttura dei campi per input scenario ed esito atteso
- `*.examples.jsonl` – dataset con molti casi, uno per riga (JSON Lines)
- `_price_overlay.json` – mappatura prezzi Bali Zero per ogni `visa_code`

Come usare:
- Parsing semplice (JSONL): ogni riga è un esempio indipendente
- Campi principali:
  - `visa_code` – codice canonico del visto (es. `KITAS_WORK`, `E33_SECOND_HOME`, `C1_BUSINESS`)
  - `scenario` – dati utente/contesto (età, budget, sponsor, durata, ecc.)
  - `expected` – raccomandazione attesa, idoneità, motivazioni, requisiti chiave
  - `citations` – riferimenti ai file KB da cui derivano le regole

Note:
- Costi sono stime indicative derivate dalla KB (possono variare per nazionalità/uffici).
- Gli esempi includono sia casi idonei sia non idonei (con suggerimenti/warning).
- Tutte le simulazioni devono riportare anche i prezzi Bali Zero: usa `balizero_price_ref` nel singolo esempio e risolvi tramite `_price_overlay.json`.
