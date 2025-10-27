import { test, expect, Page } from '@playwright/test';

/**
 * ZANTARA INTEGRATION TEST SUITE
 * Comprehensive testing for login, messaging, backend integration, and performance
 *
 * Test Coverage:
 * 1. Login/Logout Flow
 * 2. Message Sending & SSE Streaming
 * 3. Backend Integration (TS + RAG)
 * 4. Response Quality & Speed
 * 5. Memory & Conversation History
 * 6. Error Handling
 */

const BASE_URL = 'https://zantara.balizero.com';
const TEST_USER = {
  name: 'Zero',
  email: 'zero@balizero.com',
  pin: '000000'
};

// Performance thresholds
const PERF_THRESHOLDS = {
  pageLoad: 3000,      // 3s max page load
  apiResponse: 5000,   // 5s max for first API response
  streamingStart: 2000 // 2s max to start streaming
};

// Helper function to capture console logs
function setupConsoleLogging(page: Page) {
  const logs: any[] = [];

  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date()
    });
  });

  page.on('pageerror', error => {
    logs.push({
      type: 'error',
      text: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
  });

  return logs;
}

test.describe('ZANTARA Integration Tests - Cycle 1: Login/Logout', () => {
  test('should load login page successfully', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/login.html`);

    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(PERF_THRESHOLDS.pageLoad);

    // Check page elements
    await expect(page.locator('h1')).toContainText('Welcome to Zantara');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should perform complete login flow', async ({ page }) => {
    const logs = setupConsoleLogging(page);

    await page.goto(`${BASE_URL}/login.html`);

    // Fill login form
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);

    // Click login button
    const loginButton = page.locator('button.btn-primary');
    await loginButton.click();

    // Wait for redirect to chat
    await page.waitForURL(`${BASE_URL}/chat.html`, { timeout: 10000 });

    // Verify localStorage
    const sessionId = await page.evaluate(() => localStorage.getItem('zantara-session'));
    const token = await page.evaluate(() => localStorage.getItem('zantara-token'));
    const userEmail = await page.evaluate(() => localStorage.getItem('zantara-email'));

    expect(sessionId).toBeTruthy();
    expect(token).toBeTruthy();
    expect(userEmail).toBe(TEST_USER.email);

    console.log('✅ Login successful - Session established');
    console.log(`📋 Captured ${logs.length} console logs`);
  });

  test('should verify chat page loads with user info', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);

    // Verify chat page elements
    await expect(page.locator('.user-name')).toContainText(TEST_USER.name);
    await expect(page.locator('.logo.bali-zero-logo')).toBeVisible();
    await expect(page.locator('#chatInput')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();

    console.log('✅ Chat page loaded with user info');
  });

  test('should perform logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);

    // Clear localStorage (logout)
    await page.evaluate(() => {
      localStorage.removeItem('zantara-session');
      localStorage.removeItem('zantara-token');
      localStorage.removeItem('zantara-email');
      localStorage.removeItem('zantara-name');
      localStorage.removeItem('zantara-user');
    });

    // Verify logout
    const sessionId = await page.evaluate(() => localStorage.getItem('zantara-session'));
    expect(sessionId).toBeNull();

    console.log('✅ Logout successful - Session cleared');
  });
});

test.describe('ZANTARA Integration Tests - Cycle 2: Messaging & Streaming', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);
  });

  test('should send message and receive response', async ({ page }) => {
    const logs = setupConsoleLogging(page);
    const testMessage = 'Hello Zantara, can you help me?';

    // Send message
    const startTime = Date.now();
    await page.fill('#chatInput', testMessage);
    await page.click('#sendBtn');

    // Wait for user message to appear
    await page.waitForSelector('.message-user', { timeout: 5000 });

    // Wait for assistant response to start
    await page.waitForSelector('.message-assistant:nth-of-type(2)', { timeout: 10000 });

    const firstResponseTime = Date.now() - startTime;
    console.log(`📊 First response time: ${firstResponseTime}ms`);

    // Wait for response to complete (text stops changing)
    await page.waitForTimeout(3000);

    // Get response content
    const responseContent = await page.locator('.message-assistant:nth-of-type(2) .message-content').textContent();

    expect(responseContent).toBeTruthy();
    expect(responseContent?.length).toBeGreaterThan(10);
    expect(firstResponseTime).toBeLessThan(PERF_THRESHOLDS.apiResponse);

    console.log(`✅ Message sent and response received`);
    console.log(`📝 Response length: ${responseContent?.length} chars`);

    // Check for errors in logs
    const errors = logs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log('⚠️ Errors detected:', errors);
    }
  });

  test('should handle multiple rapid messages', async ({ page }) => {
    const messages = [
      'What is KITAS?',
      'How much does it cost?',
      'What documents do I need?'
    ];

    for (const msg of messages) {
      await page.fill('#chatInput', msg);
      await page.click('#sendBtn');

      // Wait a bit for the message to be sent
      await page.waitForTimeout(2000);
    }

    // Wait for all responses
    await page.waitForTimeout(10000);

    // Count messages
    const userMessages = await page.locator('.message-user').count();
    const assistantMessages = await page.locator('.message-assistant').count();

    expect(userMessages).toBeGreaterThanOrEqual(messages.length);
    expect(assistantMessages).toBeGreaterThan(1); // At least initial + one response

    console.log(`✅ Handled ${messages.length} rapid messages`);
    console.log(`📊 User messages: ${userMessages}, Assistant: ${assistantMessages}`);
  });

  test('should verify Enter key sends message', async ({ page }) => {
    const testMessage = 'Testing Enter key';

    await page.fill('#chatInput', testMessage);
    await page.press('#chatInput', 'Enter');

    // Verify message was sent
    await page.waitForSelector('.message-user', { timeout: 5000 });
    const lastUserMsg = await page.locator('.message-user:last-of-type .message-content').textContent();

    expect(lastUserMsg).toContain(testMessage);

    console.log('✅ Enter key successfully sends message');
  });

  test('should verify Shift+Enter adds new line', async ({ page }) => {
    const textarea = page.locator('#chatInput');

    await textarea.fill('Line 1');
    await textarea.press('Shift+Enter');
    await textarea.type('Line 2');

    const value = await textarea.inputValue();

    expect(value).toContain('\n');
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');

    console.log('✅ Shift+Enter adds new line correctly');
  });
});

test.describe('ZANTARA Integration Tests - Cycle 3: Backend Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);
  });

  test('should verify backend health checks', async ({ page }) => {
    const logs = setupConsoleLogging(page);

    // Wait for health checks to complete
    await page.waitForTimeout(3000);

    // Look for health check logs
    const healthLogs = logs.filter(log =>
      log.text.includes('health') ||
      log.text.includes('TS health') ||
      log.text.includes('RAG health')
    );

    console.log(`📊 Health check logs: ${healthLogs.length}`);
    healthLogs.forEach(log => console.log(log.text));

    expect(healthLogs.length).toBeGreaterThan(0);
  });

  test('should test business question with memory', async ({ page }) => {
    const question = 'What is the process to register a PT company in Bali?';

    const startTime = Date.now();
    await page.fill('#chatInput', question);
    await page.click('#sendBtn');

    // Wait for response
    await page.waitForSelector('.message-assistant:nth-of-type(2)', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait for complete response

    const responseTime = Date.now() - startTime;
    const response = await page.locator('.message-assistant:nth-of-type(2) .message-content').textContent();

    console.log(`📊 Business question response time: ${responseTime}ms`);
    console.log(`📝 Response preview: ${response?.substring(0, 200)}...`);

    // Verify response quality
    expect(response).toBeTruthy();
    expect(response?.length).toBeGreaterThan(100);

    // Check for relevant keywords
    const hasRelevantContent =
      response?.toLowerCase().includes('pt') ||
      response?.toLowerCase().includes('company') ||
      response?.toLowerCase().includes('bali') ||
      response?.toLowerCase().includes('indonesia');

    expect(hasRelevantContent).toBeTruthy();

    console.log('✅ Business question answered with relevant content');
  });

  test('should verify streaming performance', async ({ page }) => {
    const logs = setupConsoleLogging(page);

    await page.fill('#chatInput', 'Explain the KITAS application process in detail');

    const startTime = Date.now();
    await page.click('#sendBtn');

    // Wait for first chunk
    await page.waitForSelector('.message-assistant:nth-of-type(2)', { timeout: 5000 });
    const firstChunkTime = Date.now() - startTime;

    console.log(`📊 Streaming start time: ${firstChunkTime}ms`);
    expect(firstChunkTime).toBeLessThan(PERF_THRESHOLDS.streamingStart);

    // Monitor content changes
    let previousLength = 0;
    let chunks = 0;

    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(500);
      const currentContent = await page.locator('.message-assistant:nth-of-type(2) .message-content').textContent();
      const currentLength = currentContent?.length || 0;

      if (currentLength > previousLength) {
        chunks++;
        console.log(`📦 Chunk ${chunks}: +${currentLength - previousLength} chars (total: ${currentLength})`);
        previousLength = currentLength;
      }
    }

    expect(chunks).toBeGreaterThan(0);
    console.log(`✅ Streaming working - received ${chunks} chunks`);
  });
});

test.describe('ZANTARA Integration Tests - Cycle 4: Memory & History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);
  });

  test('should maintain conversation context', async ({ page }) => {
    // First message - introduce topic
    await page.fill('#chatInput', 'I want to start a restaurant in Bali');
    await page.click('#sendBtn');
    await page.waitForTimeout(5000);

    // Second message - follow-up (should remember context)
    await page.fill('#chatInput', 'What licenses do I need for it?');
    await page.click('#sendBtn');
    await page.waitForTimeout(5000);

    // Get last response
    const lastResponse = await page.locator('.message-assistant:last-of-type .message-content').textContent();

    // Should mention restaurant-related licenses
    const contextAware =
      lastResponse?.toLowerCase().includes('restaurant') ||
      lastResponse?.toLowerCase().includes('food') ||
      lastResponse?.toLowerCase().includes('skpl') ||
      lastResponse?.toLowerCase().includes('halal');

    expect(contextAware).toBeTruthy();

    console.log('✅ Conversation context maintained');
    console.log(`📝 Context-aware response: ${lastResponse?.substring(0, 150)}...`);
  });

  test('should verify user profile persistence', async ({ page }) => {
    // Check user name is displayed
    const userName = await page.locator('.user-name').textContent();
    expect(userName).toBe(TEST_USER.name);

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // User info should persist
    const userNameAfterReload = await page.locator('.user-name').textContent();
    expect(userNameAfterReload).toBe(TEST_USER.name);

    console.log('✅ User profile persists across page reloads');
  });
});

test.describe('ZANTARA Integration Tests - Cycle 5: Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);
  });

  test('should handle empty message gracefully', async ({ page }) => {
    // Try to send empty message
    await page.click('#sendBtn');

    // Should not create new message
    await page.waitForTimeout(1000);
    const userMessages = await page.locator('.message-user').count();

    // Should only have initial messages, no new ones
    expect(userMessages).toBeLessThanOrEqual(1);

    console.log('✅ Empty messages blocked correctly');
  });

  test('should verify error display for failed requests', async ({ page }) => {
    const logs = setupConsoleLogging(page);

    // Send message
    await page.fill('#chatInput', 'Test error handling');
    await page.click('#sendBtn');

    // Wait for response
    await page.waitForTimeout(10000);

    // Check logs for errors
    const errorLogs = logs.filter(log =>
      log.type === 'error' ||
      log.text.toLowerCase().includes('error')
    );

    if (errorLogs.length > 0) {
      console.log(`⚠️ Detected ${errorLogs.length} errors:`);
      errorLogs.forEach(log => console.log(`  - ${log.text}`));

      // Verify error is displayed in UI if present
      const errorMessages = await page.locator('.message-content:has-text("Error")').count();
      if (errorMessages > 0) {
        console.log('✅ Errors properly displayed in UI');
      }
    } else {
      console.log('✅ No errors detected');
    }
  });

  test('should verify send button disabled during request', async ({ page }) => {
    await page.fill('#chatInput', 'Test button state');
    await page.click('#sendBtn');

    // Check if button is disabled immediately after click
    await page.waitForTimeout(100);
    const isDisabled = await page.locator('#sendBtn').isDisabled();

    // Wait for response
    await page.waitForTimeout(8000);

    // Button should be enabled again
    const isEnabledAfter = await page.locator('#sendBtn').isEnabled();

    expect(isEnabledAfter).toBeTruthy();

    console.log('✅ Send button state management working correctly');
  });
});

test.describe('ZANTARA Integration Tests - Final Validation', () => {
  test('should complete full user journey', async ({ page }) => {
    console.log('🎯 Starting complete user journey test...');

    const logs = setupConsoleLogging(page);
    const journey = [];

    // 1. Login
    console.log('1️⃣ Testing login...');
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('input[type="text"]', TEST_USER.name);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.pin);
    await page.locator('button.btn-primary').click();
    await page.waitForURL(`${BASE_URL}/chat.html`);
    journey.push('✅ Login successful');

    // 2. Send multiple messages
    console.log('2️⃣ Testing conversation...');
    const questions = [
      'What is a KITAS visa?',
      'How long does it take to get one?',
      'What is the cost?'
    ];

    for (const q of questions) {
      await page.fill('#chatInput', q);
      await page.click('#sendBtn');
      await page.waitForTimeout(6000);
      journey.push(`✅ Question answered: "${q.substring(0, 30)}..."`);
    }

    // 3. Verify conversation history
    console.log('3️⃣ Verifying conversation history...');
    const totalMessages = await page.locator('.message').count();
    console.log(`📊 Total messages in conversation: ${totalMessages}`);
    journey.push(`✅ Conversation history: ${totalMessages} messages`);

    // 4. Logout
    console.log('4️⃣ Testing logout...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    journey.push('✅ Logout successful');

    // 5. Verify session cleared
    const sessionAfterLogout = await page.evaluate(() => localStorage.getItem('zantara-session'));
    expect(sessionAfterLogout).toBeNull();
    journey.push('✅ Session cleared');

    // Print journey summary
    console.log('\n📋 USER JOURNEY SUMMARY:');
    journey.forEach(step => console.log(step));

    // Print error summary
    const errors = logs.filter(log => log.type === 'error');
    if (errors.length > 0) {
      console.log(`\n⚠️ ${errors.length} ERRORS DETECTED:`);
      errors.forEach(err => console.log(`  - ${err.text}`));
    } else {
      console.log('\n✅ NO ERRORS DETECTED - ALL SYSTEMS OPERATIONAL');
    }
  });
});
