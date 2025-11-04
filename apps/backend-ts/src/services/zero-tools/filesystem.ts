/**
 * Filesystem tools for Zero mode
 * Compatible with Cloud Run (no MCP dependency)
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = process.env.PROJECT_ROOT || '/Users/antonellosiano/Desktop/NUZANTARA-2';

export interface ReadFileResult {
  ok: boolean;
  content?: string;
  lines?: number;
  size?: number;
  error?: string;
}

export interface EditFileResult {
  ok: boolean;
  changes?: number;
  error?: string;
}

export interface GlobResult {
  ok: boolean;
  files?: string[];
  count?: number;
  error?: string;
}

/**
 * Read file with line numbers (Claude Code style)
 */
export async function readFileZero(relativePath: string): Promise<ReadFileResult> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);

    // Security: prevent path traversal outside project
    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { ok: false, error: 'PATH_OUTSIDE_PROJECT' };
    }

    const content = await readFile(fullPath, 'utf-8');
    const lines = content.split('\n').length;
    const stats = await stat(fullPath);

    return {
      ok: true,
      content,
      lines,
      size: stats.size,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.code === 'ENOENT' ? 'FILE_NOT_FOUND' : error.message,
    };
  }
}

/**
 * Edit file with exact string replacement (Claude Code style)
 */
export async function editFileZero(
  relativePath: string,
  oldString: string,
  newString: string,
  replaceAll: boolean = false
): Promise<EditFileResult> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);

    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { ok: false, error: 'PATH_OUTSIDE_PROJECT' };
    }

    let content = await readFile(fullPath, 'utf-8');

    // Count occurrences
    const occurrences = (content.match(new RegExp(escapeRegex(oldString), 'g')) || []).length;

    if (occurrences === 0) {
      return { ok: false, error: 'STRING_NOT_FOUND' };
    }

    if (occurrences > 1 && !replaceAll) {
      return { ok: false, error: 'MULTIPLE_MATCHES_FOUND', changes: occurrences };
    }

    // Perform replacement
    if (replaceAll) {
      content = content.split(oldString).join(newString);
    } else {
      content = content.replace(oldString, newString);
    }

    await writeFile(fullPath, content, 'utf-8');

    return {
      ok: true,
      changes: replaceAll ? occurrences : 1,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Write new file (Claude Code style)
 */
export async function writeFileZero(
  relativePath: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);

    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { ok: false, error: 'PATH_OUTSIDE_PROJECT' };
    }

    await writeFile(fullPath, content, 'utf-8');
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

/**
 * Glob pattern matching (Claude Code style)
 */
export async function globZero(pattern: string): Promise<GlobResult> {
  try {
    // Simple glob implementation (for complex patterns, use 'glob' package)
    const { glob } = await import('glob');

    const files = await glob(pattern, {
      cwd: PROJECT_ROOT,
      absolute: false,
      nodir: true,
    });

    return {
      ok: true,
      files,
      count: files.length,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * List directory contents
 */
export async function listDirectoryZero(
  relativePath: string = '.'
): Promise<{ ok: boolean; files?: string[]; error?: string }> {
  try {
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);

    if (!fullPath.startsWith(PROJECT_ROOT)) {
      return { ok: false, error: 'PATH_OUTSIDE_PROJECT' };
    }

    const files = await readdir(fullPath);
    return { ok: true, files };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

// Helper function
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
