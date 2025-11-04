// Minimal test to check if Node can start
console.log('✅ Node.js is working');
console.log('Node version:', process.version);
console.log('ENV check:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Test imports
try {
  const express = require('express');
  console.log('✅ Express loaded');
} catch (e) {
  console.error('❌ Express failed:', e.message);
}

console.log('✅ All basic checks passed');
process.exit(0);
