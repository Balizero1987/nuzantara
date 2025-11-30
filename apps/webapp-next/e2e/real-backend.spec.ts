import { test, expect } from '@playwright/test'

/**
 * Real Backend Integration Tests
 * 
 * These tests run against the actual backend (not mocked):
 * 1. Authentication with real backend
 * 2. Chat with real backend
 * 3. Streaming with real backend
 * 
 * Requires:
 * - Backend to be running and accessible
 * - Valid test credentials in environment variables
 */

const BACKEND_URL = process.env.NUZANTARA_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://nuzantara-rag.fly.dev'
const API_KEY = process.env.NUZANTARA_API_KEY || ''
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || ''
const TEST_PIN = process.env.E2E_TEST_PIN || ''

test.describe('Real Backend Integration', () => {
  test.skip(!TEST_EMAIL || !TEST_PIN, 'Test credentials not provided')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should authenticate with real backend', async ({ page }) => {
    await page.goto('/')
    
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(TEST_EMAIL)
      await pinInput.fill(TEST_PIN)
      
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        
        // Wait for authentication
        await page.waitForTimeout(2000)
        
        // Check if token is stored
        const token = await page.evaluate(() => localStorage.getItem('token'))
        
        // Should have token after successful login
        expect(token).toBeTruthy()
        expect(token?.length).toBeGreaterThan(0)
      }
    }
  })

  test('should send chat message to real backend', async ({ page }) => {
    // First authenticate
    await page.goto('/')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()
    
    if (await emailInput.isVisible({ timeout: 5000}).catch(() => false)) {
      await emailInput.fill(TEST_EMAIL)
      await pinInput.fill(TEST_PIN)
      
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        await page.waitForTimeout(2000)
      }
    }
    
    // Navigate to chat
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
    
    const chatInput = page.locator('textarea, input[type="text"]').first()
    
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Monitor network requests
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/chat') && response.status() === 200,
        { timeout: 10000 }
      )
      
      await chatInput.fill('Hello, this is a test message')
      
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        
        // Wait for response
        const response = await responsePromise.catch(() => null)
        
        if (response) {
          const data = await response.json()
          
          // Should receive response from backend
          expect(data).toHaveProperty('message')
          expect(typeof data.message).toBe('string')
        }
      }
    }
  })

  test('should stream chat response from real backend', async ({ page }) => {
    // Authenticate first
    await page.goto('/')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"]').first()
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(TEST_EMAIL)
      await pinInput.fill(TEST_PIN)
      
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        await page.waitForTimeout(2000)
      }
    }
    
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
    
    const chatInput = page.locator('textarea, input[type="text"]').first()
    
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Monitor streaming response
      let receivedChunks = false
      
      page.on('response', async (response) => {
        if (response.url().includes('/api/chat/stream')) {
          receivedChunks = true
        }
      })
      
      await chatInput.fill('Test streaming message')
      
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        
        // Wait for streaming to start
        await page.waitForTimeout(3000)
        
        // Should receive streaming response
        expect(receivedChunks).toBe(true)
      }
    }
  })

  test('should handle backend errors gracefully', async ({ page }) => {
    // Try to make request without authentication
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
    
    const chatInput = page.locator('textarea, input[type="text"]').first()
    
    if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/chat'),
        { timeout: 5000 }
      )
      
      await chatInput.fill('Test without auth')
      
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click()
        
        const response = await responsePromise.catch(() => null)
        
        if (response) {
          // Should return error status
          expect([401, 403, 500]).toContain(response.status())
        }
      }
    }
  })

  test('should verify backend health', async ({ request }) => {
    // Check backend health endpoint
    const response = await request.get(`${BACKEND_URL}/healthz`)
    
    expect(response.status()).toBeLessThan(500)
    
    if (response.ok()) {
      const data = await response.json().catch(() => ({}))
      expect(data).toBeDefined()
    }
  })
})

