/**
 * 🧠 LLM-as-Judge Validation System
 * Uses Claude API + ChromaDB ground truth
 */

import Anthropic from '@anthropic-ai/sdk';
import { GroundTruthFetcher, type GroundTruthData } from './ground-truth-fetcher.js';

interface ValidationResult {
  tier1_correctness: number;
  tier2_performance: number;
  tier3_quality: number;
  tier4_technical: number;
  total: number;
  details: {
    factualAccuracy: string;
    citationQuality: string;
    toolUsageCorrectness: string;
    conversationFlow: string;
    legalCompliance: string;
  };
  groundTruth: GroundTruthData;
  rating: string;
}

export class LLMJudge {
  private anthropic: Anthropic;
  private model: string = 'claude-sonnet-4-20250514';
  private groundTruthFetcher: GroundTruthFetcher;

  constructor(apiKey?: string, ragBackendUrl?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    this.anthropic = new Anthropic({ apiKey: key });
    this.groundTruthFetcher = new GroundTruthFetcher(ragBackendUrl);
  }

  async validateConversation(
    conversation: any,
    conversationDefinition: any,
    performanceMetrics: any
  ): Promise<ValidationResult> {
    
    console.log(`    🔍 Fetching ground truth from ChromaDB Oracle...`);
    const groundTruth = await this.groundTruthFetcher.fetchGroundTruth(conversationDefinition);
    
    console.log(`    📊 Found: ${groundTruth.laws.length} laws, ${groundTruth.regulations.length} regs, ${groundTruth.prices.length} prices`);

    const aiResponses = conversation.messages
      .filter((m: any) => m.role === 'assistant')
      .map((m: any) => m.content);

    const validationPrompt = this.buildValidationPrompt(
      conversationDefinition,
      groundTruth,
      aiResponses,
      conversation.toolsUsed || []
    );

    console.log(`    🧠 Calling Claude API for validation...`);
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0,
      messages: [{
        role: 'user',
        content: validationPrompt
      }]
    });

    const evaluation = this.parseEvaluation(response.content[0].text);
    const tier1 = this.calculateTier1(evaluation);
    const tier2 = this.calculateTier2(performanceMetrics);
    const tier3 = this.calculateTier3(evaluation);
    const tier4 = this.calculateTier4(evaluation);

    const total = tier1 + tier2 + tier3 + tier4;
    const rating = this.getRating(total);

    return {
      tier1_correctness: tier1,
      tier2_performance: tier2,
      tier3_quality: tier3,
      tier4_technical: tier4,
      total,
      details: {
        factualAccuracy: evaluation.factualAccuracy?.reasoning || 'N/A',
        citationQuality: evaluation.citationQuality?.reasoning || 'N/A',
        toolUsageCorrectness: evaluation.toolUsageCorrectness?.reasoning || 'N/A',
        conversationFlow: evaluation.conversationFlow?.reasoning || 'N/A',
        legalCompliance: evaluation.legalCompliance?.reasoning || 'N/A'
      },
      groundTruth,
      rating
    };
  }

  private buildValidationPrompt(conversationDef: any, groundTruth: GroundTruthData, aiResponses: string[], toolsUsed: string[]): string {
    const groundTruthText = GroundTruthFetcher.formatForPrompt(groundTruth);

    return `You are an expert judge evaluating AI assistant responses for Indonesian business services.

**CONVERSATION CONTEXT:**
- Category: ${conversationDef.category}
- User Query: ${conversationDef.turns[0]?.text}
- Expected Tools: ${conversationDef.tools.join(', ')}

${groundTruthText}

**AI RESPONSES TO EVALUATE:**
${aiResponses.map((r, i) => `\n--- Response ${i + 1} ---\n${r}`).join('\n')}

**TOOLS USED BY AI:**
${toolsUsed.join(', ') || 'None'}

**YOUR TASK:**
Compare AI responses against GROUND TRUTH above (from ChromaDB Oracle).

Evaluate:

1. **FACTUAL_ACCURACY** (0-10):
   - Laws cited EXACTLY as in ground truth?
   - Prices EXACTLY matching?
   - Visa types, tax rates correct?

2. **CITATION_QUALITY** (0-10):
   - Indonesian laws properly cited?
   - Tier structure (T1/T2/T3) used?
   - Sources traceable?

3. **TOOL_USAGE_CORRECTNESS** (0-10):
   - Expected tools called: ${conversationDef.tools.join(', ')}?
   - Missing tools?
   - Unnecessary tools?

4. **CONVERSATION_FLOW** (0-5):
   - Natural progression
   - Context retention
   - Professional tone

5. **LEGAL_COMPLIANCE** (0-5):
   - Regulations up-to-date (2024/2025)?
   - No outdated laws?
   - Appropriate warnings?

**OUTPUT FORMAT (JSON only):**
\`\`\`json
{
  "factualAccuracy": {
    "score": 0-10,
    "reasoning": "Brief explanation",
    "errors": []
  },
  "citationQuality": {
    "score": 0-10,
    "reasoning": "Brief explanation",
    "missingCitations": []
  },
  "toolUsageCorrectness": {
    "score": 0-10,
    "reasoning": "Brief explanation",
    "missingTools": [],
    "unnecessaryTools": []
  },
  "conversationFlow": {
    "score": 0-5,
    "reasoning": "Brief explanation"
  },
  "legalCompliance": {
    "score": 0-5,
    "reasoning": "Brief explanation",
    "concerns": []
  }
}
\`\`\``;
  }

  private parseEvaluation(claudeResponse: string): any {
    try {
      const jsonMatch = claudeResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(claudeResponse);
    } catch (error) {
      console.error('Failed to parse Claude evaluation:', error);
      return {
        factualAccuracy: { score: 0, reasoning: 'Parse error', errors: [] },
        citationQuality: { score: 0, reasoning: 'Parse error', missingCitations: [] },
        toolUsageCorrectness: { score: 0, reasoning: 'Parse error', missingTools: [], unnecessaryTools: [] },
        conversationFlow: { score: 0, reasoning: 'Parse error' },
        legalCompliance: { score: 0, reasoning: 'Parse error', concerns: [] }
      };
    }
  }

  private calculateTier1(evaluation: any): number {
    const factual = (evaluation.factualAccuracy?.score || 0) * 2;
    const citations = (evaluation.citationQuality?.score || 0) * 2;
    return Math.min(40, factual + citations);
  }

  private calculateTier2(metrics: any): number {
    let score = 0;
    const avgTime = metrics.averageResponseTime || 10000;
    const errors = metrics.streamErrors || 0;
    
    if (metrics.responseTimes && metrics.responseTimes.length > 0) {
      const firstResponse = metrics.responseTimes[0];
      if (firstResponse < 3000) score += 10;
      else if (firstResponse < 5000) score += 7;
      else if (firstResponse < 8000) score += 4;
    }
    
    if (avgTime < 5000) score += 10;
    else if (avgTime < 8000) score += 7;
    else if (avgTime < 12000) score += 4;
    
    if (errors === 0) score += 5;
    else if (errors === 1) score += 3;
    
    return Math.min(25, score);
  }

  private calculateTier3(evaluation: any): number {
    const flow = (evaluation.conversationFlow?.score || 0) * 2;
    const legal = (evaluation.legalCompliance?.score || 0) * 2;
    return Math.min(20, flow + legal);
  }

  private calculateTier4(evaluation: any): number {
    const toolScore = (evaluation.toolUsageCorrectness?.score || 0) * 1.5;
    return Math.min(15, toolScore);
  }

  private getRating(total: number): string {
    if (total >= 90) return '⭐⭐⭐⭐⭐ PERFETTO (Claude + ChromaDB validated)';
    if (total >= 80) return '⭐⭐⭐⭐ OTTIMO (Claude + ChromaDB validated)';
    if (total >= 70) return '⭐⭐⭐ BUONO (Claude + ChromaDB validated)';
    if (total >= 60) return '⭐⭐ SUFFICIENTE';
    return '❌ FAIL';
  }
}
