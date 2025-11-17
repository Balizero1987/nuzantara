# Enable SSE Streaming in Staging

## Overview
Enable Server-Sent Events (SSE) streaming feature in staging environment for testing and validation.

## Current Status
- ✅ Code deployed with feature flag OFF (`ENABLE_SSE_STREAMING=false`)
- ✅ Backward compatibility verified
- ✅ Security measures implemented (rate limiting, audit trail, GDPR)
- ⏳ **NEXT STEP**: Enable in staging for testing

## Quick Start

### Step 1: Enable Feature Flag in Fly.io

```bash
# Set the feature flag to true
fly secrets set ENABLE_SSE_STREAMING=true -a nuzantara-backend

# Verify secret is set
fly secrets list -a nuzantara-backend | grep ENABLE_SSE_STREAMING
```

### Step 2: Deploy (Optional - if code changes needed)

```bash
cd /home/user/nuzantara/apps/backend-ts
fly deploy -a nuzantara-backend
```

### Step 3: Verify SSE Endpoint is Active

```bash
# Check health endpoint
curl https://nuzantara-backend.fly.dev/health | jq '.features.sse_streaming'

# Test SSE streaming endpoint
curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Hello" \
  -H "x-user-id: test-user"
```

## Testing Checklist

### 1. Basic Functionality Tests

**Test 1: Simple Query**
```bash
curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=What is ZANTARA?" \
  -H "x-user-id: test-user-1"
```

**Expected:**
- Connection establishes (HTTP 200)
- Receives `event: message` chunks
- Receives heartbeat every 30s
- Connection closes gracefully

**Test 2: POST Request with Body**
```bash
curl -N -X POST "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-2" \
  -d '{
    "query": "What documents do I need for B211A visa?",
    "user_email": "test@example.com",
    "user_role": "member"
  }'
```

**Test 3: With Conversation History**
```bash
curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream" \
  -H "x-user-id: test-user-3" \
  -G --data-urlencode 'query=Tell me more' \
  --data-urlencode 'conversation_history=[{"role":"user","content":"What is B211A?"},{"role":"assistant","content":"B211A is a visa..."}]'
```

### 2. Performance Tests

**Test 4: Measure First Token Latency**
```bash
# Using time command
time curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Hello" \
  -H "x-user-id: perf-test" \
  --max-time 5
```

**Target:** First token < 100ms

**Test 5: Concurrent Connections**
```bash
# Run 10 concurrent requests
for i in {1..10}; do
  curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Test$i" \
    -H "x-user-id: load-test-$i" &
done
wait
```

**Expected:** All connections succeed without errors

### 3. Rate Limiting Tests

**Test 6: Exceed Rate Limit**
```bash
# Send 25 requests rapidly (limit is 20/min)
for i in {1..25}; do
  curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Rate$i" \
    -H "x-user-id: ratelimit-test" \
    -w "\n%{http_code}\n" \
    --max-time 2
done
```

**Expected:**
- First 20 requests: HTTP 200
- Requests 21-25: HTTP 429 (Too Many Requests)
- Response includes `Retry-After` header

### 4. Reconnection Tests

**Test 7: Connection Recovery**
```bash
# First connection
CONNECTION_ID="test-$(date +%s)"
curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Test" \
  -H "x-user-id: reconnect-test" \
  -H "x-connection-id: $CONNECTION_ID" \
  --max-time 10

# Wait 5 seconds, then reconnect with same ID
sleep 5
curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Reconnect" \
  -H "x-user-id: reconnect-test" \
  -H "x-connection-id: $CONNECTION_ID"
```

**Expected:** Second connection uses same ID, audit trail shows reconnection

### 5. Security & Audit Tests

**Test 8: Verify Audit Trail**
```bash
# Check logs for audit entries
fly logs -a nuzantara-backend | grep -i audit | tail -20
```

**Expected:** Audit log entries for:
- Connection opened
- Rate limit violations (if any)
- Authentication events
- Connection closed

**Test 9: GDPR Compliance**
```bash
# Verify query hashing in logs
fly logs -a nuzantara-backend | grep -i "query" | tail -10
```

**Expected:** No plaintext queries in logs, only hashed versions

### 6. Backward Compatibility Tests

**Test 10: Verify Old Endpoint Still Works**
```bash
# Non-streaming endpoint should still work
curl -X POST "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hello",
    "user_email": "test@example.com"
  }'
```

**Expected:** Non-streaming endpoint works normally, returns complete response

## Performance Metrics to Monitor

### Key Metrics
```bash
# Monitor Fly.io metrics
fly metrics -a nuzantara-backend

# Watch logs for performance data
fly logs -a nuzantara-backend | grep -E "latency|performance|sse"
```

**Target Metrics:**
- ✅ First token latency: <100ms (average)
- ✅ Inter-token latency: <50ms (average)
- ✅ Connection success rate: >95%
- ✅ Error rate: <1%
- ✅ Rate limit violations: <10/hour (during testing)

### Memory & Resource Usage
```bash
# Check resource usage
fly status -a nuzantara-backend
fly vm status -a nuzantara-backend
```

**Monitor for:**
- Memory usage increase (SSE connections consume server resources)
- CPU usage during concurrent streams
- Active connections count

## Frontend Testing

### Using Frontend Client

Create test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>SSE Stream Test</title>
  <script src="/js/bali-zero-stream-client.js"></script>
</head>
<body>
  <h1>SSE Streaming Test</h1>
  <div id="output"></div>

  <script>
    const client = new BaliZeroStreamClient({
      baseUrl: 'https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream',
      onToken: (token, metadata) => {
        document.getElementById('output').innerHTML += token;
        console.log('Token received:', token, metadata);
      },
      onComplete: (data) => {
        console.log('Stream complete:', data.metrics);
        alert('Latency: ' + data.metrics.latency + 'ms');
      },
      onError: (error) => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
      }
    });

    async function testStream() {
      await client.stream({
        query: 'What is ZANTARA?',
        user_email: 'test@example.com'
      });
    }

    // Auto-start test
    testStream();
  </script>
</body>
</html>
```

### Browser Testing Checklist
- [ ] Tokens appear in real-time
- [ ] Heartbeat prevents connection timeout
- [ ] Auto-reconnect works on network issues
- [ ] Performance metrics displayed correctly
- [ ] No console errors

## Rollback Procedure

### If Issues Found

**Quick Disable:**
```bash
# Disable feature flag
fly secrets set ENABLE_SSE_STREAMING=false -a nuzantara-backend

# Verify disabled
curl https://nuzantara-backend.fly.dev/health | jq '.features.sse_streaming'
# Should show: false or null
```

**Verify Rollback:**
```bash
# Old endpoint still works
curl -X POST "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test after rollback"}'

# SSE endpoint returns 404 or feature disabled error
curl -N "https://nuzantara-backend.fly.dev/api/v2/bali-zero/chat-stream?query=Test"
```

## Success Criteria

### ✅ Testing Complete When:
1. All 10 tests pass successfully
2. Performance metrics meet targets:
   - First token latency <100ms
   - Inter-token latency <50ms
   - Error rate <1%
   - Connection success rate >95%
3. Rate limiting works correctly (429 on exceed)
4. Audit trail captures all events
5. Backward compatibility verified
6. Frontend client works in browser
7. Reconnection logic tested
8. GDPR compliance verified
9. Resource usage acceptable
10. No errors in logs

### 📋 Post-Testing Report

After completing all tests, document:

```markdown
# SSE Streaming Staging Test Report

## Test Results
- Date: [DATE]
- Tester: [NAME]
- Environment: Staging (nuzantara-backend.fly.dev)

### Functional Tests
- [ ] Basic streaming (Test 1-3): PASS/FAIL
- [ ] Performance (Test 4-5): PASS/FAIL (avg latency: XXms)
- [ ] Rate limiting (Test 6): PASS/FAIL
- [ ] Reconnection (Test 7): PASS/FAIL
- [ ] Security/Audit (Test 8-9): PASS/FAIL
- [ ] Backward compat (Test 10): PASS/FAIL

### Performance Metrics
- First token latency: XXms (target: <100ms)
- Inter-token latency: XXms (target: <50ms)
- Error rate: X% (target: <1%)
- Connection success: X% (target: >95%)

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendation
- [ ] Ready for production rollout
- [ ] Needs fixes before production
- [ ] Rollback recommended

### Next Steps
[Action items]
```

## Additional Resources

- Full deployment guide: `/docs/SSE_STREAMING_DEPLOYMENT.md`
- Deployment checklist: `/docs/SSE_DEPLOYMENT_CHECKLIST.md`
- API documentation: See deployment guide
- Troubleshooting: See deployment guide

## Support

For issues during testing:
- Check logs: `fly logs -a nuzantara-backend`
- Monitor metrics: `fly metrics -a nuzantara-backend`
- Review audit trail for security events
- Contact: ZANTARA development team

---

**Status: READY FOR STAGING TESTING 🧪**

Next step: Run `fly secrets set ENABLE_SSE_STREAMING=true -a nuzantara-backend`
