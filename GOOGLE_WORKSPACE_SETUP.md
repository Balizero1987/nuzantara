# Google Workspace Configuration - Service Account with Impersonation

## ✅ Current Configuration Status

### Service Account Setup
- **Method**: Service Account with Domain-Wide Delegation
- **Impersonation User**: `zero@balizero.com`
- **Status**: ✅ **WORKING**

### Environment Variables Configured
```bash
# Cloud Run Environment Variables (ACTIVE)
IMPERSONATE_USER=zero@balizero.com
USE_OAUTH2=false  # Forces Service Account usage
GOOGLE_SERVICE_ACCOUNT_KEY=[JSON key configured]
```

### Authentication Flow
1. Service Account authenticates using JWT
2. Impersonates `zero@balizero.com` for all Google Workspace APIs
3. Access granted to Drive, Calendar, Gmail, Sheets, Docs, Slides, Contacts

## 📋 API Access Status

| Service | Handler | Status | Notes |
|---------|---------|--------|-------|
| **Drive** | `drive.list`, `drive.upload`, `drive.search`, `drive.read` | ✅ Working | Returns files from zero@balizero.com's Drive |
| **Calendar** | `calendar.list`, `calendar.create`, `calendar.get` | ✅ Working | Access to calendars |
| **Gmail** | `gmail.send`, `gmail.list`, `gmail.get` | ✅ Configured | Ready to use |
| **Sheets** | `sheets.read`, `sheets.append`, `sheets.create` | ✅ Configured | Ready to use |
| **Docs** | `docs.create`, `docs.read`, `docs.update` | ✅ Configured | Ready to use |
| **Slides** | `slides.create`, `slides.read`, `slides.update` | ✅ Configured | Ready to use |
| **Contacts** | `contacts.list`, `contacts.create` | ✅ Configured | Ready to use |

## 🔧 Technical Implementation

### Service Account Authentication (`src/services/google-auth-service.ts`)
```typescript
// Service Account with impersonation (lines 117-122)
const jwt = new google.auth.JWT({
  email: sa.client_email,
  key: sa.private_key,
  scopes: config.scopes,
  subject: impersonate,  // zero@balizero.com
});
```

### Required Scopes
- **Drive**: `https://www.googleapis.com/auth/drive`
- **Calendar**: `https://www.googleapis.com/auth/calendar`
- **Gmail**: `https://www.googleapis.com/auth/gmail.send`
- **Sheets**: `https://www.googleapis.com/auth/spreadsheets`
- **Docs**: `https://www.googleapis.com/auth/documents`
- **Slides**: `https://www.googleapis.com/auth/presentations`
- **Contacts**: `https://www.googleapis.com/auth/contacts`

## 🚀 Testing Examples

### Test Drive Access
```bash
curl -X POST https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-external-dev-key-2025' \
  -d '{"key":"drive.list","params":{"pageSize":5}}'
```

### Test Calendar Access
```bash
curl -X POST https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: zantara-external-dev-key-2025' \
  -d '{"key":"calendar.list","params":{}}'
```

## 📊 ChromaDB / RAG Status

### Current State
- **bali.zero.chat**: ✅ Working (uses Claude Haiku directly)
- **rag.query**: ⚠️ Returns empty (no embeddings in ChromaDB)
- **rag.search**: ⚠️ Returns empty (no embeddings in ChromaDB)

### Analysis
The RAG backend is functional but ChromaDB in production has **no embeddings loaded**. The `bali.zero.chat` handler works because it bypasses RAG and uses Claude Haiku directly with built-in knowledge.

### Solution Required
Need to populate ChromaDB in production with embeddings from the knowledge base:
- Upload KB documents to Cloud Storage
- Run embedding generation process
- Load embeddings into production ChromaDB

## 🔒 Security Notes

1. **Service Account Key**: Stored securely as environment variable
2. **Domain-Wide Delegation**: Enabled for the Service Account
3. **Impersonation**: Limited to `zero@balizero.com`
4. **API Key**: Required for all external calls (`x-api-key` header)

## 📝 Prerequisites for Domain-Wide Delegation

For this setup to work, the following must be configured in Google Workspace Admin:

1. **Enable API Access** in Google Workspace Admin Console
2. **Configure Domain-Wide Delegation**:
   - Go to Security → API Controls → Domain-wide delegation
   - Add Service Account Client ID
   - Grant required scopes
3. **Service Account must have**:
   - Domain-wide delegation enabled
   - Proper scopes authorized in Admin Console

## 🚦 Next Steps

1. **Populate ChromaDB** with embeddings for RAG functionality
2. **Test all Google Workspace handlers** with real operations
3. **Monitor usage** through Cloud Run logs
4. **Add error handling** for quota limits

---

**Last Updated**: 2025-10-05
**Configuration Status**: ✅ ACTIVE & WORKING
**Impersonation User**: zero@balizero.com