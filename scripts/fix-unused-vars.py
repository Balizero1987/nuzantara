#!/usr/bin/env python3
"""
Fix TypeScript unused variables by prefixing with underscore.
Parses tsc output and applies fixes automatically.
"""

import re
import subprocess
import sys
from pathlib import Path

def get_unused_vars():
    """Parse TypeScript build output for unused variables."""
    result = subprocess.run(
        ['npm', 'run', 'build'],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )

    # Pattern: src/path/file.ts(line,col): error TS6133: 'varName' is declared but its value is never read.
    pattern = r"(src/[^(]+)\((\d+),(\d+)\): error TS6133: '([^']+)' is declared but its value is never read"

    errors = []
    for line in result.stderr.split('\n'):
        match = re.search(pattern, line)
        if match:
            file_path, line_num, col, var_name = match.groups()
            errors.append({
                'file': file_path,
                'line': int(line_num),
                'col': int(col),
                'var': var_name
            })

    return errors

def fix_unused_var(file_path: str, line_num: int, var_name: str):
    """Prefix variable with underscore if not already prefixed."""
    if var_name.startswith('_'):
        return False  # Already prefixed

    file_full_path = Path(__file__).parent.parent / file_path

    try:
        with open(file_full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        if line_num > len(lines):
            return False

        line = lines[line_num - 1]

        # Replace only the first occurrence of the variable name
        # Handle various patterns: const varName, let varName, varName: type, etc.
        patterns = [
            (rf'\b({var_name})\b:', fr'_{var_name}:'),  # varName: type
            (rf'\b({var_name})\s*=', fr'_{var_name} ='),  # varName =
            (rf'\b({var_name})\s*,', fr'_{var_name},'),  # varName,
            (rf'\b({var_name})\)', fr'_{var_name})'),  # varName)
        ]

        fixed = False
        for pattern, replacement in patterns:
            if re.search(pattern, line):
                lines[line_num - 1] = re.sub(pattern, replacement, line, count=1)
                fixed = True
                break

        if fixed:
            with open(file_full_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return True

    except Exception as e:
        print(f"Error fixing {file_path}:{line_num} - {e}", file=sys.stderr)

    return False

def main():
    print("🔍 Analyzing TypeScript build output...")
    errors = get_unused_vars()

    print(f"Found {len(errors)} unused variable errors")

    if not errors:
        print("✅ No unused variables found!")
        return 0

    # Group by file
    by_file = {}
    for err in errors:
        if err['file'] not in by_file:
            by_file[err['file']] = []
        by_file[err['file']].append(err)

    fixed_count = 0
    for file_path, file_errors in by_file.items():
        print(f"\n📝 Fixing {file_path} ({len(file_errors)} errors)...")

        # Sort by line number descending to avoid line shifts
        file_errors.sort(key=lambda x: x['line'], reverse=True)

        for err in file_errors:
            if fix_unused_var(err['file'], err['line'], err['var']):
                print(f"  ✅ Fixed '{err['var']}' at line {err['line']}")
                fixed_count += 1
            else:
                print(f"  ⚠️  Skipped '{err['var']}' at line {err['line']}")

    print(f"\n✅ Fixed {fixed_count} / {len(errors)} unused variables")
    return 0

if __name__ == '__main__':
    sys.exit(main())
