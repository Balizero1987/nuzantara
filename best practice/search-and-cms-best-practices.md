# Zantara Bridge Best Practices (Search and Discovery, Content Management) - v2025-09

TL;DR: build clean indexes, fast facets, testable ranking, helpful autocomplete, analytics that close the loop, CMS workflows with versioning, and CDN-backed assets with sane caching. Everything else is noise.

## 15. Search and Discovery

### 15.1 Choosing the Engine (Elasticsearch, Algolia, Typesense)
- **Elasticsearch**: full control, hybrid BM25 plus vectors, cross-cluster, advanced analysis pipelines (language, ICU), learning-to-rank and reranking. Requires heavier ops.
- **Algolia**: SaaS, instant search, ranking formula (eight criteria) out of the box, query suggestions, Insights analytics, replica indices and merchandising. Pay-as-you-go.
- **Typesense**: open source/cloud, simple and fast, first-class facets, deterministic ranking (`_text_match` plus custom fields), configurable typo tolerance. Ideal for search-as-you-type.
- Hybrid tip: combine BM25 and vectors in Elasticsearch and apply semantic reranking on top N results to improve precision without latency blowup.

### 15.2 Schema and Indexing Foundations
- Normalise upstream (lowercase, diacritics, language-specific tokenisation); use language analyzers and ICU plugins for CJK/complex languages.
- Build synonym sets with `synonym_graph` for multi-word phrases (for example `nyc <-> new york city`); derive synonyms from search logs, not guesses.
- Separate facet/filter fields (numeric/keyword) from full-text fields; mark facets explicitly (Typesense) and use aggregations in Elasticsearch.
- Leave BM25 defaults (k1 ~ 1.2, b ~ 0.75) until data indicates otherwise.

### 15.3 Faceted Search
**UX**
- Show relevant facets (popularity/coverage), allow multi-select, display counts, and offer quick reset. Use meaningful labels and ordering.
- Mobile: use an easily toggled drawer/panel; desktop: left column or top bar depending on layout.
- Provide productive "No results" states (suggest adjacent categories, alternate queries, filter reset).

**Implementation**
- Elasticsearch: use aggregations for facets; apply post-filter when counts must ignore active filters.
- Typesense: mark fields as facets in the schema; use `facet_by` and `facet_query` for filtering and searching within facets.
- Algolia: configure facets in index settings and leverage replicas for alternate sort strategies (price, rating).

### 15.4 Relevance Tuning
- Lexical core: start with solid BM25; boost high-precision fields (title > tags > body); add freshness or popularity tie-breakers.
- Algolia: tune the ranking criteria and custom ranking (CTR, sales, rating); order `searchableAttributes` by priority.
- Typesense: rely on `_text_match` plus numeric/string ranking; set typo tolerance per field (`num_typos=2,0,0` for phone/zip codes).
- Synonyms must be data-driven: Elasticsearch `synonym_graph`; Algolia `regular/oneWay/placeholder` plus dynamic suggestions when volume justifies it.
- Hybrid/vector (Elastic): combine lexical and embedding queries, rerank top results semantically to improve precision@k while keeping latency stable.

### 15.5 Autocomplete Optimisation
**UX**
- Keep suggestions short and scannable, highlight matches, support keyboard navigation, and show helpful query suggestions. On mobile, surface 3-5 entries, no carousels.
- Avoid full result dumps in the dropdown; prefer query/category/brand suggestions followed by a dedicated results page.

**Implementation**
- Algolia: use Autocomplete with a query suggestions index; constrain length and localise per language.
- Elasticsearch: choose between completion suggester and `search_as_you_type` based on dataset shape.
- Typesense: prefix search works out of the box; tune `drop_tokens_threshold` and `num_typos` to reduce noise.

### 15.6 Search Analytics
- Track search impressions (SERP view), clicks (position, objectID), conversions (add-to-cart, document open), and refinements. In Algolia, send Insights events with `userToken`.
- Monitor zero-results rate, CTR@k, refinement rate, query reformulation rate. Use findings to drive synonyms, rules, and UX changes; avoid dead ends via fallbacks.
- Elastic App Search offers query and click APIs (top queries, click-through, filters).
- Operate a bi-weekly cycle: export top/no-result queries -> evaluate synonyms/rules -> run A/B tests on ranking -> review "no results" UX -> update dictionaries.

### 15.7 Federated Search
- Multi-index (same engine): combine products, categories, suggestions in a unified UI (Algolia supports multi-index).
- Cross-cluster (Elasticsearch): query remote clusters; manage latency, TLS, and trust between clusters.
- Typesense multi-search: send multiple requests in one HTTP call for federated UI or controlled merging.
- UX: group by source with clear headings, consistent highlighting, keyboard navigation, and graceful fallback when a source fails.

## 16. Content Management

### 16.1 Headless CMS (Strapi vs Directus)
- **Strapi**: structured content with Draft & Publish; Review Workflows (Enterprise) for staged approvals; webhooks, lifecycle hooks, and cron jobs for integrations.
- **Directus**: database-first with content versioning, revisions, Flows (automation), and Files as built-in DAM with URL-based transformations.
- Rule of thumb: multi-stage editorial workflow or strong i18n -> Strapi + Review Workflows. Data-centric operations, low-code automation, and DAM needs -> Directus + Flows/Files.

### 16.2 Content Modelling
- Start from content jobs-to-be-done; model content types plus reusable components; separate content from presentation (Strapi guidelines).
- Avoid catch-all JSON blobs in editorial models; plan facet/filter fields (numeric, enum, relations) early.

### 16.3 Versioning and Workflow Automation
- **Strapi**: Draft & Publish protects pre-release work; Review Workflows define stages (for example "Editorial -> Legal -> Publish"). Use webhooks for builds/CDN purge/notifications and cron for scheduled jobs (ensure single execution in clusters).
- **Directus**: Content Versioning (main/promote), Revisions, and Flows (triggers/conditions/actions) deliver no-code automation.

### 16.4 Digital Asset Management
- Strapi Media Library handles assets; integrate Cloudinary (or similar) for transformations/derivatives.
- Directus Files acts as DAM with URL transformations (resize, format, quality) and granular permissions.
- Best practices: consistent naming and metadata (alt text, license, focal point); generate responsive variants; serve assets from CDN with strong caching.

### 16.5 Content Delivery Optimisation
- Use explicit Cache-Control headers: versioned static assets with high `max-age` + `immutable`; dynamic responses with `no-cache` + ETag for efficient validation.
- Enable Brotli/Gzip compression (prefer Brotli when available).
- Next.js: leverage ISR (time-based or on-demand) and `<Image>` optimisation/CDN loaders.
- GraphQL: stable IDs enable client caching; enforce rate limits, consistent pagination, and persisted queries where appropriate.

## 15.x / 16.x Operational Snippets

### Elasticsearch Mapping and Relevance
```json
PUT my_index
{
  "settings": {
    "analysis": {
      "filter": {
        "my_synonyms": {
          "type": "synonym_graph",
          "synonyms": ["nyc, new york, new york city"]
        }
      },
      "analyzer": {
        "my_en": {
          "tokenizer": "standard",
          "filter": ["lowercase", "my_synonyms"]
        }
      }
    },
    "similarity": {
      "default": { "type": "BM25", "k1": 1.2, "b": 0.75 }
    }
  },
  "mappings": {
    "properties": {
      "title":   { "type": "text", "analyzer": "my_en" },
      "brand":   { "type": "keyword" },
      "price":   { "type": "float" },
      "category":{ "type": "keyword" }
    }
  }
}
```
- Facets: terms or range aggregations; use `post_filter` when counts should ignore active filters.
- Autocomplete: completion suggester or `search_as_you_type` based on dataset.
- Hybrid: run lexical and vector queries, merge, then rerank top K semantically.

### Algolia Essential Settings
```js
index.setSettings({
  searchableAttributes: ["title", "brand", "categories", "description"],
  customRanking: ["desc(popularity)", "desc(rating)", "asc(price)"],
  attributesForFaceting: ["filterOnly(categories)", "brand", "price_range"],
  queryLanguages: ["en", "it"],
  ignorePlurals: true
})
```
- Ranking uses eight criteria plus custom ranking signals.
- Query Suggestions: build a dedicated index and hook into Autocomplete.
- Events (Insights): `aa('init', { userToken })`, `aa('clickedObjectIDsAfterSearch', ...)`, `aa('convertedObjectIDsAfterSearch', ...)`.

### Typesense Schema and Query
```json
POST /collections
{
  "name": "products",
  "fields": [
    {"name":"id","type":"string"},
    {"name":"title","type":"string"},
    {"name":"brand","type":"string","facet":true},
    {"name":"price","type":"float","facet":true},
    {"name":"categories","type":"string[]","facet":true},
    {"name":"popularity","type":"int32"}
  ],
  "default_sorting_field": "popularity"
}
```
Query example:
```
q=running shoes
query_by=title,categories
facet_by=brand,categories,price
sort_by=_text_match:desc,popularity:desc
num_typos=2,0
```
- Deterministic ranking via `_text_match` plus fields; tune typos per field; declare facets explicitly.
- Multi-search sends multiple queries in a single call for federated UI.

## Checklists

### Search Health (Weekly)
- Zero-results rate under 10 percent (otherwise add synonyms/rules).
- CTR@5 stable or improving (Algolia Insights/App Search analytics).
- "No results" page offers alternative categories and filter reset.
- Facets ordered by usefulness with clear labels.

### Autocomplete Readiness
- Maximum 5-8 suggestions, highlighting active, keyboard navigation supported.
- Query suggestions enabled for trending and recent searches.
- Mobile: suggestions rather than full results inside dropdown.

### CMS Delivery
- Strapi: Draft & Publish for public types; Review Workflows (Enterprise) when needed.
- Directus: Content Versioning/Flows configured where collaboration requires automation.
- Webhooks trigger static builds or CDN purge on publish.
- Assets served via CDN with appropriate Cache-Control (immutable for versioned files).

## Appendix

### A1. No Results Degradation Flow
1. Remove stop words and rare terms.
2. Apply synonyms.
3. Broaden match (prefix or typo tolerance).
4. Show related categories and reset filters.

### A2. Static Asset Caching Header
```
Cache-Control: public, max-age=31536000, immutable
```
Ensure filenames include content hashes for cache busting.

### A3. Dynamic Pages
```
Cache-Control: no-cache, must-revalidate
ETag: "..."
```
For Next.js, use ISR (time-based or on-demand).

## FAQ
- **Can I force price ranking without rebuilding indices?** Algolia: replicas; Typesense: `sort_by`; Elasticsearch: sort on non-analyzed field.
- **Do we need hybrid semantic search for e-commerce/catalog?** Often not for head queries, but useful for long-tail or knowledge bases. In Elasticsearch, try hybrid + rerank on top N.

## Style Notes
- No "magic" boosts; each adjustment needs a KPI and A/B validation.
- Synonyms come from logs, not guesswork.
- Autocomplete guides users; noisy suggestions train bad habits.

---

If you want this playbook wrapped in additional repo scaffolding (TOC, numbered headings), say the word.
