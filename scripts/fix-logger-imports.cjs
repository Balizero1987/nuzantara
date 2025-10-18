#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files with logger import issues
const files = execSync('find src -name "*.ts" -exec grep -l "import.*logger.*from.*services/logger" {} \\;', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

console.log(`Found ${files.length} files with logger import issues`);

// Fix each file
files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Fix import { logger } from '../services/logger.js'
    if (content.includes("import { logger } from '../services/logger.js'")) {
      content = content.replace(
        /import \{ logger \} from '\.\.\/services\/logger\.js';/g,
        "import logger from '../services/logger.js';"
      );
      modified = true;
    }

    // Fix import { logger } from '../services/logger.js' (different path)
    if (content.includes("import { logger } from '../services/logger.js'")) {
      content = content.replace(
        /import \{ logger \} from '\.\.\/services\/logger\.js';/g,
        "import logger from '../services/logger.js';"
      );
      modified = true;
    }

    // Fix import { logger } from '../services/logger.js' (different path)
    if (content.includes("import { logger } from '../services/logger.js'")) {
      content = content.replace(
        /import \{ logger \} from '\.\.\/services\/logger\.js';/g,
        "import logger from '../services/logger.js';"
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('🎉 Logger import fix completed!');
