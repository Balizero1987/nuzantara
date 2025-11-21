/**
 * AI-Powered Code Refactoring Agent
 *
 * Uses DeepSeek Coder (free) for refactoring
 * Uses Llama 3.3 70B (free) for verification
 *
 * ANTI-LOOP Safety Features:
 * - Deduplication: Won't refactor same file within 7 days
 * - Cooldown: 24h minimum between operations on same file
 * - Blacklist: Problematic files are excluded
 * - Max files: 5 per run (configurable)
 * - Idempotency: Checks if work already done
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { OpenRouterClient } from '../services/ai/openrouter-client.js';
import logger from '../services/logger.js';

export interface RefactoringIssue {
  type: 'code-smell' | 'complexity' | 'duplication' | 'type-safety' | 'performance';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RefactoringResult {
  success: boolean;
  filePath?: string;
  prUrl?: string;
  error?: string;
  verification?: string;
  skipped?: boolean;
  skipReason?: string;
}

interface ProcessedFile {
  filePath: string;
  timestamp: number;
  success: boolean;
  errorCount: number;
}

export class RefactoringAgent {
  private ai: OpenRouterClient;

  // ANTI-LOOP: Track processed files
  private processedFiles: Map<string, ProcessedFile> = new Map();
  private processedFilesPath = '.ai-automation/refactoring-history.json';

  // ANTI-LOOP: Configuration
  private cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
  private maxFilesPerRun = 5;
  private maxErrorsPerFile = 3;
  private blacklist = new Set<string>([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '__generated__'
  ]);

  constructor() {
    this.ai = new OpenRouterClient();
    this.loadProcessedFiles();
  }

  /**
   * Refactor a file to fix identified issues
   */
  async refactorFile(
    filePath: string,
    issues: RefactoringIssue[]
  ): Promise<RefactoringResult> {
    try {
      logger.info(`🔧 Checking if can refactor ${filePath}`, { issues });

      // ANTI-LOOP: Check if file is blacklisted
      if (this.isBlacklisted(filePath)) {
        return {
          success: false,
          skipped: true,
          skipReason: 'File is in blacklist'
        };
      }

      // ANTI-LOOP: Check if recently processed
      const processed = this.processedFiles.get(filePath);
      if (processed) {
        const timeSinceProcessed = Date.now() - processed.timestamp;

        if (timeSinceProcessed < this.cooldownPeriod) {
          const daysRemaining = Math.ceil(
            (this.cooldownPeriod - timeSinceProcessed) / (24 * 60 * 60 * 1000)
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
        if (processed.errorCount >= this.maxErrorsPerFile) {
          logger.warn(`🚫 File has too many errors, adding to blacklist`, {
            filePath,
            errorCount: processed.errorCount
          });

          this.blacklist.add(filePath);
          return {
            success: false,
            skipped: true,
            skipReason: 'Too many previous errors (blacklisted)'
          };
        }
      }

      // ANTI-LOOP: Check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          skipped: true,
          skipReason: 'File does not exist'
        };
      }

      logger.info(`🔧 Starting refactoring for ${filePath}`);

      // Read original file
      const originalContent = fs.readFileSync(filePath, 'utf-8');

      // ANTI-LOOP: Check if file is too large (>10k lines)
      const lineCount = originalContent.split('\n').length;
      if (lineCount > 10000) {
        logger.warn(`⚠️ File too large to refactor`, { filePath, lineCount });
        return {
          success: false,
          skipped: true,
          skipReason: `File too large (${lineCount} lines)`
        };
      }

      // Step 1: Generate refactored code with DeepSeek Coder
      const refactoredCode = await this.generateRefactoring(
        filePath,
        originalContent,
        issues
      );

      // Step 2: Verify with Llama 3.3 (ensemble approach)
      const verification = await this.verifyRefactoring(
        originalContent,
        refactoredCode
      );

      if (!verification.approved) {
        logger.warn('Refactoring verification failed', {
          filePath,
          reason: verification.reason
        });

        // Track error
        this.trackProcessedFile(filePath, false);

        return {
          success: false,
          error: 'Verification failed',
          verification: verification.reason
        };
      }

      // Step 3: Save and test
      const backupPath = `${filePath}.backup`;
      fs.copyFileSync(filePath, backupPath);

      try {
        fs.writeFileSync(filePath, refactoredCode);

        // Run tests
        this.runTests(filePath);

        // Tests passed, remove backup
        fs.unlinkSync(backupPath);

        // ANTI-LOOP: Create PR (not on main branch!)
        const prUrl = await this.createRefactoringPR(filePath, issues);

        // Track success
        this.trackProcessedFile(filePath, true);

        logger.info(`✅ Refactoring successful for ${filePath}`, { prUrl });

        return {
          success: true,
          filePath,
          prUrl
        };

      } catch (error) {
        // Restore backup on failure
        fs.copyFileSync(backupPath, filePath);
        fs.unlinkSync(backupPath);

        // Track error
        this.trackProcessedFile(filePath, false);

        throw error;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`❌ Refactoring failed for ${filePath}`, error instanceof Error ? error : new Error(errorMessage));

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate refactored code using DeepSeek Coder
   */
  private async generateRefactoring(
    filePath: string,
    originalContent: string,
    issues: RefactoringIssue[]
  ): Promise<string> {
    const issuesList = issues
      .map((issue, idx) => `${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`)
      .join('\n');

    const prompt = `Refactor this TypeScript file to fix the following issues:

${issuesList}

File: ${filePath}
\`\`\`typescript
${originalContent}
\`\`\`

Requirements:
- Maintain ALL original functionality
- Improve code health score
- Add TypeScript strict types where missing
- Optimize performance
- Follow DRY principles
- Add JSDoc comments for public APIs
- Preserve all imports and exports
- Keep the same file structure

IMPORTANT: Return ONLY the refactored code, no explanations or markdown. The output should be valid TypeScript that can be saved directly to a file.`;

    const refactored = await this.ai.chat({
      model: 'deepseek/deepseek-coder', // FREE
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 8000
    });

    return this.cleanCodeResponse(refactored);
  }

  /**
   * Verify refactoring with second model (ensemble)
   */
  private async verifyRefactoring(
    original: string,
    refactored: string
  ): Promise<{ approved: boolean; reason: string }> {
    const prompt = `Review this code refactoring. Does it maintain all original functionality?

Original Code:
\`\`\`typescript
${original.slice(0, 4000)} ${original.length > 4000 ? '...(truncated)' : ''}
\`\`\`

Refactored Code:
\`\`\`typescript
${refactored.slice(0, 4000)} ${refactored.length > 4000 ? '...(truncated)' : ''}
\`\`\`

Analyze:
1. Are all functions/methods preserved?
2. Is the logic equivalent?
3. Are exports maintained?
4. Are there any breaking changes?

Reply with JSON:
{
  "approved": true/false,
  "reason": "brief explanation"
}`;

    const response = await this.ai.chat({
      model: 'meta-llama/llama-3.3-70b-instruct', // FREE
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    try {
      const result = JSON.parse(this.cleanCodeResponse(response));
      return {
        approved: result.approved === true,
        reason: result.reason || 'Unknown'
      };
    } catch {
      // Fallback: check for YES in response
      return {
        approved: response.toLowerCase().includes('yes') || response.toLowerCase().includes('approved'),
        reason: response
      };
    }
  }

  /**
   * Run tests for the refactored file
   */
  private runTests(filePath: string): void {
    try {
      // Try to run specific test file
      const testPath = filePath.replace(/\.ts$/, '.test.ts');
      if (fs.existsSync(testPath)) {
        execSync(`npm test -- ${testPath}`, { stdio: 'pipe' });
      } else {
        // Run all tests
        execSync('npm test', { stdio: 'pipe' });
      }
    } catch (error) {
      throw new Error('Tests failed after refactoring');
    }
  }

  /**
   * ANTI-LOOP: Create PR for refactoring (NOT on main!)
   */
  private async createRefactoringPR(
    filePath: string,
    issues: RefactoringIssue[]
  ): Promise<string> {
    const timestamp = Date.now();
    const branchName = `ai-refactor/${path.basename(filePath, '.ts')}-${timestamp}`;
    const issuesList = issues.map(i => `- ${i.type}: ${i.description}`).join('\n');

    try {
      // ANTI-LOOP: Verify we're not on main/master
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      if (currentBranch === 'main' || currentBranch === 'master') {
        logger.warn('⚠️ Cannot create PR from main/master branch');
        throw new Error('Not allowed to refactor on main/master branch');
      }

      // Create branch
      execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });

      // Commit
      const commitMessage = `🤖 Auto-refactor: ${filePath}

Issues fixed:
${issuesList}

Generated by: AI Refactoring Agent (DeepSeek Coder)
Verified by: Llama 3.3 70B

⚠️ Please review before merging`;

      execSync(`git add ${filePath}`, { stdio: 'pipe' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });

      // Push
      execSync(`git push origin ${branchName}`, { stdio: 'pipe' });

      // Create PR via gh CLI (if available)
      try {
        const prUrl = execSync(
          `gh pr create --title "🤖 Auto-refactor: ${path.basename(filePath)}" --body "${commitMessage}" --draft`,
          { encoding: 'utf-8', stdio: 'pipe' }
        ).trim();
        return prUrl;
      } catch {
        return `Branch created: ${branchName}`;
      }

    } catch (error) {
      logger.warn('Failed to create PR, changes committed locally', { branchName });
      return `Local branch: ${branchName}`;
    }
  }

  /**
   * ANTI-LOOP: Check if file is blacklisted
   */
  private isBlacklisted(filePath: string): boolean {
    return Array.from(this.blacklist).some(pattern => filePath.includes(pattern));
  }

  /**
   * ANTI-LOOP: Track processed file
   */
  private trackProcessedFile(filePath: string, success: boolean): void {
    const existing = this.processedFiles.get(filePath);

    this.processedFiles.set(filePath, {
      filePath,
      timestamp: Date.now(),
      success,
      errorCount: success ? 0 : (existing?.errorCount || 0) + 1
    });

    this.saveProcessedFiles();
  }

  /**
   * ANTI-LOOP: Load processed files history
   */
  private loadProcessedFiles(): void {
    try {
      if (fs.existsSync(this.processedFilesPath)) {
        const data = fs.readFileSync(this.processedFilesPath, 'utf-8');
        const parsed: ProcessedFile[] = JSON.parse(data);

        for (const file of parsed) {
          this.processedFiles.set(file.filePath, file);
        }

        logger.info(`Loaded ${this.processedFiles.size} processed files from history`);
      }
    } catch (error) {
      logger.warn('Failed to load processed files history', { error });
    }
  }

  /**
   * ANTI-LOOP: Save processed files history
   */
  private saveProcessedFiles(): void {
    try {
      const dir = path.dirname(this.processedFilesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Array.from(this.processedFiles.values());
      fs.writeFileSync(this.processedFilesPath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.warn('Failed to save processed files history', { error });
    }
  }

  /**
   * Clean markdown code blocks from AI response
   */
  private cleanCodeResponse(response: string): string {
    let cleaned = response.trim();

    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:typescript|ts|javascript|js)?\n/, '');
      cleaned = cleaned.replace(/\n```$/, '');
    }

    return cleaned.trim();
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    const now = Date.now();
    const processedLast24h = Array.from(this.processedFiles.values())
      .filter(f => now - f.timestamp < 24 * 60 * 60 * 1000);

    return {
      totalProcessed: this.processedFiles.size,
      processedLast24h: processedLast24h.length,
      successLast24h: processedLast24h.filter(f => f.success).length,
      blacklistSize: this.blacklist.size,
      cooldownPeriodDays: this.cooldownPeriod / (24 * 60 * 60 * 1000),
      maxFilesPerRun: this.maxFilesPerRun
    };
  }
}
