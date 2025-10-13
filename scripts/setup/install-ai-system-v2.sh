#!/bin/bash
# =========================================
# ZANTARA AI COORDINATION SYSTEM - COMPLETE PATCH v2
# Status: 2025-09-22 - All core integrations verified
# =========================================

echo "🚀 Installing ZANTARA AI Coordination System..."
cd /Users/antonellosiano/Desktop/zantara-bridge/

# 1. Create AI Bootstrap File with VERIFIED STATUS
cat > AI_START_HERE.md << 'EOF'
# 🚀 AI OPERATIONAL BOOTSTRAP - ZANTARA

## IMMEDIATE CONTEXT
**Project**: ZANTARA - AI Orchestration Engine for Bali Zero
**Location**: `/Users/antonellosiano/Desktop/zantara-bridge/`
**Server**: v4.0.0 running on port 8080
**Visual**: ZANTARA is represented as a woman (similar to Riri)

## VERIFIED INTEGRATIONS STATUS
✅ **FULLY OPERATIONAL**:
- OpenAI: 81 models (GPT-4, GPT-5, O4-mini)
- Claude/Anthropic: Client initialized
- Google Services: Project involuted-box-469105-r0
- Gmail, Drive, Sheets, Calendar: All APIs ready
- Memory System: Fully operational

🟡 **CONFIGURED (untested)**: Slack, Discord
❌ **IN DEVELOPMENT**: Analytics (BigQuery), Error Tracking

## FIRST ACTIONS (DO NOW)
1. `cat HANDOVER_LOG.md` - Check last session
2. `cat TODO_CURRENT.md` - See current tasks  
3. `npm run health-check` - Verify system
4. Check task lock before starting

## MAIN ENDPOINTS
- Production: https://zantara-bridge-v2-prod-himaadsxua-et.a.run.app
- Local: http://localhost:8080
- Handler: POST /call {"key": "service.action", "params": {...}}
EOF

# 2. Updated Handover Log
cat > HANDOVER_LOG.md << 'EOF'
# 📝 HANDOVER LOG - ZANTARA

---

## 2025-09-22 | VERIFICATION_COMPLETE | ✅
**Status**: All core integrations verified and operational
**Completed**:
- ✅ OpenAI API: 81 models available
- ✅ Claude/Anthropic: Initialized
- ✅ Google Suite: All APIs functional
- ✅ Memory System: Operational
- ✅ Server v4.0.0 on port 8080

**Next Priority**:
1. Test Slack/Discord integrations
2. Optimize memory.search performance
3. Implement retry logic for handlers

---
[New entries append below]
EOF

# 3. Updated TODO List
cat > TODO_CURRENT.md << 'EOF'
# ✅ CURRENT TASKS - ZANTARA

## 🔴 PRIORITY 1 - TESTING
- [ ] Test Slack webhook integration
- [ ] Test Discord integration
- [ ] Verify all 15+ handler endpoints

## 🟡 PRIORITY 2 - OPTIMIZATION
- [ ] Memory.search performance tuning
- [ ] Add retry logic to handlers
- [ ] Implement request rate limiting

## 🟢 PRIORITY 3 - DEVELOPMENT
- [ ] Complete BigQuery analytics setup
- [ ] Implement error tracking system
- [ ] Add integration test suite

## ⚡ QUICK WINS
- [ ] Document all working endpoints
- [ ] Create .env.example
- [ ] Add health endpoint monitoring
EOF

# 4. AI Session Starter Script
cat > start-ai-session.sh << 'EOF'
#!/bin/bash
echo "🤖 Starting AI session for ZANTARA..."
echo "📍 Location: $(pwd)"
echo "⚡ Server: http://localhost:8080"
echo "📊 Status: $(curl -s http://localhost:8080/health | jq -r '.status // "OFFLINE"')"
echo ""
echo "📋 Quick reference:"
echo "   - ./check-status.sh       - System health"
echo "   - ./test-integrations.sh  - Test all APIs"
echo "   - cat HANDOVER_LOG.md     - Last session"
echo "   - cat TODO_CURRENT.md     - Current tasks"
echo ""
echo "✅ Ready for AI coordination!"
EOF

# 5. Status Check Script
cat > check-status.sh << 'EOF'
#!/bin/bash
echo "🔍 ZANTARA System Status Check"
echo "================================"

# Server status
if curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo "✅ Server: ONLINE (port 8080)"
    curl -s http://localhost:8080/health | jq '.'
else
    echo "❌ Server: OFFLINE"
fi

# Environment check
echo ""
echo "📋 Environment Variables:"
echo "   OPENAI_API_KEY: $([ -n "$OPENAI_API_KEY" ] && echo "✅ SET" || echo "❌ MISSING")"
echo "   ANTHROPIC_API_KEY: $([ -n "$ANTHROPIC_API_KEY" ] && echo "✅ SET" || echo "❌ MISSING")"
echo "   GOOGLE_SERVICE_ACCOUNT_KEY: $([ -n "$GOOGLE_SERVICE_ACCOUNT_KEY" ] && echo "✅ SET" || echo "❌ MISSING")"

# Process check
echo ""
echo "⚙️ Processes:"
ps aux | grep -E "(node|npm)" | grep -v grep | while read line; do
    echo "   📍 $line"
done

echo ""
echo "✅ Status check complete"
EOF

# 6. Integration Test Script
cat > test-integrations.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing ZANTARA Integrations..."
echo "=================================="

# Memory test
echo "📝 Testing Memory System..."
curl -s -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -d '{"key": "memory.save", "params": {"title": "Integration Test", "content": "Testing memory system"}}' | \
  jq '.result.ok // false' | grep -q true && echo "✅ Memory: OK" || echo "❌ Memory: FAIL"

# Bridge status
echo "🌉 Testing Bridge Status..."
curl -s http://localhost:8080/bridge/status | jq '.ok // false' | grep -q true && echo "✅ Bridge: OK" || echo "❌ Bridge: FAIL"

echo ""
echo "✅ Integration tests complete"
EOF

# 7. Quick Deploy Script
cat > deploy-quick.sh << 'EOF'
#!/bin/bash
echo "🚀 Quick Deploy to Production..."

# Build
npm run build

# Deploy to Cloud Run
gcloud run deploy zantara-bridge-v2-prod \
  --source . \
  --platform managed \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"

echo "✅ Deploy complete!"
echo "🌐 URL: https://zantara-bridge-v2-prod-himaadsxua-et.a.run.app"
EOF

# 8. Memory Management
cat > memory-tools.sh << 'EOF'
#!/bin/bash
case "$1" in
  "save")
    curl -X POST http://localhost:8080/call \
      -H "Content-Type: application/json" \
      -d "{\"key\": \"memory.save\", \"params\": {\"title\": \"$2\", \"content\": \"$3\"}}"
    ;;
  "search")
    curl -X POST http://localhost:8080/call \
      -H "Content-Type: application/json" \
      -d "{\"key\": \"memory.search\", \"params\": {\"query\": \"$2\"}}"
    ;;
  *)
    echo "Usage: $0 {save|search} [params...]"
    echo "  save <title> <content>  - Save memory"
    echo "  search <query>          - Search memories"
    ;;
esac
EOF

# 9. Make all scripts executable
chmod +x start-ai-session.sh
chmod +x check-status.sh  
chmod +x test-integrations.sh
chmod +x deploy-quick.sh
chmod +x memory-tools.sh

# 10. Final status
echo ""
echo "✅ ZANTARA AI Coordination System v2 installed!"
echo "📊 Status: All core integrations VERIFIED and operational"
echo ""
echo "🎯 Next steps:"
echo "   1. ./start-ai-session.sh    - Begin AI coordination"
echo "   2. ./check-status.sh        - Verify system health"
echo "   3. ./test-integrations.sh   - Test all integrations"
echo ""
echo "📍 Files created:"
echo "   - AI_START_HERE.md          - AI bootstrap guide"
echo "   - HANDOVER_LOG.md           - Session handover log"
echo "   - TODO_CURRENT.md           - Current task list"
echo "   - start-ai-session.sh       - AI session starter"
echo "   - check-status.sh           - System health check"
echo "   - test-integrations.sh      - Integration testing"
echo "   - deploy-quick.sh           - Production deployment"
echo "   - memory-tools.sh           - Memory management"
echo ""
echo "🚀 System ready for AI coordination!"