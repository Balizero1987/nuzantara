/**
 * TEST-WRITER Agent
 * Generates comprehensive test suites for any code
 *
 * Stack: Qwen3 Coder 480B (test generation specialist)
 * Impact: 100% code coverage, zero excuses for skipping tests
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { OpenRouterClient } from './clients/openrouter.client.js';
import type { TestGenerationRequest, TestGenerationResult } from './types/agent.types.js';

export class TestWriter {
  constructor(private openRouter: OpenRouterClient) {}

  async generateTests(request: TestGenerationRequest): Promise<TestGenerationResult> {
    console.log('[TestWriter] Generating tests for:', request.filePath);

    // Step 1: Analyze source code
    const analysis = await this.analyzeCode(request.sourceCode);
    console.log('[TestWriter] Code analyzed:', analysis.functionCount, 'functions');

    // Step 2: Generate test code
    const testCode = await this.generateTestCode(request, analysis);
    console.log('[TestWriter] Test code generated');

    // Step 3: Calculate coverage estimation
    const coverage = this.estimateCoverage(analysis, testCode);

    const testFilePath = this.getTestPath(request.filePath);

    // Step 4: Write test file
    await this.writeTestFile(testFilePath, testCode);

    return {
      testCode,
      testFilePath,
      coverage
    };
  }

  /**
   * Step 1: Analyze source code to understand what to test
   */
  private async analyzeCode(sourceCode: string): Promise<{
    functionCount: number;
    functions: string[];
    exports: string[];
    dependencies: string[];
  }> {
    const response = await this.openRouter.qwen3Coder([
      {
        role: 'system',
        content: `Analyze this TypeScript code and identify what needs testing.

Return ONLY valid JSON:
{
  "functionCount": 3,
  "functions": ["functionName1", "functionName2"],
  "exports": ["exportedFunction1"],
  "dependencies": ["dependency1", "dependency2"]
}`
      },
      {
        role: 'user',
        content: `Code to analyze:\n\n${sourceCode}`
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to analyze code: ' + response.error);
    }

    const content = this.extractJSON(response.data.content);
    return JSON.parse(content);
  }

  /**
   * Step 2: Generate comprehensive test code
   */
  private async generateTestCode(
    request: TestGenerationRequest,
    analysis: any
  ): Promise<string> {
    const testFramework = 'Jest';
    const mockLibrary = 'jest.mock';

    let prompt = '';

    if (request.testType === 'unit') {
      prompt = `Generate comprehensive Jest UNIT tests for this TypeScript code.

Requirements:
- Test all exported functions
- Test success cases
- Test error cases
- Test edge cases (null, undefined, empty values)
- Mock external dependencies
- Use descriptive test names
- Group related tests with describe()
- Aim for 100% code coverage

Mock these dependencies: ${analysis.dependencies.join(', ')}

Return ONLY the complete TypeScript test code.`;
    } else if (request.testType === 'integration') {
      prompt = `Generate Jest INTEGRATION tests for this TypeScript code.

Requirements:
- Test real interactions between components
- Test database operations (if any)
- Test API calls (if any)
- Test error handling with real failures
- Use beforeEach/afterEach for setup/teardown
- Clean up resources after tests

Return ONLY the complete TypeScript test code.`;
    } else if (request.testType === 'e2e') {
      prompt = `Generate END-TO-END tests for this TypeScript code.

Requirements:
- Test complete user workflows
- Test realistic scenarios
- Include setup and teardown
- Test error flows
- Use Playwright or Supertest as appropriate

Return ONLY the complete TypeScript test code.`;
    }

    const response = await this.openRouter.qwen3Coder([
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: `Source code:\n\n${request.sourceCode}\n\nAnalysis:\n${JSON.stringify(analysis, null, 2)}`
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to generate tests: ' + response.error);
    }

    return this.cleanCode(response.data.content);
  }

  /**
   * Step 3: Estimate coverage
   */
  private estimateCoverage(analysis: any, testCode: string): {
    functions: number;
    branches: number;
    lines: number;
  } {
    // Count test cases
    const testCount = (testCode.match(/it\(/g) || []).length +
                     (testCode.match(/test\(/g) || []).length;

    // Rough estimation based on test count vs function count
    const functionCoverage = Math.min(100, (testCount / analysis.functionCount) * 80);

    return {
      functions: Math.round(functionCoverage),
      branches: Math.round(functionCoverage * 0.8), // Branches usually lower
      lines: Math.round(functionCoverage * 0.9) // Lines usually between functions and branches
    };
  }

  /**
   * Get test file path from source file path
   */
  private getTestPath(sourcePath: string): string {
    // Convert src/handlers/foo.ts -> src/tests/handlers/foo.test.ts
    const ext = path.extname(sourcePath);
    const base = path.basename(sourcePath, ext);
    const dir = path.dirname(sourcePath);

    return path.join('src/tests', dir.replace('src/', ''), `${base}.test${ext}`);
  }

  /**
   * Write test file
   */
  private async writeTestFile(testPath: string, testCode: string): Promise<void> {
    const baseDir = '/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-ts';
    const fullPath = path.join(baseDir, testPath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, testCode, 'utf-8');

    console.log(`[TestWriter] Written: ${fullPath}`);
  }

  /**
   * Extract JSON from response
   */
  private extractJSON(content: string): string {
    let json = content.trim();
    if (json.includes('```json')) {
      json = json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    const start = json.indexOf('{');
    const end = json.lastIndexOf('}') + 1;
    return json.substring(start, end);
  }

  /**
   * Clean code output
   */
  private cleanCode(code: string): string {
    return code
      .replace(/```typescript\n?/g, '')
      .replace(/```ts\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }
}
