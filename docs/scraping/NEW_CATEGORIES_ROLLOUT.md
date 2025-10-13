# New Intel Categories — Rollout Plan (Tabula Rasa)

This plan introduces 7 new categories and deprecates the previous set.

## 1) Scope
- Replace  with 7 categories:
  - health_insurance, alerts_safety, transport_connectivity,
    cost_of_living, labor_hr, banking_payments, local_regulation
- Each category includes  hints (date_required, min_word_count, min_top_tier_ratio, separate_social_stream).

## 2) Tasks
- Update parsers to enforce Stage 2 JSON rules:
  - Require: , , , , , Mer  8 Ott 2025 12:01:24 WITA (ISO-8601),  ≥ min
  - Forbid long-form  at Stage 2 (move to Editorial Stage 3)
- Add date enrichment fallback (OG/RSS/body regex) if Mer  8 Ott 2025 12:01:24 WITA missing
- Implement category guardrails (deny/allow keywords) per category
- Tier balancing: backfill from official feeds if top-tier ratio below target
- Dedup: canonical URL or (domain + normalized title) hash
- Social: separate stream (author/handle/post_time/link/media)

## 3) Milestones (2 Weeks)
- D1–D2: Schema + validators (CI step)
- D3–D4: Date enrichment + min_word_count enforcement
- D5: Guardrails per category (deny/allow keyword lists)
- D6–D7: Tier balancing + backfill
- D8: Dedup + canonicalization
- D9: Social separation + dashboards update
- D10: QA on 4 categories (before/after metrics)
- D11–D12: Extend to all categories + runbooks
- D13–D14: Monitor + tune thresholds

## 4) Acceptance Criteria
- ≥90% items with Mer  8 Ott 2025 12:01:24 WITA; median publication lag ≤ 24h
- Min word_count ≥ 200 for ≥90% (category-specific overrides ok)
- Top-tier (T0/1) ratio meets category targets (see )
- JSON validation passes in CI for ≥95% of items
- Misclassification <2%; Duplicates <1% per 100 items
- Social posts excluded from article pipeline, available in dedicated stream

## 5) Operational Notes
- Start with alerts_safety + transport_connectivity (near-real-time updates)
- Weekly review for cost_of_living and labor_hr
- Local_regulation requires JDIH scraping discipline: store  and 

## 6) File Pointers
- Config: 
- Pipeline docs: , 
