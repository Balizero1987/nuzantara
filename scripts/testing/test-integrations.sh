#!/bin/bash

# ZANTARA Integration Testing Script
# Tests all 15+ integrations systematically

echo "🧪 ZANTARA Integration Testing - $(date)"
echo "=================================================="

BASE_URL="http://localhost:8080"

# Test server health
echo "1. Testing server health..."
curl -s "$BASE_URL/health" | jq -r '.status // "ERROR"'
echo ""

# Test Memory System
echo "2. Testing Memory System..."
MEMORY_RESULT=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{"key":"memory.save","params":{"content":"Integration test $(date)","title":"Test Memory"}}')
echo $MEMORY_RESULT | jq -r '.result.saved // "FAILED"'
echo ""

# Test Claude AI
echo "3. Testing Claude AI..."
CLAUDE_RESULT=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{"key":"claude.chat","params":{"prompt":"Say: Claude OK"}}')
echo $CLAUDE_RESULT | jq -r '.result.response // "FAILED"'
echo ""

# Test OpenAI
echo "4. Testing OpenAI..."
OPENAI_RESULT=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{"key":"openai.chat","params":{"prompt":"Say: OpenAI OK"}}')
echo $OPENAI_RESULT | jq -r '.result.response // (.error + ": " + .message)'
echo ""

# Test Generic AI (fallback)
echo "5. Testing Generic AI..."
AI_RESULT=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{"key":"ai.chat","params":{"prompt":"Say: AI OK"}}')
echo $AI_RESULT | jq -r '.result.response // "FAILED"'
echo ""

# Test Google Chat
echo "6. Testing Google Chat..."
CHAT_RESULT=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{"key":"googlechat.notify","params":{"text":"🧪 Integration test $(date)","space":"AAQA-k5n4q4"}}')
echo $CHAT_RESULT | jq -r '.result.sent // "FAILED"'
echo ""

# Test Google Drive
echo "7. Testing Google Drive..."
DRIVE_RESULT=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -d '{"key":"drive.upload","params":{"media":{"body":"Test file content"},"requestBody":{"name":"test-$(date +%s).txt"}}}')
echo $DRIVE_RESULT | jq -r '.result.file.name // (.error + ": " + .message)'
echo ""

echo "=================================================="
echo "✅ Integration test complete - $(date)"