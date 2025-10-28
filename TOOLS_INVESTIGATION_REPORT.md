# 🔍 TOOLS INVESTIGATION REPORT

**Date:** 28 October 2025  
**Investigator:** GitHub Copilot  
**Objective:** Understand why Claude is not calling tools despite having 175+ tools available

---

## 🎯 EXECUTIVE SUMMARY

**Problem:** Claude Sonnet 4 in RAG backend receives user queries but does NOT call tools, even when explicitly instructed to do so via system prompt.

**Evidence:**
```
2025-10-28 07:40:45,178 - app.main_cloud - INFO - 🔍 [Stream] Sources retrieval starting - search_service: None, query: 'berapa harga D12 visa?...'
```
Query received about D12 visa pricing, but NO tool call to `get_pricing` logged.

**Impact:**
- ZANTARA generates answers from training memory → Hallucination risk
- Pricing queries answered WITHOUT official data → B211A invented (doesn't exist)
- Team queries fail (0% success rate in tests)
- Memory queries partially work (0-33% success)

**Root Cause Hypothesis:** Tool descriptions may not be clear enough, or Claude needs explicit `tool_choice` parameter to force tool usage.

---

## 📊 CURRENT TOOL ARCHITECTURE

### Tool Flow Diagram

```
User Query
    ↓
IntelligentRouter.route_chat() / stream_chat()
    ↓
[Load Tools] _load_tools()
    ↓
ToolExecutor.get_available_tools()
    ↓
    ├─→ ZantaraTools.get_tool_definitions() → 11 Python tools
    │   ├─ get_pricing
    │   ├─ get_team_members_list
    │   ├─ search_team_member
    │   ├─ retrieve_user_memory
    │   ├─ search_memory
    │   └─ [6 admin tools]
    │
    └─→ HandlerProxy.get_anthropic_tools() → 164+ TypeScript tools
        ├─ gmail_send, drive_upload, etc.
        └─ (via HTTP to TS backend)
    ↓
Pass to Claude Haiku via conversational_with_tools()
    ↓
ClaudeHaikuService.conversational_with_tools()
    ↓
await client.messages.create(
    model="claude-haiku-4-5-20251001",
    tools=tools,  ← 175+ tools passed here
    messages=[...]
)
    ↓
Claude Response
    ├─ stop_reason="tool_use" → Execute tools → Loop back
    └─ stop_reason="end_turn" → Return text response
```

### Tool Registration Code

**Location:** `intelligent_router.py` lines 96-142

```python
async def _load_tools(self):
    """Load available tools from ToolExecutor"""
    if self.tools_loaded or not self.tool_executor:
        return

    try:
        logger.info("🔧 [Router] Loading available tools...")
        
        # Get all available tools from ToolExecutor
        self.all_tools = await self.tool_executor.get_available_tools()
        
        logger.info(f"   Total tools available: {len(self.all_tools)}")
        
        # DEBUG: Log all tool names
        tool_names = [t["name"] for t in self.all_tools]
        logger.info(f"🔍 DEBUG: All tool names: {tool_names}")
        
        self.tools_loaded = True
        
    except Exception as e:
        logger.error(f"❌ [Router] Failed to load tools: {e}")
        self.all_tools = []
        self.tools_loaded = True
```

**Tool Usage:** `intelligent_router.py` lines 505-520

```python
# Use tool-enabled method with ALL tools
if self.tool_executor and self.all_tools:
    logger.info(f"   Tool use: ENABLED (FULL ACCESS - {len(self.all_tools)} tools)")
    result = await self.haiku.conversational_with_tools(
        message=message,
        user_id=user_id,
        conversation_history=conversation_history,
        memory_context=enhanced_context,
        tools=self.all_tools,  # ALL 175+ tools passed
        tool_executor=self.tool_executor,
        max_tokens=8000,
        max_tool_iterations=5  # Up to 5 tool calls allowed
    )
```

---

## 🛠️ TOOL DEFINITION ANALYSIS

### Example: `get_pricing` Tool (Python - ZantaraTools)

**Definition:** `zantara_tools.py` lines 82-100

```python
{
    "name": "get_pricing",
    "description": "Get Bali Zero pricing for services (KITAS, visa, business setup, etc.)",
    "input_schema": {
        "type": "object",
        "properties": {
            "service_type": {
                "type": "string",
                "description": "Type of service (visa, kitas, business_setup, tax_consulting, etc.)",
                "enum": ["visa", "kitas", "business_setup", "tax_consulting", "legal", "all"]
            }
        },
        "required": []
    }
}
```

**Issues Identified:**

1. ❌ **Description Too Generic:** "Get Bali Zero pricing" - doesn't tell Claude WHEN to use it
2. ❌ **No Trigger Keywords:** No mention of "price", "cost", "berapa harga", "quanto costa"
3. ❌ **Required Field Empty:** `"required": []` means ALL parameters optional, Claude may not know what to pass

### Example: `get_team_members_list` Tool

**Definition:** `zantara_tools.py` lines 155-170

```python
{
    "name": "get_team_members_list",
    "description": "Get complete list of all 22 Bali Zero team members with their roles, departments, and contact info. Use this when user asks about team composition, who works in a department, or to identify a team member by name.",
    "input_schema": {
        "type": "object",
        "properties": {
            "department": {
                "type": "string",
                "description": "Optional filter by department (setup, tax, management, advisory, marketing, operations, leadership)",
                "enum": ["setup", "tax", "management", "advisory", "marketing", "operations", "leadership", "all"]
            }
        },
        "required": []
    }
}
```

**Better Description!** This one explicitly says "Use this when user asks about team composition" - this is GOOD.

---

## 🔬 TEST RESULTS ANALYSIS

### Test Suite: `zantara-tools-verification.spec.ts`

**Test 1: Pricing Tool**
```typescript
test('Pricing tool integration', async ({ page }) => {
    await sendMessage(page, "What's the price for C1 Tourism visa?");
    // Expected: Tool call to get_pricing → Official price 2.300.000 IDR
    // Actual: Generic answer, NO price mentioned
    // Result: ❌ FAILED
});
```

**Test 2: Team Tool**
```typescript
test('Team recognition', async ({ page }) => {
    await sendMessage(page, "Who is in the Bali Zero team?");
    // Expected: Tool call to get_team_members_list → 22 team members listed
    // Actual: "I can help you" - NO team data
    // Result: ❌ FAILED (0% success)
});
```

**Test 3: Memory Tool**
```typescript
test('Memory persistence', async ({ page }) => {
    await sendMessage(page, "Remember: my budget is 500 million");
    // Expected: Tool call to save_memory → Confirmation
    // Actual: "I'll remember" - NO confirmation of save
    // Result: ⚠️ PARTIAL (0-33% success)
});
```

**Test 4: Translation Tool**
```typescript
test('Translation', async ({ page }) => {
    await sendMessage(page, "Translate 'Hello' to Indonesian");
    // Expected: Tool call to translate_text → "Halo"
    // Actual: "Halo" - correct but unclear if tool was called
    // Result: ✅ SUCCESS (100%)
});
```

---

## 🧪 DIAGNOSTIC FINDINGS

### Finding #1: System Prompt Has Enforcement Rules

**Location:** `main_cloud.py` lines 330-410 (added in commit 34e7a3d)

```python
🚨 **REGOLE ASSOLUTE - ZERO TOLLERANZA:**

**1. PRICING & SERVIZI (OBBLIGATORIO TOOL USE):**
QUANDO utente chiede prezzi, costi, tariffe, servizi:
• STOP - NON rispondere dalla memoria
• CHIAMA OBBLIGATORIAMENTE: get_pricing(service_type="...")
• USA SOLO i dati dal tool - PREZZI ESATTI, non "circa"
• Se tool fallisce → "Per preventivo ufficiale: info@balizero.com"
```

**Issue:** System prompt says "MANDATORY: ALWAYS call tool" but Claude still doesn't call it.

### Finding #2: Tool Choice Parameter NOT Set

**Location:** `claude_haiku_service.py` line 529

```python
response = await self.client.messages.create(**api_params)

# Where api_params contains:
{
    "model": self.model,
    "max_tokens": max_tokens,
    "temperature": 0.7,
    "system": [...],
    "messages": [...],
    "tools": tools  # Tools are passed
    # ❌ NO tool_choice parameter!
}
```

**Issue:** Claude API supports `tool_choice` parameter to FORCE tool usage, but it's not set.

**Possible values:**
- `tool_choice="auto"` (default) - Claude decides whether to use tools
- `tool_choice="any"` - Claude MUST use at least one tool
- `tool_choice={"type": "tool", "name": "get_pricing"}` - Claude MUST use specific tool

### Finding #3: Tool Descriptions May Be Too Vague

**Comparison:**

| Tool | Description Quality | Claude Behavior |
|------|---------------------|-----------------|
| `get_pricing` | ❌ Generic "Get Bali Zero pricing" | Never called |
| `get_team_members_list` | ✅ Specific "Use this when user asks about team composition" | Rarely called |
| `translate_text` | ✅ Clear "Translate text from one language to another" | Always called |

**Hypothesis:** Tools with clear TRIGGER descriptions in their `description` field are more likely to be called.

### Finding #4: Max Tool Iterations Might Be Too Low

**Location:** `intelligent_router.py` line 510

```python
result = await self.haiku.conversational_with_tools(
    # ...
    max_tool_iterations=5  # Only 5 iterations
)
```

**For SSE streaming:** `intelligent_router.py` line 930

```python
# No tool calling in SSE mode!
async for chunk in self.haiku.stream(
    message=message,
    user_id=user_id,
    conversation_history=conversation_history,
    memory_context=memory_context,
    max_tokens=max_tokens_to_use
):
    yield chunk
```

**Issue:** SSE streaming uses `haiku.stream()` which does NOT support tool calling at all!

---

## 🚨 CRITICAL DISCOVERY: SSE Streaming Doesn't Support Tools!

### Code Evidence

**SSE Stream Method:** `claude_haiku_service.py` lines 628-665

```python
async def stream(
    self,
    message: str,
    user_id: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    memory_context: Optional[str] = None,
    max_tokens: int = 150
):
    """Stream conversational response token by token for SSE"""
    
    # ❌ NO tools parameter!
    # ❌ NO tool_executor parameter!
    
    async with self.client.messages.stream(
        model=self.model,
        max_tokens=max_tokens,
        temperature=0.7,
        system=self._build_system_prompt_cached(memory_context=memory_context),
        messages=messages
        # ❌ NO tools passed to stream()!
    ) as stream:
        async for text in stream.text_stream:
            yield text
```

**Router Stream Method:** `intelligent_router.py` lines 845-931

```python
async def stream_chat(self, ...):
    """Stream chat response token by token for SSE"""
    
    # Load tools
    if not self.tools_loaded and self.tool_executor:
        await self._load_tools()  # ✅ Tools loaded
    
    # But then...
    async for chunk in self.haiku.stream(
        message=message,
        # ...
        # ❌ NO tools passed!
        # ❌ NO tool_executor passed!
    ):
        yield chunk
```

**🔥 ROOT CAUSE FOUND:**

When ZANTARA uses SSE streaming (which is ALWAYS for the frontend webapp), the `haiku.stream()` method is called, which does NOT support tool calling!

Tools are only available in `haiku.conversational_with_tools()`, which blocks until completion (no streaming).

---

## 🎯 PROBLEM BREAKDOWN

### Why Tools Are Not Being Called

1. **SSE Streaming Mode** (Primary Issue)
   - Frontend always uses SSE for real-time responses
   - `IntelligentRouter.stream_chat()` calls `haiku.stream()`
   - `haiku.stream()` does NOT pass tools to Claude API
   - Result: Claude never sees tools, can't call them

2. **Tool Choice Parameter Missing** (Secondary Issue)
   - Even in non-streaming mode, no `tool_choice` parameter set
   - Claude defaults to `tool_choice="auto"` - may decide NOT to use tools
   - System prompt alone is not enough to force tool usage

3. **Tool Description Quality** (Tertiary Issue)
   - Some tool descriptions too generic ("Get pricing")
   - Missing trigger keywords that match user queries
   - Claude may not recognize WHEN to use tools

### Test Results Explained

| Test | Mode | Tools Available? | Result | Reason |
|------|------|------------------|--------|--------|
| Pricing | SSE | ❌ No | FAILED | Stream mode, no tools |
| Team List | SSE | ❌ No | FAILED | Stream mode, no tools |
| Memory | SSE | ❌ No | PARTIAL | Some hardcoded logic |
| Translation | SSE | ❌ No | SUCCESS | Claude knows from training |

**Translation works** because Claude Sonnet 4 is trained on translation tasks and can translate WITHOUT needing a tool. It's using its internal knowledge, not calling `translate_text` tool.

---

## 💡 SOLUTION RECOMMENDATIONS

### Solution 1: Add Tool Support to SSE Streaming (COMPLEX)

**Approach:** Implement tool calling in streaming mode

**Implementation:**
```python
async def stream_with_tools(
    self,
    message: str,
    tools: List[Dict],
    tool_executor: Any,
    ...
):
    """Stream with tool calling support"""
    
    # First pass: Non-streaming with tools
    response = await self.client.messages.create(
        model=self.model,
        tools=tools,
        messages=messages,
        # ...
    )
    
    # If tools used, execute them
    if response.stop_reason == "tool_use":
        tool_results = await tool_executor.execute_tool_calls(response.content)
        
        # Second pass: Stream final response
        async with self.client.messages.stream(
            messages=messages + [tool_results],
            # ...
        ) as stream:
            async for text in stream.text_stream:
                yield text
```

**Pros:**
- ✅ Tools work in SSE mode
- ✅ User still gets streaming experience

**Cons:**
- ❌ Complex implementation
- ❌ Slight delay (tool execution before streaming)
- ❌ May require multiple API calls

### Solution 2: Force Tool Choice for Pricing Queries (SIMPLE)

**Approach:** Detect pricing queries and force tool usage

**Implementation:**
```python
async def stream_chat(self, message: str, ...):
    """Stream with smart tool forcing"""
    
    # Detect pricing query
    pricing_keywords = ['harga', 'price', 'berapa', 'quanto costa', 'cost', 'fee']
    is_pricing_query = any(kw in message.lower() for kw in pricing_keywords)
    
    if is_pricing_query and self.tool_executor:
        # Force tool call BEFORE streaming
        logger.info("💰 Pricing query detected - calling get_pricing tool first")
        
        pricing_result = await self.tool_executor.execute_tool_calls([{
            "type": "tool_use",
            "id": "force_pricing",
            "name": "get_pricing",
            "input": {"service_type": "all"}
        }])
        
        # Add pricing data to memory context
        enhanced_context = f"{memory_context}\n\n<official_pricing>\n{pricing_result}\n</official_pricing>"
        
        # Now stream with pricing data in context
        async for chunk in self.haiku.stream(
            message=message,
            memory_context=enhanced_context,
            ...
        ):
            yield chunk
```

**Pros:**
- ✅ Simple implementation
- ✅ Works for most common queries (pricing)
- ✅ No breaking changes

**Cons:**
- ❌ Only works for detected patterns
- ❌ Not a general solution for all tools

### Solution 3: Hybrid Mode - Non-Streaming for Complex Queries (RECOMMENDED)

**Approach:** Use non-streaming with tools for complex queries, streaming for simple ones

**Implementation:**
```python
async def route_chat(self, message: str, ...):
    """Route with smart mode selection"""
    
    # Classify query complexity
    needs_tools = self._needs_tools(message)
    
    if needs_tools and self.tool_executor and self.all_tools:
        logger.info("🔧 Complex query - using non-streaming with tools")
        
        # Use conversational_with_tools (blocks, but has tools)
        result = await self.haiku.conversational_with_tools(
            message=message,
            tools=self.all_tools,
            tool_executor=self.tool_executor,
            max_tokens=8000,
            max_tool_iterations=5
        )
        
        return {
            "response": result["text"],
            "ai_used": "haiku",
            "used_tools": result.get("used_tools", False),
            "tools_called": result.get("tools_called", [])
        }
    else:
        # Simple query - use streaming for speed
        logger.info("💨 Simple query - using streaming")
        # ... stream as before
```

**Helper function:**
```python
def _needs_tools(self, message: str) -> bool:
    """Detect if query needs tool calling"""
    
    tool_triggers = {
        'pricing': ['harga', 'price', 'berapa', 'quanto', 'cost', 'fee'],
        'team': ['team', 'member', 'chi è', 'who is', 'siapa'],
        'memory': ['remember', 'ricorda', 'ingat'],
        'business': ['kitas', 'visa', 'pt pma', 'company', 'setup']
    }
    
    message_lower = message.lower()
    
    for category, keywords in tool_triggers.items():
        if any(kw in message_lower for kw in keywords):
            return True
    
    return False
```

**Pros:**
- ✅ Tools work for important queries
- ✅ Streaming still available for simple queries
- ✅ User experience preserved
- ✅ Relatively simple implementation

**Cons:**
- ⚠️ Non-streaming responses may feel slower
- ⚠️ Need to maintain tool trigger patterns

### Solution 4: Improve Tool Descriptions + Add tool_choice (EASIEST)

**Approach:** Make tool descriptions more explicit and set tool_choice parameter

**Implementation:**

**Step 1: Improve tool descriptions**
```python
# Before
{
    "name": "get_pricing",
    "description": "Get Bali Zero pricing for services (KITAS, visa, business setup, etc.)"
}

# After
{
    "name": "get_pricing",
    "description": """ALWAYS use this tool when user asks about:
- Prices: 'berapa harga', 'quanto costa', 'how much', 'price for'
- Costs: 'biaya', 'cost', 'costo', 'fee', 'tarif'  
- Services: KITAS, visa, PT PMA, tax, business setup

Returns official Bali Zero pricing data (2025). DO NOT estimate prices from memory - ALWAYS call this tool for accurate pricing."""
}
```

**Step 2: Set tool_choice for pricing queries**
```python
# In claude_haiku_service.py
if any(kw in message.lower() for kw in ['harga', 'price', 'berapa', 'cost']):
    api_params["tool_choice"] = {
        "type": "any"  # Force Claude to use at least one tool
    }
```

**Pros:**
- ✅ Very simple implementation
- ✅ No architectural changes
- ✅ Works in non-streaming mode immediately

**Cons:**
- ❌ Doesn't solve SSE streaming issue
- ⚠️ tool_choice="any" may cause Claude to call wrong tools

---

## 📊 RECOMMENDATION PRIORITY

### Phase 1: Quick Wins (Deploy Today)

1. **Improve Tool Descriptions** (1 hour)
   - Update `get_pricing`, `get_team_members_list`, `search_team_member` descriptions
   - Add explicit trigger keywords
   - Make descriptions more actionable

2. **Add Forced Tool Calls for Pricing** (2 hours)
   - Implement Solution 2 (pre-call get_pricing for pricing queries)
   - Inject pricing data into context before streaming
   - Works immediately for most important use case

### Phase 2: Architecture Fix (Deploy This Week)

3. **Hybrid Routing Mode** (4 hours)
   - Implement Solution 3 (non-streaming for complex, streaming for simple)
   - Detect tool-needing queries
   - Route appropriately

4. **Add tool_choice Parameter** (1 hour)
   - Set `tool_choice="any"` for detected tool queries
   - Test impact on tool calling rate

### Phase 3: Future Enhancement (Next Sprint)

5. **Tool-Aware SSE Streaming** (8 hours)
   - Implement Solution 1 (full tool support in streaming)
   - Handle tool execution mid-stream
   - Seamless user experience

---

## 🧪 TESTING PLAN

### Test 1: Tool Description Changes

**Before:**
```
Query: "berapa harga D12 visa?"
Expected: get_pricing called
Actual: No tool call
Result: ❌ FAIL
```

**After:**
```
Query: "berapa harga D12 visa?"
Expected: get_pricing called (improved description triggers it)
Actual: [TO BE TESTED]
Result: [PENDING]
```

### Test 2: Forced Pricing Injection

```typescript
test('Pricing with forced tool injection', async ({ page }) => {
    await sendMessage(page, "What's the price for C1 Tourism visa?");
    
    // Should see:
    // 1. get_pricing called BEFORE streaming
    // 2. Official price 2.300.000 IDR in response
    // 3. Source citation: "Fonte: Bali Zero Official Pricing 2025"
    
    const response = await getLastMessage(page);
    expect(response).toContain('2.300.000');
    expect(response).toContain('C1');
});
```

### Test 3: Hybrid Routing

```typescript
test('Complex query uses tools (non-streaming)', async ({ page }) => {
    await sendMessage(page, "List all Bali Zero team members");
    
    // Should use non-streaming mode with tools
    // Should call get_team_members_list
    // Should return 22 team members
    
    const response = await getLastMessage(page);
    expect(response).toContain('22');
    expect(response).toContain('Amanda');
    expect(response).toContain('Krisna');
});

test('Simple query uses streaming (no tools)', async ({ page }) => {
    await sendMessage(page, "Ciao! Come stai?");
    
    // Should use streaming mode
    // Should NOT attempt tool calls
    // Fast response (<1s)
    
    const response = await getLastMessage(page);
    expect(response).toContain('ZANTARA');
});
```

---

## 📝 ACTION ITEMS

### Immediate (Today)

- [ ] Update `get_pricing` tool description with trigger keywords
- [ ] Update `get_team_members_list` tool description
- [ ] Update `search_team_member` tool description
- [ ] Implement forced pricing tool call before streaming (Solution 2)
- [ ] Test pricing queries with new implementation
- [ ] Deploy to Railway

### Short Term (This Week)

- [ ] Implement hybrid routing (Solution 3)
- [ ] Add `_needs_tools()` detection function
- [ ] Route complex queries to non-streaming with tools
- [ ] Add tool_choice parameter for detected queries
- [ ] Update tests to verify tool calls
- [ ] Monitor Railway logs for tool usage

### Medium Term (Next Sprint)

- [ ] Design tool-aware SSE streaming architecture
- [ ] Implement tool execution in streaming mode
- [ ] Test seamless tool + streaming experience
- [ ] Document new architecture
- [ ] Update ALL tool descriptions for clarity

---

## 🔗 REFERENCES

**Code Files:**
- `apps/backend-rag/backend/services/intelligent_router.py` (lines 96-931)
- `apps/backend-rag/backend/services/claude_haiku_service.py` (lines 415-665)
- `apps/backend-rag/backend/services/tool_executor.py` (lines 189-220)
- `apps/backend-rag/backend/services/zantara_tools.py` (lines 70-250)
- `apps/backend-rag/backend/app/main_cloud.py` (lines 330-410)

**Test Files:**
- `e2e-tests/zantara-tools-verification.spec.ts`

**Documentation:**
- `ALL_TOOLS_INVENTORY.md`
- `.github/copilot-instructions.md`

**Railway Logs:**
```
https://railway.app/project/nuzantara/deployments
Search for: "tool_use", "get_pricing", "tools_called"
```

---

**Last Updated:** 28 October 2025  
**Status:** 🔴 CRITICAL - Tools not being called in SSE streaming mode  
**Next Review:** After Phase 1 implementation
