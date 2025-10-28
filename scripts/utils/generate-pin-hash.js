#!/usr/bin/env node
/**
 * 🔑 Generate bcrypt hash for team member PIN
 * Usage: node generate-pin-hash.js [PIN]
 */

import bcrypt from 'bcryptjs';

// Get PIN from command line argument
const pin = process.argv[2];

if (!pin) {
  console.log('❌ Error: PIN required');
  console.log('');
  console.log('Usage:');
  console.log('  node generate-pin-hash.js 123456');
  console.log('');
  process.exit(1);
}

// Validate PIN (must be exactly 6 digits)
if (!/^\d{6}$/.test(pin)) {
  console.log('❌ Error: PIN must be exactly 6 digits');
  console.log('');
  process.exit(1);
}

console.log('🔐 Generating bcrypt hash...');
console.log('');

// Generate hash (salt rounds = 10, same as production)
bcrypt.hash(pin, 10, (err, hash) => {
  if (err) {
    console.error('❌ Error generating hash:', err);
    process.exit(1);
  }

  console.log('✅ PIN Hash Generated!');
  console.log('');
  console.log('📋 Copy this hash to team-login-secure.ts:');
  console.log('');
  console.log(`pinHash: '${hash}'`);
  console.log('');
  console.log('🔒 Keep your PIN safe and secret!');
});
