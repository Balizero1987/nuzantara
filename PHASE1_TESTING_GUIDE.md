# 🧪 Phase 1 Testing Guide - Zantara Webapp
**Manual Testing Protocol for RAG Skip & Query Classification**

## 📋 What You're Testing

Phase 1 implements intelligent RAG retrieval that:
- ✅ **Skips RAG** for greetings/casual queries (fast, 2-3s response)
- ✅ **Uses RAG** for business queries (detailed, 5-10s response with ChromaDB)
- ✅ **Removes training artifacts** ([PRICE], [MANDATORY] markers)
- ✅ **Enforces length** (greetings: ~10-30 words, business: detailed)

---

## 🎯 Test Scenarios

### **Test 1: Greeting Queries (NO RAG Expected)**

**Query 1:** `Ciao`
- ✅ **Expected Response:**
  - Short (10-20 words)
  - Fast (~2-3 seconds)
  - Friendly greeting
  - NO business information
  - NO contact info
- ❌ **Red Flags:**
  - Response > 30 words
  - Mentions pricing, KITAS, PT PMA
  - Contains `[PRICE]` or `[MANDATORY]`
  - Takes > 10 seconds

**Query 2:** `Hello! Who are you?`
- ✅ **Expected Response:**
  - Brief introduction (10-30 words)
  - "I'm ZANTARA" or similar
  - Fast (~2-3 seconds)
- ❌ **Red Flags:**
  - Long detailed bio (> 50 words)
  - Lists all services
  - Training artifacts

**Query 3:** `Come stai?`
- ✅ **Expected Response:**
  - Casual, friendly (10-20 words)
  - Italian language
  - Fast response
- ❌ **Red Flags:**
  - Switches to English
  - Business-like tone
  - Too formal

---

### **Test 2: Business Queries (RAG ENABLED Expected)**

**Query 4:** `What is KITAS?`
- ✅ **Expected Response:**
  - Detailed explanation (150-300 words)
  - Accurate information from RAG
  - May take 5-15 seconds (ChromaDB retrieval)
  - Professional tone
  - Contact info at end
- ❌ **Red Flags:**
  - Too short (< 50 words)
  - Generic/vague answer
  - Contains `[PRICE]` markers
  - Wrong information

**Query 5:** `Quanto costa il PT PMA?`
- ✅ **Expected Response:**
  - Pricing information (if available)
  - Detailed explanation
  - Professional
  - Italian language
  - Contact info included
- ❌ **Red Flags:**
  - Says "I don't know"
  - `[PRICE]` placeholder
  - Switches language
  - Hallucinates prices

**Query 6:** `Tell me about visa requirements for Indonesia`
- ✅ **Expected Response:**
  - Comprehensive answer
  - Multiple visa types mentioned
  - RAG-enhanced context
  - Takes 5-15 seconds
- ❌ **Red Flags:**
  - Generic answer
  - Missing details
  - Training data leakage

---

## 📊 Recording Results

For each test, note:

### Response Metrics:
```
Query: [your query]
Response Time: [seconds]
Word Count: [count]
Language: [it/en/id]
Has Contact Info: [yes/no]
Clean (no artifacts): [yes/no]
Quality (1-5): [score]
```

### Expected vs Actual:
| Test | Query Type | Expected RAG | Response Time | Word Count | Artifacts? | Quality |
|------|-----------|--------------|---------------|------------|-----------|---------|
| 1 | Greeting | NO | 2-3s | 10-20 | None | ⭐⭐⭐⭐⭐ |
| 2 | Casual | NO | 2-3s | 10-30 | None | ⭐⭐⭐⭐⭐ |
| 3 | Casual | NO | 2-3s | 10-20 | None | ⭐⭐⭐⭐⭐ |
| 4 | Business | YES | 5-15s | 150-300 | None | ⭐⭐⭐⭐⭐ |
| 5 | Business | YES | 5-15s | 150-300 | None | ⭐⭐⭐⭐⭐ |
| 6 | Business | YES | 5-15s | 200-400 | None | ⭐⭐⭐⭐⭐ |

---

## 🔍 What to Look For

### ✅ SUCCESS INDICATORS:
1. **Greetings are SHORT** (10-30 words)
2. **Greetings are FAST** (< 5 seconds)
3. **Business queries are DETAILED** (150+ words)
4. **NO training artifacts** (`[PRICE]`, `[MANDATORY]`, `User:`, `Assistant:`)
5. **Correct language** (matches your input)
6. **Contact info** only on business queries

### ❌ FAILURE INDICATORS:
1. Greetings > 50 words (verbosity not fixed)
2. Business queries < 50 words (RAG not working)
3. Any `[PRICE]` or `[MANDATORY]` markers (sanitization failed)
4. Greetings take > 10 seconds (RAG not skipped)
5. Hallucinated information (RAG not integrated)

---

## 🚨 Edge Cases to Test

**Test 7:** `Ciao! Quanto costa KITAS?`
- Mixed greeting + business
- Should respond with pricing (business wins)

**Test 8:** `Help! My visa expired!`
- Emergency query
- Should use RAG + urgent tone

**Test 9:** Empty message or very short
- Graceful handling

---

## 📝 Reporting Back

After testing, report:

1. **Overall Success Rate:** _/6 tests passed
2. **Biggest Improvement:** [what's working well]
3. **Issues Found:** [what needs fixing]
4. **Performance:** [fast/slow, any timeouts]
5. **Screenshots:** [optional, for issues]

---

## 🎯 Success Criteria

**Phase 1 is SUCCESSFUL if:**
- ✅ 5/6 tests pass
- ✅ No training artifacts in any response
- ✅ Greetings are concise (< 30 words)
- ✅ Business queries are detailed (> 100 words)
- ✅ Response times are reasonable (< 15s)

**Phase 1 NEEDS OPTIMIZATION if:**
- ⚠️ Business queries timeout (> 30s)
- ⚠️ Responses have artifacts
- ⚠️ RAG not being used for business
- ⚠️ Greetings still too long

---

## 🔧 Next Steps

If tests pass → **Phase 1 COMPLETE!** 🎉
If issues found → I'll optimize RAG performance

**Ready to test?** Open https://zantara.balizero.com and run through these 6 queries!
