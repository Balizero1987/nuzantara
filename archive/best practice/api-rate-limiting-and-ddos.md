# API Rate Limiting and DDoS Resilience

## Rate Limiting Strategy
- Align with OWASP API Security Top 10 (2023); mitigate "Unrestricted Resource Consumption" by enforcing limits per endpoint, user, IP, key, response size, and pagination.
- Implement robust algorithms such as token bucket or sliding window; expose clear retry headers and require exponential backoff with jitter from clients.

### Token Bucket Example (TypeScript)
```ts
class TokenBucket {
  private tokens: number
  private last: number

  constructor(public capacity: number, public refillPerSec: number) {
    this.tokens = capacity
    this.last = Date.now()
  }

  allow(): boolean {
    const now = Date.now()
    const delta = (now - this.last) / 1000
    this.tokens = Math.min(this.capacity, this.tokens + delta * this.refillPerSec)
    this.last = now

    if (this.tokens >= 1) {
      this.tokens -= 1
      return true
    }

    return false
  }
}
```

## Edge Protection
- Deploy WAF and rate limiting at the edge (Cloudflare, Azure Front Door, API Gateway) with granular rules for sensitive endpoints such as login, OTP issuance, and webhooks.
- Combine edge policies with application-level checks and circuit breakers to absorb bursts and coordinated attacks.
