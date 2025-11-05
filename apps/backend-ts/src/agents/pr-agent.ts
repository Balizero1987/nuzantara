/**
 * PR-AGENT
 * Complete autonomous workflow: modify → test → commit → PR
 *
 * Stack: MiniMax M2 (workflow orchestration) + Qwen3 (code modifications)
 * Impact: Autonomous code changes with human review gate
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import { OpenRouterClient } from './clients/openrouter.client.js';
import { DeepSeekClient } from './clients/deepseek.client.js';
import type { PRRequest, PRResult } from './types/agent.types.js';

export class PRAgent {
  private repoPath = '/Users/antonellosiano/Desktop/NUZANTARA-FLY';

  constructor(
    private openRouter: OpenRouterClient,
    private deepseek: DeepSeekClient
  ) {}

  async createPR(request: PRRequest): Promise<PRResult> {
    console.log('[PRAgent] Starting PR creation:', request.title);

    try {
      // Step 1: Create branch
      await this.createBranch(request.branchName);
      console.log('[PRAgent] Branch created:', request.branchName);

      // Step 2: Apply file changes
      await this.applyChanges(request.files);
      console.log('[PRAgent] Changes applied:', request.files.length, 'files');

      // Step 3: Run tests
      const testsPassed = await this.runTests();
      if (!testsPassed) {
        console.error('[PRAgent] Tests failed, attempting auto-fix...');
        const fixed = await this.autoFixTests();
        if (!fixed) {
          throw new Error('Tests failed and auto-fix unsuccessful');
        }
      }

      // Step 4: Run type check
      const typeCheckPassed = await this.runTypeCheck();
      if (!typeCheckPassed) {
        throw new Error('Type check failed');
      }

      // Step 5: Commit changes
      await this.commitChanges(request.title, request.description);
      console.log('[PRAgent] Changes committed');

      // Step 6: Push branch
      await this.pushBranch(request.branchName);
      console.log('[PRAgent] Branch pushed');

      // Step 7: Create PR via GitHub API
      const prResult = await this.createGitHubPR(request);
      console.log('[PRAgent] PR created:', prResult.url);

      return prResult;
    } catch (error: any) {
      console.error('[PRAgent] PR creation failed:', error);
      // Rollback branch
      await this.rollbackBranch();
      return {
        prNumber: 0,
        url: '',
        status: 'failed'
      };
    }
  }

  /**
   * Step 1: Create Git branch
   */
  private async createBranch(branchName: string): Promise<void> {
    try {
      // Ensure we're on main and up to date
      execSync('git checkout main', { cwd: this.repoPath, stdio: 'pipe' });
      execSync('git pull origin main', { cwd: this.repoPath, stdio: 'pipe' });

      // Create and checkout new branch
      execSync(`git checkout -b ${branchName}`, { cwd: this.repoPath, stdio: 'pipe' });
    } catch (error: any) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  /**
   * Step 2: Apply file changes
   */
  private async applyChanges(files: PRRequest['files']): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(this.repoPath, file.path);
      const dir = path.dirname(fullPath);

      if (file.action === 'create' || file.action === 'modify') {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, file.content, 'utf-8');
        console.log(`[PRAgent] ${file.action === 'create' ? 'Created' : 'Modified'}: ${file.path}`);
      } else if (file.action === 'delete') {
        try {
          await fs.unlink(fullPath);
          console.log(`[PRAgent] Deleted: ${file.path}`);
        } catch (error) {
          console.warn(`[PRAgent] Failed to delete ${file.path}:`, error);
        }
      }
    }
  }

  /**
   * Step 3: Run tests
   */
  private async runTests(): Promise<boolean> {
    try {
      execSync('npm test', {
        cwd: path.join(this.repoPath, 'apps/backend-ts'),
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout
      });
      return true;
    } catch (error) {
      console.error('[PRAgent] Tests failed');
      return false;
    }
  }

  /**
   * Auto-fix failing tests (attempt)
   */
  private async autoFixTests(): Promise<boolean> {
    // This would use the TestWriter or SelfHealing agent
    // For now, just return false
    console.log('[PRAgent] Auto-fix not implemented, escalating to human');
    return false;
  }

  /**
   * Step 4: Run TypeScript type check
   */
  private async runTypeCheck(): Promise<boolean> {
    try {
      execSync('npm run typecheck', {
        cwd: path.join(this.repoPath, 'apps/backend-ts'),
        stdio: 'pipe',
        timeout: 30000
      });
      return true;
    } catch (error) {
      console.error('[PRAgent] Type check failed');
      return false;
    }
  }

  /**
   * Step 5: Commit changes
   */
  private async commitChanges(title: string, description: string): Promise<void> {
    try {
      execSync('git add .', { cwd: this.repoPath, stdio: 'pipe' });

      const commitMessage = `${title}\n\n${description}\n\n🤖 Generated by ZANTARA PR-Agent`;

      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
        cwd: this.repoPath,
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  /**
   * Step 6: Push branch
   */
  private async pushBranch(branchName: string): Promise<void> {
    try {
      execSync(`git push -u origin ${branchName}`, {
        cwd: this.repoPath,
        stdio: 'pipe'
      });
    } catch (error: any) {
      throw new Error(`Failed to push: ${error.message}`);
    }
  }

  /**
   * Step 7: Create GitHub PR
   */
  private async createGitHubPR(request: PRRequest): Promise<PRResult> {
    try {
      // Use gh CLI to create PR
      const prBody = request.description + '\n\n---\n🤖 This PR was automatically created by ZANTARA PR-Agent';

      const reviewersArg = request.reviewers && request.reviewers.length > 0
        ? `--reviewer ${request.reviewers.join(',')}`
        : '';

      const result = execSync(
        `gh pr create --title "${request.title}" --body "${prBody.replace(/"/g, '\\"')}" ${reviewersArg}`,
        {
          cwd: this.repoPath,
          encoding: 'utf-8'
        }
      );

      // Extract PR URL from gh CLI output
      const prUrl = result.trim().split('\n').pop() || '';
      const prNumber = parseInt(prUrl.split('/').pop() || '0', 10);

      return {
        prNumber,
        url: prUrl,
        status: 'created'
      };
    } catch (error: any) {
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }

  /**
   * Rollback branch on failure
   */
  private async rollbackBranch(): Promise<void> {
    try {
      execSync('git checkout main', { cwd: this.repoPath, stdio: 'pipe' });
      console.log('[PRAgent] Rolled back to main branch');
    } catch (error) {
      console.error('[PRAgent] Rollback failed:', error);
    }
  }
}
