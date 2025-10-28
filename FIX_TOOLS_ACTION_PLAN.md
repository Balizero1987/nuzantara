# 🚀 TOOLS FIX - Executable Action Plan

**Date:** 28 October 2025  
**Priority:** 🔴 CRITICAL  
**Timeline:** Phase 1 today, Phase 2 this week

---

## 🎯 DISCOVERED ROOT CAUSE

**CRITICAL FINDING:**  
Frontend uses SSE streaming (`IntelligentRouter.stream_chat()`), which calls `haiku.stream()`.  
**`haiku.stream()` does NOT pass tools to Claude API!**

```python
# intelligent_router.py line 917
async for chunk in self.haiku.stream(
    message=message,
    # ❌ NO tools parameter!
    # ❌ NO tool_executor parameter!
):
    yield chunk
```

**Result:** Claude never sees the 175+ tools, can't call them.

---

## ⚡ PHASE 1: Quick Fix (Deploy Today - 3 hours)

### Fix 1.1: Improve Tool Descriptions (30 min)

**File:** `apps/backend-rag/backend/services/zantara_tools.py`

**Change pricing tool description:**

```python
# OLD (line 82)
"description": "Get Bali Zero pricing for services (KITAS, visa, business setup, etc.)",

# NEW
"description": """ALWAYS call this tool when user asks about prices, costs, or fees.

TRIGGER KEYWORDS (any language):
• Prices: "berapa harga", "quanto costa", "how much", "price for", "what's the price"
• Costs: "biaya", "cost", "costo", "fee", "tarif", "cuánto cuesta"
• Services: KITAS, visa, C1, D1, E23, E28A, PT PMA, tax, NPWP, business setup

CRITICAL: Returns official Bali Zero 2025 pricing data. DO NOT estimate or generate prices from memory - ALWAYS call this tool for accurate pricing information.

Example queries:
- "berapa harga D12 visa?" → Call get_pricing(service_type="visa")
- "quanto costa KITAS E23?" → Call get_pricing(service_type="kitas")
- "C1 Tourism price?" → Call get_pricing(service_type="visa")""",
```

**Change team tool descriptions:**

```python
# get_team_members_list (line 157)
"description": """Get complete list of all 22 Bali Zero team members with roles and departments.

TRIGGER KEYWORDS:
• "team", "tim", "squadra", "equipo"
• "who is", "chi è", "siapa", "quién es"
• "members", "membri", "anggota", "miembros"
• "department", "dipartimento", "departemen"
• "list all", "elenco", "daftar"

Use this when user asks:
- "Who is in the Bali Zero team?"
- "List all team members"
- "Chi lavora nel Setup department?"
- "Siapa yang ada di tim tax?"

Returns: Name, role, department, email for all 22 team members.""",

# search_team_member (line 175)
"description": """Search for specific team member by name (supports partial matching).

TRIGGER KEYWORDS:
• "chi è [name]", "who is [name]", "siapa [name]"
• "find", "cerca", "cari", "buscar"
• Any team member name (Adit, Ari, Surya, Krisna, Amanda, etc.)

Use this when user asks:
- "Chi è Adit?" → search_team_member(query="Adit")
- "Who is Krisna?" → search_team_member(query="Krisna")
- "Siapa Ari?" → search_team_member(query="Ari")

Returns: Matching team members with full details.""",
```

### Fix 1.2: Force Pricing Tool Call Before Streaming (2 hours)

**File:** `apps/backend-rag/backend/services/intelligent_router.py`

**Add method to detect tool-needing queries:**

```python
# Add after line 142 (after _load_tools)

def _detect_tool_needs(self, message: str) -> Dict[str, Any]:
    """
    Detect if query needs specific tools before streaming
    
    Returns:
        {
            "needs_tools": bool,
            "tool_category": str,  # "pricing", "team", "memory", etc.
            "should_prefetch": bool  # If True, call tool before streaming
        }
    """
    message_lower = message.lower()
    
    # Pricing detection (HIGHEST PRIORITY)
    pricing_keywords = [
        'harga', 'berapa', 'price', 'cost', 'quanto', 'costo', 'biaya', 'fee', 'tarif',
        'cuánto', 'precio', 'custo', 'preço'
    ]
    
    service_keywords = [
        'visa', 'kitas', 'kitap', 'c1', 'c2', 'd1', 'd2', 'e23', 'e28a', 'e31a',
        'pt pma', 'company', 'npwp', 'bpjs', 'tax', 'business'
    ]
    
    has_pricing_keyword = any(kw in message_lower for kw in pricing_keywords)
    has_service_keyword = any(kw in message_lower for kw in service_keywords)
    
    if has_pricing_keyword and has_service_keyword:
        return {
            "needs_tools": True,
            "tool_category": "pricing",
            "should_prefetch": True,  # Fetch pricing BEFORE streaming
            "tool_name": "get_pricing",
            "tool_input": {"service_type": "all"}
        }
    
    # Team detection
    team_keywords = ['team', 'tim', 'member', 'membri', 'anggota', 'chi è', 'who is', 'siapa']
    if any(kw in message_lower for kw in team_keywords):
        return {
            "needs_tools": True,
            "tool_category": "team",
            "should_prefetch": False  # Let Claude decide which tool (list vs search)
        }
    
    # No tool needed
    return {
        "needs_tools": False,
        "tool_category": None,
        "should_prefetch": False
    }
```

**Update stream_chat to use prefetch:**

```python
# Update line 790 onwards in stream_chat method

async def stream_chat(
    self,
    message: str,
    user_id: str,
    conversation_history: Optional[List[Dict]] = None,
    memory: Optional[Any] = None,
    collaborator: Optional[Any] = None
):
    """Stream chat response WITH smart tool prefetching"""
    try:
        logger.info(f"🚦 [Router Stream] Starting stream for user {user_id}")
        
        # PHASE 1: Detect if query needs tools
        tool_needs = self._detect_tool_needs(message)
        
        if tool_needs["should_prefetch"] and self.tool_executor:
            logger.info(f"🔧 [Router Stream] PREFETCHING tool: {tool_needs['tool_name']}")
            
            try:
                # Execute tool BEFORE streaming
                tool_result = await self.tool_executor.execute_tool_calls([{
                    "type": "tool_use",
                    "id": "prefetch",
                    "name": tool_needs["tool_name"],
                    "input": tool_needs["tool_input"]
                }])
                
                # Extract tool data
                if tool_result and len(tool_result) > 0:
                    tool_data = tool_result[0].get("content", "")
                    logger.info(f"✅ [Router Stream] Tool prefetched: {len(tool_data)} chars")
                    
                    # Inject tool data into memory context
                    tool_context = f"\n\n<official_data_from_{tool_needs['tool_name']}>\n{tool_data}\n</official_data_from_{tool_needs['tool_name']}>\n\n⚠️ CRITICAL: Use ONLY the data above to answer. DO NOT generate data from memory."
                    
                    if memory_context:
                        memory_context += tool_context
                    else:
                        memory_context = tool_context
                else:
                    logger.warning(f"⚠️ [Router Stream] Tool returned empty result")
                    
            except Exception as e:
                logger.error(f"❌ [Router Stream] Tool prefetch failed: {e}")
                # Continue streaming without prefetched data
        
        # Build memory context (same logic as before)
        if not memory_context and memory:
            # ... existing memory building code ...
            pass
        
        # ... rest of stream_chat remains the same ...
        
        # Stream response (tool data already in context)
        async for chunk in self.haiku.stream(
            message=message,
            user_id=user_id,
            conversation_history=conversation_history,
            memory_context=memory_context,  # Now includes prefetched tool data
            max_tokens=max_tokens_to_use
        ):
            yield chunk
            
        logger.info(f"✅ [Router Stream] Stream completed for user {user_id}")
        
    except Exception as e:
        logger.error(f"❌ [Router Stream] Error: {e}")
        raise Exception(f"Streaming failed: {str(e)}")
```

### Fix 1.3: Add Citation Enforcement in System Prompt (30 min)

**File:** `apps/backend-rag/backend/services/claude_haiku_service.py`

**Add to system prompt (around line 180):**

```python
⚠️ CITATION ENFORCEMENT (WHEN USING PREFETCHED DATA):

When you receive <official_data_from_[tool_name]> in context:
1. ✅ USE ONLY that data - exact numbers, exact names, exact prices
2. ✅ ALWAYS cite source at end: "Fonte: Bali Zero Official Pricing 2025"
3. ❌ NEVER mix with your training data
4. ❌ NEVER estimate or "circa"

Example:
User: "berapa harga C1 visa?"
Context: <official_data_from_get_pricing>{"C1 Tourism": "2.300.000 IDR"}</official_data_from_get_pricing>
Response: "Il visto C1 Tourism costa 2.300.000 IDR (circa €140). 

Fonte: Bali Zero Official Pricing 2025"
```

---

## 🚀 PHASE 2: Hybrid Routing (This Week - 4 hours)

### Fix 2.1: Add Non-Streaming Path for Complex Queries

**File:** `apps/backend-rag/backend/services/intelligent_router.py`

**Add routing decision in route_chat (line 400):**

```python
# After classifying intent (around line 490)

# DECISION: Stream or Non-Stream?
tool_needs = self._detect_tool_needs(message)

if tool_needs["needs_tools"] and not tool_needs["should_prefetch"]:
    # Complex query needs interactive tool calling
    logger.info(f"🔧 [Router] Complex query - using NON-STREAMING with tools")
    
    # Load tools if not already loaded
    if not self.tools_loaded and self.tool_executor:
        await self._load_tools()
    
    # Use conversational_with_tools (blocks, but has tools)
    result = await self.haiku.conversational_with_tools(
        message=message,
        user_id=user_id,
        conversation_history=conversation_history,
        memory_context=enhanced_context,
        tools=self.all_tools,  # ALL tools available
        tool_executor=self.tool_executor,
        max_tokens=8000,
        max_tool_iterations=5
    )
    
    # Apply response sanitization
    sanitized_response = process_zantara_response(
        result["text"],
        query_type,
        apply_santai=True,
        add_contact=True
    )
    
    return {
        "response": sanitized_response,
        "ai_used": "haiku",
        "category": category,
        "model": result["model"],
        "tokens": result["tokens"],
        "used_rag": used_rag,
        "used_tools": result.get("used_tools", False),
        "tools_called": result.get("tools_called", []),
        "routing_mode": "non_streaming_with_tools"
    }
else:
    # Simple query or pricing (prefetched) - use streaming
    logger.info(f"💨 [Router] Simple/prefetched query - using STREAMING")
    
    # ... existing streaming code ...
```

---

## 📊 TESTING CHECKLIST

### Test 1: Pricing Queries (Phase 1 Fix)

```bash
# Test via Playwright
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY
npx playwright test e2e-tests/zantara-tools-verification.spec.ts --grep "Pricing"
```

**Expected:**
- ✅ Query: "berapa harga D12 visa?"
- ✅ Tool `get_pricing` called BEFORE streaming
- ✅ Response contains exact price from tool
- ✅ Response has citation: "Fonte: Bali Zero Official Pricing 2025"

### Test 2: Team Queries (Phase 2 Fix)

```bash
npx playwright test e2e-tests/zantara-tools-verification.spec.ts --grep "Team"
```

**Expected:**
- ✅ Query: "Who is in the Bali Zero team?"
- ✅ Uses NON-STREAMING mode
- ✅ Tool `get_team_members_list` called
- ✅ Response lists 22 team members

### Test 3: Simple Queries (Should Still Stream)

```bash
# Manual test via webapp
# Query: "Ciao! Come stai?"
```

**Expected:**
- ✅ Uses STREAMING mode (fast)
- ✅ No tool calls
- ✅ Natural greeting response

---

## 🚢 DEPLOYMENT STEPS

### Step 1: Commit Phase 1 Changes

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY

git add apps/backend-rag/backend/services/zantara_tools.py
git add apps/backend-rag/backend/services/intelligent_router.py
git add apps/backend-rag/backend/services/claude_haiku_service.py

git commit -m "FIX: Tool calling in SSE streaming - Phase 1

- Improved tool descriptions with explicit trigger keywords
- Added tool prefetching for pricing queries before streaming
- Inject prefetched data into context with citation enforcement
- Pricing queries now use official data, not AI memory

Changes:
- zantara_tools.py: Enhanced get_pricing, get_team_members_list descriptions
- intelligent_router.py: Added _detect_tool_needs() and prefetch logic in stream_chat()
- claude_haiku_service.py: Added citation enforcement in system prompt

Expected impact:
- Pricing queries → Tool called → Official prices used
- No more B211A hallucinations
- 'Fonte: Bali Zero Official Pricing 2025' citation always present"

git push origin main
```

### Step 2: Monitor Railway Logs

```bash
# Watch logs for:
# "PREFETCHING tool: get_pricing"
# "Tool prefetched: [N] chars"
# "official_data_from_get_pricing"
```

### Step 3: Test in Production

```
https://ayo.balizero.com

Test queries:
1. "berapa harga C1 visa?"
2. "quanto costa KITAS E23?"
3. "What's the price for PT PMA setup?"
4. "D12 visa price?"
```

**Success Criteria:**
- ✅ All queries return exact official prices
- ✅ Responses include source citation
- ✅ No hallucinated visa codes (B211A, etc.)

### Step 4: Deploy Phase 2 (After Phase 1 Success)

```bash
# Same process for Phase 2 hybrid routing
git add apps/backend-rag/backend/services/intelligent_router.py
git commit -m "FIX: Hybrid routing for tool-heavy queries - Phase 2"
git push origin main
```

---

## 📈 SUCCESS METRICS

### Before Fix

| Metric | Current | Target |
|--------|---------|--------|
| Pricing tool calls | 0% | 100% |
| Team tool calls | 0% | 80% |
| Price accuracy | ~50% (hallucinations) | 100% |
| Citation inclusion | 0% | 100% |

### After Phase 1

| Metric | Target |
|--------|--------|
| Pricing tool calls | 100% (prefetched) |
| Price accuracy | 100% (official data) |
| Citation inclusion | 100% |

### After Phase 2

| Metric | Target |
|--------|--------|
| Team tool calls | 80% (non-streaming) |
| Overall tool success rate | >80% |
| User satisfaction | >90% |

---

## 🆘 ROLLBACK PLAN

**If Phase 1 causes issues:**

```bash
# Revert last commit
git revert HEAD
git push origin main

# Railway will auto-deploy previous working version
```

**Fallback:** Phase 1 only adds prefetch logic - if tool fails, streaming continues normally with memory context. No breaking changes.

---

## 📞 CONTACTS

**For Issues:**
- Antonello (Zero): Slack, WhatsApp
- Railway Logs: https://railway.app/project/nuzantara/deployments
- Test Results: `e2e-tests/test-results/`

**Timeline:**
- Phase 1: Deploy today (3 hours work)
- Test: 1 hour
- Phase 2: Deploy Wednesday (4 hours work)
- Final test: Thursday

---

**Status:** 🟡 READY TO IMPLEMENT  
**Assigned To:** GitHub Copilot + Antonello  
**Priority:** 🔴 CRITICAL - Affects core functionality
