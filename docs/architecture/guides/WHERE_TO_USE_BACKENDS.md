# 🎯 DOVE USARE I BACKEND ZANTARA

**Status**: ✅ Entrambi i backend OPERATIVI
**Date**: 2025-09-30

---

## 📍 BACKEND LOCATIONS & PORTS

| Backend | Port | URL | Status |
|---------|------|-----|--------|
| **TypeScript (ZANTARA v5.2.0)** | 8080 | http://localhost:8080 | ✅ Running |
| **Python RAG** | 8000 | http://localhost:8000 | ✅ Running |

---

## 🎯 DOVE PUOI USARLI

### **1. API Diretta (curl/Postman/Insomnia)**

**Backend TypeScript** (port 8080):
```bash
# Health check
curl http://localhost:8080/health

# AI Chat
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "ai.chat", "params": {"prompt": "Hello!"}}'

# Team info
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "team.list", "params": {}}'

# Contact info
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "contact.info", "params": {}}'
```

**Backend Python RAG** (port 8000):
```bash
# Service info
curl http://localhost:8000/

# Search (semantic search in 214 books)
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Sunda Wiwitan?",
    "level": 3,
    "limit": 5
  }'

# API Docs (Swagger UI)
open http://localhost:8000/docs
```

---

### **2. Web App Frontend**

**Web app esistente** (già configurata):
- Location: `/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara_webapp/`
- Files:
  - `chat.html` - Chat interface
  - `test-api.html` - Test console
  - `zantara-intelligence-v6.html` - ZANTARA Intelligence UI

**Come usare**:
```bash
# Opzione 1: Apri direttamente (se usa CDN)
open "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara_webapp/chat.html"

# Opzione 2: Serve con HTTP server
cd "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/zantara_webapp"
python3 -m http.server 3000
# Then open: http://localhost:3000/chat.html
```

**Configurazione API keys nella webapp**:
- Già configurate per `http://localhost:8080` (TypeScript backend)
- API key: `zantara-internal-dev-key-2025`

---

### **3. GitHub Pages (Web Pubblico)**

**URL Live**: https://balizero1987.github.io

**Files deployed**:
- Chat interface
- Test console
- ZANTARA Intelligence

**Nota**: GitHub Pages punta al backend Cloud Run (production), NON al tuo localhost.

**Per testare local con GitHub Pages frontend**:
Devi fare port forwarding o usare ngrok:
```bash
# Install ngrok
brew install ngrok

# Expose localhost:8080
ngrok http 8080

# Update frontend URL to ngrok URL
```

---

### **4. Postman/Insomnia Collection**

**Importa collection**:
```bash
# Location (se esiste)
ls "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/postman/"
ls "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/*.postman.json"
```

**Endpoints TypeScript** (132 handlers disponibili):

**AI & Chat**:
- `ai.chat` - Chat with OpenAI/Claude/Gemini/Cohere
- `ai.analyze` - Analyze text
- `ai.translate` - Translate text

**Visa & Immigration**:
- `visa.check_requirements` - Check visa requirements
- `visa.calculate_timeline` - Calculate processing time
- `kitas.get_process_info` - KITAS info
- `kitas.calculate_cost` - KITAS cost

**Business & Legal**:
- `legal.pt_pma_setup_info` - PT PMA setup
- `legal.compliance_check` - Legal compliance
- `tax.calculate_pph` - Income tax
- `tax.calculate_ppn` - VAT

**Team & Contact**:
- `team.list` - List team members (6 members)
- `team.get` - Get team member by email
- `contact.info` - Company contact info

**Google Workspace**:
- `drive.list` - List Drive files
- `sheets.read` - Read Google Sheets
- `docs.create` - Create Google Doc
- `gmail.send` - Send email
- `calendar.list` - List calendar events

**Memory**:
- `memory.save` - Save to memory
- `memory.get` - Get from memory

**ZANTARA Collaborative Intelligence** (10 handlers):
- `zantara.personality.profile`
- `zantara.attune`
- `zantara.synergy.map`
- `zantara.dashboard.overview`
- `zantara.communication.adapt`
- `zantara.conflict.mediate`
- `zantara.growth.track`
- `zantara.celebration.orchestrate`

---

### **5. Custom Code (Node.js/Python/JavaScript)**

**Node.js Example**:
```javascript
// fetch API
const response = await fetch('http://localhost:8080/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'zantara-internal-dev-key-2025'
  },
  body: JSON.stringify({
    key: 'ai.chat',
    params: {
      prompt: 'What are KITAS requirements?'
    }
  })
});

const data = await response.json();
console.log(data.data.response);
```

**Python Example**:
```python
import requests

response = requests.post(
    'http://localhost:8080/call',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': 'zantara-internal-dev-key-2025'
    },
    json={
        'key': 'ai.chat',
        'params': {
            'prompt': 'What are KITAS requirements?'
        }
    }
)

print(response.json()['data']['response'])
```

**Browser JavaScript**:
```javascript
// In browser console or script
fetch('http://localhost:8080/call', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'zantara-internal-dev-key-2025'
  },
  body: JSON.stringify({
    key: 'team.list',
    params: {}
  })
})
.then(r => r.json())
.then(data => console.log(data.data));
```

---

### **6. Mobile App (React Native/Flutter)**

**Endpoint**: Same as above
**URL**: `http://localhost:8080` (development) or Cloud Run URL (production)

**React Native Example**:
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:8080';
const API_KEY = 'zantara-internal-dev-key-2025';

const callZantara = async (handler, params) => {
  const response = await axios.post(`${API_URL}/call`, {
    key: handler,
    params: params
  }, {
    headers: {
      'x-api-key': API_KEY
    }
  });

  return response.data.data;
};

// Usage
const teamInfo = await callZantara('team.list', {});
const aiResponse = await callZantara('ai.chat', {
  prompt: 'Hello!'
});
```

---

### **7. Integrations**

**Custom GPT (ChatGPT)**:
- Schema: Already configured in production
- URL: Point to Cloud Run URL
- Auth: API key in headers

**Zapier/Make.com**:
- Webhook URL: `http://localhost:8080/call` (or Cloud Run URL)
- Method: POST
- Headers: `x-api-key: zantara-internal-dev-key-2025`
- Body: `{"key": "handler.name", "params": {...}}`

**Slack Bot**:
```javascript
// Slack slash command → ZANTARA
app.command('/zantara', async ({ command, ack, say }) => {
  await ack();

  const response = await fetch('http://localhost:8080/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'zantara-internal-dev-key-2025'
    },
    body: JSON.stringify({
      key: 'ai.chat',
      params: { prompt: command.text }
    })
  });

  const data = await response.json();
  await say(data.data.response);
});
```

**Discord Bot**:
```javascript
client.on('messageCreate', async message => {
  if (message.content.startsWith('!zantara')) {
    const prompt = message.content.slice(9);

    const response = await fetch('http://localhost:8080/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'zantara-internal-dev-key-2025'
      },
      body: JSON.stringify({
        key: 'ai.chat',
        params: { prompt }
      })
    });

    const data = await response.json();
    message.reply(data.data.response);
  }
});
```

---

## 📊 QUICK REFERENCE ENDPOINTS

### TypeScript Backend (port 8080)

**Base URL**: `http://localhost:8080`

**Authentication**: Header `x-api-key: zantara-internal-dev-key-2025`

**Main Endpoints**:
- `GET /health` - Health check
- `POST /call` - Universal handler endpoint
  ```json
  {
    "key": "handler.name",
    "params": {}
  }
  ```

**Popular Handlers**:
| Handler | Description | Example Params |
|---------|-------------|----------------|
| `ai.chat` | AI chat | `{"prompt": "Hello"}` |
| `team.list` | List team | `{}` |
| `contact.info` | Contact info | `{}` |
| `visa.check_requirements` | Visa requirements | `{"nationality": "Italian"}` |
| `memory.save` | Save memory | `{"key": "...", "value": "..."}` |

---

### Python RAG Backend (port 8000)

**Base URL**: `http://localhost:8000`

**No authentication** (local)

**Main Endpoints**:
- `GET /` - Service info
- `GET /health` - Health check
- `POST /search` - Semantic search
  ```json
  {
    "query": "What is...",
    "level": 3,
    "limit": 5
  }
  ```
- `POST /ingest` - Ingest documents
- `GET /docs` - Swagger UI (API documentation)

---

## 🎓 ESEMPI PRATICI

### Esempio 1: Chat con ZANTARA
```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai.chat",
    "params": {
      "prompt": "What are the requirements for KITAS work permit in Bali?"
    }
  }' | jq '.data.response'
```

### Esempio 2: Get Team Info
```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "team.list",
    "params": {}
  }' | jq '.data'
```

### Esempio 3: Semantic Search (RAG)
```bash
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Sundanese tradition and Kujang symbol",
    "level": 3,
    "limit": 5
  }' | jq
```

### Esempio 4: Save Memory
```bash
curl -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "memory.save",
    "params": {
      "userId": "user123",
      "key": "preference",
      "value": "Italian language"
    }
  }' | jq
```

---

## 🔧 TESTING TOOLS

### Browser Extensions
- **Postman** - API testing
- **Insomnia** - API testing
- **Thunder Client** (VS Code) - In-editor testing

### Command Line
- **curl** - Simple HTTP requests
- **httpie** - Human-friendly HTTP client
  ```bash
  brew install httpie
  http POST localhost:8080/call \
    x-api-key:zantara-internal-dev-key-2025 \
    key=ai.chat params:='{"prompt":"Hello"}'
  ```

### Web Interface
- **Swagger UI** - http://localhost:8000/docs (Python RAG only)
- **Test Console** - `zantara_webapp/test-api.html`

---

## 📚 FULL HANDLER LIST (132 Total)

Run this to see all:
```bash
# Get all handlers (if endpoint exists)
curl http://localhost:8080/handlers

# Or check source code
cat "/Users/antonellosiano/Desktop/zantara-bridge chatgpt patch/src/core/handler_mapping.ts"
```

---

## 🎯 NEXT STEPS

**Per usare subito**:
1. ✅ Entrambi backend già running
2. ✅ Usa esempi sopra con curl/Postman
3. ✅ Apri Swagger UI: http://localhost:8000/docs
4. ✅ Testa web app: Open `zantara_webapp/chat.html`

**Per development**:
- Script creato: `QUICK_API_EXAMPLES.sh`
- Logs: `tail -f /tmp/zantara_rag.log`
- Monitor: `lsof -i :8080 -i :8000`

---

**Status**: ✅ **READY TO USE NOW!** 🚀