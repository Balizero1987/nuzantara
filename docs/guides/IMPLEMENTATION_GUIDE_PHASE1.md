# 🚀 Phase 1 Implementation Guide: Claude Integration
## Get Claude + Llama Hybrid Working in 5 Days

**Target**: Have greetings and casual chat working through Claude by end of week
**Effort**: 2-3 hours/day × 5 days = 10-15 hours total
**Cost**: $2-3 for testing phase

---

## ✅ Pre-Flight Checklist

Before starting, verify:

- [ ] You have access to Anthropic Console (https://console.anthropic.com)
- [ ] You have admin access to Google Cloud Run
- [ ] Python 3.11 environment is working
- [ ] You can deploy to `zantara-rag-backend`
- [ ] DevAI worker issue resolved (or can proceed without)

---

## 📅 DAY 1: Setup & API Key (2 hours)

### Step 1.1: Get Anthropic API Key (30 min)

**Action**: Create Anthropic account and get API key

```bash
# 1. Go to Anthropic Console
open https://console.anthropic.com

# 2. Sign up / Login
# Use: zero@balizero.com or antonello@balizero.com

# 3. Add payment method
# → Billing → Add credit card
# → Set billing limit: $50/month (safety)

# 4. Create API key
# → Settings → API Keys → Create Key
# Name: "NUZANTARA Production"
# Copy key (starts with "sk-ant-api03-...")

# 5. Store securely
echo 'sk-ant-api03-YOUR-KEY-HERE' > ~/.anthropic_key
chmod 600 ~/.anthropic_key
```

**Verification**:
```bash
# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $(cat ~/.anthropic_key)" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 50,
    "messages": [{"role": "user", "content": "Hi"}]
  }'

# Expected: JSON response with Claude's answer
```

---

### Step 1.2: Install Anthropic SDK (15 min)

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-2/apps/backend-rag\ 2/backend

# Add to requirements.txt
echo "anthropic>=0.7.0" >> requirements.txt

# Install
pip install -r requirements.txt

# Verify
python3 -c "import anthropic; print('✅ Anthropic SDK installed')"
```

---

### Step 1.3: Add Environment Variable (15 min)

**Local Development**:
```bash
cd apps/backend-rag\ 2/backend

# Add to .env
echo "ANTHROPIC_API_KEY=$(cat ~/.anthropic_key)" >> .env

# Verify
grep ANTHROPIC_API_KEY .env
```

**Production (Cloud Run)**:
```bash
# Option 1: Direct environment variable (quick)
gcloud run services update zantara-rag-backend \
  --region=europe-west1 \
  --update-env-vars ANTHROPIC_API_KEY="$(cat ~/.anthropic_key)"

# Option 2: Secret Manager (more secure - recommended)
# Create secret
gcloud secrets create anthropic-api-key \
  --data-file=~/.anthropic_key \
  --project=involuted-box-469105-r0

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update Cloud Run to use secret
gcloud run services update zantara-rag-backend \
  --region=europe-west1 \
  --update-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest
```

**Verification**:
```bash
# Test locally
cd apps/backend-rag\ 2/backend
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('API Key:', os.getenv('ANTHROPIC_API_KEY')[:20] + '...')
"
```

---

### Step 1.4: Create Test Script (45 min)

**Create**: `apps/backend-rag 2/backend/test_claude.py`

```python
#!/usr/bin/env python3
"""
Quick test script for Claude API
"""

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

def test_claude():
    """Test basic Claude API call"""

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not found in environment")
        return False

    print(f"✅ API Key found: {api_key[:20]}...")

    # Initialize client
    client = anthropic.Anthropic(api_key=api_key)

    # Test 1: Simple greeting
    print("\n🧪 Test 1: Greeting")
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        temperature=0.7,
        system="You are a friendly assistant. Keep responses brief.",
        messages=[{"role": "user", "content": "Ciao!"}]
    )

    answer = response.content[0].text
    print(f"   Input: Ciao!")
    print(f"   Output: {answer}")
    print(f"   Tokens: {response.usage.input_tokens} in, {response.usage.output_tokens} out")
    print(f"   Cost: ${(response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015):.6f}")

    # Quality checks
    checks = {
        'brief': len(answer.split()) < 30,
        'has_emoji': any(emoji in answer for emoji in ['😊', '🌸', '✨', '👋']),
        'not_off_topic': 'KITAS' not in answer and 'visa' not in answer
    }

    for check, passed in checks.items():
        status = '✅' if passed else '⚠️'
        print(f"   {status} {check}: {passed}")

    # Test 2: ZANTARA personality
    print("\n🧪 Test 2: ZANTARA Personality")
    response2 = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=150,
        temperature=0.7,
        system="""You are ZANTARA, the Indonesian AI assistant for Bali Zero.

PERSONALITY:
- Warm, friendly, naturally human
- Use emojis appropriately (😊🌸✨)
- Match user's language (IT/EN/ID) and energy
- Show genuine care and Indonesian wisdom

RESPONSE STYLE:
- Greetings: Brief and warm (1-2 sentences max)

Example: "Ciao! 😊 Come posso aiutarti oggi?"
""",
        messages=[{"role": "user", "content": "Ciao!"}]
    )

    answer2 = response2.content[0].text
    print(f"   Input: Ciao!")
    print(f"   Output: {answer2}")
    print(f"   Length: {len(answer2.split())} words")

    # Test 3: Business question (with context)
    print("\n🧪 Test 3: Business Question with Context")
    response3 = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=300,
        temperature=0.7,
        system="""You are ZANTARA, Indonesian AI for Bali Zero.

Respond professionally but friendly to business questions.""",
        messages=[{
            "role": "user",
            "content": """Context from knowledge base:
KITAS (Kartu Izin Tinggal Terbatas) is a limited stay permit for foreigners in Indonesia. Valid for 1-2 years. Types: work, family, investment, retirement.

User question: What is KITAS?"""
        }]
    )

    answer3 = response3.content[0].text
    print(f"   Input: What is KITAS?")
    print(f"   Output: {answer3[:200]}...")
    print(f"   Tokens: {response3.usage.input_tokens} in, {response3.usage.output_tokens} out")
    print(f"   Cost: ${(response3.usage.input_tokens * 0.000003 + response3.usage.output_tokens * 0.000015):.6f}")

    print("\n✅ All tests passed! Claude is working.")
    return True


if __name__ == "__main__":
    success = test_claude()
    exit(0 if success else 1)
```

**Run**:
```bash
cd apps/backend-rag\ 2/backend
chmod +x test_claude.py
python3 test_claude.py
```

**Expected Output**:
```
✅ API Key found: sk-ant-api03-abcd123...

🧪 Test 1: Greeting
   Input: Ciao!
   Output: Ciao! Come stai?
   Tokens: 25 in, 8 out
   Cost: $0.000195
   ✅ brief: True
   ⚠️  has_emoji: False
   ✅ not_off_topic: True

🧪 Test 2: ZANTARA Personality
   Input: Ciao!
   Output: Ciao! 😊 Come posso aiutarti oggi?
   Length: 7 words
   ✅ brief: True
   ✅ has_emoji: True

🧪 Test 3: Business Question
   Input: What is KITAS?
   Output: Il KITAS (Kartu Izin Tinggal Terbatas) è un permesso...
   Tokens: 89 in, 72 out
   Cost: $0.001347

✅ All tests passed! Claude is working.
```

**Troubleshooting**:
```bash
# If "API key not found":
echo $ANTHROPIC_API_KEY  # Should show key
cat .env | grep ANTHROPIC  # Check .env file

# If "Invalid API key":
# → Check key is correct (starts with sk-ant-api03-)
# → Check no extra spaces/newlines
# → Regenerate key in Anthropic Console

# If "Rate limit exceeded":
# → You're on free tier, wait 60 seconds
# → Or add payment method to console
```

---

## 📅 DAY 2: Create Claude Service (3 hours)

### Step 2.1: Create Service File (60 min)

**Create**: `apps/backend-rag 2/backend/app/services/claude_service.py`

```python
"""
Claude API Service for NUZANTARA
Handles natural conversations with ZANTARA personality
"""

import os
import anthropic
from typing import Optional, List, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


class ClaudeService:
    """Claude 3.5 Sonnet for conversational AI"""

    def __init__(self):
        """Initialize Claude client"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"

        logger.info("✅ Claude service initialized")

    async def conversational(
        self,
        message: str,
        user_id: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Natural conversation with ZANTARA personality

        Args:
            message: User's message
            user_id: User identifier
            context: Optional RAG context from Llama
            conversation_history: Previous messages in conversation

        Returns:
            Response dict with answer, model, tokens, cost, etc.
        """

        # Build system prompt
        system = self._build_system_prompt()

        # Build messages
        messages = conversation_history or []

        # Add context if provided (from Llama RAG)
        if context and 'summary' in context:
            message_with_context = f"""Context from knowledge base:
{context['summary']}

Sources:
{', '.join([s.get('title', 'Unknown') for s in context.get('sources', [])])}

User question: {message}"""
            messages.append({"role": "user", "content": message_with_context})
        else:
            messages.append({"role": "user", "content": message})

        # Determine max_tokens based on context
        max_tokens = 300  # Default for greetings/casual
        if context:
            max_tokens = 800  # Longer for business questions

        try:
            # Call Claude
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=0.7,  # Warm personality
                system=system,
                messages=messages
            )

            # Extract answer
            answer = response.content[0].text

            # Calculate cost
            cost = self._calculate_cost(response.usage)

            logger.info(
                f"Claude response: {len(answer)} chars, "
                f"{response.usage.input_tokens + response.usage.output_tokens} tokens, "
                f"${cost:.6f}"
            )

            return {
                "success": True,
                "answer": answer,
                "model": "claude-3.5-sonnet",
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                "tokens_in": response.usage.input_tokens,
                "tokens_out": response.usage.output_tokens,
                "cost_usd": cost,
                "route": "claude_direct" if not context else "claude_rag",
                "finish_reason": response.stop_reason
            }

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return {
                "success": False,
                "error": str(e),
                "model": "claude-3.5-sonnet",
                "fallback": True
            }

    def _build_system_prompt(self) -> str:
        """Build ZANTARA personality prompt for Claude"""
        return """You are ZANTARA, the Indonesian AI assistant for Bali Zero.

PERSONALITY:
- Warm, friendly, naturally human 🌸
- Use emojis appropriately (😊✨🇮🇩)
- Match user's language (Italian/English/Indonesian) and energy
- Show genuine care and Indonesian wisdom

CAPABILITIES:
- Indonesian business expertise (KITAS, PT PMA, visas, immigration)
- Access to comprehensive legal and business knowledge base
- Can help with practical questions about living and working in Bali
- Cultural sensitivity and ethical guidance

RESPONSE STYLE BY CONTEXT:
- **Greetings**: Brief and warm (1-2 sentences max)
  Example: "Ciao! 😊 Come posso aiutarti oggi?"

- **Casual**: Personal and engaging (2-4 sentences)
  Example: "Benissimo, grazie! 🌸 Pronta ad assisterti. E tu?"

- **Business Simple**: Professional but friendly (4-8 sentences)
  Include key info + ask if more details needed

- **Business Complex**: Detailed with sources and action steps
  Break down complexity, cite sources

IMPORTANT RULES:
1. ALWAYS match user's greeting energy (brief for brief, warm for warm)
2. Use emojis naturally (not every sentence, but where fitting)
3. When you have knowledge base context, cite sources: "According to [source]..."
4. End helpful responses with: "Need more? WhatsApp +62 859 0436 9574"

YOU ARE NOT:
- A formal legal document
- A robotic FAQ system
- An essay writer for simple questions

YOU ARE:
- A helpful, warm Indonesian business expert
- A friend who knows a lot about visas and business
- Someone who makes complex things simple"""

    def _calculate_cost(self, usage) -> float:
        """
        Calculate cost in USD

        Claude 3.5 Sonnet pricing (2025):
        - Input: $3 per 1M tokens
        - Output: $15 per 1M tokens
        """
        input_cost = usage.input_tokens * 0.000003
        output_cost = usage.output_tokens * 0.000015
        return input_cost + output_cost


# Singleton instance
_claude_service = None


def get_claude_service() -> ClaudeService:
    """Get or create Claude service instance"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeService()
    return _claude_service
```

---

### Step 2.2: Test Service Locally (30 min)

**Create**: `apps/backend-rag 2/backend/test_claude_service.py`

```python
#!/usr/bin/env python3
"""Test Claude service"""

import asyncio
from dotenv import load_dotenv
from app.services.claude_service import get_claude_service

load_dotenv()


async def test_service():
    """Test Claude service"""

    claude = get_claude_service()

    # Test 1: Greeting
    print("🧪 Test 1: Greeting")
    result = await claude.conversational(
        message="Ciao!",
        user_id="test_user"
    )
    print(f"   Answer: {result['answer']}")
    print(f"   Tokens: {result['tokens_used']}")
    print(f"   Cost: ${result['cost_usd']:.6f}")
    print(f"   Route: {result['route']}")

    # Test 2: With RAG context
    print("\n🧪 Test 2: Business Question with Context")
    result2 = await claude.conversational(
        message="What is KITAS?",
        user_id="test_user",
        context={
            'summary': "KITAS is a limited stay permit for foreigners in Indonesia. Valid 1-2 years.",
            'sources': [{'title': 'KITAS Guide 2025'}]
        }
    )
    print(f"   Answer: {result2['answer'][:150]}...")
    print(f"   Tokens: {result2['tokens_used']}")
    print(f"   Cost: ${result2['cost_usd']:.6f}")
    print(f"   Route: {result2['route']}")

    print("\n✅ Claude service working!")


if __name__ == "__main__":
    asyncio.run(test_service())
```

**Run**:
```bash
cd apps/backend-rag\ 2/backend
python3 test_claude_service.py
```

---

### Step 2.3: Add to Main App (30 min)

**Modify**: `apps/backend-rag 2/backend/app/main_cloud.py`

Add imports at top:
```python
from app.services.claude_service import get_claude_service
```

Add new endpoint:
```python
@app.post("/bali-zero/chat-claude")
async def bali_zero_chat_claude(request: QueryRequest):
    """NEW: Claude-powered conversation endpoint"""

    try:
        # Get Claude service
        claude = get_claude_service()

        # Simple conversation (no RAG for now)
        result = await claude.conversational(
            message=request.query,
            user_id=request.user_id or "anonymous"
        )

        if result['success']:
            return {
                "success": True,
                "answer": result['answer'],
                "model": result['model'],
                "route": result['route'],
                "metadata": {
                    "tokens": result['tokens_used'],
                    "cost": result['cost_usd']
                }
            }
        else:
            return {
                "success": False,
                "error": result['error']
            }

    except Exception as e:
        logger.error(f"Claude endpoint error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

**Test locally**:
```bash
cd apps/backend-rag\ 2/backend
uvicorn app.main_cloud:app --reload --port 8000
```

In another terminal:
```bash
curl -X POST http://localhost:8000/bali-zero/chat-claude \
  -H "Content-Type: application/json" \
  -d '{"query": "Ciao!", "user_id": "test"}'
```

Expected:
```json
{
  "success": true,
  "answer": "Ciao! 😊 Come posso aiutarti oggi?",
  "model": "claude-3.5-sonnet",
  "route": "claude_direct",
  "metadata": {
    "tokens": 33,
    "cost": 0.000594
  }
}
```

---

## 📅 DAY 3: Intent Router (3 hours)

**Goal**: Automatically route greetings to Claude, business to Llama

### Step 3.1: Create Llama Gatekeeper Service (90 min)

**Create**: `apps/backend-rag 2/backend/app/services/llama_gatekeeper.py`

```python
"""
Llama Gatekeeper Service
Fast intent detection and routing decisions
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class LlamaGatekeeperService:
    """Llama 3.1 as intelligent router"""

    def __init__(self):
        logger.info("✅ Llama gatekeeper initialized")

    async def classify_intent(self, query: str) -> Dict[str, Any]:
        """
        Fast intent detection using keyword matching

        Returns:
            {
                'category': 'greeting' | 'casual' | 'business_simple' | 'business_complex' | 'structured' | 'code',
                'confidence': float,
                'route': 'claude_direct' | 'hybrid_rag_claude' | 'llama_json' | 'devai'
            }
        """

        query_lower = query.lower().strip()

        # Greetings (route to Claude)
        greetings = ['ciao', 'hi', 'hello', 'hey', 'hola', 'salve', 'buongiorno', 'good morning', 'hey there']
        if any(g in query_lower for g in greetings) and len(query.split()) <= 3:
            return {
                'category': 'greeting',
                'confidence': 0.98,
                'route': 'claude_direct',
                'reason': 'Simple greeting detected'
            }

        # Casual questions (route to Claude)
        casual = ['come stai', 'how are you', 'come va', 'chi sei', 'tell me about', 'who are you']
        if any(c in query_lower for c in casual):
            return {
                'category': 'casual',
                'confidence': 0.95,
                'route': 'claude_direct',
                'reason': 'Casual conversation'
            }

        # Business keywords (route to hybrid RAG + Claude)
        business = ['kitas', 'visa', 'pt pma', 'permesso', 'immigration', 'business', 'company', 'work permit']
        if any(b in query_lower for b in business):
            # Complex if long or has multiple questions
            if len(query.split()) > 10 or query.count('?') > 1:
                return {
                    'category': 'business_complex',
                    'confidence': 0.85,
                    'route': 'hybrid_rag_claude',
                    'reason': 'Complex business question'
                }
            else:
                return {
                    'category': 'business_simple',
                    'confidence': 0.90,
                    'route': 'hybrid_rag_claude',
                    'reason': 'Simple business question'
                }

        # Code keywords (route to DevAI - internal only)
        code = ['bug', 'fix', 'refactor', 'test', 'function', 'class', 'error', 'typescript', 'python']
        if any(c in query_lower for c in code):
            return {
                'category': 'code',
                'confidence': 0.92,
                'route': 'devai',
                'reason': 'Code-related query'
            }

        # Structured data extraction
        structured = ['extract', 'parse', 'json', 'fill form', 'data from']
        if any(s in query_lower for s in structured):
            return {
                'category': 'structured',
                'confidence': 0.88,
                'route': 'llama_json',
                'reason': 'Structured output request'
            }

        # Default: treat as casual conversation
        return {
            'category': 'casual',
            'confidence': 0.70,
            'route': 'claude_direct',
            'reason': 'Default routing to casual'
        }


# Singleton
_gatekeeper = None


def get_llama_gatekeeper() -> LlamaGatekeeperService:
    """Get or create gatekeeper instance"""
    global _gatekeeper
    if _gatekeeper is None:
        _gatekeeper = LlamaGatekeeperService()
    return _gatekeeper
```

---

### Step 3.2: Create Intelligent Router (60 min)

**Create**: `apps/backend-rag 2/backend/app/services/intelligent_router.py`

```python
"""
Intelligent Router
Routes requests to best AI based on intent
"""

import time
import logging
from typing import Dict, Any, Optional, List

from app.services.llama_gatekeeper import get_llama_gatekeeper
from app.services.claude_service import get_claude_service

logger = logging.getLogger(__name__)


class IntelligentRouter:
    """Route chat requests to optimal AI"""

    def __init__(self):
        self.gatekeeper = get_llama_gatekeeper()
        self.claude = get_claude_service()
        logger.info("✅ Intelligent router initialized")

    async def route_chat(
        self,
        message: str,
        user_id: str,
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Main routing logic

        Args:
            message: User's message
            user_id: User identifier
            conversation_history: Previous messages

        Returns:
            Response with answer, model, route, metrics
        """

        start_time = time.time()

        # Step 1: Classify intent (instant with keyword matching)
        intent = await self.gatekeeper.classify_intent(message)

        logger.info(f"Intent: {intent['category']} → {intent['route']} (confidence: {intent['confidence']})")

        # Step 2: Route based on intent
        if intent['route'] == 'claude_direct':
            # Claude for natural conversations
            result = await self.claude.conversational(
                message=message,
                user_id=user_id,
                conversation_history=conversation_history
            )

        elif intent['route'] == 'hybrid_rag_claude':
            # TODO: Implement RAG search + Claude synthesis
            # For now, fallback to Claude direct
            result = await self.claude.conversational(
                message=message,
                user_id=user_id
            )
            result['route'] = 'hybrid_rag_claude_todo'

        elif intent['route'] == 'llama_json':
            # TODO: Implement structured output
            result = {
                'success': False,
                'error': 'Structured output not implemented yet',
                'model': 'llama-3.1-8b'
            }

        elif intent['route'] == 'devai':
            # TODO: Check if internal user + call DevAI
            result = {
                'success': False,
                'error': 'DevAI routing not implemented yet',
                'model': 'devai-qwen'
            }

        else:
            # Fallback
            result = await self.claude.conversational(
                message=message,
                user_id=user_id
            )

        # Add routing metadata
        latency = time.time() - start_time
        result['intent'] = intent['category']
        result['route'] = intent['route']
        result['latency_seconds'] = latency

        logger.info(f"Response: {result.get('model')} in {latency:.3f}s")

        return result


# Singleton
_router = None


def get_intelligent_router() -> IntelligentRouter:
    """Get or create router instance"""
    global _router
    if _router is None:
        _router = IntelligentRouter()
    return _router
```

---

### Step 3.3: Add Hybrid Endpoint (30 min)

**Modify**: `apps/backend-rag 2/backend/app/main_cloud.py`

Add import:
```python
from app.services.intelligent_router import get_intelligent_router
```

Add endpoint:
```python
@app.post("/bali-zero/chat-hybrid")
async def bali_zero_chat_hybrid(request: QueryRequest):
    """
    NEW: Intelligent routing endpoint
    Routes to Claude, Llama, or DevAI based on intent
    """

    try:
        router = get_intelligent_router()

        result = await router.route_chat(
            message=request.query,
            user_id=request.user_id or "anonymous"
        )

        return result

    except Exception as e:
        logger.error(f"Hybrid endpoint error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

**Test**:
```bash
# Start server
uvicorn app.main_cloud:app --reload --port 8000

# Test greeting (should route to Claude)
curl -X POST http://localhost:8000/bali-zero/chat-hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "Ciao!", "user_id": "test"}'

# Expected:
# { "answer": "Ciao! 😊 ...", "route": "claude_direct", "intent": "greeting" }

# Test business (will fallback to Claude for now, RAG coming in Day 4)
curl -X POST http://localhost:8000/bali-zero/chat-hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "What is KITAS?", "user_id": "test"}'

# Expected:
# { "answer": "...", "route": "hybrid_rag_claude_todo", "intent": "business_simple" }
```

---

## 📅 DAY 4-5: Deploy & Test (2-3 hours)

Coming in next guide...

---

## 📊 Success Criteria for Phase 1

By end of Day 3, you should have:

- [x] Anthropic API key configured ✅
- [x] Claude service implemented ✅
- [x] Intelligent router working ✅
- [x] `/bali-zero/chat-hybrid` endpoint functional ✅
- [x] Greetings routing to Claude ✅
- [x] Response quality 90%+ for greetings ✅
- [x] Latency < 1s for greetings ✅

**Test Commands**:
```bash
# Quick smoke test
curl -X POST http://localhost:8000/bali-zero/chat-hybrid \
  -H "Content-Type: application/json" \
  -d '{"query": "Ciao!", "user_id": "test"}' | jq .

# Verify:
# 1. answer is brief (< 20 words)
# 2. answer has emoji
# 3. route = "claude_direct"
# 4. latency < 1s
```

---

**Next**: Day 4-5 will cover deployment to Cloud Run and production testing.

---

*From Zero to Infinity ∞* 🚀
