#!/usr/bin/env ts-node
/**
 * Integration Analysis Tool
 * 
 * Analyzes all backend-frontend integrations:
 * - API endpoints
 * - Frontend clients
 * - Tools and handlers
 * - Creates comprehensive mapping and test suite
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Endpoint {
  method: string;
  path: string;
  handler: string;
  auth: boolean;
  description: string;
  file: string;
  line: number;
}

interface ClientCall {
  method: string;
  url: string;
  endpoint: string;
  file: string;
  line: number;
  description: string;
}

interface Integration {
  endpoint: Endpoint;
  clients: ClientCall[];
  status: 'operational' | 'ready_not_operational' | 'not_implemented' | 'deprecated';
  testStatus: 'passed' | 'failed' | 'not_tested';
  notes: string;
}

interface IntegrationGroup {
  name: string;
  description: string;
  integrations: Integration[];
}

class IntegrationAnalyzer {
  private endpoints: Endpoint[] = [];
  private clientCalls: ClientCall[] = [];
  private integrations: Integration[] = [];
  private groups: IntegrationGroup[] = [];

  constructor(private rootDir: string) {}

  /**
   * Analyze backend endpoints
   */
  analyzeBackendEndpoints(): void {
    console.log('🔍 Analyzing backend endpoints...');

    const backendFiles = [
      'src/api/server.ts',
      'src/api/dashboard-endpoints.ts',
      'src/api/auth.ts',
    ];

    for (const file of backendFiles) {
      const filePath = path.join(this.rootDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Match Express routes: app.get, app.post, app.put, app.delete, router.get, etc.
      const routePattern = /(?:app|router)\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g;
      const authPattern = /validateApiKey|authenticate|auth/gi;

      let match;
      while ((match = routePattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const routePath = match[2];
        const lineNumber = content.substring(0, match.index).split('\n').length;

        // Check if auth is required
        const handlerStart = match.index;
        const handlerEnd = content.indexOf('}', handlerStart);
        const handlerCode = content.substring(handlerStart, handlerEnd);
        const requiresAuth = authPattern.test(handlerCode);

        // Extract handler name
        const handlerMatch = handlerCode.match(/\.bind\(this\)|this\.(\w+)|(\w+)\s*\(/);
        const handler = handlerMatch ? (handlerMatch[1] || handlerMatch[2] || 'anonymous') : 'anonymous';

        // Extract description from comments
        const lineBefore = lines[lineNumber - 2] || '';
        const description = lineBefore.trim().startsWith('//') 
          ? lineBefore.replace('//', '').trim() 
          : routePath;

        this.endpoints.push({
          method,
          path: routePath,
          handler,
          auth: requiresAuth,
          description,
          file,
          line: lineNumber,
        });
      }
    }

    console.log(`✅ Found ${this.endpoints.length} backend endpoints`);
  }

  /**
   * Analyze frontend client calls
   */
  analyzeFrontendClients(): void {
    console.log('🔍 Analyzing frontend client calls...');

    const jsDir = path.join(this.rootDir, 'js');
    if (!fs.existsSync(jsDir)) {
      console.warn('⚠️  js/ directory not found');
      return;
    }

    const files = this.getAllJsFiles(jsDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // Match fetch calls
      const fetchPattern = /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
      // Match axios calls
      const axiosPattern = /axios\.(get|post|put|delete|patch)\s*\([`'"]([^`'"]+)[`'"]/g;
      // Match ZantaraClient methods
      const zantaraPattern = /(sendMessage|sendMessageStream|authenticate|getHistory)/g;

      let match;
      while ((match = fetchPattern.exec(content)) !== null) {
        const url = match[1];
        const endpoint = this.extractEndpoint(url);
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const method = this.inferMethod(content, match.index);

        this.clientCalls.push({
          method,
          url,
          endpoint,
          file: path.relative(this.rootDir, file),
          line: lineNumber,
          description: this.extractDescription(lines, lineNumber),
        });
      }

      while ((match = axiosPattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const url = match[2];
        const endpoint = this.extractEndpoint(url);
        const lineNumber = content.substring(0, match.index).split('\n').length;

        this.clientCalls.push({
          method,
          url,
          endpoint,
          file: path.relative(this.rootDir, file),
          line: lineNumber,
          description: this.extractDescription(lines, lineNumber),
        });
      }
    }

    console.log(`✅ Found ${this.clientCalls.length} frontend client calls`);
  }

  /**
   * Match endpoints with client calls
   */
  matchIntegrations(): void {
    console.log('🔗 Matching endpoints with client calls...');

    for (const endpoint of this.endpoints) {
      const matchingClients = this.clientCalls.filter(client => {
        // Normalize paths for comparison
        const endpointPath = this.normalizePath(endpoint.path);
        const clientPath = this.normalizePath(client.endpoint);

        return endpointPath === clientPath && endpoint.method === client.method;
      });

      // Determine status
      let status: Integration['status'] = 'not_implemented';
      if (matchingClients.length > 0) {
        status = 'operational'; // Assume operational if client exists
      } else if (endpoint.path.includes('/api/')) {
        status = 'ready_not_operational'; // API endpoint exists but no client
      }

      this.integrations.push({
        endpoint,
        clients: matchingClients,
        status,
        testStatus: 'not_tested',
        notes: matchingClients.length === 0 ? 'No frontend client found' : '',
      });
    }

    // Find orphaned client calls (calls without matching endpoints)
    for (const client of this.clientCalls) {
      const hasMatch = this.integrations.some(integration =>
        this.normalizePath(integration.endpoint.path) === this.normalizePath(client.endpoint) &&
        integration.endpoint.method === client.method
      );

      if (!hasMatch) {
        this.integrations.push({
          endpoint: {
            method: client.method,
            path: client.endpoint,
            handler: 'not_found',
            auth: false,
            description: 'Orphaned client call - endpoint not found in backend',
            file: 'N/A',
            line: 0,
          },
          clients: [client],
          status: 'not_implemented',
          testStatus: 'not_tested',
          notes: 'Frontend calls this endpoint but backend handler not found',
        });
      }
    }

    console.log(`✅ Matched ${this.integrations.length} integrations`);
  }

  /**
   * Group integrations logically
   */
  groupIntegrations(): void {
    console.log('📦 Grouping integrations...');

    const groups: Record<string, Integration[]> = {
      'Authentication & Authorization': [],
      'Chat & Messaging': [],
      'Articles & Content': [],
      'Dashboard & Monitoring': [],
      'Images & Media': [],
      'Processing & AI': [],
      'Health & Status': [],
      'Other': [],
    };

    for (const integration of this.integrations) {
      const path = integration.endpoint.path.toLowerCase();

      if (path.includes('auth') || path.includes('login') || path.includes('token')) {
        groups['Authentication & Authorization'].push(integration);
      } else if (path.includes('chat') || path.includes('message') || path.includes('conversation')) {
        groups['Chat & Messaging'].push(integration);
      } else if (path.includes('article') || path.includes('content') || path.includes('feed')) {
        groups['Articles & Content'].push(integration);
      } else if (path.includes('dashboard') || path.includes('stats') || path.includes('source')) {
        groups['Dashboard & Monitoring'].push(integration);
      } else if (path.includes('image') || path.includes('cover') || path.includes('media')) {
        groups['Images & Media'].push(integration);
      } else if (path.includes('process') || path.includes('ai') || path.includes('synthesize')) {
        groups['Processing & AI'].push(integration);
      } else if (path.includes('health') || path.includes('status')) {
        groups['Health & Status'].push(integration);
      } else {
        groups['Other'].push(integration);
      }
    }

    this.groups = Object.entries(groups)
      .filter(([_, integrations]) => integrations.length > 0)
      .map(([name, integrations]) => ({
        name,
        description: `${integrations.length} integration(s)`,
        integrations,
      }));

    console.log(`✅ Created ${this.groups.length} integration groups`);
  }

  /**
   * Generate comprehensive report
   */
  generateReport(): string {
    let report = '# Integration Analysis Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Summary
    const operational = this.integrations.filter(i => i.status === 'operational').length;
    const readyNotOperational = this.integrations.filter(i => i.status === 'ready_not_operational').length;
    const notImplemented = this.integrations.filter(i => i.status === 'not_implemented').length;

    report += '## Summary\n\n';
    report += `- **Total Integrations**: ${this.integrations.length}\n`;
    report += `- **Operational**: ${operational} ✅\n`;
    report += `- **Ready but Not Operational**: ${readyNotOperational} ⚠️\n`;
    report += `- **Not Implemented**: ${notImplemented} ❌\n\n`;

    // Groups
    for (const group of this.groups) {
      report += `## ${group.name}\n\n`;
      report += `*${group.description}*\n\n`;

      for (const integration of group.integrations) {
        const statusIcon = {
          operational: '✅',
          ready_not_operational: '⚠️',
          not_implemented: '❌',
          deprecated: '🗑️',
        }[integration.status];

        report += `### ${statusIcon} ${integration.endpoint.method} ${integration.endpoint.path}\n\n`;
        report += `- **Status**: ${integration.status}\n`;
        report += `- **Handler**: ${integration.endpoint.handler}\n`;
        report += `- **Auth Required**: ${integration.endpoint.auth ? 'Yes' : 'No'}\n`;
        report += `- **File**: ${integration.endpoint.file}:${integration.endpoint.line}\n`;
        report += `- **Description**: ${integration.endpoint.description}\n`;

        if (integration.clients.length > 0) {
          report += `\n**Frontend Clients (${integration.clients.length}):**\n`;
          for (const client of integration.clients) {
            report += `- ${client.file}:${client.line} - ${client.description}\n`;
          }
        } else {
          report += `\n**⚠️ No frontend client found**\n`;
        }

        if (integration.notes) {
          report += `\n**Notes**: ${integration.notes}\n`;
        }

        report += '\n';
      }
    }

    // Checklist
    report += '## Checklist\n\n';
    report += '### Operational Integrations\n';
    for (const integration of this.integrations.filter(i => i.status === 'operational')) {
      report += `- [ ] Test ${integration.endpoint.method} ${integration.endpoint.path}\n`;
    }

    report += '\n### Ready but Not Operational\n';
    for (const integration of this.integrations.filter(i => i.status === 'ready_not_operational')) {
      report += `- [ ] Create frontend client for ${integration.endpoint.method} ${integration.endpoint.path}\n`;
    }

    report += '\n### Not Implemented\n';
    for (const integration of this.integrations.filter(i => i.status === 'not_implemented')) {
      report += `- [ ] Implement ${integration.endpoint.method} ${integration.endpoint.path}\n`;
    }

    return report;
  }

  /**
   * Generate test suite
   */
  generateTestSuite(): string {
    let tests = `// Auto-generated integration tests
// Run with: npm test -- integration

import { expect, test, describe } from '@jest/globals';

const API_BASE = process.env.API_BASE_URL || 'https://nuzantara-rag.fly.dev';
const BACKEND_BASE = process.env.BACKEND_BASE_URL || 'https://nuzantara-backend.fly.dev';

describe('Integration Tests', () => {
`;

    for (const group of this.groups) {
      tests += `  describe('${group.name}', () => {\n`;

      for (const integration of group.integrations) {
        if (integration.status === 'operational') {
          const testName = `${integration.endpoint.method} ${integration.endpoint.path}`;
          tests += `    test('${testName}', async () => {\n`;
          tests += `      const response = await fetch(\`\${API_BASE}${integration.endpoint.path}\`, {\n`;
          tests += `        method: '${integration.endpoint.method}',\n`;
          if (integration.endpoint.auth) {
            tests += `        headers: { 'Authorization': 'Bearer test-token' },\n`;
          }
          tests += `      });\n`;
          tests += `      expect(response.status).toBeLessThan(500);\n`;
          tests += `    });\n\n`;
        }
      }

      tests += `  });\n\n`;
    }

    tests += `});\n`;
    return tests;
  }

  // Helper methods
  private getAllJsFiles(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules')) {
        files.push(...this.getAllJsFiles(fullPath));
      } else if (item.endsWith('.js') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      // Relative URL
      const match = url.match(/^([^?#]+)/);
      return match ? match[1] : url;
    }
  }

  private normalizePath(path: string): string {
    return path
      .replace(/:[^/]+/g, ':id') // Normalize params
      .replace(/\/$/, '') // Remove trailing slash
      .toLowerCase();
  }

  private inferMethod(content: string, index: number): string {
    const before = content.substring(Math.max(0, index - 100), index);
    const methodMatch = before.match(/(?:method|verb)\s*[:=]\s*['"](GET|POST|PUT|DELETE|PATCH)['"]/i);
    return methodMatch ? methodMatch[1] : 'GET';
  }

  private extractDescription(lines: string[], lineNumber: number): string {
    // Look for comments before the line
    for (let i = Math.max(0, lineNumber - 3); i < lineNumber; i++) {
      const line = lines[i]?.trim();
      if (line?.startsWith('//')) {
        return line.replace('//', '').trim();
      }
    }
    return 'No description';
  }
}

// Main execution
const rootDir = path.resolve(__dirname, '..');
const analyzer = new IntegrationAnalyzer(rootDir);

console.log('🚀 Starting integration analysis...\n');

analyzer.analyzeBackendEndpoints();
analyzer.analyzeFrontendClients();
analyzer.matchIntegrations();
analyzer.groupIntegrations();

const report = analyzer.generateReport();
const testSuite = analyzer.generateTestSuite();

// Write reports
const reportsDir = path.join(rootDir, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(reportsDir, 'integration-analysis.md'),
  report
);

fs.writeFileSync(
  path.join(reportsDir, 'integration-tests.test.ts'),
  testSuite
);

console.log('\n✅ Analysis complete!');
console.log(`📄 Report: reports/integration-analysis.md`);
console.log(`🧪 Tests: reports/integration-tests.test.ts`);




