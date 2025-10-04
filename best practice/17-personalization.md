# 17. Personalization Best Practices (Zantara Bridge)

Goal: deliver recommendation, segmentation, tracking, and experimentation systems that are production-ready, measurable, privacy-first, and resilient.

## 1. Recommendation Engines
- **Architecture pattern**: candidate generation -> scoring/ranking -> reranking with business rules. Maintain shared feature stores (offline and online) and align offline/online metrics. (Netflix, Microsoft recommender patterns.)
- **Cold-start**: hybrid fallbacks (popularity, item2vec, content) plus progressive profiling with consent. (Microsoft Recommenders examples.)
- **Evaluation**: run offline metrics (NDCG, MRR, Recall@K) for regression checks, but make final decisions via controlled experiments (CTR, conversion, revenue, retention).
- **Do**: version datasets, features, and models; log exposure and serving decisions for audit; enforce latency/error guardrails on live ranking.
- **Do not**: merge multiple models without consolidation and rollback plans (Netflix lessons on unified model stacks).

## 2. User Segmentation
- Start from a clear entity model (user, session, organisation, device). Derive segments from events/attributes with TTL policies to avoid immortal segments. (Snowplow guidance.)
- Maintain explainability: each segment has readable SQL definition, owner, and lineage.
- Embed privacy by design: minimise data, set sensible defaults, apply segment-level access controls (GDPR Article 25, EDPB guidance).

## 3. Behavioural Tracking
- **Tracking plan**: document every event before coding. Include event name, purpose, properties, types, owner, platforms, payload examples, and QA steps (Segment, Snowplow templates).
- **Naming**: use `snake_case`, avoid spaces and reserved prefixes (GA4 rules).

```json
{
  "event": "product_view",
  "description": "User views a product detail page",
  "properties": {
    "product_id": "string",
    "category": "string",
    "price": "number",
    "currency": "string"
  },
  "context": ["user", "session", "device"],
  "owner": "growth-data@company.com",
  "platforms": ["web", "ios", "android"]
}
```

- **Pipeline**: validate schemas on ingestion and route failures to a dead-letter queue (Snowplow recommendation).
- **Consent**: implement granular consent; exemptions allowed only when local rules permit (for example CNIL guidance). Apply privacy-by-default (GDPR Article 25): minimise properties, limit retention, enforce need-to-know access.

## 4. A/B Testing Frameworks
- **Guardrails**: automate sample ratio mismatch (SRM) checks with alerts and auto-stop. (Microsoft diagnostics.) Include guardrail metrics (crash rate, latency, churn, revenue). (Airbnb patterns.)
- **Sensitivity**: use CUPED/post-stratification for variance reduction (Microsoft, Booking, Airbnb). Avoid uncontrolled peeking; when necessary use pre-defined sequential tests.
- **Checklist**: stable randomisation key (user_id), logged exposure, primary metric with guardrails, SRM enabled, CUPED enabled, minimum duration (>= one business cycle), cluster analysis when spillover risk exists.

## 5. Dynamic Content
- Choose bandits for adaptive allocation when time-to-learn matters or traffic is scarce; use classic A/B for causal learnings. (Amplitude, VW references.)
- For contextual bandits, log propensities, run offline replay, and support off-policy evaluation (Vowpal Wabbit/SageMaker patterns).

## 6. Preference Learning
- Combine implicit feedback (click, dwell, add-to-cart) with explicit feedback (rating, like).
- Refresh embeddings/feature store on schedule; warm-start new items.
- Monitor fairness and drift; provide understandable explanations (feature contributions, aggregated SHAP) to stakeholders.

## Repository Snippets

```yaml
# ab-test-guardrails.yaml
experiment_defaults:
  srm_check: chi_square
  variance_reduction: cuped
  min_duration_days: 14
  guardrails:
    - name: "p95_latency_ms"
      direction: "lower_is_better"
      threshold: "+5%"
    - name: "crash_free_sessions"
      direction: "higher_is_better"
      threshold: "-0.2%"
```

```ts
track('product_view', { product_id, category, price, currency }, { consent: 'analytics' })
```

## References
- Microsoft Recommenders documentation.
- Netflix personalization engineering notes.
- Guardrails design (Airbnb) and industry case studies.
- SRM, CUPED best practices (Microsoft, Booking.com, Airbnb).
- Tracking plan guidance (Segment, Snowplow, GA4 naming).
- Privacy-by-design (GDPR, EDPB, ICO).
