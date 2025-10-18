# 📋 Structuring Prompt - Immigration & Visas

**Use this prompt with Claude.ai or ChatGPT after uploading the raw CSV**

---

## Prompt to Copy-Paste

```
Today is [INSERT TODAY'S DATE]. I have a CSV with news items about Indonesian immigration, visas, and KITAS regulations scraped from various sources.

Please analyze each row and create a structured JSON dataset following this schema:

For each news item, create:
{
  "id": "uuid_v4",
  "original_url": "url from CSV",
  "title_clean": "cleaned title without clickbait",
  "summary_english": "2-3 sentence summary in English",
  "summary_italian": "2-3 sentence summary in Italian",
  "full_text": "complete text from CSV",
  "source": "source name",
  "tier": "1|2|3",
  "published_date": "ISO 8601 format YYYY-MM-DD",
  "scraped_date": "ISO 8601 format from CSV",
  "language": "id|en",

  "category": "visa_policy|kitas|kitap|overstay|enforcement|digital_nomad|investor_visa|retirement_visa|golden_visa|e33|other",

  "subcategory": "specific visa type (e.g., B211A, E28A, E33A, C312, golden_visa_5yr, etc.)",

  "impact_level": "critical|high|medium|low",

  "sentiment": "positive|negative|neutral",

  "stakeholders": ["expats", "tourists", "investors", "retirees", "digital_nomads", "students", "workers"],

  "key_changes": "What changes in practice - bullet points in English",

  "action_required": "true|false - do expats need to take action?",

  "deadline_date": "YYYY-MM-DD if there's a compliance deadline, otherwise null",

  "keywords": ["array", "of", "relevant", "keywords"],

  "entities": {
    "government_bodies": ["Imigrasi", "Kemenkumham", "BKPM"],
    "visa_types": ["KITAS", "B211A", "E28A"],
    "locations": ["Bali", "Jakarta", "Indonesia"]
  },

  "credibility_score": "1-10 how reliable is this source",

  "related_urls": ["links to official regulations if mentioned"],

  "quotes": ["important quotes from officials"],

  "numbers_data": {
    "fee_changes": "IDR X",
    "processing_time": "Y days",
    "quota": "Z applicants"
  }
}

VALIDATION RULES:
1. Remove duplicates (same URL or identical title)
2. Verify the news is actually about immigration/visas (remove false positives)
3. Only include items published in last 48 hours unless critical importance
4. If same news from multiple sources, keep highest tier source and add others to "also_covered_by" array

PRIORITIZATION:
- Flag as URGENT if: policy change imminent, enforcement action, deadline approaching
- Flag as FOLLOW_UP if: rumors unconfirmed, needs verification from Tier 1 source

DEDUPLICATION:
- If same news appears on multiple sources, keep the Tier 1 version
- Create field "also_covered_by": [array of other source names]

OUTPUT FORMAT:
- JSON array of objects
- Include metadata header:
  {
    "scraping_date": "YYYY-MM-DD",
    "total_items": X,
    "tier_breakdown": {"tier1": X, "tier2": Y, "tier3": Z},
    "categories": {"visa_policy": X, "kitas": Y, ...},
    "urgent_items": X,
    "action_required_items": X
  }

FINAL OUTPUT:
Return a valid JSON file with:
1. Metadata object at top
2. "news_items" array with all structured items
3. Filename suggestion: immigration_structured_[YYYY-MM-DD].json
```

---

## After Claude Processes

**Download the JSON** and save to:
```
~/Desktop/NUZANTARA-2/apps/bali-intel-scraper/data/structured/immigration_structured_YYYYMMDD.json
```

**Next step**: Upload to ChromaDB
```bash
python3 scripts/upload_to_chromadb.py immigration_structured_YYYYMMDD.json
```

---

## Quality Checks

Before uploading, verify JSON has:
- ✅ Valid JSON syntax (no trailing commas)
- ✅ All required fields present
- ✅ Dates in ISO 8601 format
- ✅ Impact levels correctly assigned
- ✅ No duplicates
- ✅ Tier distribution ~20% T1, 50% T2, 30% T3

---

**Template Version**: 1.0.0
**Last Updated**: 2025-10-05
