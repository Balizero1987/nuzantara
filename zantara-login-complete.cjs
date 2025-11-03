/**
 * ZANTARA Complete Login + Chat Access
 * =====================================
 * 
 * Completes full login flow and waits for chat to appear
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  url: 'https://zantara.balizero.com/chat',
  profile: {
    name: 'ZERO',
    email: 'zero@balizero.com',
    pin: '010719'
  }
};

async function loginAndAccessChat() {
  console.log('🚀 ZANTARA Complete Login + Chat Access\n');
  console.log('Profile:', CONFIG.profile.name);
  console.log('Email:', CONFIG.profile.email);
  console.log('URL:', CONFIG.url);
  console.log('\n' + '═'.repeat(60) + '\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate
    console.log('📍 Step 1/5: Navigating to ZANTARA...');
    await page.goto(CONFIG.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'login-01-homepage.png' });
    console.log('✅ Loaded\n');
    
    // Step 2: Fill login form
    console.log('📍 Step 2/5: Filling login form...');
    
    // Fill Name
    try {
      const nameInput = await page.$('input[placeholder*="Nome" i], input[name="name"]');
      if (nameInput) {
        await nameInput.fill(CONFIG.profile.name);
        console.log('✅ Name:', CONFIG.profile.name);
      }
    } catch (e) {
      console.log('⚠️  Name field not found');
    }
    
    // Fill Email
    try {
      const emailInput = await page.$('input[type="email"], input[placeholder*="Email" i], input[name="email"]');
      if (emailInput) {
        await emailInput.fill(CONFIG.profile.email);
        console.log('✅ Email:', CONFIG.profile.email);
      }
    } catch (e) {
      console.log('❌ Email field not found!');
    }
    
    // Fill PIN
    try {
      const pinInput = await page.$('input[placeholder*="PIN" i], input[name="pin"], input[type="password"]');
      if (pinInput) {
        await pinInput.fill(CONFIG.profile.pin);
        console.log('✅ PIN: ••••••');
      }
    } catch (e) {
      console.log('❌ PIN field not found!');
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'login-02-form-filled.png' });
    console.log('✅ Form filled\n');
    
    // Step 3: Submit
    console.log('📍 Step 3/5: Submitting login...');
    
    // Try to find and click submit button
    const submitSelectors = [
      'button:has-text("Accedi")',
      'button:has-text("Login")',
      'button[type="submit"]',
      'button:has-text("→")'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          console.log(`✅ Clicked: ${selector}`);
          submitted = true;
          break;
        }
      } catch (e) {}
    }
    
    if (!submitted) {
      console.log('⚠️  Button not found, trying Enter key...');
      await page.keyboard.press('Enter');
    }
    
    console.log('⏳ Waiting for navigation...\n');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'login-03-after-submit.png' });
    
    // Step 4: Wait for chat interface
    console.log('📍 Step 4/5: Waiting for chat interface to load...');
    
    // Try multiple times to find chat input
    let chatInput = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!chatInput && attempts < maxAttempts) {
      attempts++;
      console.log(`⏳ Attempt ${attempts}/${maxAttempts}...`);
      
      // Comprehensive selectors for chat input
      const chatSelectors = [
        'textarea',
        'input[type="text"]',
        '[contenteditable="true"]',
        'input[placeholder*="message" i]',
        'input[placeholder*="domanda" i]',
        'input[placeholder*="chiedi" i]',
        'textarea[placeholder*="message" i]',
        '.chat-input',
        '#chat-input',
        '[role="textbox"]',
        'input:not([type="email"]):not([type="password"]):not([name="name"])'
      ];
      
      for (const selector of chatSelectors) {
        try {
          const elements = await page.$$(selector);
          for (const el of elements) {
            const isVisible = await el.isVisible();
            const isEnabled = await el.isEnabled();
            if (isVisible && isEnabled) {
              chatInput = el;
              console.log(`✅ Found chat input: ${selector}`);
              
              // Get details
              const placeholder = await el.evaluate(e => e.placeholder || '');
              const tag = await el.evaluate(e => e.tagName);
              console.log(`   Type: ${tag}`);
              console.log(`   Placeholder: "${placeholder}"`);
              break;
            }
          }
          if (chatInput) break;
        } catch (e) {}
      }
      
      if (!chatInput) {
        await page.waitForTimeout(2000);
      }
    }
    
    if (!chatInput) {
      console.log('\n❌ Chat input not found after login!\n');
      console.log('💡 Checking what\'s on the page...\n');
      
      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page shows:');
      console.log(pageContent.substring(0, 800) + '...\n');
      
      await page.screenshot({ path: 'login-04-no-chat-found.png' });
      console.log('📸 Screenshot saved: login-04-no-chat-found.png\n');
      
      console.log('🔍 Manual inspection needed\n');
      console.log('❓ Possible issues:');
      console.log('   - Wrong credentials');
      console.log('   - Chat requires additional action to open');
      console.log('   - Page still loading');
      console.log('   - Different UI structure\n');
      
    } else {
      console.log('\n🎉 SUCCESS! Chat is ready!\n');
      await page.screenshot({ path: 'login-04-chat-ready.png' });
      
      // Step 5: Inject test logger
      console.log('📍 Step 5/5: Injecting test logger...');
      await page.evaluate(`
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
              test: window.ZANTARA_TEST_LOG.currentTest,
              timestamp: new Date().toISOString()
            });
            
            return originalFetch.apply(this, args).then(response => {
              const duration = performance.now() - startTime;
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
                  cached: data.data?.optimization?.cache_used || false
                });
              }).catch(() => {});
              return response;
            });
          };
          
          window.TEST = function(num, query) {
            window.ZANTARA_TEST_LOG.currentTest = num;
            console.log('%c' + '═'.repeat(70), 'color: orange; font-weight: bold');
            console.log('%c📝 TEST ' + num + '/50: ' + query, 'color: orange; font-weight: bold; font-size: 14px');
            console.log('%c' + '═'.repeat(70), 'color: orange; font-weight: bold');
          };
          
          window.EXPORT_LOGS = function() {
            const logs = JSON.stringify(window.ZANTARA_TEST_LOG, null, 2);
            const blob = new Blob([logs], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'zantara-test-logs-' + Date.now() + '.json';
            a.click();
            console.log('%c✅ Logs exported!', 'color: green; font-weight: bold; font-size: 16px');
          };
          
          window.TEST_SUMMARY = function() {
            const logs = window.ZANTARA_TEST_LOG.queries;
            if (logs.length === 0) {
              console.log('⚠️ No tests yet!');
              return;
            }
            const avgTime = Math.round(logs.reduce((s, q) => s + q.duration, 0) / logs.length);
            console.log('%c📊 TEST SUMMARY', 'color: purple; font-weight: bold; font-size: 16px');
            console.log('Total: ' + logs.length);
            console.log('Avg Time: ' + avgTime + 'ms');
            console.log('Success: ' + logs.filter(q => q.status === 200).length + '/' + logs.length);
          };
          
          console.log('%c✅ ZANTARA Test Logger READY!', 'color: green; font-weight: bold; font-size: 18px');
          console.log('%c━'.repeat(70), 'color: green');
          console.log('%c📝 Use: TEST(1, "your query")', 'color: blue; font-size: 12px');
          console.log('%c💾 Use: EXPORT_LOGS()', 'color: blue; font-size: 12px');
          console.log('%c📊 Use: TEST_SUMMARY()', 'color: blue; font-size: 12px');
          console.log('%c━'.repeat(70), 'color: green');
        })();
      `);
      console.log('✅ Test logger injected!\n');
      
      // Focus chat input
      await chatInput.focus();
      console.log('✅ Chat input focused\n');
      
      console.log('═'.repeat(70));
      console.log('🎉 ALL READY - YOU CAN START TESTING!');
      console.log('═'.repeat(70));
      console.log('\n💡 INSTRUCTIONS:');
      console.log('   1. Press F12 to open browser console');
      console.log('   2. You will see: "✅ ZANTARA Test Logger READY!"');
      console.log('   3. Type in console: TEST(1, "your first question")');
      console.log('   4. Type your question in the chat box');
      console.log('   5. Repeat for all 50 tests');
      console.log('   6. Use TEST_SUMMARY() to see stats');
      console.log('   7. Use EXPORT_LOGS() to download results\n');
    }
    
    console.log('🌐 Browser will stay open\n');
    console.log('⌨️  Press Ctrl+C in terminal to close\n');
    
    // Keep open
    await page.waitForTimeout(999999999);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'login-error.png' });
    console.log('📸 Error screenshot: login-error.png\n');
  }
}

console.log('\n🎯 ZANTARA Complete Login + Chat Access');
console.log('━'.repeat(70) + '\n');
loginAndAccessChat().catch(console.error);
