# 11. Accessibility (a11y)

## Objective
Achieve WCAG 2.2 level AA coverage across every web and app surface. WCAG 2.2 adds new criteria compared to 2.1 and removes 4.1.1 "Parsing".

## 11.1 Non-negotiable Principles
- Prefer semantic HTML over ARIA; "No ARIA is better than bad ARIA". For complex widgets follow the ARIA Authoring Practices (APG).
- Guarantee name, role, and value exposure. Align with Accessible Name & Description Computation (Accname 1.2).
- Target WCAG 2.2 AA (13 guidelines under the POUR principles).

## 11.2 Screen Reader Optimisation
- Landmark and heading structure: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` plus ARIA roles when required.
- Labels and descriptions: every control exposes an accessible name (prefer `<label>` or visible text; use `aria-label`/`aria-labelledby` only when necessary).
- Announce errors: use `role="alert"` or appropriate `aria-live` regions for dynamic form errors without forcing focus changes.
- Optimise for NVDA, JAWS, and VoiceOver pairings (based on the 2024 user survey mix).

## 11.3 Keyboard Navigation
- All interactions operable via keyboard (SC 2.1.1) and never trap focus (SC 2.1.2).
- Logical focus order (SC 2.4.3) and skip links to bypass repeated blocks (SC 2.4.1).
- Visible focus: use `:focus-visible` to supply clear rings for keyboard users without disturbing pointer flows.
- Avoid positive `tabindex`; restrict usage to 0 and -1 to keep DOM order authoritative.
- State indicators must meet contrast guidance (SC 1.4.11).

## 11.4 Recommended ARIA Patterns
Adopt APG implementations for dialogs/modals (`role="dialog"`, `aria-modal="true"`, focus management), tabs, disclosure/accordion, menu/button, combobox, and listbox. Honour the keyboard interaction matrix (arrow keys, Home/End, Escape, Tab).

## 11.5 Colour Contrast
- Text: minimum contrast 4.5:1 (normal) and 3:1 (large >=24 px or >=19 px bold).
- Non-text UI and state indicators: minimum contrast 3:1 against adjacent colours (SC 1.4.11).
- Recommended tooling: WebAIM Contrast Checker and TPGi CCA integrated into design and dev workflows.

## 11.6 Accessibility Automation (CI)
Automated audits prevent regressions but do not replace manual screen reader and keyboard testing.

### Unit/Component: jest-axe
```bash
npm i -D jest jest-axe @testing-library/dom @testing-library/react
```

```ts
// example.spec.ts
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

test('component has no a11y violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### E2E: cypress-axe
```bash
npm i -D cypress cypress-axe axe-core
```

```js
// cypress/e2e/a11y.cy.js
describe('a11y', () => {
  it('home has no violations', () => {
    cy.visit('/')
    cy.injectAxe()
    cy.checkA11y(null, { runOnly: ['wcag2a', 'wcag2aa', 'wcag22aa'] })
  })
})
```

### Crawler: pa11y-ci
```bash
npm i -D pa11y-ci
```

```json
// .pa11yci
{
  "defaults": { "standard": "WCAG2AA", "timeout": 60000, "wait": 1000 },
  "urls": ["http://localhost:3000/", "http://localhost:3000/login"]
}
```

### Lighthouse CI Budget (Accessibility only)
```json
// lighthouserc.json
{
  "ci": {
    "collect": { "url": ["http://localhost:3000"], "numberOfRuns": 2 },
    "assert": { "assertions": { "categories:accessibility": ["error", { "minScore": 0.95 }] } }
  }
}
```

Run audits via Lighthouse CI GitHub Action.

## 11.7 Accessibility Definition of Done
- WCAG 2.2 AA satisfied on critical flows with audit evidence attached.
- jest-axe, cypress-axe, pa11y-ci, and Lighthouse CI all green.
- Manual verification completed: NVDA, JAWS, VoiceOver, and full keyboard journeys on key paths.

# 12. DevOps Advanced

## 12.1 Infrastructure as Code: Terraform vs Pulumi
- Language: Terraform uses HCL; Pulumi offers TypeScript, Go, Python, and C#.
- Licensing and ecosystem: Terraform moved to BSL in 2023; confirm company policy.
- Shared practices: encrypted remote state, reusable modules, policy-as-code, mandatory reviews, and idempotent pipelines.

**Decision aid**
- Developer-heavy teams needing loops, types, and unit tests gravitate to Pulumi.
- Infrastructure-centric teams comfortable with declarative DSL and broad module marketplace go with Terraform.
- Document the decision in the infra README and enforce drift control with policy tooling.

## 12.2 Service Mesh (Istio vs Linkerd)
- Istio: feature rich, ambient mesh (sidecar optional), adopt default-deny authz and migrate mTLS from PERMISSIVE to STRICT.
- Linkerd: simplicity-first with automatic mTLS and lightweight data plane; secure-by-default posture.

Shared mesh practices:
- Universal mTLS, certificate rotation, default-deny policies with explicit allowlists per namespace or service.
- Standard telemetry pipelines (OpenTelemetry) across mesh and workloads.

## 12.3 Observability with OpenTelemetry
- Use the collector as the neutral hub receiving, processing, and exporting via OTLP (Tempo, Jaeger, etc.). Deploy collectors as sidecars, daemonsets, or gateways.
- Follow semantic conventions (HTTP, DB, Resource) to keep queries consistent.
- Sampling: head-based for low volume, tail-based to capture latency and error signals in large systems.
- Correlate logs and traces by propagating `trace_id` and `span_id` into log payloads.

```yaml
# otel-collector.yaml (snippet)
receivers:
  otlp:
    protocols: { http: {}, grpc: {} }
processors:
  batch: {}
  memory_limiter: { check_interval: 1s, limit_percentage: 75 }
  tail_sampling:
    decision_wait: 5s
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
exporters:
  otlphttp/tempo: { endpoint: "http://tempo:4318" }
  loki: { endpoint: "http://loki:3100/loki/api/v1/push" }
  prometheus: {}
service:
  pipelines:
    traces: { receivers: [otlp], processors: [memory_limiter, batch, tail_sampling], exporters: [otlphttp/tempo] }
    logs:   { receivers: [otlp], processors: [memory_limiter, batch], exporters: [loki] }
    metrics:{ receivers: [otlp], processors: [memory_limiter, batch], exporters: [prometheus] }
```

Tail sampling adds complexity; enable it only when necessary.

## 12.4 Feature Flags with LaunchDarkly
- Maintain a permanent kill switch to disable problematic features quickly.
- Use prerequisites to encode dependencies between flags.
- Design experiments (A/B, metrics) around flags from inception.
- Manage debt: archive flags short after retirement (target 90–120 days).

```ts
import { init } from '@launchdarkly/node-server-sdk'

const ld = init(process.env.LD_SDK_KEY!)
await ld.waitForInitialization()
const enabled = await ld.variation('service-kill-switch', { key: 'global' }, false)
if (enabled) throw new Error('Kill switch active – aborting startup')
```

## 12.5 Deployment: Blue-Green vs Canary
- Blue-Green: duplicate environments with atomic traffic switch and instant rollback, ideal for zero-downtime releases.
- Canary: gradual rollout to user cohorts with metric-driven promotion or rollback.

```yaml
# Argo Rollouts (Blue-Green)
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: api }
spec:
  strategy:
    blueGreen:
      activeService: api-svc
      previewService: api-svc-preview
      autoPromotionEnabled: false
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec: { containers: [{ name: api, image: ghcr.io/org/api:v2 }] }
```

```yaml
# Argo Rollouts (Canary 25% -> 50% -> 100%)
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata: { name: web }
spec:
  strategy:
    canary:
      steps:
        - setWeight: 25
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec: { containers: [{ name: web, image: ghcr.io/org/web:1.3.0 }] }
```

## 12.6 GitOps with Argo CD
Key practices:
- Separate configuration repositories from source code repositories.
- Use App-of-Apps or ApplicationSets to bootstrap multi-application or multi-cluster fleets.
- Leverage sync waves and hooks to order resource creation (CRDs, RBAC, workloads).
- Enforce RBAC and SSO (Dex, OIDC, SAML) in shared environments.
- Support declarative tooling such as Kustomize and Helm.
- Build a secure supply chain: sign images (Sigstore/Cosign) and gate entry with admission policies.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: web-prod, namespace: argocd }
spec:
  project: default
  source:
    repoURL: https://github.com/org/infra-config
    path: k8s/web/overlays/prod
    targetRevision: main
  destination: { server: https://kubernetes.default.svc, namespace: web }
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [CreateNamespace=true]
```

## 12.7 Disaster Recovery
- Define RTO and RPO per service and design accordingly.
- Select backup, warm standby, or active/active strategies based on objectives and cost.
- On Kubernetes, use Velero for resource and persistent volume backups; schedule restore drills.
- Run DR tests (tabletop and live when possible) under version-controlled runbooks.

```bash
velero backup create daily-$(date +%F) \
  --include-namespaces web,api \
  --ttl 168h
```

# Appendices

## GitHub Actions: Accessibility and Lighthouse
```yaml
# .github/workflows/a11y.yml
name: a11y-audits
on: [pull_request]
jobs:
  pa11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build && npm run start &
      - run: npx pa11y-ci
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build && npx lhci autorun
```

## GitHub Actions: Argo CD Lint and Policy
```yaml
# .github/workflows/gitops.yml
name: gitops-validate
on: [pull_request]
jobs:
  kustomize-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          kustomize build k8s/overlays/prod > /tmp/out.yaml
          kubectl apply --dry-run=client -f /tmp/out.yaml
```

## Merge Checklist
- WCAG 2.2 AA respected on critical paths with audit diffs attached.
- jest-axe, cypress-axe, pa11y-ci success, and Lighthouse CI accessibility score >=0.95.
- OpenTelemetry instrumentation in place with semantic conventions and central collector.
- Rollout strategy documented (Blue-Green or Canary) via Argo Rollouts.
- GitOps foundations active: separate config repo, sync waves, RBAC/SSO.
- Disaster recovery: RTO/RPO defined, backups scheduled, restore drill executed.
