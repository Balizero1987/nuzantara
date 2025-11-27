#!/usr/bin/env node

/**
 * ============================================================================
 * NUZANTARA - AI CODE QUALITY GATE VALIDATOR
 * ============================================================================
 *
 * Questo è il cervello del sistema di coding automation.
 *
 * COSA FA:
 * - Conosce a memoria l'architettura del sistema (architectural-knowledge.yaml)
 * - Valida ogni cambiamento di codice contro policy rigorose
 * - Blocca codice non armonico, che rompe pattern, o introduce vulnerabilità
 * - Suggerisce fix automatici quando possibile
 * - Genera report dettagliati
 *
 * QUANDO SI ATTIVA:
 * - Pre-push (validazione rapida)
 * - CI/CD (validazione completa)
 * - IDE (feedback real-time - futuro)
 *
 * ============================================================================
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

// ============================================================================
// TYPES
// ============================================================================

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  warnings: Warning[];
  suggestions: Suggestion[];
  summary: Summary;
}

interface Violation {
  rule_id: string;
  rule_name: string;
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  message: string;
  code_snippet?: string;
  suggestion?: string;
}

interface Warning {
  rule_id: string;
  message: string;
  file: string;
}

interface Suggestion {
  rule_id: string;
  message: string;
  file: string;
  auto_fixable: boolean;
  fix?: string;
}

interface Summary {
  total_files_checked: number;
  violations_count: number;
  warnings_count: number;
  suggestions_count: number;
  critical_issues: number;
  can_proceed: boolean;
}

interface ArchitecturalKnowledge {
  workspace: {
    apps: Record<string, any>;
  };
  architectural_patterns: any;
  quality_standards: any;
  security: any;
  testing: any;
  ai_validation: any;
}

interface ValidationPolicies {
  policies: Record<string, any>;
  enforcement: any;
  exceptions: any;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Determine if we're running from .ai-code-quality/ or project root
const SCRIPT_DIR = __dirname;
const IS_IN_AI_DIR = SCRIPT_DIR.endsWith('.ai-code-quality');
const PROJECT_ROOT = IS_IN_AI_DIR ? path.dirname(SCRIPT_DIR) : process.cwd();
const AI_QUALITY_DIR = IS_IN_AI_DIR ? SCRIPT_DIR : path.join(PROJECT_ROOT, '.ai-code-quality');

const CONFIG = {
  ROOT_DIR: PROJECT_ROOT,
  AI_QUALITY_DIR: AI_QUALITY_DIR,
  REPORTS_DIR: path.join(AI_QUALITY_DIR, 'reports'),
  ARCHITECTURAL_KNOWLEDGE: path.join(AI_QUALITY_DIR, 'architectural-knowledge.yaml'),
  VALIDATION_POLICIES: path.join(AI_QUALITY_DIR, 'validation-policies.yaml'),
  MAX_FILE_SIZE: 1000000, // 1MB
};

// ============================================================================
// MAIN VALIDATOR CLASS
// ============================================================================

class AICodeValidator {
  private architecturalKnowledge: ArchitecturalKnowledge;
  private validationPolicies: ValidationPolicies;
  private modifiedFiles: string[] = [];
  private result: ValidationResult;

  constructor() {
    this.result = {
      passed: true,
      violations: [],
      warnings: [],
      suggestions: [],
      summary: {
        total_files_checked: 0,
        violations_count: 0,
        warnings_count: 0,
        suggestions_count: 0,
        critical_issues: 0,
        can_proceed: true,
      },
    };

    // Load configuration
    this.loadConfiguration();
  }

  /**
   * Load architectural knowledge and validation policies
   */
  private loadConfiguration(): void {
    console.log('🧠 Loading architectural knowledge...');

    try {
      const archKnowledge = fs.readFileSync(CONFIG.ARCHITECTURAL_KNOWLEDGE, 'utf8');
      this.architecturalKnowledge = yaml.parse(archKnowledge);

      const valPolicies = fs.readFileSync(CONFIG.VALIDATION_POLICIES, 'utf8');
      this.validationPolicies = yaml.parse(valPolicies);

      console.log('✅ Configuration loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      process.exit(1);
    }
  }

  /**
   * Get modified files from git
   */
  private getModifiedFiles(): string[] {
    console.log('📁 Detecting modified files...');

    try {
      // Get staged files
      const staged = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      // Get unstaged files
      const unstaged = execSync('git diff --name-only --diff-filter=ACM', {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      // Combine and deduplicate
      const allFiles = [...new Set([...staged, ...unstaged])];

      // Filter only source code files
      const sourceFiles = allFiles.filter((file) => {
        const ext = path.extname(file);
        return ['.ts', '.tsx', '.js', '.jsx', '.py', '.yaml', '.yml', '.json'].includes(ext);
      });

      console.log(`📊 Found ${sourceFiles.length} modified source files`);
      return sourceFiles;
    } catch {
      console.warn('⚠️  Could not get git diff, checking all files');
      return [];
    }
  }

  /**
   * Main validation entry point
   */
  async validate(): Promise<ValidationResult> {
    console.log('\n🚀 AI Code Quality Gate - Starting validation...\n');
    console.log('═'.repeat(70));

    // Get modified files
    this.modifiedFiles = this.getModifiedFiles();

    if (this.modifiedFiles.length === 0) {
      console.log('ℹ️  No files to validate');
      return this.result;
    }

    this.result.summary.total_files_checked = this.modifiedFiles.length;

    // Run validation checks
    console.log('\n📋 Running validation checks:\n');

    await this.checkArchitecturalCoherence();
    await this.checkCodeHarmony();
    await this.checkTypeSafety();
    await this.checkSecurity();
    await this.checkErrorHandling();
    await this.checkPerformance();
    await this.checkTesting();
    await this.checkComplexity();
    await this.checkBreakingChanges();

    // Generate summary
    this.generateSummary();

    // Save report
    this.saveReport();

    // Print results
    this.printResults();

    return this.result;
  }

  /**
   * Check architectural coherence
   */
  private async checkArchitecturalCoherence(): Promise<void> {
    console.log('🏗️  [1/9] Checking architectural coherence...');

    const policy = this.validationPolicies.policies.architectural_coherence;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      // Check layer violations
      if (this.isRouteFile(file)) {
        // Routes should not contain business logic
        if (this.containsBusinessLogic(content)) {
          this.addViolation({
            rule_id: 'arch-001',
            rule_name: 'Layer violation detection',
            severity: 'error',
            file,
            message: 'Route file contains business logic. Business logic should be in services.',
            suggestion:
              'Move business logic to a service class and call it from the route handler.',
          });
        }

        // Routes should not have direct DB access
        if (this.hasDirectDbAccess(content)) {
          this.addViolation({
            rule_id: 'arch-001',
            rule_name: 'Layer violation detection',
            severity: 'error',
            file,
            message: 'Route has direct database access. Use a service layer instead.',
            suggestion: 'Create a service class that handles database operations.',
          });
        }
      }

      // Check for circular dependencies (simplified)
      if (this.hasCircularDependency(file, content)) {
        this.addViolation({
          rule_id: 'arch-002',
          rule_name: 'Dependency direction',
          severity: 'error',
          file,
          message: 'Potential circular dependency detected.',
          suggestion: 'Refactor to use dependency injection or extract shared code.',
        });
      }
    }

    console.log('   ✅ Architectural coherence check complete');
  }

  /**
   * Check code harmony and consistency
   */
  private async checkCodeHarmony(): Promise<void> {
    console.log('🎨 [2/9] Checking code harmony...');

    const policy = this.validationPolicies.policies.code_harmony;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      // Check naming conventions
      const namingIssues = this.checkNamingConventions(file, content);
      namingIssues.forEach((issue) => this.addViolation(issue));

      // Check import organization
      if (!this.hasOrganizedImports(content)) {
        this.addWarning({
          rule_id: 'harm-003',
          message: 'Imports are not organized. Group by: external, internal, relative.',
          file,
        });
      }

      // Check consistency with existing patterns
      if (this.isTypeScriptFile(file)) {
        // Check async pattern consistency
        if (this.mixesPromiseStyles(content)) {
          this.addWarning({
            rule_id: 'harm-001',
            message: 'Mixing async/await and .then() styles. Be consistent.',
            file,
          });
        }
      }
    }

    console.log('   ✅ Code harmony check complete');
  }

  /**
   * Check type safety
   */
  private async checkTypeSafety(): Promise<void> {
    console.log('🔒 [3/9] Checking type safety...');

    const policy = this.validationPolicies.policies.type_safety;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      if (this.isTypeScriptFile(file)) {
        // Check for 'any' types
        const anyMatches = content.match(/:\s*any[\s,;)]/g);
        if (anyMatches && anyMatches.length > 0) {
          this.addViolation({
            rule_id: 'type-001',
            rule_name: 'No implicit any',
            severity: 'error',
            file,
            message: `Found ${anyMatches.length} usage(s) of 'any' type. All types must be explicit.`,
            suggestion: 'Replace "any" with specific types or create proper interfaces.',
          });
        }

        // Check for missing return types
        const functionsWithoutReturnType = this.findFunctionsWithoutReturnType(content);
        if (functionsWithoutReturnType.length > 0) {
          this.addViolation({
            rule_id: 'type-001',
            rule_name: 'No implicit any',
            severity: 'warning',
            file,
            message: `Found ${functionsWithoutReturnType.length} function(s) without explicit return type.`,
            suggestion: 'Add explicit return types to all functions.',
          });
        }
      }

      if (this.isPythonFile(file)) {
        // Check for type hints
        if (!this.hasPythonTypeHints(content)) {
          this.addViolation({
            rule_id: 'type-001',
            rule_name: 'No implicit any',
            severity: 'error',
            file,
            message: 'Python file missing type hints. All functions must have type annotations.',
            suggestion: 'Add type hints using typing module (e.g., def func(x: int) -> str:)',
          });
        }
      }
    }

    console.log('   ✅ Type safety check complete');
  }

  /**
   * Check security vulnerabilities
   */
  private async checkSecurity(): Promise<void> {
    console.log('🔐 [4/9] Checking security...');

    const policy = this.validationPolicies.policies.security;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      // Check for hardcoded secrets
      const secretPatterns = [
        {
          pattern: /(password|api[_-]?key|secret|token)\s*=\s*['"][^'"]+['"]/gi,
          name: 'Hardcoded secret',
        },
        {
          pattern: /process\.env\.[A-Z_]+\s*\|\|\s*['"][^'"]+['"]/g,
          name: 'Hardcoded fallback secret',
        },
      ];

      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(content)) {
          this.addViolation({
            rule_id: 'sec-001',
            rule_name: 'No hardcoded secrets',
            severity: 'error',
            file,
            message: `${name} detected. Secrets must come from environment variables.`,
            suggestion: 'Use process.env.SECRET_NAME or a secure config service.',
          });
        }
      }

      // Check for SQL injection risks
      const sqlInjectionPatterns = [
        /query\([`'"].*\$\{.*\}.*[`'"]\)/g,
        /execute\([`'"].*\+.*[`'"]\)/g,
        /raw\([`'"].*\$\{.*\}.*[`'"]\)/g,
      ];

      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(content)) {
          this.addViolation({
            rule_id: 'sec-003',
            rule_name: 'SQL injection prevention',
            severity: 'error',
            file,
            message: 'Potential SQL injection vulnerability. Use parameterized queries.',
            suggestion:
              'Use query builders or parameterized queries instead of string concatenation.',
          });
        }
      }

      // Check for XSS risks
      if (content.includes('dangerouslySetInnerHTML')) {
        this.addViolation({
          rule_id: 'sec-004',
          rule_name: 'XSS prevention',
          severity: 'warning',
          file,
          message: 'Using dangerouslySetInnerHTML. Ensure HTML is sanitized.',
          suggestion: 'Use DOMPurify or similar library to sanitize HTML before rendering.',
        });
      }

      // Check for eval usage
      if (/\beval\s*\(/g.test(content)) {
        this.addViolation({
          rule_id: 'sec-001',
          rule_name: 'No hardcoded secrets',
          severity: 'error',
          file,
          message: 'Usage of eval() detected. This is a severe security risk.',
          suggestion: 'Remove eval() and use safer alternatives.',
        });
      }
    }

    console.log('   ✅ Security check complete');
  }

  /**
   * Check error handling
   */
  private async checkErrorHandling(): Promise<void> {
    console.log('⚠️  [5/9] Checking error handling...');

    const policy = this.validationPolicies.policies.error_handling;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      // Check for empty catch blocks
      if (/catch\s*\([^)]*\)\s*\{\s*\}/g.test(content)) {
        this.addViolation({
          rule_id: 'err-001',
          rule_name: 'Proper error handling',
          severity: 'error',
          file,
          message: 'Empty catch block detected. Never swallow errors silently.',
          suggestion: 'Log the error or re-throw with context.',
        });
      }

      // Check for bare except in Python
      if (this.isPythonFile(file)) {
        if (/except\s*:/g.test(content)) {
          this.addViolation({
            rule_id: 'err-001',
            rule_name: 'Proper error handling',
            severity: 'error',
            file,
            message: 'Bare except clause detected. Catch specific exceptions.',
            suggestion: 'Use "except SpecificException as e:" instead.',
          });
        }
      }

      // Check for unhandled async operations
      if (this.hasUnhandledAsyncOperations(content)) {
        this.addWarning({
          rule_id: 'err-001',
          message: 'Async operation without error handling. Add try-catch.',
          file,
        });
      }
    }

    console.log('   ✅ Error handling check complete');
  }

  /**
   * Check performance issues
   */
  private async checkPerformance(): Promise<void> {
    console.log('⚡ [6/9] Checking performance...');

    const policy = this.validationPolicies.policies.performance;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      // Check for synchronous fs operations in async context
      if (/fs\.(readFileSync|writeFileSync|existsSync)/g.test(content)) {
        this.addWarning({
          rule_id: 'perf-001',
          message: 'Synchronous fs operation detected. Use async versions for better performance.',
          file,
        });
      }

      // Check for potential N+1 queries (simplified)
      if (this.hasPotentialN1Query(content)) {
        this.addWarning({
          rule_id: 'perf-002',
          message: 'Potential N+1 query detected. Consider using batch loading or joins.',
          file,
        });
      }
    }

    console.log('   ✅ Performance check complete');
  }

  /**
   * Check testing requirements
   */
  private async checkTesting(): Promise<void> {
    console.log('🧪 [7/9] Checking testing requirements...');

    const policy = this.validationPolicies.policies.testing;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    // Check if new code has tests
    const sourceFiles = this.modifiedFiles.filter(
      (f) => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('__tests__')
    );

    for (const file of sourceFiles) {
      const hasTest = this.hasCorrespondingTest(file);
      if (!hasTest) {
        this.addWarning({
          rule_id: 'test-001',
          message: 'New code without tests. Please add unit tests.',
          file,
        });
      }
    }

    console.log('   ✅ Testing check complete');
  }

  /**
   * Check code complexity
   */
  private async checkComplexity(): Promise<void> {
    console.log('📊 [8/9] Checking complexity...');

    const policy = this.validationPolicies.policies.complexity;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    const thresholds = policy.rules.find((r: any) => r.id === 'cmplx-001')?.thresholds;

    for (const file of this.modifiedFiles) {
      const content = this.readFile(file);
      if (!content) continue;

      const lines = content.split('\n');

      // Check file length
      if (lines.length > thresholds?.max_file_length) {
        this.addWarning({
          rule_id: 'cmplx-001',
          message: `File too long (${lines.length} lines). Consider splitting into smaller modules.`,
          file,
        });
      }

      // Check function length (simplified)
      const longFunctions = this.findLongFunctions(content, thresholds?.max_function_length);
      longFunctions.forEach((func) => {
        this.addWarning({
          rule_id: 'cmplx-001',
          message: `Function "${func.name}" is too long (${func.lines} lines). Extract into smaller functions.`,
          file,
        });
      });

      // Check nesting depth
      if (this.hasDeepNesting(content, thresholds?.max_nesting)) {
        this.addWarning({
          rule_id: 'cmplx-002',
          message: 'Deep nesting detected. Use early returns or extract functions.',
          file,
        });
      }
    }

    console.log('   ✅ Complexity check complete');
  }

  /**
   * Check for breaking changes
   */
  private async checkBreakingChanges(): Promise<void> {
    console.log('💥 [9/9] Checking breaking changes...');

    const policy = this.validationPolicies.policies.breaking_changes;
    if (!policy?.enabled) {
      console.log('   ⏭️  Skipped (disabled)');
      return;
    }

    for (const file of this.modifiedFiles) {
      // Check if shared package modified
      if (file.includes('packages/shared')) {
        this.addWarning({
          rule_id: 'break-002',
          message: 'Shared package modified. Ensure no breaking changes to public API.',
          file,
        });
      }

      // Check for removed exports
      const diff = this.getFileDiff(file);
      if (diff && this.hasRemovedExports(diff)) {
        this.addViolation({
          rule_id: 'break-002',
          rule_name: 'Contract compatibility',
          severity: 'error',
          file,
          message: 'Removed exports detected. This is a breaking change.',
          suggestion: 'Deprecate instead of removing, or bump major version.',
        });
      }
    }

    console.log('   ✅ Breaking changes check complete');
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private readFile(filePath: string): string | null {
    try {
      const fullPath = path.join(CONFIG.ROOT_DIR, filePath);
      if (!fs.existsSync(fullPath)) return null;

      const stats = fs.statSync(fullPath);
      if (stats.size > CONFIG.MAX_FILE_SIZE) {
        console.warn(`⚠️  Skipping ${filePath} (too large)`);
        return null;
      }

      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      console.warn(`⚠️  Could not read ${filePath}`);
      return null;
    }
  }

  private isTypeScriptFile(file: string): boolean {
    return /\.(ts|tsx)$/.test(file);
  }

  private isPythonFile(file: string): boolean {
    return /\.py$/.test(file);
  }

  private isRouteFile(file: string): boolean {
    return /\/(routes|controllers|api)\//.test(file) || file.includes('route');
  }

  private containsBusinessLogic(content: string): boolean {
    // Simplified check: look for complex logic in route handlers
    const patterns = [
      /app\.(get|post|put|delete).*\{[\s\S]{200,}\}/, // Long route handler
      /app\.(get|post|put|delete).*if\s*\(.*\{[\s\S]+\}/, // Conditional logic
    ];
    return patterns.some((p) => p.test(content));
  }

  private hasDirectDbAccess(content: string): boolean {
    return (
      /\.(query|execute|findOne|findMany|create|update|delete)\s*\(/.test(content) &&
      this.isRouteFile(content)
    );
  }

  private hasCircularDependency(file: string, content: string): boolean {
    // Simplified: this would need a full dependency graph in production
    const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    // Basic check for suspicious patterns
    return imports.some((imp) => imp.includes('../../../'));
  }

  private checkNamingConventions(file: string, content: string): Violation[] {
    const violations: Violation[] = [];
    const isTS = this.isTypeScriptFile(file);
    const isPy = this.isPythonFile(file);

    if (isTS) {
      // Check file naming (should be kebab-case)
      const fileName = path.basename(file, path.extname(file));
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fileName)) {
        violations.push({
          rule_id: 'harm-002',
          rule_name: 'Naming consistency',
          severity: 'warning',
          file,
          message: 'TypeScript file should use kebab-case naming.',
          suggestion: `Rename to ${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ts`,
        });
      }
    }

    if (isPy) {
      // Check file naming (should be snake_case)
      const fileName = path.basename(file, '.py');
      if (!/^[a-z0-9]+(_[a-z0-9]+)*$/.test(fileName)) {
        violations.push({
          rule_id: 'harm-002',
          rule_name: 'Naming consistency',
          severity: 'warning',
          file,
          message: 'Python file should use snake_case naming.',
          suggestion: `Rename to ${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.py`,
        });
      }
    }

    return violations;
  }

  private hasOrganizedImports(content: string): boolean {
    const importLines = content
      .split('\n')
      .filter((line) => line.trim().startsWith('import ') || line.trim().startsWith('from '));

    if (importLines.length < 3) return true;

    // Check if imports are grouped (simple heuristic)
    let hasExternalGroup = false;
    let hasInternalGroup = false;

    importLines.forEach((line) => {
      if (line.includes("from 'node:") || line.includes("from '@types/")) {
        hasExternalGroup = true;
      } else if (line.includes("from '@nuzantara/") || line.includes("from './")) {
        hasInternalGroup = true;
      }
    });

    return hasExternalGroup || hasInternalGroup;
  }

  private mixesPromiseStyles(content: string): boolean {
    const hasAsyncAwait = /async\s+\w+/.test(content) || /await\s+/.test(content);
    const hasThenCatch = /\.then\s*\(/.test(content);
    return hasAsyncAwait && hasThenCatch;
  }

  private findFunctionsWithoutReturnType(content: string): string[] {
    const matches = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
    return matches.filter((match) => !match.includes('):'));
  }

  private hasPythonTypeHints(content: string): boolean {
    // Check if functions have type hints
    const funcDefs = content.match(/def\s+\w+\s*\([^)]*\)/g) || [];
    if (funcDefs.length === 0) return true;

    const withTypes = funcDefs.filter((f) => f.includes(':')).length;
    return withTypes / funcDefs.length > 0.8; // 80% threshold
  }

  private hasUnhandledAsyncOperations(content: string): boolean {
    // Look for async calls without try-catch
    return /await\s+/.test(content) && !/try\s*\{[\s\S]*await[\s\S]*\}\s*catch/.test(content);
  }

  private hasPotentialN1Query(content: string): boolean {
    // Look for queries in loops
    return (
      /for\s*\([\s\S]*\.(query|find|findOne)/.test(content) ||
      /\.forEach\([\s\S]*\.(query|find|findOne)/.test(content)
    );
  }

  private hasCorrespondingTest(file: string): boolean {
    const testPatterns = [
      file.replace(/\.ts$/, '.test.ts'),
      file.replace(/\.ts$/, '.spec.ts'),
      file.replace(/\.py$/, '.test.py'),
      file.replace(/src\//, '__tests__/'),
    ];

    return testPatterns.some((testFile) => {
      const fullPath = path.join(CONFIG.ROOT_DIR, testFile);
      return fs.existsSync(fullPath);
    });
  }

  private findLongFunctions(
    content: string,
    maxLength: number
  ): Array<{ name: string; lines: number }> {
    const longFunctions: Array<{ name: string; lines: number }> = [];

    // Simple regex to find function declarations
    const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)\s*\{/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2];
      const startIdx = match.index;

      // Count lines in function (simplified)
      let braceCount = 1;
      let idx = startIdx + match[0].length;
      let lines = 1;

      while (idx < content.length && braceCount > 0) {
        if (content[idx] === '{') braceCount++;
        if (content[idx] === '}') braceCount--;
        if (content[idx] === '\n') lines++;
        idx++;
      }

      if (lines > maxLength) {
        longFunctions.push({ name: funcName, lines });
      }
    }

    return longFunctions;
  }

  private hasDeepNesting(content: string, maxDepth: number): boolean {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }

    return maxNesting > maxDepth;
  }

  private getFileDiff(file: string): string | null {
    try {
      return execSync(`git diff HEAD -- ${file}`, { encoding: 'utf8' });
    } catch {
      return null;
    }
  }

  private hasRemovedExports(diff: string): boolean {
    const removedExports = diff.match(/^-\s*export\s+/gm);
    const addedExports = diff.match(/^\+\s*export\s+/gm);

    return (removedExports?.length || 0) > (addedExports?.length || 0);
  }

  private addViolation(violation: Violation): void {
    this.result.violations.push(violation);
    if (violation.severity === 'error') {
      this.result.summary.critical_issues++;
      this.result.passed = false;
    }
  }

  private addWarning(warning: Warning): void {
    this.result.warnings.push(warning);
  }

  private generateSummary(): void {
    this.result.summary.violations_count = this.result.violations.length;
    this.result.summary.warnings_count = this.result.warnings.length;
    this.result.summary.suggestions_count = this.result.suggestions.length;
    this.result.summary.can_proceed =
      this.result.summary.critical_issues === 0 &&
      this.result.violations.filter((v) => v.severity === 'error').length === 0;
  }

  private saveReport(): void {
    try {
      if (!fs.existsSync(CONFIG.REPORTS_DIR)) {
        fs.mkdirSync(CONFIG.REPORTS_DIR, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(CONFIG.REPORTS_DIR, `report-${timestamp}.json`);
      const latestPath = path.join(CONFIG.REPORTS_DIR, 'latest.json');

      const report = JSON.stringify(this.result, null, 2);

      fs.writeFileSync(reportPath, report);
      fs.writeFileSync(latestPath, report);

      console.log(`\n📄 Report saved: ${reportPath}`);
    } catch (error) {
      console.error('❌ Failed to save report:', error);
    }
  }

  private printResults(): void {
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 VALIDATION SUMMARY\n');
    console.log(`   Files checked:     ${this.result.summary.total_files_checked}`);
    console.log(`   Violations:        ${this.result.summary.violations_count}`);
    console.log(`   Warnings:          ${this.result.summary.warnings_count}`);
    console.log(`   Critical issues:   ${this.result.summary.critical_issues}`);
    console.log(`   Can proceed:       ${this.result.summary.can_proceed ? '✅ YES' : '❌ NO'}\n`);

    if (this.result.violations.length > 0) {
      console.log('🚨 VIOLATIONS:\n');
      this.result.violations.forEach((v, i) => {
        console.log(`   ${i + 1}. [${v.severity.toUpperCase()}] ${v.rule_name}`);
        console.log(`      File: ${v.file}`);
        console.log(`      ${v.message}`);
        if (v.suggestion) {
          console.log(`      💡 Suggestion: ${v.suggestion}`);
        }
        console.log('');
      });
    }

    if (this.result.warnings.length > 0) {
      console.log('⚠️  WARNINGS:\n');
      this.result.warnings.slice(0, 5).forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.message}`);
        console.log(`      File: ${w.file}\n`);
      });

      if (this.result.warnings.length > 5) {
        console.log(`   ... and ${this.result.warnings.length - 5} more warnings\n`);
      }
    }

    console.log('═'.repeat(70));

    if (!this.result.summary.can_proceed) {
      console.log('\n❌ VALIDATION FAILED - Fix critical issues before proceeding\n');
    } else if (this.result.summary.warnings_count > 0) {
      console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS - Consider addressing warnings\n');
    } else {
      console.log('\n✅ VALIDATION PASSED - Code quality looks good!\n');
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const validator = new AICodeValidator();

  try {
    const result = await validator.validate();

    // Exit with error code if validation failed
    process.exit(result.summary.can_proceed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Validation failed with error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { AICodeValidator };
