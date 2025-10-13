# Zantara Bridge API Documentation

**Production URL:** `https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app`  
**Version:** 4.0.0  
**Status:** ✅ LIVE

## 🔐 Authentication

All endpoints are public but some operations require Google Service Account authentication configured on the server.

## 📋 Available Endpoints

### Core Endpoints

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "HEALTHY",
  "message": "Zantara Enhanced Bridge",
  "version": "4.0.0",
  "timestamp": "2025-09-21T17:08:06.951Z",
  "uptime": 246.896,
  "bridge": "initialized",
  "environment": "development"
}
```

#### Service Status
```http
GET /bridge/status
```
**Response:**
```json
{
  "ok": true,
  "service": "zantara-bridge",
  "timestamp": "2025-09-21T17:08:06.951Z",
  "version": "1.0.0"
}
```

### 🧠 Memory/Firestore Endpoints

#### Save Memory
```http
POST /memory/save
Content-Type: application/json

{
  "userId": "string",
  "profile_facts": ["array", "of", "facts"],
  "summary": "string",
  "tenant": "optional-string"
}
```
**Response:**
```json
{
  "ok": true
}
```

#### Get Memory
```http
GET /memory/get?userId={userId}
```
**Response:**
```json
{
  "ok": true,
  "profile_facts": ["array", "of", "facts"],
  "summary": "User summary",
  "counters": {},
  "updated_at": {
    "_seconds": 1758474569,
    "_nanoseconds": 389000000
  }
}
```

### 📊 Google Sheets Endpoints

#### Sheets Status
```http
GET /api/sheets/status
```
**Response:**
```json
{
  "ok": true,
  "service": "google-sheets",
  "status": "available",
  "timestamp": "2025-09-21T17:09:27.147Z",
  "capabilities": [
    "create_spreadsheet",
    "read_data",
    "append_data",
    "export_conversations"
  ]
}
```

#### Create Spreadsheet
```http
POST /api/sheets/create
Content-Type: application/json

{
  "title": "New Spreadsheet",
  "headers": ["Column1", "Column2", "Column3"]
}
```

#### Read Spreadsheet Data
```http
GET /api/sheets/read?spreadsheetId={id}&range={A1:C10}
```

#### Append Data
```http
POST /api/sheets/append
Content-Type: application/json

{
  "spreadsheetId": "sheet-id",
  "range": "Sheet1!A:C",
  "values": [
    ["Value1", "Value2", "Value3"],
    ["Value4", "Value5", "Value6"]
  ]
}
```

#### Export Conversations
```http
POST /api/sheets/export-conversations
Content-Type: application/json

{
  "title": "Conversation Export",
  "conversations": [
    {
      "timestamp": "2025-09-21T10:00:00Z",
      "user": "User message",
      "assistant": "Assistant response"
    }
  ]
}
```

### 📅 Google Calendar Endpoints

#### Calendar Status
```http
GET /api/calendar/status
```

#### Create Event
```http
POST /api/calendar/create-event
Content-Type: application/json

{
  "summary": "Meeting Title",
  "description": "Meeting description",
  "start": "2025-09-22T10:00:00Z",
  "end": "2025-09-22T11:00:00Z",
  "attendees": ["email1@example.com", "email2@example.com"]
}
```

#### List Events
```http
GET /api/calendar/events?timeMin={ISO8601}&timeMax={ISO8601}
```

### 📧 Gmail Endpoints

#### Gmail Status
```http
GET /api/gmail/status
```

#### Send Email
```http
POST /api/gmail/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content",
  "isHtml": false
}
```

#### List Messages
```http
GET /api/gmail/messages?maxResults=10&query=is:unread
```

### 📁 Google Drive Endpoints

#### Folder Access Test
```http
GET /api/folder-access/folder/test
```

#### List Files
```http
POST /call
Content-Type: application/json

{
  "key": "drive.listFiles",
  "params": {
    "limit": 10,
    "query": "mimeType='application/pdf'"
  }
}
```

### 🔧 Bridge Dispatch

#### Generic Dispatch
```http
POST /bridge/dispatch
Content-Type: application/json

{
  "handler": "handler.name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

## 🚀 Quick Start Examples

### 1. Check Service Health
```bash
curl https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app/health
```

### 2. Save User Memory
```bash
curl -X POST https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app/memory/save \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","profile_facts":["likes coffee"],"summary":"Regular customer"}'
```

### 3. Create Google Sheet
```bash
curl -X POST https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app/api/sheets/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Sales Report","headers":["Date","Product","Amount"]}'
```

### 4. Send Email
```bash
curl -X POST https://zantara-bridge-v2-prod-1064094238013.asia-southeast2.run.app/api/gmail/send \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Hello","body":"Test message"}'
```

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Endpoint or resource not found |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Bridge not initialized |

## 🔍 Monitoring

- **Health Check:** `/health` - Monitor service availability
- **Metrics:** Available via Google Cloud Console
- **Logs:** Available via Cloud Run logs

## 🛠 Troubleshooting

### Common Issues

1. **"Bridge not initialized"**
   - The service account key is missing or invalid
   - Check environment variables

2. **Calendar Auth Error**
   - Service account needs calendar scope
   - Check IAM permissions

3. **Firestore Errors**
   - Check project ID configuration
   - Verify Firestore database exists

## 📝 Notes

- All timestamps are in ISO 8601 format
- File uploads are limited to 1MB
- Rate limits apply based on Cloud Run configuration
- CORS is enabled for all origins

## 🔗 Related Documentation

- [Google Workspace APIs](https://developers.google.com/workspace)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)