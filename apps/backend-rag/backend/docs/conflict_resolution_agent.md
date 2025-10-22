# Conflict Resolution Agent - Phase 3

## Overview

The **Conflict Resolution Agent** automatically detects and resolves contradictions when querying multiple ChromaDB collections, ensuring users always get the most accurate and up-to-date information.

## Implementation

**Files Modified:**
- `services/search_service.py` - Added 4 new methods + conflict tracking
- `services/query_router.py` - Enhanced with confidence scoring (Phase 1.1)

## Key Features

### 1. Multi-Collection Search with Fallback Chains

When confidence is low, the system automatically searches multiple collections:

```python
# Example: Low confidence query "tax"
Primary: tax_knowledge (confidence=0.50)
Fallbacks: [tax_updates, legal_architect, kbli_eye]

# Result: Searches all 4 collections in parallel
```

### 2. Conflict Detection

Detects conflicts between collection pairs:
- `tax_knowledge` vs `tax_updates`
- `legal_architect` vs `legal_updates`
- `property_knowledge` vs `property_listings`

**Conflict Indicators:**
- Same topic, different information
- Temporal conflicts (base vs updates collection)
- Semantic conflicts (different perspectives)

### 3. Conflict Resolution Strategy

**Priority Order:**
1. **Timestamp Priority**: `*_updates` collections always win over base collections
2. **Recency**: Newer timestamps win
3. **Relevance**: Higher semantic scores win if timestamps equal

**Transparency:**
- Winning results marked as "preferred"
- Losing results marked as "outdated" or "alternate"
- Scores adjusted (loser * 0.7) to deprioritize
- Both results returned with metadata

### 4. Conflict Resolution Example

```python
Scenario: Query "PPh 23 tax rate"
Collections searched: [tax_knowledge, tax_updates]

tax_knowledge result:
  Text: "PPh 23 rate is 2% (effective Jan 2023)"
  Score: 0.85

tax_updates result:
  Text: "New regulation: PPh 23 rate increased to 3% (effective Oct 2024)"
  Score: 0.82

Conflict detected: temporal (tax_knowledge vs tax_updates)

Resolution:
  Winner: tax_updates (temporal_priority)
  Loser: tax_knowledge (marked as "outdated")

Final results:
  [0] tax_updates: "New regulation..." (score=0.82, preferred)
  [1] tax_knowledge: "PPh 23 rate..." (score=0.60, outdated)
```

## API Methods

### `search_with_conflict_resolution()`

Enhanced search with automatic conflict detection and resolution.

**Parameters:**
```python
query: str                    # Search query
user_level: int              # Access level (0-3)
limit: int = 5               # Max results per collection
tier_filter: Optional        # Tier filter (for zantara_books)
enable_fallbacks: bool = True  # Use fallback chains
```

**Returns:**
```python
{
  "query": "tax rate PPh 23",
  "results": [...],          # Merged & resolved results
  "primary_collection": "tax_knowledge",
  "collections_searched": ["tax_knowledge", "tax_updates"],
  "confidence": 0.50,
  "conflicts_detected": 1,
  "conflicts": [             # Detailed conflict reports
    {
      "collections": ["tax_knowledge", "tax_updates"],
      "type": "temporal",
      "resolution": {
        "winner": "tax_updates",
        "loser": "tax_knowledge",
        "reason": "temporal_priority (updates collection)"
      }
    }
  ],
  "fallbacks_used": true
}
```

### `get_conflict_stats()`

Get conflict resolution statistics.

**Returns:**
```python
{
  "total_multi_collection_searches": 150,
  "conflicts_detected": 23,
  "conflicts_resolved": 23,
  "timestamp_resolutions": 18,
  "semantic_resolutions": 5,
  "conflict_rate": "15.3%",
  "resolution_rate": "100.0%"
}
```

## Usage in intelligent_router.py

The intelligent router can optionally use conflict resolution:

```python
# Option 1: Standard search (single collection)
search_results = await self.search.search(
    query=message,
    user_level=3,
    limit=10
)

# Option 2: Search with conflict resolution (multi-collection)
search_results = await self.search.search_with_conflict_resolution(
    query=message,
    user_level=3,
    limit=5,
    enable_fallbacks=True
)
```

## Benefits

### For Users
- ✅ Always get most up-to-date information
- ✅ Transparency when conflicts exist
- ✅ Access to alternate perspectives
- ✅ No manual collection selection needed

### For System
- ✅ Automatic conflict detection
- ✅ Consistent resolution strategy
- ✅ Detailed logging and metrics
- ✅ Fallback to simple search if error

## Testing

### Manual Test (requires ChromaDB)

```bash
# Start backend
cd /home/user/nuzantara/apps/backend-rag/backend
python -m app.main_cloud

# Test endpoint (if exposed)
POST /search/conflict-resolution
{
  "query": "tax regulation updates",
  "user_level": 3,
  "limit": 5
}
```

### Expected Behavior

**High Confidence Query** (e.g., "KITAS visa requirements"):
- Searches 1 collection only (visa_oracle)
- No conflicts
- Fast response

**Medium Confidence Query** (e.g., "tax"):
- Searches 2 collections (tax_knowledge + fallback)
- Possible conflicts
- Automatic resolution

**Low Confidence Query** (e.g., "business"):
- Searches 4 collections (primary + 3 fallbacks)
- Higher chance of conflicts
- Comprehensive results

## Metrics

Track via `get_conflict_stats()`:

```python
from services.search_service import SearchService

search_service = SearchService()

# After some queries...
stats = search_service.get_conflict_stats()
print(f"Conflict rate: {stats['conflict_rate']}")
print(f"Timestamp resolutions: {stats['timestamp_resolutions']}")
```

## Future Enhancements

### Phase 4 (Planned):
1. **Semantic Conflict Detection**: Use LLM to detect semantic contradictions
2. **User Preference Learning**: Learn which sources user trusts more
3. **Confidence Calibration**: Auto-adjust confidence thresholds based on accuracy
4. **Admin Dashboard**: Visualize conflicts and resolution patterns

### Phase 5 (Planned):
1. **Automated Conflict Alerts**: Notify admins when conflicts detected
2. **Collection Health Integration**: Flag stale collections causing conflicts
3. **A/B Testing**: Test different resolution strategies
4. **Feedback Loop**: User corrections improve resolution logic

## Architecture Diagram

```
User Query: "tax regulation"
       ↓
QueryRouter.route_with_confidence()
       ↓
   confidence = 0.50 (medium)
       ↓
Fallback Chain: [tax_knowledge, tax_updates]
       ↓
SearchService.search_with_conflict_resolution()
       ↓
   ┌─────────────────────┬─────────────────────┐
   │  tax_knowledge      │   tax_updates       │
   │  Search (parallel)  │   Search (parallel) │
   └──────────┬──────────┴──────────┬──────────┘
              │                     │
              └──────────┬──────────┘
                         ↓
              detect_conflicts()
                         ↓
           Conflict: temporal (updates vs base)
                         ↓
              resolve_conflicts()
                         ↓
           Winner: tax_updates (priority)
           Loser: tax_knowledge (flagged outdated)
                         ↓
              Merged Results
              [preferred, outdated]
                         ↓
              Return to user
```

## Statistics Summary

After implementation, expected metrics:
- **Fallback usage**: ~40-60% of queries
- **Conflict detection**: ~15-20% of multi-collection searches
- **Timestamp resolution**: ~70-80% of conflicts
- **Semantic resolution**: ~20-30% of conflicts
- **Resolution success**: ~100%

## Logging Examples

```
🎯 [Conflict Resolution] Primary: tax_knowledge (confidence=0.50), Total collections: 2
   ✓ tax_knowledge: 5 results (top score: 0.85)
   ✓ tax_updates: 3 results (top score: 0.82)
⚠️ [Conflict Detected] tax_knowledge vs tax_updates - scores: 0.85 vs 0.82
✅ [Conflict Resolved] tax_updates (preferred) > tax_knowledge - reason: temporal_priority
```

## Configuration

Conflict pairs are hardcoded but can be extended:

```python
# In SearchService.detect_conflicts()
conflict_pairs = [
    ("tax_knowledge", "tax_updates"),
    ("legal_architect", "legal_updates"),
    ("property_knowledge", "property_listings"),
    ("tax_genius", "tax_updates"),
    # Add more pairs as collections grow
]
```

## Integration with Other Agents

**Works With:**
- ✅ Smart Fallback Chain Agent (Phase 1.1)
- ✅ Intelligent Router (existing)
- 🔜 Cross-Oracle Synthesis Agent (Phase 2.1)
- 🔜 Autonomous Research Agent (Phase 4.2)

**Enables:**
- More reliable multi-agent queries
- Better handling of edge cases
- Transparent information quality

---

**Status**: ✅ IMPLEMENTED (Phase 3)
**Last Updated**: 2025-10-22
**Author**: Claude + Balizero1987
