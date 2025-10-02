# KB Agents — Working Guidelines

Scope: applies to the entire `Desktop/KB agenti` tree (KBLI + Visa oracle).

Policy: Pricing Separation (Bali Zero)
- Do NOT include Bali Zero service prices inside normative KB documents (KBLI, sector guides, regulatory write‑ups).
- Show prices only on explicit user request, sourcing from `Visa oracle/pricing/normalized.json`.
- For examples/simulations under `Visa oracle/examples`, include only a reference (`balizero_price_ref`) to the pricing overlay; do not inline numeric prices by default.

Defaults
- hide_prices_by_default: true

Notes
- Regulatory docs may mention that pricing is provided separately via the Bali Zero price list.
- Keep regulatory content independent from commercial pricing to avoid drift and simplify updates.
