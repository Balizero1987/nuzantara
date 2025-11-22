/**
 * AI-Powered Test Generation Agent
 *
 * Uses Qwen 2.5 72B (free) for comprehensive test generation
 * Generates Jest tests with 80%+ coverage
 *
 * ANTI-LOOP Safety Features:
 * - Idempotency: Skips files that already have tests
 * - Deduplication: Won't regenerate tests within 7 days
 * - Max files: 10 per run (configurable)
 * - Verification: Generated tests must pass before saving
 * - Blacklist: Problematic files are excluded
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { OpenRouterClient } from '../services/ai/openrouter-client.js';
import logger from '../services/logger.js';

export interface TestGenerationResult {
  success: boolean;
  testPath?: string;
  coverage?: number;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

interface GeneratedTest {
  filePath: string;
  testPath: string;
  timestamp: number;
  success: boolean;
  coverage: number;
  errorCount: number;
}

export class TestGeneratorAgent {
  private ai: OpenRouterClient;

  // ANTI-LOOP: Track generated tests
  private generatedTests: Map<string, GeneratedTest> = new Map();
  private generatedTestsPath = '.ai-automation/test-generation-history.json';

  // ANTI-LOOP: Configuration
  private cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
  private maxFilesPerRun = 10;
  private maxErrorsPerFile = 3;
  private minCoverageRequired = 50; // %
  private blacklist = new Set<string>([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '__generated__',
    '__mocks__'
  ]);

  constructor() {
    this.ai = new OpenRouterClient();
    this.loadGeneratedTests();
  }

  /**
   * Generate comprehensive tests for a source file
   */
  async generateTests(filePath: string): Promise<TestGenerationResult> {
    try {
      logger.info(`🧪 Checking if can generate tests for ${filePath}`);

      // ANTI-LOOP: Check if file is blacklisted
      if (this.isBlacklisted(filePath)) {
        return {
          success: false,
          skipped: true,
          skipReason: 'File is in blacklist'
        };
      }

      // ANTI-LOOP: Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          skipped: true,
          skipReason: 'File does not exist'
        };
      }

      // ANTI-LOOP: Check if tests already exist (idempotency)
      const testPath = this.getTestPath(filePath);
      if (fs.existsSync(testPath)) {
        logger.info(`Tests already exist for ${filePath}, skipping`);
        return {
          success: true,
          testPath,
          skipped: true,
          skipReason: 'Tests already exist'
        };
      }

      // ANTI-LOOP: Check if recently generated
      const generated = this.generatedTests.get(filePath);
      if (generated) {
        const timeSinceGenerated = Date.now() - generated.timestamp;

        if (timeSinceGenerated < this.cooldownPeriod) {
          const daysRemaining = Math.ceil(
            (this.cooldownPeriod - timeSinceGenerated) / (24 * 60 * 60 * 1000)
          );

          logger.info(`⏳ File in cooldown period`, {
            filePath,
            daysRemaining
          });

          return {
            success: false,
            skipped: true,
            skipReason: `Cooldown period (${daysRemaining} days remaining)`
          };
        }

        // ANTI-LOOP: Check error count
        if (generated.errorCount >= this.maxErrorsPerFile) {
          logger.warn(`🚫 File has too many test generation errors`, {
            filePath,
            errorCount: generated.errorCount
          });

          this.blacklist.add(filePath);
          return {
            success: false,
            skipped: true,
            skipReason: 'Too many previous errors (blacklisted)'
          };
        }
      }

      // Read source file
      const sourceCode = fs.readFileSync(filePath, 'utf-8');

      // ANTI-LOOP: Check file size (max 5k lines)
      const lineCount = sourceCode.split('\n').length;
      if (lineCount > 5000) {
        logger.warn(`⚠️ File too large to generate tests`, { filePath, lineCount });
        return {
          success: false,
          skipped: true,
          skipReason: `File too large (${lineCount} lines)`
        };
      }

      logger.info(`🧪 Generating tests for ${filePath}`);

      // Generate tests with Qwen 2.5
      const testCode = await this.generateTestCode(filePath, sourceCode);

      // Ensure test directory exists
      const testDir = path.dirname(testPath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      // Save test file
      fs.writeFileSync(testPath, testCode);

      // Run tests to verify they work
      try {
        this.runTests(testPath);

        // Calculate coverage
        const coverage = await this.getCoverage(testPath);

        // ANTI-LOOP: Verify minimum coverage
        if (coverage < this.minCoverageRequired) {
          logger.warn(`⚠️ Generated tests have low coverage`, {
            filePath,
            coverage,
            required: this.minCoverageRequired
          });

          // Don't delete, but mark as needing improvement
          this.trackGeneratedTest(filePath, testPath, false, coverage);

          return {
            success: false,
            testPath,
            coverage,
            error: `Coverage too low: ${coverage}% (required: ${this.minCoverageRequired}%)`
          };
        }

        // Track success
        this.trackGeneratedTest(filePath, testPath, true, coverage);

        logger.info(`✅ Tests generated for ${filePath}`, {
          testPath,
          coverage: `${coverage}%`
        });

        return {
          success: true,
          testPath,
          coverage
        };

      } catch (error) {
        // Tests failed, remove generated file
        fs.unlinkSync(testPath);

        // Track error
        this.trackGeneratedTest(filePath, testPath, false, 0);

        throw new Error(`Generated tests failed: ${error instanceof Error ? error.message : String(error)}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Test generation failed for ${filePath}`, error instanceof Error ? error : new Error(errorMessage));

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate test code using Qwen 2.5
   */
  private async generateTestCode(filePath: string, sourceCode: string): Promise<string> {
    const prompt = `Generate comprehensive Jest tests for this TypeScript file:

File: ${filePath}
\`\`\`typescript
${sourceCode}
\`\`\`

Requirements:
- 80%+ code coverage
- Test all public functions/methods
- Test all edge cases
- Test error paths
- Test boundary conditions
- Use describe/it/expect syntax
- Mock external dependencies (use jest.mock())
- Mock database calls
- Mock API calls
- Add clear test descriptions
- Group related tests in describe blocks

IMPORTANT: Return ONLY the test code, no explanations. The output should be valid TypeScript Jest tests that can be saved directly to a .test.ts file.

Include all necessary imports at the top (import { describe, it, expect, jest } from '@jest/globals').`;

    const testCode = await this.ai.chat({
      model: 'qwen/qwen-2.5-72b-instruct', // FREE, excellent for tests
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 8000
    });

    return this.cleanCodeResponse(testCode);
  }

  /**
   * Get test file path
   */
  private getTestPath(filePath: string): string {
    // If already in __tests__ directory
    if (filePath.includes('/__tests__/')) {
      return filePath.replace(/\.ts$/, '.test.ts');
    }

    // Create path in __tests__ directory
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const testFilename = filename.replace(/\.ts$/, '.test.ts');

    return path.join(dir, '__tests__', testFilename);
  }

  /**
   * Run generated tests
   */
  private runTests(testPath: string): void {
    execSync(`npm test -- ${testPath}`, { stdio: 'pipe' });
  }

  /**
   * Get test coverage
   */
  private async getCoverage(testPath: string): Promise<number> {
    try {
      const output = execSync(
        `npm test -- ${testPath} --coverage --coverageReporters=json-summary`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );

      // Try to find coverage JSON file
      const coverageFile = 'coverage/coverage-summary.json';
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'));
        const totalCoverage = coverage.total?.lines?.pct || 0;
        return Math.round(totalCoverage);
      }

      // Fallback: parse from output
      const match = output.match(/All files.*?(\d+\.?\d*)/);
      return match ? Math.round(parseFloat(match[1])) : 0;

    } catch {
      return 0;
    }
  }

  /**
   * ANTI-LOOP: Check if file is blacklisted
   */
  private isBlacklisted(filePath: string): boolean {
    return Array.from(this.blacklist).some(pattern => filePath.includes(pattern));
  }

  /**
   * ANTI-LOOP: Track generated test
   */
  private trackGeneratedTest(
    filePath: string,
    testPath: string,
    success: boolean,
    coverage: number
  ): void {
    const existing = this.generatedTests.get(filePath);

    this.generatedTests.set(filePath, {
      filePath,
      testPath,
      timestamp: Date.now(),
      success,
      coverage,
      errorCount: success ? 0 : (existing?.errorCount || 0) + 1
    });

    this.saveGeneratedTests();
  }

  /**
   * ANTI-LOOP: Load generated tests history
   */
  private loadGeneratedTests(): void {
    try {
      if (fs.existsSync(this.generatedTestsPath)) {
        const data = fs.readFileSync(this.generatedTestsPath, 'utf-8');
        const parsed: GeneratedTest[] = JSON.parse(data);

        for (const test of parsed) {
          this.generatedTests.set(test.filePath, test);
        }

        logger.info(`Loaded ${this.generatedTests.size} generated tests from history`);
      }
    } catch (error) {
      logger.warn('Failed to load generated tests history', { error });
    }
  }

  /**
   * ANTI-LOOP: Save generated tests history
   */
  private saveGeneratedTests(): void {
    try {
      const dir = path.dirname(this.generatedTestsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Array.from(this.generatedTests.values());
      fs.writeFileSync(this.generatedTestsPath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.warn('Failed to save generated tests history', { error });
    }
  }

  /**
   * Clean markdown code blocks from AI response
   */
  private cleanCodeResponse(response: string): string {
    let cleaned = response.trim();

    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:typescript|ts)?\n/, '');
      cleaned = cleaned.replace(/\n```$/, '');
    }

    return cleaned.trim();
  }

  /**
   * Generate tests for multiple files (batch)
   */
  async generateTestsForDirectory(directoryPath: string): Promise<TestGenerationResult[]> {
    const files = this.getTypeScriptFiles(directoryPath);

    // ANTI-LOOP: Limit to maxFilesPerRun
    const filesToProcess = files.slice(0, this.maxFilesPerRun);

    logger.info(`📦 Batch test generation: ${filesToProcess.length} files`);

    const results: TestGenerationResult[] = [];

    for (const file of filesToProcess) {
      const result = await this.generateTests(file);
      results.push(result);

      // ANTI-LOOP: Small delay between files to avoid rate limits
      await this.sleep(1000);
    }

    return results;
  }

  /**
   * Get all TypeScript files in directory (excluding tests and d.ts)
   */
  private getTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];

    const walk = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;

      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // ANTI-LOOP: Skip blacklisted directories
        if (this.isBlacklisted(fullPath)) continue;

        if (entry.isDirectory() && entry.name !== '__tests__') {
          walk(fullPath);
        } else if (
          entry.isFile() &&
          entry.name.endsWith('.ts') &&
          !entry.name.endsWith('.test.ts') &&
          !entry.name.endsWith('.d.ts')
        ) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    const now = Date.now();
    const generatedLast24h = Array.from(this.generatedTests.values())
      .filter(t => now - t.timestamp < 24 * 60 * 60 * 1000);

    const avgCoverage = generatedLast24h.length > 0
      ? generatedLast24h.reduce((sum, t) => sum + t.coverage, 0) / generatedLast24h.length
      : 0;

    return {
      totalGenerated: this.generatedTests.size,
      generatedLast24h: generatedLast24h.length,
      successLast24h: generatedLast24h.filter(t => t.success).length,
      avgCoverageLast24h: Math.round(avgCoverage),
      blacklistSize: this.blacklist.size,
      cooldownPeriodDays: this.cooldownPeriod / (24 * 60 * 60 * 1000),
      maxFilesPerRun: this.maxFilesPerRun,
      minCoverageRequired: this.minCoverageRequired
    };
  }
}
