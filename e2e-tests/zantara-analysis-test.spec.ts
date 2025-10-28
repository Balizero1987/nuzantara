import { test } from '@playwright/test';
import * as fs from 'fs';

// Load questions
const questionsData = JSON.parse(fs.readFileSync('./test-questions.json', 'utf-8'));

test('ZANTARA Answer Analysis Test', async ({ page }) => {
  console.log('\n🔍 ZANTARA ANSWER ANALYSIS TEST\n');

  const results: any[] = [];

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

  // ===== ANALYZE ONLY FIRST 5 COMPLEX QUESTIONS =====
  const complexQuestions = questionsData.categories[0].questions.slice(0, 5);
  let questionNumber = 1;

  console.log('📁 ANALYZING COMPLEX BUSINESS SCENARIOS\n');

  for (const question of complexQuestions) {
    console.log(`\n[${questionNumber}/5] 📤 Question:\n${question}\n`);
    
    // Type question
    const input = page.locator('#chatInput');
    await input.fill(question);
    await input.press('Enter');
    
    // Wait for input to clear
    await page.waitForFunction(() => {
      const el = document.querySelector('#chatInput') as HTMLTextAreaElement;
      return el && el.value === '';
    });
    
    // Wait for AI to start responding
    await page.waitForTimeout(2000);
    
    // Wait for response to appear
    await page.waitForFunction(
      (num) => {
        const messages = document.querySelectorAll('.message');
        return messages.length >= num;
      },
      questionNumber * 2
    );
    
    // Wait for streaming to complete (longer for complex answers)
    await page.waitForTimeout(8000);
    
    // Extract the last AI message
    const lastMessage = await page.evaluate(() => {
      const messages = document.querySelectorAll('.message');
      const lastAiMessage = messages[messages.length - 1];
      return {
        text: lastAiMessage?.textContent || '',
        html: lastAiMessage?.innerHTML || ''
      };
    });
    
    console.log(`\n💬 Answer Preview (first 500 chars):\n${lastMessage.text.substring(0, 500)}...\n`);
    console.log(`📊 Answer Length: ${lastMessage.text.length} characters\n`);
    
    // Analyze answer quality
    const analysis = {
      questionNumber,
      question,
      answer: lastMessage.text,
      answerLength: lastMessage.text.length,
      hasNumbers: /\d/.test(lastMessage.text),
      hasCurrency: /(Rp|USD|IDR)/.test(lastMessage.text),
      hasTimeline: /(bulan|tahun|minggu|hari)/.test(lastMessage.text),
      hasComparison: /(vs|versus|bandingkan|compare)/.test(lastMessage.text),
      mentionsPTMA: /PT PMA/i.test(lastMessage.text),
      mentionsVisa: /(visa|KITAS|KITAP)/i.test(lastMessage.text),
      mentionsTax: /(pajak|tax|PPh|PPN)/i.test(lastMessage.text),
      mentionsLegal: /(legal|hukum|izin|peraturan)/i.test(lastMessage.text),
    };
    
    results.push(analysis);
    
    console.log('✅ Analysis completed\n');
    console.log('─'.repeat(80));
    
    questionNumber++;
  }

  // ===== SAVE RESULTS =====
  const outputPath = './test-analysis-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    testDate: new Date().toISOString(),
    totalQuestions: 5,
    results: results,
    summary: {
      avgAnswerLength: results.reduce((sum, r) => sum + r.answerLength, 0) / results.length,
      allHadNumbers: results.every(r => r.hasNumbers),
      allHadCurrency: results.every(r => r.hasCurrency),
      allMentionedPTMA: results.every(r => r.mentionsPTMA),
      anyErrors: results.some(r => r.answer.includes('error') || r.answer.includes('maaf'))
    }
  }, null, 2));
  
  console.log(`\n\n📊 ===== ANALYSIS SUMMARY =====\n`);
  console.log(`Average Answer Length: ${Math.round(results.reduce((sum, r) => sum + r.answerLength, 0) / results.length)} chars`);
  console.log(`All had numeric data: ${results.every(r => r.hasNumbers) ? '✅' : '❌'}`);
  console.log(`All had currency: ${results.every(r => r.hasCurrency) ? '✅' : '❌'}`);
  console.log(`All mentioned PT PMA: ${results.every(r => r.mentionsPTMA) ? '✅' : '❌'}`);
  console.log(`\nFull results saved to: ${outputPath}\n`);
  
  await page.waitForTimeout(3000);
});
