/**
 * Zero Tools - Claude Code-like capabilities for ZANTARA
 *
 * Available when userId === 'zero'
 * Supports both localhost (MCP) and Cloud Run (custom tools)
 */

export * from './filesystem.js';
export * from './bash.js';
export * from './deployment.js';

import { readFileZero, editFileZero, writeFileZero, globZero, listDirectoryZero } from './filesystem.js';
import { bashZero, gitStatusZero, gitDiffZero, gitLogZero, npmRunZero, healthCheckZero } from './bash.js';
import { deployBackendZero, deployRagZero, checkWorkflowStatusZero, listRecentDeploymentsZero } from './deployment.js';

/**
 * Tool definitions for Claude API
 */
export const ZERO_TOOLS = [
  {
    name: 'read_file',
    description: 'Read any file in the NUZANTARA-2 project. Returns content with line count and size.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to project root (e.g., "src/index.ts", "package.json")'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'edit_file',
    description: 'Edit file with exact string replacement (like Claude Code Edit tool). Fails if string not found or multiple matches.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to project root'
        },
        old_string: {
          type: 'string',
          description: 'Exact string to replace (must be unique in file)'
        },
        new_string: {
          type: 'string',
          description: 'Replacement string'
        },
        replace_all: {
          type: 'boolean',
          description: 'Replace all occurrences (default: false)',
          default: false
        }
      },
      required: ['path', 'old_string', 'new_string']
    }
  },
  {
    name: 'write_file',
    description: 'Write new file or overwrite existing file',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path relative to project root'
        },
        content: {
          type: 'string',
          description: 'File content'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'glob',
    description: 'Find files matching glob pattern (e.g., "src/**/*.ts", "*.json")',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'list_directory',
    description: 'List contents of a directory',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path relative to project root (default: ".")',
          default: '.'
        }
      }
    }
  },
  {
    name: 'bash',
    description: 'Execute bash command in project directory. Allowed commands: git, npm, node, ls, cat, grep, find, curl, gcloud, gsutil, docker, make',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Bash command to execute'
        },
        cwd: {
          type: 'string',
          description: 'Working directory relative to project root (optional)'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 120000)',
          default: 120000
        }
      },
      required: ['command']
    }
  },
  {
    name: 'git_status',
    description: 'Get git status (short format)',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'git_diff',
    description: 'Get git diff for file or entire repository',
    input_schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Specific file to diff (optional)'
        }
      }
    }
  },
  {
    name: 'git_log',
    description: 'Get recent git commits',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of commits to show (default: 10)',
          default: 10
        }
      }
    }
  },
  {
    name: 'npm_run',
    description: 'Run npm script from package.json',
    input_schema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          description: 'Script name (e.g., "dev", "build", "test")'
        }
      },
      required: ['script']
    }
  },
  {
    name: 'deploy_backend',
    description: 'Deploy TypeScript backend to Cloud Run via GitHub Actions',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'deploy_rag',
    description: 'Deploy RAG backend to Cloud Run via GitHub Actions',
    input_schema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'check_workflow_status',
    description: 'Check status of GitHub Actions workflow run',
    input_schema: {
      type: 'object',
      properties: {
        run_id: {
          type: 'number',
          description: 'Workflow run ID'
        }
      },
      required: ['run_id']
    }
  },
  {
    name: 'list_recent_deployments',
    description: 'List recent GitHub Actions deployments',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of deployments to show (default: 5)',
          default: 5
        }
      }
    }
  },
  {
    name: 'health_check',
    description: 'Check health of production backends (TypeScript + RAG)',
    input_schema: {
      type: 'object',
      properties: {}
    }
  }
];

/**
 * Tool executor - maps tool names to implementations
 */
export async function executeZeroTool(
  toolName: string,
  toolInput: any
): Promise<any> {
  switch (toolName) {
    // Filesystem
    case 'read_file':
      return readFileZero(toolInput.path);

    case 'edit_file':
      return editFileZero(
        toolInput.path,
        toolInput.old_string,
        toolInput.new_string,
        toolInput.replace_all
      );

    case 'write_file':
      return writeFileZero(toolInput.path, toolInput.content);

    case 'glob':
      return globZero(toolInput.pattern);

    case 'list_directory':
      return listDirectoryZero(toolInput.path);

    // Bash
    case 'bash':
      return bashZero(toolInput.command, {
        cwd: toolInput.cwd,
        timeout: toolInput.timeout
      });

    case 'git_status':
      return gitStatusZero();

    case 'git_diff':
      return gitDiffZero(toolInput.file);

    case 'git_log':
      return gitLogZero(toolInput.limit);

    case 'npm_run':
      return npmRunZero(toolInput.script);

    case 'health_check':
      return healthCheckZero();

    // Deployment
    case 'deploy_backend':
      return deployBackendZero();

    case 'deploy_rag':
      return deployRagZero();

    case 'check_workflow_status':
      return checkWorkflowStatusZero(toolInput.run_id);

    case 'list_recent_deployments':
      return listRecentDeploymentsZero(toolInput.limit);

    default:
      return { ok: false, error: `Unknown tool: ${toolName}` };
  }
}
