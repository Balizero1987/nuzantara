# 🌐 API Client Examples

**How to call NUZANTARA APIs from external applications**

---

## 🎯 API Endpoints

**Production URLs:**
- **TS Backend**: `https://ts-backend-production-568d.up.railway.app`
- **RAG Backend**: `https://scintillating-kindness-production-47e3.up.railway.app`
- **Frontend**: `https://zantara.balizero.com`

---

## 🔐 Authentication

### Get JWT Token

```bash
# Login endpoint
curl -X POST https://ts-backend-production-568d.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your_password"
  }'

# Response:
# {
#   "ok": true,
#   "token": "eyJhbGciOiJSUzI1NiIs...",
#   "user": {
#     "uid": "user_123",
#     "email": "your@email.com",
#     "role": "member"
#   }
# }
```

### Use Token in Requests

```bash
# Add Authorization header
curl -X POST https://ts-backend.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"key": "...", "params": {...}}'
```

---

## 💬 Chat with ZANTARA

### Basic Chat

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali-zero.chat",
    "params": {
      "query": "What documents do I need for a KITAS?"
    }
  }'

# Response:
# {
#   "ok": true,
#   "data": {
#     "response": "For a KITAS application, you'll need...",
#     "model_used": "claude-haiku-4.5",
#     "sources": [...],
#     "usage": {
#       "input_tokens": 2500,
#       "output_tokens": 450
#     }
#   }
# }
```

### Chat with History

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali-zero.chat",
    "params": {
      "query": "And how long does that take?",
      "conversation_history": [
        {
          "role": "user",
          "content": "What documents do I need for a KITAS?"
        },
        {
          "role": "assistant",
          "content": "For a KITAS application, you will need..."
        }
      ]
    }
  }'
```

---

## 🔍 RAG Search

### Semantic Search

```bash
curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tax obligations for PT PMA",
    "user_id": "user_123",
    "top_k": 5
  }'

# Response:
# {
#   "success": true,
#   "results": [
#     {
#       "content": "PT PMA companies must...",
#       "metadata": {
#         "source": "tax_guide_2024.pdf",
#         "page": 12
#       },
#       "similarity": 0.92
#     },
#     ...
#   ],
#   "count": 5
# }
```

---

## 📊 Business Operations

### Get Pricing

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali-zero.pricing.get",
    "params": {
      "service_type": "kitas"
    }
  }'

# Response:
# {
#   "ok": true,
#   "data": {
#     "service": "KITAS",
#     "price_idr": 15000000,
#     "duration_days": 90,
#     "includes": ["Document verification", "Application submission", ...]
#   }
# }
```

### KBLI Lookup

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bali-zero.kbli.lookup",
    "params": {
      "query": "software development"
    }
  }'

# Response:
# {
#   "ok": true,
#   "data": {
#     "code": "62010",
#     "title": "Pemrograman Komputer",
#     "risk": "low",
#     "requirements": ["NIB", "OSS", "NPWP"]
#   }
# }
```

---

## 📧 Communication

### Send Email

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "communication.email.send",
    "params": {
      "to": "client@example.com",
      "subject": "KITAS Application Update",
      "body": "Your KITAS application has been submitted..."
    }
  }'
```

### Send WhatsApp

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "communication.whatsapp.send",
    "params": {
      "to": "+6285904369574",
      "message": "Your KITAS is ready for pickup!"
    }
  }'
```

---

## 💾 Memory Operations

### Save Memory

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "memory.user.memory.save",
    "params": {
      "user_id": "user_123",
      "key": "preferred_language",
      "value": "Italian",
      "metadata": {"source": "chat"}
    }
  }'
```

### Retrieve Memory

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "memory.user.memory.retrieve",
    "params": {
      "user_id": "user_123",
      "key": "preferred_language"
    }
  }'

# Response:
# {
#   "ok": true,
#   "data": {
#     "user_id": "user_123",
#     "key": "preferred_language",
#     "value": "Italian",
#     "metadata": {"source": "chat"}
#   }
# }
```

---

## 📈 Analytics

### Team Performance

```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "key": "analytics.team.performance",
    "params": {
      "period": "week"
    }
  }'
```

---

## 🐍 Python Client

```python
import requests
import json

class NuzantaraClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key

    def call(self, handler_key, params):
        """Call a handler"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        response = requests.post(
            f"{self.base_url}/call",
            headers=headers,
            json={"key": handler_key, "params": params}
        )
        return response.json()

    def chat(self, query, history=None):
        """Chat with ZANTARA"""
        return self.call("bali-zero.chat", {
            "query": query,
            "conversation_history": history or []
        })

    def search(self, query, top_k=5):
        """RAG search"""
        response = requests.post(
            f"{self.base_url}/search",
            json={"query": query, "top_k": top_k}
        )
        return response.json()

# Usage
client = NuzantaraClient("https://ts-backend-production-568d.up.railway.app")

# Chat
response = client.chat("What documents for KITAS?")
print(response["data"]["response"])

# Search
results = client.search("Tax obligations PT PMA")
for result in results["results"]:
    print(result["content"][:100])
```

---

## 🟢 Node.js Client

```javascript
const axios = require('axios');

class NuzantaraClient {
  constructor(baseUrl, apiKey = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async call(handlerKey, params) {
    const headers = {'Content-Type': 'application/json'};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await axios.post(`${this.baseUrl}/call`, {
      key: handlerKey,
      params
    }, { headers });

    return response.data;
  }

  async chat(query, history = []) {
    return this.call('bali-zero.chat', {
      query,
      conversation_history: history
    });
  }

  async search(query, topK = 5) {
    const response = await axios.post(`${this.baseUrl}/search`, {
      query,
      top_k: topK
    });
    return response.data;
  }
}

// Usage
const client = new NuzantaraClient('https://ts-backend-production-568d.up.railway.app');

// Chat
const response = await client.chat('What documents for KITAS?');
console.log(response.data.response);

// Search
const results = await client.search('Tax obligations PT PMA');
results.results.forEach(r => console.log(r.content.substring(0, 100)));
```

---

## 🔗 Related Documentation

- **API Reference**: [API Documentation](../api/API_DOCUMENTATION.md)
- **Handler Guide**: [Handler Integration](./HANDLER_INTEGRATION.md)
- **Architecture**: [System Overview](../galaxy-map/01-system-overview.md)

---

**Start integrating with NUZANTARA!** 🚀
