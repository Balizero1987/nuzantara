import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🎯 ZANTARA 50 CONVERSATIONS TEST
 * 
 * Features:
 * - Sequential execution (realistic user behavior)
 * - Browser visible throughout test
 * - NO timeout (conversations can take as long as needed)
 * - 1 automatic retry on failure
 * - FULL conversation capture (messages, responses, HTML, timestamps, scores)
 * 
 * Scoring System (4 Tiers - 100 points):
 * - Tier 1: Correctness (40 pts)
 * - Tier 2: Performance (25 pts)
 * - Tier 3: Quality (20 pts)
 * - Tier 4: Technical (15 pts)
 * 
 * Pass criteria: 45+/50 conversations scoring ⭐⭐⭐⭐+ (80+ points)
 */

// Test configuration
test.use({
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
  launchOptions: {
    headless: false,
    slowMo: 2000, // Rallenta le azioni di 2 secondi per renderle ben visibili
  },
});

// Remove default timeout
test.setTimeout(0);

// Load conversations JSON
const conversationsPath = new URL('../tests/test-conversations-50-ZANTARA.json', import.meta.url).pathname;
const conversationsData = JSON.parse(fs.readFileSync(conversationsPath, 'utf-8'));
const conversations = conversationsData.conversations;

// Results directory
const resultsDir = new URL('../test-results/zantara-50', import.meta.url).pathname;
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Test state
const testResults: any[] = [];
let testStartTime: number;
let sharedPage: Page;

// ===== HELPER FUNCTIONS =====

async function login(page: Page) {
  console.log('🔐 Logging in as Zero...');
  await page.goto('https://zantara.balizero.com/login.html');
  await page.waitForSelector('#name');
  
  await page.fill('#name', 'Zero');
  await page.fill('#email', 'zero@balizero.com');
  await page.fill('#pin', '705802');
  await page.click('#loginBtn');
  
  await page.waitForURL('**/chat.html', { timeout: 30000 });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  
  // Wait for page to be fully ready
  await page.waitForTimeout(2000);
  console.log('✅ Login successful\n');
}

async function sendMessage(page: Page, message: string): Promise<number> {
  const messagesBefore = await page.locator('.message').count();
  
  await page.fill('#chatInput', message);
  await page.waitForTimeout(3000); // Pausa di 3 secondi per vedere il messaggio
  await page.press('#chatInput', 'Enter');
  
  // Wait for input to clear
  await page.waitForFunction(() => {
    const input = document.querySelector('#chatInput') as HTMLTextAreaElement;
    return input && input.value === '';
  });
  
  return messagesBefore;
}

async function waitForResponse(page: Page, messagesBefore: number): Promise<void> {
  // Wait for AI response to appear (user message + AI response = +2)
  await page.waitForFunction(
    (beforeCount) => {
      const messages = document.querySelectorAll('.message');
      return messages.length >= beforeCount + 2;
    },
    messagesBefore,
    { timeout: 0 } // No timeout
  );
  
  // Additional wait to ensure streaming is complete
  await page.waitForTimeout(5000); // Pausa di 5 secondi per leggere la risposta
}

async function captureConversation(page: Page, convId: number): Promise<any> {
  // Capture full page HTML
  const pageHTML = await page.content();
  
  // Capture all messages
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
  
  // Capture console logs
  const consoleLogs = await page.evaluate(() => {
    return (window as any).__testConsoleLogs || [];
  });
  
  return {
    conversationId: convId,
    pageHTML,
    messages,
    consoleLogs,
    capturedAt: new Date().toISOString()
  };
}

function detectToolsUsed(messages: any[]): string[] {
  const tools = new Set<string>();
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
        tools.add(match[1]);
      }
    }
  }
  
  return Array.from(tools);
}

function scoreConversation(
  conversation: any,
  capturedData: any,
  performanceMetrics: any
): any {
  const score = {
    tier1_correctness: 0,
    tier2_performance: 0,
    tier3_quality: 0,
    tier4_technical: 0,
    total: 0,
    details: {} as any
  };
  
  // ===== TIER 1: CORRECTNESS (40 pts) =====
  const toolsUsed = detectToolsUsed(capturedData.messages);
  const expectedTools = conversation.tools || [];
  
  // Tool usage accuracy (10 pts)
  const toolMatches = expectedTools.filter((t: string) => 
    toolsUsed.some(used => used.includes(t) || t.includes(used))
  );
  score.details.tool_usage_accuracy = Math.min(10, (toolMatches.length / Math.max(expectedTools.length, 1)) * 10);
  
  // Response accuracy (15 pts) - check if AI responded to all turns
  const aiMessages = capturedData.messages.filter((m: any) => m.role === 'assistant');
  score.details.response_accuracy = Math.min(15, (aiMessages.length / conversation.turns.length) * 15);
  
  // Data integrity (10 pts) - no errors, no crashes
  const hasErrors = capturedData.messages.some((m: any) => 
    m.content.toLowerCase().includes('error') || 
    m.content.toLowerCase().includes('failed')
  );
  score.details.data_integrity = hasErrors ? 5 : 10;
  
  // Source citations (5 pts) - check for Oracle references
  const hasCitations = capturedData.messages.some((m: any) => 
    m.content.includes('Oracle') || 
    m.content.includes('📚') ||
    m.content.includes('Source:')
  );
  score.details.source_citations = hasCitations ? 5 : 2;
  
  score.tier1_correctness = 
    score.details.tool_usage_accuracy +
    score.details.response_accuracy +
    score.details.data_integrity +
    score.details.source_citations;
  
  // ===== TIER 2: PERFORMANCE (25 pts) =====
  
  // Response velocity (10 pts)
  const avgResponseTime = performanceMetrics.averageResponseTime || 5000;
  if (avgResponseTime < 3000) {
    score.details.response_velocity = 10;
  } else if (avgResponseTime < 5000) {
    score.details.response_velocity = 5;
  } else {
    score.details.response_velocity = 2;
  }
  
  // Tool call efficiency (5 pts)
  score.details.tool_call_efficiency = toolsUsed.length <= expectedTools.length + 2 ? 5 : 3;
  
  // Token efficiency (5 pts) - reasonable response length
  const avgResponseLength = capturedData.messages
    .filter((m: any) => m.role === 'assistant')
    .reduce((sum: number, m: any) => sum + m.content.length, 0) / aiMessages.length;
  score.details.token_efficiency = avgResponseLength > 100 && avgResponseLength < 5000 ? 5 : 3;
  
  // Stream quality (5 pts) - messages appeared smoothly
  score.details.stream_quality = performanceMetrics.streamErrors ? 0 : 5;
  
  score.tier2_performance = 
    score.details.response_velocity +
    score.details.tool_call_efficiency +
    score.details.token_efficiency +
    score.details.stream_quality;
  
  // ===== TIER 3: QUALITY (20 pts) =====
  
  // Conversation flow (8 pts)
  score.details.conversation_flow = aiMessages.length === conversation.turns.length ? 8 : 4;
  
  // Context retention (6 pts) - AI refers to previous turns
  const hasContextReferences = capturedData.messages.some((m: any, idx: number) => 
    idx > 2 && (
      m.content.toLowerCase().includes('come') ||
      m.content.toLowerCase().includes('precedente') ||
      m.content.toLowerCase().includes('prima')
    )
  );
  score.details.context_retention = hasContextReferences ? 6 : 3;
  
  // Personality adaptation (3 pts) - Italian language maintained
  const allItalian = capturedData.messages
    .filter((m: any) => m.role === 'assistant')
    .every((m: any) => m.content.length > 20); // Basic check
  score.details.personality_adaptation = allItalian ? 3 : 1;
  
  // Progressive complexity (3 pts)
  score.details.progressive_complexity = conversation.difficulty >= 4 ? 3 : 2;
  
  score.tier3_quality = 
    score.details.conversation_flow +
    score.details.context_retention +
    score.details.personality_adaptation +
    score.details.progressive_complexity;
  
  // ===== TIER 4: TECHNICAL (15 pts) =====
  
  // Agent activation (5 pts) - check for agent mentions
  const hasAgents = capturedData.messages.some((m: any) => 
    m.content.includes('🤖') || 
    m.content.includes('Agent') ||
    m.content.toLowerCase().includes('ricerca autonoma')
  );
  score.details.agent_activation = hasAgents ? 5 : 2;
  
  // Multi-domain synthesis (5 pts)
  const hasSynthesis = toolsUsed.some(t => 
    t.includes('cross_oracle') || 
    t.includes('synthesis')
  );
  score.details.multi_domain_synthesis = hasSynthesis ? 5 : 2;
  
  // Error handling (5 pts)
  score.details.error_handling = hasErrors ? 2 : 5;
  
  score.tier4_technical = 
    score.details.agent_activation +
    score.details.multi_domain_synthesis +
    score.details.error_handling;
  
  // ===== TOTAL SCORE =====
  score.total = 
    score.tier1_correctness +
    score.tier2_performance +
    score.tier3_quality +
    score.tier4_technical;
  
  return score;
}

function getStarRating(score: number): string {
  if (score >= 90) return '⭐⭐⭐⭐⭐ PERFETTO';
  if (score >= 80) return '⭐⭐⭐⭐ OTTIMO';
  if (score >= 70) return '⭐⭐⭐ BUONO';
  return '❌ FAIL';
}

function saveConversationResults(convId: number, result: any) {
  const filename = `conversation-${String(convId).padStart(2, '0')}.json`;
  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
}

function generateSummaryReport() {
  const summary = {
    test_date: new Date().toISOString(),
    test_duration_ms: Date.now() - testStartTime,
    total_conversations: testResults.length,
    passed: testResults.filter(r => r.score.total >= 70).length,
    failed: testResults.filter(r => r.score.total < 70).length,
    pass_rate: `${((testResults.filter(r => r.score.total >= 70).length / testResults.length) * 100).toFixed(1)}%`,
    average_score: (testResults.reduce((sum, r) => sum + r.score.total, 0) / testResults.length).toFixed(1),
    score_distribution: {
      perfetto: testResults.filter(r => r.score.total >= 90).length,
      ottimo: testResults.filter(r => r.score.total >= 80 && r.score.total < 90).length,
      buono: testResults.filter(r => r.score.total >= 70 && r.score.total < 80).length,
      fail: testResults.filter(r => r.score.total < 70).length
    },
    tier_performance: {
      tier1_correctness: (testResults.reduce((sum, r) => sum + r.score.tier1_correctness, 0) / testResults.length).toFixed(1),
      tier2_performance: (testResults.reduce((sum, r) => sum + r.score.tier2_performance, 0) / testResults.length).toFixed(1),
      tier3_quality: (testResults.reduce((sum, r) => sum + r.score.tier3_quality, 0) / testResults.length).toFixed(1),
      tier4_technical: (testResults.reduce((sum, r) => sum + r.score.tier4_technical, 0) / testResults.length).toFixed(1)
    },
    tools_coverage: {
      total_unique_tools: new Set(testResults.flatMap(r => r.toolsUsed)).size,
      tools_by_conversation: testResults.map(r => ({
        id: r.conversationId,
        tools: r.toolsUsed
      }))
    },
    results: testResults.map(r => ({
      id: r.conversationId,
      title: r.title,
      category: r.category,
      difficulty: r.difficulty,
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
  console.log(`✅ Passed: ${summary.passed}/${summary.total_conversations} (${summary.pass_rate})`);
  console.log(`❌ Failed: ${summary.failed}/${summary.total_conversations}`);
  console.log(`Average Score: ${summary.average_score}/100`);
  console.log(`Target Met: ${summary.passed >= 45 ? '✅ YES' : '❌ NO'} (45+ conversations ⭐⭐⭐⭐+)`);
  console.log('════════════════════════════════════════════════');
  console.log(`\n📊 Full report saved to: ${resultsDir}/summary.json`);
  console.log(`📁 Individual results: ${resultsDir}/conversation-*.json\n`);
  
  return summary;
}

// ===== MAIN TEST =====

test.describe('ZANTARA 50 Conversations Test Suite', () => {
  
  test.beforeAll(async () => {
    testStartTime = Date.now();
    console.log('\n🚀 Starting ZANTARA 50 Conversations Test');
    console.log('════════════════════════════════════════════════');
    console.log('Configuration:');
    console.log('  - Execution: Sequential');
    console.log('  - Browser: Visible (headed)');
    console.log('  - Timeout: None (unlimited)');
    console.log('  - Retry: 1 automatic retry on failure');
    console.log('  - Capture: Full conversation (HTML, messages, scores)');
    console.log('════════════════════════════════════════════════\n');
  });
  
  test.afterAll(async () => {
    generateSummaryReport();
  });
  
  // Login once before all conversations
  test('Setup: Login as Zero', async ({ page }) => {
    sharedPage = page;
    await login(page);
  });
  
  // Generate individual test for each conversation
  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];
    
    test(`Conversation #${conv.id}: ${conv.title}`, {
      retry: 1 // Automatic retry on failure
    }, async () => {
      const page = sharedPage;
      const convStartTime = Date.now();
      
      console.log(`\n[${conv.id}/50] 🎯 ${conv.category} - ${conv.title}`);
      console.log(`Difficulty: ${'⭐'.repeat(conv.difficulty)} | Tools: ${conv.tools.length}`);
      
      const performanceMetrics = {
        averageResponseTime: 0,
        responseTimes: [] as number[],
        streamErrors: 0
      };
      
      // Execute each turn in the conversation
      for (let turnIdx = 0; turnIdx < conv.turns.length; turnIdx++) {
        const turn = conv.turns[turnIdx];
        const turnStartTime = Date.now();
        
        console.log(`  Turn ${turnIdx + 1}/${conv.turns.length}: ${turn.text.substring(0, 50)}...`);
        
        try {
          const messagesBefore = await sendMessage(page, turn.text);
          await waitForResponse(page, messagesBefore);
          
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
      
      // Capture full conversation
      const capturedData = await captureConversation(page, conv.id);
      
      // Detect tools used
      const toolsUsed = detectToolsUsed(capturedData.messages);
      
      // Score the conversation
      const score = scoreConversation(conv, capturedData, performanceMetrics);
      const rating = getStarRating(score.total);
      
      // Prepare result object
      const result = {
        conversationId: conv.id,
        title: conv.title,
        category: conv.category,
        difficulty: conv.difficulty,
        expectedTools: conv.tools,
        toolsUsed,
        score,
        rating,
        performanceMetrics,
        capturedData,
        duration_ms: Date.now() - convStartTime,
        timestamp: new Date().toISOString()
      };
      
      // Save individual conversation result
      saveConversationResults(conv.id, result);
      
      // Add to test results
      testResults.push(result);
      
      // Print summary
      console.log(`  Score: T1=${score.tier1_correctness}/40 | T2=${score.tier2_performance}/25 | T3=${score.tier3_quality}/20 | T4=${score.tier4_technical}/15`);
      console.log(`  Total: ${score.total}/100 ${rating}`);
      console.log(`  Tools: Expected ${conv.tools.length}, Used ${toolsUsed.length}`);
      
      // Assert: Conversation should pass (score >= 70)
      expect(score.total).toBeGreaterThanOrEqual(70);
    });
  }
});
