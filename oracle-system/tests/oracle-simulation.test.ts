import assert from 'node:assert/strict';
import { runSimulation } from '../agents/simulation-engine/simulation-engine';

async function testInvestorRestaurantCase() {
  const caseDescription = 'Italian investor wants to open a restaurant in Seminyak with 12B IDR capital and hire local staff';
  const result = await runSimulation(caseDescription, 'quartet');

  const visa = result.individualAnalyses.find((analysis) => analysis.agent === 'VISA_ORACLE');
  assert.ok(visa, 'Visa analysis missing');
  assert.match(visa!.analysis, /Investor/i, 'Investor visa not recommended');
  assert.ok(visa!.requirements.length > 0, 'Visa requirements should not be empty');
  assert.ok(visa!.obligations && visa!.obligations.length > 0, 'Visa obligations missing');

  const kbli = result.individualAnalyses.find((analysis) => analysis.agent === 'KBLI_EYE');
  assert.ok(kbli, 'KBLI analysis missing');
  assert.match(kbli!.analysis, /56101|restaurant/i, 'Restaurant KBLI not identified');
  assert.ok(
    kbli!.requirements.some((req) => /minimum investment/i.test(req)),
    'KBLI requirements should mention minimum investment'
  );
  assert.ok(kbli!.investmentEstimate && kbli!.investmentEstimate > 0, 'KBLI investment estimate missing');

  assert.ok(result.integratedSolution.steps.length >= 2, 'Integrated solution should include multiple steps');
  assert.match(result.integratedSolution.totalTimeline, /month|week/i, 'Timeline should be summarised in weeks or months');
  assert.match(result.integratedSolution.totalInvestment, /IDR/, 'Investment estimate should be formatted in IDR');
  assert.ok(result.integratedSolution.monthlyObligations.length > 0, 'Monthly obligations should be present');
}

async function testTouristCase() {
  const caseDescription = 'US tourist planning a 30 day stay in Bali for vacation and surfing';
  const result = await runSimulation(caseDescription);

  const visa = result.individualAnalyses.find((analysis) => analysis.agent === 'VISA_ORACLE');
  assert.ok(visa, 'Visa analysis missing for tourist case');
  assert.match(visa!.analysis, /B211A|Tourism/i, 'Tourism visa should be recommended');
  assert.equal(result.agents.length, 1, 'Only VISA_ORACLE should trigger for tourist case');
  assert.equal(result.classification, 'PUBLIC', 'Tourist case should remain PUBLIC');
}

async function main() {
  await testInvestorRestaurantCase();
  await testTouristCase();
  console.log('✓ Oracle simulation harness assertions passed');

  const sample = await runSimulation('Australian entrepreneur wants to open a spa and wellness centre in Ubud with 15B IDR budget', 'quartet');
  console.log(JSON.stringify({
    case: sample.caseId,
    agents: sample.agents,
    summary: sample.integratedSolution.summary,
    investment: sample.integratedSolution.totalInvestment,
    timeline: sample.integratedSolution.totalTimeline,
    obligations: sample.integratedSolution.monthlyObligations
  }, null, 2));
}

main().catch((error) => {
  console.error('Oracle simulation harness failed:', error);
  process.exit(1);
});
