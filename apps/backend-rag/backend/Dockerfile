# Optimized Dockerfile for ZANTARA RAG - Faster builds with better caching
# Build time target: < 2 minutes for code changes

# ========================================
# Stage 1: Dependencies Builder
# ========================================
FROM --platform=linux/amd64 python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (better caching)
COPY requirements.txt .

# Install PyTorch CPU-only with cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install all other dependencies with cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# ========================================
# Stage 2: Model Downloader (separate for caching)
# ========================================
FROM --platform=linux/amd64 python:3.11-slim as model-downloader

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Download models to specific directory
RUN python -c "from sentence_transformers import SentenceTransformer; \
    import os; \
    os.environ['SENTENCE_TRANSFORMERS_HOME'] = '/models'; \
    print('Downloading embedding model...'); \
    SentenceTransformer('all-MiniLM-L6-v2'); \
    print('Model cached successfully')"

# ========================================
# Stage 3: Final Runtime Image
# ========================================
FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Install only runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy pre-downloaded models
COPY --from=model-downloader /models /root/.cache/sentence_transformers

# Copy application code (this layer changes most frequently)
COPY . .

# Environment
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV SENTENCE_TRANSFORMERS_HOME=/root/.cache/sentence_transformers

# Expose port
EXPOSE 8000

# Run migrations then start server
CMD ["sh", "-c", "python migrations/001_fix_missing_tables.py && PYTHONPATH=/app:$PYTHONPATH uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000"]