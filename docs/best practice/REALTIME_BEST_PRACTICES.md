# Real-time and Collaboration Best Practices

## 0. Principles
- Optimise for latency first. Choose protocols by required latency (chat or interactive < 1 s implies WebSocket or WebRTC; massive broadcast implies LL-HLS or DASH).
- Build resilience in. Use retries with exponential backoff and jitter, idempotency on every hop, and versioned messages.
- Enforce zero trust operationally. Prefer end-to-end encryption when possible, apply TLS everywhere, issue ephemeral credentials, and enforce least privilege.
- Ship observability by default. Collect WebRTC getStats()/TWCC metrics, structured logs, trace events, and define SLOs for latency, jitter, and loss.

## 1. Protocol Choices
- Two-way interactive: WebRTC (audio, video, data) or WebSocket (data only).
- Server-to-client one-way: Server-Sent Events (EventSource).
- Massive broadcast: LL-HLS or DASH-CMAF; for sub-second latency choose WebRTC with an SFU.

## 2. WebRTC (Audio/Video with SFU)
**Recommendations**
- Configure ICE correctly: public STUN plus TURN fallback. Issue TURN credentials via REST (`coturn --use-auth-secret`) with short expiry.
- Enable congestion control (TWCC, GCC). Reduce resolution before frame rate, use simulcast or scalable video coding (VP9, AV1) to adapt per subscriber.
- Offer optional E2EE with SFU using insertable streams (SFrame) so the SFU forwards ciphertext.
- Configure data channels per workload (for example `ordered: false`, `maxRetransmits: 0` for ephemeral signals).
- Collect `RTCPeerConnection.getStats()` sender and receiver metrics for bitrate, RTT, loss, jitter, and MOS estimates.

**SFU Notes**
- Prefer SFU (mediasoup, Janus, Jitsi) over MCU; enable simulcast or SVC and layer pinning. Plan for horizontal scaling (regional clusters, cascading SFUs).

## 3. Collaborative Editing (OT versus CRDT)
- Prefer modern CRDTs (Yjs, Automerge) for offline resilience and client-side merges; schedule snapshots and garbage collection to control metadata growth.
- OT (ShareDB) is acceptable when you control ordering strictly via a central server.

**Practices**
- Snapshot and compact state (for example `Y.encodeStateAsUpdate`) and checkpoint regularly.
- Enforce access control outside the CRDT layer (Yjs does not handle fine-grained permissions).
- Use subdocuments for large documents; manage cursors and presence on separate channels.

## 4. Presence Systems
- Send lightweight heartbeats every 15-30 seconds and expire presence at roughly twice the heartbeat plus margin; mobile clients need tolerant values.
- Handle dirty disconnects using onDisconnect patterns mirrored between realtime DBs and persistent stores.
- Keep presence sets bounded; apply lazy sync or paging for large rooms.
- Separate the presence service (stateless) from the presence store (Redis, etc.) and fan out via pub/sub.

## 5. Live Streaming and Media Servers
- Interactive (< 1 s): WebRTC plus SFU.
- Large scale (thousands+): LL-HLS with CDN; expect 2-6 s realistic latency.
- Hybrid: ingest via WebRTC or RTMP, transcode, then WebRTC for interactive participants and LL-HLS for the audience.

**HLS Guidance**
- Follow the HLS Authoring Specification: aligned renditions, CMAF segments, low-latency tuning.

## 6. Screen Sharing and Remote Assistance
- Use `navigator.mediaDevices.getDisplayMedia()` in secure contexts (HTTPS) and request the minimal surface (tab or window). Configure `cursor: "motion"` or `"always"` as needed.
- Educate users about whole-screen sharing risks; rely on browser indicators (red borders).
- For remote control, send input via data channels only with explicit consent; use Pointer Lock responsibly.

## 7. Chat Systems
- Transport: WebSocket (WSS) with ping/pong, exponential backoff, and server-side backpressure handling.
- Delivery: at-least-once with idempotency (Idempotency-Key headers and deduplication stores).
- Ordering: produce monotonic IDs (for example Snowflake IDs) for local sorting and resume cursors.
- Cold start: use edge caches or selective prefetch to reduce initial payloads.

## 8. Notification Systems
- Web push: implement RFC 8030 (TTL, collapse keys, urgency). Request permission only after user intent; handle via Service Worker.
- Mobile push: use FCM or APNs. Select priority carefully (Android high priority for chat or urgent alerts, normal for background; APNs token-based auth).

## 9. Activity Feeds
- Fan-out on write for typical users; fan-out on read for high-fanout accounts (often an hybrid approach).
- Apply ranking and aggregation (for example "10 people liked this").
- Use Snowflake-style IDs for time-ordered paging.

## 10. Security Considerations
- WebRTC requires DTLS-SRTP; extend with insertable streams for E2EE when needed. Harden signalling (WSS with OAuth or signed tokens).
- TURN credentials must be ephemeral (REST generation); never ship static secrets to clients.
- Apply strict CSP and permission checks for pointer lock and screen capture.

## 11. Observability and SLOs
- WebRTC KPIs: setup time, send/receive bitrate, RTT, packet loss, freeze counts; ingest metrics from `getStats()` and RTCStats.
- WebSocket KPIs: reconnect rate, ping/pong latency, queue depth, dropped messages; plan load shedding.
- Define SLOs (for example call start < 3 s P95, message delivery < 200 ms P95) and align release policies with error budgets.

## 12. Testing and Chaos
- Apply network shaping (loss, jitter, bandwidth caps) in CI using browser or OS tools.
- Maintain a compatibility matrix across browsers, OS, devices, including CPU throttling and GPU toggles.
- Run soak tests with thousands of concurrent WebSockets and controlled fan-out to validate stability.

## 13. Operational Snippets
### 13.1 Exponential Backoff with Jitter
```ts
function backoff(attempt: number, baseMs = 250, maxMs = 30_000) {
  const cap = Math.min(maxMs, baseMs * 2 ** attempt)
  const jitter = Math.random() * cap * 0.5 // full jitter
  return cap / 2 + jitter
}
```
Use for WebSocket reconnects, resubscription, and API retries.

### 13.2 Idempotency Key (HTTP)
```
POST /messages
Idempotency-Key: 6f2f1b01-...-c9
```
Cache responses server-side for 24 hours and dedupe on `(key, endpoint, body hash)`.

### 13.3 TURN REST (Backend)
- Username: `{exp_timestamp}:{userId}`.
- Password: `base64(HMAC_SHA1(username, shared_secret))`.
- Return ICE servers with TTL <= 1 hour.

### 13.4 DataChannel Profiles
- Reliable and ordered (default): chat, small file transfers.
- Unreliable and unordered (`ordered: false`, `maxRetransmits: 0`): telemetry or transient signals.

### 13.5 Screen Capture
```ts
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: { cursor: 'motion' },
  audio: true,
})
```
Always request the minimal necessary surface in a secure context.

## 14. Architecture Summary
- Media: WebRTC plus SFU with simulcast or SVC and TWCC/GCC congestion control.
- Real-time data: WebSocket with ping/pong and idempotency guarantees.
- Collaboration: CRDT (Yjs) with snapshots and garbage collection.
- Presence: heartbeats with TTL enforcement and bounded membership sets.
- Notifications: Web Push (RFC 8030) plus FCM/APNs with appropriate priority.
- Activity feeds: hybrid fan-out with ranking and aggregation.

## References
- ICE, STUN, TURN: RFC 8445, RFC 5389, RFC 5766.
- WebRTC APIs, screen capture, stats, data channels (MDN and W3C).
- End-to-end encryption with insertable streams (webrtcHacks, Janus).
- SFU implementations (mediasoup, Janus) and SVC/simulcast guides.
- CRDT research (Kleppmann) and Yjs documentation.
- Presence architectures (Firebase, Ably) and Slack engineering posts.
- Notifications: RFC 8030, MDN, FCM, APNs references.
- Backoff and idempotency: AWS, Stripe engineering.

## Compliance Note
The WebRTC, HLS, and push ecosystems evolve quickly. Review this document regularly against the latest specs (MDN, W3C, IETF) and vendor updates.
