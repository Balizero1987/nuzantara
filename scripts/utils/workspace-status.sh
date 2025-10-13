#!/bin/bash
echo "🔍 ZANTARA v5.2.0 WORKSPACE STATUS"
echo "===================================="
echo ""

# Server health
echo "📊 SERVER HEALTH:"
curl -s http://localhost:8080/health | jq '.status, .version, .metrics.system'
echo ""

# Test core endpoints
echo "🧪 CORE ENDPOINTS:"
echo -n "  ✓ team.list: "
curl -s -X POST http://localhost:8080/call -H "Content-Type: application/json" -H "x-api-key: zantara-internal-dev-key-2025" -d '{"key":"team.list","params":{}}' | jq -r 'if .ok then "✅ \(.data | length) members" else "❌ Failed" end'

echo -n "  ✓ pricing.official: "
curl -s -X POST http://localhost:8080/call -H "Content-Type: application/json" -H "x-api-key: zantara-internal-dev-key-2025" -d '{"key":"pricing.official","params":{}}' | jq -r 'if .ok then "✅ OK" else "❌ Failed" end'

echo -n "  ✓ ai.chat: "
curl -s -X POST http://localhost:8080/call -H "Content-Type: application/json" -H "x-api-key: zantara-internal-dev-key-2025" -d '{"key":"ai.chat","params":{"prompt":"test"}}' | jq -r 'if .ok then "✅ OK" else "❌ Failed" end'

echo -n "  ✓ memory.save: "
curl -s -X POST http://localhost:8080/call -H "Content-Type: application/json" -H "x-api-key: zantara-internal-dev-key-2025" -d '{"key":"memory.save","params":{"userId":"test","key":"test","content":"test"}}' | jq -r 'if .ok then "✅ OK" else "❌ Failed" end'

echo ""

# Google Workspace
echo "☁️  GOOGLE WORKSPACE:"
echo -n "  ✓ drive.list: "
curl -s -X POST http://localhost:8080/call -H "Content-Type: application/json" -H "x-api-key: zantara-internal-dev-key-2025" -d '{"key":"drive.list","params":{"folderId":"0AEjwdLNEK7SqUk9PVA","maxResults":1}}' | jq -r 'if .ok then "✅ \(.data.files | length) files" else "❌ Failed" end'

echo -n "  ✓ sheets.read: "
curl -s -X POST http://localhost:8080/call -H "Content-Type: application/json" -H "x-api-key: zantara-internal-dev-key-2025" -d '{"key":"sheets.read","params":{"spreadsheetId":"1K-mOXbkZdPfYTZKh80hn652XDDgZpTGSjNQ_nyOpQ_M","range":"A1:A1"}}' | jq -r 'if .ok then "✅ OK" else "❌ Failed" end'

echo ""
echo "🌐 WEB INTERFACE: http://localhost:8080/zantara-intelligence-v7-fixed.html"
echo "📚 API DOCS: http://localhost:8080/docs"
echo "📊 METRICS: http://localhost:8080/metrics"
echo ""
echo "✅ Workspace operativo!"
