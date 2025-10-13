# 📋 CHATGPT CONFIGURATION GUIDE

## ✅ Status: CONNECTED
- API URL: https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app
- OpenAPI: Configured with full schema
- Authentication: API Key configured

## 🔧 Current Limitations

### Drive Upload Issue
ChatGPT cannot upload files directly because:
1. Cannot convert images/files to Base64
2. Cannot send multipart/form-data
3. API expects Base64 encoded content in `media.body`

### Solution Options

#### Option 1: Text-Only Files (Working Now)
```json
{
  "key": "drive.upload",
  "params": {
    "fileName": "test.txt",
    "mimeType": "text/plain",
    "media": {
      "body": "SGVsbG8gV29ybGQ="  // Base64 of "Hello World"
    },
    "parents": ["1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr"],
    "supportsAllDrives": true
  }
}
```

#### Option 2: Pre-Upload to Temporary Storage
1. User uploads file to temporary endpoint
2. Get file ID
3. ChatGPT calls drive.upload with file ID

#### Option 3: Direct URL Upload
ChatGPT provides URL, API downloads and uploads to Drive

## ✅ Working Handlers

### Business
- `contact.info` - Get Bali Zero contact details
- `lead.save` - Save new leads
- `quote.generate` - Generate service quotes
- `identity.resolve` - Resolve user identity

### AI Chat
- `ai.chat` - Auto-select best model
- `openai.chat` - OpenAI GPT
- `claude.chat` - Anthropic Claude
- `gemini.chat` - Google Gemini
- `cohere.chat` - Cohere

### Google Workspace (with OAuth2)
- `drive.list` - List files
- `drive.search` - Search files
- `calendar.list` - List events
- `calendar.create` - Create events
- `sheets.create` - Create spreadsheets
- `docs.create` - Create documents

### Memory System
- `memory.save` - Save data
- `memory.search` - Search memories
- `memory.retrieve` - Get specific memory

## 🔑 API Configuration

### In ChatGPT Custom GPT Settings:

1. **Actions** → Import OpenAPI schema
2. **Authentication**:
   - Type: API Key
   - Header: `x-api-key`
   - Value: `zantara-internal-dev-key-2025`

## 📝 Example Commands for ChatGPT

### Save a Lead
"Save a lead for John Doe, email john@example.com, needs visa help"

### Get Contact Info
"Get Bali Zero contact information"

### Create Calendar Event
"Create a meeting tomorrow at 10am called 'Team Sync'"

### Search Drive
"Search for documents containing 'visa'"

### AI Chat
"Ask the AI about visa requirements for US citizens"

## 🚨 Important Notes

1. **File Uploads**: Currently limited to text content only
2. **OAuth2**: Configured with zero@balizero.com impersonation
3. **Rate Limits**: 100 requests per minute
4. **Error Handling**: ChatGPT will show error messages from API

## 🔧 Troubleshooting

### "Login Required" Error
- Service account needs access to resource
- Check IMPERSONATE_USER environment variable

### "Handler not found" Error
- Check handler name in enum list
- Some handlers may be bridge-only

### "Invalid params" Error
- Check parameter structure for specific handler
- Use {} for handlers with no params

## 📊 Monitoring

- Health: `/health` endpoint
- Metrics: `/metrics` endpoint
- Logs: Cloud Run console

## 🚀 Next Steps

1. Test all handlers systematically
2. Add multipart upload support for real files
3. Implement streaming for AI responses
4. Add more Google Workspace handlers