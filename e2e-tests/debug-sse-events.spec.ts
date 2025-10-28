import { test, expect } from '@playwright/test';

/**
 * DEBUG SSE EVENTS - Captura TUTTI gli eventi SSE per diagnostica
 */

test('DEBUG SSE - Track ALL events for business question', async ({ page }) => {
  console.log('🔬 Starting SSE event tracking...\n');

  const logs: any[] = [];
  const sseEvents: any[] = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text, timestamp: new Date() });

    // Track SSE-specific events
    if (text.includes('[ZantaraSSE]') || text.includes('Stream') || text.includes('SSE')) {
      sseEvents.push({ text, timestamp: new Date() });
      console.log(`📡 SSE: ${text}`);
    } else if (text.includes('delta') || text.includes('complete') || text.includes('start')) {
      console.log(`🎯 EVENT: ${text}`);
    } else {
      console.log(`ℹ️  ${text}`);
    }
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`\n🚨 PAGE ERROR: ${error.message}\n`);
  });

  // Login
  console.log('1️⃣ Logging in...');
  await page.goto('https://zantara.balizero.com/login.html');
  await page.fill('input[type="text"]', 'Zero');
  await page.fill('input[type="email"]', 'zero@balizero.com');
  await page.fill('input[type="password"]', '000000');
  await page.click('button.btn-primary');
  await page.waitForURL('**/chat.html');

  console.log('2️⃣ On chat page\n');
  await page.waitForTimeout(3000);

  // Send BUSINESS question
  const question = "What licenses do I need to open a restaurant in Bali?";
  console.log(`3️⃣ Sending: "${question}"\n`);

  await page.fill('#chatInput', question);
  await page.click('#sendBtn');

  // Monitor for 20 seconds
  console.log('⏱️  Monitoring for 20 seconds...\n');

  for (let i = 1; i <= 20; i++) {
    await page.waitForTimeout(1000);

    // Check message count every 2 seconds
    if (i % 2 === 0) {
      const assistantMsgs = await page.locator('.message-assistant').count();
      const lastContent = await page.locator('.message-assistant:last-of-type .message-content').textContent();

      console.log(`[${i}s] Assistant messages: ${assistantMsgs}, Last content length: ${lastContent?.length} chars`);

      if (lastContent && lastContent.length > 10 && !lastContent.includes('...')) {
        console.log(`\n✅ Response received at ${i}s!`);
        console.log(`Content: ${lastContent.substring(0, 200)}...\n`);
        break;
      }
    }
  }

  // Final analysis
  console.log('\n📊 ==== FINAL ANALYSIS ====\n');

  const lastResponse = await page.locator('.message-assistant:last-of-type .message-content').textContent();
  console.log(`Final response length: ${lastResponse?.length} chars`);
  console.log(`Final response: ${lastResponse?.substring(0, 300)}...\n`);

  // SSE Events Summary
  console.log(`\n📡 ==== SSE EVENTS (${sseEvents.length}) ====`);
  sseEvents.forEach((event, i) => {
    console.log(`${i + 1}. ${event.text}`);
  });

  // Check for delta events
  const deltaEvents = logs.filter(log => log.text.includes('delta'));
  const startEvents = logs.filter(log => log.text.includes('Stream started'));
  const completeEvents = logs.filter(log => log.text.includes('Stream complete'));

  console.log(`\n🎯 ==== EVENT COUNTS ====`);
  console.log(`Start events: ${startEvents.length}`);
  console.log(`Delta events: ${deltaEvents.length}`);
  console.log(`Complete events: ${completeEvents.length}`);

  if (deltaEvents.length === 0) {
    console.log(`\n❌ PROBLEM: NO DELTA EVENTS RECEIVED!`);
    console.log(`This means the 'delta' event listener is NOT being called.`);
    console.log(`The SSE connection might be established but events aren't emitted.`);
  }

  if (startEvents.length === 0) {
    console.log(`\n❌ PROBLEM: NO START EVENT!`);
    console.log(`The 'start' event listener is NOT being called.`);
  }

  // Verify we got a real response
  expect(lastResponse?.length).toBeGreaterThan(10);
});
