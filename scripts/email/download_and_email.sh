#!/bin/bash
# Download Intel artifacts from GitHub Actions and send emails

set -e

echo "==============================================="
echo "📥 Intel Artifacts → Email Workflow"
echo "==============================================="
echo ""

# Get latest successful workflow run IDs
echo "🔍 Finding latest successful workflows..."

DOWNLOADED=0

for GROUP in intel-group-A intel-group-B intel-group-C intel-group-D; do
  echo ""
  echo "📦 Processing $GROUP..."

  # Get latest successful run
  RUN_ID=$(gh run list --workflow "${GROUP}.yml" --repo Balizero1987/nuzantara --limit 1 --json databaseId,conclusion --jq '.[] | select(.conclusion=="success") | .databaseId')

  if [ -z "$RUN_ID" ]; then
    echo "⚠️  No successful runs found for $GROUP"
    continue
  fi

  echo "   Run ID: $RUN_ID"

  # Download artifacts
  ARTIFACT_DIR="scripts/INTEL_SCRAPING_DOWNLOADED/${GROUP}"
  mkdir -p "$ARTIFACT_DIR"

  gh run download "$RUN_ID" --repo Balizero1987/nuzantara --dir "$ARTIFACT_DIR" 2>/dev/null || {
    echo "   ⚠️  No artifacts to download"
    continue
  }

  # Move articles to main INTEL_SCRAPING directory
  if [ -d "$ARTIFACT_DIR" ]; then
    find "$ARTIFACT_DIR" -name "*.md" -type f | while read -r article; do
      # Extract category from path
      CATEGORY=$(basename "$(dirname "$(dirname "$article")")")

      # Create category directory
      mkdir -p "scripts/INTEL_SCRAPING/${CATEGORY}/articles"

      # Copy article
      cp "$article" "scripts/INTEL_SCRAPING/${CATEGORY}/articles/"
      DOWNLOADED=$((DOWNLOADED + 1))
    done

    echo "   ✅ Downloaded articles from $GROUP"
  fi
done

echo ""
echo "==============================================="
echo "📊 Summary"
echo "==============================================="

# Count actual articles
TOTAL_ARTICLES=$(find scripts/INTEL_SCRAPING -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Total articles available: $TOTAL_ARTICLES"
echo ""

if [ "$TOTAL_ARTICLES" -eq 0 ]; then
  echo "❌ No articles to send"
  exit 0
fi

# Send emails
echo "==============================================="
echo "📧 Sending Emails"
echo "==============================================="
echo ""

python3 scripts/send_pending_emails.py

echo ""
echo "✅ Workflow complete!"
