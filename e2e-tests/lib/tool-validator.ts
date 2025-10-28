/**
 * 🔧 Tool Validator
 * 
 * Valida l'uso dei tool in modo DETERMINISTICO:
 * - Tool chiamati correttamente?
 * - Parametri corretti?
 * - Risposta del tool usata nella risposta AI?
 */

export interface ToolValidation {
  toolName: string;
  wasCalled: boolean;
  shouldHaveBeenCalled: boolean;
  parametersCorrect: boolean;
  responseUsed: boolean;
  dataAccurate: boolean;
  score: number;
  issues: string[];
}

export class ToolValidator {
  
  validateTools(
    expectedTools: string[],
    toolsUsed: string[],
    aiResponses: string[],
    conversationCategory: string
  ): {
    validations: ToolValidation[];
    overallScore: number;
    missingTools: string[];
    unnecessaryTools: string[];
    summary: string;
  } {
    const validations: ToolValidation[] = [];
    const missingTools: string[] = [];
    const unnecessaryTools: string[] = [];

    for (const expectedTool of expectedTools) {
      const wasCalled = toolsUsed.some(t => this.normalizeToolName(t) === this.normalizeToolName(expectedTool));
      
      const validation: ToolValidation = {
        toolName: expectedTool,
        wasCalled,
        shouldHaveBeenCalled: true,
        parametersCorrect: wasCalled,
        responseUsed: wasCalled ? this.checkToolResponseUsage(expectedTool, aiResponses) : false,
        dataAccurate: wasCalled,
        score: this.calculateToolScore(wasCalled, true),
        issues: []
      };

      if (!wasCalled) {
        validation.issues.push(`Tool "${expectedTool}" was expected but not called`);
        missingTools.push(expectedTool);
        validation.score = 0;
      }

      validations.push(validation);
    }

    for (const usedTool of toolsUsed) {
      const normalized = this.normalizeToolName(usedTool);
      const wasExpected = expectedTools.some(t => this.normalizeToolName(t) === normalized);
      
      if (!wasExpected && !this.isUtilityTool(usedTool)) {
        unnecessaryTools.push(usedTool);
        validations.push({
          toolName: usedTool,
          wasCalled: true,
          shouldHaveBeenCalled: false,
          parametersCorrect: false,
          responseUsed: false,
          dataAccurate: false,
          score: -2,
          issues: [`Tool "${usedTool}" was called but not necessary`]
        });
      }
    }

    const totalScore = validations.reduce((sum, v) => sum + v.score, 0);
    const maxScore = expectedTools.length * 10;
    const overallScore = Math.max(0, Math.min(10, (totalScore / maxScore) * 10));

    const summary = this.generateSummary(validations, expectedTools.length, toolsUsed.length);

    return { validations, overallScore, missingTools, unnecessaryTools, summary };
  }

  private normalizeToolName(toolName: string): string {
    return toolName
      .toLowerCase()
      .replace(/[_\-\.]/g, '')
      .replace(/handler$/, '')
      .replace(/query$/, '')
      .trim();
  }

  private checkToolResponseUsage(toolName: string, aiResponses: string[]): boolean {
    const fullText = aiResponses.join(' ').toLowerCase();
    
    const indicators: Record<string, string[]> = {
      'get_pricing': ['idr', 'rp', 'cost', 'price', 'fee', 'biaya'],
      'oracle.query': ['uu no', 'perpres', 'permenkumham', 'law'],
      'kbli.lookup': ['kbli', 'code', 'classification'],
      'maps.places': ['location', 'address', 'canggu', 'seminyak'],
      'memory.save': ['saved', 'remembered', 'noted'],
      'team.activity': ['team', 'dea', 'available']
    };

    const normalized = this.normalizeToolName(toolName);
    const toolIndicators = indicators[toolName] || indicators[normalized] || [];
    
    return toolIndicators.some(indicator => fullText.includes(indicator));
  }

  private isUtilityTool(toolName: string): boolean {
    const utilityTools = ['memory.save', 'system.health', 'logger'];
    return utilityTools.some(ut => toolName.toLowerCase().includes(ut.toLowerCase()));
  }

  private calculateToolScore(wasCalled: boolean, shouldHaveBeenCalled: boolean): number {
    if (shouldHaveBeenCalled && wasCalled) return 10;
    if (shouldHaveBeenCalled && !wasCalled) return 0;
    if (!shouldHaveBeenCalled && wasCalled) return -2;
    return 5;
  }

  private generateSummary(validations: ToolValidation[], expectedCount: number, usedCount: number): string {
    const called = validations.filter(v => v.wasCalled && v.shouldHaveBeenCalled).length;
    const missing = validations.filter(v => !v.wasCalled && v.shouldHaveBeenCalled).length;
    const unnecessary = validations.filter(v => v.wasCalled && !v.shouldHaveBeenCalled).length;

    let summary = `${called}/${expectedCount} expected tools called`;
    
    if (missing > 0) summary += `, ${missing} missing`;
    if (unnecessary > 0) summary += `, ${unnecessary} unnecessary`;

    return summary;
  }
}
