// migrate.ts
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('🔄 Running database migrations...\n');

    const migrationFile = path.join(__dirname, '../migrations/001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Execute the entire SQL file at once
    // PostgreSQL can handle multiple statements separated by semicolons
    try {
      await pool.query(sql);
      console.log('✅ Migration executed successfully');
    } catch (error: any) {
      // If tables already exist, that's okay - migration might have run before
      if (error.code === '42P07' || error.code === '42710' || error.message.includes('already exists')) {
        console.log('⚠️  Some objects already exist, continuing...');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

