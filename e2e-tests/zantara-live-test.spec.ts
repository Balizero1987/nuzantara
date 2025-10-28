import { test } from '@playwright/test';
import * as fs from 'fs';

// Load questions
const questionsData = JSON.parse(fs.readFileSync('./test-questions.json', 'utf-8'));

test('ZANTARA 100 Questions - Live Test', async ({ page }) => {
  console.log('\n🚀 ZANTARA 100 QUESTIONS TEST\n');

  // ===== LOGIN =====
  console.log('🔐 Logging in as Krisna...');
  await page.goto('https://zantara.balizero.com/login.html');
  await page.waitForSelector('#name', { state: 'visible' });
  
  await page.fill('#name', 'Krisna');
  await page.fill('#email', 'krisna@balizero.com');
  await page.fill('#pin', '705802');
  await page.click('#loginBtn');
  
  await page.waitForURL('**/chat.html');
  await page.waitForSelector('#chatInput', { state: 'visible' });
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Login successful\n');
  await page.waitForTimeout(2000);

  // ===== PROCESS QUESTIONS =====
  let questionNumber = 1;
  
  for (const category of questionsData.categories) {
    console.log(`\n📁 ${category.name.toUpperCase()}\n`);
    
    // Pause between categories to read results
    if (questionNumber > 1) {
      await page.waitForTimeout(3000);
    }
    
    for (const question of category.questions) {
      console.log(`[${questionNumber}/102] 📤 ${question.substring(0, 70)}${question.length > 70 ? '...' : ''}`);
      
      // Type question
      const input = page.locator('#chatInput');
      await input.fill(question);
      
      // Press Enter
      await input.press('Enter');
      
      // Wait for input to clear (message sent)
      await page.waitForFunction(() => {
        const el = document.querySelector('#chatInput') as HTMLTextAreaElement;
        return el && el.value === '';
      });
      
      // Wait a bit for AI to start responding
      await page.waitForTimeout(1000);
      
      // Wait for response to appear (check that new message exists)
      await page.waitForFunction(
        (num) => {
          const messages = document.querySelectorAll('.message');
          return messages.length >= num;
        },
        questionNumber * 2 // Each Q&A = 2 messages
      );
      
      // Give time to see the response streaming and read it
      await page.waitForTimeout(5000);
      
      console.log(`    ✅ Response received\n`);
      
      questionNumber++;
    }
  }

  console.log('\n\n🎉 ===== TEST COMPLETED! 102 QUESTIONS =====\n');
  
  // Final pause
  await page.waitForTimeout(5000);
});
