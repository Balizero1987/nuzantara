#!/usr/bin/env python3
"""
Generate PNG diagrams and open them in the default viewer
"""

import subprocess
import sys
from pathlib import Path
import os

def check_mermaid_cli():
    """Check if mermaid-cli is installed"""
    try:
        result = subprocess.run(['mmdc', '--version'], capture_output=True, text=True)
        return True
    except FileNotFoundError:
        return False

def install_mermaid_cli():
    """Install mermaid-cli globally"""
    print("📦 Installing @mermaid-js/mermaid-cli...")
    try:
        subprocess.run(['npm', 'install', '-g', '@mermaid-js/mermaid-cli'], check=True)
        print("✅ Mermaid CLI installed successfully!\n")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install mermaid-cli")
        print("Please run manually: npm install -g @mermaid-js/mermaid-cli")
        return False

def generate_pngs(diagrams_dir):
    """Generate PNG for all .mmd files"""
    mmd_files = list(diagrams_dir.glob('*.mmd'))

    if not mmd_files:
        print("⚠️  No .mmd files found. Run extract_mermaid.py first.")
        return []

    print(f"🎨 Generating PNGs for {len(mmd_files)} diagrams...\n")

    png_files = []
    for mmd_file in mmd_files:
        png_file = mmd_file.with_suffix('.png')

        # Check if PNG exists and is newer than MMD
        if png_file.exists() and png_file.stat().st_mtime > mmd_file.stat().st_mtime:
            print(f"⏭️  Skipping {mmd_file.name} (PNG up to date)")
            png_files.append(png_file)
            continue

        print(f"🔨 Generating {png_file.name}...")

        try:
            subprocess.run([
                'mmdc',
                '-i', str(mmd_file),
                '-o', str(png_file),
                '-b', 'transparent',
                '-t', 'default'
            ], check=True, capture_output=True)

            png_files.append(png_file)
            print(f"   ✅ Generated")

        except subprocess.CalledProcessError as e:
            print(f"   ❌ Error: {e.stderr.decode()}")

    return png_files

def open_diagrams(png_files):
    """Open PNG files in default viewer"""
    if not png_files:
        print("\n⚠️  No PNG files to open")
        return

    print(f"\n📂 Opening {len(png_files)} diagrams in default viewer...")

    # Use 'open' on macOS, 'xdg-open' on Linux
    if sys.platform == 'darwin':
        opener = 'open'
    elif sys.platform.startswith('linux'):
        opener = 'xdg-open'
    else:
        print("⚠️  Unsupported platform for auto-opening")
        return

    # Open diagrams folder
    subprocess.run([opener, str(png_files[0].parent)])

def main():
    diagrams_dir = Path('docs/galaxy-map/diagrams')

    if not diagrams_dir.exists():
        print(f"❌ Directory not found: {diagrams_dir}")
        print("Please run from project root")
        sys.exit(1)

    print("🌌 Galaxy Map Diagram Viewer\n")
    print("=" * 50)

    # Check if mermaid-cli is installed
    if not check_mermaid_cli():
        print("⚠️  Mermaid CLI not found")
        response = input("Install now? [Y/n]: ").strip().lower()

        if response in ['', 'y', 'yes']:
            if not install_mermaid_cli():
                sys.exit(1)
        else:
            print("❌ Cannot generate diagrams without mermaid-cli")
            sys.exit(1)

    # Generate PNGs
    png_files = generate_pngs(diagrams_dir)

    if png_files:
        print(f"\n✨ Successfully generated {len(png_files)} diagrams!")
        print(f"📁 Location: {diagrams_dir.absolute()}")

        # Ask if user wants to open
        response = input("\nOpen diagrams in viewer? [Y/n]: ").strip().lower()

        if response in ['', 'y', 'yes']:
            open_diagrams(png_files)
    else:
        print("\n❌ No diagrams generated")

    print("\n" + "=" * 50)
    print("💡 Tip: Use VS Code + Markdown Preview for live rendering!")
    print("   Install: code --install-extension shd101wyy.markdown-preview-enhanced")

if __name__ == '__main__':
    main()
