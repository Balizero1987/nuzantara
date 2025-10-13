#!/bin/bash
# Universal URL Cleanup Script
# Replaces wrong Cloud Run URL with correct one

set -e

WRONG_URL="zantara-v520-nuzantara-1064094238013.europe-west1.run.app"
CORRECT_URL="zantara-v520-nuzantara-himaadsxua-ew.a.run.app"

echo "🧹 UNIVERSAL URL CLEANUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Wrong URL:   $WRONG_URL"
echo "Correct URL: $CORRECT_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Count total occurrences first
total_files=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -l "$WRONG_URL" 2>/dev/null | wc -l)
total_occurrences=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -c "$WRONG_URL" 2>/dev/null | awk -F: '{sum += $2} END {print sum}')

echo "📊 Found: $total_occurrences occurrences in $total_files files"
echo ""

# Function to replace in file
replace_in_file() {
    local file="$1"
    if [ -f "$file" ]; then
        # Count occurrences in this file
        count=$(grep -c "$WRONG_URL" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "🔧 Fixing $file ($count occurrences)"
            
            # Create backup
            cp "$file" "$file.backup"
            
            # Replace wrong URL with correct URL
            sed -i.tmp "s|$WRONG_URL|$CORRECT_URL|g" "$file"
            rm "$file.tmp"
            
            # Verify replacement
            new_count=$(grep -c "$CORRECT_URL" "$file" 2>/dev/null || echo "0")
            remaining_wrong=$(grep -c "$WRONG_URL" "$file" 2>/dev/null || echo "0")
            
            if [ "$remaining_wrong" -eq 0 ]; then
                echo "  ✅ SUCCESS: $count → 0 wrong URLs, $new_count correct URLs"
                rm "$file.backup"  # Remove backup if successful
            else
                echo "  ❌ ERROR: Still has $remaining_wrong wrong URLs"
                mv "$file.backup" "$file"  # Restore backup
            fi
        fi
    fi
}

# Process different file types
echo "🔍 Processing files..."

# TypeScript/JavaScript files
find . -type f \( -name "*.ts" -o -name "*.js" \) -not -path "./node_modules/*" -not -path "./.git/*" | while read -r file; do
    replace_in_file "$file"
done

# Markdown files
find . -type f -name "*.md" -not -path "./.git/*" | while read -r file; do
    replace_in_file "$file"
done

# JSON files
find . -type f -name "*.json" -not -path "./node_modules/*" -not -path "./.git/*" | while read -r file; do
    replace_in_file "$file"
done

# HTML files
find . -type f -name "*.html" -not -path "./.git/*" | while read -r file; do
    replace_in_file "$file"
done

# Shell scripts
find . -type f -name "*.sh" -not -path "./.git/*" | while read -r file; do
    replace_in_file "$file"
done

# Python files
find . -type f -name "*.py" -not -path "./.git/*" | while read -r file; do
    replace_in_file "$file"
done

echo ""
echo "🎯 FINAL VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check remaining wrong URLs
remaining_files=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -l "$WRONG_URL" 2>/dev/null | wc -l)
remaining_occurrences=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -c "$WRONG_URL" 2>/dev/null | awk -F: '{sum += $2} END {print sum}' || echo "0")

# Check correct URLs
correct_files=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -l "$CORRECT_URL" 2>/dev/null | wc -l)
correct_occurrences=$(find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -c "$CORRECT_URL" 2>/dev/null | awk -F: '{sum += $2} END {print sum}' || echo "0")

echo "❌ Wrong URLs remaining: $remaining_occurrences in $remaining_files files"
echo "✅ Correct URLs now: $correct_occurrences in $correct_files files"

if [ "$remaining_occurrences" -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! All wrong URLs have been replaced!"
    echo "🔗 $total_occurrences URLs corrected across the entire project"
else
    echo ""
    echo "⚠️  Still need to fix $remaining_occurrences URLs in:"
    find . -type f -name "*.md" -o -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.html" -o -name "*.sh" -o -name "*.py" | xargs grep -l "$WRONG_URL" 2>/dev/null | head -10
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Universal URL cleanup completed!"