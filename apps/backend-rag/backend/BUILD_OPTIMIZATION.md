# Docker Build Optimization for ZANTARA RAG

## Problem
- **Previous build time: 432 seconds (7+ minutes)** ❌
- **Target build time: < 120 seconds for code changes** ✅

## Root Causes of Slow Builds
1. **PyTorch installation** (~700MB, installed every build)
2. **Model download during build** (sentence-transformers model)
3. **No effective layer caching** (code changes rebuild everything)
4. **Large build context** (no .dockerignore)
5. **Single-stage build** (everything in one image)

## Optimizations Implemented

### 1. Multi-Stage Build (3 stages)
```dockerfile
# Stage 1: Dependencies Builder (cached)
# Stage 2: Model Downloader (cached separately)
# Stage 3: Final Runtime (only code changes)
```

### 2. Docker BuildKit Cache Mounts
```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch --index-url https://download.pytorch.org/whl/cpu
```
- Reuses pip cache between builds
- Dramatically speeds up dependency installation

### 3. Layer Optimization
- **COPY requirements.txt** first (rarely changes)
- **Install dependencies** next (cached if requirements unchanged)
- **COPY application code** last (changes frequently)

### 4. .dockerignore Added
- Excludes unnecessary files from build context
- Reduces context size from ~50MB to ~5MB
- Faster context transfer to Docker daemon

### 5. Separate Model Download Stage
- Models downloaded once and cached
- Not re-downloaded on code changes

## Expected Results

| Scenario | Old Time | New Time | Improvement |
|----------|----------|----------|-------------|
| Full build (first time) | 432s | ~180s | 58% faster |
| Code changes only | 432s | ~45s | 90% faster |
| Requirements change | 432s | ~120s | 72% faster |

## Build Commands

### Local Testing
```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Build with cache
docker build -t zantara-rag:optimized .

# Build without cache (simulate first build)
docker build --no-cache -t zantara-rag:optimized .
```

### Railway Deployment
Railway automatically uses BuildKit when available. The optimizations will work automatically on push.

## Monitoring Build Performance

1. Check Railway build logs for timing
2. Look for "Using cache" messages in build output
3. Monitor which layers are rebuilt vs cached

## Further Optimizations (if needed)

1. **Use Railway's build cache** - Configure persistent cache
2. **Pre-built base image** - Create custom base with all dependencies
3. **Slim down dependencies** - Review if all packages are needed
4. **Use distroless images** - Even smaller final image

## Files Changed
- `Dockerfile` - Replaced with optimized multi-stage version
- `.dockerignore` - Created to exclude unnecessary files
- `Dockerfile.old` - Backup of original Dockerfile

## Rollback (if needed)
```bash
cp Dockerfile.old Dockerfile
git add Dockerfile
git commit -m "Revert to original Dockerfile"
git push
```