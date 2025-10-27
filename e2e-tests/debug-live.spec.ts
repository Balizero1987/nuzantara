import { test, expect } from '@playwright/test';

/**
 * LIVE DEBUG TEST - Cattura errori console in tempo reale
 */

test('DEBUG - Send message and capture ALL console logs', async ({ page }) => {
  console.log('🔍 Starting LIVE debug session...\n');

  const logs: any[] = [];
  const errors: any[] = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };
    logs.push(logEntry);

    // Print in real-time
    const emoji = msg.type() === 'error' ? '❌' : msg.type() === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    errors.push(errorEntry);
    console.log(`\n🚨 PAGE ERROR:`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Stack: ${error.stack?.substring(0, 200)}\n`);
  });

  // Login
  console.log('\n1️⃣ Navigating to login...');
  await page.goto('https://zantara.balizero.com/login.html');

  await page.fill('input[type="text"]', 'Zero');
  await page.fill('input[type="email"]', 'zero@balizero.com');
  await page.fill('input[type="password"]', '000000');

  console.log('2️⃣ Clicking login button...');
  await page.click('button.btn-primary');

  await page.waitForURL('**/chat.html', { timeout: 10000 });
  console.log('3️⃣ Redirected to chat page\n');

  // Wait for page to fully load
  await page.waitForTimeout(3000);

  console.log('📊 Console logs so far:', logs.length);
  console.log('🚨 Errors so far:', errors.length);

  // Send message
  console.log('\n4️⃣ Typing message...');
  await page.fill('#chatInput', 'Hello, this is a test message');

  console.log('5️⃣ Clicking send button...\n');
  await page.click('#sendBtn');

  // Wait and watch for 15 seconds
  console.log('⏳ Watching for 15 seconds...\n');
  for (let i = 1; i <= 15; i++) {
    await page.waitForTimeout(1000);
    console.log(`   Second ${i}/15...`);

    // Check if response appeared
    const assistantMessages = await page.locator('.message-assistant').count();
    if (assistantMessages > 1) {
      console.log(`   ✅ Response appeared! (${assistantMessages} assistant messages)`);
    }
  }

  // Get final message count
  const userMessages = await page.locator('.message-user').count();
  const assistantMessages = await page.locator('.message-assistant').count();

  console.log(`\n📊 FINAL STATS:`);
  console.log(`   User messages: ${userMessages}`);
  console.log(`   Assistant messages: ${assistantMessages}`);
  console.log(`   Total console logs: ${logs.length}`);
  console.log(`   Total errors: ${errors.length}`);

  // Get last assistant message content
  if (assistantMessages > 0) {
    const lastResponse = await page.locator('.message-assistant:last-of-type .message-content').textContent();
    console.log(`\n💬 Last assistant message:`);
    console.log(`   ${lastResponse?.substring(0, 200)}...`);
  }

  // Print all errors
  if (errors.length > 0) {
    console.log(`\n\n🚨 ======== ERRORS SUMMARY ========`);
    errors.forEach((err, i) => {
      console.log(`\nError ${i + 1}:`);
      console.log(`  Message: ${err.message}`);
      console.log(`  Time: ${err.timestamp}`);
    });
  }

  // Print important logs
  console.log(`\n\n📋 ======== IMPORTANT LOGS ========`);
  const importantLogs = logs.filter(log =>
    log.text.includes('Error') ||
    log.text.includes('health') ||
    log.text.includes('SSE') ||
    log.text.includes('API') ||
    log.text.includes('ZANTARA')
  );

  importantLogs.forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  // Final check - did we get a response?
  expect(assistantMessages).toBeGreaterThan(1);
});
