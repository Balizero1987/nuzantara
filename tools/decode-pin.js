/**
 * 🔐 PIN Decoder/Generator Tool
 * Use to test PIN hashes or generate new ones
 */

import bcrypt from 'bcryptjs';

// Amanda's hash from team-login-secure.ts
const AMANDA_HASH = '$2b$10$rds5DKe7WyE1lsiiUu4R7.gB/nh0ke3TG55wnGSLMdDXYkjPouNj6';

// Common PIN patterns to test
const COMMON_PINS = [
  '123456', '654321', '111111', '000000',
  '112233', '445566', '778899',
  '121212', '123123', '234234',
  '010101', '202020', '151515',
  '100000', '200000', '300000'
];

console.log('🔐 ZANTARA PIN Decoder Tool\n');
console.log(`Testing Amanda's PIN hash: ${AMANDA_HASH}\n`);

// Test common PINs
async function testCommonPins() {
  console.log('Testing common PIN patterns...\n');

  for (const pin of COMMON_PINS) {
    const isMatch = await bcrypt.compare(pin, AMANDA_HASH);
    if (isMatch) {
      console.log(`✅ FOUND! Amanda's PIN is: ${pin}`);
      return pin;
    }
  }

  console.log('❌ No common PIN matched.\n');
  return null;
}

// Generate new PIN
async function generateNewPin(pin) {
  const hash = await bcrypt.hash(pin, 10);
  console.log(`\n✅ New PIN generated:`);
  console.log(`   PIN: ${pin}`);
  console.log(`   Hash: ${hash}`);
  return hash;
}

// Main
(async () => {
  const found = await testCommonPins();

  if (!found) {
    console.log('\n💡 If you need to set a new PIN for Amanda:');
    console.log('   Run: node tools/decode-pin.js <new-pin>');
    console.log('   Example: node tools/decode-pin.js 123456\n');

    const newPin = process.argv[2];
    if (newPin) {
      if (!/^\d{6}$/.test(newPin)) {
        console.error('❌ PIN must be exactly 6 digits!');
        process.exit(1);
      }
      await generateNewPin(newPin);
    }
  }
})();
