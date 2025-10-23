---
name: architecture-mapper
description: Automatically update architecture documentation when codebase changes by regenerating dependency graphs, component counts, and Mermaid diagrams
---

# Architecture Documentation Auto-Updater

Use this skill when the user:
- Adds/removes handlers, services, middleware, or agents
- Asks to "update docs", "refresh architecture", or "sync documentation"
- Completes significant features that change architecture
- Before creating PRs with architectural changes
- When you detect that component counts or dependencies have changed

## When to Invoke Automatically

**Auto-invoke when detecting:**
- New files in `apps/backend-ts/src/handlers/`
- New files in `apps/backend-ts/src/services/`
- New agents in `agents/`
- Changes to `core/` orchestration files
- Major refactoring of module structure

**User triggers:**
- "Update the architecture docs"
- "Refresh documentation"
- "Sync architecture diagrams"
- "I added a new handler/service/agent"

## Update Process

### Step 1: Regenerate Dependency Analysis

```bash
# TypeScript backend dependencies
npx madge --json apps/backend-ts/src/index.ts > analysis/deps-current.json

# Count components
find apps/backend-ts/src/handlers -type f -name "*.ts" | wc -l > analysis/handler-count.txt
find apps/backend-ts/src/services -type f -name "*.ts" | wc -l > analysis/service-count.txt
find apps/backend-ts/src/middleware -type f -name "*.ts" | wc -l > analysis/middleware-count.txt

# Extract API endpoints
grep -rn "router\.\(get\|post\|put\|delete\|patch\)" apps/backend-ts/src/routing/ > analysis/endpoints.txt
```

### Step 2: Analyze Changes

Compare current state with documented state:

**Component Counts:**
- Previous handler count vs current
- Previous service count vs current
- New modules detected
- Removed modules detected

**Dependency Changes:**
- New inter-module dependencies
- Removed dependencies
- Changed dependency patterns

**New Flows:**
- New API endpoints requiring sequence diagrams
- New integration points

### Step 3: Update Documentation Files

#### Update `docs/architecture/02-backend-ts-components.md`

**Component Statistics Section:**
```markdown
Total TypeScript Files: ~XXX+
├── Handlers: XX files (was YY)
├── Services: XX files (was YY)
├── Middleware: XX files
...
```

**Handler Module Section:**
- Add new handler modules if created
- Update handler counts per module
- Document new handlers with their dependencies

**Service Section:**
- Add new services to the list
- Update "Most depended-upon services" if changed
- Document new service dependencies

#### Update `docs/architecture/01-overview.md`

**Component Statistics:**
```markdown
| Component | Count | Details |
|-----------|-------|---------|
| **Handler Modules** | XX | Update if changed
| **Total Handlers** | XX+ | Update count
| **Core Services** | XX+ | Update count
...
```

**Mermaid Diagrams:**
- Regenerate high-level architecture diagram if structure changed
- Add new components to system overview
- Update connection arrows for new dependencies

#### Update `docs/architecture/03-oracle-system.md`

If Oracle agents changed:
- Add new agents to the list (currently 5)
- Update agent descriptions
- Regenerate orchestrator diagram
- Update performance metrics if changed

#### Update `docs/architecture/04-data-flow.md`

If new flows added:
- Create sequence diagram for new critical flow
- Add to Table of Contents
- Document performance targets

#### Update `docs/architecture/README.md`

**System Statistics:**
```markdown
Backend TypeScript:
├── Handlers: XX files (Update count)
├── Services: XX files (Update count)
...
```

**Component Index:**
- Add new components to navigation table
- Update links if docs restructured

### Step 4: Regenerate Mermaid Diagrams

**High-Level System Architecture** (01-overview.md):
```mermaid
graph TB
    # Update with new components
    # Add new handler modules
    # Add new services
    # Add new integration points
```

**Component Dependency Map** (02-backend-ts-components.md):
```mermaid
graph LR
    # Regenerate from madge JSON
    # Show new dependencies
    # Highlight critical paths
```

**Oracle System Diagram** (03-oracle-system.md):
```mermaid
# Update if agents added/removed
# Show new orchestration patterns
```

**Sequence Diagrams** (04-data-flow.md):
- Add diagrams for new critical flows
- Update existing flows if components changed

### Step 5: Validate Documentation

**Accuracy Checks:**
- ✅ All file paths reference existing files
- ✅ Component counts match `wc -l` output
- ✅ Dependency information matches madge output
- ✅ Mermaid syntax validates (check with online tool if needed)
- ✅ Links between docs work correctly
- ✅ No broken internal references

**Content Checks:**
- ✅ All new components documented
- ✅ Statistics updated
- ✅ Diagrams reflect current state
- ✅ Performance metrics still accurate
- ✅ API endpoints list complete

### Step 6: Generate Update Summary

Create summary of changes:

```markdown
## Architecture Documentation Updated

### Changes Detected:
- Handlers: XX → YY (+Z new)
- Services: XX → YY (+Z new)
- New modules: [list]
- Removed modules: [list]

### New Components:
1. **handler-name.ts** - Description
   - Module: handlers/module-name/
   - Dependencies: [list]

2. **service-name.ts** - Description
   - Used by: [list of handlers]

### Updated Documentation:
- ✅ docs/architecture/01-overview.md - Updated statistics
- ✅ docs/architecture/02-backend-ts-components.md - Added XX handlers
- ✅ docs/architecture/README.md - Updated counts
- [✅/➖] docs/architecture/03-oracle-system.md - [Updated/No changes]
- [✅/➖] docs/architecture/04-data-flow.md - [Added flow/No changes]

### Diagrams Updated:
- ✅ System architecture diagram
- ✅ Component dependency map
- [✅/➖] Oracle orchestration diagram
- [✅/➖] New sequence diagram for [flow name]

### Validation:
- ✅ All file paths verified
- ✅ Component counts accurate
- ✅ Mermaid syntax valid
- ✅ Links functional
```

### Step 7: Commit Changes

```bash
git add docs/architecture/*.md

git commit -m "docs: update architecture documentation - [summary]

Automated update via architecture-mapper skill:

Changes:
- Handlers: XX → YY
- Services: XX → YY
- [Other changes]

Updated documents:
- [list of updated docs]

Generated from: madge analysis + component counting
Validated: All counts and paths verified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

## Detailed Component Detection

### Detecting New Handlers

```bash
# Get current handler list
find apps/backend-ts/src/handlers -name "*.ts" -not -name "registry.ts" | sort

# Compare with documented handlers in 02-backend-ts-components.md
# Flag any handlers in code but not in docs
```

### Detecting New Services

```bash
# Get current service list
find apps/backend-ts/src/services -name "*.ts" | sort

# Compare with documented services
# Flag undocumented services
```

### Detecting New Dependencies

```bash
# Compare analysis/deps-current.json with previous run
# Identify new import relationships
# Check if new dependencies require documentation update
```

### Detecting New API Endpoints

```bash
# Extract all routes from routing/router.ts
grep -E "router\.(get|post|put|delete|patch)" apps/backend-ts/src/routing/router.ts

# Compare with documented endpoints
# Flag new endpoints needing documentation
```

## Smart Update Decisions

### Minor Changes (Auto-update):
- Component count changes (handlers +1, services +1, etc.)
- New dependencies between existing components
- Updated statistics
- File path corrections

**Action:** Update numbers, regenerate diagrams, commit

### Major Changes (Suggest to user):
- New handler module (11th → 12th module)
- New Oracle agent (6th agent)
- Architectural pattern change
- New integration layer

**Action:** Propose changes, wait for user approval, then update

### Critical Changes (Alert user):
- Breaking changes in core orchestration
- Removal of major components
- Complete restructuring

**Action:** Alert user, discuss implications, then document

## Example Workflow

### Scenario: User adds new handler

**User says:** "I added a payment-handler.ts in handlers/payments/"

**Skill executes:**

1. **Detect:**
   ```bash
   find apps/backend-ts/src/handlers -name "*.ts" | wc -l
   # Output: 97 (was 96)
   ```

2. **Analyze:**
   - New handler: `handlers/payments/payment-handler.ts`
   - New module: `payments` (if registry.ts exists)
   - Dependencies: Check imports in payment-handler.ts

3. **Update docs:**
   - `02-backend-ts-components.md`: Add Payments Module section
   - `01-overview.md`: Update handler count 96 → 97
   - `README.md`: Update statistics
   - Regenerate system diagram with payments module

4. **Validate:**
   - File exists: ✅
   - Count matches: ✅
   - Diagrams valid: ✅

5. **Report:**
   ```
   ✅ Architecture documentation updated!

   Changes:
   - Handlers: 96 → 97 (+1)
   - New module: payments/
   - New handler: payment-handler.ts

   Updated:
   - docs/architecture/02-backend-ts-components.md
   - docs/architecture/01-overview.md
   - docs/architecture/README.md
   - System architecture diagram

   Committed: docs: add payment handler to architecture docs
   ```

## Automation Triggers

### Proactive Detection

When Claude is working on code and notices:

```typescript
// User creates new file
// Claude detects: "New handler file created"

if (newFileInHandlers && conversationInvolvesArchitecture) {
  // Suggest architecture update
  "I notice you added a new handler. Would you like me to update
   the architecture documentation?"
}
```

### Post-Feature Completion

```typescript
// After implementing feature
if (featureComplete && architectureChanged) {
  "Feature implementation complete! I'll update the architecture
   documentation to reflect the new components."

  // Auto-invoke architecture-mapper
}
```

### Pre-Commit Hook Integration

```bash
# .claude/hooks/pre-commit.sh (optional)
# Check if handlers/services changed
if [[ $(git diff --cached apps/backend-ts/src/handlers/) ]]; then
  echo "Handler changes detected. Architecture docs may need update."
fi
```

## Performance Considerations

**Fast Operations (< 5 seconds):**
- Component counting
- Endpoint extraction
- Madge dependency analysis

**Medium Operations (5-15 seconds):**
- Updating markdown files
- Regenerating diagrams
- Validation checks

**Slow Operations (> 15 seconds):**
- Full dependency re-analysis with visualization
- Comprehensive validation across all docs

**Optimization:**
- Cache previous madge results
- Only regenerate diagrams that changed
- Incremental updates when possible

## Key Files to Monitor

Watch these files for changes that require doc updates:

```
apps/backend-ts/src/
├── handlers/*/              # New handlers
├── services/                # New services
├── middleware/              # New middleware
├── core/                    # Orchestration changes
├── agents/                  # New Oracle agents
└── routing/router.ts        # New endpoints

docs/architecture/
├── 01-overview.md          # System architecture
├── 02-backend-ts-components.md  # Component details
├── 03-oracle-system.md     # Oracle agents
├── 04-data-flow.md         # Sequence diagrams
└── README.md               # Index and stats
```

## Success Criteria

After running architecture-mapper:

✅ All component counts are accurate
✅ All new components are documented
✅ All Mermaid diagrams render correctly
✅ All file paths reference existing files
✅ Dependency information matches code
✅ Statistics are up-to-date
✅ Changes are committed to git
✅ User is informed of updates made

## Error Handling

**If madge fails:**
- Fall back to manual file listing
- Document limitation in update notes

**If component count mismatch:**
- Alert user to discrepancy
- List unaccounted files
- Wait for clarification

**If Mermaid syntax invalid:**
- Show syntax error
- Revert to previous diagram
- Request user fix

**If git commit fails:**
- Save changes locally
- Report git error to user
- Suggest resolution

## Maintenance

**Weekly:**
- Verify all counts still match
- Check for undocumented components

**Monthly:**
- Full dependency re-analysis
- Comprehensive diagram regeneration
- Documentation quality review

**After major refactoring:**
- Complete documentation overhaul
- All diagrams regenerated
- Full validation suite

---

## Usage Examples

**Example 1: Auto-detection**
```
User: "I finished implementing the notifications handler"
Claude: [architecture-mapper activates]
        "I see you added a new handler! Updating architecture docs...
         ✅ Added notifications/ module to documentation
         ✅ Updated component counts
         ✅ Regenerated system diagram"
```

**Example 2: Explicit request**
```
User: "Update the architecture documentation"
Claude: [architecture-mapper activates]
        "Running architecture analysis...
         - Handlers: 96 (no change)
         - Services: 25 (was 24) - new caching-service.ts detected
         ✅ Documentation updated with new service"
```

**Example 3: Pre-PR check**
```
User: "I'm about to create a PR, make sure docs are current"
Claude: [architecture-mapper activates]
        "Checking architecture documentation...
         ✅ All components documented
         ✅ Counts match codebase
         ✅ Diagrams up-to-date
         Documentation is current!"
```

---

**This skill ensures architecture documentation is ALWAYS accurate and up-to-date with ZERO manual effort!** 🚀
