# 🔧 GOOGLE WORKSPACE DOMAIN-WIDE DELEGATION SETUP

## ⚡ QUICK COPY-PASTE CONFIGURATION

### 📋 SERVICE ACCOUNT DETAILS
```
Client ID: 102437745575570448134
Service Account Email: zantara@involuted-box-469105-r0.iam.gserviceaccount.com
```

### 📋 ALL SCOPES TO COPY (one line)
```
https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/spreadsheets.readonly,https://www.googleapis.com/auth/documents.readonly,https://www.googleapis.com/auth/presentations.readonly
```

### 📋 SCOPES FORMATTED (for readability)
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/spreadsheets.readonly
https://www.googleapis.com/auth/documents.readonly
https://www.googleapis.com/auth/presentations.readonly
```

---

## 🚀 STEP-BY-STEP CONFIGURATION GUIDE

### Prerequisites
- [ ] Google Workspace Super Admin access
- [ ] Domain: balizero.com (or your workspace domain)
- [ ] Browser: Chrome/Firefox recommended

### Configuration Steps

#### 1️⃣ Access Google Admin Console
```
URL: https://admin.google.com
Login: Use your Super Admin account
```

#### 2️⃣ Navigate to API Controls
```
Path: Security → Access and data control → API controls → Domain-wide delegation
Alternative: Menu → Security → API controls → Manage Domain Wide Delegation
```

#### 3️⃣ Add New Client
Click: **Add new**

#### 4️⃣ Enter Service Account Details
```
Client ID: 102437745575570448134
```

#### 5️⃣ Add OAuth Scopes
Paste this entire line in the OAuth scopes field:
```
https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/spreadsheets.readonly,https://www.googleapis.com/auth/documents.readonly,https://www.googleapis.com/auth/presentations.readonly
```

#### 6️⃣ Authorize
Click: **Authorize**

---

## 🧪 VERIFICATION COMMANDS

After configuration, test with these commands:

### Test Google Drive Access
```bash
curl -X POST "http://localhost:8080/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "drive.list", "params": {"pageSize": 3}}'
```

### Test Google Calendar Access
```bash
curl -X POST "http://localhost:8080/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "calendar.list", "params": {"maxResults": 3}}'
```

### Test Google Docs Creation
```bash
curl -X POST "http://localhost:8080/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "docs.create", "params": {"title": "Test Document from ZANTARA", "content": "Domain-wide delegation is working!"}}'
```

### Test Google Slides Creation
```bash
curl -X POST "http://localhost:8080/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "slides.create", "params": {"title": "ZANTARA Presentation"}}'
```

---

## ⚠️ IMPORTANT NOTES

1. **Propagation Time**: Changes may take up to 24 hours to fully propagate, but usually work within minutes
2. **User Impersonation**: Set `IMPERSONATE_USER=zero@balizero.com` in environment
3. **Security**: This grants the service account ability to act on behalf of users in your domain
4. **Revocation**: Can be revoked anytime from the same Admin Console page

---

## 🔧 TROUBLESHOOTING

### Common Issues and Solutions

#### "Method doesn't allow unregistered callers"
- **Cause**: Domain-wide delegation not configured
- **Solution**: Complete the steps above

#### "Login Required"
- **Cause**: Service account can't impersonate user
- **Solution**: Verify IMPERSONATE_USER environment variable is set

#### "Insufficient Permission"
- **Cause**: Missing scopes in delegation
- **Solution**: Ensure all scopes are added (use the one-line copy above)

---

## 📞 SUPPORT

If you encounter issues:
1. Verify service account email is correct
2. Check Google Workspace audit logs
3. Ensure you're using a Super Admin account
4. Try removing and re-adding the delegation

---

## ✅ SUCCESS INDICATORS

When properly configured, you should see:
- Drive operations return file lists
- Calendar operations show events
- Docs/Slides create successfully
- No "Login Required" errors
- Response times under 2 seconds

---

Generated: 2025-09-25
Service Account: zantara@involuted-box-469105-r0.iam.gserviceaccount.com
OAuth2 Client ID: 102437745575570448134