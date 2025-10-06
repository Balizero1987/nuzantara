/**
 * Bash execution tools for Zero mode
 * Compatible with Cloud Run
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/antonellosiano/Desktop/NUZANTARA-2';

// Command whitelist for security
const ALLOWED_COMMANDS = [
  'git',
  'npm',
  'node',
  'ls',
  'cat',
  'grep',
  'find',
  'pwd',
  'echo',
  'curl',
  'gcloud',
  'gsutil',
  'docker',
  'make'
];

export interface BashResult {
  ok: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
}

/**
 * Execute bash command with security controls
 */
export async function bashZero(
  command: string,
  options: {
    timeout?: number; // milliseconds
    cwd?: string; // relative to PROJECT_ROOT
  } = {}
): Promise<BashResult> {
  try {
    // Security: Check if command starts with allowed prefix
    const firstWord = command.trim().split(/\s+/)[0] || '';
    const isAllowed = ALLOWED_COMMANDS.some(cmd => firstWord === cmd || firstWord.startsWith(`${cmd}/`));

    if (!isAllowed) {
      return {
        ok: false,
        error: `COMMAND_NOT_ALLOWED: ${firstWord}. Allowed: ${ALLOWED_COMMANDS.join(', ')}`
      };
    }

    // Security: Block dangerous commands
    const FORBIDDEN_PATTERNS = [
      /rm\s+-rf\s+\//,  // rm -rf /
      />\s*\/dev\/sd/,   // writing to disk devices
      /mkfs/,            // format filesystem
      /dd\s+if=/,        // disk operations
      /:(){ :|:&};:/     // fork bomb
    ];

    if (FORBIDDEN_PATTERNS.some(pattern => pattern.test(command))) {
      return {
        ok: false,
        error: 'DANGEROUS_COMMAND_BLOCKED'
      };
    }

    const cwd = options.cwd
      ? `${PROJECT_ROOT}/${options.cwd}`.replace(/\/+/g, '/')
      : PROJECT_ROOT;

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: options.timeout || 120000, // 2 min default
      maxBuffer: 10 * 1024 * 1024, // 10MB
      env: {
        ...process.env,
        // Ensure git/gcloud use project config
        GIT_DIR: `${PROJECT_ROOT}/.git`,
        CLOUDSDK_CORE_PROJECT: process.env.FIREBASE_PROJECT_ID || 'involuted-box-469105-r0'
      }
    });

    return {
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0
    };
  } catch (error: any) {
    return {
      ok: false,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
      exitCode: error.code,
      error: error.message
    };
  }
}

/**
 * Git status (convenience wrapper)
 */
export async function gitStatusZero(): Promise<BashResult> {
  return bashZero('git status --short');
}

/**
 * Git diff (convenience wrapper)
 */
export async function gitDiffZero(file?: string): Promise<BashResult> {
  const cmd = file ? `git diff ${file}` : 'git diff';
  return bashZero(cmd);
}

/**
 * Git log (convenience wrapper)
 */
export async function gitLogZero(limit: number = 10): Promise<BashResult> {
  return bashZero(`git log --oneline -n ${limit}`);
}

/**
 * NPM commands
 */
export async function npmRunZero(script: string): Promise<BashResult> {
  return bashZero(`npm run ${script}`);
}

/**
 * Health check production endpoints
 */
export async function healthCheckZero(): Promise<BashResult> {
  const backends = [
    'https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/health',
    'https://zantara-rag-backend-himaadsxua-ew.a.run.app/health'
  ];

  const results = await Promise.all(
    backends.map(url => bashZero(`curl -sS ${url}`))
  );

  const combined = results.map((r, i) => `${backends[i]}:\n${r.stdout}`).join('\n\n');

  return {
    ok: results.every(r => r.ok),
    stdout: combined,
    stderr: results.map(r => r.stderr).filter(Boolean).join('\n')
  };
}
