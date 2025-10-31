# Redis Pub/Sub + WebSocket Integration

## Overview

Real-time features powered by Redis pub/sub and WebSocket.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Backend TS │─publish→│    Redis    │─deliver→│  Backend TS │
│  (API)      │         │   Pub/Sub   │         │  (WebSocket)│
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        │ emit
                                                        ↓
                                                  ┌──────────┐
                                                  │  Browser │
                                                  │  Client  │
                                                  └──────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd apps/backend-ts
npm install socket.io ioredis
npm install --save-dev @types/socket.io
```

### 2. Update Index.ts

```typescript
// apps/backend-ts/src/index.ts
import { setupWebSocket } from './websocket';
import { PubSubService } from './utils/pubsub';

// After creating HTTP server:
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Setup WebSocket
const io = setupWebSocket(server);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await PubSubService.disconnect();
  io.close();
  process.exit(0);
});
```

### 3. Environment Variables

```env
REDIS_URL=redis://redis.railway.internal:6379
WEBAPP_URL=https://zantara.balizero.com
```

## Usage Examples

### Backend: Send Notification

```typescript
import { notifyUser } from './utils/pubsub';

// After AI processes request:
await notifyUser({
  userId: 123,
  type: 'ai_response_ready',
  title: 'Response Ready',
  message: 'Your AI query has been processed',
  data: { conversationId: 456 }
});
```

### Backend: Queue AI Job

```typescript
import { queueAIJob } from './utils/pubsub';

// Queue background job:
await queueAIJob({
  id: 'job-123',
  type: 'llama_inference',
  userId: 123,
  payload: { text: 'Analyze this...' },
  priority: 'high',
  timestamp: Date.now()
});
```

### Backend: Invalidate Cache

```typescript
import { invalidateCache } from './utils/pubsub';

// After updating Oracle KB:
await invalidateCache('oracle:*', 'KB updated');
```

### Frontend: Connect to WebSocket

```javascript
// apps/webapp/src/utils/realtime.js
import io from 'socket.io-client';

const socket = io('https://nuzantara-backend.fly.dev', {
  auth: {
    userId: currentUser.id
  }
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('Notification:', notification);
  toast.success(notification.message);
});

// Listen for AI results
socket.on('ai-result', (result) => {
  console.log('AI Result:', result);
  updateUI(result);
});

// Join chat room
socket.emit('join-room', 'room-123');

// Listen for chat messages
socket.on('chat-message', (message) => {
  appendMessage(message);
});

// Keep-alive
setInterval(() => {
  socket.emit('ping');
}, 30000);
```

## Features Enabled

### 1. Real-Time Notifications

User gets instant feedback without polling:
```typescript
// Backend
await notifyUser({
  userId: 123,
  type: 'document_processed',
  title: 'Success',
  message: 'Your document has been indexed',
  data: { documentId: 789 }
});

// Frontend immediately shows toast
```

### 2. Background AI Jobs

Long-running AI tasks don't block API:
```typescript
// API handler (returns immediately)
await queueAIJob({
  id: uuid(),
  type: 'llama_inference',
  userId: req.user.id,
  payload: { text: req.body.text },
  priority: 'normal',
  timestamp: Date.now()
});

res.json({ status: 'queued', message: 'Processing...' });

// Worker picks up job
PubSubService.subscribe(CHANNELS.AI_JOBS, async (job) => {
  const result = await processLlamaJob(job);
  await publishAIResult({
    jobId: job.id,
    userId: job.userId,
    status: 'success',
    result,
    processingTime: 3500
  });
});

// User gets result via WebSocket
```

### 3. Cache Synchronization

Multiple backend instances stay in sync:
```typescript
// Instance 1: Update cache
await redis.set('oracle:answer:123', newValue);
await invalidateCache('oracle:answer:*');

// Instance 2: Receives event and clears local cache
PubSubService.subscribe(CHANNELS.CACHE_INVALIDATE, ({ pattern }) => {
  localCache.del(pattern);
  logger.info(`Cache invalidated: ${pattern}`);
});
```

### 4. Live Chat

Multi-user chat with minimal code:
```typescript
// User A sends message
await sendChatMessage({
  roomId: 'support-123',
  userId: 1,
  username: 'Alice',
  message: 'Hello!',
  timestamp: Date.now()
});

// All users in room receive it instantly
```

### 5. Analytics Streaming

Real-time metrics dashboard:
```typescript
// Track every AI query
await trackEvent({
  event: 'ai_query',
  userId: 123,
  data: {
    model: 'haiku',
    latency: 1800,
    cost: 0.003,
    tokens: 450
  },
  timestamp: Date.now()
});

// Analytics service aggregates in real-time
PubSubService.subscribe(CHANNELS.ANALYTICS_EVENTS, (event) => {
  metrics.increment(`ai.${event.data.model}.queries`);
  metrics.histogram('ai.latency', event.data.latency);
  metrics.gauge('ai.cost', event.data.cost);
});
```

## Monitoring

### Redis Pub/Sub Metrics

```bash
# Check active channels
redis-cli PUBSUB CHANNELS

# Check subscribers per channel
redis-cli PUBSUB NUMSUB user:notifications:*

# Monitor in real-time
redis-cli --csv PSUBSCRIBE '*'
```

### WebSocket Connections

```typescript
// Add to /health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    websocket: {
      connections: io.sockets.sockets.size,
      rooms: io.sockets.adapter.rooms.size
    }
  });
});
```

## Testing

### Test Pub/Sub

```bash
# Terminal 1: Subscribe
redis-cli SUBSCRIBE test:channel

# Terminal 2: Publish
redis-cli PUBLISH test:channel "Hello"
```

### Test WebSocket

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c "ws://localhost:8080" \
  --auth '{"userId":123}'

# Send message
> {"type":"ping"}

# Receive
< {"type":"pong","timestamp":1698765432123}
```

## Performance

Expected metrics:
- **Message latency**: <10ms (Redis → WebSocket)
- **Throughput**: 10,000+ messages/sec
- **Connection limit**: 10,000+ concurrent WebSockets
- **Memory**: ~1KB per WebSocket connection

## Cost

- **Redis**: Already deployed ($0 additional)
- **WebSocket**: No additional cost (same backend instance)
- **Bandwidth**: Minimal (~1KB per notification)

**Total: $0/month additional cost**

## Deployment

Fly.io auto-detects WebSocket support, no config needed.

Just ensure `socket.io` is in dependencies:
```json
{
  "dependencies": {
    "socket.io": "^4.7.2",
    "ioredis": "^5.3.2"
  }
}
```

## Rollout Plan

### Phase 1: Basic Notifications (Day 1)
- ✅ Implement pub/sub wrapper
- ✅ Add WebSocket server
- ✅ Connect 1 feature (user notifications)

### Phase 2: AI Jobs (Day 2)
- Queue long-running AI tasks
- Real-time job results

### Phase 3: Full Integration (Week 1)
- Live chat
- Cache invalidation
- Analytics streaming

## Support

Issues? Check:
1. Redis connection: `railway logs --service backend-ts | grep Redis`
2. WebSocket connections: `curl http://localhost:8080/health`
3. Channel subscribers: `redis-cli PUBSUB CHANNELS`
