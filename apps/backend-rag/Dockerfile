# ZANTARA RAG Backend - Fly.io Deployment
# Multi-stage build for security and optimization
# Python 3.11 + FastAPI + Qdrant + Sentence Transformers

# ========================================
# Stage 1: Build Stage
# ========================================
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# ========================================
# Stage 2: Runtime Stage
# ========================================
FROM python:3.11-slim

# Install only runtime dependencies (curl for healthcheck)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 nuzantara && \
    mkdir -p /app /data && \
    chown -R nuzantara:nuzantara /app /data

WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=builder /root/.local /home/nuzantara/.local

# Copy application code
COPY backend ./backend
COPY *.py ./

# Set Python path to include /app and /app/backend for proper imports
# This aligns with local development structure
ENV PYTHONPATH=/app:/app/backend
ENV PATH=/home/nuzantara/.local/bin:$PATH

# Change ownership of all files to non-root user
RUN chown -R nuzantara:nuzantara /app

# Switch to non-root user
USER nuzantara

# Expose port (use PORT env var, default to 8080 for Fly.io)
EXPOSE 8080

# Health check (model downloads on first request, not at startup)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Start uvicorn from root directory using module path
# This matches the PYTHONPATH configuration and works both locally and in Docker
# Use 0.0.0.0 (IPv4) for reliable binding (Fly.io proxy handles IPv6/IPv4 translation)
# Use shell script to properly expand $PORT environment variable
CMD ["sh", "-c", "uvicorn backend.app.main_cloud:app --host 0.0.0.0 --port ${PORT:-8080}"]
