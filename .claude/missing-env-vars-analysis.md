# Missing Environment Variables Analysis - 2025-10-07

## 🎯 Summary

Production Cloud Run service is **missing 17 critical environment variables** needed by handlers.

---

## 📊 Current Production State

**Configured in Cloud Run** (4 variables):
- ✅ `GOOGLE_MAPS_API_KEY` (secret)
- ✅ `GOOGLE_SERVICE_ACCOUNT_KEY` (secret)
- ✅ `ZANTARA_CALENDAR_ID`
- ❌ Duplicate `GOOGLE_MAPS_API_KEY` entry (should clean up)

**Missing from Production** (17 variables):

### **High Priority - Core Functionality**

1. **`RAG_BACKEND_URL`** ⚠️ CRITICAL
   - Used by: `src/handlers/rag/rag.ts`, `src/handlers/intel/news-search.ts`, `src/handlers/zantara/zantaraKnowledgeHandler.ts`
   - Purpose: RAG backend connection for AI queries
   - Default fallback: `https://zantara-rag-backend-himaadsxua-ew.a.run.app` (hardcoded)
   - **Action**: Set to production RAG URL

2. **`ZANTARA_REPORTS_FOLDER_ID`** ⚠️ HIGH
   - Used by: `src/handlers/analytics/weekly-report.ts:439`
   - Purpose: Google Drive folder for weekly reports
   - Default fallback: `1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5`
   - **Action**: Verify folder ID or use default

3. **`GDRIVE_AMBARADAM_DRIVE_ID`** ⚠️ HIGH
   - Used by: `src/handlers/google-workspace/drive.ts:94`
   - Purpose: Target shared drive for uploads
   - Default fallback: None (optional)
   - **Action**: Set if Ambaradam shared drive should be default

### **Medium Priority - Communication Handlers**

4. **`WHATSAPP_ACCESS_TOKEN`** 🔴 REQUIRED
   - Used by: `src/handlers/communication/whatsapp.ts:16`
   - Purpose: Meta WhatsApp Business API authentication
   - **Action**: Add as secret (sensitive)

5. **`WHATSAPP_PHONE_NUMBER_ID`** 🔴 REQUIRED
   - Used by: `src/handlers/communication/whatsapp.ts:17`
   - Purpose: Meta WhatsApp phone number ID
   - **Action**: Get from Meta Business (can be auto-detected from webhook)

6. **`WHATSAPP_VERIFY_TOKEN`** 🔴 REQUIRED
   - Used by: `src/handlers/communication/whatsapp.ts:18`
   - Purpose: Webhook verification token
   - Default: `zantara-balizero-2025-secure-token`
   - **Action**: Use default or set custom

7. **`INSTAGRAM_ACCESS_TOKEN`** (fallback to WHATSAPP_ACCESS_TOKEN)
   - Used by: `src/handlers/communication/instagram.ts:18`
   - Purpose: Instagram DM API authentication
   - **Action**: Same token as WhatsApp (Meta app)

8. **`INSTAGRAM_PAGE_ID`**
   - Used by: `src/handlers/communication/instagram.ts:19`
   - Purpose: Instagram page ID (@balizero0)
   - **Action**: Get from Meta Business or auto-detect

9. **`INSTAGRAM_ACCOUNT_ID`**
   - Used by: `src/handlers/communication/instagram.ts:20`
   - Purpose: Instagram account ID
   - **Action**: Auto-detected from webhook

10. **`INSTAGRAM_VERIFY_TOKEN`**
    - Used by: `src/handlers/communication/instagram.ts:21`
    - Purpose: Instagram webhook verification
    - Default: `zantara-balizero-2025-secure-token`
    - **Action**: Use default or set custom

11. **`TWILIO_ACCOUNT_SID`** 🟡 OPTIONAL
    - Used by: `src/handlers/communication/twilio-whatsapp.ts:12`
    - Purpose: Twilio WhatsApp alternative
    - **Action**: Only if using Twilio sandbox

12. **`TWILIO_AUTH_TOKEN`** 🟡 OPTIONAL
    - Used by: `src/handlers/communication/twilio-whatsapp.ts:13`
    - Purpose: Twilio authentication
    - **Action**: Only if using Twilio sandbox

13. **`TWILIO_WHATSAPP_NUMBER`** 🟡 OPTIONAL
    - Used by: `src/handlers/communication/twilio-whatsapp.ts:14`
    - Purpose: Twilio sandbox number
    - Default: `whatsapp:+14155238886`
    - **Action**: Use default or set custom

### **Low Priority - Alerts/Monitoring**

14. **`DISCORD_WEBHOOK_URL`** 🟢 OPTIONAL
    - Used by: Alert handlers (search needed)
    - Purpose: Discord notifications
    - **Action**: Add if Discord alerts desired

15. **`SLACK_WEBHOOK_URL`** 🟢 OPTIONAL
    - Used by: Alert handlers (search needed)
    - Purpose: Slack notifications
    - **Action**: Add if Slack alerts desired

16. **`GOOGLE_CHAT_WEBHOOK_URL`** 🟢 OPTIONAL
    - Used by: Alert handlers (search needed)
    - Purpose: Google Chat notifications
    - **Action**: Add if Google Chat alerts desired

### **Configuration - Non-Critical**

17. **`AI_MAX_TOKENS`**
    - Purpose: AI response token limit
    - Default: Usually 4096
    - **Action**: Set if custom limit needed

18. **`AI_ROUTER_STRICT`**
    - Purpose: Strict AI routing mode
    - Default: false
    - **Action**: Set to `true` if strict routing desired

19. **`BRIDGE_ORACLE_ENABLED`**
    - Purpose: Bridge Oracle feature flag
    - Default: false
    - **Action**: Enable if feature needed

20. **`ZANTARA_OUTPUT_FORMAT`**
    - Purpose: Response format configuration
    - Default: json
    - **Action**: Set if custom format needed

---

## 🚀 Recommended Actions

### **Immediate (Deploy Now)**

```bash
# 1. RAG Backend URL
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --set-env-vars RAG_BACKEND_URL=https://zantara-rag-backend-himaadsxua-ew.a.run.app

# 2. Reports Folder ID (using default)
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --set-env-vars ZANTARA_REPORTS_FOLDER_ID=1cR2BRhVx0fODIQxdLfRhQV_xJ9R9kWb5
```

### **High Priority (After Getting Values)**

```bash
# WhatsApp/Instagram (Meta Business)
# Get tokens from: https://developers.facebook.com/apps/1074166541097027
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --update-secrets WHATSAPP_ACCESS_TOKEN=whatsapp-access-token:latest \
  --set-env-vars \
WHATSAPP_PHONE_NUMBER_ID=<get_from_meta>,\
WHATSAPP_VERIFY_TOKEN=zantara-balizero-2025-secure-token,\
INSTAGRAM_PAGE_ID=<get_from_meta>,\
INSTAGRAM_VERIFY_TOKEN=zantara-balizero-2025-secure-token
```

### **Optional (Add Later)**

```bash
# Twilio (if using)
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --update-secrets \
TWILIO_ACCOUNT_SID=twilio-account-sid:latest,\
TWILIO_AUTH_TOKEN=twilio-auth-token:latest \
  --set-env-vars TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Alert webhooks (if desired)
gcloud run services update zantara-v520-nuzantara \
  --region europe-west1 \
  --set-env-vars \
DISCORD_WEBHOOK_URL=<url>,\
SLACK_WEBHOOK_URL=<url>,\
GOOGLE_CHAT_WEBHOOK_URL=<url>
```

---

## 📝 Notes

1. **Secrets vs Env Vars**:
   - Use **secrets** for: API keys, tokens, passwords
   - Use **env vars** for: IDs, URLs, configuration flags

2. **Auto-Detection**:
   - `WHATSAPP_PHONE_NUMBER_ID`, `INSTAGRAM_ACCOUNT_ID` can be auto-detected from webhooks
   - Set them explicitly to avoid first-message delays

3. **Defaults in Code**:
   - Many handlers have sensible defaults
   - Production should explicitly set all required values

4. **Priority Order**:
   1. ⚠️ RAG_BACKEND_URL (core AI functionality)
   2. ⚠️ ZANTARA_REPORTS_FOLDER_ID (analytics)
   3. 🔴 WhatsApp/Instagram tokens (if using these channels)
   4. 🟡 Twilio (if using alternative)
   5. 🟢 Alert webhooks (nice to have)

---

**Generated**: 2025-10-07 by Claude Sonnet 4.5
**Session**: m2
