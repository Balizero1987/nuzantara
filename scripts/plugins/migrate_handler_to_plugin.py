#!/usr/bin/env python3
"""
Handler to Plugin Migration Script

Helps migrate existing handlers to the unified plugin system.

Usage:
    python scripts/plugins/migrate_handler_to_plugin.py --handler-name pricing
    python scripts/plugins/migrate_handler_to_plugin.py --batch --category bali-zero
"""

import argparse
import ast
from pathlib import Path
from typing import List, Dict, Any


def analyze_handler_file(file_path: Path) -> Dict[str, Any]:
    """Analyze a handler file to extract metadata"""
    print(f"\n🔍 Analyzing {file_path.name}...")

    with open(file_path) as f:
        content = f.read()

    # Parse AST
    try:
        tree = ast.parse(content)
    except Exception as e:
        print(f"   ❌ Failed to parse: {e}")
        return {}

    # Find functions
    functions = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            func_info = {
                "name": node.name,
                "is_async": isinstance(node, ast.AsyncFunctionDef),
                "args": [arg.arg for arg in node.args.args],
                "lineno": node.lineno,
            }

            # Get docstring
            docstring = ast.get_docstring(node)
            if docstring:
                func_info["docstring"] = docstring

            functions.append(func_info)

    return {"functions": functions, "file": file_path}


def generate_plugin_template(
    handler_name: str,
    category: str,
    description: str,
    function_info: Dict[str, Any],
) -> str:
    """Generate plugin code from handler info"""

    class_name = "".join(word.capitalize() for word in handler_name.split("_")) + "Plugin"
    input_class_name = "".join(word.capitalize() for word in handler_name.split("_")) + "Input"
    output_class_name = "".join(word.capitalize() for word in handler_name.split("_")) + "Output"

    # Generate input fields from function args
    input_fields = []
    for arg in function_info.get("args", []):
        if arg not in ["self", "params", "input_data"]:
            input_fields.append(
                f'    {arg}: str = Field(..., description="TODO: Add description")'
            )

    input_fields_str = "\n".join(input_fields) if input_fields else "    pass"

    template = f'''"""
{description}

Migrated from: TODO: Add original file path
"""

from typing import Optional, List, Dict, Any
from pydantic import Field
from core.plugins import Plugin, PluginMetadata, PluginInput, PluginOutput, PluginCategory
import logging

logger = logging.getLogger(__name__)


class {input_class_name}(PluginInput):
    """Input schema for {handler_name}"""
{input_fields_str}


class {output_class_name}(PluginOutput):
    """Output schema for {handler_name}"""
    # TODO: Add specific output fields based on handler response
    result: Optional[Any] = Field(None, description="Result data")


class {class_name}(Plugin):
    """
    {description}

    TODO: Add detailed description of what this plugin does.
    """

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        # TODO: Initialize any required services or dependencies

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            name="{category}.{handler_name}",
            version="1.0.0",
            description="{description}",
            category=PluginCategory.{category.upper().replace("-", "_")},
            tags=["{handler_name}", "{category}", "TODO: Add more tags"],
            requires_auth=False,  # TODO: Update based on handler requirements
            estimated_time=1.0,  # TODO: Update based on actual execution time
            rate_limit=30,  # TODO: Update based on usage patterns
            allowed_models=["haiku", "sonnet", "opus"],
            legacy_handler_key="{category}.{handler_name}",  # TODO: Update with actual handler key
        )

    @property
    def input_schema(self):
        return {input_class_name}

    @property
    def output_schema(self):
        return {output_class_name}

    async def execute(self, input_data: {input_class_name}) -> {output_class_name}:
        """Execute {handler_name}"""
        try:
            # TODO: Migrate handler logic here
            # Original function was {"async" if function_info.get("is_async") else "sync"}

            logger.info(f"Executing {handler_name}")

            # Placeholder implementation
            result = {{"message": "TODO: Implement handler logic"}}

            return {output_class_name}(
                success=True,
                data=result,
                result=result
            )

        except Exception as e:
            logger.error(f"❌ {handler_name} error: {{e}}")
            return {output_class_name}(
                success=False,
                error=f"{handler_name} failed: {{str(e)}}"
            )
'''

    return template


def migrate_single_handler(
    handler_name: str,
    category: str,
    description: str = "Plugin description",
    output_dir: Path = None,
):
    """Migrate a single handler to plugin"""
    print(f"\n🔄 Migrating {handler_name} to plugin system...")

    if not output_dir:
        output_dir = Path("apps/backend-rag/backend/plugins") / category

    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate template
    function_info = {"name": handler_name, "args": [], "is_async": True}

    template = generate_plugin_template(handler_name, category, description, function_info)

    # Write to file
    output_file = output_dir / f"{handler_name}_plugin.py"
    with open(output_file, "w") as f:
        f.write(template)

    print(f"   ✅ Created {output_file}")

    # Create __init__.py if it doesn't exist
    init_file = output_dir / "__init__.py"
    if not init_file.exists():
        with open(init_file, "w") as f:
            f.write(f'"""{category.title()} plugins"""\n')
        print(f"   ✅ Created {init_file}")

    # Generate test file
    test_output_dir = Path("apps/backend-rag/backend/tests/plugins")
    test_output_dir.mkdir(parents=True, exist_ok=True)

    test_template = generate_test_template(handler_name, category)
    test_file = test_output_dir / f"test_{handler_name}_plugin.py"

    with open(test_file, "w") as f:
        f.write(test_template)

    print(f"   ✅ Created {test_file}")

    print(f"\n✅ Migration complete!")
    print(f"\nNext steps:")
    print(f"1. Open {output_file}")
    print(f"2. Complete the TODOs in the plugin class")
    print(f"3. Migrate the original handler logic to execute() method")
    print(f"4. Update input/output schemas")
    print(f"5. Update metadata (auth requirements, rate limits, etc.)")
    print(f"6. Write tests in {test_file}")
    print(f"7. Register the plugin in the registry")


def generate_test_template(handler_name: str, category: str) -> str:
    """Generate test template for plugin"""

    class_name = "".join(word.capitalize() for word in handler_name.split("_")) + "Plugin"
    test_class_name = "Test" + class_name

    return f'''"""
Tests for {handler_name} Plugin
"""

import pytest
from plugins.{category}.{handler_name}_plugin import {class_name}
from tests.plugins.plugin_test_base import PluginTestBase


class {test_class_name}(PluginTestBase):
    """Test suite for {handler_name} Plugin"""

    plugin_class = {class_name}
    valid_input = {{
        # TODO: Add valid input data
    }}
    invalid_input = {{
        # TODO: Add invalid input data
    }}

    @pytest.mark.asyncio
    async def test_basic_execution(self, plugin):
        """Test basic plugin execution"""
        # TODO: Implement test
        pass

    @pytest.mark.asyncio
    async def test_error_handling(self, plugin):
        """Test error handling"""
        # TODO: Implement test
        pass
'''


def batch_migrate_category(category: str):
    """Migrate all handlers in a category"""
    print(f"\n🔄 Batch migrating {category} category...")

    # TODO: Discover handlers in category and migrate them
    print("   ℹ️  Batch migration not yet implemented")
    print("   Please use --handler-name to migrate handlers individually")


def main():
    parser = argparse.ArgumentParser(description="Migrate handlers to plugin system")
    parser.add_argument("--handler-name", help="Name of handler to migrate")
    parser.add_argument("--category", help="Plugin category")
    parser.add_argument(
        "--description", default="Plugin description", help="Plugin description"
    )
    parser.add_argument("--batch", action="store_true", help="Batch migrate entire category")
    parser.add_argument(
        "--output-dir", help="Output directory for plugins", type=Path, default=None
    )

    args = parser.parse_args()

    if args.batch:
        if not args.category:
            print("❌ --category required for batch migration")
            return
        batch_migrate_category(args.category)
    else:
        if not args.handler_name or not args.category:
            print("❌ --handler-name and --category required")
            parser.print_help()
            return

        migrate_single_handler(
            args.handler_name, args.category, args.description, args.output_dir
        )


if __name__ == "__main__":
    main()
