# 🤖 AI Developer Build Decision Guide

## For Future AI Assistants Working on NUZANTARA

### Quick Decision Tree

```mermaid
Is the change in...?
├── Python code only (.py files) → ✅ INCREMENTAL BUILD (~45s)
├── requirements.txt → ⚠️ PARTIAL REBUILD (~120s)
├── Dockerfile → 🔄 FULL REBUILD (~180s)
├── System dependencies (apt packages) → 🔄 FULL REBUILD
├── .dockerignore → ✅ INCREMENTAL BUILD
├── Environment variables → ✅ NO REBUILD (runtime)
└── Model downloads/AI configs → 🔄 FULL REBUILD
```

## 📋 When to Use Each Build Type

### ✅ **INCREMENTAL BUILD (Fast - ~45 seconds)**
Use when you've ONLY changed:
- Python source code (`*.py` files)
- Configuration files (`.json`, `.yaml`, `.toml`)
- Documentation (`*.md`)
- Static assets
- .dockerignore file

**Fly.io does this automatically when you:**
```bash
git push origin main
```

### ⚠️ **PARTIAL REBUILD (Medium - ~120 seconds)**
Required when you've changed:
- `requirements.txt` (added/removed/updated packages)
- Python package versions
- Minor dependency updates

**Fly.io handles this automatically, but you can verify:**
```bash
# Check if requirements changed
git diff HEAD~1 requirements.txt
```

### 🔄 **FULL REBUILD (Slow - ~180 seconds)**
Required when you've changed:
- `Dockerfile` structure
- Base image version
- System packages (apt-get install)
- Build stages
- Model configurations
- First deployment to new environment

**How to force full rebuild on Fly.io:**
```bash
# Option 1: Add a dummy build arg to Dockerfile
echo "# Force rebuild: $(date)" >> Dockerfile
git add Dockerfile && git commit -m "Force full rebuild" && git push

# Option 2: Clear Fly.io build cache (from Fly.io dashboard)
# Settings → Build → Clear Cache
```

## 🎯 Real-World Scenarios

### Scenario 1: "Fixed a typo in main_cloud.py"
- **Build type**: Incremental ✅
- **Time**: ~45s
- **Action**: Just push
```bash
git add main_cloud.py
git commit -m "fix: typo in response"
git push
```

### Scenario 2: "Added new package: openai"
- **Build type**: Partial ⚠️
- **Time**: ~120s
- **Action**: Update requirements first
```bash
echo "openai==1.12.0" >> requirements.txt
git add requirements.txt main_cloud.py
git commit -m "feat: add OpenAI integration"
git push
```

### Scenario 3: "Upgraded Python from 3.11 to 3.12"
- **Build type**: Full 🔄
- **Time**: ~180s
- **Action**: Update Dockerfile
```bash
# Edit Dockerfile: FROM python:3.12-slim
git add Dockerfile
git commit -m "chore: upgrade to Python 3.12"
git push
```

### Scenario 4: "Changed ChromaDB download logic"
- **Build type**: Incremental ✅
- **Time**: ~45s
- **Why**: ChromaDB downloads at runtime, not build time
```bash
git add main_cloud.py
git commit -m "fix: ChromaDB download from R2"
git push
```

### Scenario 5: "Updated sentence-transformers model"
- **Build type**: Full 🔄
- **Time**: ~180s
- **Why**: Model cached in Docker layer
```bash
# Edit Dockerfile model download section
git add Dockerfile
git commit -m "feat: upgrade to all-MiniLM-L12-v2"
git push
```

## 🔍 How to Check What's Happening

### Check Fly.io Build Logs
```bash
# Look for these messages in Fly.io logs:

"Using cache" → Good! Layer is cached
"Downloading" → Rebuilding this layer
"CACHED [stage-name 5/7]" → Stage cached
"RUN pip install" → Dependencies rebuilding
```

### Analyze Local Changes
```bash
# What files changed?
git status

# What's in the last commit?
git diff HEAD~1 --name-only

# Will this trigger rebuild?
git diff HEAD~1 --name-only | grep -E "(requirements\.txt|Dockerfile|\.dockerignore)"
```

## ⚡ Performance Tips for AI Developers

### 1. **Batch Related Changes**
```bash
# BAD: Multiple deploys
git push  # Deploy 1: Add package
git push  # Deploy 2: Use package
git push  # Deploy 3: Fix import

# GOOD: Single deploy
git add requirements.txt main_cloud.py services/
git commit -m "feat: complete OpenAI integration"
git push  # One optimized build
```

### 2. **Test Locally First**
```bash
# Test Python changes without Docker
python main_cloud.py

# Test with Docker locally (if needed)
DOCKER_BUILDKIT=1 docker build -t test .
docker run -p 8000:8000 test
```

### 3. **Use Fly.io Dev Environment**
```bash
# Create dev branch for experiments
git checkout -b dev/test-feature
git push origin dev/test-feature
# Fly.io can build this separately
```

## ⚠️ Fly.io-Specific Requirements

### Cache Mounts MUST Have IDs
```dockerfile
# ❌ WRONG - Works locally but fails on Fly.io
RUN --mount=type=cache,target=/root/.cache/pip

# ✅ CORRECT - Fly.io requires explicit cache ID
RUN --mount=type=cache,id=pip-cache,target=/root/.cache/pip
```

## 🚨 Common Pitfalls

### ❌ **DON'T** force rebuild for Python-only changes
```bash
# WRONG - Wastes time
echo "# force" >> Dockerfile  # Don't do this for .py changes!
```

### ❌ **DON'T** clear cache unless necessary
```bash
# Cache is your friend! Only clear when:
# - Corrupted builds
# - Major architecture changes
# - Debugging build issues
```

### ❌ **DON'T** change Dockerfile for config
```bash
# WRONG - Use environment variables
RUN echo "API_KEY=xxx" >> .env  # Don't hardcode!

# RIGHT - Use Fly.io variables
# Set in Fly.io dashboard → Variables
```

## 📊 Build Time Expectations

| File Type Changed | Build Time | Cache Used | Deploy Total |
|------------------|------------|------------|--------------|
| `.py` only | ~45s | 90% | ~2 min |
| `requirements.txt` | ~120s | 60% | ~3 min |
| `Dockerfile` | ~180s | 20% | ~4 min |
| First deploy | ~180s | 0% | ~4 min |
| `.env` variables | 0s | N/A | ~30s (restart) |

## 🆘 Troubleshooting Slow Builds

### Build taking longer than expected?

1. **Check Fly.io logs for "Using cache"**
   - Missing? Cache might be invalidated

2. **Check git diff**
   ```bash
   git diff HEAD~1 --stat
   ```
   - Large changes? More to rebuild

3. **Check Docker context size**
   ```bash
   du -sh .
   ```
   - Too large? Update .dockerignore

4. **Force fresh build if stuck**
   ```bash
   # Nuclear option - clears everything
   git commit --allow-empty -m "rebuild: clear cache"
   git push
   ```

## 📝 For Human Developers

This guide is primarily for AI assistants, but humans should know:
- Fly.io handles most optimization automatically
- Trust the caching system
- Only intervene when builds are unexpectedly slow
- Monitor the first build after Dockerfile changes

## 🔮 Future Optimizations

If builds are still slow, consider:
1. **Pre-built base images** with dependencies
2. **Fly.io persistent cache volumes**
3. **Separate services** for different components
4. **GitHub Actions** for CI/CD pre-building

---

**Last Updated**: 2025-10-20
**Applies to**: NUZANTARA Fly.io Deployment
**Dockerfile Type**: Multi-stage with BuildKit optimizations