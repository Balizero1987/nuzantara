# 🤖 NUZANTARA PRIME - Automation & Governance Setup

**Status:** ✅ Complete
**Date:** 2025-01-27

## Overview

Automation system to enforce code quality, security, and architectural consistency. The system includes:

- **AI Governance** (`.cursorrules`) - Guides AI assistants
- **Pre-commit Hooks** - Automated checks before commits
- **Janitor** (Ruff) - Code linting and formatting
- **Gatekeeper** (Security) - Secret detection and validation

## Quick Start

### 1. Install and Activate Hooks

Run the setup script from the project root:

```bash
./scripts/setup_hooks.sh
```

This will:
- Install `pre-commit` and `ruff`
- Install all git hooks
- Test the hooks (dry-run)

### 2. Verify Installation

```bash
pre-commit run --all-files
```

This runs all hooks on all files to verify everything works.

## What Gets Checked

### 🤖 Janitor (Ruff)
- **Linting**: Catches errors, unused imports, undefined variables
- **Formatting**: Auto-formats Python code (black-compatible)
- **Custom Checks**:
  - ❌ Blocks `os.getenv()` usage (must use `settings` from `app.core.config`)
  - ❌ Blocks `print()` statements (must use `logger`)

### 🔒 Gatekeeper (Security)
- **Secret Detection**: Scans for API keys, passwords, tokens
- **Large Files**: Blocks files > 1MB
- **File Validation**: Checks YAML, JSON, TOML syntax
- **Health Check**: Runs environment validation (on push)

### 📋 Code Quality
- **Trailing Whitespace**: Auto-removes
- **End of File**: Ensures files end with newline
- **Merge Conflicts**: Detects conflict markers
- **Case Conflicts**: Detects filename case issues
- **AST Validation**: Ensures Python syntax is valid

## File Structure

```
nuzantara/
├── .cursorrules              # AI governance rules
├── .pre-commit-config.yaml   # Pre-commit hooks config
├── .secrets.baseline         # Baseline for secret detection
└── scripts/
    └── setup_hooks.sh        # Installation script
```

## Usage

### Normal Workflow

1. Make changes to code
2. Stage files: `git add .`
3. Commit: `git commit -m "message"`
4. **Hooks run automatically** ✅

If hooks fail:
- Fix the issues (most are auto-fixed)
- Stage fixes: `git add .`
- Commit again

### Manual Hook Execution

Run all hooks manually:
```bash
pre-commit run --all-files
```

Run specific hook:
```bash
pre-commit run ruff --all-files
pre-commit run detect-secrets --all-files
```

### Skip Hooks (Emergency Only)

⚠️ **Only use in emergencies!**

```bash
git commit --no-verify -m "Emergency commit"
```

## Hook Details

### Ruff (Janitor)

**What it does:**
- Lints Python code (catches errors)
- Formats code (auto-fix)
- Runs on: `apps/backend-rag/backend/**/*.py`

**Common fixes:**
- Removes unused imports
- Fixes indentation
- Formats code style
- Catches undefined variables

### Detect Secrets (Gatekeeper)

**What it does:**
- Scans for hardcoded secrets
- Compares against baseline
- Blocks commits with new secrets

**What it detects:**
- API keys (AWS, Azure, GitHub, etc.)
- Passwords and tokens
- Private keys
- High-entropy strings (likely secrets)

### Custom Checks

**Check os.getenv Usage:**
- Scans for `os.getenv()` or `os.environ.get()`
- Blocks if found in `apps/backend-rag/backend/app/`
- **Rule**: Must use `settings` from `app.core.config`

**Check print() Statements:**
- Scans for `print()` calls
- Blocks if found (except in logger calls)
- **Rule**: Must use `logger.info()` instead

**Health Check:**
- Runs `python apps/backend-rag/scripts/health_check.py`
- Validates environment variables
- Runs on `pre-push` (not every commit, can be slow)

## Configuration Files

### `.cursorrules`
AI governance rules for Cursor IDE and other AI assistants. Defines:
- Configuration management rules
- Database access patterns
- Project structure requirements
- Security guidelines

### `.pre-commit-config.yaml`
Pre-commit hooks configuration. Defines:
- Which hooks to run
- Which files to check
- Hook execution order
- Custom local hooks

### `.secrets.baseline`
Baseline for secret detection. Contains:
- Known false positives
- Whitelisted patterns
- Plugin configuration

## Troubleshooting

### Hooks Not Running

```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install

# Verify installation
pre-commit run --all-files
```

### Ruff Errors

```bash
# Run ruff manually to see errors
cd apps/backend-rag
ruff check backend/
ruff format backend/
```

### Secret Detection False Positives

If a detected secret is a false positive:

```bash
# Update baseline
detect-secrets scan --update .secrets.baseline
```

### Health Check Failing

The health check validates environment variables. If it fails:
- Check `apps/backend-rag/scripts/health_check.py`
- Ensure required env vars are set
- Or disable the hook temporarily (not recommended)

## Best Practices

1. **Always commit with hooks enabled** - They catch issues early
2. **Fix auto-fixable issues** - Ruff can fix most things automatically
3. **Review secret detections** - False positives happen, but verify
4. **Don't skip hooks** - Use `--no-verify` only in emergencies
5. **Update baseline** - When adding known false positives

## Integration with CI/CD

These hooks can also run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run pre-commit
  run: |
    pip install pre-commit
    pre-commit run --all-files
```

## Summary

✅ **AI Governance**: `.cursorrules` guides AI assistants
✅ **Pre-commit Hooks**: Automated checks before commits
✅ **Ruff**: Fast linting and formatting
✅ **Security**: Secret detection and validation
✅ **Custom Checks**: Enforces Prime Standard rules

**Activation Command:**
```bash
./scripts/setup_hooks.sh
```

Your "robot guardians" are now protecting your codebase! 🤖
