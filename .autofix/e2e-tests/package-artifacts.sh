#!/bin/bash
# Package all E2E test artifacts into ZIP

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="zantara_test_artifacts_${TIMESTAMP}.zip"

echo "📦 Creating artifact package: $ZIP_NAME"

zip -r "$ZIP_NAME" \
  test-results/ \
  videos/ \
  har-files/ \
  playwright-report/ \
  test-results.json \
  report.json \
  summary.md \
  playwright_run_log.md \
  2>/dev/null

if [ -f "$ZIP_NAME" ]; then
  SIZE=$(du -h "$ZIP_NAME" | cut -f1)
  echo "✅ Package created: $ZIP_NAME ($SIZE)"
  echo "📂 Location: $(pwd)/$ZIP_NAME"
else
  echo "❌ Failed to create package"
  exit 1
fi
