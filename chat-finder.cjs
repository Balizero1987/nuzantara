/**
 * ZANTARA Chat Finder & Helper
 * =============================
 * 
 * Finds chat interface and helps interact with it
 */

const { chromium } = require('playwright');

async function findAndUseChat() {
  console.log('🔍 ZANTARA Chat Finder\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Navigating to ZANTARA...');
    await page.goto('https://zantara.balizero.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('✅ Page loaded\n');
    
    // Try to login first
    console.log('🔐 Attempting login...');
    try {
      await page.fill('input[type="email"]', 'zero@balizero.com');
      await page.fill('input[type="password"]', '010719');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      console.log('✅ Login attempted\n');
    } catch (e) {
      console.log('⚠️  Login fields not found, might be already logged in\n');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'chat-finder-01-page.png' });
    console.log('📸 Screenshot: chat-finder-01-page.png\n');
    
    // Search for chat input elements
    console.log('🔍 Looking for chat input...\n');
    
    const chatSelectors = [
      'input[type="text"]',
      'textarea',
      'input[placeholder*="message" i]',
      'input[placeholder*="chat" i]',
      'input[placeholder*="ask" i]',
      'input[placeholder*="question" i]',
      'textarea[placeholder*="message" i]',
      '[contenteditable="true"]',
      '.chat-input',
      '#chat-input',
      '[data-testid="chat-input"]',
      '[role="textbox"]'
    ];
    
    let foundInput = null;
    let foundSelector = null;
    
    for (const selector of chatSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          for (const el of elements) {
            const isVisible = await el.isVisible();
            if (isVisible) {
              foundInput = el;
              foundSelector = selector;
              console.log(`✅ Found visible input: ${selector}`);
              
              // Get element details
              const tag = await el.evaluate(e => e.tagName);
              const placeholder = await el.evaluate(e => e.placeholder || e.getAttribute('placeholder') || 'none');
              const id = await el.evaluate(e => e.id || 'none');
              const className = await el.evaluate(e => e.className || 'none');
              
              console.log(`   Tag: ${tag}`);
              console.log(`   Placeholder: ${placeholder}`);
              console.log(`   ID: ${id}`);
              console.log(`   Class: ${className}\n`);
              
              break;
            }
          }
        }
        if (foundInput) break;
      } catch (e) {}
    }
    
    if (!foundInput) {
      console.log('❌ No chat input found!\n');
      console.log('💡 Checking page structure...\n');
      
      // Get all interactive elements
      const allInputs = await page.$$('input, textarea, [contenteditable]');
      console.log(`Found ${allInputs.length} total input elements\n`);
      
      // Get page text
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page contains:');
      console.log(bodyText.substring(0, 500) + '...\n');
      
      // Check for buttons that might open chat
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on page\n`);
      
      for (const btn of buttons) {
        const text = await btn.evaluate(b => b.textContent || '');
        if (text.toLowerCase().includes('chat') || 
            text.toLowerCase().includes('message') ||
            text.toLowerCase().includes('ask') ||
            text.toLowerCase().includes('talk')) {
          console.log(`💡 Found potential chat trigger button: "${text}"`);
          try {
            await btn.click();
            console.log('   ✅ Clicked!');
            await page.waitForTimeout(2000);
            
            // Try finding input again
            const newInput = await page.$('input[type="text"], textarea');
            if (newInput && await newInput.isVisible()) {
              foundInput = newInput;
              foundSelector = 'Found after clicking button';
              console.log('   ✅ Chat opened!\n');
              break;
            }
          } catch (e) {
            console.log('   ❌ Could not click:', e.message);
          }
        }
      }
    }
    
    // Take another screenshot
    await page.screenshot({ path: 'chat-finder-02-search-complete.png' });
    console.log('📸 Screenshot: chat-finder-02-search-complete.png\n');
    
    if (foundInput) {
      console.log('🎉 SUCCESS! Chat input found!\n');
      console.log('═'.repeat(60));
      console.log('📝 READY TO TEST');
      console.log('═'.repeat(60));
      console.log(`Selector: ${foundSelector}`);
      console.log('\n💡 You can now type messages in the chat!\n');
      console.log('💡 Press F12 to open console and use TEST() functions\n');
      
      // Try to focus the input
      await foundInput.focus();
      console.log('✅ Input focused and ready\n');
      
      // Inject test logger
      console.log('📍 Injecting test logger...');
      await page.evaluate(`
        (function() {
          window.ZANTARA_TEST_LOG = { startTime: Date.now(), queries: [], currentTest: null };
          const originalFetch = window.fetch;
          window.fetch = function(...args) {
            const startTime = performance.now();
            console.log('🔵 [REQUEST]', args[0]);
            return originalFetch.apply(this, args).then(response => {
              const duration = performance.now() - startTime;
              console.log('🟢 [RESPONSE]', Math.round(duration) + 'ms');
              return response;
            });
          };
          window.TEST = function(num, query) {
            window.ZANTARA_TEST_LOG.currentTest = num;
            console.log('\\n' + '═'.repeat(60));
            console.log('📝 TEST ' + num + '/50: ' + query);
            console.log('═'.repeat(60) + '\\n');
          };
          console.log('✅ Test logger active!');
        })();
      `);
      console.log('✅ Test logger injected!\n');
      
    } else {
      console.log('❌ Could not find chat input!\n');
      console.log('💡 Manual investigation needed\n');
      console.log('📸 Check screenshots for visual reference\n');
    }
    
    console.log('🌐 Browser will stay open - inspect manually\n');
    console.log('⌨️  Press Ctrl+C to close\n');
    
    // Keep browser open
    await page.waitForTimeout(999999999);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'chat-finder-error.png' });
  }
}

console.log('\n🎯 ZANTARA Chat Finder & Helper');
console.log('━'.repeat(60) + '\n');
findAndUseChat().catch(console.error);
