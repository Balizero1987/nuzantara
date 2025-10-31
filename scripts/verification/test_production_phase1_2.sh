#!/bin/bash
# Test Phase 1+2 in production (Fly.io)

echo "=============================================================================="
echo "🧪 PRODUCTION TEST - PHASE 1+2 Tool Prefetch"
echo "=============================================================================="
echo ""

BASE_URL="https://nuzantara-rag.fly.dev"

echo "TEST 1: Pricing Query (berapa harga C1 visa?)"
echo "------------------------------------------------------------------------------"
curl -X POST "$BASE_URL/api/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "berapa harga C1 visa?",
    "user_id": "test_pricing",
    "stream": true
  }' 2>/dev/null | head -c 1000
echo ""
echo ""

echo "TEST 2: Pricing Query in Italian (quanto costa KITAS E23?)"
echo "------------------------------------------------------------------------------"
curl -X POST "$BASE_URL/api/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "quanto costa KITAS E23?",
    "user_id": "test_pricing_it",
    "stream": true
  }' 2>/dev/null | head -c 1000
echo ""
echo ""

echo "TEST 3: Team Query (chi è Adit?)"
echo "------------------------------------------------------------------------------"
curl -X POST "$BASE_URL/api/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "chi è Adit?",
    "user_id": "test_team",
    "stream": true
  }' 2>/dev/null | head -c 1000
echo ""
echo ""

echo "TEST 4: Simple Query (no prefetch expected)"
echo "------------------------------------------------------------------------------"
curl -X POST "$BASE_URL/api/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ciao come stai?",
    "user_id": "test_simple",
    "stream": true
  }' 2>/dev/null | head -c 500
echo ""
echo ""

echo "=============================================================================="
echo "✅ PRODUCTION TESTS COMPLETED"
echo "=============================================================================="
echo ""
echo "Expected results:"
echo "✅ TEST 1+2: Should contain exact prices (2.300.000 IDR) with citation"
echo "✅ TEST 3: Should contain team member info"
echo "✅ TEST 4: Should stream normally without prefetch"
echo ""
echo "Check Fly.io logs for:"
echo "- '🎯 [Prefetch] PRICING query detected'"
echo "- '🎯 [Prefetch] TEAM query detected'"
echo "- '🚀 [Prefetch] Executing get_pricing before streaming'"
echo "- '✅ [Prefetch] Got data: XXX chars'"
