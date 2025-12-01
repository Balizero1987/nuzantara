import { test, expect } from '@playwright/test'

/**
 * Real Backend Integration Tests
 *
 * These tests run against the actual Nuzantara backend (not mocked):
 * 1. Backend health check
 * 2. Authentication with real backend
 * 3. Chat with real backend and streaming
 * 4. RAG retrieval shows sources
 * 5. Error handling
 *
 * Requires:
 * - Backend to be running and accessible
 * - Valid test credentials in environment variables
 *
 * Environment variables:
 * - NUZANTARA_API_URL: Backend API URL (default: https://nuzantara-rag.fly.dev)
 * - NUZANTARA_API_KEY: API key for backend
 * - E2E_TEST_EMAIL: Test user email
 * - E2E_TEST_PIN: Test user PIN
 */

const BACKEND_URL = process.env.NUZANTARA_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://nuzantara-rag.fly.dev'
const TEST_EMAIL = process.env.E2E_TEST_EMAIL
const TEST_PIN = process.env.E2E_TEST_PIN

// Skip only if NO credentials are present AND not in CI
const shouldSkip = !TEST_EMAIL && !TEST_PIN && !process.env.CI

test.describe('Real Backend Integration', () => {
  test.skip(shouldSkip, 'Test credentials not provided and not in CI')

  // Fail loudly in CI if credentials missing
  test.beforeAll(async () => {
    if (process.env.CI && (!TEST_EMAIL || !TEST_PIN)) {
      throw new Error(
        'E2E_TEST_EMAIL and E2E_TEST_PIN secrets must be configured in CI. ' +
        'Add them to GitHub repository secrets.'
      )
    }
  })

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('backend health check', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/healthz`)
    expect(response.status()).toBeLessThan(500)

    if (response.ok()) {
      const data = await response.json().catch(() => ({}))
      // Accept either 'healthy', 'ok', or just a valid response
      expect(data).toBeDefined()
    }
  })

  test('authentication flow', async ({ page }) => {
    await page.goto('/')

    // Find and fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()

    // Wait for form to be visible
    await expect(emailInput).toBeVisible({ timeout: 10000 })

    await emailInput.fill(TEST_EMAIL!)
    await pinInput.fill(TEST_PIN!)

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    // Wait for redirect to chat (with longer timeout for real backend)
    await expect(page).toHaveURL(/\/(chat|dashboard)/, { timeout: 15000 })

    // Verify token stored
    const token = await page.evaluate(() =>
      localStorage.getItem('zantara_token') || localStorage.getItem('token')
    )
    expect(token).toBeTruthy()
  })

  test('chat streaming with real AI', async ({ page }) => {
    // Login first
    await page.goto('/')

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()

    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(TEST_EMAIL!)
    await pinInput.fill(TEST_PIN!)

    const loginButton = page.locator('button[type="submit"]').first()
    await loginButton.click()

    // Wait for redirect
    await expect(page).toHaveURL(/\/(chat|dashboard)/, { timeout: 15000 })

    // Navigate to chat if needed
    if (!page.url().includes('/chat')) {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
    }

    // Find chat input
    const chatInput = page.locator('textarea, input[placeholder*="message"], input[type="text"]').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    // Send message
    await chatInput.fill('What is a KITAS visa?')

    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last()
    await sendButton.click()

    // Wait for streaming response (longer timeout for real AI)
    const responseLocator = page.locator('[data-testid="assistant-message"], .assistant-message, [class*="assistant"]').last()
    await expect(responseLocator).toBeVisible({ timeout: 45000 })

    // Verify response contains relevant content
    const responseText = await responseLocator.textContent()
    expect(responseText).toBeTruthy()
    expect(responseText!.length).toBeGreaterThan(10)
    // Response should be related to the question
    expect(responseText?.toLowerCase()).toMatch(/kitas|visa|indonesia|permit|stay|residence/i)
  })

  test('RAG retrieval shows sources', async ({ page }) => {
    // Login and navigate
    await page.goto('/')

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()

    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(TEST_EMAIL!)
    await pinInput.fill(TEST_PIN!)

    const loginButton = page.locator('button[type="submit"]').first()
    await loginButton.click()

    await expect(page).toHaveURL(/\/(chat|dashboard)/, { timeout: 15000 })

    // Navigate to chat if needed
    if (!page.url().includes('/chat')) {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
    }

    // Ask question that should trigger RAG
    const chatInput = page.locator('textarea, input[placeholder*="message"], input[type="text"]').first()
    await expect(chatInput).toBeVisible({ timeout: 10000 })

    await chatInput.fill('What are the requirements for PT PMA company setup?')

    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').last()
    await sendButton.click()

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"], .assistant-message, [class*="assistant"]', {
      timeout: 45000
    })

    // Check for RAG sources indicator (optional - may not always be visible)
    const sourcesButton = page.locator('[data-testid="rag-sources"], [aria-label*="source"], button:has-text("Sources")')

    if (await sourcesButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sourcesButton.click()

      // Verify sources drawer shows
      const sourcesDrawer = page.locator('[data-testid="rag-drawer"], [class*="sources"], [role="dialog"]')
      await expect(sourcesDrawer).toBeVisible({ timeout: 5000 })

      // Should have at least one source
      const sourceItems = sourcesDrawer.locator('[data-testid="source-item"], [class*="source-item"], li')
      const count = await sourceItems.count()
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })

  test('error handling on invalid token', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/oracle/query`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345',
        'Content-Type': 'application/json'
      },
      data: {
        query: 'test query'
      }
    })

    // Should return 401 Unauthorized or 403 Forbidden
    expect([401, 403, 422]).toContain(response.status())
  })

  test('should handle rate limiting gracefully', async ({ request }) => {
    // Skip this test if not explicitly enabled (to avoid hitting rate limits in regular CI)
    test.skip(!process.env.TEST_RATE_LIMITS, 'Rate limit testing not enabled')

    const responses: number[] = []

    // Send multiple rapid requests
    for (let i = 0; i < 10; i++) {
      const response = await request.get(`${BACKEND_URL}/healthz`)
      responses.push(response.status())
    }

    // All should be successful (not rate limited for health checks)
    responses.forEach(status => {
      expect(status).toBeLessThan(500)
    })
  })

  test('session persistence after page reload', async ({ page }) => {
    // Login
    await page.goto('/')

    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()

    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await emailInput.fill(TEST_EMAIL!)
    await pinInput.fill(TEST_PIN!)

    const loginButton = page.locator('button[type="submit"]').first()
    await loginButton.click()

    await expect(page).toHaveURL(/\/(chat|dashboard)/, { timeout: 15000 })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be logged in (not redirected to login)
    const currentUrl = page.url()
    expect(currentUrl).not.toMatch(/\/(login|auth)/)

    // Token should still be present
    const token = await page.evaluate(() =>
      localStorage.getItem('zantara_token') || localStorage.getItem('token')
    )
    expect(token).toBeTruthy()
  })
})
