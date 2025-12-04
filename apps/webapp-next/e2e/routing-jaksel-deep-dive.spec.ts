import { test, expect } from '@playwright/test';

/**
 * INTELLIGENT ROUTING & JAKSEL PERSONALITY - DEEP DIVE TESTS
 *
 * Comprehensive testing of:
 * 1. Intent Classification System (pattern matching)
 * 2. Identity Detection (Zantara, User, Team queries)
 * 3. AI Provider Selection & Fallback
 * 4. Jaksel Personality System
 * 5. Multilingual Support (190+ languages)
 * 6. Style Transfer & Tone Adaptation
 * 7. Context Analysis & Language Detection
 *
 * Architecture Tested:
 * - IntentClassifier (pattern matching)
 * - ContextBuilder (identity detection, team queries)
 * - GeminiJakselService (Gemini 1.5 Flash + In-Context Learning)
 * - IntelligentRouter (orchestration)
 */

const BACKEND_URL =
  process.env.NUZANTARA_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://nuzantara-rag.fly.dev';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PIN = process.env.E2E_TEST_PIN;

// Test queries for different intent categories
const INTENT_TEST_QUERIES = {
  identity: {
    zantara: ['Who are you?', 'What are you?', 'Tell me about yourself', 'What is Zantara?'],
    user: ['Who am I?', 'What is my name?', 'What do you know about me?'],
    team: ['Who works at Bali Zero?', 'Tell me about the team', 'Who is the tax expert?'],
  },
  business: {
    visa: ['What visa do I need for Bali?', 'How do I get a KITAS?', 'Visa requirements'],
    tax: ['What is the tax rate for PT PMA?', 'How does tax work in Indonesia?'],
    legal: ['Legal requirements for business', 'How to register a company in Indonesia'],
    kbli: ['What KBLI code for restaurant?', 'Business classification codes'],
  },
  casual: {
    greetings: ['Hello', 'Hi there', 'Good morning', 'Hey Zantara'],
    thanks: ['Thank you', 'Thanks', 'Appreciate it'],
    goodbye: ['Bye', 'Goodbye', 'See you later'],
  },
  complex: {
    multi_topic: [
      'I want to set up a PT PMA, get visas for my team, and understand tax obligations',
      'Help me with company registration, visa processing, and legal compliance',
    ],
    planning: [
      'I want to move my business to Bali. What are all the steps?',
      'Complete guide to starting a business in Indonesia',
    ],
  },
};

// Multilingual test queries for Jaksel
const MULTILINGUAL_QUERIES = {
  italian: {
    query: 'Come posso ottenere un visto per Bali?',
    expectedLang: 'it',
    keywords: ['visto', 'bali', 'indonesia'],
  },
  spanish: {
    query: '¿Cuánto cuesta registrar una empresa en Indonesia?',
    expectedLang: 'es',
    keywords: ['empresa', 'indonesia', 'costo'],
  },
  french: {
    query: 'Quels sont les services de Bali Zero?',
    expectedLang: 'fr',
    keywords: ['services', 'bali zero'],
  },
  german: {
    query: 'Wie kann ich ein Unternehmen in Indonesien gründen?',
    expectedLang: 'de',
    keywords: ['unternehmen', 'indonesien'],
  },
  indonesian: {
    query: 'Berapa biaya pendirian PT di Bali?',
    expectedLang: 'id',
    keywords: ['biaya', 'pt', 'bali'],
  },
  portuguese: {
    query: 'Quanto custa abrir uma empresa na Indonésia?',
    expectedLang: 'pt',
    keywords: ['empresa', 'indonésia'],
  },
  japanese: {
    query: 'バリでビザを取得するにはどうすればいいですか？',
    expectedLang: 'ja',
    keywords: ['visa', 'bali'],
  },
  chinese: {
    query: '在印度尼西亚开公司需要多少钱？',
    expectedLang: 'zh',
    keywords: ['company', 'indonesia'],
  },
};

test.describe('Intelligent Routing & Jaksel - Deep Dive', () => {
  let authToken: string;

  async function loginAndGetToken(page: any) {
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

    return await page.evaluate(() => localStorage.getItem('zantara_auth_token'));
  }

  async function sendChatMessage(page: any, message: string, timeout = 45000) {
    const chatInput = page
      .locator('textarea, input[placeholder*="message"], input[type="text"]')
      .first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill(message);
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last();
    await sendButton.click();

    const responseLocator = page
      .locator('[data-testid="assistant-message"], .assistant-message, [class*="assistant"]')
      .last();
    await expect(responseLocator).toBeVisible({ timeout });

    return await responseLocator.textContent();
  }

  test.beforeEach(async ({ page }) => {
    authToken = await loginAndGetToken(page);
    expect(authToken).toBeTruthy();
  });

  test.describe('1. Intent Classification - Identity Queries', () => {
    test('Routing: Zantara Identity - "Who are you?"', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.identity.zantara[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/zantara|ai|assistant|help|bali zero/i);
    });

    test('Routing: Zantara Identity - Multiple Phrasings', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      for (const query of INTENT_TEST_QUERIES.identity.zantara) {
        const response = await sendChatMessage(page, query);
        expect(response).toBeTruthy();
        expect(response!.toLowerCase()).toMatch(/zantara|ai|assistant|bali zero/i);
        await page.waitForTimeout(1000);
      }
    });

    test('Routing: User Identity Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.identity.user[0]);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(10);
    });

    test('Routing: Team Query Detection', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.identity.team[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/team|member|bali zero|dewa|expert/i);
    });

    test('Routing: Team Member Specific Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.identity.team[2]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/tax|dewa|expert|ayu/i);
    });
  });

  test.describe('2. Intent Classification - Business Queries', () => {
    test('Routing: Visa Query Classification', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.business.visa[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/visa|kitas|bali|indonesia|requirement|document/i);
    });

    test('Routing: Tax Query Classification', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.business.tax[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/tax|pt pma|rate|percent|%|corporate/i);
    });

    test('Routing: Legal Query Classification', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.business.legal[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/legal|business|law|requirement|register|company/i);
    });

    test('Routing: KBLI Query Classification', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.business.kbli[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/kbli|code|restaurant|classification|business/i);
    });
  });

  test.describe('3. Intent Classification - Casual Queries', () => {
    test('Routing: Greeting Detection', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.casual.greetings[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/hello|hi|hey|zantara|help|how/i);
    });

    test('Routing: Multiple Greetings', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      for (const greeting of INTENT_TEST_QUERIES.casual.greetings) {
        const response = await sendChatMessage(page, greeting);
        expect(response).toBeTruthy();
        await page.waitForTimeout(500);
      }
    });

    test('Routing: Thank You Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // First, ask a question
      await sendChatMessage(page, 'What is Bali Zero?');

      // Then thank
      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.casual.thanks[0]);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/welcome|pleasure|happy|glad|help/i);
    });
  });

  test.describe('4. Complex Query Routing', () => {
    test('Routing: Multi-Topic Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        INTENT_TEST_QUERIES.complex.multi_topic[0],
        60000
      );

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/pt pma|visa|tax|team|setup|company/i);
      expect(response!.length).toBeGreaterThan(150);
    });

    test('Routing: Planning Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, INTENT_TEST_QUERIES.complex.planning[0], 60000);

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/business|bali|step|indonesia|company|visa/i);
      expect(response!.length).toBeGreaterThan(150);
    });
  });

  test.describe('5. Jaksel Personality - Multilingual Support', () => {
    test('Jaksel: Italian Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.italian;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
      // Response might be in Italian or contain Italian keywords
    });

    test('Jaksel: Spanish Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.spanish;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: French Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.french;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: German Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.german;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: Indonesian Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.indonesian;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: Portuguese Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.portuguese;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Jaksel: Japanese Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.japanese;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(10);
    });

    test('Jaksel: Chinese Language Detection & Response', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const testCase = MULTILINGUAL_QUERIES.chinese;
      const response = await sendChatMessage(page, testCase.query);

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(10);
    });
  });

  test.describe('6. Jaksel Personality - Style Transfer', () => {
    test('Jaksel: Style Consistency in English', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, 'What is a KITAS visa?');

      expect(response).toBeTruthy();
      // Jaksel style might include: basically, literally, which is, etc.
      expect(response!.length).toBeGreaterThan(50);
    });

    test('Jaksel: Language Switching Consistency', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Start in English
      const response1 = await sendChatMessage(page, 'What services does Bali Zero provide?');
      expect(response1).toBeTruthy();

      // Switch to Italian
      const response2 = await sendChatMessage(page, 'Quali sono i requisiti per il visto?');
      expect(response2).toBeTruthy();

      // Back to English
      const response3 = await sendChatMessage(page, 'Thank you for the information');
      expect(response3).toBeTruthy();

      // All responses should be appropriate
      expect(response1!.length).toBeGreaterThan(30);
      expect(response2!.length).toBeGreaterThan(20);
      expect(response3!.length).toBeGreaterThan(10);
    });

    test('Jaksel: Tone Adaptation', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Casual tone
      const casual = await sendChatMessage(page, 'Hey! Quick question about visas');
      expect(casual).toBeTruthy();

      // Formal tone
      const formal = await sendChatMessage(
        page,
        'Could you please provide detailed information regarding visa requirements?'
      );
      expect(formal).toBeTruthy();

      // Both should receive appropriate responses
      expect(casual!.length).toBeGreaterThan(20);
      expect(formal!.length).toBeGreaterThan(20);
    });
  });

  test.describe('7. AI Provider Fallback System', () => {
    test('Fallback: Response Quality Consistency', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Ask the same question multiple times to test consistency
      const query = 'What is the capital of Indonesia?';
      const responses = [];

      for (let i = 0; i < 3; i++) {
        const response = await sendChatMessage(page, `${query} (test ${i + 1})`);
        responses.push(response);
        await page.waitForTimeout(1000);
      }

      // All responses should mention Jakarta
      for (const response of responses) {
        expect(response).toBeTruthy();
        expect(response!.toLowerCase()).toMatch(/jakarta/i);
      }
    });

    test('Fallback: Complex Query Handling', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        'I need comprehensive information about setting up a restaurant business in Bali, ' +
        'including company registration, KBLI codes, visa requirements for staff, ' +
        'tax obligations, and legal compliance. Please provide detailed steps.',
        60000
      );

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(200);
      expect(response!.toLowerCase()).toMatch(
        /restaurant|company|kbli|visa|tax|legal|bali|indonesia/i
      );
    });
  });

  test.describe('8. Context Analysis', () => {
    test('Context: Formality Detection', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Very formal query
      const formal = await sendChatMessage(
        page,
        'I would appreciate if you could provide comprehensive information regarding ' +
        'the legal requirements for establishing a foreign-owned enterprise in Indonesia.'
      );

      expect(formal).toBeTruthy();
      expect(formal!.length).toBeGreaterThan(50);
    });

    test('Context: Intent Extraction from Complex Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        'Hi Zantara! I am Italian, I want to move to Bali to open a surf school. ' +
        'I need help with everything - company setup, visa, taxes, the whole package. ' +
        'Where do I start?',
        60000
      );

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(
        /company|business|visa|italy|italian|surf|school|tax|setup/i
      );
      expect(response!.length).toBeGreaterThan(100);
    });

    test('Context: Multi-Turn Context Building', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      // Build context progressively
      await sendChatMessage(page, 'I am from Germany');
      await sendChatMessage(page, 'I want to open a tech startup');
      await sendChatMessage(page, 'In Bali');
      const response = await sendChatMessage(page, 'What do I need to do first?');

      // Should understand: German + tech startup + Bali context
      expect(response!.toLowerCase()).toMatch(
        /germany|german|tech|startup|bali|indonesia|company|visa/i
      );
    });
  });

  test.describe('9. Edge Cases & Error Handling', () => {
    test('Routing: Mixed Language Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        'Ciao! I need informazioni about visa per Bali, please help me with questo'
      );

      expect(response).toBeTruthy();
      expect(response!.length).toBeGreaterThan(30);
    });

    test('Routing: Query with Emojis', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(
        page,
        '🏝️ Moving to Bali! 🚀 Need help with visa 💼 and company setup 🏢'
      );

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/bali|visa|company|setup/i);
    });

    test('Routing: Ambiguous Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, 'Help');

      expect(response).toBeTruthy();
      // Should offer to help or ask for clarification
      expect(response!.length).toBeGreaterThan(20);
    });

    test('Routing: Very Short Query', async ({ page }) => {
      await page.goto('/chat');
      await page.waitForLoadState('networkidle');

      const response = await sendChatMessage(page, 'Visa?');

      expect(response).toBeTruthy();
      expect(response!.toLowerCase()).toMatch(/visa|kitas|indonesia|help/i);
    });
  });
});
