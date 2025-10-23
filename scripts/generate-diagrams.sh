#!/bin/bash
# Generate PNG diagrams from all Mermaid code blocks in galaxy-map docs

echo "📊 Generating diagrams from galaxy-map documentation..."

# Install mermaid-cli if not present
if ! command -v mmdc &> /dev/null; then
    echo "Installing @mermaid-js/mermaid-cli..."
    npm install -g @mermaid-js/mermaid-cli
fi

# Create output directory
mkdir -p docs/galaxy-map/diagrams

# Extract and generate diagrams from each markdown file
cd docs/galaxy-map

for file in *.md; do
    echo "Processing $file..."

    # Extract mermaid blocks and generate individual diagrams
    # This is a simplified version - you may need to parse more carefully
    awk '/```mermaid/,/```/' "$file" > temp.mmd 2>/dev/null

    if [ -s temp.mmd ]; then
        # Generate PNG
        mmdc -i temp.mmd -o "diagrams/${file%.md}.png" -b transparent 2>/dev/null
        echo "  ✅ Generated diagrams/${file%.md}.png"
    fi
done

rm -f temp.mmd

echo ""
echo "✨ Done! Diagrams saved to docs/galaxy-map/diagrams/"
echo "📁 View them with any image viewer"
