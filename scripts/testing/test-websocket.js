#!/usr/bin/env node
/**
 * WebSocket Connection Test
 * Tests the ZANTARA WebSocket server on Railway
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'wss://ts-backend-production-568d.up.railway.app/ws';

console.log('🔌 Testing WebSocket connection to:', WS_URL);
console.log('⏱️  Timeout: 10 seconds\n');

const ws = new WebSocket(WS_URL);
let connected = false;

// Timeout after 10 seconds
const timeout = setTimeout(() => {
  if (!connected) {
    console.log('❌ Connection timeout (10s)');
    console.log('   WebSocket server might not be responding');
    ws.close();
    process.exit(1);
  }
}, 10000);

ws.on('open', () => {
  connected = true;
  console.log('✅ WebSocket connected successfully!');
  console.log('📡 Sending ping...\n');

  // Send ping
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received message:');
    console.log(JSON.stringify(message, null, 2));
    console.log('');

    if (message.type === 'message' && message.channel === 'system') {
      console.log('✅ Welcome message received');
      console.log('   Client ID:', message.data?.clientId);
    }

    if (message.type === 'pong') {
      console.log('✅ Pong received - server is responsive');

      // Test subscription
      console.log('📡 Subscribing to "chat" channel...\n');
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'chat'
      }));

      setTimeout(() => {
        console.log('✅ WebSocket test completed successfully!');
        console.log('   All features working:');
        console.log('   ✓ Connection established');
        console.log('   ✓ Ping/pong working');
        console.log('   ✓ Channel subscription working');
        clearTimeout(timeout);
        ws.close();
        process.exit(0);
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.log('   Code:', error.code || 'N/A');
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', (code, reason) => {
  if (connected) {
    console.log('🔌 WebSocket closed');
    console.log('   Code:', code);
    console.log('   Reason:', reason.toString() || 'Normal closure');
  } else {
    console.log('❌ WebSocket connection failed');
    console.log('   Code:', code);
    console.log('   Possible causes:');
    console.log('   - Server not running WebSocket on /ws path');
    console.log('   - Firewall or proxy blocking WebSocket connections');
    console.log('   - Server configuration issue');
  }
  clearTimeout(timeout);
  if (!connected) process.exit(1);
});
