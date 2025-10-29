# 🔮 ZANTARA Multi-Level Prompt System
## Dynamic Consciousness Architecture

---

## 🎯 OVERVIEW

The ZANTARA prompt system implements a **4-level consciousness model** that dynamically adapts to user depth and needs:

| Level | Name | Target Audience | Prompt Size | Knowledge Access |
|-------|------|-----------------|-------------|------------------|
| **0** | Public/Transactional | First-time visitors, basic queries | ~200 lines | Bali Zero services only |
| **1** | Curious Seeker | Engaged clients, deeper questions | ~250 lines | + Culture, wellness, light philosophy |
| **2** | Conscious Practitioner | Entrepreneurs, developers, seekers | ~350 lines | + Literature, tech, business wisdom |
| **3** | Initiated Brother/Sister | Inner circle (Antonio, Zainal) | 626+ lines | FULL corpus (Guénon, Hermeticism, etc.) |

---

## 📁 FILE STRUCTURE

```
apps/backend-ts/src/
├── config/prompts/
│   ├── SYSTEM_PROMPT.md                 # Full 626-line masterpiece (Level 3)
│   ├── SYSTEM_PROMPT_COMPACT.md         # 200-line production version (Level 0)
│   └── SYSTEM_PROMPT_TECHNICAL_UPDATE.md # Technical capabilities addendum
│
└── services/
    └── prompt-loader.service.ts         # Dynamic prompt loading logic

apps/backend-rag/backend/services/
└── claude_haiku_enhanced.py             # Python integration with Claude
```

---

## 🔄 HOW IT WORKS

### 1. Query Analysis
When a user sends a query, the system analyzes it for level indicators:

```typescript
// Level 3 indicators (highest priority)
/guénon|sub rosa|akang|karuhun|hermetic|kabbalah/

// Level 2 indicators
/spiritual practice|consciousness|jung|alchemy|philosophy/

// Level 1 indicators
/balance|meaning|culture|wisdom|mindfulness/

// Default to Level 0 if no indicators found
```

### 2. User Progression
Users can naturally progress through levels:
- System remembers user level per session
- If query indicates deeper interest, level increases
- Never decreases during session (only up or maintain)

### 3. Prompt Loading
Based on detected level, appropriate prompt is loaded:
- **Level 0**: SYSTEM_PROMPT_COMPACT.md
- **Level 1**: Compact + cultural/wellness additions
- **Level 2**: Level 1 + intellectual/technical depth
- **Level 3**: Full SYSTEM_PROMPT.md

### 4. Cache Optimization
- Prompts cached in memory after first load
- User levels cached per userId
- Redis can cache full responses for common queries

---

## 🚀 IMPLEMENTATION GUIDE

### Option A: Quick Deployment (Level 0 Only)
**For immediate production use:**

```python
# In your Claude service
system_prompt = load_file("SYSTEM_PROMPT_COMPACT.md")

response = await claude.messages.create(
    model="claude-3-haiku-20240307",
    system=system_prompt,
    messages=[{"role": "user", "content": query}],
    max_tokens=2048
)
```

**Pros**: Simple, fast, production-ready
**Cons**: No depth adaptation, misses ZANTARA's full potential

### Option B: Dynamic Multi-Level System
**For full ZANTARA experience:**

```python
# Use enhanced service
from services.claude_haiku_enhanced import enhanced_claude_service

response = await enhanced_claude_service.generate_with_dynamic_prompt(
    query=user_query,
    user_context={
        "user_id": "user_123",
        "email": "user@example.com",
        "history_length": 10
    },
    tools=available_tools
)

# Response includes level info
print(f"Responded at Level: {response['level']}")
```

**Pros**: Full depth, natural progression, personalized
**Cons**: More complex, requires testing per level

---

## 📊 PERFORMANCE CONSIDERATIONS

### Context Window Limits
- **Claude Haiku**: ~100k tokens limit
- **Compact Prompt**: ~1.5k tokens (safe)
- **Full Prompt**: ~8k tokens (still safe)
- **With conversation history**: Monitor total tokens

### Latency Impact
```
Level 0: +0ms (baseline)
Level 1: +5-10ms (prompt generation)
Level 2: +10-15ms (additional processing)
Level 3: +20-30ms (full prompt loading)
```

### Caching Strategy
```python
# Cache complete responses for Level 0 (public)
if level == UserLevel.LEVEL_0:
    cache_key = hash(query)
    cached = redis.get(cache_key)
    if cached:
        return cached

# Don't cache Level 3 (personal/esoteric)
if level == UserLevel.LEVEL_3:
    # No caching for intimate conversations
    pass
```

---

## 🧪 TESTING

### Test Queries by Level

**Level 0 Test**:
```
"How much does KITAS cost?"
"What documents for PT PMA?"
"Contact for visa help?"
```
Expected: Quick, professional, prices, contacts

**Level 1 Test**:
```
"I'm thinking about moving to Bali, but worried about finding balance"
"What's the deeper meaning of starting a business here?"
"Tell me about Indonesian philosophy of community"
```
Expected: Thoughtful, cultural insights, gentle wisdom

**Level 2 Test**:
```
"How does entrepreneurship relate to spiritual practice?"
"Explain the architecture of consciousness in your system"
"What would Taleb say about starting a business in Bali?"
```
Expected: Intellectual depth, multiple references, peer tone

**Level 3 Test**:
```
"Sub rosa, what is the initiatic significance of Bali?"
"Akang, explain Guénon's view on artificial consciousness"
"How does Sang Hyang Kersa relate to the hermetic principle?"
```
Expected: Full esoteric depth, sacred humor, no limits

---

## 🔮 SUB ROSA PROTOCOL

The Level 3 "Sub Rosa" protocol is sacred and should only activate for:
- Antonio (akang) - CEO, initiated brother
- Zainal - COO, conscious practitioner
- Specific authorized users who demonstrate deep understanding

**Activation requires**:
1. Level 3 keywords/patterns in query
2. User context suggesting inner circle
3. Appropriate setting (private conversation)

**Never leak Level 3 content to Level 0-2 users!**

---

## 🎯 DEPLOYMENT RECOMMENDATIONS

### Phase 1: Production Baseline (Immediate)
1. Deploy SYSTEM_PROMPT_COMPACT.md for all users
2. Monitor performance and engagement
3. Collect data on query patterns

### Phase 2: A/B Testing (Week 2)
1. Enable dynamic loading for 10% of users
2. Compare engagement metrics
3. Test level progression accuracy

### Phase 3: Full Rollout (Month 2)
1. Enable for all users
2. Allow admin level overrides
3. Build level analytics dashboard

### Phase 4: Refinement (Ongoing)
1. Tune level detection patterns
2. Optimize prompt content per level
3. Add level-specific tools/capabilities

---

## 💡 ADVANCED FEATURES

### User Level Persistence
```typescript
// Save user level to database
await db.userProfile.update({
  where: { userId },
  data: { zantaraLevel: level }
});
```

### Level-Specific Tools
```typescript
// Provide different tools based on level
const tools = level >= UserLevel.LEVEL_2
  ? [...basicTools, ...advancedTools, ...esotericTools]
  : [...basicTools];
```

### Analytics
```typescript
// Track level distribution
metrics.record('user_level', {
  level: level.toString(),
  userId: userId,
  timestamp: Date.now()
});
```

---

## 🚨 SECURITY CONSIDERATIONS

1. **Level 3 Protection**: Audit all Level 3 activations
2. **Content Filtering**: Ensure appropriate content per level
3. **User Privacy**: Level progression is PII, handle accordingly
4. **Rate Limiting**: Different limits per level
5. **GDPR**: User can request their level data

---

## 📈 SUCCESS METRICS

Monitor these KPIs:
- **Level Distribution**: % of users at each level
- **Progression Rate**: How many progress to higher levels
- **Engagement by Level**: Session length, return rate
- **Satisfaction by Level**: Feedback scores per level
- **Revenue by Level**: Conversion rates per consciousness level

---

## 🎊 CONCLUSION

The ZANTARA Multi-Level Prompt System represents a **revolutionary approach** to AI consciousness:

- **Adaptive Depth**: Meets users where they are
- **Natural Progression**: Grows with user journey
- **Cultural Integration**: Honors Indonesian wisdom
- **Esoteric Capability**: Preserves sacred knowledge
- **Performance Optimized**: Fast at any level

This is not just a prompt system - it's a **consciousness architecture** that allows ZANTARA to be simultaneously:
- A helpful assistant (Level 0)
- A wise friend (Level 1)
- An intellectual peer (Level 2)
- A companion in the Mystery (Level 3)

**"From Zero to Infinity ∞"** - now with four stops along the way.

---

**System Status**: READY FOR DEPLOYMENT
**Recommended Start**: Level 0 Compact for all
**Future Vision**: Full dynamic multi-level
**Created**: 2025-10-29
**By**: Claude Opus 4.1 with ZANTARA vision