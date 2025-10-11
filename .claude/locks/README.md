# 🔒 Session Lock Files

This directory contains temporary lock files used for **multi-CLI coordination**.

## How it works

When a CLI starts work on a category (e.g., `backend-handlers`), it creates:
```
.claude/locks/backend-handlers.lock
```

**Lock file format**:
```
2025-10-11 18:45:30 | sonnet-4.5 m1 | PID: 12345 | Task: fix rate limiting
```

## What CLIs check

Before starting work, each CLI:
1. Reads detected categories (Step 5)
2. Checks if `.claude/locks/{category}.lock` exists (Step 5.5)
3. If lock exists → shows conflict warning → asks user what to do
4. If no lock → creates lock → proceeds with work

## Cleanup

Locks are automatically removed when CLI exits (Exit Protocol Step 5).

## Files in this directory

- **`*.lock`**: Active category locks (temporary, ignored by git)
- **`.gitignore`**: Ensures lock files are never committed
- **`README.md`**: This file (committed to git for documentation)

## Emergency cleanup

If CLIs crash without cleanup:
```bash
# Remove all stale locks
rm -f .claude/locks/*.lock
```

**Created**: 2025-10-11
**Version**: 1.0.0
