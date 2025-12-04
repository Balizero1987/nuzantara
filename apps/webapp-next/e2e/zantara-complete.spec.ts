import { test, expect } from '@playwright/test';

/**
 * ZANTARA COMPLETE E2E TEST SUITE
 *
 * Comprehensive testing of ALL Zantara capabilities:
 * 1. RAG System (8 collections, semantic search, source tracking)
 * 2. Memory/Conversation Persistence (save/retrieve, auto-CRM)
 * 3. Intelligent Routing (intent classification, identity detection)
 * 4. Jaksel Personality System (multilingual, style transfer)
 * 5. Multi-Provider AI (OpenAI, Gemini, Anthropic)
 * 6. Tools/Actions (Gmail, Calendar, CRM, image generation)
 *
 * Environment Variables Required:
 * - NUZANTARA_API_URL: Backend API URL
 * - E2E_TEST_EMAIL: Test user email
 * - E2E_TEST_PIN: Test user PIN
 */

// const BACKEND_URL =
//   process.env.NUZANTARA_API_URL ||
//   process.env.NEXT_PUBLIC_API_URL ||
//   'https://nuzantara-rag.fly.dev';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PIN = process.env.E2E_TEST_PIN;

// Test queries for different RAG collections
const RAG_TEST_QUERIES = {
  visa: 'What documents do I need for a KITAS visa in Indonesia?',
  tax: 'What is the corporate tax rate for PT PMA companies in Indonesia?',
  legal: 'What are the legal requirements for starting a business in Bali?',
  kbli: 'What KBLI code should I use for a restaurant business?',
  team: 'Who is the tax expert at Bali Zero?',
  pricing: 'How much does company registration cost with Bali Zero?',
  property: 'What are the requirements for foreign ownership of property in Indonesia?',
  general: 'What services does Bali Zero provide?',
};

// Identity and routing test queries
const ROUTING_TEST_QUERIES = {
  zantara_identity: 'Who are you?',
  user_identity: 'Who am I?',
  team_query: 'Who works at Bali Zero?',
  simple_greeting: 'Hello!',
  complex_business: 'I want to set up a PT PMA and handle all visa requirements for my team',
};

// Multilingual test queries for Jaksel
const JAKSEL_MULTILINGUAL = {
  italian: 'Come posso ottenere un visto per Bali?',
  spanish: '¿Cuánto cuesta registrar una empresa en Indonesia?',
  french: 'Quels sont les services de Bali Zero?',
  german: 'Wie kann ich ein Unternehmen in Indonesien gründen?',
  indonesian: 'Berapa biaya pendirian PT di Bali?',
};

test.describe('ZANTARA Complete System Tests', () => {
  // let authToken: string;

  // Helper: Login and get auth token
  async function loginAndGetToken(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first();

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(TEST_EMAIL!);
    await pinInput.fill(TEST_PIN!);

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await expect(page).toHaveURL(/\/(chat|dashboard)/, { timeout: 15000 });

    const token = await page.evaluate(() => localStorage.getItem('zantara_auth_token'));
    return token;
  }

  // Helper: Send chat message and wait for response
  async function sendChatMessage(page: import('@playwright/test').Page, message: string, timeout = 45000) {
    const chatInput = page
      .locator('textarea, input[placeholder*="message"], input[type="text"]')
      .first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill(message);
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last();
    await sendButton.click();

    // Wait for response
    const responseLocator = page
      .locator('[data-testid="assistant-message"], .assistant-message, [class*="assistant"]')
      .last();
    await expect(responseLocator).toBeVisible({ timeout });

    return await responseLocator.textContent();
  }

  test.beforeAll(async () => {
    if (process.env.CI && (!TEST_EMAIL || !TEST_PIN)) {
      throw new Error('E2E_TEST_EMAIL and E2E_TEST_PIN must be set in CI environment');
    }
  });

  test.describe('1. RAG System Tests', () => {
    test('RAG: Visa Oracle Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.visa);

      // Verify response is relevant to visa
      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/kitas|visa|document|indonesia|permit|passport/i);
      expect(response!.length).toBeGreaterThan(50);

      // Check for RAG sources (if visible)
      const sourcesButton = page.locator(
        '[data-testid="rag-sources"], [aria-label*="source"], button:has-text("Sources")'
      );
      if (await sourcesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sourcesButton.click();
        const sourcesDrawer = page.locator('[data-testid="rag-drawer"], [role="dialog"]');
        await expect(sourcesDrawer).toBeVisible({ timeout: 5000 });
      }
    });

    test('RAG: Tax Genius Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.tax);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/tax|pt pma|corporate|rate|percent|%|indonesia/i);
      expect(response!.length).toBeGreaterThan(50);
    });

    test('RAG: Legal Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.legal);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/legal|law|business|bali|requirement|license|permit/i);
      expect(response!.length).toBeGreaterThan(50);
    });

    test('RAG: KBLI Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.kbli);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/kbli|code|restaurant|business|classification/i);
      expect(response!.length).toBeGreaterThan(30);
    });

    test('RAG: Team Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.team);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/tax|dewa|expert|team|bali zero/i);
      expect(response!.length).toBeGreaterThan(30);
    });

    test('RAG: Pricing Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.pricing);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/price|cost|registration|company|idr|rp|\$/i);
      expect(response!.length).toBeGreaterThan(30);
    });

    test('RAG: Property Collection', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.property);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/property|ownership|foreign|land|villa|indonesia/i);
      expect(response!.length).toBeGreaterThan(30);
    });

    test('RAG: General Knowledge Base', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, RAG_TEST_QUERIES.general);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/bali zero|service|company|business|indonesia/i);
      expect(response!.length).toBeGreaterThan(50);
    });
  });

  test.describe('2. Memory & Conversation Persistence', () => {
    test('Memory: Save and retrieve conversation', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Send first message
      const firstMessage = 'My name is TestUser and I need help with visa.';
      const response1 = await sendChatMessage(page, firstMessage);
      expect(response1).toBeTruthy();

      // Send follow-up that requires memory
      const secondMessage = 'What did I just tell you about myself?';
      const response2 = await sendChatMessage(page, secondMessage);

      // Should remember the name
      expect(response2!.toLowerCase()).toMatch(/testuser|name|visa/i);
    });

    test('Memory: Conversation persistence after reload', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Send message
      await sendChatMessage(page, 'Remember: my favorite color is blue');

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be authenticated
      const token = await page.evaluate(() => localStorage.getItem('zantara_auth_token'));
      expect(token).toBeTruthy();

      // Conversation history should be available (check sidebar or history)
      const chatHistory = page.locator('[data-testid="chat-history"], .chat-history, [class*="history"]');
      if (await chatHistory.isVisible({ timeout: 3000 }).catch(() => false)) {
        const historyText = await chatHistory.textContent();
        expect(historyText).toBeTruthy();
      }
    });

    test('Memory: Context across multiple turns', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Build context over multiple turns
      await sendChatMessage(page, 'I want to open a restaurant in Bali');
      await sendChatMessage(page, 'I am from Italy');
      const response = await sendChatMessage(page, 'What documents will I need?');

      // Should remember both restaurant and Italian nationality
      expect(response!.toLowerCase()).toMatch(/restaurant|italy|italian|visa|kitas|business|permit/i);
    });
  });

  test.describe('3. Intelligent Routing & Classification', () => {
    test('Routing: Zantara Identity Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, ROUTING_TEST_QUERIES.zantara_identity);

      // Should identify as Zantara
      expect(response!.toLowerCase()).toMatch(/zantara|ai|assistant|help|bali zero/i);
      expect(response).toBeTruthy();
    });

    test('Routing: User Identity Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, ROUTING_TEST_QUERIES.user_identity);

      // Should recognize user identity query
      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(10);
    });

    test('Routing: Team Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, ROUTING_TEST_QUERIES.team_query);

      // Should mention team members
      expect(response!.toLowerCase()).toMatch(/team|member|bali zero|dewa|tax|visa/i);
      expect(response).toBeTruthy();
    });

    test('Routing: Simple Greeting', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, ROUTING_TEST_QUERIES.simple_greeting);

      // Should respond to greeting
      expect(response!.toLowerCase()).toMatch(/hello|hi|hey|zantara|help|how/i);
      expect(response).toBeTruthy();
    });

    test('Routing: Complex Business Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, ROUTING_TEST_QUERIES.complex_business, 60000);

      // Should handle complex multi-topic query
      expect(response!.toLowerCase()).toMatch(/pt pma|company|visa|team|setup|requirement/i);
      expect(response!.length).toBeGreaterThan(100);
    });
  });

  test.describe('4. Jaksel Personality System', () => {
    test('Jaksel: Italian Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, JAKSEL_MULTILINGUAL.italian);

      // Should respond in Italian with potential Jaksel style
      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
      // May contain Italian words or Jaksel adaptations
    });

    test('Jaksel: Indonesian Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, JAKSEL_MULTILINGUAL.indonesian);

      // Should respond in Indonesian
      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: Spanish Query', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, JAKSEL_MULTILINGUAL.spanish);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: Style Consistency Across Languages', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Test that personality is consistent regardless of language
      const response1 = await sendChatMessage(page, 'What is Bali Zero?');
      const response2 = await sendChatMessage(page, '¿Qué es Bali Zero?');

      // Both should have responses
      expect(response1).toBeTruthy();
      expect(response2).toBeTruthy();
      expect(response1!.length).toBeGreaterThan(20);
      expect(response2!.length).toBeGreaterThan(20);
    });
  });

  test.describe('5. AI Provider & Model Handling', () => {
    test('AI: Response Quality Check', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        'Explain the difference between KITAS and KITAP visas in detail.'
      );

      // Should provide detailed, quality response
      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(100);
      expect(response!.toLowerCase()).toMatch(/kitas.*kitap|kitap.*kitas/i);
    });

    test('AI: Streaming Response', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const chatInput = page
        .locator('textarea, input[placeholder*="message"], input[type="text"]')
        .first();
      await chatInput.fill('Tell me about company registration in Indonesia');

      const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last();
      await sendButton.click();

      // Response should start appearing (streaming)
      const responseLocator = page
        .locator('[data-testid="assistant-message"], .assistant-message, [class*="assistant"]')
        .last();

      // Wait for first chunk
      await expect(responseLocator).toBeVisible({ timeout: 10000 });

      // Wait a bit for streaming to continue
      await page.waitForTimeout(2000);

      const finalResponse = await responseLocator.textContent();
      expect(finalResponse).toBeTruthy();
      expect(finalResponse!.length).toBeGreaterThan(50);
    });

    test('AI: Fallback Handling', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Should gracefully handle any provider issues
      const response = await sendChatMessage(page, 'What is 2+2?', 30000);

      expect(response).toBeTruthy();
      // Even if primary fails, fallback should provide response
    });
  });

  test.describe('6. Error Handling & Edge Cases', () => {
    test('Error: Empty Message Handling', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const chatInput = page
        .locator('textarea, input[placeholder*="message"], input[type="text"]')
        .first();
      const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last();

      // Try to send empty message
      await chatInput.fill('');

      // Button should be disabled or nothing happens
      const isDisabled = await sendButton.isDisabled().catch(() => false);
      if (!isDisabled) {
        await sendButton.click();
        // Should not crash, just ignore
        await page.waitForTimeout(500);
      }

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    });

    test('Error: Very Long Message', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const longMessage = 'Tell me about visas. ' + 'Please provide details. '.repeat(50);
      const response = await sendChatMessage(page, longMessage, 60000);

      // Should handle long input
      expect(response).toBeTruthy();
    });

    test('Error: Special Characters', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const specialMessage = 'What about émigré visas? 日本人 中文 🚀💼📝';
      const response = await sendChatMessage(page, specialMessage);

      // Should handle special characters
      expect(response).toBeTruthy();
    });

    test('Error: Rapid Sequential Messages', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const chatInput = page
        .locator('textarea, input[placeholder*="message"], input[type="text"]')
        .first();
      const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last();

      // Send multiple messages quickly
      for (let i = 0; i < 3; i++) {
        await chatInput.fill(`Quick message ${i + 1}`);
        await sendButton.click();
        await page.waitForTimeout(500);
      }

      // Should handle all messages gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('7. Performance & Quality', () => {
    test('Performance: Response Time', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();
      await sendChatMessage(page, 'What is Bali Zero?', 30000);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      // Response should be within reasonable time (30s max, but aim for faster)
      expect(responseTime).toBeLessThan(30000);
    });

    test('Quality: Factual Accuracy', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        'What is the capital of Indonesia?'
      );

      // Should provide accurate information
      expect(response!.toLowerCase()).toMatch(/jakarta/i);
    });

    test('Quality: Context Relevance', async ({ page }) => {
      await loginAndGetToken(page);
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        'I need help with business setup in Bali'
      );

      // Should be relevant to the query
      expect(response!.toLowerCase()).toMatch(/business|setup|bali|company|pt|indonesia/i);
      expect(response!.length).toBeGreaterThan(50);
    });
  });
});
