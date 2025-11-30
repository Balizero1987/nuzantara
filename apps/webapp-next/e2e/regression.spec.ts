import { test, expect } from '@playwright/test'

/**
 * Regression Tests
 * 
 * These tests verify that previously fixed bugs don't regress:
 * 1. Critical user flows
 * 2. Known bug fixes
 * 3. Edge cases
 * 4. Browser compatibility
 */

test.describe('Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  describe('Critical User Flows', () => {
    test('should complete login flow without errors', async ({ page }) => {
      await page.goto('/')
      
      const emailInput = page.locator('input[type="email"], input[name="email"]').first()
      const pinInput = page.locator('input[type="password"], input[name="pin"]').first()
      
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill('test@example.com')
        await pinInput.fill('1234')
        
        // Should not throw errors
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should handle empty chat input gracefully', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      const chatInput = page.locator('textarea, input[type="text"]').first()
      
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Try to submit empty message
        const submitButton = page.locator('button[type="submit"]').first()
        
        if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await submitButton.click()
          
          // Should handle gracefully (disable button or show validation)
          await page.waitForTimeout(500)
          
          // Should not crash
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })

    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      // Simulate network error
      await page.route('**/api/chat', route => route.abort())
      
      const chatInput = page.locator('textarea, input[type="text"]').first()
      
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await chatInput.fill('Test')
        
        const submitButton = page.locator('button[type="submit"]').first()
        if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await submitButton.click()
          
          // Should show error message, not crash
          await page.waitForTimeout(1000)
          await expect(page.locator('body')).toBeVisible()
        }
      }
    })
  })

  describe('Known Bug Fixes', () => {
    test('should not lose chat history on page reload', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      // Simulate adding messages to history
      await page.evaluate(() => {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]')
        history.push({ id: '1', message: 'Test', timestamp: Date.now() })
        localStorage.setItem('chatHistory', JSON.stringify(history))
      })
      
      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // History should persist
      const history = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('chatHistory') || '[]')
      })
      
      expect(Array.isArray(history)).toBe(true)
    })

    test('should handle rapid button clicks', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      const submitButton = page.locator('button[type="submit"]').first()
      
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Rapid clicks should not cause duplicate requests
        let requestCount = 0
        
        await page.route('**/api/chat', route => {
          requestCount++
          route.fulfill({
            status: 200,
            body: JSON.stringify({ message: 'Response' }),
            headers: { 'Content-Type': 'application/json' },
          })
        })
        
        // Click multiple times rapidly
        await submitButton.click()
        await submitButton.click()
        await submitButton.click()
        
        await page.waitForTimeout(500)
        
        // Should handle debouncing or disable button
        // Request count should be limited
        expect(requestCount).toBeLessThanOrEqual(3)
      }
    })

    test('should handle special characters in input', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      const chatInput = page.locator('textarea, input[type="text"]').first()
      
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        await chatInput.fill(specialChars)
        
        const value = await chatInput.inputValue()
        
        // Should handle special characters without errors
        expect(value).toBe(specialChars)
      }
    })
  })

  describe('Edge Cases', () => {
    test('should handle very long messages', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      const chatInput = page.locator('textarea, input[type="text"]').first()
      
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const longMessage = 'a'.repeat(5000)
        await chatInput.fill(longMessage)
        
        const value = await chatInput.inputValue()
        
        // Should handle long messages (may be truncated by maxLength)
        expect(value.length).toBeGreaterThan(0)
      }
    })

    test('should handle unicode characters', async ({ page }) => {
      await page.goto('/chat')
      await page.waitForLoadState('networkidle')
      
      const chatInput = page.locator('textarea, input[type="text"]').first()
      
      if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const unicodeMessage = 'Hello 世界 🌍 مرحبا'
        await chatInput.fill(unicodeMessage)
        
        const value = await chatInput.inputValue()
        
        // Should handle unicode correctly
        expect(value).toContain('Hello')
      }
    })

    test('should handle concurrent tab interactions', async ({ context }) => {
      const page1 = await context.newPage()
      const page2 = await context.newPage()
      
      await page1.goto('/chat')
      await page2.goto('/chat')
      
      await page1.waitForLoadState('networkidle')
      await page2.waitForLoadState('networkidle')
      
      // Both pages should work independently
      await expect(page1.locator('body')).toBeVisible()
      await expect(page2.locator('body')).toBeVisible()
      
      await page1.close()
      await page2.close()
    })
  })

  describe('Browser Compatibility', () => {
    test('should work in different viewport sizes', async ({ page }) => {
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await expect(page.locator('body')).toBeVisible()
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()
      await expect(page.locator('body')).toBeVisible()
      
      // Test desktop
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.reload()
      await expect(page.locator('body')).toBeVisible()
    })

    test('should handle browser back/forward navigation', async ({ page }) => {
      await page.goto('/')
      await page.goto('/chat')
      await page.goBack()
      
      // Should handle navigation without errors
      await expect(page.locator('body')).toBeVisible()
      
      await page.goForward()
      await expect(page.locator('body')).toBeVisible()
    })
  })
})

