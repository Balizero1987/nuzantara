#!/bin/bash

# ZANTARA Google Workspace Domain-Wide Delegation Setup Script
# This script opens the correct Google Admin page and displays configuration info

echo "🚀 ZANTARA Google Workspace Domain-Wide Delegation Setup"
echo "========================================================="
echo ""
echo "📋 SERVICE ACCOUNT DETAILS:"
echo "Client ID: 102437745575570448134"
echo "Email: zantara@involuted-box-469105-r0.iam.gserviceaccount.com"
echo ""
echo "📋 OAUTH SCOPES (copy this entire line):"
echo "https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/spreadsheets.readonly,https://www.googleapis.com/auth/documents.readonly,https://www.googleapis.com/auth/presentations.readonly"
echo ""
echo "========================================================="
echo ""
echo "📌 INSTRUCTIONS:"
echo "1. Opening Google Admin Console in browser..."
echo "2. Navigate to: Security → API controls → Domain-wide delegation"
echo "3. Click 'Add new'"
echo "4. Paste Client ID: 102437745575570448134"
echo "5. Paste the OAuth scopes (entire line above)"
echo "6. Click 'Authorize'"
echo ""

# Open Google Admin Console
echo "🌐 Opening Google Admin Console..."
open "https://admin.google.com/ac/owl/domainwidedelegation"

echo ""
echo "⏳ After configuration, test with:"
echo "curl -X POST 'http://localhost:8080/call' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'x-api-key: zantara-internal-dev-key-2025' \\"
echo "  -d '{\"key\": \"drive.list\", \"params\": {\"pageSize\": 3}}'"
echo ""
echo "✅ Configuration file saved: GOOGLE_ADMIN_CONFIG.md"