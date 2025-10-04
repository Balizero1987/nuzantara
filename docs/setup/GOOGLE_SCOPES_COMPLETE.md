# 📋 GOOGLE WORKSPACE - COMPLETE SCOPES LIST

## 🚀 ALL SCOPES IN ONE LINE (COPY THIS!)
```
https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/drive.readonly,https://www.googleapis.com/auth/drive.metadata,https://www.googleapis.com/auth/drive.metadata.readonly,https://www.googleapis.com/auth/drive.appdata,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/calendar.events.readonly,https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/spreadsheets.readonly,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/documents.readonly,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/presentations.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/userinfo.profile
```

## 📊 SCOPES BY SERVICE (DETAILED)

### Google Drive (7 scopes)
```
https://www.googleapis.com/auth/drive                     # Full access to Drive
https://www.googleapis.com/auth/drive.file                 # Files created/opened by app
https://www.googleapis.com/auth/drive.readonly             # Read-only access
https://www.googleapis.com/auth/drive.metadata             # Metadata read/write
https://www.googleapis.com/auth/drive.metadata.readonly    # Metadata read-only
https://www.googleapis.com/auth/drive.appdata              # App configuration data
https://www.googleapis.com/auth/drive.scripts              # Google Apps Script projects
```

### Google Calendar (4 scopes)
```
https://www.googleapis.com/auth/calendar                   # Full calendar access
https://www.googleapis.com/auth/calendar.events            # Events read/write
https://www.googleapis.com/auth/calendar.events.readonly   # Events read-only
https://www.googleapis.com/auth/calendar.readonly          # Calendar read-only
```

### Google Sheets (2 scopes)
```
https://www.googleapis.com/auth/spreadsheets              # Full sheets access
https://www.googleapis.com/auth/spreadsheets.readonly      # Sheets read-only
```

### Google Docs (2 scopes)
```
https://www.googleapis.com/auth/documents                 # Full docs access
https://www.googleapis.com/auth/documents.readonly        # Docs read-only
```

### Google Slides (2 scopes)
```
https://www.googleapis.com/auth/presentations             # Full slides access
https://www.googleapis.com/auth/presentations.readonly    # Slides read-only
```

### Gmail (3 scopes) - Bonus for email integration
```
https://www.googleapis.com/auth/gmail.send               # Send emails
https://www.googleapis.com/auth/gmail.readonly           # Read emails
https://www.googleapis.com/auth/gmail.modify             # Modify emails
```

### User Info (2 scopes) - For user identification
```
https://www.googleapis.com/auth/userinfo.email          # Get user email
https://www.googleapis.com/auth/userinfo.profile        # Get user profile
```

## 🎯 MINIMUM REQUIRED FOR ZANTARA (15 scopes)

If you want the absolute minimum, use these:
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/spreadsheets.readonly
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/documents.readonly
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/presentations.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

## ⚠️ IMPORTANT NOTES

1. **More scopes = More permissions**: Adding all scopes gives maximum flexibility
2. **Security consideration**: Only add scopes you actually need
3. **Gmail scopes**: Optional but useful for email notifications
4. **User info scopes**: Help identify which user is being impersonated
5. **Drive scripts**: Only needed if working with Google Apps Script

## 🔧 HOW TO UPDATE IN GOOGLE ADMIN

1. Go to: https://admin.google.com/ac/owl/domainwidedelegation
2. Find the existing entry for Client ID: `102437745575570448134`
3. Click "Edit" (pencil icon)
4. Replace the scopes with the complete list above
5. Click "Authorize"

## ✅ VERIFICATION

After updating, these should work:
- ✅ All Drive operations (list, search, read, upload)
- ✅ All Calendar operations (list, create, get)
- ✅ All Sheets operations (create, read, append)
- ✅ All Docs operations (create, read, update)
- ✅ All Slides operations (create, read, update)
- ✅ Gmail send (if needed)
- ✅ User identification

Generated: 2025-09-25
Service Account: zantara@involuted-box-469105-r0.iam.gserviceaccount.com