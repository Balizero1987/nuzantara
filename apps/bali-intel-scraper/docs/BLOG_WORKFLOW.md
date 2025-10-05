# 📝 Daily Blog Workflow - Intelligence Articles

**Complete workflow for creating daily blog posts with AI-generated images**

---

## 👥 Team Roles

**8 Collaborators** (one per topic):
- Immigration
- BKPM/Tax
- Real Estate
- Events
- Social Trends
- Competitors
- Bali News
- Weekend Roundup

**1 Blog Editor** (aggregates all):
- Collects articles from all 8 collaborators
- Reviews & publishes to blog sidebar
- Manages daily blog

---

## 📅 Daily Workflow

### **Step 1: Collaborators Create Article Draft** (11:30 AM, 20 min)

After completing scraping + structuring, collaborators create a blog article:

**1.1 Select Top Story**
- From structured JSON, pick the most important news item
- Criteria: impact_level="critical" or "high", tier="1" or "2"

**1.2 Create Article with Claude/ChatGPT**

**Prompt for AI**:
```
I need to create a blog article from this news item:

Title: [title from JSON]
Summary: [summary_english]
Key Changes: [key_changes]
Source: [source] (Tier [tier])
Impact: [impact_level]

Please create a blog article in this format:

---
CATEGORY: [Immigration/Tax/RealEstate/Events/etc]
TITLE: [Catchy, clear title in English]
SUBTITLE: [One-line hook]

ARTICLE BODY (200-300 words):
[Well-structured article with:
- Opening paragraph (what happened)
- Details & context
- Impact on expats
- Action items if needed
- Closing with next steps or timeline]

IMAGE PROMPT:
[A DALL-E/Midjourney prompt for a symbolic image representing this news]
Example: "Modern minimalist illustration of Indonesian visa documents with Bali temple silhouette in background, professional gradient colors, clean design"

SUMMARY FOR SIDEBAR (2 sentences max):
[Short version for blog sidebar preview]

METADATA:
- Tier: [1/2/3]
- Impact: [critical/high/medium/low]
- Date: [YYYY-MM-DD]
- Source: [source name]
---

Make it professional, clear, and actionable for expats in Bali.
```

**1.3 Generate Image**

Use Claude/ChatGPT to generate image with the IMAGE PROMPT:

**In Claude.ai**:
- Copy the IMAGE PROMPT from article
- Ask: "Generate an image for this: [IMAGE PROMPT]"
- Claude generates AI image
- Download image (right-click → Save Image)

**Or use DALL-E (ChatGPT Plus)**:
- Use ChatGPT DALL-E: "/dalle [IMAGE PROMPT]"
- Download generated image

**1.4 Save Files**

Save two files:
- `immigration_blog_YYYYMMDD.md` (article text)
- `immigration_blog_YYYYMMDD.jpg` (image)

Store in: `apps/bali-intel-scraper/data/blog/[topic]/`

---

### **Step 2: Upload to ZANTARA** (11:50 AM, 5 min)

**2.1 Create JSON for ZANTARA**

Convert article to JSON format:

```json
{
  "id": "blog_immigration_20250110",
  "date": "2025-01-10",
  "category": "Immigration",
  "title": "New E28A Investor Visa Processing Time Reduced to 7 Days",
  "subtitle": "Kemenkumham announces faster processing starting February 2025",
  "summary": "Indonesian Ministry of Law announced a significant reduction in E28A Investor Visa processing time from 14 to 7 days, effective February 1, 2025.",
  "article_body": "[Full article text here]",
  "image_url": "https://storage.googleapis.com/nuzantara-blog/immigration_blog_20250110.jpg",
  "tier": "1",
  "impact_level": "high",
  "source": "Kemenkumham",
  "action_required": true,
  "deadline_date": "2025-02-01",
  "keywords": ["E28A", "investor visa", "processing time", "Kemenkumham"]
}
```

**2.2 Upload Image to Google Cloud Storage**

```bash
gsutil cp immigration_blog_20250110.jpg gs://nuzantara-blog/images/
```

Get public URL: `https://storage.googleapis.com/nuzantara-blog/images/immigration_blog_20250110.jpg`

**2.3 Upload Article to ZANTARA**

```bash
curl -X POST "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer zantara-internal-dev-key-2025" \
  -d '{
    "handler": "intel.blog.publish",
    "params": {
      ... JSON from step 2.1 ...
    }
  }'
```

**Or use Python script**:
```bash
python3 scripts/upload_blog_article.py immigration_blog_20250110.json
```

---

### **Step 3: Blog Editor Aggregates** (12:00 PM, 15 min)

**3.1 Collect All Articles**

Blog Editor receives 8 articles (one from each collaborator):
- `immigration_blog_YYYYMMDD.json`
- `bkpm_tax_blog_YYYYMMDD.json`
- `realestate_blog_YYYYMMDD.json`
- `events_blog_YYYYMMDD.json`
- `social_blog_YYYYMMDD.json`
- `competitors_blog_YYYYMMDD.json`
- `bali_news_blog_YYYYMMDD.json`
- `roundup_blog_YYYYMMDD.json` (weekends only)

**3.2 Review & Prioritize**

Sort by:
1. Critical items first
2. Tier 1 sources
3. High impact
4. Action required items

**3.3 Publish to Blog Sidebar**

Run aggregation script:
```bash
python3 scripts/aggregate_daily_blog.py YYYYMMDD
```

This:
- Combines all 8 articles
- Generates daily blog JSON
- Uploads to Firebase/Firestore for webapp
- Notifies Slack #intel-blog channel

**3.4 Verify Live**

Check: https://zantara.balizero.com/intel-dashboard.html

Blog sidebar should show all 8 articles with images.

---

## 📊 Output Examples

### **Blog Article Format**:

```markdown
---
CATEGORY: Immigration
TITLE: E28A Processing Time Cut in Half
SUBTITLE: Faster investor visas starting February 2025
---

Indonesia's Ministry of Law and Human Rights (Kemenkumham) announced a significant improvement for foreign investors: E28A Investor Visa processing time will be reduced from 14 to 7 days, effective February 1, 2025.

This change comes as part of the government's ongoing efforts to attract foreign investment and streamline business processes. The E28A visa, designed for foreign investors establishing companies in Indonesia, has been a popular choice for entrepreneurs looking to operate legally in Bali and across the archipelago.

**Impact on Expats**: Current applicants with pending E28A visas can expect faster processing. Those planning to apply should prepare documentation in advance to take advantage of the new timeline.

**Action Required**: No action needed for current visa holders. New applicants should ensure all documents are ready by late January to benefit from the February 1 launch.

**Next Steps**: Kemenkumham will release detailed implementation guidelines by January 20. Monitor official channels for updates.

IMAGE: [Modern illustration of Indonesian visa with Bali background]
SOURCE: Kemenkumham (Tier 1)
IMPACT: High
DEADLINE: 2025-02-01
```

---

## 🖼️ Image Generation Tips

**Good IMAGE PROMPTs**:
✅ "Modern flat illustration of Indonesian passport with Bali temple silhouette, gradient purple and blue, minimalist professional design"
✅ "Clean vector graphic of tax documents and calculator, with Indonesia flag colors, professional business style"
✅ "Elegant watercolor painting of Bali villa with 'SOLD' sign, warm sunset colors, tropical vibes"

**Bad IMAGE PROMPTs**:
❌ "Picture of visa" (too vague)
❌ "Complex realistic photo with 10 elements" (too busy)
❌ "Dark scary bureaucracy nightmare" (wrong tone)

**Style Guidelines**:
- Modern, clean, professional
- Symbolic, not literal (abstractions > photos)
- Bali/Indonesia themed when relevant
- Optimistic colors (purples, blues, greens)
- Avoid text in images (AI text looks bad)

---

## 🎨 Image Tools

**Free Options**:
- **Claude.ai** (Anthropic): Generate images directly in chat
- **ChatGPT DALL-E** (with Plus subscription): `/dalle [prompt]`
- **Midjourney** (Discord, free trial): `/imagine [prompt]`

**Paid Options**:
- **DALL-E API** (OpenAI): $0.020 per image (1024x1024)
- **Stability AI**: $0.01 per image
- **Midjourney Standard**: $10/month unlimited

**Recommended**: Use Claude.ai (included in paid plan) or ChatGPT DALL-E.

---

## 🚀 Automation (Future)

**Phase 1 (Current)**: Manual workflow (collaborator → editor → blog)

**Phase 2 (Planned)**:
- Automated image generation via API
- Auto-upload to GCS
- Auto-publish to blog sidebar
- Slack notifications with previews

**Phase 3 (Advanced)**:
- AI selects top story automatically
- Auto-generates article from structured JSON
- Multi-language versions (EN, IT, ID)
- SEO optimization

---

## 📝 Quality Checklist

Before publishing, verify:

- [ ] Article is 200-300 words
- [ ] Title is clear and actionable
- [ ] Image is relevant and high-quality (min 800x600px)
- [ ] Source and tier are correct
- [ ] Impact level matches content
- [ ] Action required items have deadlines
- [ ] No typos or grammatical errors
- [ ] Image uploaded to GCS with public URL
- [ ] JSON formatted correctly
- [ ] Blog sidebar displays correctly

---

## 📞 Support

**Blog Editor Contact**: blog-editor@balizero.com
**Technical Issues**: #intel-support Slack
**Image Generation Help**: Ask in #intel-blog channel

---

**Workflow Version**: 1.0.0
**Last Updated**: 2025-10-05
**Est. Daily Time**: 30 minutes (20 min collaborator + 10 min editor)
