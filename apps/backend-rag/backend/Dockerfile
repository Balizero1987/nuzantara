# Optimized Dockerfile for ZANTARA RAG - Railway Performance Optimized
# Build time target: < 90 seconds for code changes
# Performance optimizations: Multi-stage build, better caching, smaller runtime

# ========================================
# Stage 1: Dependencies Builder
# ========================================
FROM --platform=linux/amd64 python:3.11-slim as builder

WORKDIR /app

# Install build dependencies in single layer
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install PyTorch CPU-only with specific version for stability
RUN pip install --no-cache-dir torch==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies with optimizations
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn[gevent]  # For better SSE performance

# ========================================
# Stage 2: Model Downloader (separate for caching)
# ========================================
FROM --platform=linux/amd64 python:3.11-slim as model-downloader

# Copy dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Download models with progress and error handling
RUN python -c "from sentence_transformers import SentenceTransformer; \
    import os; \
    os.environ['SENTENCE_TRANSFORMERS_HOME'] = '/models'; \
    print('Downloading embedding model...'); \
    model = SentenceTransformer('all-MiniLM-L6-v2'); \
    print('Model cached successfully'); \
    print(f'Model size: {len(model.encode([\"test\"]))} dimensions')"

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy pre-downloaded models
COPY --from=model-downloader /models /root/.cache/sentence_transformers

# Copy application code
COPY . .

# Set proper ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Environment variables optimized for Railway
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV SENTENCE_TRANSFORMERS_HOME=/root/.cache/sentence_transformers
ENV PYTHONPATH=/app:$PYTHONPATH
ENV WORKERS=1
ENV WORKER_CLASS=gevent
ENV WORKER_CONNECTIONS=1000

# Expose port
EXPOSE 8000

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Optimized startup command with gunicorn for better SSE performance
CMD ["sh", "-c", "python migrations/001_fix_missing_tables.py && gunicorn app.main_cloud:app --host 0.0.0.0 --port 8000 --workers 1 --worker-class gevent --worker-connections 1000 --max-requests 1000 --max-requests-jitter 100 --timeout 300 --keep-alive 5 --preload"]