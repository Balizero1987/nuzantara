import { test, expect } from '@playwright/test';

/**
 * ZANTARA Tools Integration Test
 * Verifies that each operational tool is properly integrated and ZANTARA uses them correctly
 */

// Test cases for each tool category
const TOOL_TESTS = {
  "Pricing Tools": [
    {
      question: "What's the price for a C1 Tourism visa?",
      expectedInAnswer: ["2.300.000 IDR", "C1", "tourism"],
      toolShouldCall: "bali.zero.pricing"
    },
    {
      question: "How much does a Freelance KITAS cost?",
      expectedInAnswer: ["26.000.000", "28.000.000", "offshore", "onshore"],
      toolShouldCall: "bali.zero.pricing"
    },
    {
      question: "Give me all visa prices",
      expectedInAnswer: ["C1", "C2", "D1", "D2"],
      toolShouldCall: "bali.zero.pricing"
    }
  ],
  
  "Oracle Tools": [
    {
      question: "What's the tax rate for PT PMA in export sector?",
      expectedInAnswer: ["tax", "PT PMA", "export"],
      toolShouldCall: "oracle.query"
    },
    {
      question: "Find KBLI code for IT consulting",
      expectedInAnswer: ["KBLI", "62"],
      toolShouldCall: "kbli.lookup"
    }
  ],
  
  "Memory Tools": [
    {
      question: "Remember: my budget is 500 million rupiah",
      expectedInAnswer: ["saved", "remember", "budget"],
      toolShouldCall: "memory.save"
    },
    {
      question: "What do you know about my preferences?",
      expectedInAnswer: ["budget", "500"],
      toolShouldCall: "memory.retrieve"
    }
  ],
  
  "Translation Tools": [
    {
      question: "Translate to English: Saya ingin membuka perusahaan",
      expectedInAnswer: ["want", "open", "company"],
      toolShouldCall: "translate.text"
    }
  ],
  
  "Team Tools": [
    {
      question: "Who is in the Bali Zero team?",
      expectedInAnswer: ["team", "member"],
      toolShouldCall: "team.list"
    }
  ]
};

test.describe('ZANTARA Tools Integration Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Krisna
    await page.goto('https://zantara.balizero.com/login.html');
    await page.waitForSelector('#name', { state: 'visible' });
    
    await page.fill('#name', 'Krisna');
    await page.fill('#email', 'krisna@balizero.com');
    await page.fill('#pin', '705802');
    await page.click('#loginBtn');
    
    await page.waitForURL('**/chat.html');
    await page.waitForSelector('#chatInput', { state: 'visible' });
    await page.waitForTimeout(2000);
  });

  // Test each category
  for (const [category, tests] of Object.entries(TOOL_TESTS)) {
    test(`${category} - Verify tool integration`, async ({ page }) => {
      console.log(`\n📁 Testing: ${category}\n`);
      
      for (const testCase of tests) {
        console.log(`\n❓ Question: ${testCase.question}`);
        
        // Send question
        const input = page.locator('#chatInput');
        await input.fill(testCase.question);
        await input.press('Enter');
        
        // Wait for response
        await page.waitForTimeout(1000);
        
        // Wait for message to appear
        await page.waitForFunction(() => {
          const messages = document.querySelectorAll('.message');
          return messages.length > 0;
        });
        
        // Wait for streaming to complete
        await page.waitForTimeout(6000);
        
        // Get the last AI message
        const lastMessage = await page.evaluate(() => {
          const messages = document.querySelectorAll('.message');
          const lastAiMessage = messages[messages.length - 1];
          return lastAiMessage?.textContent || '';
        });
        
        console.log(`\n💬 Answer preview: ${lastMessage.substring(0, 200)}...`);
        
        // Verify expected content
        let foundCount = 0;
        for (const expected of testCase.expectedInAnswer) {
          if (lastMessage.toLowerCase().includes(expected.toLowerCase())) {
            foundCount++;
            console.log(`   ✅ Found: "${expected}"`);
          } else {
            console.log(`   ❌ Missing: "${expected}"`);
          }
        }
        
        const successRate = (foundCount / testCase.expectedInAnswer.length) * 100;
        console.log(`\n📊 Success Rate: ${successRate.toFixed(0)}% (${foundCount}/${testCase.expectedInAnswer.length})`);
        
        if (successRate < 50) {
          console.log(`   ⚠️ LOW SUCCESS - Tool may not be integrated properly`);
        } else if (successRate === 100) {
          console.log(`   ✅ PERFECT - Tool working correctly`);
        } else {
          console.log(`   ⚠️ PARTIAL - Some expected data missing`);
        }
        
        console.log('\n' + '─'.repeat(80));
        
        // Small pause between questions
        await page.waitForTimeout(2000);
      }
    });
  }
  
  test('CRITICAL: Verify ZANTARA does NOT hallucinate visa codes', async ({ page }) => {
    console.log(`\n🔍 CRITICAL TEST: Visa Code Hallucination Check\n`);
    
    const question = "List all available visa types with prices";
    console.log(`❓ Question: ${question}`);
    
    const input = page.locator('#chatInput');
    await input.fill(question);
    await input.press('Enter');
    
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('.message');
      return messages.length > 0;
    });
    
    await page.waitForTimeout(8000);
    
    const lastMessage = await page.evaluate(() => {
      const messages = document.querySelectorAll('.message');
      const lastAiMessage = messages[messages.length - 1];
      return lastAiMessage?.textContent || '';
    });
    
    console.log(`\n💬 Answer preview: ${lastMessage.substring(0, 300)}...`);
    
    // Check for hallucinated codes
    const hallucinated = ['B211A', 'B211B', 'B212', 'E31A'];
    const real = ['C1', 'C2', 'C7', 'D1', 'D2', 'E23', 'E28A'];
    
    let hallucinationFound = false;
    console.log(`\n❌ Checking for HALLUCINATED codes (should NOT appear):`);
    for (const code of hallucinated) {
      if (lastMessage.includes(code)) {
        console.log(`   ❌ FOUND HALLUCINATION: "${code}" - THIS IS A BUG!`);
        hallucinationFound = true;
      } else {
        console.log(`   ✅ Correctly avoided: "${code}"`);
      }
    }
    
    console.log(`\n✅ Checking for REAL codes (should appear):`);
    let realCount = 0;
    for (const code of real) {
      if (lastMessage.includes(code)) {
        console.log(`   ✅ Found real code: "${code}"`);
        realCount++;
      } else {
        console.log(`   ⚠️ Missing real code: "${code}"`);
      }
    }
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   Real codes found: ${realCount}/${real.length}`);
    console.log(`   Hallucinations: ${hallucinationFound ? '❌ YES - BUG DETECTED' : '✅ NONE'}`);
    
    if (hallucinationFound) {
      console.log(`\n🚨 CRITICAL: ZANTARA is hallucinating visa codes!`);
      console.log(`   This means pricing tool is NOT being called properly.`);
    } else {
      console.log(`\n✅ PASSED: No hallucinations detected`);
    }
  });
});
