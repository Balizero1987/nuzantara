#!/usr/bin/env node

/**
 * ZANTARA Logging Migration Script
 *
 * This script helps migrate existing log statements to the unified logging system.
 * It scans TypeScript files and converts common logging patterns.
 *
 * Usage:
 *   npx tsx src/logging/migration-script.ts [--dry-run] [--path=./src]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MigrationOptions {
  dryRun: boolean;
  targetPath: string;
  backup: boolean;
  verbose: boolean;
}

interface MigrationStats {
  filesProcessed: number;
  filesModified: number;
  consoleLogReplaced: number;
  loggerImportFixed: number;
  structuredLoggingAdded: number;
  errorsFixed: number;
}

// Migration patterns and their replacements
const migrationPatterns = [
  // Console logging patterns
  {
    pattern: /console\.log\(`([^`]+)`\);?/g,
    replacement: (match: string, message: string) => {
      return `logger.info('${message.replace(/'/g, "\\'")}', { type: 'debug_migration' });`;
    },
    description: 'console.log template literals'
  },
  {
    pattern: /console\.log\(([^,]+),?\s*([^;]+)?\);?/g,
    replacement: (match: string, message: string, context?: string) => {
      if (context && !context.includes('console')) {
        return `logger.info(${message}, ${context});`;
      }
      return `logger.info(${message});`;
    },
    description: 'console.log with context'
  },
  {
    pattern: /console\.error\(`([^`]+)`\);?/g,
    replacement: (match: string, message: string) => {
      return `logger.error('${message.replace(/'/g, "\\'")}');`;
    },
    description: 'console.error template literals'
  },
  {
    pattern: /console\.error\(([^,]+),?\s*([^;]+)?\);?/g,
    replacement: (match: string, message: string, error?: string) => {
      if (error && !error.includes('console')) {
        return `logger.error(${message}, ${error});`;
      }
      return `logger.error(${message});`;
    },
    description: 'console.error with error'
  },
  {
    pattern: /console\.warn\(`([^`]+)`\);?/g,
    replacement: (match: string, message: string) => {
      return `logger.warn('${message.replace(/'/g, "\\'")}');`;
    },
    description: 'console.warn template literals'
  },
  {
    pattern: /console\.warn\(([^;]+)\);?/g,
    replacement: (match: string, message: string) => {
      return `logger.warn(${message});`;
    },
    description: 'console.warn statements'
  },
  {
    pattern: /console\.debug\(`([^`]+)`\);?/g,
    replacement: (match: string, message: string) => {
      return `logger.debug('${message.replace(/'/g, "\\'")}');`;
    },
    description: 'console.debug template literals'
  },

  // Old logger imports
  {
    pattern: /import\s+logger\s+from\s+['"]\.\.\/services\/logger\.js['"];?/g,
    replacement: "import { logger } from '../logging/unified-logger.js';",
    description: 'Update logger import path'
  },
  {
    pattern: /import\s+{\s*logger\s*}\s+from\s+['"]\.\.\/services\/logger\.js['"];?/g,
    replacement: "import { logger } from '../logging/unified-logger.js';",
    description: 'Update named logger import'
  },
  {
    pattern: /import\s+{\s*logInfo,\s*logError,\s*logWarn,\s*logDebug\s*}\s+from\s+['"]\.\.\/utils\/logging\.js['"];?/g,
    replacement: "import { logger } from '../logging/unified-logger.js';",
    description: 'Replace utils logging imports'
  },

  // Old logger usage with structured context
  {
    pattern: /logger\.info\(`([^`]+)`,\s*({[^}]+})\);?/g,
    replacement: (match: string, message: string, context: string) => {
      return `logger.info('${message.replace(/'/g, "\\'")}', ${context});`;
    },
    description: 'Fix logger.info template literals with context'
  },
  {
    pattern: /logger\.error\(`([^`]+)`,\s*({[^}]+})\);?/g,
    replacement: (match: string, message: string, context: string) => {
      return `logger.error('${message.replace(/'/g, "\\'")}', undefined, ${context});`;
    },
    description: 'Fix logger.error template literals with context'
  },
  {
    pattern: /logger\.error\(`([^`]+)`,\s*([^,]+),\s*({[^}]+})\);?/g,
    replacement: (match: string, message: string, error: string, context: string) => {
      return `logger.error('${message.replace(/'/g, "\\'")}', ${error}, ${context});`;
    },
    description: 'Fix logger.error with error and context'
  }
];

class LoggingMigration {
  private options: MigrationOptions;
  private stats: MigrationStats;

  constructor(options: MigrationOptions) {
    this.options = options;
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      consoleLogReplaced: 0,
      loggerImportFixed: 0,
      structuredLoggingAdded: 0,
      errorsFixed: 0
    };
  }

  async migrate(): Promise<void> {
    logger.info('🚀 Starting ZANTARA logging migration...', { type: 'debug_migration' });
    logger.info('📁 Target path: ${this.options.targetPath}', { type: 'debug_migration' });
    logger.info('🔍 Dry run: ${this.options.dryRun ? \'YES\' : \'NO\'}', { type: 'debug_migration' });

    const files = await this.findFiles();
    logger.info('📄 Found ${files.length} TypeScript files to process', { type: 'debug_migration' });

    for (const file of files) {
      await this.processFile(file);
    }

    this.printSummary();
  }

  private async findFiles(): Promise<string[]> {
    const pattern = path.join(this.options.targetPath, '**/*.ts').replace(/\\/g, '/');
    return glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.ts'] });
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let modifiedContent = content;
      let fileModified = false;

      this.stats.filesProcessed++;

      // Apply migration patterns
      for (const pattern of migrationPatterns) {
        const matches = modifiedContent.match(pattern.pattern);
        if (matches) {
          if (this.options.verbose) {
            logger.info('  📝 ${filePath}: Applying pattern "${pattern.description}" (${matches.length} matches)', { type: 'debug_migration' });
          }

          modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement);
          fileModified = true;

          // Update stats
          if (pattern.description.includes('console')) {
            this.stats.consoleLogReplaced += matches.length;
          } else if (pattern.description.includes('import')) {
            this.stats.loggerImportFixed += matches.length;
          } else if (pattern.description.includes('structured') || pattern.description.includes('context')) {
            this.stats.structuredLoggingAdded += matches.length;
          } else if (pattern.description.includes('error')) {
            this.stats.errorsFixed += matches.length;
          }
        }
      }

      // Add correlation middleware import if Express routes are detected
      if (content.includes('app.use(') && content.includes('cors') && !content.includes('correlationMiddleware')) {
        const correlationImport = "import correlationMiddleware from '../logging/correlation-middleware.js';";
        if (!modifiedContent.includes(correlationImport)) {
          // Add import after other imports
          const importInsertIndex = modifiedContent.lastIndexOf('import');
          const importEndIndex = modifiedContent.indexOf(';', importInsertIndex) + 1;
          modifiedContent = modifiedContent.slice(0, importEndIndex) +
                           '\n' + correlationImport +
                           modifiedContent.slice(importEndIndex);

          // Add middleware usage
          const middlewareInsertIndex = modifiedContent.indexOf('app.use(cors());') + 'app.use(cors());'.length;
          modifiedContent = modifiedContent.slice(0, middlewareInsertIndex) +
                           '\napp.use(correlationMiddleware());' +
                           modifiedContent.slice(middlewareInsertIndex);

          fileModified = true;
          this.stats.structuredLoggingAdded++;

          if (this.options.verbose) {
            logger.info('  🔗 ${filePath}: Added correlation middleware', { type: 'debug_migration' });
          }
        }
      }

      // Enhanced error handling in catch blocks
      const enhancedErrorPattern = /catch\s*\(\s*(\w+)\s*\)\s*{\s*console\.error\(([^;]+)\);\s*}/g;
      const errorMatches = content.match(enhancedErrorPattern);
      if (errorMatches) {
        modifiedContent = modifiedContent.replace(enhancedErrorPattern, (match, errorVar, errorMsg) => {
          this.stats.errorsFixed++;
          return `catch (${errorVar}) {\n  logger.error('Error in operation', ${errorVar}, {\n    operation: 'unknown_operation',\n    type: 'error_handling'\n  });\n}`;
        });
        fileModified = true;

        if (this.options.verbose) {
          logger.info('  🛠️ ${filePath}: Enhanced ${errorMatches.length} error handlers', { type: 'debug_migration' });
        }
      }

      if (fileModified) {
        this.stats.filesModified++;

        if (!this.options.dryRun) {
          // Create backup if requested
          if (this.options.backup) {
            const backupPath = filePath + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, content);
            if (this.options.verbose) {
              logger.info('  💾 ${filePath}: Created backup', { type: 'debug_migration' });
            }
          }

          // Write modified content
          fs.writeFileSync(filePath, modifiedContent);
          logger.info('  ✅ ${filePath}: Migrated successfully', { type: 'debug_migration' });
        } else {
          logger.info('  🔍 ${filePath}: Would be modified (dry run)', { type: 'debug_migration' });
        }
      }

    } catch (error) {
      logger.error('  ❌ ${filePath}: Error processing file - ${error}');
    }
  }

  private printSummary(): void {
    logger.info('\n📊 Migration Summary:');
    logger.info('======================', { type: 'debug_migration' });
    logger.info('📁 Files processed: ${this.stats.filesProcessed}', { type: 'debug_migration' });
    logger.info('📝 Files modified: ${this.stats.filesModified}', { type: 'debug_migration' });
    logger.info('🔄 Console.log statements replaced: ${this.stats.consoleLogReplaced}', { type: 'debug_migration' });
    logger.info('📦 Logger imports fixed: ${this.stats.loggerImportFixed}', { type: 'debug_migration' });
    logger.info('🏗️ Structured logging added: ${this.stats.structuredLoggingAdded}', { type: 'debug_migration' });
    logger.info('🛠️ Error handlers enhanced: ${this.stats.errorsFixed}', { type: 'debug_migration' });

    if (this.options.dryRun) {
      logger.info('\n⚠️  DRY RUN MODE - No files were actually modified');
      console.log('💡 Run without --dry-run to apply changes');
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('💡 Review the changes and run tests to verify functionality');
    }

    // Next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Review modified files for correctness');
    console.log('2. Add request context to log statements');
    console.log('3. Update error handling with appropriate error codes');
    console.log('4. Add performance tracking for critical operations');
    console.log('5. Test the application thoroughly');
    console.log('6. Update monitoring and alerting rules');

    // Manual improvements needed
    console.log('\n🔧 Manual Improvements Needed:');
    console.log('- Add correlation context to log statements in handlers');
    console.log('- Update business event logging with proper context');
    console.log('- Add performance tracking to database operations');
    console.log('- Enhance security event logging');
    console.log('- Update unit tests to mock the new logger');
  }
}

// CLI interface
function parseArguments(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: false,
    targetPath: './src',
    backup: true,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--path':
        options.targetPath = args[++i];
        break;
      case '--no-backup':
        options.backup = false;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        logger.info('
ZANTARA Logging Migration Script

Usage: npx tsx src/logging/migration-script.ts [options]

Options:
  --dry-run        Show what would be changed without modifying files
  --path <path>    Target directory path (default: ./src)
  --no-backup      Don\'t create backup files
  --verbose        Show detailed processing information
  --help           Show this help message

Examples:
  npx tsx src/logging/migration-script.ts --dry-run --verbose
  npx tsx src/logging/migration-script.ts --path ./src/handlers
  npx tsx src/logging/migration-script.ts --no-backup
        ', { type: 'debug_migration' });
        process.exit(0);
    }
  }

  return options;
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArguments();
  const migration = new LoggingMigration(options);
  migration.migrate().catch(console.error);
}

export { LoggingMigration, MigrationOptions, MigrationStats };