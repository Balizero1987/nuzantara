#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 TESTING ALL GOOGLE WORKSPACE HANDLERS WITH OAUTH2"
echo "===================================================="
echo ""

test_handler() {
    local key=$1
    local params=$2
    local desc=$3

    response=$(curl -s -X POST $BASE_URL/call \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "{\"key\": \"$key\", \"params\": $params}" 2>/dev/null)

    if echo "$response" | grep -q '"ok":true'; then
        result=$(echo "$response" | jq -r '.data | keys[0] // "success"' 2>/dev/null)
        echo "✅ $key - $desc - Result: $result"
    else
        error=$(echo "$response" | jq -r '.error // "unknown"' 2>/dev/null)
        echo "❌ $key - $error"
    fi
}

echo "📄 GOOGLE DOCS (3)"
echo "=================="
test_handler "docs.create" '{"title": "Auto Test Doc", "content": "Test content"}' "Create document"
test_handler "docs.read" '{"documentId": "1TGRijpcCtgf4t9DAIk88wthDfm2VQooa-aFIwR3dgio"}' "Read document"
test_handler "docs.update" '{"documentId": "1TGRijpcCtgf4t9DAIk88wthDfm2VQooa-aFIwR3dgio", "requests": [{"insertText": {"location": {"index": 1}, "text": "."}}]}' "Update document"
echo ""

echo "📊 GOOGLE SHEETS (3)"
echo "===================="
test_handler "sheets.create" '{"title": "Auto Test Sheet"}' "Create spreadsheet"
test_handler "sheets.read" '{"spreadsheetId": "1xd07H_xfoYxMXQR5ruO4m4ysqGsiGoQVeEYFYyH3rO4", "range": "A1:B2"}' "Read spreadsheet"
test_handler "sheets.append" '{"spreadsheetId": "1xd07H_xfoYxMXQR5ruO4m4ysqGsiGoQVeEYFYyH3rO4", "range": "A1", "values": [["test", "data"]]}' "Append to sheet"
echo ""

echo "📁 GOOGLE DRIVE (4)"
echo "==================="
test_handler "drive.list" '{"pageSize": 3}' "List files"
test_handler "drive.search" '{"query": "test"}' "Search files"
test_handler "drive.upload" '{"name": "test.txt", "mimeType": "text/plain", "media": {"body": "test content"}}' "Upload file"
test_handler "drive.read" '{"fileId": "1TGRijpcCtgf4t9DAIk88wthDfm2VQooa-aFIwR3dgio"}' "Read file"
echo ""

echo "📅 GOOGLE CALENDAR (3)"
echo "======================"
test_handler "calendar.list" '{}' "List calendars"
test_handler "calendar.create" '{"event": {"summary": "Test Event", "start": {"dateTime": "2025-09-27T10:00:00Z"}, "end": {"dateTime": "2025-09-27T11:00:00Z"}}}' "Create event"
test_handler "calendar.get" '{"calendarId": "primary"}' "Get calendar"
echo ""

echo "📧 GMAIL (3)"
echo "============"
test_handler "gmail.send" '{"to": "test@example.com", "subject": "Test", "message": "Test message"}' "Send email"
test_handler "gmail.list" '{"maxResults": 3}' "List emails"
test_handler "gmail.read" '{"messageId": "1997dd7fa238ae80"}' "Read email"
echo ""

echo "📊 GOOGLE SLIDES (3)"
echo "===================="
test_handler "slides.create" '{"title": "Test Presentation"}' "Create presentation"
test_handler "slides.read" '{"presentationId": "test"}' "Read presentation"
test_handler "slides.update" '{"presentationId": "test", "requests": []}' "Update presentation"
echo ""

echo "===================================================="
echo "✅ Test complete! Check results above."
echo "====================================================">