# Test Generation: admin/websocket-admin.ts

## Priority: 33

## File to Test
`src/handlers/admin/websocket-admin.ts`

## Cursor Prompt

```
Generate Jest test suite for WebSocket Admin handler.

Context:
- File: src/handlers/admin/websocket-admin.ts
- WebSocket connection management
- Real-time monitoring

Task:
Create: src/handlers/admin/__tests__/websocket-admin.test.ts

Mock Strategy:
```typescript
jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => ({
    clients: new Set(),
    close: jest.fn()
  }))
}));
```

For EACH function:
1. Get active connections:
   - ✓ Success with list
   - ✓ No connections
   - ✓ Filter by user

2. Broadcast message:
   - ✓ Success to all
   - ✓ Targeted broadcast
   - ✓ Failed connections

3. Close connection:
   - ✓ Success
   - ✓ Already closed
   - ✓ Invalid connection ID

4. Get connection stats:
   - ✓ Active count
   - ✓ Message count
   - ✓ Error rate

Import: await import('../websocket-admin.js')
Target: >80% coverage
```

## After Generation

```bash
npm test -- websocket-admin.test
```
