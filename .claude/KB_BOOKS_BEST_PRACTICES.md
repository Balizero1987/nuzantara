# 📚 KB Books Best Practices - Zantara Library

> **Research Date**: 2025-10-03
> **Current Collection**: `zantara_books` (12,907 docs, 214 books)
> **Purpose**: Optimize book organization, metadata, and chunking for RAG

---

## 🎯 Executive Summary

**Current State**: 214 libri (filosofia, ML, Shakespeare, etc.), 12,907 chunks
**Issue**: Metadata probabilmente minimale, chunking non ottimizzato per struttura libri
**Goal**: Apply library science best practices + RAG optimization

---

## 📖 Table of Contents

1. [Library Metadata Standards](#metadata)
2. [Book Classification Systems](#classification)
3. [RAG Chunking for Books](#chunking)
4. [Recommendations for Zantara](#recommendations)

---

## 1. Library Metadata Standards {#metadata}

### Dublin Core (Standard per Digital Libraries)

**15 Core Elements** (tutti applicabili ai libri):

```json
{
  "@context": "http://purl.org/dc/elements/1.1/",
  "dc:title": "The Republic",
  "dc:creator": "Plato",
  "dc:contributor": "Translator: Benjamin Jowett",
  "dc:publisher": "Oxford University Press",
  "dc:date": "380 BC (this edition: 1888)",
  "dc:language": "en",
  "dc:format": "application/pdf",
  "dc:type": "Text/Book",
  "dc:subject": [
    "Philosophy",
    "Political Theory",
    "Justice",
    "Ancient Greek Philosophy"
  ],
  "dc:description": "Plato's dialogue on justice, the ideal state, and the nature of the good",
  "dc:identifier": "ISBN:978-0-19-953736-9",
  "dc:source": "Project Gutenberg",
  "dc:relation": "Part of Plato's Dialogues series",
  "dc:coverage": "Ancient Greece, 4th century BC",
  "dc:rights": "Public Domain"
}
```

**Mandatory for Zantara Books**:
- `dc:title`, `dc:creator`, `dc:subject`, `dc:type`, `dc:language`
- `dc:identifier` (ISBN or unique ID)
- `dc:date` (publication year)

**Recommended**:
- `dc:publisher`, `dc:description`
- `dc:subject` (multiple tags)
- `dc:format` (PDF, EPUB, TXT)

---

### Extended Metadata (Library-Specific)

**Book-Specific Fields**:
```json
{
  "book_type": "monograph | edited_volume | textbook | reference | fiction | non_fiction",
  "pages": 432,
  "chapters": 10,
  "edition": "3rd Edition",
  "series": "Oxford World's Classics",
  "volume": "Vol. 1",
  "original_language": "Ancient Greek",
  "translation_year": 1888,
  "dewey_decimal": "320.01",
  "lc_classification": "JC71.P6",
  "reading_level": "graduate | undergraduate | general",
  "word_count": 125000
}
```

**RAG-Specific Metadata**:
```json
{
  "chunk_strategy": "hierarchical | semantic | chapter_based",
  "embedding_model": "text-embedding-3-small",
  "chunk_size_avg": 1200,
  "total_chunks": 145,
  "index_date": "2025-01-15",
  "quality_tier": "S | A | B | C | D"
}
```

---

## 2. Book Classification Systems {#classification}

### Dewey Decimal Classification (DDC)

**Main Classes** (applicabili ai 214 libri):

```
000 - Computer Science, Information & General Works
  004 - Data processing & computer science
  006 - Special computer methods (AI, ML)

100 - Philosophy & Psychology
  110 - Metaphysics
  120 - Epistemology
  140 - Philosophical schools
  150 - Psychology

200 - Religion

300 - Social Sciences
  320 - Political science
  330 - Economics

400 - Language

500 - Science
  510 - Mathematics
  530 - Physics
  570 - Life sciences

600 - Technology
  610 - Medicine
  620 - Engineering

700 - Arts & Recreation

800 - Literature
  810 - American literature
  820 - English literature

900 - History & Geography
```

**Augmented Dublin Core with DDC**:
Research shows auto-tagging books with DDC from Dublin Core metadata:
- Extract weighted key terms from `title`, `description`, `subject`
- Match against DDC entry vocabulary
- Aggregate within DDC hierarchies
- Mean Reciprocal Ranking (MRR) for validation

---

### Subject Taxonomy (Custom for Zantara)

**Proposed Hierarchy** (based on 214 books):

```
zantara_books/
├── philosophy/
│   ├── ancient/
│   │   ├── plato/ (The Republic, Symposium, etc.)
│   │   ├── aristotle/ (Ethics, Politics, etc.)
│   │   └── stoicism/
│   ├── modern/
│   │   ├── kant/
│   │   ├── nietzsche/
│   │   └── existentialism/
│   └── political-philosophy/
│
├── computer-science/
│   ├── artificial-intelligence/
│   │   ├── machine-learning/
│   │   │   ├── deep-learning/
│   │   │   ├── nlp/
│   │   │   └── reinforcement-learning/
│   │   └── neural-networks/
│   ├── algorithms/
│   └── data-structures/
│
├── literature/
│   ├── shakespeare/
│   │   ├── tragedies/ (Hamlet, Macbeth, etc.)
│   │   ├── comedies/
│   │   └── histories/
│   ├── poetry/
│   └── prose/
│
├── mathematics/
│   ├── statistics/
│   ├── calculus/
│   └── linear-algebra/
│
└── science/
    ├── physics/
    ├── biology/
    └── chemistry/
```

**Naming Convention**: `category/subcategory/author/book-title`

---

## 3. RAG Chunking for Books {#chunking}

### Hierarchical Chunking (RECOMMENDED for Books)

**Why Hierarchical?**
- Books have natural structure: Book → Part → Chapter → Section → Paragraph
- Preserves context at multiple granularity levels
- Query can retrieve at appropriate level (chapter summary vs specific paragraph)

**Implementation**:

```python
# Level 1: Book metadata (top-level)
{
  "level": "book",
  "id": "plato-republic-book",
  "title": "The Republic",
  "author": "Plato",
  "summary": "Plato's dialogue on justice and the ideal state",
  "metadata": {/* Dublin Core */}
}

# Level 2: Chapters/Parts
{
  "level": "chapter",
  "id": "plato-republic-ch1",
  "parent_id": "plato-republic-book",
  "chapter_number": 1,
  "title": "Book I: The Question of Justice",
  "summary": "Socrates debates the nature of justice with Cephalus and Thrasymachus",
  "chunk_size": 5000  # characters
}

# Level 3: Sections
{
  "level": "section",
  "id": "plato-republic-ch1-sec2",
  "parent_id": "plato-republic-ch1",
  "section_title": "Thrasymachus' Challenge",
  "chunk_size": 1500
}

# Level 4: Paragraphs (embedded chunks)
{
  "level": "paragraph",
  "id": "plato-republic-ch1-sec2-p3",
  "parent_id": "plato-republic-ch1-sec2",
  "text": "Then Thrasymachus said...",
  "embedding": [0.123, 0.456, ...],
  "chunk_size": 300
}
```

**Retrieval Strategy**:
1. Query: "What is justice according to Plato?"
2. Semantic search finds Level 4 paragraph
3. Return: Paragraph + parent section + parent chapter (context hierarchy)
4. LLM receives: Full context chain from Book → Chapter → Section → Paragraph

---

### Chapter-Based Chunking (Alternative)

**When to Use**: Books with clear chapter divisions, no deep hierarchy

**Strategy**:
```python
# Split on chapter markers
chapter_markers = [
  "Chapter 1", "Chapter 2",
  "Book I", "Book II",
  "Part One", "Part Two"
]

# Chunk size: 1 chapter = 1-3 chunks (depending on chapter length)
# Target: 1000-1500 characters per chunk, 15% overlap

# Example: "The Republic" Book I (5000 chars) → 4 chunks
chunks = [
  {"id": "ch1-p1", "text": "...", "char_range": "0-1200"},
  {"id": "ch1-p2", "text": "...", "char_range": "1020-2220"},  # 180 char overlap
  {"id": "ch1-p3", "text": "...", "char_range": "2040-3240"},
  {"id": "ch1-p4", "text": "...", "char_range": "3060-5000"}
]
```

**Metadata per Chunk**:
```json
{
  "chunk_id": "plato-republic-ch1-p1",
  "book_title": "The Republic",
  "author": "Plato",
  "chapter": 1,
  "chapter_title": "Book I: The Question of Justice",
  "chunk_index": 1,
  "total_chunks_in_chapter": 4,
  "char_start": 0,
  "char_end": 1200,
  "keywords": ["justice", "Socrates", "Thrasymachus"]
}
```

---

### Semantic Chunking (For Unstructured Books)

**When to Use**: Literature, poetry, books without clear chapter structure

**Strategy**:
- Use sentence embeddings to detect topic shifts
- Split when semantic similarity drops below threshold (e.g., 0.7 cosine similarity)
- Preserve narrative flow (don't split mid-dialogue)

**Example (Shakespeare)**:
```python
# Detect scene changes semantically
scenes = semantic_split(
  text="Act 1 Scene 1... Act 1 Scene 2...",
  similarity_threshold=0.7
)

# Each scene = 1-2 chunks
# Metadata includes: play, act, scene, characters
```

---

### Keyword-Based Chunking (For Technical Books)

**When to Use**: Textbooks, reference books with consistent markers

**Markers**:
- "Chapter", "Section", "Introduction", "Conclusion", "Summary"
- "Definition:", "Theorem:", "Example:", "Exercise:"

**Example (ML Textbook)**:
```python
markers = [
  "Chapter \d+",           # Chapter 1, Chapter 2
  "Section \d+\.\d+",      # Section 1.1, 1.2
  "Definition \d+\.\d+",   # Definition 1.1
  "Theorem \d+\.",         # Theorem 1.
]

# Split on markers, create hierarchy
```

---

## 4. Recommendations for Zantara {#recommendations}

### Current State Analysis (Assumptions)

**Zantara Books Collection** (`zantara_books`):
- 214 libri
- 12,907 chunks (avg 60 chunks/book)
- Avg chunk size: ~1000-1500 chars (stimato)
- Metadata: Probabilmente minimale (title, maybe author)
- Chunking: Probabilmente fixed-size (non hierarchical)

**Issues Probabili**:
1. ❌ No Dublin Core metadata
2. ❌ No subject classification (DDC, custom taxonomy)
3. ❌ No hierarchical structure (book → chapter → section)
4. ❌ No chapter/section metadata in chunks
5. ❌ Fixed-size chunking (breaks mid-sentence, mid-chapter)

---

### Recommended Improvements

#### Phase 1: Metadata Enhancement (2-3h)

**Step 1: Extract Book List**
```bash
# Download ChromaDB from GCS
gsutil -m rsync -r gs://nuzantara-chromadb-2025/chroma_db/ /tmp/chromadb_download/

# Extract unique books
python3 tools/analyze_books.py --extract-books

# Output: books_list.csv (214 books with metadata)
# Columns: title, author (if available), chunk_count, total_chars
```

**Step 2: Enrich Metadata**
```python
# For each book:
# 1. Use GPT-4 to infer metadata from title/content
# 2. Add Dublin Core fields
# 3. Add DDC classification
# 4. Add subject tags

# Example prompt:
"""
Book title: "The Republic"
Sample text: "Then Thrasymachus said..."

Generate Dublin Core metadata:
- dc:creator (author)
- dc:subject (3-5 subjects)
- dc:description (2-sentence summary)
- dc:date (publication year, original)
- dewey_decimal (3-digit DDC)
- book_type (monograph, fiction, etc.)
"""
```

**Step 3: Create Metadata Database**
```bash
# Store in: metadata/books_metadata.json
# Format: Dublin Core + extended fields
# Auto-tag all 12,907 chunks with parent book metadata
```

**Output**: Every chunk has full Dublin Core metadata

---

#### Phase 2: Taxonomy Classification (1-2h)

**Step 1: Auto-Classify Books**
```python
# Use DDC + custom Zantara taxonomy
categories = {
  "philosophy": ["plato", "aristotle", "kant", "nietzsche"],
  "computer-science/machine-learning": ["neural network", "deep learning", "NLP"],
  "literature/shakespeare": ["hamlet", "macbeth", "romeo"],
  "mathematics": ["calculus", "statistics", "algebra"]
}

# Classify each book → assign to taxonomy path
```

**Step 2: Create Collection Tags**
```python
# Tag chunks with taxonomy path
chunk_metadata = {
  "taxonomy_path": "philosophy/ancient/plato",
  "taxonomy_level1": "philosophy",
  "taxonomy_level2": "ancient",
  "taxonomy_level3": "plato",
  "dewey_decimal": "180",
  "subject_tags": ["justice", "political_theory", "ethics"]
}
```

**Output**: Books organized in 5-7 top-level categories

---

#### Phase 3: Re-Chunking (Optional, 4-6h)

**Decision**: Re-chunk con hierarchical strategy?

**Pros**:
- ✅ Preserves book structure (chapter → section → paragraph)
- ✅ Better context for RAG retrieval
- ✅ Query can retrieve at appropriate granularity

**Cons**:
- ❌ Requires original book files (not just ChromaDB)
- ❌ Time-intensive (re-embed 12,907 chunks)
- ❌ Need chapter detection (AI-assisted or manual)

**Recommendation**: **Skip for now** (Phase 1-2 sufficient)
- Current fixed-size chunking works if metadata is good
- Re-chunking can be Phase 4 (later improvement)

---

#### Phase 4: Quality Tiering (1h)

**Classify books by quality/relevance to Zantara**:

```python
tiers = {
  "S": "Core references (frequently queried)",
  "A": "Important (domain-specific)",
  "B": "Useful (general knowledge)",
  "C": "Supplementary",
  "D": "Archive (rarely accessed)"
}

# Example:
# S-tier: "Deep Learning" (ML core), "The Republic" (philosophy core)
# A-tier: Domain-specific textbooks
# B-tier: General reference
# C-tier: Older editions, superseded content
# D-tier: Keep for completeness, but deprioritize in search

# Tag each book with tier → chunks inherit tier
```

**Use in RAG**:
- Boost S-tier chunks in ranking (+20% score)
- Derank D-tier chunks (-20% score)
- User queries preferentially retrieve S/A tier

---

### Implementation Checklist

**Week 1: Metadata & Classification**
- [ ] Download ChromaDB from GCS
- [ ] Extract 214 book list
- [ ] AI-generate Dublin Core metadata (GPT-4 batch)
- [ ] Human review metadata (spot-check 20 books)
- [ ] Apply DDC classification
- [ ] Create custom taxonomy (5-7 categories)
- [ ] Tag all 12,907 chunks with metadata
- [ ] Upload updated ChromaDB to GCS

**Week 2: Quality & Testing**
- [ ] Classify books by tier (S/A/B/C/D)
- [ ] Test search with new metadata
- [ ] Measure improvement (precision@5, recall@10)
- [ ] Document metadata schema
- [ ] Create `BOOKS_METADATA_REPORT.md`

---

### Expected Impact

**Before** (Current):
```python
# Chunk metadata (minimal)
{
  "id": "chunk_1234",
  "text": "Then Thrasymachus said...",
  "book_title": "The Republic"  # maybe
}
```

**After** (Phase 1-2):
```python
# Chunk metadata (enriched)
{
  "id": "plato-republic-chunk-1234",
  "text": "Then Thrasymachus said...",

  # Dublin Core
  "dc:title": "The Republic",
  "dc:creator": "Plato",
  "dc:subject": ["Philosophy", "Political Theory", "Justice"],
  "dc:date": "-380",
  "dc:language": "en",
  "dc:publisher": "Project Gutenberg",

  # Extended
  "dewey_decimal": "320.01",
  "book_type": "monograph",
  "quality_tier": "S",

  # Taxonomy
  "taxonomy_path": "philosophy/ancient/plato",
  "taxonomy_l1": "philosophy",
  "taxonomy_l2": "ancient",
  "taxonomy_l3": "plato",

  # RAG
  "chunk_index": 45,
  "total_chunks": 145,
  "chapter_hint": "Book I"  # if detectable
}
```

**Search Improvement**:
- Query: "What is justice?"
  - Before: Returns random Plato chunks + irrelevant ML chunks
  - After: Filters by subject=["Justice"], tier=S → precise Plato results

- Query: "Explain neural networks"
  - Before: Mixes philosophy + CS chunks
  - After: Filters by taxonomy=computer-science/machine-learning → precise ML results

**Estimated Gain**: +25-35% retrieval accuracy (based on subject filtering + tiering)

---

## 📚 Reference Standards

**Library Science**:
- Dublin Core Metadata Initiative (DCMI)
- Dewey Decimal Classification (DDC)
- Library of Congress Classification (LCC)
- MARC 21 (Machine-Readable Cataloging)
- FRBR (Functional Requirements for Bibliographic Records)

**RAG Best Practices**:
- Hierarchical chunking (Databricks Guide)
- Semantic chunking (Pinecone)
- Chapter-based chunking (custom for books)
- 15% overlap for context preservation

---

## 🎯 Quick Start (For Immediate Implementation)

**Minimal Viable Improvement** (2 hours):

1. **Extract book list** (30 min)
   ```bash
   python3 tools/analyze_chromadb.py --collection zantara_books --extract-books
   ```

2. **AI-generate metadata** (1h)
   ```python
   # Batch GPT-4 API calls for 214 books
   # Generate: author, subject (3 tags), DDC, description
   ```

3. **Apply metadata** (30 min)
   ```python
   # Tag all chunks with parent book metadata
   # Upload to ChromaDB
   ```

**Result**: Basic Dublin Core compliance, subject filtering enabled

---

**Document Version**: 1.0
**Created**: 2025-10-03 02:00 CET
**Author**: Claude Sonnet 4.5 (Session m14)
**Next Review**: After Phase 1-2 implementation
