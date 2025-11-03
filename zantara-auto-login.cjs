/**
 * ZANTARA Auto-Login Script with Playwright
 * ==========================================
 * 
 * Automatically logs in to ZANTARA webapp with your profile:
 * - Name: ZERO
 * - Email: zero@balizero.com
 * - PIN: 010719
 * 
 * Usage:
 *   node zantara-auto-login.js
 */

const { chromium } = require('playwright');

// Configuration
const CONFIG = {
  // ZANTARA webapp URL
  url: 'https://zantara.balizero.com',
  
  // Your credentials
  profile: {
    name: 'ZERO',
    email: 'zero@balizero.com',
    pin: '010719'
  },
  
  // Browser options
  headless: false,  // Set to true for headless mode
  slowMo: 500,      // Slow down actions by 500ms for visibility
  
  // Viewport
  viewport: {
    width: 1920,
    height: 1080
  },
  
  // Screenshots
  screenshots: true,
  screenshotPath: './screenshots'
};

async function loginToZantara() {
  console.log('🚀 Starting ZANTARA Auto-Login...\n');
  
  // Launch browser
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Enable console logging from page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ [PAGE ERROR]:', msg.text());
    }
  });
  
  try {
    console.log(`📍 Navigating to: ${CONFIG.url}`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle' });
    
    if (CONFIG.screenshots) {
      await page.screenshot({ path: 'screenshot-01-homepage.png' });
      console.log('📸 Screenshot saved: screenshot-01-homepage.png');
    }
    
    console.log('✅ Page loaded\n');
    
    // Wait a moment for page to fully load
    await page.waitForTimeout(2000);
    
    // Look for login button/link
    console.log('🔍 Looking for login button...');
    
    // Try multiple selectors for login
    const loginSelectors = [
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'a:has-text("Login")',
      'a:has-text("Sign In")',
      '[data-testid="login-button"]',
      '.login-button',
      '#login'
    ];
    
    let loginFound = false;
    for (const selector of loginSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Found login element: ${selector}`);
          await element.click();
          loginFound = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!loginFound) {
      console.log('⚠️  No login button found - assuming already on login page or logged in');
    }
    
    if (CONFIG.screenshots) {
      await page.screenshot({ path: 'screenshot-02-login-page.png' });
      console.log('📸 Screenshot saved: screenshot-02-login-page.png');
    }
    
    // Fill in credentials
    console.log('\n📝 Filling in credentials...');
    
    // Try to find and fill name field
    const nameSelectors = [
      'input[name="name"]',
      'input[placeholder*="name" i]',
      'input[type="text"]:first-of-type',
      '#name'
    ];
    
    for (const selector of nameSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.fill(CONFIG.profile.name);
          console.log(`✅ Name filled: ${CONFIG.profile.name}`);
          break;
        }
      } catch (e) {}
    }
    
    // Try to find and fill email field
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      '#email'
    ];
    
    for (const selector of emailSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.fill(CONFIG.profile.email);
          console.log(`✅ Email filled: ${CONFIG.profile.email}`);
          break;
        }
      } catch (e) {}
    }
    
    // Try to find and fill PIN/password field
    const pinSelectors = [
      'input[name="pin"]',
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="pin" i]',
      'input[placeholder*="password" i]',
      '#pin',
      '#password'
    ];
    
    for (const selector of pinSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.fill(CONFIG.profile.pin);
          console.log(`✅ PIN filled: ${CONFIG.profile.pin}`);
          break;
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(1000);
    
    if (CONFIG.screenshots) {
      await page.screenshot({ path: 'screenshot-03-credentials-filled.png' });
      console.log('📸 Screenshot saved: screenshot-03-credentials-filled.png');
    }
    
    // Submit login form
    console.log('\n🔐 Submitting login...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'button:has-text("Submit")',
      '[data-testid="submit-button"]'
    ];
    
    for (const selector of submitSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          console.log(`✅ Clicked submit button`);
          break;
        }
      } catch (e) {}
    }
    
    // Wait for navigation after login
    console.log('⏳ Waiting for login to complete...');
    await page.waitForTimeout(3000);
    
    if (CONFIG.screenshots) {
      await page.screenshot({ path: 'screenshot-04-logged-in.png' });
      console.log('📸 Screenshot saved: screenshot-04-logged-in.png');
    }
    
    // Check if logged in successfully
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    // Look for elements that indicate successful login
    const loggedInIndicators = [
      'text=Welcome',
      'text=Dashboard',
      'text=Logout',
      'text=Profile',
      '[data-testid="user-menu"]'
    ];
    
    let loggedIn = false;
    for (const indicator of loggedInIndicators) {
      try {
        const element = await page.$(indicator);
        if (element) {
          loggedIn = true;
          console.log(`✅ Login successful! (Found: ${indicator})`);
          break;
        }
      } catch (e) {}
    }
    
    if (!loggedIn) {
      console.log('⚠️  Could not confirm login - manual verification needed');
    }
    
    console.log('\n🎉 Auto-login process complete!');
    console.log('🌐 Browser will remain open for manual interaction');
    console.log('⌨️  Press Ctrl+C to close browser\n');
    
    // Keep browser open for manual interaction
    console.log('💡 You can now manually test the application');
    console.log('💡 Use the browser console (F12) to add test logger if needed\n');
    
    // Wait indefinitely (until user closes or Ctrl+C)
    await page.waitForTimeout(999999999);
    
  } catch (error) {
    console.error('\n❌ Error during login:', error.message);
    
    if (CONFIG.screenshots) {
      await page.screenshot({ path: 'screenshot-error.png' });
      console.log('📸 Error screenshot saved: screenshot-error.png');
    }
    
  } finally {
    // Don't auto-close - let user interact
    console.log('\n⏸️  Browser session active - close manually or Ctrl+C to exit');
  }
}

// Run the script
loginToZantara().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
