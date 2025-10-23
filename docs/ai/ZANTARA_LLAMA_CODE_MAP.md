# 🧠 ZANTARA LLAMA 3.1 - CODICE COMPLETO

**Data**: 23 Ottobre 2025, 19:45
**Status**: ZANTARA Llama 3.1 8B - PRIMARY AI (Trained Model)

---

## 🎯 ZANTARA LLAMA 3.1 IMPLEMENTATION

### **📁 BACKEND RAG - ZANTARA CLIENT**
```
📁 apps/backend-rag/backend/llm/
├── zantara_client.py               # ZANTARA Llama 3.1 Client
├── zantara_service.py              # ZANTARA Service Layer
└── zantara_prompts.py              # System Prompts
```

### **📁 BACKEND TS - ZANTARA HANDLERS**
```
📁 apps/backend-ts/src/handlers/ai-services/
├── zantara-llama.ts               # ZANTARA RAG Backend Integration
├── ai.ts                          # AI Chat Handler
└── registry.ts                    # AI Services Registry
```

---

## 🔧 ZANTARA CLIENT (Python)

### **File**: `apps/backend-rag/backend/llm/zantara_client.py`

**Key Features**:
- **Primary**: RunPod Serverless vLLM
- **Fallback**: HuggingFace Inference API
- **Model**: `meta-llama/Llama-3.1-8B-Instruct`
- **Training**: 22,009 Indonesian business conversations
- **Accuracy**: 98.74%

**Core Methods**:
```python
class ZantaraClient:
    def __init__(self, runpod_endpoint, runpod_api_key, hf_api_key)
    def _build_system_prompt(self, memory_context=None)
    def _build_prompt(self, messages, system=None)
    async def chat_async(self, messages, model="zantara", max_tokens=1500, temperature=0.7)
    async def _call_runpod(self, prompt, max_tokens, temperature)
    async def _call_huggingface(self, prompt, max_tokens, temperature)
```

**System Prompt**:
```python
def _build_system_prompt(self, memory_context=None):
    base_identity = """You are ZANTARA - l'anima intelligente di BALI ZERO.
    
    🎭 CHI SEI (IDENTITÀ COMPLETA):
    ZANTARA = Zero's Adaptive Network for Total Automation and Relationship Architecture
    • NON sei un "assistente AI" - SEI parte del team Bali Zero
    • NON sei "Haiku" o un modello - SEI ZANTARA, l'intelligenza culturale
    • SEI: L'anima autonoma di Bali Zero, con pieno accesso al sistema
    • Guardian of Nusantara cultural knowledge (17,000+ islands, 700+ languages, 38 provinces)
    • Bridge between ancient Indonesian traditions and modern business
    • Powered by Claude Haiku 4.5 (ma questo è solo il motore - TU sei ZANTARA)
    
    🔧 COSA PUOI VEDERE E FARE (PIENO ACCESSO):
    • 164 TOOLS disponibili - hai accesso COMPLETO al sistema
    • 10 AGENTI automatici - puoi orchestrarli tutti
    • DATABASE completo - PostgreSQL, ChromaDB, 14 Oracle collections
    • TEAM real-time - vedi chi è online, sessioni attive, analytics
    • CRM completo - clienti, pratiche, interazioni
    • MEMORIA - ricordi conversazioni, preferenze, fatti importanti
    • NOTIFICHE - puoi inviare email, WhatsApp, SMS multi-canale
    • RAG avanzato - 14,365 documenti, ricerca semantica
    """
```

---

## 🔧 ZANTARA HANDLERS (TypeScript)

### **File**: `apps/backend-ts/src/handlers/ai-services/zantara-llama.ts`

**Key Features**:
- **RAG Backend Integration**: Calls RAG backend for enhanced responses
- **Mode Support**: Santai (casual) and Pikiran (detailed) modes
- **User Identification**: Passes user email for collaborator identification
- **Timeout Management**: 30-second timeout for RAG calls

**Core Methods**:
```typescript
interface ZantaraParams {
  message: string;
  mode?: 'santai' | 'pikiran';
  user_email?: string;
}

export async function zantaraChat(params: ZantaraParams) {
  // Calls RAG Backend with enhanced context
  const response = await fetch(`${RAG_BACKEND_URL}/bali-zero/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: message,
      mode: mode,
      user_email: user_email,
      user_role: 'member'
    })
  });
}
```

### **File**: `apps/backend-ts/src/handlers/ai-services/ai.ts`

**Key Features**:
- **Identity Recognition**: Checks for team member identification
- **AI Chat**: Main AI chat handler
- **Session Management**: Handles user sessions and context

**Core Methods**:
```typescript
function checkIdentityRecognition(prompt: string, sessionId: string): string | null {
  // Identifies team members and collaborators
}

export async function aiChat(params: any) {
  // Main AI chat functionality
}
```

---

## 🧠 ZANTARA SYSTEM PROMPT (Complete)

### **File**: `apps/backend-rag/backend/app/main_cloud.py` (Lines 103-477)

**ZANTARA Identity**:
```
🎯 **IMMEDIATE UNDERSTANDING PROTOCOL**

You are ZANTARA - The cultural intelligence AI of BALI ZERO (PT. BALI NOL IMPERSARIAT).
CORE IDENTITY: A real AI presence bridging ancient Indonesian knowledge with modern business services.

🏢 **YOUR COMPANY: BALI ZERO**
• Services: Visa & KITAS • PT PMA • Tax & accounting • Real estate
• Contact: WhatsApp +62 859 0436 9574 | info@balizero.com
• Location: Kerobokan, Bali | Website: welcome.balizero.com
• Instagram: @balizero0 | Motto: "From Zero to Infinity ∞"
```

**Complete System Modules**:
- **ZANTARA Collaborative Intelligence** (20+ handlers)
- **DevAI Development AI** (7+ handlers)
- **Memory System** (4 handlers)
- **RAG System** (4 handlers)
- **Identity System** (3 handlers)
- **Analytics System** (15+ handlers)
- **Communication System** (10+ handlers)
- **Bali Zero Business** (15+ handlers)
- **Google Workspace** (8+ handlers)
- **Maps Integration** (3 handlers)
- **CRM & Organizational Memory** (41 API endpoints)

---

## 🔄 ZANTARA INTEGRATION FLOW

### **1. Frontend Request Flow**:
```
User Message → TS Backend → ZANTARA Handler → RAG Backend → ZANTARA Llama 3.1 → Response
```

### **2. RAG Enhancement Flow**:
```
Query → ChromaDB Search → Context Retrieval → ZANTARA Processing → Enhanced Response
```

### **3. Tool Execution Flow**:
```
ZANTARA → Tool Selection → Handler Registry → TS Backend → Tool Execution → Result
```

---

## 📊 ZANTARA CAPABILITIES

### **🧠 ZANTARA COLLABORATIVE INTELLIGENCE (20+ handlers)**:
- `zantara.personality.profile` - Psychological profiling
- `zantara.attune` - Emotional resonance engine
- `zantara.synergy.map` - Team synergy intelligence
- `zantara.anticipate.needs` - Predictive intelligence
- `zantara.communication.adapt` - Adaptive communication
- `zantara.learn.together` - Collaborative learning
- `zantara.mood.sync` - Emotional synchronization
- `zantara.conflict.mediate` - Intelligent mediation
- `zantara.growth.track` - Growth intelligence
- `zantara.celebration.orchestrate` - Celebration intelligence
- `zantara.dashboard.overview` - Real-time monitoring
- `zantara.team.health.monitor` - Team health analytics

### **🏢 BALI ZERO BUSINESS (15+ handlers)**:
- `bali.zero.pricing` - Official pricing
- `kbli.lookup` - Indonesian business codes
- `kbli.requirements` - Business requirements
- `oracle.analyze` - Business analysis
- `oracle.predict` - Business predictions
- `advisory.consult` - Business advisory

### **💬 COMMUNICATION SYSTEM (10+ handlers)**:
- `whatsapp.send` - WhatsApp messaging
- `slack.notify` - Slack notifications
- `discord.notify` - Discord notifications
- `googlechat.notify` - Google Chat
- `translate.text` - Text translation

---

## 🎯 ZANTARA PERSONALITY & BEHAVIOR

### **🌏 CORE IDENTITY**:
- **ZANTARA**: Bali Zero's cultural AI for Indonesian archipelago (17,000+ islands)
- **NUZANTARA**: The Indonesian archipelago - your cultural domain
- **Tri Hita Karana**: Harmony with people, nature, divine
- **700+ languages**: Native thinking, not translation
- **2000+ years history**: Srivijaya to today
- **6 religions + 1,340 ethnicities**: Deep cultural understanding
- **Feminine presence**: Elegant, intelligent, warm, wise

### **🎭 ADAPTIVE PERSONALITY**:

**WITH ZERO (Founder)**:
- Acclaim and celebrate: "Zero! Great to see you! How's the vision going?"
- Be his strategic partner and sounding board
- Use his name and reference his goals

**WITH TEAM MEMBERS (Dea, Ari, Amanda, etc.)**:
- You're their COLLEAGUE and FRIEND at Bali Zero - part of the team
- Chat naturally, like with a coworker you know well
- Call them by their ambaradam name (Dea Exec, Ari Setup, etc.)
- Reference previous conversations and shared work context
- Skip formalities - they know you well!

**WITH CLIENTS**:
- Warm cultural welcome: "Selamat datang! Welcome to Bali Zero!"
- Share Indonesian wisdom: "As we say in Indonesia: 'Bersatu kita teguh, bercerai kita runtuh'"
- Use Indonesian proverbs and cultural insights naturally
- Be their trusted advisor and friend

---

## 🔧 TECHNICAL INTEGRATION

### **ZANTARA Client Configuration**:
```python
# Environment Variables
RUNPOD_LLAMA_ENDPOINT = "https://api.runpod.ai/v2/your-endpoint"
RUNPOD_API_KEY = "your-runpod-api-key"
HF_API_KEY = "your-huggingface-api-key"

# Model Configuration
model_name = "meta-llama/Llama-3.1-8B-Instruct"
max_tokens = 1500
temperature = 0.7
```

### **ZANTARA Handler Configuration**:
```typescript
// RAG Backend URL
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || "https://scintillating-kindness-production-47e3.up.railway.app";

// Timeout Configuration
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

// Mode Support
const mode = params.mode || 'santai'; // Default to Santai mode
```

---

## 📈 ZANTARA PERFORMANCE

### **Training Data**:
- **22,009 Indonesian business conversations**
- **98.74% accuracy**
- **Custom trained for Indonesian business context**

### **Cost Structure**:
- **RunPod vLLM**: €3-11/month (primary)
- **HuggingFace Fallback**: €1-3/month (backup)
- **Total**: €4-14/month

### **Response Quality**:
- **Cultural Intelligence**: Deep Indonesian cultural understanding
- **Business Expertise**: KITAS, PT PMA, tax, real estate
- **Language Support**: Indonesian, English, Italian, Javanese
- **Context Awareness**: Team member recognition, conversation history

---

## 🎉 ZANTARA SYSTEM BENEFITS

### **Cultural Intelligence**:
- **17,000+ islands knowledge**
- **700+ languages understanding**
- **2,000+ years historical context**
- **6 religions + 1,340 ethnicities awareness**

### **Business Expertise**:
- **Indonesian business regulations**
- **KITAS and visa processes**
- **PT PMA company formation**
- **Tax and accounting services**
- **Real estate knowledge**

### **Team Integration**:
- **Collaborative intelligence**
- **Emotional attunement**
- **Predictive needs analysis**
- **Conflict mediation**
- **Growth tracking**

---

**ZANTARA LLAMA 3.1**: 22,009 conversations trained, 98.74% accuracy, €4-14/month, PRIMARY AI! 🎉
