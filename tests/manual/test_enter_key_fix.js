/**
 * Test script per verificare che il tasto Invio funzioni correttamente
 * Usa Node.js con puppeteer per testare l'interfaccia
 */

const puppeteer = require('puppeteer');

async function testEnterKey() {
  console.log('🧪 Starting Enter key test...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Mostra il browser per vedere cosa succede
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Navigate to syncra.html
    console.log('📄 Loading syncra.html...');
    await page.goto('http://localhost:8080/syncra.html', { waitUntil: 'networkidle2' });
    
    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Check if message input exists
    const inputExists = await page.$('#message-input');
    if (!inputExists) {
      console.error('❌ Message input not found!');
      return false;
    }
    console.log('✅ Message input found');
    
    // Check if safeSend function exists
    const safeSendExists = await page.evaluate(() => typeof window.safeSend === 'function');
    if (!safeSendExists) {
      console.error('❌ window.safeSend function not found!');
      return false;
    }
    console.log('✅ window.safeSend function exists');
    
    // Type a test message
    console.log('\n📝 Typing test message...');
    await page.type('#message-input', 'Test message from automated test');
    await page.waitForTimeout(500);
    
    // Set up message listener
    let messageSent = false;
    await page.exposeFunction('onMessageSent', () => {
      messageSent = true;
    });
    
    // Override safeSend to track if it's called
    await page.evaluate(() => {
      const originalSafeSend = window.safeSend;
      window.safeSend = function() {
        console.log('✅ safeSend called!');
        window.onMessageSent();
        return originalSafeSend.apply(this, arguments);
      };
    });
    
    // Press Enter key
    console.log('⌨️  Pressing Enter key...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // Check if message was sent
    if (messageSent) {
      console.log('\n✅ SUCCESS! Enter key triggered message send');
      return true;
    } else {
      console.log('\n❌ FAILED! Enter key did not trigger message send');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  } finally {
    if (browser) {
      setTimeout(async () => {
        await browser.close();
        console.log('\n🔚 Browser closed');
        process.exit(0);
      }, 3000);
    }
  }
}

// Run the test
testEnterKey().then(success => {
  if (success) {
    console.log('\n✅ ALL TESTS PASSED');
  } else {
    console.log('\n❌ TESTS FAILED');
  }
});
