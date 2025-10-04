# ZANTARA Bridge Best Practices 2025

Focus areas: 4) Performance and Scalability, 5) Monitoring and Observability.
Principle: measure, simplify, automate. Every choice below must be verifiable via metrics with a fast rollback path.

## 4. Performance and Scalability

### 4.1 Edge Computing (Cloudflare Workers, Vercel Edge)
**Use cases**
- Read-heavy, latency-sensitive workloads such as feature flags, A/B testing, light personalisation, and caching of idempotent APIs.
- State lives off-edge or in constrained storage (KV, Durable Objects, CDN cache). Avoid complex stateful logic at the edge.

**Guidelines**
- Cloudflare Workers: isolate-based runtime with near-zero cold start. Prefer KV for global reads and Durable Objects for coordination, sharded state, or locking. Attach TTL and Alarms for scheduled work.
- Vercel: lean on CDN cache and ISR for pages/APIs. Use the Node runtime for heavy or non web-standard logic, Edge runtime for slim user-proximate code. Watch bundle size limits (roughly 1-4 MB) and missing Node APIs.
- Cache-first: GET plus Cache-Control and ETag, deterministic cache keys, stale-while-revalidate when relevant. Track hit/miss ratios.

**Do**
- Reuse HTTP connections, eliminate N+1 fetches, serialise edge responses safely.
- Warm critical paths by preloading KV/ISR data for top routes.

**Do not**
- Avoid monolithic libraries or blocking IO at the edge.
- Do not persist arbitrary state from edge nodes directly into core databases without coordination.

### 4.2 GraphQL versus REST (API Design 2025)
- REST: best for stable resources, strong HTTP caching, public integrations.
- GraphQL: adopt when clients need different shapes or aggregated data in one round trip.

**GraphQL practices**
- Enable Automatic Persisted Queries (APQ) with GET support to unlock CDN and browser caching.
- Follow the GraphQL over HTTP spec for content types and status codes.
- Use `@cacheControl` directives (maxAge and scope) to compose response headers.
- `@defer` and `@stream` remain draft; verify library support (for example, graphql-js 17).

**REST practices**
- Return ETag and Cache-Control headers on large or frequently fetched payloads to lower bandwidth and TTFB.

### 4.3 gRPC (High-performance RPC)
- Set deadlines on every call and propagate remaining budget down the call chain.
- Restrict retries to idempotent methods and use exponential backoff; configure retries in the service config (client-side).
- Configure HTTP/2 keepalive ping values that balance connectivity and network cost.
- Reuse channels and stubs; never create them per request.

### 4.4 Real-time Delivery (WebSockets versus SSE)
- SSE: server-to-client, one-way, works on HTTP/1.1 and HTTP/2, ideal for telemetry or feed updates.
- WebSocket: full duplex, required for collaborative or bidirectional interactions.
- WebTransport: emerging HTTP/3 option with datagrams and streams; evaluate case by case.

Rule of thumb: if you only need push, pick SSE. For two-way or low-latency RTC behaviour, choose WebSocket. Avoid custom polling.

### 4.5 Kubernetes Patterns
**Deployment checklist**
- Set CPU and memory requests and limits; avoid excessive limit cardinality.
- Define liveness, readiness, and startup probes with conservative thresholds; readiness should cover external dependencies.
- Adopt HPA v2 on CPU, memory, and custom metrics; validate scaling with synthetic load.
- Configure PodDisruptionBudgets to prevent downtime during drains or upgrades.

**Additional patterns**
- Use affinity and anti-affinity to spread across availability zones.
- Tune RollingUpdate with surge 25 percent and maxUnavailable 0-25 percent depending on SLOs.

### 4.6 Microservices with Istio
- Manage traffic declaratively: timeouts, retries, circuit breaking, and outlier detection via DestinationRule and VirtualService.
- Enforce mTLS by default; align with zero-trust policies per namespace and mesh.
- Enable canary and A/B routing by percentage or request headers; keep network config separate from application code.
- Operate safely: run `istioctl analyze`, monitor `pilot_total_xds_rejects`, and apply Istio hardening guides.

### 4.7 Event-driven Architecture (Kafka, RabbitMQ)
**Kafka**
- Use idempotent producers and transactions for exactly-once guarantees per partition in read-process-write flows (respect real-world limitations).
- Pick partition keys using business identifiers; size partitions by throughput and SLA. Monitor consumer lag closely.
- Use log compaction for stateful streams (cache reload, change data capture).

**RabbitMQ**
- Prefer quorum queues and publisher confirms; tune prefetch counts for throughput without exhausting consumer memory.

**Reliability pattern**
- Implement transactional outbox patterns with polling or log tailing for atomic DB-to-bus delivery.

### 4.8 Caching Strategies (Redis Cluster, Hazelcast)
**Redis**
- Run Redis Cluster for scale. Use hash tags (for example `user:{123}:profile`) to colocate multi-key operations within the same slot.
- Choose eviction policies deliberately (allkeys-lru, volatile-*) and align TTLs with business rules; monitor hit/miss rates.
- Configure persistence (RDB, AOF) to match RPO targets; understand fsync and fork impact on latency. Use latency monitor and doctor for diagnostics.

**Hazelcast**
- For JVM-side distributed caches, keep configuration homogeneous, dedicate resources, and apply appropriate eviction policies for workload patterns.

## 5. Monitoring and Observability

### 5.1 OpenTelemetry
- Instrument services with semantic conventions (HTTP, DB, RPC, messaging) to enable reusable dashboards and alerts.
- Deploy the collector as the central pipeline: receive OTLP, process, and export. In Kubernetes, run sidecars, daemonsets, or a gateway deployment.
- Prefer histogram metrics (explicit or exponential buckets) for latency and payload sizes; enable exemplars to link metrics to traces.
- Track the four golden signals (latency, traffic, errors, saturation) and codify SLIs, SLOs, and error budgets.

### 5.2 Distributed Tracing (Jaeger, Zipkin)
- Apply consistent head-based sampling at the ingress service and propagate W3C tracecontext headers.
- Consider remote or adaptive sampling to stay within cost budgets while capturing outliers.
- For production, deploy Jaeger with persistent storage backends (Elasticsearch, Tempo) rather than all-in-one.
- Zipkin remains a lightweight, Grafana-friendly option.

### 5.3 Metrics (Prometheus) and Grafana
- Control cardinality: avoid unbounded labels such as user identifiers or raw request paths.
- Use histograms for percentile analysis server-side; summaries do not aggregate reliably across instances.
- Use federation or remote write for multi-cluster visibility and create recording rules for expensive queries.
- Build dashboards with clear storytelling, consistent naming, and curated variables.

### 5.4 Logs (ELK Stack)
- Emit structured logs following the Elastic Common Schema for straightforward correlation with traces.
- Use Index Lifecycle Management (hot, warm, cold) to balance performance and retention cost.
- For Kubernetes ingestion, prefer Fluent Bit for resource efficiency and drop noisy events early.

### 5.5 APM Alternatives
- Open-source, OpenTelemetry-native stacks:
  - Grafana LGTM (Mimir, Loki, Tempo, Grafana).
  - SigNoz (ClickHouse backend) for tracing and APM.
  - Uptrace for tracing, SLOs, and cost insights.
  - Elastic APM if logs already live in Elastic.

### 5.6 Synthetic Monitoring and Performance Testing
- Run proactive uptime, API, and browser checks from multiple regions; keep definitions as code in the repository.
- Solid options: Grafana Cloud Synthetic Monitoring or Checkly (Playwright-based with CLI and Terraform integration).
- Use k6 for load, stress, or smoke tests; schedule prod-safe smoke tests as synthetic runs.

### 5.7 Error Tracking (Sentry)
- Enable release health and include release version tags; upload sourcemaps securely to the backend only.
- Use dynamic sampling to control ingestion cost while preserving key transactions.
- Scrub PII in the SDK or via Sentry Relay before data leaves your boundary.

### 5.8 SLO, SLI, and Error Budgets
- Define SLIs that mirror user experience (p99 API latency, success rate, end-to-end availability).
- Set quarterly SLOs and document error budget policies (freeze, rollback, throttle) following SRE best practices.

## Operational Defaults

### Prometheus Histogram Defaults
```yaml
# OpenTelemetry SDK example
latency_buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
exemplars_enabled: true
```

### Kubernetes Probes and HPA
```yaml
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 20
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  initialDelaySeconds: 5
  periodSeconds: 5
resources:
  requests: { cpu: "200m", memory: "256Mi" }
  limits:   { cpu: "1", memory: "512Mi" }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
```

### Istio Traffic Policy Example
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
spec:
  trafficPolicy:
    connectionPool:
      http: { http1MaxPendingRequests: 100, maxRequestsPerConnection: 100 }
    outlierDetection: { consecutive5xxErrors: 5, interval: 5s, baseEjectionTime: 30s }
---
kind: VirtualService
spec:
  http:
    - route: [{ destination: { host: my-svc, subset: v1 } }]
      retries: { attempts: 2, perTryTimeout: 800ms, retryOn: 5xx, retriable-status-codes }
      timeout: 2s
```

### GraphQL APQ Request Hint
```
GET /graphql?extensions={"persistedQuery":{"version":1,"sha256Hash":"<hash>"}}&variables=...
```

### Redis Defaults
```
maxmemory-policy allkeys-lru
# Multi-key operations: user:{123}:profile (hash tag between braces)
```

## Antipatterns to Avoid
- Edge workers writing directly to arbitrary backends without coordination.
- gRPC services without deadlines or retry policies.
- Prometheus metrics with exploding cardinality (user IDs, raw paths, timestamps in labels).
- Jaeger all-in-one deployments in production (no persistence, limited scale).
- RabbitMQ consumers with infinite prefetch causing memory exhaustion and unfair scheduling.

## Zantara Bridge Integration Notes
- Instrument every microservice with OpenTelemetry SDKs and propagate W3C tracecontext. Run a collector gateway exporting to Grafana LGTM or SigNoz depending on environment.
- Schedule k6 smoke tests and global synthetic checks (Grafana Synthetics or Checkly) as code in the repository.
- Use Cloudflare Workers for lightweight features with KV or Durable Objects. On Vercel, run heavy APIs on Node runtime and reserve Edge runtime for fast personalisation and CDN caching.

## References
- Cloudflare Workers (isolates, KV, Durable Objects), Vercel Edge/ISR.
- GraphQL APQ, GraphQL over HTTP, cache control extensions.
- gRPC deadlines, keepalive, retry configuration.
- SSE, WebSocket, WebTransport specifications.
- Kubernetes best practices: PDB, HPA, probes, resource requests.
- Istio traffic management, mTLS, and hardening guides.
- Kafka exactly-once semantics, partitioning, log compaction; RabbitMQ quorum queues and prefetch tuning.
- Redis Cluster operations, eviction policies, persistence, latency tooling.
- OpenTelemetry semantic conventions, metrics, exemplars.
- SRE golden signals, SLO and error budget playbooks.
- Tracing backends (Jaeger sampling, Zipkin with Grafana).
- Prometheus best practices (histogram usage, federation).
- Elastic logging stack: ECS, ILM, Fluent Bit ingestion.
- Synthetic monitoring: Grafana Synthetics, Checkly, k6.
- Sentry release health, dynamic sampling, PII scrubbing.

## Maintenance Note
Keep this document current. Any pull request that changes performance or observability architecture must update the relevant sections. If nothing changes, re-evaluate whether the PR truly affects architecture.
