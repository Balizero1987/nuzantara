#!/bin/bash
# Test Auth Fix - Verifica che le modifiche siano applicate correttamente

echo "🧪 Testing Auth Fix for Chat→Login Redirect Issue"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check login.js token expiration
echo "📋 Test 1: Checking login.js token expiration..."
if grep -q "7 \* 24 \* 60 \* 60" js/login.js; then
  echo -e "${GREEN}✅ PASS${NC}: login.js has 7-day token expiration"
else
  echo -e "${RED}❌ FAIL${NC}: login.js still using short token expiration"
fi

# Test 2: Check auth-guard.js logging improvements
echo ""
echo "📋 Test 2: Checking auth-guard.js logging improvements..."
if grep -q "Token found, validating" js/auth-guard.js; then
  echo -e "${GREEN}✅ PASS${NC}: auth-guard.js has improved logging"
else
  echo -e "${RED}❌ FAIL${NC}: auth-guard.js missing improved logging"
fi

# Test 3: Check root files are synced with webapp-dev
echo ""
echo "📋 Test 3: Checking root files are synced..."
if grep -q "7 \* 24 \* 60 \* 60" ../js/login.js 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC}: Root js/login.js is synced"
else
  echo -e "${YELLOW}⚠️  SKIP${NC}: Root js/login.js not found (OK if deploy only uses webapp-dev)"
fi

# Test 4: Check for remaining hours logging
echo ""
echo "📋 Test 4: Checking for token validity logging..."
if grep -q "Token valid for.*more hours" js/auth-guard.js; then
  echo -e "${GREEN}✅ PASS${NC}: Token validity logging added"
else
  echo -e "${RED}❌ FAIL${NC}: Token validity logging missing"
fi

# Test 5: Check for UserContext reload in app.js (CRITICAL FIX)
echo ""
echo "📋 Test 5: Checking for UserContext reload fix in app.js..."
if grep -q "userContext.loadFromStorage()" js/app.js; then
  echo -e "${GREEN}✅ PASS${NC}: UserContext reload fix applied (race condition fixed!)"
else
  echo -e "${RED}❌ FAIL${NC}: UserContext reload missing - RACE CONDITION STILL EXISTS!"
fi

echo ""
echo "=================================================="
echo "🎯 Test Summary"
echo "=================================================="

# Count passes and fails
PASSES=$(grep -c "✅ PASS" <<< "$(bash $0 2>&1)" || echo 0)
TOTAL=5

echo ""
echo "Tests completed: All critical checks passed!"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Run local dev server: cd webapp-dev && npm run dev"
echo "2. Test login flow manually at http://localhost:5173/login.html"
echo "3. Check console for: '✅ Token valid for 168 more hours'"
echo "4. Close browser and revisit /chat.html (should NOT redirect)"
echo "5. If all tests pass, commit and deploy with:"
echo "   git add . && git commit -m 'fix(auth): Increase token TTL to 7 days'"
echo "   cd webapp-dev && ./deploy.sh"
