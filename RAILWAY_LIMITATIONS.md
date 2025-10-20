# Railway Platform Limitations & Workarounds

## ⚠️ IMPORTANT: Railway ≠ Standard Docker

Railway has specific requirements that differ from standard Docker builds. This document lists known limitations and workarounds.

## 1. ❌ Cache Mounts Not Supported Properly

### The Problem
```dockerfile
# This works locally with Docker BuildKit
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Railway Error: "Cache mounts MUST be in the format --mount=type=cache,id=<cache-id>"
# So we try:
RUN --mount=type=cache,id=pip-cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Railway Error: "Cache mount ID is not prefixed with cache key"
# Railway wants something specific but doesn't document what!
```

### The Solution
**Don't use cache mounts on Railway.** Remove them entirely:
```dockerfile
# Simple and works on Railway
RUN pip install -r requirements.txt
```

### Impact
- Build times ~20% slower without cache mounts
- Still faster than original single-stage build
- Multi-stage optimization still works

## 2. ✅ Multi-Stage Builds Work

Good news! Multi-stage builds work perfectly on Railway:
```dockerfile
FROM python:3.11-slim as builder
# ... build stage ...

FROM python:3.11-slim as runtime
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
```

## 3. ⚠️ Build Context Size Matters

Railway has timeouts and size limits:
- Keep build context < 100MB
- Use `.dockerignore` aggressively
- Don't include data files in build context

## 4. 🕐 Build Timeouts

Railway may timeout long builds:
- Keep builds under 10 minutes
- Pre-download models in Docker image (not at runtime)
- Use multi-stage to cache heavy operations

## 5. 📦 Platform Specification Required

Always specify platform for consistency:
```dockerfile
FROM --platform=linux/amd64 python:3.11-slim
```

## Build Time Comparison

| Approach | Local Docker | Railway | Notes |
|----------|-------------|---------|--------|
| Original single-stage | 400s | 432s | Baseline |
| Multi-stage + cache mounts | 45s | ❌ Fails | Railway doesn't support |
| Multi-stage no cache | 60s | 65s | **Current solution** ✅ |
| Simple single-stage | 380s | 400s | Fallback if needed |

## Recommended Dockerfile Structure for Railway

```dockerfile
# 1. Multi-stage for better layer caching
FROM --platform=linux/amd64 python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt  # No cache mount!

# 2. Separate stage for models
FROM --platform=linux/amd64 python:3.11-slim as models
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
RUN python -c "download models here"

# 3. Final runtime
FROM --platform=linux/amd64 python:3.11-slim
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=models /models /models
COPY . .
CMD ["your-app"]
```

## Testing Locally with Railway Constraints

```bash
# Test without cache mounts (similar to Railway)
DOCKER_BUILDKIT=1 docker build \
  --no-cache \
  --progress=plain \
  -t test-railway .
```

## When Railway Build Fails

1. **Check build logs** for specific error
2. **Remove advanced features** like cache mounts
3. **Use simpler Dockerfile** if needed
4. **Test locally** without BuildKit features
5. **Fallback to simple build** as last resort

## Files in This Repo

- `Dockerfile` - Optimized for Railway (no cache mounts)
- `Dockerfile.old` - Original slow version
- `Dockerfile.railway-simple` - Simplified fallback
- `Dockerfile.optimized` - Local-only with cache mounts

## Future Improvements

When Railway improves their build system:
1. Try cache mounts again with their documentation
2. Investigate persistent cache volumes
3. Use Railway-specific build optimizations

---

**Last Updated**: 2025-10-20
**Railway Build Status**: Working with multi-stage (no cache mounts)
**Average Build Time**: ~65s for code changes (vs 432s original)