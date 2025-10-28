#!/usr/bin/env python3
"""
Automatic Test Fixer - Fills TODO comments with real test data
Analyzes handler files to extract Zod schemas and generate valid test data.
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

BASE_DIR = Path(__file__).parent
HANDLERS_DIR = BASE_DIR / "src" / "handlers"

# Default test data by type
DEFAULT_TEST_DATA = {
    'email': 'test@example.com',
    'string': 'Test String',
    'number': 123,
    'boolean': True,
    'date': '2024-01-01T00:00:00Z',
    'url': 'https://example.com',
    'phone': '+1234567890',
    'uuid': '123e4567-e89b-12d3-a456-426614174000',
}

class ZodSchemaAnalyzer:
    """Analyzes Zod schemas to extract parameter requirements."""

    def __init__(self, handler_path: Path):
        self.handler_path = handler_path
        self.content = handler_path.read_text()
        self.schemas = {}

    def find_zod_schemas(self) -> Dict[str, Dict]:
        """Find all Zod schema definitions in the handler."""
        schemas = {}

        # Pattern: const SchemaName = z.object({...})
        schema_pattern = r'const\s+(\w+Schema)\s*=\s*z\.object\(\{([^}]+)\}\)'

        for match in re.finditer(schema_pattern, self.content, re.DOTALL):
            schema_name = match.group(1)
            schema_body = match.group(2)

            params = self._parse_schema_body(schema_body)
            schemas[schema_name] = params

        return schemas

    def _parse_schema_body(self, schema_body: str) -> Dict[str, str]:
        """Parse Zod schema body to extract parameter types."""
        params = {}

        # Pattern: paramName: z.type()
        param_pattern = r'(\w+)\s*:\s*z\.(\w+)\((.*?)\)'

        for match in re.finditer(param_pattern, schema_body):
            param_name = match.group(1)
            zod_type = match.group(2)
            modifiers = match.group(3)

            # Determine type and if optional
            is_optional = 'optional' in modifiers or schema_body.count(f'{param_name}:') > 1
            params[param_name] = {
                'type': zod_type,
                'optional': is_optional,
                'modifiers': modifiers
            }

        return params

    def find_function_params(self, func_name: str) -> Optional[str]:
        """Find the schema used by a specific function."""
        # Pattern: function funcName(params: any) { const p = SchemaName.parse(params)
        pattern = rf'function\s+{func_name}\s*\([^)]*\)\s*\{{[^}}]*?const\s+\w+\s*=\s*(\w+Schema)\.parse'

        match = re.search(pattern, self.content, re.DOTALL)
        if match:
            return match.group(1)

        return None

    def generate_test_data(self, schema_name: str) -> Dict[str, Any]:
        """Generate valid test data for a schema."""
        if schema_name not in self.schemas:
            return {}

        schema = self.schemas[schema_name]
        test_data = {}

        for param_name, param_info in schema.items():
            if param_info['optional']:
                continue  # Skip optional params for success case

            zod_type = param_info['type']
            modifiers = param_info['modifiers']

            # Generate appropriate test data
            if 'email' in modifiers or 'email' in param_name.lower():
                test_data[param_name] = DEFAULT_TEST_DATA['email']
            elif zod_type == 'string':
                if 'url' in param_name.lower():
                    test_data[param_name] = DEFAULT_TEST_DATA['url']
                elif 'phone' in param_name.lower():
                    test_data[param_name] = DEFAULT_TEST_DATA['phone']
                else:
                    test_data[param_name] = DEFAULT_TEST_DATA['string']
            elif zod_type == 'number':
                test_data[param_name] = DEFAULT_TEST_DATA['number']
            elif zod_type == 'boolean':
                test_data[param_name] = DEFAULT_TEST_DATA['boolean']
            elif zod_type == 'array':
                test_data[param_name] = ['item1', 'item2']
            elif zod_type == 'object':
                test_data[param_name] = {}
            else:
                test_data[param_name] = DEFAULT_TEST_DATA.get(zod_type, 'test_value')

        return test_data

class TestFileFixer:
    """Fixes test files by replacing TODO comments with real test data."""

    def __init__(self, test_path: Path, analyzer: ZodSchemaAnalyzer):
        self.test_path = test_path
        self.analyzer = analyzer
        self.content = test_path.read_text()
        self.modified = False

    def fix_todos(self) -> bool:
        """Fix all TODO comments in the test file."""
        # Find all test functions
        functions = self._find_test_functions()

        for func_name in functions:
            self._fix_function_tests(func_name)

        if self.modified:
            self.test_path.write_text(self.content)
            return True

        return False

    def _find_test_functions(self) -> List[str]:
        """Find all function names being tested."""
        functions = []

        # Pattern: describe('functionName', () => {
        pattern = r"describe\('(\w+)',\s*\(\)\s*=>\s*\{"

        for match in re.finditer(pattern, self.content):
            func_name = match.group(1)
            if func_name and not func_name[0].isupper():  # Skip describe blocks like 'Handler Name'
                functions.append(func_name)

        return functions

    def _fix_function_tests(self, func_name: str):
        """Fix TODO comments for a specific function's tests."""
        # Find schema for this function
        schema_name = self.analyzer.find_function_params(func_name)

        if not schema_name:
            # Try to infer from existing tests or use generic data
            return

        # Generate test data
        test_data = self.analyzer.generate_test_data(schema_name)

        if not test_data:
            return

        # Find the success test case for this function
        pattern = rf"describe\('{func_name}'.*?it\('should handle success case.*?\{{(.*?)\}}\);.*?it\("

        match = re.search(pattern, self.content, re.DOTALL)
        if match:
            test_block = match.group(1)

            # Check if it has TODO comment
            if '// TODO: Add valid test params' in test_block:
                # Generate formatted test data
                formatted_data = self._format_test_data(test_data)

                # Replace TODO with real data
                old_pattern = rf"(const result = await handlers\.{func_name}\(\{{)\s*// TODO: Add valid test params\s*(\}}\);)"
                new_content = f"\\1\n{formatted_data}\n      \\2"

                new_text = re.sub(old_pattern, new_content, self.content)

                if new_text != self.content:
                    self.content = new_text
                    self.modified = True

    def _format_test_data(self, test_data: Dict[str, Any], indent: int = 8) -> str:
        """Format test data as TypeScript object."""
        if not test_data:
            return ''

        indent_str = ' ' * indent
        lines = []

        for key, value in test_data.items():
            if isinstance(value, str):
                lines.append(f"{indent_str}{key}: '{value}',")
            elif isinstance(value, bool):
                lines.append(f"{indent_str}{key}: {str(value).lower()},")
            elif isinstance(value, list):
                list_items = ', '.join([f"'{item}'" if isinstance(item, str) else str(item) for item in value])
                lines.append(f"{indent_str}{key}: [{list_items}],")
            elif isinstance(value, dict):
                lines.append(f"{indent_str}{key}: {{}},")
            else:
                lines.append(f"{indent_str}{key}: {value},")

        return '\n'.join(lines)

def find_test_handler_pairs() -> List[tuple]:
    """Find all test files and their corresponding handler files."""
    pairs = []

    for test_file in HANDLERS_DIR.rglob("*.test.ts"):
        # Find corresponding handler file
        handler_name = test_file.stem.replace('.test', '')
        handler_file = test_file.parent.parent / f"{handler_name}.ts"

        if handler_file.exists():
            pairs.append((test_file, handler_file))

    return pairs

def main():
    """Main execution."""
    print("🔍 Scanning for test files with TODOs...\n")

    pairs = find_test_handler_pairs()

    print(f"📊 Found {len(pairs)} test-handler pairs\n")
    print("🔧 Analyzing Zod schemas and fixing TODOs...\n")

    fixed_count = 0
    error_count = 0

    for test_file, handler_file in pairs:
        relative_test = test_file.relative_to(BASE_DIR)

        try:
            # Analyze handler for Zod schemas
            analyzer = ZodSchemaAnalyzer(handler_file)
            analyzer.schemas = analyzer.find_zod_schemas()

            if not analyzer.schemas:
                print(f"⏭️  {relative_test} - No Zod schemas found")
                continue

            # Fix test file TODOs
            fixer = TestFileFixer(test_file, analyzer)

            if fixer.fix_todos():
                print(f"✅ {relative_test} - Fixed!")
                fixed_count += 1
            else:
                print(f"⏭️  {relative_test} - No TODOs to fix")

        except Exception as e:
            print(f"❌ {relative_test} - Error: {e}")
            error_count += 1

    print(f"\n✨ Done!")
    print(f"   Fixed: {fixed_count} files")
    print(f"   Errors: {error_count} files")
    print(f"   Skipped: {len(pairs) - fixed_count - error_count} files")

    if fixed_count > 0:
        print(f"\n📝 Next steps:")
        print(f"   1. Run: npm test")
        print(f"   2. Check if more tests pass")
        print(f"   3. Manually fix remaining TODOs for complex schemas")

if __name__ == "__main__":
    main()
