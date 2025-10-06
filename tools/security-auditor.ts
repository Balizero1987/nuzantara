/**
 * Security Audit Tool
 * Comprehensive security analysis for NUZANTARA
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface SecurityIssue {
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  file: string;
  line?: number;
  issue: string;
  recommendation: string;
}

class SecurityAuditor {
  private issues: SecurityIssue[] = [];
  private srcPath: string;

  constructor(srcPath: string = './src') {
    this.srcPath = srcPath;
  }

  async runFullAudit(): Promise<SecurityIssue[]> {
    console.log('🔍 Starting comprehensive security audit...');
    
    await this.auditApiKeyExposure();
    await this.auditSqlInjection();
    await this.auditXssVulnerabilities();
    await this.auditAuthenticationFlaws();
    await this.auditRateLimiting();
    await this.auditInputValidation();
    await this.auditFileSystemSecurity();
    await this.auditDependencyVulnerabilities();

    return this.issues;
  }

  private addIssue(issue: SecurityIssue) {
    this.issues.push(issue);
  }

  private async auditApiKeyExposure() {
    console.log('🔑 Auditing API key exposure...');
    
    const sensitivePatterns = [
      /api[_-]?key.*=.*['"](.*?)['"]|ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY/gi,
      /password.*=.*['"](.*?)['"]|secret.*=.*['"](.*?)['"]/gi,
      /token.*=.*['"](.*?)['"]|auth.*=.*['"](.*?)['"]/gi,
    ];

    this.walkFiles(this.srcPath, (filePath, content) => {
      if (filePath.includes('.env') || filePath.includes('secret')) return;
      
      sensitivePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          this.addIssue({
            type: 'CRITICAL',
            category: 'API Key Exposure',
            file: filePath,
            issue: 'Potential hardcoded API key or secret detected',
            recommendation: 'Move sensitive data to environment variables or Secret Manager'
          });
        }
      });
    });
  }

  private async auditSqlInjection() {
    console.log('💉 Auditing SQL injection vulnerabilities...');
    
    const sqlPatterns = [
      /query.*\+.*params|`.*\$\{.*\}`.*query/gi,
      /sql.*=.*['"](.*?)['"].*\+/gi,
    ];

    this.walkFiles(this.srcPath, (filePath, content) => {
      sqlPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.addIssue({
            type: 'HIGH',
            category: 'SQL Injection',
            file: filePath,
            issue: 'Potential SQL injection vulnerability - dynamic query construction',
            recommendation: 'Use parameterized queries or ORM with prepared statements'
          });
        }
      });
    });
  }

  private async auditXssVulnerabilities() {
    console.log('🕸️ Auditing XSS vulnerabilities...');
    
    const xssPatterns = [
      /innerHTML.*=.*params|outerHTML.*=.*req\./gi,
      /dangerouslySetInnerHTML|eval\(|new Function\(/gi,
    ];

    this.walkFiles(this.srcPath, (filePath, content) => {
      xssPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.addIssue({
            type: 'HIGH',
            category: 'XSS Vulnerability',
            file: filePath,
            issue: 'Potential XSS vulnerability - unsafe HTML rendering',
            recommendation: 'Sanitize user input and use safe DOM manipulation'
          });
        }
      });
    });
  }

  private async auditAuthenticationFlaws() {
    console.log('🔐 Auditing authentication flaws...');
    
    this.walkFiles(this.srcPath, (filePath, content) => {
      // Check for weak authentication
      if (content.includes('bypass') && content.includes('auth')) {
        this.addIssue({
          type: 'CRITICAL',
          category: 'Authentication Bypass',
          file: filePath,
          issue: 'Potential authentication bypass detected',
          recommendation: 'Review authentication logic for security flaws'
        });
      }

      // Check for hardcoded credentials
      if (/password.*=.*['"](?!.*\$\{).*['"]/.test(content)) {
        this.addIssue({
          type: 'CRITICAL',
          category: 'Hardcoded Credentials',
          file: filePath,
          issue: 'Hardcoded password detected',
          recommendation: 'Use environment variables for credentials'
        });
      }
    });
  }

  private async auditRateLimiting() {
    console.log('⚡ Auditing rate limiting...');
    
    let hasRateLimit = false;
    this.walkFiles(this.srcPath, (filePath, content) => {
      if (content.includes('express-rate-limit') || content.includes('rate-limit')) {
        hasRateLimit = true;
      }
    });

    if (!hasRateLimit) {
      this.addIssue({
        type: 'MEDIUM',
        category: 'Rate Limiting',
        file: 'middleware/',
        issue: 'No rate limiting detected on API endpoints',
        recommendation: 'Implement rate limiting to prevent abuse and DoS attacks'
      });
    }
  }

  private async auditInputValidation() {
    console.log('✅ Auditing input validation...');
    
    this.walkFiles(this.srcPath, (filePath, content) => {
      // Check for direct parameter usage without validation
      if (/req\.body\.[a-zA-Z]+/.test(content) && !content.includes('validate') && !content.includes('schema')) {
        this.addIssue({
          type: 'MEDIUM',
          category: 'Input Validation',
          file: filePath,
          issue: 'Direct use of request parameters without validation',
          recommendation: 'Validate and sanitize all user inputs using schemas (Zod, Joi, etc.)'
        });
      }
    });
  }

  private async auditFileSystemSecurity() {
    console.log('📁 Auditing file system security...');
    
    const unsafePatterns = [
      /fs\.readFile.*req\.|fs\.writeFile.*req\./gi,
      /path\.join.*req\.|\.\.\/|__dirname.*req\./gi,
    ];

    this.walkFiles(this.srcPath, (filePath, content) => {
      unsafePatterns.forEach(pattern => {
        if (pattern.test(content)) {
          this.addIssue({
            type: 'HIGH',
            category: 'Path Traversal',
            file: filePath,
            issue: 'Potential path traversal vulnerability',
            recommendation: 'Validate and sanitize file paths, use path.resolve() with whitelist'
          });
        }
      });
    });
  }

  private async auditDependencyVulnerabilities() {
    console.log('📦 Auditing dependency vulnerabilities...');
    
    try {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'lodash', 'request', 'moment', 'debug', 'minimist', 'yargs-parser'
      ];
      
      Object.keys(dependencies).forEach(pkg => {
        if (vulnerablePackages.includes(pkg)) {
          this.addIssue({
            type: 'MEDIUM',
            category: 'Vulnerable Dependencies',
            file: 'package.json',
            issue: `Package '${pkg}' may have known vulnerabilities`,
            recommendation: 'Run npm audit and update to secure versions'
          });
        }
      });
    } catch (error) {
      console.warn('Could not read package.json');
    }
  }

  private walkFiles(dir: string, callback: (filePath: string, content: string) => void) {
    try {
      const files = readdirSync(dir);
      
      files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          this.walkFiles(filePath, callback);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
          try {
            const content = readFileSync(filePath, 'utf8');
            callback(filePath, content);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      });
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  generateReport(): string {
    const criticalIssues = this.issues.filter(i => i.type === 'CRITICAL');
    const highIssues = this.issues.filter(i => i.type === 'HIGH');
    const mediumIssues = this.issues.filter(i => i.type === 'MEDIUM');
    const lowIssues = this.issues.filter(i => i.type === 'LOW');

    return `
# 🔒 Security Audit Report

**Date**: ${new Date().toISOString()}
**Total Issues**: ${this.issues.length}

## 📊 Summary
- 🔴 **Critical**: ${criticalIssues.length}
- 🟠 **High**: ${highIssues.length}
- 🟡 **Medium**: ${mediumIssues.length}
- ⚪ **Low**: ${lowIssues.length}

## 🔴 Critical Issues
${criticalIssues.map(issue => `
### ${issue.category} - ${issue.file}
**Issue**: ${issue.issue}
**Recommendation**: ${issue.recommendation}
`).join('\n')}

## 🟠 High Priority Issues
${highIssues.map(issue => `
### ${issue.category} - ${issue.file}
**Issue**: ${issue.issue}
**Recommendation**: ${issue.recommendation}
`).join('\n')}

## 🟡 Medium Priority Issues
${mediumIssues.map(issue => `
### ${issue.category} - ${issue.file}
**Issue**: ${issue.issue}
**Recommendation**: ${issue.recommendation}
`).join('\n')}

## ✅ Recommended Actions
1. **Immediate**: Fix all Critical and High priority issues
2. **Environment Variables**: Move all API keys to Secret Manager
3. **Input Validation**: Implement comprehensive validation on all endpoints
4. **Rate Limiting**: Add rate limiting to all public endpoints
5. **Dependency Audit**: Run \`npm audit\` and update vulnerable packages
6. **Security Headers**: Implement security headers (CORS, CSP, etc.)
7. **Logging**: Implement security event logging and monitoring

## 🛡️ Security Best Practices
- Use HTTPS everywhere
- Implement proper authentication and authorization
- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Implement proper error handling (don't expose stack traces)
- Regular security audits and dependency updates
- Implement proper logging and monitoring
`;
  }
}

export { SecurityAuditor, SecurityIssue };