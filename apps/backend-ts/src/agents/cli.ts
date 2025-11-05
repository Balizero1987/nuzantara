#!/usr/bin/env tsx
/**
 * ZANTARA Agent CLI
 * Command-line interface for manually invoking AI agents
 *
 * Usage:
 *   tsx src/agents/cli.ts generate-endpoint "Create endpoint for visa status check"
 *   tsx src/agents/cli.ts integrate-memory src/handlers/visa-check.ts
 *   tsx src/agents/cli.ts generate-tests src/handlers/visa-check.ts
 *   tsx src/agents/cli.ts heal-error <error-json-file>
 *   tsx src/agents/cli.ts create-pr agent/feature-name "Add visa status endpoint"
 */

import { AgentOrchestrator } from './agent-orchestrator.js';

// API Keys from environment or hardcoded (for development)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-6f68785d946542769c7ba7b8f64dff86';

const orchestrator = new AgentOrchestrator({
  openRouterApiKey: OPENROUTER_API_KEY,
  deepseekApiKey: DEEPSEEK_API_KEY
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  console.log('🤖 ZANTARA Agent CLI\n');

  try {
    switch (command) {
      case 'generate-endpoint':
        await generateEndpoint(args[1]);
        break;

      case 'integrate-memory':
        await integrateMemory(args[1], args[2] || 'sessionId', args[3] || 'userId');
        break;

      case 'generate-tests':
        await generateTests(args[1], args[2] || 'unit');
        break;

      case 'heal-error':
        await healError(args[1]);
        break;

      case 'create-pr':
        await createPR(args[1], args[2]);
        break;

      case 'status':
        await showStatus(args[1]);
        break;

      default:
        console.error(`Unknown command: ${command}\n`);
        printUsage();
        process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Generate new endpoint
 */
async function generateEndpoint(description: string) {
  if (!description) {
    console.error('Error: Missing endpoint description');
    console.log('Usage: tsx cli.ts generate-endpoint "Create endpoint for..."');
    process.exit(1);
  }

  console.log('📝 Generating endpoint from description...');
  console.log(`   "${description}"\n`);

  const taskId = await orchestrator.submitTask(
    'endpoint-generator',
    { description, type: 'endpoint' },
    { timestamp: new Date() }
  );

  await waitForTask(taskId);
}

/**
 * Integrate memory into handler
 */
async function integrateMemory(handlerPath: string, sessionField: string, userField: string) {
  if (!handlerPath) {
    console.error('Error: Missing handler path');
    console.log('Usage: tsx cli.ts integrate-memory src/handlers/foo.ts [sessionField] [userField]');
    process.exit(1);
  }

  console.log('🧠 Integrating memory into handler...');
  console.log(`   Handler: ${handlerPath}`);
  console.log(`   Session field: ${sessionField}`);
  console.log(`   User field: ${userField}\n`);

  const taskId = await orchestrator.submitTask(
    'memory-integrator',
    {
      handlerPath,
      sessionIdField: sessionField,
      userIdField: userField
    },
    { timestamp: new Date() }
  );

  await waitForTask(taskId);
}

/**
 * Generate tests
 */
async function generateTests(filePath: string, testType: string) {
  if (!filePath) {
    console.error('Error: Missing file path');
    console.log('Usage: tsx cli.ts generate-tests src/handlers/foo.ts [unit|integration|e2e]');
    process.exit(1);
  }

  // Read source file
  const fs = await import('fs/promises');
  const sourceCode = await fs.readFile(filePath, 'utf-8');

  console.log('🧪 Generating tests...');
  console.log(`   File: ${filePath}`);
  console.log(`   Type: ${testType}\n`);

  const taskId = await orchestrator.submitTask(
    'test-writer',
    { sourceCode, filePath, testType },
    { timestamp: new Date() }
  );

  await waitForTask(taskId);
}

/**
 * Heal production error
 */
async function healError(errorJsonFile: string) {
  if (!errorJsonFile) {
    console.error('Error: Missing error JSON file');
    console.log('Usage: tsx cli.ts heal-error error.json');
    process.exit(1);
  }

  const fs = await import('fs/promises');
  const errorData = JSON.parse(await fs.readFile(errorJsonFile, 'utf-8'));

  console.log('🩹 Analyzing and healing error...');
  console.log(`   Type: ${errorData.errorType}\n`);

  const taskId = await orchestrator.submitTask(
    'self-healing',
    errorData,
    { timestamp: new Date() }
  );

  await waitForTask(taskId);
}

/**
 * Create PR
 */
async function createPR(branchName: string, title: string) {
  if (!branchName || !title) {
    console.error('Error: Missing branch name or title');
    console.log('Usage: tsx cli.ts create-pr branch-name "PR title"');
    process.exit(1);
  }

  console.log('📋 Creating PR...');
  console.log(`   Branch: ${branchName}`);
  console.log(`   Title: ${title}\n`);

  // This would need actual file changes
  console.error('Error: create-pr requires file changes specification');
  console.log('This command is designed to be used programmatically');
  process.exit(1);
}

/**
 * Show task status
 */
async function showStatus(taskId: string) {
  if (!taskId) {
    // Show all tasks
    const tasks = orchestrator.getAllTasks();
    console.log(`📊 All Tasks (${tasks.length}):\n`);

    for (const task of tasks.slice(-10)) { // Last 10
      const duration = task.endTime && task.startTime
        ? `${((task.endTime.getTime() - task.startTime.getTime()) / 1000).toFixed(1)}s`
        : 'running...';

      console.log(`  ${task.id}`);
      console.log(`    Type: ${task.type}`);
      console.log(`    Status: ${task.status}`);
      console.log(`    Duration: ${duration}`);
      if (task.error) console.log(`    Error: ${task.error}`);
      console.log();
    }
  } else {
    // Show specific task
    const task = orchestrator.getTask(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      process.exit(1);
    }

    console.log(`📊 Task: ${taskId}\n`);
    console.log(`  Type: ${task.type}`);
    console.log(`  Status: ${task.status}`);
    console.log(`  Started: ${task.startTime?.toISOString()}`);
    if (task.endTime) console.log(`  Ended: ${task.endTime.toISOString()}`);
    if (task.error) console.log(`  Error: ${task.error}`);
    if (task.result) {
      console.log(`\n  Result:`);
      console.log(JSON.stringify(task.result, null, 2));
    }
  }
}

/**
 * Wait for task completion and show result
 */
async function waitForTask(taskId: string) {
  console.log(`⏳ Task submitted: ${taskId}`);
  console.log('   Waiting for completion...\n');

  let lastStatus = '';
  const startTime = Date.now();

  while (true) {
    const task = orchestrator.getTask(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== lastStatus) {
      console.log(`   Status: ${task.status}`);
      lastStatus = task.status;
    }

    if (task.status === 'completed') {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ Task completed in ${duration}s\n`);
      console.log('Result:');
      console.log(JSON.stringify(task.result, null, 2));
      break;
    }

    if (task.status === 'failed') {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n❌ Task failed after ${duration}s\n`);
      console.log('Error:', task.error);
      process.exit(1);
    }

    await sleep(1000); // Check every second
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print usage
 */
function printUsage() {
  console.log(`
🤖 ZANTARA Agent CLI

Usage:
  tsx src/agents/cli.ts <command> [options]

Commands:
  generate-endpoint <description>
    Generate a complete API endpoint from natural language description
    Example: tsx cli.ts generate-endpoint "Create endpoint to check visa status"

  integrate-memory <handler-path> [sessionField] [userField]
    Integrate session memory into an existing handler
    Example: tsx cli.ts integrate-memory src/handlers/visa-check.ts

  generate-tests <file-path> [type]
    Generate comprehensive tests for a file (type: unit|integration|e2e)
    Example: tsx cli.ts generate-tests src/handlers/visa-check.ts unit

  heal-error <error-json-file>
    Analyze and attempt to fix a production error
    Example: tsx cli.ts heal-error error.json

  status [task-id]
    Show status of all tasks or a specific task
    Example: tsx cli.ts status

Environment Variables:
  OPENROUTER_API_KEY  OpenRouter API key (default: embedded)
  DEEPSEEK_API_KEY    DeepSeek API key (default: embedded)
`);
}

// Run main
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
