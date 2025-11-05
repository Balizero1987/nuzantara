/**
 * ENDPOINT-GENERATOR Agent
 * Generates complete API endpoints from natural language descriptions
 *
 * Stack: Qwen3 Coder 480B (code gen) + DeepSeek V3.1 (requirements analysis)
 * ROI: 20 min → <1 min per endpoint
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { OpenRouterClient } from './clients/openrouter.client.js';
import { DeepSeekClient } from './clients/deepseek.client.js';
import type { CodeGenerationRequest, CodeGenerationResult } from './types/agent.types.js';

export class EndpointGenerator {
  constructor(
    private openRouter: OpenRouterClient,
    private deepseek: DeepSeekClient
  ) {}

  async generate(request: CodeGenerationRequest): Promise<{
    handler: CodeGenerationResult;
    types: CodeGenerationResult;
    tests: CodeGenerationResult;
    routerUpdate: string;
  }> {
    console.log('[EndpointGenerator] Starting generation:', request.description);

    // Step 1: Analyze requirements with DeepSeek
    const spec = await this.analyzeRequirements(request.description);
    console.log('[EndpointGenerator] Requirements analyzed:', spec);

    // Step 2: Generate handler with Qwen3
    const handler = await this.generateHandler(spec);
    console.log('[EndpointGenerator] Handler generated');

    // Step 3: Generate types with Qwen3
    const types = await this.generateTypes(spec, handler.code);
    console.log('[EndpointGenerator] Types generated');

    // Step 4: Generate tests with Qwen3
    const tests = await this.generateTests(spec, handler.code);
    console.log('[EndpointGenerator] Tests generated');

    // Step 5: Generate router update
    const routerUpdate = await this.generateRouterUpdate(spec, handler.filePath);
    console.log('[EndpointGenerator] Router update generated');

    // Step 6: Write files
    await this.writeFiles({ handler, types, tests });

    return {
      handler,
      types,
      tests,
      routerUpdate
    };
  }

  /**
   * Step 1: Analyze requirements and create technical specification
   */
  private async analyzeRequirements(description: string): Promise<any> {
    // Use OpenRouter's DeepSeek instead of direct API (fallback)
    const response = await this.openRouter.deepseekV3([
      {
        role: 'system',
        content: `You are a technical architect for a TypeScript backend.
Analyze the user's request and create a detailed technical specification.

Return ONLY valid JSON (no markdown, no explanations):
{
  "name": "handlerName",
  "endpoint": "/api/path",
  "method": "GET|POST|PUT|DELETE",
  "description": "What this endpoint does",
  "inputs": [
    {"name": "param", "type": "string", "required": true, "source": "body|query|params"}
  ],
  "outputs": {
    "successType": "TypeName",
    "errorType": "ErrorType"
  },
  "dependencies": ["service1", "service2"],
  "validation": ["rule1", "rule2"],
  "authentication": true|false
}`
      },
      {
        role: 'user',
        content: description
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to analyze requirements: ' + response.error);
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.data.content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    return JSON.parse(jsonStr);
  }

  /**
   * Step 2: Generate handler code
   */
  private async generateHandler(spec: any): Promise<CodeGenerationResult> {
    const response = await this.openRouter.qwen3Coder([
      {
        role: 'system',
        content: `You are an expert TypeScript backend developer.
Generate a complete handler function following these patterns:

1. Import unified-logger for logging
2. Import necessary types
3. Export async function with descriptive name
4. Accept params object with typed fields
5. Use try/catch with proper error handling
6. Return {ok: true, data: ...} on success
7. Return {ok: false, error: ...} on failure
8. Add JSDoc comments
9. Follow clean code principles

Return ONLY the TypeScript code, no explanations.`
      },
      {
        role: 'user',
        content: `Generate handler for:\n${JSON.stringify(spec, null, 2)}`
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to generate handler: ' + response.error);
    }

    const code = this.cleanCode(response.data.content);
    const filePath = `src/handlers/${spec.name}.ts`;

    return {
      code,
      filePath,
      language: 'typescript'
    };
  }

  /**
   * Step 3: Generate TypeScript types
   */
  private async generateTypes(spec: any, handlerCode: string): Promise<CodeGenerationResult> {
    const response = await this.openRouter.qwen3Coder([
      {
        role: 'system',
        content: `Generate TypeScript type definitions for this handler.
Include:
- Request interface
- Response interface
- Error types
- Any custom types needed

Return ONLY TypeScript code.`
      },
      {
        role: 'user',
        content: `Spec:\n${JSON.stringify(spec, null, 2)}\n\nHandler:\n${handlerCode}`
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to generate types: ' + response.error);
    }

    const code = this.cleanCode(response.data.content);
    const filePath = `src/types/${spec.name}.types.ts`;

    return {
      code,
      filePath,
      language: 'typescript'
    };
  }

  /**
   * Step 4: Generate comprehensive tests
   */
  private async generateTests(spec: any, handlerCode: string): Promise<CodeGenerationResult> {
    const response = await this.openRouter.qwen3Coder([
      {
        role: 'system',
        content: `Generate comprehensive Jest tests for this handler.
Include:
- Success case tests
- Error case tests
- Input validation tests
- Edge case tests
- Mock external dependencies

Use Jest and follow testing best practices.
Return ONLY TypeScript test code.`
      },
      {
        role: 'user',
        content: `Spec:\n${JSON.stringify(spec, null, 2)}\n\nHandler:\n${handlerCode}`
      }
    ]);

    if (!response.success || !response.data?.content) {
      throw new Error('Failed to generate tests: ' + response.error);
    }

    const code = this.cleanCode(response.data.content);
    const filePath = `src/tests/${spec.name}.test.ts`;

    return {
      code,
      filePath,
      language: 'typescript'
    };
  }

  /**
   * Step 5: Generate router update code
   */
  private async generateRouterUpdate(spec: any, handlerPath: string): Promise<string> {
    return `
// Add to router-safe.ts

try {
  const { ${this.toCamelCase(spec.name)} } = await import('../handlers/${spec.name}.js');

  router.${spec.method.toLowerCase()}('${spec.endpoint}', async (req: any, res: any) => {
    try {
      const result = await ${this.toCamelCase(spec.name)}(req.body);
      res.json(result);
    } catch (error: any) {
      logger.error('${spec.name} error:', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  loadedCount += 1;
  logger.info('  ✅ ${spec.name} route loaded');
} catch (error: any) {
  logger.warn(\`  ⚠️ ${spec.name} route skipped: \${error.message}\`);
  failedCount += 1;
}
`;
  }

  /**
   * Write generated files to disk
   */
  private async writeFiles(files: {
    handler: CodeGenerationResult;
    types: CodeGenerationResult;
    tests: CodeGenerationResult;
  }): Promise<void> {
    const baseDir = '/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-ts';

    for (const file of [files.handler, files.types, files.tests]) {
      const fullPath = path.join(baseDir, file.filePath);
      const dir = path.dirname(fullPath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file.code, 'utf-8');

      console.log(`[EndpointGenerator] Written: ${fullPath}`);
    }
  }

  /**
   * Clean code output (remove markdown, extra whitespace)
   */
  private cleanCode(code: string): string {
    return code
      .replace(/```typescript\n?/g, '')
      .replace(/```ts\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }

  /**
   * Convert kebab-case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}
