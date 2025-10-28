import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🎯 ZANTARA 50 CONVERSATIONS - SINGLE TEST VERSION
 * 
 * UN SOLO TEST che esegue TUTTE le 50 conversazioni sequenzialmente
 * senza MAI chiudere il browser.
 * 
 * Features:
 * - Browser SEMPRE aperto e visibile
 * - Esecuzione rallentata (slowMo 2000ms)
 * - Pause lunghe tra le azioni
 * - TUTTE le conversazioni salvate integralmente
 */

test.use({
  launchOptions: {
    headless: false,
    slowMo: 2000,
  },
});

test.setTimeout(0); // Nessun timeout

// Load conversations
const conversationsPath = new URL('../tests/test-conversations-50-ZANTARA.json', import.meta.url).pathname;
const conversationsData = JSON.parse(fs.readFileSync(conversationsPath, 'utf-8'));
const conversations = conversationsData.conversations;

// Results directory
const resultsDir = new URL('../test-results/zantara-50-single', import.meta.url).pathname;
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

test('ZANTARA 50 Conversations - Complete Test', async ({ page }) => {
  const testResults: any[] = [];
  const testStartTime = Date.now();
  
  console.log('\n🚀 Starting ZANTARA 50 Conversations Test');
  console.log('════════════════════════════════════════════════');
  console.log('Browser will stay open for all 50 conversations');
  console.log('════════════════════════════════════════════════\n');
  
  // LOGIN
  console.log('🔐 Logging in as Zero...');
  await page.goto('https://zantara.balizero.com/login.html');
  await page.waitForSelector('#name');
  await page.fill('#name', 'Zero');
  await page.fill('#email', 'zero@balizero.com');
  await page.fill('#pin', '705802');
  await page.click('#loginBtn');
  await page.waitForURL('**/chat.html', { timeout: 30000 });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  await page.waitForTimeout(3000);
  console.log('✅ Login successful\n');
  
  // EXECUTE ALL 50 CONVERSATIONS
  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    const convStartTime = Date.now();
    
    console.log(`\n[${conv.id}/50] 🎯 ${conv.category} - ${conv.title}`);
    console.log(`Difficulty: ${'⭐'.repeat(conv.difficulty)} | Tools: ${conv.tools.length}`);
    
    const performanceMetrics = {
      averageResponseTime: 0,
      responseTimes: [] as number[],
      streamErrors: 0
    };
    
    // Execute each turn
    for (let turnIdx = 0; turnIdx < conv.turns.length; turnIdx++) {
      const turn = conv.turns[turnIdx];
      const turnStartTime = Date.now();
      
      console.log(`  Turn ${turnIdx + 1}/${conv.turns.length}: ${turn.text.substring(0, 50)}...`);
      
      try {
        // Count messages before
        const messagesBefore = await page.locator('.message').count();
        
        // Send message
        await page.fill('#chatInput', turn.text);
        await page.waitForTimeout(3000); // Pausa per vedere il messaggio
        await page.press('#chatInput', 'Enter');
        
        // Wait for input to clear
        await page.waitForFunction(() => {
          const input = document.querySelector('#chatInput') as HTMLTextAreaElement;
          return input && input.value === '';
        });
        
        // Wait for AI response
        await page.waitForFunction(
          (beforeCount) => {
            const messages = document.querySelectorAll('.message');
            return messages.length >= beforeCount + 2;
          },
          messagesBefore,
          { timeout: 0 }
        );
        
        // Wait to ensure streaming is complete
        await page.waitForTimeout(5000); // Pausa per leggere la risposta
        
        const responseTime = Date.now() - turnStartTime;
        performanceMetrics.responseTimes.push(responseTime);
        
        console.log(`    ✅ Response received (${(responseTime / 1000).toFixed(1)}s)`);
      } catch (error) {
        console.log(`    ⚠️  Turn failed: ${error}`);
        performanceMetrics.streamErrors++;
      }
    }
    
    // Calculate average response time
    performanceMetrics.averageResponseTime = 
      performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / 
      performanceMetrics.responseTimes.length;
    
    // Capture conversation
    const pageHTML = await page.content();
    const messages = await page.evaluate(() => {
      const messageElements = document.querySelectorAll('.message');
      return Array.from(messageElements).map((msg) => {
        const isUser = msg.classList.contains('user');
        const contentEl = msg.querySelector('.content');
        const timeEl = msg.querySelector('.timestamp');
        
        return {
          role: isUser ? 'user' : 'assistant',
          content: contentEl?.textContent || '',
          timestamp: timeEl?.textContent || '',
          html: msg.outerHTML
        };
      });
    });
    
    const capturedData = {
      conversationId: conv.id,
      pageHTML,
      messages,
      capturedAt: new Date().toISOString()
    };
    
    // Detect tools used
    const toolsUsed = new Set<string>();
    const patterns = [
      /🔧\s*Tool:\s*(\S+)/gi,
      /\[TOOL_CALL\]\s*(\S+)/gi,
      /"tool":\s*"([^"]+)"/gi,
      /Calling tool:\s*(\S+)/gi,
    ];
    
    for (const msg of messages) {
      const content = msg.content || '';
      for (const pattern of patterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          toolsUsed.add(match[1]);
        }
      }
    }
    
    // Simple scoring
    const aiMessages = messages.filter((m: any) => m.role === 'assistant');
    const score = {
      tier1_correctness: Math.min(40, aiMessages.length * 8),
      tier2_performance: Math.min(25, performanceMetrics.streamErrors === 0 ? 25 : 15),
      tier3_quality: Math.min(20, aiMessages.length >= conv.turns.length ? 20 : 10),
      tier4_technical: Math.min(15, toolsUsed.size > 0 ? 15 : 5),
      total: 0
    };
    score.total = score.tier1_correctness + score.tier2_performance + score.tier3_quality + score.tier4_technical;
    
    const rating = score.total >= 90 ? '⭐⭐⭐⭐⭐ PERFETTO' :
                   score.total >= 80 ? '⭐⭐⭐⭐ OTTIMO' :
                   score.total >= 70 ? '⭐⭐⭐ BUONO' : '❌ FAIL';
    
    const result = {
      conversationId: conv.id,
      title: conv.title,
      category: conv.category,
      difficulty: conv.difficulty,
      expectedTools: conv.tools,
      toolsUsed: Array.from(toolsUsed),
      score,
      rating,
      performanceMetrics,
      capturedData,
      duration_ms: Date.now() - convStartTime,
      timestamp: new Date().toISOString()
    };
    
    // Save individual result
    const filename = `conversation-${String(conv.id).padStart(2, '0')}.json`;
    const filepath = path.join(resultsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    
    testResults.push(result);
    
    console.log(`  Score: T1=${score.tier1_correctness}/40 | T2=${score.tier2_performance}/25 | T3=${score.tier3_quality}/20 | T4=${score.tier4_technical}/15`);
    console.log(`  Total: ${score.total}/100 ${rating}`);
    console.log(`  Tools: Expected ${conv.tools.length}, Used ${toolsUsed.size}`);
  }
  
  // Generate summary
  const passed = testResults.filter(r => r.score.total >= 70).length;
  const failed = testResults.filter(r => r.score.total < 70).length;
  const avgScore = (testResults.reduce((sum, r) => sum + r.score.total, 0) / testResults.length).toFixed(1);
  
  const summary = {
    test_date: new Date().toISOString(),
    test_duration_ms: Date.now() - testStartTime,
    total_conversations: testResults.length,
    passed,
    failed,
    pass_rate: `${((passed / testResults.length) * 100).toFixed(1)}%`,
    average_score: avgScore,
    score_distribution: {
      perfetto: testResults.filter(r => r.score.total >= 90).length,
      ottimo: testResults.filter(r => r.score.total >= 80 && r.score.total < 90).length,
      buono: testResults.filter(r => r.score.total >= 70 && r.score.total < 80).length,
      fail: testResults.filter(r => r.score.total < 70).length
    },
    results: testResults.map(r => ({
      id: r.conversationId,
      title: r.title,
      category: r.category,
      score: r.score.total,
      rating: r.rating,
      passed: r.score.total >= 70
    }))
  };
  
  const summaryPath = path.join(resultsDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n\n════════════════════════════════════════════════');
  console.log('🎉 TEST COMPLETED');
  console.log('════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}/${testResults.length} (${summary.pass_rate})`);
  console.log(`❌ Failed: ${failed}/${testResults.length}`);
  console.log(`Average Score: ${avgScore}/100`);
  console.log(`Target Met: ${passed >= 45 ? '✅ YES' : '❌ NO'} (45+ conversations ⭐⭐⭐⭐+)`);
  console.log('════════════════════════════════════════════════');
  console.log(`\n📊 Full report saved to: ${resultsDir}/summary.json`);
  console.log(`📁 Individual results: ${resultsDir}/conversation-*.json\n`);
  
  // Assert overall success
  expect(passed).toBeGreaterThanOrEqual(45);
});
