# SSE Streaming Deployment Guide

## Overview

This document describes the Server-Sent Events (SSE) streaming implementation for `/api/v2/bali-zero/chat-stream` with complete backward compatibility, security, and zero-downtime deployment strategy.

## Architecture

### Components

1. **Streaming Service** (`src/services/streaming-service.ts`)
   - Proxies SSE streams from Python RAG backend
   - Connection management (heartbeat, cleanup, reconnect)
   - Back-pressure handling
   - Performance metrics tracking

2. **SSE Routes** (`src/routes/api/v2/bali-zero.routes.ts`)
   - GET/POST `/api/v2/bali-zero/chat-stream`
   - Feature flag protected (`ENABLE_SSE_STREAMING`)
   - Rate limiting (20 req/min per user/IP)
   - Audit trail integration

3. **Frontend Client** (`apps/webapp/assets-library/js/bali-zero-stream-client.js`)
   - EventSource API integration
   - Auto-reconnect with exponential backoff
   - Heartbeat monitoring
   - Performance metrics

4. **Audit Service** (`src/services/audit-service.ts`)
   - GDPR-compliant audit trail
   - Security event logging
   - Rate limit violation tracking
   - Data retention (90 days)

## Backward Compatibility

✅ **100% Backward Compatible**

- Existing `/api/v2/bali-zero/chat` endpoint remains unchanged
- SSE endpoint is additive only (new feature)
- Feature flag ensures zero impact when disabled
- No breaking changes to existing API contracts

## Security Features

### 1. Rate Limiting
- **Limit**: 20 requests per minute per user/IP
- **Implementation**: `baliZeroChatLimiter` middleware
- **Violation Handling**: Audit log + 429 response with retry-after

### 2. Authentication
- Supports existing JWT authentication
- Optional authentication (graceful degradation)
- User identification via `x-user-id` header or `user` object

### 3. GDPR Compliance
- **Query Hashing**: Queries are hashed (SHA-256) before storage
- **PII Minimization**: Only authenticated operations store email
- **IP Logging**: Only for security/auth operations
- **Data Retention**: 90 days automatic cleanup

### 4. Audit Trail
- All stream operations logged
- Rate limit violations tracked
- Authentication events recorded
- Tamper-proof timestamps

## Feature Flag System

### Enable SSE Streaming

```bash
# Environment variable
export ENABLE_SSE_STREAMING=true

# Or in .env file
ENABLE_SSE_STREAMING=true
```

### Default State
- **Disabled by default** (`ENABLE_SSE_STREAMING=false`)
- Zero impact on existing system
- Safe to deploy without enabling

## Performance Targets

- **First Token Latency**: <100ms
- **Inter-Token Latency**: <50ms
- **Connection Management**: 30s heartbeat interval
- **Reconnection**: Exponential backoff (1s → 30s max)

## Deployment Strategy

### Phase 1: Staging Testing (Current)
1. ✅ Code deployed with feature flag OFF
2. ⏳ Enable flag in staging: `ENABLE_SSE_STREAMING=true`
3. ⏳ Run comprehensive tests:
   - Unit tests
   - Integration tests
   - Load tests
   - Performance benchmarks

### Phase 2: Gradual Rollout
1. Enable for internal testing (5% traffic)
2. Monitor metrics:
   - First token latency
   - Error rates
   - Rate limit violations
   - Connection stability
3. Increase to 25%, 50%, 100%

### Phase 3: Production Validation
1. Verify performance targets met
2. Validate security audit logs
3. Confirm backward compatibility
4. Monitor for 48 hours

## Testing

### Unit Tests
```bash
cd apps/backend-ts
npm test -- streaming-service.test.ts
npm test -- audit-service.test.ts
```

### Integration Tests
```bash
npm test -- chat-stream.integration.test.ts
```

### Load Tests
```bash
# Using k6 or artillery
k6 run load-tests/chat-stream-load.js
```

### Performance Benchmarks
```bash
npm run benchmark:streaming
```

## Monitoring

### Key Metrics
- First token latency (p50, p95, p99)
- Inter-token latency
- Connection success rate
- Reconnection frequency
- Rate limit violations
- Error rates by type

### Logs
- Audit trail: Winston → Loki
- Connection metrics: In-memory stats API
- Error tracking: Error monitoring service

## Rollback Plan

### Quick Disable
```bash
# Set environment variable
export ENABLE_SSE_STREAMING=false

# Restart service (no code changes needed)
```

### Complete Rollback
1. Disable feature flag
2. Remove routes (if needed)
3. Verify `/api/v2/bali-zero/chat` still works

## API Documentation

### GET /api/v2/bali-zero/chat-stream

**Query Parameters:**
- `query` (required): User message/question
- `user_email` (optional): User email for personalization
- `user_role` (optional): User role (member, admin, external)
- `conversation_history` (optional): JSON string of conversation history

**Headers:**
- `x-connection-id` (optional): Connection identifier for reconnection
- `x-user-id` (optional): User identifier
- `Authorization` (optional): JWT token

**Response:**
- Content-Type: `text/event-stream`
- SSE events:
  - `message`: Token chunks, metadata, completion
  - `heartbeat`: Keep-alive (every 30s)

**Example:**
```bash
curl -N "https://api.example.com/api/v2/bali-zero/chat-stream?query=Hello" \
  -H "x-user-id: user123"
```

### POST /api/v2/bali-zero/chat-stream

Same as GET, but supports larger payloads via request body.

## Frontend Integration

### Basic Usage
```javascript
const client = new BaliZeroStreamClient({
  baseUrl: '/api/v2/bali-zero/chat-stream',
  onToken: (token, metadata) => {
    console.log('Token:', token);
  },
  onComplete: (data) => {
    console.log('Complete:', data.metrics);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

await client.stream({
  query: 'What documents do I need for B211A visa?',
  user_email: 'user@example.com'
});
```

## Security Assessment

### ✅ Implemented
- Rate limiting (20 req/min)
- Audit trail (GDPR compliant)
- Query hashing (no PII storage)
- IP logging (security only)
- Authentication support

### ⚠️ Considerations
- SSE connections keep server resources (monitor connection count)
- Heartbeat prevents idle timeout (30s interval)
- Rate limiting uses in-memory store (distributed limiters needed for multi-instance)

## Backup Strategy

### Before Deploy
1. Database backup (if audit service uses DB)
2. Configuration backup
3. Feature flag state documented

### During Deploy
1. Gradual rollout with monitoring
2. Feature flag toggle ready
3. Rollback script prepared

### After Deploy
1. Verify audit logs working
2. Confirm performance targets
3. Document any issues

## Troubleshooting

### Connection Issues
- Check feature flag: `ENABLE_SSE_STREAMING=true`
- Verify rate limits not exceeded
- Check Python backend connectivity

### Performance Issues
- Monitor first token latency
- Check network latency to Python backend
- Verify heartbeat not causing issues

### Audit Trail Issues
- Check Winston logs
- Verify audit service initialized
- Confirm GDPR compliance maintained

## Support

For issues or questions:
- Check logs: `logs/combined.log`, `logs/error.log`
- Review audit trail: `/api/admin/audit` (if implemented)
- Contact: ZANTARA development team

