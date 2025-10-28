/**
 * 🔄 Re-validate Existing Test Results
 * WITH ToolValidator + GroundTruthMatcher
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { LLMJudge } from './lib/llm-judge.js';
import { ToolValidator } from './lib/tool-validator.js';
import { GroundTruthMatcher } from './lib/ground-truth-matcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const existingResultsDir = path.join(__dirname, '../test-results/zantara-50-single');
const conversationsPath = path.join(__dirname, '../tests/test-conversations-50-ZANTARA.json');
const newResultsDir = path.join(__dirname, '../test-results/zantara-50-revalidated');

async function revalidateResults() {
  console.log('\n🔄 RE-VALIDATING EXISTING TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Source: test-results/zantara-50-single/');
  console.log('✅ Claude API: Response quality evaluation');
  console.log('✅ ChromaDB Oracle: Ground truth from Indonesian laws');
  console.log('✅ ToolValidator: DETERMINISTIC tool usage validation');
  console.log('✅ GroundTruthMatcher: EXACT price/law matching');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!fs.existsSync(existingResultsDir)) {
    console.error('❌ ERROR: test-results/zantara-50-single/ not found');
    process.exit(1);
  }

  const conversationsData = JSON.parse(fs.readFileSync(conversationsPath, 'utf-8'));
  const conversationDefs = conversationsData.conversations;

  if (!fs.existsSync(newResultsDir)) {
    fs.mkdirSync(newResultsDir, { recursive: true });
  }

  const llmJudge = new LLMJudge(
    process.env.ANTHROPIC_API_KEY,
    process.env.RAG_BACKEND_URL || 'https://rag-backend-production.up.railway.app'
  );
  const toolValidator = new ToolValidator();
  const gtMatcher = new GroundTruthMatcher();

  const revalidatedResults: any[] = [];
  const startTime = Date.now();

  const files = fs.readdirSync(existingResultsDir)
    .filter(f => f.startsWith('conversation-') && f.endsWith('.json'))
    .sort();

  console.log(`📂 Found ${files.length} conversation results to re-validate\n`);

  for (const filename of files) {
    const filepath = path.join(existingResultsDir, filename);
    const oldResult = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    const convId = oldResult.conversationId;
    const convDef = conversationDefs.find((c: any) => c.id === convId);

    if (!convDef) {
      console.log(`⚠️  Conversation ${convId} not found, skipping`);
      continue;
    }

    console.log(`\n[${convId}/50] 🔄 ${convDef.category} - ${convDef.title}`);
    console.log(`  Old Score: ${oldResult.score.total}/100 (FAKE)`);

    const messages = oldResult.capturedData?.messages || [];
    const aiResponses = messages.filter((m: any) => m.role === 'assistant').map((m: any) => m.content);
    const toolsUsed = oldResult.toolsUsed || [];
    const performanceMetrics = oldResult.performanceMetrics || {
      averageResponseTime: 5000,
      responseTimes: [],
      streamErrors: 0
    };

    try {
      console.log(`  🧠 Validating with Claude + ChromaDB...`);
      const validation = await llmJudge.validateConversation(
        { messages, toolsUsed },
        convDef,
        performanceMetrics
      );

      console.log(`  🔧 Validating tool usage (deterministic)...`);
      const toolValidation = toolValidator.validateTools(
        convDef.tools,
        toolsUsed,
        aiResponses,
        convDef.category
      );

      console.log(`  🎯 Matching ground truth (deterministic)...`);
      const priceMatch = gtMatcher.matchPrices(aiResponses, validation.groundTruth.prices);
      const lawMatch = gtMatcher.matchLaws(aiResponses, validation.groundTruth.laws);
      const factMatch = gtMatcher.matchFacts(aiResponses, validation.groundTruth.facts);
      
      const gtAccuracy = gtMatcher.calculateOverallAccuracy(priceMatch, lawMatch, factMatch);

      const enhancedTier1 = Math.round(
        (validation.tier1_correctness * 0.7) +
        (gtAccuracy * 4 * 0.3)
      );

      const enhancedTier4 = Math.round(
        (validation.tier4_technical * 0.5) +
        (toolValidation.overallScore * 1.5 * 0.5)
      );

      const enhancedTotal = enhancedTier1 + validation.tier2_performance + validation.tier3_quality + enhancedTier4;

      console.log(`  📊 NEW Score: T1=${enhancedTier1}/40 | T2=${validation.tier2_performance}/25 | T3=${validation.tier3_quality}/20 | T4=${enhancedTier4}/15`);
      console.log(`  🎯 Total: ${enhancedTotal}/100`);
      console.log(`  🔧 Tools: ${toolValidation.summary}`);
      console.log(`  🎯 GT: Prices ${priceMatch.accuracy.toFixed(0)}%, Laws ${lawMatch.accuracy.toFixed(0)}%, Facts ${factMatch.coverage.toFixed(0)}%`);

      const scoreDiff = enhancedTotal - oldResult.score.total;
      console.log(`  ${scoreDiff >= 0 ? '📈' : '📉'} Change: ${scoreDiff > 0 ? '+' : ''}${scoreDiff} pts`);

      const revalidated = {
        conversationId: convId,
        title: convDef.title,
        category: convDef.category,
        difficulty: convDef.difficulty,
        expectedTools: convDef.tools,
        toolsUsed,
        oldScore: oldResult.score,
        newScore: {
          tier1_correctness: enhancedTier1,
          tier2_performance: validation.tier2_performance,
          tier3_quality: validation.tier3_quality,
          tier4_technical: enhancedTier4,
          total: enhancedTotal
        },
        scoreDifference: scoreDiff,
        validation: validation.details,
        toolValidation: {
          score: toolValidation.overallScore,
          summary: toolValidation.summary,
          missingTools: toolValidation.missingTools,
          unnecessaryTools: toolValidation.unnecessaryTools
        },
        groundTruthMatch: {
          accuracy: gtAccuracy,
          prices: priceMatch,
          laws: lawMatch,
          facts: factMatch
        },
        groundTruth: validation.groundTruth,
        rating: validation.rating,
        performanceMetrics,
        revalidatedAt: new Date().toISOString()
      };

      const newFilepath = path.join(newResultsDir, filename);
      fs.writeFileSync(newFilepath, JSON.stringify(revalidated, null, 2));

      revalidatedResults.push(revalidated);

    } catch (error) {
      console.error(`  ❌ Validation failed: ${error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const passed = revalidatedResults.filter(r => r.newScore.total >= 70).length;
  const failed = revalidatedResults.filter(r => r.newScore.total < 70).length;
  const avgOldScore = (revalidatedResults.reduce((sum, r) => sum + r.oldScore.total, 0) / revalidatedResults.length).toFixed(1);
  const avgNewScore = (revalidatedResults.reduce((sum, r) => sum + r.newScore.total, 0) / revalidatedResults.length).toFixed(1);
  const avgDiff = (parseFloat(avgNewScore) - parseFloat(avgOldScore)).toFixed(1);

  const summary = {
    revalidation_date: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    validation_method: 'Claude + ToolValidator + GroundTruthMatcher (Hybrid)',
    total_conversations: revalidatedResults.length,
    passed,
    failed,
    pass_rate: `${((passed / revalidatedResults.length) * 100).toFixed(1)}%`,
    average_old_score: avgOldScore,
    average_new_score: avgNewScore,
    average_score_change: avgDiff,
    results: revalidatedResults.map(r => ({
      id: r.conversationId,
      title: r.title,
      oldScore: r.oldScore.total,
      newScore: r.newScore.total,
      passed: r.newScore.total >= 70
    }))
  };

  fs.writeFileSync(path.join(newResultsDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('🎉 RE-VALIDATION COMPLETED');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📊 OLD Average: ${avgOldScore}/100`);
  console.log(`📊 NEW Average: ${avgNewScore}/100`);
  console.log(`${parseFloat(avgDiff) >= 0 ? '📈' : '📉'} Change: ${avgDiff} pts`);
  console.log(`✅ Passed: ${passed}/${revalidatedResults.length}`);
  console.log(`🎯 Target: ${passed >= 45 ? '✅ MET' : '❌ NOT MET'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
}

revalidateResults().catch(error => {
  console.error('❌ Revalidation failed:', error);
  process.exit(1);
});
