# 🎯 OPERATING RULES - ZANTARA v5.2.0 ChatGPT Patch

## SYSTEM STATUS
**Current Version**: 5.2.0-alpha
**Local Server**: http://localhost:8081
**Status**: Development & Testing Branch
**Master Version**: v4.0.0 (safe at /Users/antonellosiano/Desktop/zantara-bridge/)

## CORE PROTOCOLS

### 1. STARTUP SEQUENCE (v5.2.0)
1. Always read `AI_START_HERE.md` first
2. Check `HANDOVER_LOG.md` for latest session context
3. Review `TODO_CURRENT.md` for pending tasks
4. Run `npm run health-check` to verify v5.2.0 system
5. Start server: `npm start` (port 8081)

### 2. HANDLER PRIORITIES (v5.2.0)
**CORE v5.2.0 HANDLERS**:
- identity.resolve: AMBARADAM system with Zod validation
- identity.onboarding.start: New collaborator setup
- Health endpoint: System status checking

**PENDING MIGRATION**:
- Memory, AI, Google, Workspace handlers (from v4.0.0)
- Communication handlers (Slack, Discord, Google Chat)

### 3. DEPLOYMENT RULES
- **Local Changes**: Always `npm run build` before testing
- **Production**: Only deploy via Cloud Run with proper OAuth2 tokens
- **Never commit**: Secrets, API keys, or sensitive tokens
- **Always verify**: Test endpoints after deployment

### 4. OAUTH2 MANAGEMENT
- Enable handlers by setting `USE_OAUTH2=true` (Cloud Run env).
- Provide tokens via Secret Manager (`OAUTH2_TOKENS` → env `OAUTH2_TOKENS_JSON`).
- Optional: set `OAUTH2_TOKENS_FILE` (default `./oauth2-tokens.json`); entrypoint materializza il file e crea il symlink legacy.
- Client ID: `1064094238013-fj7iktn683mo2b5kpfqgl67flj0n1ui8` — scopes completi Workspace.
- Token refresh automatico tramite listener OAuth2; ruotare il secret quando viene aggiornato.

### 5. ERROR HANDLING
- Check BridgeError integration for all handlers
- Monitor rate limiting (5-tier system active)
- Use cache stats: `curl http://localhost:8080/cache/stats`
- Rate limit stats: `curl http://localhost:8080/rate-limit/stats`

## CRITICAL WARNINGS

### ⚠️ DO NOT:
- Delete OAuth2 tokens without backup
- Modify Service Account permissions without testing
- Deploy without testing locally first
- Create new Google Cloud services without cleanup plan

### ✅ ALWAYS:
- Test memory.save before major changes
- Verify AI providers are responsive
- Check production health after deployment
- Update HANDOVER_LOG.md after sessions

## ENTERPRISE FEATURES

### Multi-layer Caching
- L1 (Memory): 1000 entries, ultra-fast
- L2 (Redis): Persistent, configurable
- TTL: AI (1h), Memory (10min), Calendar (5min)

### Rate Limiting
- AI endpoints: 50 per 15min
- Webhooks: 30 per 10min
- Data: 200 per 5min
- Auth: 5 per 15min
- General: 60 per min

### Monitoring
- Health: `/health`
- Cache: `/cache/stats`
- Rate limits: `/rate-limit/stats`

## INTEGRATION STATUS

### ✅ FULLY OPERATIONAL
- OpenAI: 83 models (Gemini prioritized for speed)
- Claude: Haiku model active
- Memory System: Complete persistence
- Google Chat: Webhook ready
- Workspace: OAuth2 document creation

### ⚠️ NEEDS CONFIGURATION
- Slack: Requires SLACK_WEBHOOK_URL
- Discord: Requires DISCORD_WEBHOOK_URL
- Redis: Optional persistence upgrade

## HANDOVER REQUIREMENTS

### Before Session End
1. Update HANDOVER_LOG.md with session summary
2. Mark TODO_CURRENT.md tasks as completed
3. Test critical endpoints one final time
4. Note any OAuth2 token status changes
5. Document any new handlers or features

### Session Start Protocol
1. Check if server is running: `lsof -ti:8080`
2. Verify health endpoint responds
3. Test memory.save with simple content
4. Review rate-limit and cache stats
5. Check production vs local discrepancies

## EMERGENCY PROCEDURES

### Server Down
1. Check PID: `lsof -ti:8080`
2. Kill if hung: `kill -9 <PID>`
3. Rebuild: `npm run build`
4. Restart: `npm start`

### OAuth2 Expired
1. Run: `node oauth2-simple.js`
2. Complete authorization flow
3. Verify tokens saved
4. Test Google Workspace handlers

### Production Issues
1. Check Cloud Run logs
2. Verify environment variables
3. Test OAuth2 token validity
4. Redeploy if necessary

---

**Last Updated**: 2025-09-23
**Maintainer**: AI Assistant
**Version**: v1.0