#!/usr/bin/env tsx
import { generateVisaOracleDigest } from '../agents/visa-oracle/collector';
import { generateKbliEyeDigest } from '../agents/kbli-eye/collector';

async function main() {
  const target = process.argv[2];
  const now = new Date();

  if (!target || !['visa', 'kbli', 'all'].includes(target)) {
    console.log('Usage: ts-node scripts/generate-digest.ts <visa|kbli|all>');
    process.exit(1);
  }

  const outputs = [];

  if (target === 'visa' || target === 'all') {
    outputs.push(await generateVisaOracleDigest(now));
  }

  if (target === 'kbli' || target === 'all') {
    outputs.push(await generateKbliEyeDigest(now));
  }

  outputs.forEach(output => {
    console.log('---');
    console.log(output.digestMarkdown);
    if (output.digestPath) {
      console.log(`Saved digest to ${output.digestPath}`);
    }
  });
}

main().catch(error => {
  console.error('Failed to generate digest:', error);
  process.exit(1);
});
