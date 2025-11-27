# 🚀 ZANTARA v5.3 (Ultra Hybrid) - Deployment Guide

## Overview

Zantara v5.3 introduces the Ultra Hybrid architecture combining:
- **Qdrant Vector Database** (Semantic Search)
- **Google Drive Integration** (Document Repository)
- **Google Gemini 1.5 Flash** (Reasoning Engine)
- **User Localization System** (Multi-language responses)

## 🌐 Language Protocol

- **Source Code & Logs**: English (Standard)
- **Knowledge Base**: Bahasa Indonesia (Indonesian Laws)
- **WebApp UI**: English
- **AI Responses**: User's preferred language (from `meta_json.language`)

## 📋 Prerequisites

### Environment Variables Required

```bash
# Google Cloud Integration
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project",...}'

# OpenAI (for Embeddings)
OPENAI_API_KEY=sk-proj-your-openai-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zantara_v5_3

# Optional Services
REDIS_URL=redis://localhost:6379
LOG_LEVEL=INFO
```

### Google Service Account Setup

1. Create a Google Cloud Project
2. Enable APIs:
   - Google Drive API
   - Google Cloud Storage API
   - Generative Language API

3. Create Service Account:
```bash
# Create service account
gcloud iam service-accounts create zantara-service --display-name="Zantara Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:zantara-service@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/drive.reader"

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:zantara-service@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"

# Download key
gcloud iam service-accounts keys create ~/zantara-key.json \
    --iam-account=zantara-service@PROJECT_ID.iam.gserviceaccount.com
```

4. Share Google Drive folders with the service account email

## 🔧 Installation Steps

### 1. Database Migration

```bash
# Run migration v5.3
psql $DATABASE_URL -f backend/db/migrations/008_v5_3_ultra_hybrid.sql

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

### 2. Python Environment

```bash
# Install dependencies
pip install -r requirements.txt

# Verify Google Cloud packages
python -c "import google.generativeai; import googleapiclient; print('✅ Google packages OK')"
```

### 3. Configuration Setup

Create `.env` file:
```bash
cat > .env << EOF
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_CREDENTIALS_JSON='$(cat ~/zantara-key.json)'
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://user:password@localhost:5432/zantara_v5_3
EOF
```

### 4. Testing Integration

```bash
# Test Google Drive
python -c "
from backend.app.routers.oracle_universal_v5_3 import test_drive_connection
import asyncio
result = asyncio.run(test_drive_connection())
print(result)
"

# Test Gemini
python -c "
import google.generativeai as genai
genai.configure(api_key='your-api-key')
model = genai.GenerativeModel('gemini-1.5-flash')
response = model.generate_content('Hello')
print(response.text)
"
```

## 🚀 Deployment

### Fly.io Deployment

```bash
# Set secrets
fly secrets set GOOGLE_API_KEY=your_gemini_key -a zantara-rag
fly secrets set GOOGLE_CREDENTIALS_JSON="$(cat ~/zantara-key.json | jq -c .)" -a zantara-rag
fly secrets set OPENAI_API_KEY=your_openai_key -a zantara-rag

# Deploy
cd apps/backend-rag
fly deploy -c fly.toml

# Verify deployment
curl https://zantara-rag.fly.dev/api/oracle/v5.3/health
```

### Docker Deployment

```bash
# Build image
docker build -t zantara-v5.3 .

# Run with environment
docker run -d \
  --name zantara-v5.3 \
  -p 8000:8000 \
  -e GOOGLE_API_KEY=$GOOGLE_API_KEY \
  -e GOOGLE_CREDENTIALS_JSON="$GOOGLE_CREDENTIALS_JSON" \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e DATABASE_URL=$DATABASE_URL \
  zantara-v5.3
```

## 🔍 API Endpoints

### Core Oracle Endpoints

```bash
# Text Query (Hybrid RAG)
curl -X POST https://your-domain.com/api/oracle/v5.3/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the requirements for PT PMA establishment?",
    "user_id": "zainal.ceo@zantara.com",
    "use_ai": true,
    "include_sources": true
  }'

# Audio Query (Multimodal)
curl -X POST https://your-domain.com/api/oracle/v5.3/query/audio \
  -F "audio_file=@meeting.mp3" \
  -F "user_id=antonello.admin@zantara.com" \
  -F "language=it"

# User Feedback
curl -X POST https://your-domain.com/api/oracle/v5.3/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "abc123",
    "user_id": "user@example.com",
    "feedback_type": "factual_error",
    "rating": 3,
    "user_correction": "The correct information is..."
  }'
```

### Utility Endpoints

```bash
# Health Check
curl https://your-domain.com/api/oracle/v5.3/health

# User Profile
curl https://your-domain.com/api/oracle/v5.3/user/profile/zainal.ceo@zantara.com

# Test Google Drive
curl https://your-domain.com/api/oracle/v5.3/drive/test

# Test Gemini
curl https://your-domain.com/api/oracle/v5.3/gemini/test
```

## 👥 User Configuration

### Language Mapping

The system supports these languages for user responses:
- `en` - English
- `id` - Bahasa Indonesia
- `it` - Italiano
- `es` - Español
- `fr` - Français
- `de` - Deutsch
- `ja` - Japanese
- `zh` - Chinese

### User Profiles Examples

```sql
-- Indonesian CEO (Formal)
UPDATE users SET
  language_preference = 'id',
  meta_json = '{
    "language": "id",
    "tone": "formal",
    "complexity": "high",
    "notes": "CEO responds in formal Bahasa Indonesia"
  }'
WHERE email = 'zainal.ceo@zantara.com';

-- Italian Admin (Direct)
UPDATE users SET
  language_preference = 'it',
  meta_json = '{
    "language": "it",
    "tone": "direct",
    "complexity": "high",
    "notes": "Admin prefers direct Italian responses"
  }'
WHERE email = 'antonello.admin@zantara.com';
```

## 🔧 Configuration Options

### Response Formats

- `structured` - Professional corporate format with bullet points
- `conversational` - Natural dialogue style

### Complexity Levels

- `low` - Simple explanations, step-by-step
- `medium` - Balanced detail and clarity
- `high` - Technical, comprehensive analysis

### Tone Options

- `professional` - Standard corporate advisory
- `formal` - Executive level communication
- `direct` - No-nonsense, straight to facts
- `friendly` - Approachable and encouraging

## 📊 Monitoring

### Health Check Response

```json
{
  "service": "Zantara Oracle v5.3 (Ultra Hybrid)",
  "status": "operational",
  "timestamp": "2024-01-15T10:30:00Z",
  "components": {
    "gemini_ai": "✅ Operational",
    "google_drive": "✅ Operational",
    "qdrant_search": "✅ Operational",
    "embeddings": "✅ Operational"
  },
  "capabilities": [
    "Hybrid RAG (Qdrant + Drive + Gemini)",
    "User Localization",
    "Multimodal Audio Processing",
    "Smart Oracle PDF Analysis",
    "Continuous Learning (Feedback)"
  ]
}
```

### Performance Metrics

Track these metrics:
- Query response times
- Document retrieval accuracy
- User satisfaction ratings
- Language detection accuracy
- Audio processing success rate

## 🐛 Troubleshooting

### Common Issues

1. **Google Drive Connection Failed**
   - Verify service account permissions
   - Check `GOOGLE_CREDENTIALS_JSON` format
   - Ensure Drive folders are shared

2. **Gemini API Errors**
   - Verify `GOOGLE_API_KEY` is valid
   - Check API quota limits
   - Ensure Generative Language API is enabled

3. **Embedding Generation Failed**
   - Verify `OPENAI_API_KEY`
   - Check OpenAI API limits
   - Ensure text is not empty

4. **User Localization Not Working**
   - Verify user profile exists in database
   - Check `meta_json.language` field
   - Test with different user IDs

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python -m uvicorn backend.main:app --reload --log-level debug
```

## 🔒 Security Considerations

### API Keys
- Store in secure environment variables
- Rotate keys regularly
- Monitor usage quotas
- Use service accounts, not personal keys

### File Uploads
- Validate file types and sizes
- Scan for malware
- Use temporary storage with cleanup
- Limit upload frequency per user

### User Data
- Encrypt sensitive user preferences
- Implement rate limiting
- Audit access logs
- Comply with data protection regulations

## 📈 Scaling

### Horizontal Scaling
- Load balancer configuration
- Database connection pooling
- Redis session storage
- Container orchestration

### Performance Optimization
- Document caching strategies
- Embedding pre-computation
- Response time monitoring
- Resource utilization tracking

---

**Version**: v5.3.0
**Last Updated**: 2024-01-15
**Support**: Contact development team for deployment assistance
