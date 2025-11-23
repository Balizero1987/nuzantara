#!/usr/bin/env node

/**
 * Team PIN Setup Script
 *
 * This script generates secure bcrypt hashes for team member PINs
 * and updates the database with proper security
 */

import bcrypt from 'bcrypt';
import { getDatabasePool } from '../src/services/connection-pool.js';
import logger from '../src/services/logger.js';

// Team members with their PINs
interface TeamMember {
  name: string;
  email: string;
  pin: string;
  role: string;
  department: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Antonello Siano',
    email: 'antonello@nuzantara.com',
    pin: '1234',
    role: 'CEO',
    department: 'Executive'
  },
  {
    name: 'Tech Lead',
    email: 'tech@nuzantara.com',
    pin: '5678',
    role: 'Tech Lead',
    department: 'Technology'
  },
  {
    name: 'Executive Consultant',
    email: 'consultant@nuzantara.com',
    pin: '4321',
    role: 'Executive Consultant',
    department: 'Consulting'
  },
  {
    name: 'Junior Consultant',
    email: 'junior@nuzantara.com',
    pin: '8765',
    role: 'Junior Consultant',
    department: 'Consulting'
  },
  {
    name: 'Marketing Specialist',
    email: 'marketing@nuzantara.com',
    pin: '2468',
    role: 'Marketing Specialist',
    department: 'Marketing'
  },
  {
    name: 'Tax Manager',
    email: 'tax@nuzantara.com',
    pin: '1357',
    role: 'Tax Manager',
    department: 'Finance'
  },
  {
    name: 'Reception',
    email: 'reception@nuzantara.com',
    pin: '9876',
    role: 'Reception',
    department: 'Operations'
  }
];

async function setupTeamPins() {
  try {
    const db = getDatabasePool();

    console.log('🔐 Setting up team member PINs with secure bcrypt hashing...');

    for (const member of teamMembers) {
      // Generate bcrypt hash for PIN
      const pinHash = await bcrypt.hash(member.pin, 10);

      console.log(`\n👤 Processing: ${member.name}`);
      console.log(`   Email: ${member.email}`);
      console.log(`   Role: ${member.role}`);
      console.log(`   PIN: ${member.pin}`);

      // Insert or update team member
      const query = `
        INSERT INTO team_members (name, email, pin_hash, role, department, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          pin_hash = EXCLUDED.pin_hash,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING id, name, email, role
      `;

      const result = await db.query(query, [
        member.name,
        member.email,
        pinHash,
        member.role,
        member.department
      ]);

      if (result.rows.length > 0) {
        console.log(`   ✅ Successfully set up: ${result.rows[0].name}`);
      } else {
        console.log(`   ❌ Failed to set up: ${member.name}`);
      }
    }

    console.log('\n🎉 Team PIN setup completed!');
    console.log('\n📋 Login Credentials:');
    console.log('─'.repeat(50));

    for (const member of teamMembers) {
      console.log(`${member.name.padEnd(20)} | ${member.email.padEnd(25)} | PIN: ${member.pin}`);
    }

    console.log('─'.repeat(50));
    console.log('\n🚀 You can now test team login at: /api/auth/team/login');

    // Test database connection and data
    const testResult = await db.query('SELECT COUNT(*) as count FROM team_members WHERE is_active = true');
    console.log(`\n📊 Active team members in database: ${testResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error setting up team PINs:', error);
    process.exit(1);
  }
}

// Run the setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTeamPins().catch(console.error);
}

export { setupTeamPins };