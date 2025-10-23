---
name: diagram-manager
description: Manage Mermaid diagrams - extract from docs, generate PNGs, update on changes
---

# Diagram Manager Skill

Automatically manage all Mermaid diagrams in the Galaxy Map documentation.

## When to Invoke

**Auto-invoke when:**
- User modifies any `.md` file in `docs/galaxy-map/`
- User asks to "update diagrams", "regenerate diagrams", "view diagrams"
- User adds new Mermaid diagrams to documentation
- Architecture documentation changes (triggers after architecture-mapper)
- User asks "how do I view diagrams locally"

**User triggers:**
- "Update the diagrams"
- "Generate diagram PNGs"
- "I can't see the diagrams"
- "Extract diagrams from docs"
- "Show me the visual diagrams"

## Core Functions

### 1. Extract Diagrams from Markdown

```bash
python3 scripts/extract_mermaid.py
```

**What it does:**
- Scans all `.md` files in `docs/galaxy-map/`
- Extracts all ` ```mermaid ... ``` ` blocks
- Saves to individual `.mmd` files in `docs/galaxy-map/diagrams/`
- Names: `{source-file}-{index}.mmd`

**Example output:**
```
docs/galaxy-map/diagrams/
├── README-01.mmd
├── 01-system-overview-01.mmd
├── 02-technical-architecture-01.mmd
...
```

### 2. Generate PNG Images

```bash
# Option A: Automatic (installs CLI if needed)
python3 scripts/view_diagrams.py

# Option B: Manual
cd docs/galaxy-map/diagrams
for f in *.mmd; do
  mmdc -i "$f" -o "${f%.mmd}.png" -b transparent
done
```

**Requirements:**
- Installs `@mermaid-js/mermaid-cli` via npm if not present
- Generates high-quality PNG with transparent background
- Only regenerates if `.mmd` newer than `.png` (incremental)

### 3. View Diagrams Locally

Recommend to user based on their setup:

**VS Code users:**
```bash
code --install-extension shd101wyy.markdown-preview-enhanced
# Then: Cmd+Shift+V to preview any .md with diagrams
```

**Obsidian users:**
- Open `~/NUZANTARA-RAILWAY` as vault
- Navigate to `docs/galaxy-map/`
- Diagrams render natively ✨

**PNG viewers:**
```bash
python3 scripts/view_diagrams.py
# Generates PNGs and opens in default viewer
```

## Workflow Integration

### After Documentation Changes

When `architecture-mapper` skill runs:

```bash
# 1. Architecture mapper updates .md files
# 2. Auto-trigger diagram-manager
python3 scripts/extract_mermaid.py

# 3. If PNGs exist, regenerate
if [ -f docs/galaxy-map/diagrams/*.png ]; then
  cd docs/galaxy-map/diagrams
  for f in *.mmd; do
    mmdc -i "$f" -o "${f%.mmd}.png" -b transparent
  done
fi

# 4. Commit if changes
git add docs/galaxy-map/diagrams/
git commit -m "docs: update diagrams after architecture changes"
```

### Watch Mode (Future Enhancement)

```bash
# TODO: Create watch_diagrams.sh
# Watch docs/galaxy-map/*.md for changes
# Auto-extract and regenerate on save
```

## User Guidance

### First-Time Setup

When user first asks about diagrams:

1. **Explain options:**
   ```
   You have 24 Mermaid diagrams in your Galaxy Map docs!

   3 ways to view them locally:

   ⭐ BEST: VS Code + Markdown Preview Enhanced
      - Install: code --install-extension shd101wyy.markdown-preview-enhanced
      - Open any .md file
      - Press Cmd+Shift+V
      - See all diagrams rendered instantly!

   🖼️ PNG Images:
      - Run: python3 scripts/view_diagrams.py
      - Generates PNG for each diagram
      - Opens in your default image viewer

   📝 Obsidian:
      - Free app: https://obsidian.md
      - Open ~/NUZANTARA-RAILWAY as vault
      - Navigate to docs/galaxy-map/
      - Native Mermaid rendering + Graph View!
   ```

2. **Run extraction:**
   ```bash
   python3 scripts/extract_mermaid.py
   # Extracts 24 diagrams to .mmd files
   ```

3. **Offer to generate PNGs:**
   ```
   Would you like me to generate PNG images now?
   This requires: npm install -g @mermaid-js/mermaid-cli
   ```

### Ongoing Usage

**User modifies docs:**
```
I see you updated 03-ai-intelligence.md.
Shall I regenerate the diagrams?
```

**Auto-run after architecture changes:**
```
Architecture documentation updated!
Regenerating diagrams...
✅ Extracted 24 diagrams
✅ Updated 3 PNGs (incremental)
```

## File Locations

```
docs/galaxy-map/
├── README.md                    # Contains 1 diagram
├── 01-system-overview.md        # Contains 3 diagrams
├── 02-technical-architecture.md # Contains 3 diagrams
├── 03-ai-intelligence.md        # Contains 8 diagrams
├── 04-data-flows.md             # Contains 5 diagrams
├── 05-database-schema.md        # Contains 4 diagrams
└── diagrams/
    ├── README.md                # Viewing guide
    ├── *.mmd                    # 24 extracted diagrams
    └── *.png                    # 24 generated images (optional)

scripts/
├── extract_mermaid.py          # Extract diagrams from .md
├── view_diagrams.py            # Generate & view PNGs
└── generate-diagrams.sh        # Bash wrapper
```

## Diagram Statistics

After extraction, report to user:

```
📊 Galaxy Map Diagrams Extracted!

Total: 24 diagrams from 6 documents

Breakdown:
├── README.md: 1 diagram
├── 01-system-overview.md: 3 diagrams
├── 02-technical-architecture.md: 3 diagrams
├── 03-ai-intelligence.md: 8 diagrams (most visual!)
├── 04-data-flows.md: 5 diagrams
└── 05-database-schema.md: 4 diagrams

Types:
├── Architecture (graph TB/LR): 10
├── Sequence (sequenceDiagram): 5
├── Flow (flowchart): 6
└── State (stateDiagram): 3

Size: ~14KB total (.mmd files)
```

## Error Handling

**Mermaid CLI not installed:**
```
⚠️  Mermaid CLI not found

To generate PNGs, install:
npm install -g @mermaid-js/mermaid-cli

OR use VS Code preview (no install needed):
code --install-extension shd101wyy.markdown-preview-enhanced
```

**Invalid Mermaid syntax:**
```
❌ Error generating diagram from 03-ai-intelligence-02.mmd
Syntax error at line 5

Please check the Mermaid syntax:
https://mermaid.live/edit

Or validate in VS Code preview first.
```

**No diagrams found:**
```
⚠️  No Mermaid diagrams found in docs/galaxy-map/

Check that .md files contain:
\`\`\`mermaid
graph TB
    ...
\`\`\`
```

## Best Practices

### For Users

1. **Daily work:** Use VS Code preview (fastest, real-time)
2. **Presentations:** Generate PNGs (high quality, portable)
3. **External docs:** Use PNGs or GitHub rendering
4. **Collaboration:** Commit both .md and .mmd (not PNGs unless needed)

### For Claude

1. **Auto-extract after architecture changes**
2. **Don't commit PNGs by default** (can be generated on-demand)
3. **Validate Mermaid syntax** before committing
4. **Incremental regeneration** (check timestamps)

## Integration with Other Skills

**architecture-mapper → diagram-manager**
```
1. architecture-mapper updates .md files
2. Triggers diagram-manager
3. diagram-manager extracts new diagrams
4. Optional: regenerate PNGs if they exist
```

**test-suite → diagram-manager**
```
# After generating test reports with diagrams
python3 scripts/extract_mermaid.py
# Extracts test flow diagrams
```

## Success Criteria

After running diagram-manager:

✅ All Mermaid blocks extracted from .md files
✅ One .mmd file per diagram in diagrams/
✅ README.md in diagrams/ explains viewing options
✅ User knows how to view diagrams locally
✅ (Optional) PNGs generated if requested
✅ No broken Mermaid syntax
✅ Diagrams render correctly in VS Code/GitHub

## Performance

**Fast operations (< 1s):**
- Extract diagrams with Python script
- Check for existing PNGs

**Medium operations (5-10s):**
- Generate 24 PNGs (first time)
- Install mermaid-cli

**Slow operations (> 10s):**
- Large diagrams (>200 lines)
- Complex sequence diagrams

**Optimization:**
- Incremental PNG generation (only changed diagrams)
- Cache mermaid-cli installation check
- Parallel PNG generation (future)

## Commands Cheatsheet

```bash
# Extract all diagrams
python3 scripts/extract_mermaid.py

# Generate PNGs (auto-install if needed)
python3 scripts/view_diagrams.py

# Generate PNGs manually
cd docs/galaxy-map/diagrams
for f in *.mmd; do mmdc -i "$f" -o "${f%.mmd}.png" -b transparent; done

# View in VS Code
code docs/galaxy-map/README.md
# Then: Cmd+Shift+V

# Count diagrams
ls docs/galaxy-map/diagrams/*.mmd | wc -l

# Check diagram sizes
ls -lh docs/galaxy-map/diagrams/*.mmd | awk '{sum+=$5; print $5, $9} END {print "Total:", sum}'
```

---

**This skill ensures users can ALWAYS view their Mermaid diagrams locally, regardless of their setup!** 🎨
