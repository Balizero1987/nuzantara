/**
 * ZANTARA Direct Chat Access
 * ===========================
 * 
 * Goes directly to /chat with faster loading
 */

const { chromium } = require('playwright');

async function accessChat() {
  console.log('🚀 ZANTARA Direct Chat Access\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📍 Step 1: Going to homepage first...');
    await page.goto('https://zantara.balizero.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForTimeout(2000);
    console.log('✅ Homepage loaded\n');
    
    console.log('📍 Step 2: Filling login...');
    await page.fill('input[type="email"]', 'zero@balizero.com');
    await page.fill('input[type="password"]', '010719');
    console.log('✅ Credentials filled\n');
    
    console.log('📍 Step 3: Submitting...');
    await page.click('button:has-text("Accedi")');
    await page.waitForTimeout(3000);
    console.log('✅ Submitted\n');
    
    console.log('📍 Step 4: Navigating to /chat...');
    await page.goto('https://zantara.balizero.com/chat', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    await page.waitForTimeout(3000);
    console.log('✅ Chat page loaded\n');
    
    await page.screenshot({ path: 'direct-chat.png' });
    
    console.log('📍 Step 5: Finding chat input...');
    const chatSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      'input[placeholder*="messag" i]',
      'input[placeholder*="domand" i]'
    ];
    
    let foundInput = null;
    for (const selector of chatSelectors) {
      try {
        const el = await page.$(selector);
        if (el && await el.isVisible()) {
          foundInput = el;
          const tag = await el.evaluate(e => e.tagName);
          const placeholder = await el.evaluate(e => e.placeholder || '');
          console.log(`✅ Found: ${tag} - "${placeholder}"`);
          break;
        }
      } catch (e) {}
    }
    
    if (!foundInput) {
      console.log('❌ Chat input not found!\n');
      const text = await page.evaluate(() => document.body.innerText);
      console.log('Page content:\n', text.substring(0, 500));
    } else {
      console.log('\n🎉 SUCCESS! Chat ready!\n');
      
      // Inject logger
      await page.evaluate(`
        (function() {
          window.TEST_LOG = { queries: [], current: null };
          const origFetch = window.fetch;
          window.fetch = function(...args) {
            const start = performance.now();
            console.log('🔵 REQUEST:', args[0]);
            return origFetch.apply(this, args).then(r => {
              console.log('🟢 RESPONSE:', Math.round(performance.now() - start) + 'ms');
              return r;
            });
          };
          window.TEST = function(n, q) {
            window.TEST_LOG.current = n;
            console.log('\\n═'.repeat(35));
            console.log('📝 TEST ' + n + ': ' + q);
            console.log('═'.repeat(35) + '\\n');
          };
          window.EXPORT = function() {
            const blob = new Blob([JSON.stringify(window.TEST_LOG, null, 2)], {type: 'application/json'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'test-logs-' + Date.now() + '.json';
            a.click();
            console.log('✅ Exported!');
          };
          console.log('✅ Test logger ready! Use: TEST(1, "query")');
        })();
      `);
      console.log('✅ Test logger injected!\n');
      
      await foundInput.focus();
      console.log('✅ Input focused\n');
      
      console.log('═'.repeat(70));
      console.log('🎉 READY TO TEST!');
      console.log('═'.repeat(70));
      console.log('\n💡 INSTRUCTIONS:');
      console.log('   1. Press F12 to open console');
      console.log('   2. Type: TEST(1, "your question")');
      console.log('   3. Ask your question in the chat');
      console.log('   4. Repeat for all tests');
      console.log('   5. Use EXPORT() to download logs\n');
    }
    
    console.log('🌐 Browser open - Ctrl+C to close\n');
    await page.waitForTimeout(999999999);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error.png' });
  }
}

console.log('\n🎯 ZANTARA Direct Chat Access');
console.log('━'.repeat(70) + '\n');
accessChat().catch(console.error);
