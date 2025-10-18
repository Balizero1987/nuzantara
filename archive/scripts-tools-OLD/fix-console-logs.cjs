#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript files with console.log
const files = execSync('find src -name "*.ts" -not -path "*/tests/*" -not -path "*/__tests__/*" -exec grep -l "console\\." {} \\;', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(f => f);

console.log(`Found ${files.length} files with console.log`);

// Fix each file
files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Add logger import if not present
    if (content.includes('console.') && !content.includes("import { logger }")) {
      const importMatch = content.match(/import.*from.*['"]/);
      if (importMatch) {
        const insertPos = content.lastIndexOf('\n', importMatch.index + importMatch[0].length) + 1;
        content = content.slice(0, insertPos) + "import { logger } from '../services/logger.js';\n" + content.slice(insertPos);
        modified = true;
      }
    }

    // Replace console.log with logger.info
    if (content.includes('console.log(')) {
      content = content.replace(/console\.log\(([^)]+)\)/g, (match, args) => {
        // Simple replacement - could be more sophisticated
        return `logger.info(${args})`;
      });
      modified = true;
    }

    // Replace console.error with logger.error
    if (content.includes('console.error(')) {
      content = content.replace(/console\.error\(([^)]+)\)/g, (match, args) => {
        return `logger.error(${args})`;
      });
      modified = true;
    }

    // Replace console.warn with logger.warn
    if (content.includes('console.warn(')) {
      content = content.replace(/console\.warn\(([^)]+)\)/g, (match, args) => {
        return `logger.warn(${args})`;
      });
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

console.log('🎉 Console.log fix completed!');
