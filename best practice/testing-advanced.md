# Advanced Testing Playbook (Zantara Bridge)

Goal: raise reliability and release speed without over-engineering.

## 1. Contract Testing with Pact
- Use consumer-driven contracts with a Pact Broker in CI.
- Focus on the client making the request/response, not UI or business logic.
- Reuse provider states with deterministic data; keep expectations flexible (e.g., `like()` matchers).
- CI workflow: consumer publishes pact -> provider build fails if verification fails; manage governance via tags and versions in the broker.
- References: Pact documentation (five-minute guide, FAQ).

## 2. Mutation Testing
- Measure test effectiveness beyond coverage.
- Tooling: PIT (Java), Stryker (JS/TS), Stryker.NET for .NET.
- Run on diffs in CI and schedule full nightly runs; enforce mutation score thresholds per module.
- Handle equivalent mutants with targeted ignore lists; perfection is not required.

## 3. Property-Based Testing
- Uncover edge cases by asserting invariants.
- Libraries: Hypothesis (Python), fast-check (JS/TS with Jest/Vitest).
- Start from domain invariants (idempotence, ordering, conservation); enable shrinking and reproducible seeds; mix example-based tests with PBT in the same suite.

## 4. Chaos Engineering
- Hypothesis-driven experiments with minimal blast radius plus automatic stop conditions.
- Follow the Principles of Chaos Engineering (hypothesis -> experiment -> observe -> conclude).
- On AWS: configure CloudWatch alarms as stop conditions in AWS FIS to terminate experiments automatically.
- Schedule game days and blameless post-mortems; begin with basic failures (instance kills, dependency latency).

## 5. A/B Testing Infrastructure
- Deterministic assignment via stable hashing (e.g., hash(userId + experimentKey)). Avoid naive modulo operations; use robust hash functions.
- Log exposure when experiments are checked to minimise SRM.
- Automate SRM detection and alerts; halt analysis on mismatch.
- Control peeking: use fixed horizons or sequential tests (Stats Engine) with pre-agreed error control.
- References: Ron Kohavi et al., Evan Miller (peeking discussion).

## 6. Synthetic Monitoring
- Cover critical user journeys with multistep API/browser tests and smart retries.
- Run from multiple regions; integrate into CI/CD for post-deploy smoke tests with automated rollback triggers.
- Align alerts with the four golden signals (latency, traffic, errors, saturation).

## 7. Visual Regression Testing
- Maintain trustworthy baselines (Storybook) and visual diffs on pull requests; configure ignore regions and thresholds for dynamic content.
- Run across relevant viewports/browsers; adopt incremental optimisation (e.g., TurboSnap) for CI performance.

## 8. CI Checklist
- Stage order: unit -> contract (Pact) -> mutation (diff-only) -> property-based smoke -> build -> deploy -> synthetic (pre/post) -> visual checks.
- Quality gates: mutation score per module, SRM sentinel on experiments, synthetic SLOs on critical paths.

---

Review this playbook quarterly, especially WhatsApp pricing and On-Prem EOL references.
