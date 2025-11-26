#!/usr/bin/env node

/**
 * Database Initialization Script
 *
 * This script initializes the ZANTARA database with all necessary tables
 * and creates the default team members with secure PINs
 */

import { getDatabasePool } from '../services/connection-pool.js';
import bcrypt from 'bcrypt';
import logger from '../services/logger.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  logger.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function initializeDatabase() {
  logger.info('🚀 Initializing ZANTARA database...');

  try {
    const db = getDatabasePool();

    // Create tables
    logger.info('📋 Creating database tables...');

    // Create team_members table
    await db.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        pin_hash VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        language VARCHAR(10) DEFAULT 'en',
        personalized_response BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        failed_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    logger.info('✅ team_members table created');

    // Create auth_audit_log table
    await db.query(`
      CREATE TABLE IF NOT EXISTS auth_audit_log (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        success BOOLEAN,
        failure_reason VARCHAR(255)
      )
    `);
    logger.info('✅ auth_audit_log table created');

    // Create user_sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        ip_address INET,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true
      )
    `);
    logger.info('✅ user_sessions table created');

    // Create indexes
    logger.info('📋 Creating indexes...');

    await db.query('CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(LOWER(email))');
    await db.query('CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_auth_audit_log_email ON auth_audit_log(email)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_auth_audit_log_timestamp ON auth_audit_log(timestamp)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)');

    logger.info('✅ Indexes created');

    // Create update trigger function
    await db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await db.query(`
      DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
      CREATE TRIGGER update_team_members_updated_at
        BEFORE UPDATE ON team_members
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    logger.info('✅ Triggers created');

    // Insert default team members
    logger.info('👥 Creating default team members...');

    const teamMembers = [
      {
        name: 'Antonello Siano',
        email: 'antonello@nuzantara.com',
        pin: '1234',
        role: 'CEO',
        department: 'Executive',
        language: 'en'
      },
      {
        name: 'Tech Lead',
        email: 'tech@nuzantara.com',
        pin: '5678',
        role: 'Tech Lead',
        department: 'Technology',
        language: 'en'
      },
      {
        name: 'Executive Consultant',
        email: 'consultant@nuzantara.com',
        pin: '4321',
        role: 'Executive Consultant',
        department: 'Consulting',
        language: 'en'
      },
      {
        name: 'Junior Consultant',
        email: 'junior@nuzantara.com',
        pin: '8765',
        role: 'Junior Consultant',
        department: 'Consulting',
        language: 'en'
      },
      {
        name: 'Marketing Specialist',
        email: 'marketing@nuzantara.com',
        pin: '2468',
        role: 'Marketing Specialist',
        department: 'Marketing',
        language: 'en'
      },
      {
        name: 'Tax Manager',
        email: 'tax@nuzantara.com',
        pin: '1357',
        role: 'Tax Manager',
        department: 'Finance',
        language: 'en'
      },
      {
        name: 'Reception',
        email: 'reception@nuzantara.com',
        pin: '9876',
        role: 'Reception',
        department: 'Operations',
        language: 'en'
      }
    ];

    for (const member of teamMembers) {
      const pinHash = await bcrypt.hash(member.pin, 10);

      await db.query(`
        INSERT INTO team_members (name, email, pin_hash, role, department, language, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          pin_hash = EXCLUDED.pin_hash,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          language = EXCLUDED.language,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
      `, [member.name, member.email, pinHash, member.role, member.department, member.language]);

      logger.info(`✅ Created user: ${member.name} (${member.email}) - PIN: ${member.pin}`);
    }

    // Verify database setup
    const result = await db.query('SELECT COUNT(*) as count FROM team_members WHERE is_active = true');
    logger.info(`📊 Total active team members: ${result.rows[0].count}`);

    logger.info('\n🎉 Database initialization completed successfully!');
    logger.info('\n📋 Login Credentials:');
    logger.info('─'.repeat(60));
    for (const member of teamMembers) {
      logger.info(`${member.name.padEnd(20)} | ${member.email.padEnd(25)} | PIN: ${member.pin}`);
    }
    logger.info('─'.repeat(60));
    logger.info('\n🚀 Team login is now ready at: /api/auth/team/login');

  } catch (error) {
    logger.error('❌ Database initialization failed:', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

// Run initialization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch((error) => {
    logger.error('Database initialization error:', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  });
}

export { initializeDatabase };