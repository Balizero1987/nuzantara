/**
 * ZANTARA Interactive Testing Session
 * ====================================
 * 
 * Auto-login + Interactive browser with test logger pre-loaded
 * 
 * Features:
 * - Automatic login with your profile
 * - Test logger injected in console
 * - Ready for 50 test questions
 * - Screenshots at each step
 * 
 * Usage:
 *   node zantara-testing-session.cjs
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  url: 'https://zantara.balizero.com',
  profile: {
    name: 'ZERO',
    email: 'zero@balizero.com',
    pin: '010719'
  },
  headless: false,
  slowMo: 300,
  viewport: { width: 1920, height: 1080 },
  screenshotDir: './testing-screenshots'
};

// Browser console test logger (injected into page)
const TEST_LOGGER_SCRIPT = `
(function() {
  window.ZANTARA_TEST_LOG = {
    startTime: Date.now(),
    queries: [],
    currentTest: null
  };

  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const startTime = performance.now();
    const url = args[0];
    
    console.log('%c🔵 [REQUEST]', 'color: blue; font-weight: bold', {
      url: url,
      timestamp: new Date().toISOString(),
      testNumber: window.ZANTARA_TEST_LOG.currentTest
    });
    
    return originalFetch.apply(this, args).then(response => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      response.clone().json().then(data => {
        const logEntry = {
          testNumber: window.ZANTARA_TEST_LOG.currentTest,
          timestamp: new Date().toISOString(),
          url: url,
          duration: Math.round(duration),
          status: response.status,
          data: data
        };
        
        window.ZANTARA_TEST_LOG.queries.push(logEntry);
        
        console.log('%c🟢 [RESPONSE]', 'color: green; font-weight: bold', {
          duration: Math.round(duration) + 'ms',
          status: response.status,
          cached: data.data?.optimization?.cache_used || false,
          domains: data.data?.total_domains || 'N/A'
        });
      }).catch(e => console.log('⚠️ [PARSE ERROR]', e));
      
      return response;
    });
  };

  window.TEST = function(num, query) {
    window.ZANTARA_TEST_LOG.currentTest = num;
    console.log('%c' + '═'.repeat(60), 'color: orange; font-weight: bold');
    console.log('%c📝 TEST ' + num + '/50: ' + query, 'color: orange; font-weight: bold; font-size: 14px');
    console.log('%c' + '═'.repeat(60), 'color: orange; font-weight: bold');
  };

  window.EXPORT_LOGS = function() {
    const logs = JSON.stringify(window.ZANTARA_TEST_LOG, null, 2);
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zantara-browser-logs-' + Date.now() + '.json';
    a.click();
    console.log('%c✅ Logs exported!', 'color: green; font-weight: bold; font-size: 16px');
  };

  window.TEST_SUMMARY = function() {
    const logs = window.ZANTARA_TEST_LOG.queries;
    if (logs.length === 0) {
      console.log('⚠️ No tests recorded yet!');
      return;
    }
    const avgTime = Math.round(logs.reduce((sum, q) => sum + q.duration, 0) / logs.length);
    const fastest = Math.min(...logs.map(q => q.duration));
    const slowest = Math.max(...logs.map(q => q.duration));
    
    console.log('%c📊 TEST SUMMARY', 'color: purple; font-weight: bold; font-size: 16px');
    console.log('%c' + '═'.repeat(60), 'color: purple');
    console.log('Total Tests: ' + logs.length);
    console.log('Average Time: ' + avgTime + 'ms');
    console.log('Fastest: ' + fastest + 'ms');
    console.log('Slowest: ' + slowest + 'ms');
    console.log('Success Rate: ' + logs.filter(q => q.status === 200).length + '/' + logs.length);
    console.log('%c' + '═'.repeat(60), 'color: purple');
  };

  console.log('%c✅ ZANTARA Test Logger initialized!', 'color: green; font-weight: bold; font-size: 16px');
  console.log('%c📝 Use: TEST(1, "your query") before each test', 'color: blue');
  console.log('%c💾 Use: EXPORT_LOGS() to download results', 'color: blue');
  console.log('%c📊 Use: TEST_SUMMARY() for quick stats', 'color: blue');
})();
`;

async function runTestingSession() {
  console.log('🚀 Starting ZANTARA Testing Session\n');
  console.log('Profile: ZERO (zero@balizero.com)');
  console.log('Webapp: ' + CONFIG.url + '\n');
  
  // Create screenshots directory
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }
  
  const browser = await chromium.launch({
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });
  
  const context = await browser.newContext({
    viewport: CONFIG.viewport,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // Log page console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[REQUEST]') || text.includes('[RESPONSE]') || text.includes('TEST')) {
      console.log('🌐 [BROWSER]:', text.substring(0, 100));
    }
  });
  
  try {
    // Step 1: Navigate to webapp
    console.log('📍 Step 1: Navigating to webapp...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, '01-homepage.png') });
    console.log('✅ Loaded homepage\n');
    
    await page.waitForTimeout(2000);
    
    // Step 2: Find and click login
    console.log('📍 Step 2: Looking for login...');
    const loginSelectors = [
      'button:has-text("Login")',
      'a:has-text("Login")',
      'button:has-text("Sign In")',
      '.login-button',
      '[href*="login"]'
    ];
    
    let clicked = false;
    for (const selector of loginSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn && await btn.isVisible()) {
          await btn.click();
          console.log('✅ Clicked login button');
          clicked = true;
          break;
        }
      } catch (e) {}
    }
    
    if (!clicked) {
      console.log('⚠️  No login button found - trying direct navigation');
      // Try common login URLs
      const loginUrls = ['/login', '/signin', '/auth/login'];
      for (const url of loginUrls) {
        try {
          await page.goto(CONFIG.url + url, { waitUntil: 'networkidle' });
          break;
        } catch (e) {}
      }
    }
    
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, '02-login-page.png') });
    console.log('✅ On login page\n');
    
    // Step 3: Fill credentials
    console.log('📍 Step 3: Filling credentials...');
    
    // Fill name
    try {
      await page.fill('input[name="name"], input[placeholder*="name" i]', CONFIG.profile.name);
      console.log('✅ Name: ' + CONFIG.profile.name);
    } catch (e) {
      console.log('⚠️  Name field not found');
    }
    
    // Fill email
    try {
      await page.fill('input[type="email"], input[name="email"]', CONFIG.profile.email);
      console.log('✅ Email: ' + CONFIG.profile.email);
    } catch (e) {
      console.log('⚠️  Email field not found');
    }
    
    // Fill PIN
    try {
      await page.fill('input[type="password"], input[name="pin"], input[name="password"]', CONFIG.profile.pin);
      console.log('✅ PIN: ' + CONFIG.profile.pin);
    } catch (e) {
      console.log('⚠️  PIN field not found');
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, '03-credentials-filled.png') });
    console.log('✅ Credentials filled\n');
    
    // Step 4: Submit login
    console.log('📍 Step 4: Submitting login...');
    try {
      await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Submit")');
      console.log('✅ Clicked submit');
    } catch (e) {
      console.log('⚠️  Submit button not found - trying Enter key');
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, '04-after-login.png') });
    console.log('✅ Login submitted\n');
    
    // Step 5: Inject test logger
    console.log('📍 Step 5: Injecting test logger into page...');
    await page.evaluate(TEST_LOGGER_SCRIPT);
    await page.waitForTimeout(500);
    console.log('✅ Test logger injected\n');
    
    // Step 6: Ready for testing
    console.log('🎉 Session ready!\n');
    console.log('═'.repeat(60));
    console.log('📊 TESTING INSTRUCTIONS');
    console.log('═'.repeat(60));
    console.log('1. Open browser console (F12 → Console tab)');
    console.log('2. You will see: "✅ ZANTARA Test Logger initialized!"');
    console.log('3. Before each test, type: TEST(1, "your question")');
    console.log('4. Ask your question in the webapp');
    console.log('5. Repeat for all 50 tests');
    console.log('6. At the end, type: TEST_SUMMARY()');
    console.log('7. To download logs, type: EXPORT_LOGS()');
    console.log('═'.repeat(60));
    console.log('\n💡 Browser will stay open - close manually when done\n');
    
    // Keep browser open
    await page.waitForTimeout(999999999);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, 'error.png') });
  }
}

// Run
console.log('\n🎯 ZANTARA Interactive Testing Session');
console.log('━'.repeat(60));
runTestingSession().catch(console.error);
