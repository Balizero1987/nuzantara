# First 90 Minutes (F90)

00–15'
- Read O1 + PROJECT_CONTEXT
- Health checks:
  - TS: GET https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health
  - RAG: GET https://zantara-rag-backend-himaadsxua-ew.a.run.app/health
- Handler list: POST /call {"key":"system.handlers.list"}

15–30'
- Run 5 handlers (curl + browser)
  - team.list, pricing.official, bali.zero.pricing, memory.save, memory.retrieve
- Verify: p95 latency < 3.5s (curl -w "%{time_total}\\n")

Latency sampling (optional, 20 samples for p95)
```bash
URL="https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call"
HDR=(-H 'Content-Type: application/json' -H "x-api-key: $KEY")
BODY='{"key":"team.list"}'
for i in $(seq 1 20); do 
  curl -s -o /dev/null -w "%{time_total}\n" "${URL}" "${HDR[@]}" -d "$BODY"; 
  sleep 0.15; 
done | sort -n | awk '{a[NR]=$1} END{p=int(NR*0.95); if(p<1)p=1; print "p95:",a[p],"s", "(N=",NR,")"}'
```

30–50'
- RAG chat with citations
  - POST /bali-zero/chat {"query":"What are Bali Zero services?"}
  - Verify: reranker active, tool_calls present, at least 1 handler executed

50–70'
- Memory save/retrieve for test userId
  - userId: "onboarding_test_<your_name>"
  - Save: "User prefers async communication"
  - Retrieve: verify content matches

70–90'
- Mini report
  - What worked: list successful handlers
  - p95 latency: measured values
  - Errors seen: any 4xx/5xx responses
  - Propose next 3 tasks: based on interest (AI, Business, Infra)

Acceptance Criteria
- p95 chat < 3.5s
- Tool success > 97%
- No mock usage (all real production data)
- ≥ 1 RAG query with tool execution
 - Respect rate limits (avoid flooding; use sleep/backoff)

Security & PII
- Use test userIds prefixed with `onboarding_` and avoid real PII.
