#!/usr/bin/env python3
"""
Automatic Jest Test Generator for Backend-TS Handlers
Generates comprehensive test files for all handlers without tests.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Set

# Base directory
BASE_DIR = Path(__file__).parent
HANDLERS_DIR = BASE_DIR / "src" / "handlers"

# Mock templates based on imports
MOCK_TEMPLATES = {
    'firebase-admin': '''jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      where: jest.fn(() => ({
        get: jest.fn()
      }))
    }))
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn()
  }))
}));''',

    'googleapis': '''jest.mock('googleapis', () => ({
  google: {
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: jest.fn(),
          list: jest.fn(),
          get: jest.fn()
        }
      }
    })),
    drive: jest.fn(() => ({
      files: {
        create: jest.fn(),
        list: jest.fn(),
        get: jest.fn()
      }
    })),
    sheets: jest.fn(() => ({
      spreadsheets: {
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn()
        }
      }
    }))
  }
}));''',

    'openai': '''jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));''',

    '@anthropic-ai/sdk': '''jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn(() => ({
    messages: {
      create: jest.fn(),
      stream: jest.fn()
    }
  }))
}));''',

    'axios': '''jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  get: jest.fn(),
  post: jest.fn()
}));''',

    'twilio': '''jest.mock('twilio', () => jest.fn(() => ({
  messages: {
    create: jest.fn()
  }
})));'''
}

def find_handler_files() -> List[Path]:
    """Find all handler TypeScript files that don't have tests."""
    handler_files = []

    for ts_file in HANDLERS_DIR.rglob("*.ts"):
        # Skip test files, index files, registry files
        if any(skip in ts_file.name for skip in ['test.ts', 'spec.ts', 'index.ts', 'registry.ts']):
            continue

        # Skip if in __tests__ directory
        if '__tests__' in str(ts_file):
            continue

        # Check if test file already exists
        test_dir = ts_file.parent / "__tests__"
        test_file = test_dir / f"{ts_file.stem}.test.ts"

        if not test_file.exists():
            handler_files.append(ts_file)

    return handler_files

def analyze_imports(file_path: Path) -> Set[str]:
    """Analyze file imports to determine required mocks."""
    content = file_path.read_text()
    imports = set()

    # Find all import statements
    import_pattern = r"import\s+.*?\s+from\s+['\"](.+?)['\"]"
    for match in re.finditer(import_pattern, content):
        module = match.group(1)
        # Only care about external modules, not relative imports
        if not module.startswith('.'):
            imports.add(module)

    return imports

def extract_exported_functions(file_path: Path) -> List[str]:
    """Extract exported function names from handler file."""
    content = file_path.read_text()
    functions = []

    # Match: export async function functionName
    pattern1 = r"export\s+async\s+function\s+(\w+)"
    # Match: export function functionName
    pattern2 = r"export\s+function\s+(\w+)"
    # Match: export const functionName = async
    pattern3 = r"export\s+const\s+(\w+)\s*=\s*async"

    for pattern in [pattern1, pattern2, pattern3]:
        for match in re.finditer(pattern, content):
            func_name = match.group(1)
            if func_name != 'default':
                functions.append(func_name)

    return functions

def generate_test_cases(func_name: str) -> str:
    """Generate test cases for a function."""
    return f'''  describe('{func_name}', () => {{
    it('should handle success case with valid params', async () => {{
      const result = await handlers.{func_name}({{
        // TODO: Add valid test params
      }});

      expect(result).toBeDefined();
      // TODO: Add more specific assertions
    }});

    it('should handle missing required params', async () => {{
      const result = await handlers.{func_name}({{}});

      // TODO: Verify error handling
      expect(result).toBeDefined();
    }});

    it('should handle invalid params', async () => {{
      const result = await handlers.{func_name}({{
        invalid: 'data'
      }});

      // TODO: Verify error handling
      expect(result).toBeDefined();
    }});
  }});
'''

def generate_test_file(handler_path: Path) -> str:
    """Generate complete test file content."""
    relative_path = handler_path.relative_to(HANDLERS_DIR)
    handler_name = handler_path.stem

    # Analyze imports to determine mocks
    imports = analyze_imports(handler_path)
    required_mocks = []
    for module, mock_template in MOCK_TEMPLATES.items():
        if module in imports:
            required_mocks.append(mock_template)

    # Extract functions
    functions = extract_exported_functions(handler_path)

    if not functions:
        functions = ['handler']  # Default if no functions found

    # Generate mocks section
    mocks_section = '\n\n'.join(required_mocks) if required_mocks else '// No external mocks required'

    # Calculate relative import path
    import_path = f"../{handler_name}.js"

    # Generate test cases
    test_cases = '\n'.join([generate_test_cases(func) for func in functions])

    # Build complete test file
    test_content = f'''import {{ describe, it, expect, beforeEach, jest }} from '@jest/globals';

{mocks_section}

describe('{handler_name.replace("-", " ").title()}', () => {{
  let handlers: any;

  beforeEach(async () => {{
    handlers = await import('{import_path}');
  }});

{test_cases}
}});
'''

    return test_content

def create_test_file(handler_path: Path) -> Path:
    """Create test file for handler."""
    # Create __tests__ directory if needed
    test_dir = handler_path.parent / "__tests__"
    test_dir.mkdir(exist_ok=True)

    # Generate test file path
    test_file = test_dir / f"{handler_path.stem}.test.ts"

    # Generate and write test content
    test_content = generate_test_file(handler_path)
    test_file.write_text(test_content)

    return test_file

def main():
    """Main execution."""
    print("🔍 Scanning for handlers without tests...")
    handler_files = find_handler_files()

    print(f"\n📊 Found {len(handler_files)} handlers without tests\n")

    if not handler_files:
        print("✅ All handlers already have tests!")
        return

    print("🚀 Generating test files...\n")

    created_tests = []
    for i, handler_path in enumerate(handler_files, 1):
        relative_path = handler_path.relative_to(BASE_DIR)
        print(f"[{i}/{len(handler_files)}] {relative_path}")

        try:
            test_file = create_test_file(handler_path)
            created_tests.append(test_file)
            print(f"    ✅ Created: {test_file.relative_to(BASE_DIR)}")
        except Exception as e:
            print(f"    ❌ Error: {e}")

    print(f"\n✨ Done! Created {len(created_tests)} test files")
    print(f"\n📝 Next steps:")
    print(f"   1. Review generated tests and add specific test data")
    print(f"   2. Run: npm test")
    print(f"   3. Run: npm test -- --coverage")
    print(f"   4. Fix any failing tests")

if __name__ == "__main__":
    main()
