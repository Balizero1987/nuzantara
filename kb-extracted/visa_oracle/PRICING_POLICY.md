# Pricing Policy — Visa Oracle

Effective: 2025-10-02

## Rule

- KBLI and general licensing/code guides: do NOT display Bali Zero service prices.
- Visa content (Visa Types and Visa case examples): MAY display Bali Zero service prices, sourced from `pricing/2025.json`, clearly separated from government fees.
- If not Visa content, provide service prices only when the client asks. Government fees may be referenced in regulatory context, separated from service prices.

## How to Apply

- For each visa type:
  - Resolve `bali_zero_pricing_ref` from `visa_types/*.json` to locate the correct item in `pricing/2025.json`.
  - Always include the most relevant price keys (e.g., `offshore`, `onshore`, `extension`, or year variants) in IDR.
  - If a visa type is not listed in `pricing/2025.json` (e.g., Second Home E33), mark as `custom_quote` and add the Bali Zero quoted price when available.

- For Visa narratives/case studies:
  - Use `pricing/2025.json` to show Bali Zero service price(s) in IDR, separately from government fees (MERP, application fee, DKP‑TKA, etc.).
  - For items not listed (e.g., Second Home E33), mark as custom quote and provide price when available.

## Examples

- E33G/E23/E28A/E33:
  - Visa Types and case examples: show Bali Zero service price(s) from `pricing/2025.json` and list government fees separately.
  - If missing in price list: flag as `custom_quote`.

## Disclaimers

- Bali Zero prices are public list prices (2025) and may be updated; show `Last Updated` from `pricing/2025.json` index where available.
- Government fees are separate and subject to change by authorities; always confirm effective dates.
