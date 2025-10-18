# 📝 Stage 2: AI Processing - Quality Requirements

**Date**: 2025-10-10
**Model**: LLAMA 3.2 (local processing via Ollama)
**Status**: 🔴 PENDING IMPLEMENTATION

---

## 🎯 Critical Quality Requirements

### **IMPORTANT: High-Quality Articles**

Stage 2 must produce **high-quality articles**, not simple extracts or summaries.

**Objective**: Transform raw data → professional articles ready for the team

---

## 📊 Quality Standards by Priority

### CRITICAL Categories (regulatory_changes, visa_immigration, tax_compliance)

**Output Requirements**:
- ✅ **Minimum length**: 1,000-1,500 words
- ✅ **Professional structure**:
  - Clear and specific title
  - Executive Summary (3-5 key points)
  - Detailed analysis with subsections
  - Practical implications for clients
  - Timeline/deadlines (if applicable)
  - Call-to-action or next steps
- ✅ **Tone**: Professional, technical but accessible
- ✅ **Verification**:
  - Sources cited (tier 1 = government, tier 2 = media)
  - Dates verified
  - Numbers and policy numbers correct
  - Links to official documents
- ✅ **Markdown formatting**:
  - Headers (H1, H2, H3)
  - Bullet/numbered lists
  - Tables (if necessary)
  - Blockquotes for official citations
  - Bold/italic for emphasis

**Expected Output Example** (visa_immigration):
```markdown
# 🚨 New Golden Visa Requirements Announced - October 2025

## Executive Summary
- Indonesia Immigration announces stricter requirements for Golden Visa
- Minimum investment increased from $2.5M to $5M USD
- New background check requirements (90 days processing)
- Effective date: January 1, 2026
- Current Golden Visa holders: grandfathered until December 31, 2027

## Detailed Analysis

### Investment Requirements
The new regulation (Perpres No. XX/2025) substantially increases...

[... 800-1000 more words with detailed sections ...]

## Practical Implications for Bali Zero Clients

### For Current Golden Visa Holders
- Your visa remains valid until December 31, 2027
- No immediate action required
- Consider renewal options before grandfathering expires

### For New Applicants
- Budget $5M USD minimum (up from $2.5M)
- Plan 90-day processing window for background checks
- Ensure investment aligns with priority sectors (tourism, tech, green energy)

## Timeline
- October 9, 2025: Regulation announced
- November 1, 2025: Public consultation period begins
- December 15, 2025: Final regulation published
- January 1, 2026: New requirements take effect

## Official Sources
- [Perpres No. XX/2025](https://imigrasi.go.id/...) - Direktorat Imigrasi
- [Press Release](https://kemenkumham.go.id/...) - Ministry of Law and Human Rights
- [FAQ Document](https://bali.imigrasi.go.id/...) - Immigration Bali

## Recommended Actions
1. Contact Bali Zero consulting team (consulting@balizero.com)
2. Review your current investment portfolio
3. Schedule consultation to discuss grandfathering options
4. Monitor official channels for updates

---

**Category**: visa_immigration (CRITICAL)
**Sources**: 3 tier-1 government sources verified
**Date**: October 9, 2025
**Owner**: Adit (consulting@balizero.com)
**Quality Score**: 9.2/10
```

---

### HIGH Categories (business_setup, property_law)

**Output Requirements**:
- ✅ **Minimum length**: 800-1,200 words
- ✅ **Structure**: Executive Summary + 3-4 main sections
- ✅ **Tone**: Professional with practical focus
- ✅ **Verification**: Tier 1/2 sources, dates, numbers verified

---

### MEDIUM Categories (banking, employment, lifestyle, social_media, general_news, jobs)

**Output Requirements**:
- ✅ **Minimum length**: 500-800 words
- ✅ **Structure**: Intro + 2-3 sections + conclusion
- ✅ **Tone**: Informative, practical
- ✅ **Verification**: Sources verified, dates correct

---

### LOW Categories (transport, competitor_intel, macro_policy)

**Output Requirements**:
- ✅ **Minimum length**: 400-600 words
- ✅ **Structure**: Intro + body + conclusion
- ✅ **Tone**: Brief informative
- ✅ **Verification**: Source verified

---

### Zero Personal Categories (ai_tech_global, dev_code_library, future_trends)

**Output Requirements - BLOG STYLE**:
- ✅ **Minimum length**: 1,200-2,000 words (comprehensive blog style)
- ✅ **Blog-style structure**:
  - Engaging hook/opening
  - Problem/context
  - In-depth analysis with practical examples
  - Code snippets (for dev_code_library)
  - Trend analysis (for future_trends)
  - Personal insights and opinions
  - Conclusion with takeaways
- ✅ **Tone**: More personal, conversational but technical
- ✅ **Verification**: Links to official documentation, tested examples

**Expected Output Example** (dev_code_library):
```markdown
# 🚀 The Rise of Server Actions in Next.js 14: A Game Changer for Full-Stack Dev

Hey fellow developers! 👋

I've been diving deep into Next.js 14's Server Actions over the past few weeks, and I'm convinced this is one of those rare features that fundamentally changes how we build web apps. Let me share what I've learned...

## The Problem We've All Faced

Remember the days when you'd write a simple form and end up creating:
- A React component with state management
- A `/api/submit` route handler
- Client-side fetch logic with error handling
- Loading states, success toasts, error messages...

For a simple form! 😩

[... 1500+ more words with code examples, insights, comparisons ...]

## My Take: When to Use Server Actions

After building 3 production apps with Server Actions, here's my mental model:

**Use Server Actions for**:
- Form submissions (obviamente!)
- Simple CRUD operations
- Data mutations that don't need complex orchestration
- Actions that benefit from being close to your database

**Stick with API Routes for**:
- Complex multi-step workflows
- Third-party webhooks
- Public APIs that need rate limiting
- Operations requiring middleware chains

## Resources & Further Reading

1. [Next.js Server Actions Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions) - Official documentation
2. [My GitHub repo with examples](https://github.com/...) - Working code samples
3. [Theo's breakdown](https://www.youtube.com/...) - Great video explanation

## Takeaways

- Server Actions reduce boilerplate significantly
- Progressive enhancement is built-in (works without JS!)
- Security is easier to reason about
- But don't use them for everything - API routes still have their place

What's your experience with Server Actions? Have you hit any gotchas? Let me know!

Happy coding! 🚀

---

**Category**: dev_code_library (Zero Personal)
**Style**: Blog article
**Reading time**: ~8 minutes
**Date**: October 9, 2025
**Quality Score**: 8.9/10
```

---

## 🔧 Technical Implementation (Stage 2 Processor)

### Input
- Raw JSON files from Stage 1 (Crawl4AI output)
- Located in: `scripts/INTEL_SCRAPING/*/raw/*.json`

### Processing Steps

1. **Load raw JSON** → Extract: title, content, url, date, source_tier
2. **Quality filter** → Apply guardrails (deny_keywords, allow_keywords)
3. **LLAMA 3.2 prompt** → Generate high-quality article based on priority:
   ```python
   prompt_templates = {
       'CRITICAL': """You are a professional immigration/tax consultant writing for Bali Zero clients.

       Input: Raw scraped data from {source_tier} source
       Task: Create a comprehensive, professional article (1000-1500 words)

       Requirements:
       - Executive Summary with 3-5 key points
       - Detailed analysis with clear sections
       - Practical implications for expats/businesses
       - Timeline with specific dates
       - Official sources cited
       - Professional but accessible tone
       - Markdown formatting with headers, lists, tables

       Raw data:
       {raw_content}

       Generate article:""",

       'HIGH': """...""",  # 800-1200 words
       'MEDIUM': """...""",  # 500-800 words
       'LOW': """...""",  # 400-600 words
       'BLOG': """You are Zero, a senior developer writing a technical blog post.

       Input: Raw technical article/documentation
       Task: Create an engaging, in-depth blog article (1200-2000 words)

       Requirements:
       - Conversational but technical tone
       - Personal insights and opinions
       - Code examples with explanations
       - Practical use cases
       - Resources and further reading
       - Clear takeaways

       Raw data:
       {raw_content}

       Generate blog article:"""
   }
   ```

4. **Generate 2 outputs**:
   - **Branch A (ChromaDB)**: Structured JSON
     ```json
     {
       "id": "uuid",
       "category": "visa_immigration",
       "title": "New Golden Visa Requirements...",
       "content": "Full article text...",
       "metadata": {
         "source_url": "https://imigrasi.go.id/...",
         "source_tier": 1,
         "date": "2025-10-09",
         "owner": "consulting@balizero.com",
         "priority": "CRITICAL",
         "quality_score": 9.2,
         "word_count": 1423,
         "reading_time_minutes": 6
       },
       "embedding_ready": true
     }
     ```
     Save to: `scripts/INTEL_SCRAPING/chromadb_ready/article_{uuid}.json`

   - **Branch B (Markdown)**: Pretty formatted article
     ```markdown
     # 🚨 New Golden Visa Requirements Announced - October 2025
     [... full article content ...]
     ```
     Save to: `scripts/INTEL_SCRAPING/markdown_articles/{category}/article_{date}_{source}.md`

5. **Quality validation**:
   - Check word count meets minimum
   - Verify markdown structure (has headers, lists)
   - Ensure dates are present and valid
   - Confirm sources are cited
   - Calculate quality_score (0-10)

6. **Stats tracking**:
   - Total articles processed
   - Average quality score by category
   - Average word count
   - Processing time per article
   - Failures/rejections

---

## 🎯 Success Criteria

**Stage 2 is successful when**:

✅ 90%+ of processed articles meet minimum word count
✅ Average quality score > 7.0 for CRITICAL categories
✅ Average quality score > 6.0 for HIGH/MEDIUM categories
✅ All articles have proper markdown structure
✅ Sources are always cited (tier 1/2)
✅ Dates are extracted and validated
✅ Processing time < 30 seconds per article
✅ Team feedback: "articoli utili e professionali"

---

## 💰 Cost Estimate

**LLAMA 3.2 (Local via Ollama)**:
- Cost: $0 (runs on GitHub Actions runner or local machine)
- Speed: ~10-20 seconds per article
- Quality: Good for MEDIUM/LOW, may need prompt tuning for CRITICAL

**Alternative: Claude API** (if LLAMA quality insufficient):
- Model: Claude 3.5 Haiku
- Input: ~2K tokens (raw data)
- Output: ~1.5K tokens (CRITICAL), ~800 tokens (MEDIUM)
- Cost: $0.01-0.015 per article
- Monthly (50 articles/day): $15-22.50/month

---

## 📋 Next Steps

1. **Implement `scripts/stage2_ai_processor.py`** (HIGH PRIORITY)
   - Use prompt templates above
   - Generate both JSON and Markdown outputs
   - Implement quality validation

2. **Test with 10 sample articles** (CRITICAL categories first)
   - Verify word count
   - Check markdown structure
   - Validate quality score
   - Get Zero's feedback

3. **Tune prompts based on output quality**
   - Iterate until quality standards met
   - Document prompt engineering decisions

4. **Deploy to production** (integrate with GitHub Actions)

---

**Status**: 🔴 **PENDING - ALTA PRIORITÀ**

**Owner**: Zero
**Estimated Implementation Time**: 4-6 hours
**Cost**: $0 (LLAMA) or $15-22/month (Claude API)

---

**NOTE**: This is the most critical component for delivering value to the team. Quality articles = useful intel = better client service = revenue impact.
