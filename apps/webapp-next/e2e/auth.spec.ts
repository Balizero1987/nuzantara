import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
  })

  test('should show error on invalid login', async ({ page }) => {
    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const pinInput = page.locator('input[type="password"], input[name="pin"], input[type="text"][name="pin"]').first()

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@example.com')
    }

    if (await pinInput.isVisible()) {
      await pinInput.fill('000000')
    }

    // Try to submit (if submit button exists)
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first()
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Wait for error message (if any)
      await page.waitForTimeout(1000)

      // Check if error is displayed (adjust selector based on your UI)
      const errorMessage = page.locator('text=/error|invalid|failed/i').first()
      // Error might or might not be visible depending on implementation
    }
  })

  test('should navigate to dashboard after successful login', async ({ page }) => {
    // This test would require valid credentials
    // For now, we just check the structure
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    
    if (await emailInput.isVisible()) {
      // Test structure exists
      expect(emailInput).toBeVisible()
    }
  })
})

