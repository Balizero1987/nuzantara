#!/usr/bin/env python3
"""
Plugin Documentation Generator

Auto-generates comprehensive documentation for all plugins.

Usage:
    python scripts/plugins/generate_docs.py
"""

import asyncio
import sys
from pathlib import Path
import json
from typing import Dict, List
from collections import defaultdict

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "apps" / "backend-rag"))

from backend.core.plugins import registry, PluginCategory
from backend.core.plugins.plugin import Plugin


async def generate_all_documentation():
    """Generate documentation for all plugins"""
    print("🔧 Plugin Documentation Generator")
    print("=" * 60)

    # Discover and load plugins
    await discover_plugins()

    stats = registry.get_statistics()
    print(f"\n📊 Found {stats['total_plugins']} plugins across {stats['categories']} categories")

    # Create docs directory
    docs_dir = Path("docs/plugins")
    docs_dir.mkdir(parents=True, exist_ok=True)

    # Generate index
    generate_index(docs_dir)

    # Generate category pages
    generate_category_pages(docs_dir)

    # Generate individual plugin pages
    generate_plugin_pages(docs_dir)

    # Generate API reference
    generate_api_reference(docs_dir)

    # Generate migration guide
    generate_migration_guide(docs_dir)

    print(f"\n✅ Documentation generated in {docs_dir}")
    print(f"   - README.md (index)")
    print(f"   - API_REFERENCE.md")
    print(f"   - MIGRATION_GUIDE.md")
    print(f"   - {stats['total_plugins']} plugin pages")


async def discover_plugins():
    """Discover and register all plugins"""
    print("\n🔍 Discovering plugins...")

    # Discover Python plugins
    plugins_dir = Path("apps/backend-rag/backend/plugins")
    if plugins_dir.exists():
        await registry.discover_plugins(plugins_dir, "backend.plugins")

    print(f"   ✓ Registered {registry.get_statistics()['total_plugins']} plugins")


def generate_index(docs_dir: Path):
    """Generate main index/README"""
    print("\n📝 Generating README.md...")

    plugins_by_category = defaultdict(list)
    for metadata in registry.list_plugins():
        plugins_by_category[metadata.category].append(metadata)

    # Sort categories
    categories = sorted(plugins_by_category.keys(), key=lambda c: c.value)

    with open(docs_dir / "README.md", "w") as f:
        f.write("# ZANTARA Plugin Catalog\n\n")
        f.write("Comprehensive documentation for all ZANTARA plugins.\n\n")

        # Statistics
        stats = registry.get_statistics()
        f.write("## Statistics\n\n")
        f.write(f"- **Total Plugins:** {stats['total_plugins']}\n")
        f.write(f"- **Categories:** {stats['categories']}\n")
        f.write(f"- **Total Versions:** {stats['total_versions']}\n")
        f.write("\n")

        # Table of contents
        f.write("## Categories\n\n")
        for category in categories:
            plugins = plugins_by_category[category]
            category_name = category.value.replace("-", " ").title()
            f.write(f"- [{category_name}](#{category.value}) ({len(plugins)} plugins)\n")

        f.write("\n---\n\n")

        # Plugins by category
        for category in categories:
            plugins = plugins_by_category[category]
            category_name = category.value.replace("-", " ").title()

            f.write(f"## {category_name}\n\n")
            f.write(f"**{len(plugins)} plugins**\n\n")

            for metadata in sorted(plugins, key=lambda m: m.name):
                f.write(f"### [{metadata.name}]({metadata.name.replace('.', '_')}.md)\n\n")
                f.write(f"{metadata.description}\n\n")
                f.write(f"- **Version:** {metadata.version}\n")
                f.write(f"- **Tags:** {', '.join(metadata.tags)}\n")
                f.write(f"- **Auth Required:** {'Yes' if metadata.requires_auth else 'No'}\n")
                f.write(f"- **Rate Limit:** {metadata.rate_limit or 'None'}\n")
                f.write("\n")

            f.write("\n")

    print("   ✓ README.md created")


def generate_category_pages(docs_dir: Path):
    """Generate category overview pages"""
    print("\n📝 Generating category pages...")

    plugins_by_category = defaultdict(list)
    for metadata in registry.list_plugins():
        plugins_by_category[metadata.category].append(metadata)

    count = 0
    for category, plugins in plugins_by_category.items():
        category_name = category.value.replace("-", " ").title()
        filename = f"category_{category.value}.md"

        with open(docs_dir / filename, "w") as f:
            f.write(f"# {category_name} Plugins\n\n")
            f.write(f"**{len(plugins)} plugins in this category**\n\n")

            for metadata in sorted(plugins, key=lambda m: m.name):
                f.write(f"## {metadata.name}\n\n")
                f.write(f"{metadata.description}\n\n")
                f.write(f"[Full Documentation →]({metadata.name.replace('.', '_')}.md)\n\n")

        count += 1

    print(f"   ✓ Created {count} category pages")


def generate_plugin_pages(docs_dir: Path):
    """Generate individual plugin documentation pages"""
    print("\n📝 Generating plugin pages...")

    count = 0
    for plugin_name in registry.get_all_plugin_names():
        plugin = registry.get(plugin_name)
        if not plugin:
            continue

        generate_single_plugin_page(plugin, docs_dir)
        count += 1

    print(f"   ✓ Created {count} plugin pages")


def generate_single_plugin_page(plugin: Plugin, docs_dir: Path):
    """Generate documentation for a single plugin"""
    metadata = plugin.metadata
    filename = f"{metadata.name.replace('.', '_')}.md"

    with open(docs_dir / filename, "w") as f:
        # Header
        f.write(f"# {metadata.name}\n\n")
        f.write(f"> {metadata.description}\n\n")

        # Metadata table
        f.write("## Metadata\n\n")
        f.write("| Property | Value |\n")
        f.write("|----------|-------|\n")
        f.write(f"| **Name** | `{metadata.name}` |\n")
        f.write(f"| **Version** | {metadata.version} |\n")
        f.write(f"| **Category** | {metadata.category.value} |\n")
        f.write(f"| **Author** | {metadata.author or 'Bali Zero'} |\n")
        f.write(f"| **Auth Required** | {'✓ Yes' if metadata.requires_auth else '✗ No'} |\n")
        f.write(f"| **Admin Only** | {'✓ Yes' if metadata.requires_admin else '✗ No'} |\n")
        f.write(f"| **Estimated Time** | {metadata.estimated_time}s |\n")
        f.write(f"| **Rate Limit** | {metadata.rate_limit or 'None'} calls/min |\n")
        f.write("\n")

        # Tags
        if metadata.tags:
            f.write(f"**Tags:** {', '.join(f'`{tag}`' for tag in metadata.tags)}\n\n")

        # Models
        f.write(f"**Allowed Models:** {', '.join(metadata.allowed_models)}\n\n")

        # Dependencies
        if metadata.dependencies:
            f.write(f"**Dependencies:** {', '.join(metadata.dependencies)}\n\n")

        # Input schema
        f.write("## Input Schema\n\n")
        f.write("```json\n")
        f.write(json.dumps(plugin.input_schema.schema(), indent=2))
        f.write("\n```\n\n")

        # Output schema
        f.write("## Output Schema\n\n")
        f.write("```json\n")
        f.write(json.dumps(plugin.output_schema.schema(), indent=2))
        f.write("\n```\n\n")

        # Usage examples
        f.write("## Usage\n\n")
        f.write("### Python\n\n")
        f.write("```python\n")
        f.write("from core.plugins import executor\n\n")
        f.write(f"result = await executor.execute(\n")
        f.write(f"    '{metadata.name}',\n")
        f.write(f"    {{\n")
        f.write(f"        # Your input data here\n")
        f.write(f"    }}\n")
        f.write(f")\n")
        f.write("```\n\n")

        f.write("### REST API\n\n")
        f.write("```bash\n")
        f.write(f"curl -X POST https://api.zantara.com/api/plugins/{metadata.name}/execute \\\n")
        f.write(f"  -H 'Content-Type: application/json' \\\n")
        f.write(f"  -d '{{\n")
        f.write(f"    \"input_data\": {{\n")
        f.write(f"      // Your input data\n")
        f.write(f"    }}\n")
        f.write(f"  }}'\n")
        f.write("```\n\n")

        # Legacy handler key
        if metadata.legacy_handler_key:
            f.write("## Backward Compatibility\n\n")
            f.write(f"This plugin replaces the legacy handler: `{metadata.legacy_handler_key}`\n\n")

        # See also
        f.write("## See Also\n\n")
        f.write(f"- [Category: {metadata.category.value}](category_{metadata.category.value}.md)\n")
        f.write(f"- [API Reference](API_REFERENCE.md)\n")
        f.write(f"- [Migration Guide](MIGRATION_GUIDE.md)\n")


def generate_api_reference(docs_dir: Path):
    """Generate API reference"""
    print("\n📝 Generating API_REFERENCE.md...")

    with open(docs_dir / "API_REFERENCE.md", "w") as f:
        f.write("# Plugin API Reference\n\n")
        f.write("Complete API documentation for the ZANTARA plugin system.\n\n")

        f.write("## Base URL\n\n")
        f.write("```\n")
        f.write("https://api.zantara.com/api/plugins\n")
        f.write("```\n\n")

        # Endpoints
        endpoints = [
            {
                "method": "GET",
                "path": "/list",
                "description": "List all plugins",
                "params": ["category", "tags", "allowed_models"],
            },
            {
                "method": "GET",
                "path": "/{plugin_name}",
                "description": "Get plugin details",
                "params": [],
            },
            {
                "method": "POST",
                "path": "/{plugin_name}/execute",
                "description": "Execute a plugin",
                "params": [],
            },
            {
                "method": "GET",
                "path": "/{plugin_name}/metrics",
                "description": "Get plugin metrics",
                "params": [],
            },
            {
                "method": "POST",
                "path": "/search",
                "description": "Search plugins",
                "params": ["query"],
            },
        ]

        f.write("## Endpoints\n\n")
        for endpoint in endpoints:
            f.write(f"### {endpoint['method']} {endpoint['path']}\n\n")
            f.write(f"{endpoint['description']}\n\n")

            if endpoint["params"]:
                f.write("**Parameters:**\n")
                for param in endpoint["params"]:
                    f.write(f"- `{param}`\n")
                f.write("\n")

    print("   ✓ API_REFERENCE.md created")


def generate_migration_guide(docs_dir: Path):
    """Generate migration guide"""
    print("\n📝 Generating MIGRATION_GUIDE.md...")

    with open(docs_dir / "MIGRATION_GUIDE.md", "w") as f:
        f.write("# Plugin Migration Guide\n\n")
        f.write("Guide for migrating from legacy handlers to the unified plugin system.\n\n")

        f.write("## Quick Start\n\n")
        f.write("1. Identify your legacy handler\n")
        f.write("2. Find the equivalent plugin (see mapping below)\n")
        f.write("3. Update your code to use the plugin API\n\n")

        # Legacy handler mapping
        f.write("## Legacy Handler Mapping\n\n")
        f.write("| Legacy Handler | Plugin Name | Status |\n")
        f.write("|----------------|-------------|--------|\n")

        for metadata in registry.list_plugins():
            if metadata.legacy_handler_key:
                f.write(
                    f"| `{metadata.legacy_handler_key}` | `{metadata.name}` | ✅ Migrated |\n"
                )

        f.write("\n")

    print("   ✓ MIGRATION_GUIDE.md created")


if __name__ == "__main__":
    asyncio.run(generate_all_documentation())
