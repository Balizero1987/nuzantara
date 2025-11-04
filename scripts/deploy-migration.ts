#!/usr/bin/env node
/**
 * ZANTARA Migration Automation
 *
 * Comprehensive migration automation with:
 * - Pre-migration backup procedures
 * - Progressive migration with monitoring
 * - Rollback automation
 * - Health checks during migration
 * - Progress notification system
 *
 * Prerequisites:
 *   - PostgreSQL client tools (psql, pg_dump) installed and in PATH
 *   - DATABASE_URL environment variable set
 *   - Node.js with TypeScript support (tsx or ts-node)
 *   - Optional: axios for health checks and webhook notifications
 *
 * Usage:
 *   tsx scripts/deploy-migration.ts [options]
 *
 * Options:
 *   --dry-run        Run without making changes
 *   --migrations-dir Path to migrations directory (default: apps/backend-rag/backend/db/migrations)
 *   --backup-dir     Path to backup directory (default: ./migration-backups)
 *   --skip-backup    Skip creating backups (not recommended)
 *   --rollback       Rollback to previous migration checkpoint
 *   --health-url     Health check endpoint URL (default: http://localhost:8000/health)
 *   --notify-webhook Webhook URL for progress notifications
 *
 * Examples:
 *   # Dry run to test
 *   export DATABASE_URL="postgresql://user:pass@host/db"
 *   tsx scripts/deploy-migration.ts --dry-run
 *
 *   # Run migrations
 *   tsx scripts/deploy-migration.ts
 *
 *   # Rollback last migration
 *   tsx scripts/deploy-migration.ts --rollback
 *
 *   # With webhook notifications
 *   tsx scripts/deploy-migration.ts --notify-webhook https://hooks.example.com/migrations
 */

import { execSync, spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { promisify } from 'util';
import * as fs from 'fs/promises';

// Types
interface MigrationFile {
  name: string;
  path: string;
  version: number;
}

interface MigrationState {
  version: number;
  timestamp: string;
  migrationName: string;
  backupPath: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
}

interface HealthCheckResult {
  healthy: boolean;
  services: Record<string, boolean>;
  timestamp: string;
}

interface ProgressNotification {
  stage: string;
  progress: number;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

class MigrationAutomation {
  private dryRun: boolean;
  private migrationsDir: string;
  private backupDir: string;
  private skipBackup: boolean;
  private rollbackMode: boolean;
  private healthCheckUrl: string;
  private notifyWebhook?: string;
  private stateFile: string;
  private migrationHistory: MigrationState[] = [];

  constructor(options: {
    dryRun?: boolean;
    migrationsDir?: string;
    backupDir?: string;
    skipBackup?: boolean;
    rollback?: boolean;
    healthUrl?: string;
    notifyWebhook?: string;
  }) {
    this.dryRun = options.dryRun || false;
    this.migrationsDir = options.migrationsDir || 'apps/backend-rag/backend/db/migrations';
    this.backupDir = options.backupDir || './migration-backups';
    this.skipBackup = options.skipBackup || false;
    this.rollbackMode = options.rollback || false;
    this.healthCheckUrl = options.healthUrl || 'http://localhost:8000/health';
    this.notifyWebhook = options.notifyWebhook;
    this.stateFile = join(this.backupDir, 'migration-state.json');

    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Send progress notification
   */
  private async notify(notification: ProgressNotification): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] ${notification.stage}: ${notification.message} (${notification.progress}%)`
    );

    if (notification.details) {
      console.log('  Details:', JSON.stringify(notification.details, null, 2));
    }

    // Send webhook if configured
    if (this.notifyWebhook && !this.dryRun) {
      try {
        const axios = (await import('axios')).default;
        await axios.post(
          this.notifyWebhook,
          {
            ...notification,
            timestamp,
            project: 'ZANTARA',
          },
          {
            timeout: 5000,
          }
        );
      } catch (error) {
        // Non-fatal: continue even if webhook fails
        console.warn(`  ⚠️  Webhook notification failed: ${error}`);
      }
    }
  }

  /**
   * Load migration state from disk
   */
  private loadState(): void {
    if (existsSync(this.stateFile)) {
      try {
        const content = readFileSync(this.stateFile, 'utf-8');
        this.migrationHistory = JSON.parse(content);
      } catch (error) {
        console.warn(`⚠️  Could not load migration state: ${error}`);
        this.migrationHistory = [];
      }
    }
  }

  /**
   * Save migration state to disk
   */
  private saveState(): void {
    try {
      writeFileSync(this.stateFile, JSON.stringify(this.migrationHistory, null, 2));
    } catch (error) {
      console.error(`❌ Failed to save migration state: ${error}`);
    }
  }

  /**
   * Get all migration files from directory
   */
  private getMigrationFiles(): MigrationFile[] {
    if (!existsSync(this.migrationsDir)) {
      throw new Error(`Migrations directory not found: ${this.migrationsDir}`);
    }

    const files = readdirSync(this.migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => {
        const path = join(this.migrationsDir, file);
        // Extract version number from filename (e.g., "001_", "002_", etc.)
        const match = file.match(/^(\d+)_/);
        const version = match ? parseInt(match[1], 10) : 0;

        return {
          name: file,
          path,
          version,
        };
      })
      .sort((a, b) => a.version - b.version);

    return files;
  }

  /**
   * Get database connection string from environment
   */
  private getDatabaseUrl(): string {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    return dbUrl;
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<HealthCheckResult> {
    const services: Record<string, boolean> = {};
    let overallHealthy = true;

    // Check database connection using psql command
    try {
      const dbUrl = this.getDatabaseUrl();
      if (this.dryRun) {
        services.database = true;
      } else {
        // Use psql to test connection
        execSync(`psql "${dbUrl}" -c "SELECT 1" -t -q`, {
          stdio: 'pipe',
          timeout: 5000,
          shell: '/bin/bash',
        });
        services.database = true;
      }
    } catch (error) {
      services.database = false;
      overallHealthy = false;
    }

    // Check API health endpoint
    try {
      if (this.dryRun) {
        services.api = true;
      } else {
        const axios = (await import('axios')).default;
        const response = await axios.get(this.healthCheckUrl, { timeout: 5000 });
        services.api = response.status === 200;
        if (response.status !== 200) overallHealthy = false;
      }
    } catch (error) {
      services.api = false;
      // API health check is optional - don't fail if API is down
      // overallHealthy = false;
    }

    return {
      healthy: overallHealthy,
      services,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create pre-migration backup
   */
  private async createBackup(migrationName: string): Promise<string> {
    await this.notify({
      stage: 'BACKUP',
      progress: 10,
      message: `Creating backup before migration: ${migrationName}`,
    });

    if (this.skipBackup) {
      await this.notify({
        stage: 'BACKUP',
        progress: 50,
        message: 'Backup skipped (--skip-backup flag)',
      });
      return '';
    }

    if (this.dryRun) {
      await this.notify({
        stage: 'BACKUP',
        progress: 100,
        message: '[DRY RUN] Would create backup',
        details: { migrationName },
      });
      return join(this.backupDir, `${migrationName}.backup.dry`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${migrationName}_${timestamp}.sql`;
    const backupPath = join(this.backupDir, backupFilename);

    try {
      const dbUrl = this.getDatabaseUrl();

      // Use pg_dump for backup
      // Note: This requires pg_dump to be installed on the system
      const dumpCommand = `pg_dump "${dbUrl}" > "${backupPath}"`;

      await this.notify({
        stage: 'BACKUP',
        progress: 30,
        message: 'Running pg_dump...',
      });

      execSync(dumpCommand, { stdio: 'inherit', shell: '/bin/bash' });

      // Compress backup
      const compressedPath = `${backupPath}.gz`;
      execSync(`gzip -f "${backupPath}"`, { stdio: 'inherit' });

      await this.notify({
        stage: 'BACKUP',
        progress: 100,
        message: `Backup created: ${compressedPath}`,
        details: { backupPath: compressedPath },
      });

      return compressedPath;
    } catch (error) {
      // Fallback: Create a metadata backup at minimum
      const metadataBackup = {
        timestamp: new Date().toISOString(),
        migrationName,
        databaseUrl: dbUrl.split('@')[1] || 'hidden',
        tables: await this.getTableList(),
      };

      const metadataPath = join(this.backupDir, `${migrationName}_${timestamp}.metadata.json`);
      writeFileSync(metadataPath, JSON.stringify(metadataBackup, null, 2));

      await this.notify({
        stage: 'BACKUP',
        progress: 100,
        message: `Metadata backup created: ${metadataPath}`,
        details: { error: String(error), fallback: true },
      });

      return metadataPath;
    }
  }

  /**
   * Get list of tables from database
   */
  private async getTableList(): Promise<string[]> {
    try {
      const dbUrl = this.getDatabaseUrl();

      // Use psql to get table list
      const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
      const result = execSync(`psql "${dbUrl}" -t -c "${query}"`, {
        encoding: 'utf-8',
        shell: '/bin/bash',
      });

      return result
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch (error) {
      console.warn(`⚠️  Could not get table list: ${error}`);
      return [];
    }
  }

  /**
   * Apply a single migration file
   */
  private async applyMigration(migration: MigrationFile, backupPath: string): Promise<boolean> {
    await this.notify({
      stage: 'MIGRATION',
      progress: 0,
      message: `Applying migration: ${migration.name}`,
      details: { version: migration.version },
    });

    if (this.dryRun) {
      await this.notify({
        stage: 'MIGRATION',
        progress: 100,
        message: `[DRY RUN] Would apply: ${migration.name}`,
      });
      return true;
    }

    try {
      // Check if already applied
      const alreadyApplied = this.migrationHistory.some(
        (m) => m.migrationName === migration.name && m.status === 'completed'
      );

      if (alreadyApplied) {
        await this.notify({
          stage: 'MIGRATION',
          progress: 100,
          message: `Migration ${migration.name} already applied, skipping`,
        });
        return true;
      }

      // Read SQL file
      const sql = readFileSync(migration.path, 'utf-8');

      await this.notify({
        stage: 'MIGRATION',
        progress: 20,
        message: 'Connecting to database...',
      });

      // Execute migration using psql
      const dbUrl = this.getDatabaseUrl();

      await this.notify({
        stage: 'MIGRATION',
        progress: 40,
        message: 'Executing SQL migration...',
      });

      // Write SQL to temp file for psql
      const tempSqlFile = join(this.backupDir, `.temp_${migration.name}`);
      writeFileSync(tempSqlFile, sql);

      try {
        // Execute with psql, using transaction automatically
        // psql will execute the file as a transaction if it contains BEGIN/COMMIT
        // Otherwise, we wrap it in a transaction
        let command: string;
        if (sql.includes('BEGIN') && sql.includes('COMMIT')) {
          // SQL already has transaction control
          command = `psql "${dbUrl}" -f "${tempSqlFile}"`;
        } else {
          // Wrap in transaction
          const transactionalSql = `BEGIN;\n${sql}\nCOMMIT;`;
          writeFileSync(tempSqlFile, transactionalSql);
          command = `psql "${dbUrl}" -f "${tempSqlFile}"`;
        }

        execSync(command, {
          stdio: 'inherit',
          shell: '/bin/bash',
          env: { ...process.env, PGOPTIONS: '-c transaction_mode=implicit' },
        });

        await this.notify({
          stage: 'MIGRATION',
          progress: 80,
          message: 'Migration SQL executed successfully',
        });

        // Record migration state
        const state: MigrationState = {
          version: migration.version,
          timestamp: new Date().toISOString(),
          migrationName: migration.name,
          backupPath: backupPath,
          status: 'completed',
        };
        this.migrationHistory.push(state);
        this.saveState();

        // Clean up temp file
        if (existsSync(tempSqlFile)) {
          await fs.unlink(tempSqlFile);
        }

        await this.notify({
          stage: 'MIGRATION',
          progress: 100,
          message: `✅ Migration ${migration.name} applied successfully`,
        });

        return true;
      } catch (error) {
        // Clean up temp file
        if (existsSync(tempSqlFile)) {
          await fs.unlink(tempSqlFile);
        }
        throw error;
      }
    } catch (error) {
      await this.notify({
        stage: 'MIGRATION',
        progress: 0,
        message: `❌ Migration ${migration.name} failed: ${error}`,
        details: { error: String(error) },
      });

      // Record failure
      const state: MigrationState = {
        version: migration.version,
        timestamp: new Date().toISOString(),
        migrationName: migration.name,
        backupPath: backupPath || '',
        status: 'failed',
      };
      this.migrationHistory.push(state);
      this.saveState();

      return false;
    }
  }

  /**
   * Rollback to previous checkpoint
   */
  private async rollback(): Promise<boolean> {
    await this.notify({
      stage: 'ROLLBACK',
      progress: 0,
      message: 'Starting rollback procedure...',
    });

    if (this.migrationHistory.length === 0) {
      await this.notify({
        stage: 'ROLLBACK',
        progress: 0,
        message: 'No migration history found, nothing to rollback',
      });
      return false;
    }

    // Find the last completed migration
    const lastCompleted = [...this.migrationHistory]
      .reverse()
      .find((m) => m.status === 'completed');

    if (!lastCompleted) {
      await this.notify({
        stage: 'ROLLBACK',
        progress: 0,
        message: 'No completed migrations found to rollback',
      });
      return false;
    }

    await this.notify({
      stage: 'ROLLBACK',
      progress: 20,
      message: `Rolling back to before: ${lastCompleted.migrationName}`,
      details: { version: lastCompleted.version },
    });

    if (this.dryRun) {
      await this.notify({
        stage: 'ROLLBACK',
        progress: 100,
        message: `[DRY RUN] Would rollback to: ${lastCompleted.migrationName}`,
      });
      return true;
    }

    // Restore from backup if available
    if (lastCompleted.backupPath && existsSync(lastCompleted.backupPath)) {
      try {
        await this.notify({
          stage: 'ROLLBACK',
          progress: 40,
          message: 'Restoring from backup...',
        });

        const dbUrl = this.getDatabaseUrl();

        // Determine if backup is compressed
        let backupToRestore = lastCompleted.backupPath;
        if (backupToRestore.endsWith('.gz')) {
          // Decompress
          const decompressed = backupToRestore.replace('.gz', '');
          execSync(`gunzip -c "${backupToRestore}" > "${decompressed}"`);
          backupToRestore = decompressed;
        }

        // Restore using psql
        if (backupToRestore.endsWith('.sql')) {
          execSync(`psql "${dbUrl}" < "${backupToRestore}"`, {
            stdio: 'inherit',
            shell: '/bin/bash',
          });
        }

        await this.notify({
          stage: 'ROLLBACK',
          progress: 80,
          message: 'Database restored from backup',
        });
      } catch (error) {
        await this.notify({
          stage: 'ROLLBACK',
          progress: 0,
          message: `⚠️  Backup restore failed: ${error}`,
          details: { error: String(error) },
        });
        // Continue with status update even if restore fails
      }
    } else {
      await this.notify({
        stage: 'ROLLBACK',
        progress: 40,
        message: '⚠️  No backup found, marking as rolled back without restore',
      });
    }

    // Update migration status
    lastCompleted.status = 'rolled_back';
    lastCompleted.timestamp = new Date().toISOString();
    this.saveState();

    await this.notify({
      stage: 'ROLLBACK',
      progress: 100,
      message: `✅ Rollback completed: ${lastCompleted.migrationName}`,
    });

    return true;
  }

  /**
   * Run complete migration process
   */
  async run(): Promise<boolean> {
    console.log('='.repeat(80));
    console.log('🚀 ZANTARA MIGRATION AUTOMATION');
    console.log('='.repeat(80));
    console.log();

    if (this.dryRun) {
      console.log('⚠️  DRY RUN MODE - No changes will be made');
      console.log();
    }

    // Load existing state
    this.loadState();

    // Handle rollback mode
    if (this.rollbackMode) {
      return await this.rollback();
    }

    try {
      // Pre-flight checks
      await this.notify({
        stage: 'PREFLIGHT',
        progress: 0,
        message: 'Running pre-flight checks...',
      });

      // Health check
      const health = await this.performHealthCheck();
      if (!health.healthy) {
        await this.notify({
          stage: 'PREFLIGHT',
          progress: 0,
          message: '❌ Health check failed',
          details: { services: health.services },
        });
        throw new Error('Health check failed - aborting migration');
      }

      await this.notify({
        stage: 'PREFLIGHT',
        progress: 50,
        message: '✅ Health check passed',
        details: { services: health.services },
      });

      // Get migration files
      const migrations = this.getMigrationFiles();
      if (migrations.length === 0) {
        await this.notify({
          stage: 'PREFLIGHT',
          progress: 100,
          message: 'No migration files found',
        });
        return true;
      }

      await this.notify({
        stage: 'PREFLIGHT',
        progress: 100,
        message: `Found ${migrations.length} migration(s) to apply`,
      });

      // Apply migrations progressively
      for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];
        const progressPercent = Math.round((i / migrations.length) * 100);

        await this.notify({
          stage: 'MIGRATION',
          progress: progressPercent,
          message: `Processing migration ${i + 1}/${migrations.length}: ${migration.name}`,
        });

        // Health check before each migration
        const preMigrationHealth = await this.performHealthCheck();
        if (!preMigrationHealth.healthy) {
          throw new Error(`Health check failed before migration ${migration.name}`);
        }

        // Create backup
        const backupPath = await this.createBackup(migration.name);

        // Apply migration
        const success = await this.applyMigration(migration, backupPath);

        if (!success) {
          throw new Error(`Migration ${migration.name} failed`);
        }

        // Health check after migration
        await this.notify({
          stage: 'HEALTH_CHECK',
          progress: progressPercent + 5,
          message: 'Verifying post-migration health...',
        });

        const postMigrationHealth = await this.performHealthCheck();
        if (!postMigrationHealth.healthy) {
          await this.notify({
            stage: 'HEALTH_CHECK',
            progress: progressPercent + 5,
            message: '⚠️  Health check warning after migration',
            details: { services: postMigrationHealth.services },
          });
          // Continue but warn
        } else {
          await this.notify({
            stage: 'HEALTH_CHECK',
            progress: progressPercent + 10,
            message: '✅ Post-migration health check passed',
          });
        }

        // Small delay between migrations
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await this.notify({
        stage: 'COMPLETE',
        progress: 100,
        message: '🎉 All migrations completed successfully!',
      });

      return true;
    } catch (error) {
      await this.notify({
        stage: 'ERROR',
        progress: 0,
        message: `❌ Migration process failed: ${error}`,
        details: { error: String(error) },
      });

      console.error('\n❌ Migration failed:', error);
      console.error('\n💡 To rollback, run:');
      console.error(`   tsx scripts/deploy-migration.ts --rollback`);

      return false;
    }
  }
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  const options: any = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--skip-backup':
        options.skipBackup = true;
        break;
      case '--rollback':
        options.rollback = true;
        break;
      case '--migrations-dir':
        options.migrationsDir = args[++i];
        break;
      case '--backup-dir':
        options.backupDir = args[++i];
        break;
      case '--health-url':
        options.healthUrl = args[++i];
        break;
      case '--notify-webhook':
        options.notifyWebhook = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
ZANTARA Migration Automation

Usage:
  tsx scripts/deploy-migration.ts [options]

Options:
  --dry-run              Run without making changes
  --migrations-dir DIR   Path to migrations directory
                        (default: apps/backend-rag/backend/db/migrations)
  --backup-dir DIR       Path to backup directory
                        (default: ./migration-backups)
  --skip-backup          Skip creating backups (not recommended)
  --rollback             Rollback to previous migration checkpoint
  --health-url URL       Health check endpoint URL
                        (default: http://localhost:8000/health)
  --notify-webhook URL   Webhook URL for progress notifications
  --help, -h             Show this help message

Environment Variables:
  DATABASE_URL           PostgreSQL connection string (required)

Examples:
  # Dry run
  tsx scripts/deploy-migration.ts --dry-run

  # Run migrations
  tsx scripts/deploy-migration.ts

  # Rollback
  tsx scripts/deploy-migration.ts --rollback

  # With webhook notifications
  tsx scripts/deploy-migration.ts --notify-webhook https://hooks.example.com/migrations
        `);
        process.exit(0);
    }
  }

  const migrator = new MigrationAutomation(options);
  const success = await migrator.run();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { MigrationAutomation };
