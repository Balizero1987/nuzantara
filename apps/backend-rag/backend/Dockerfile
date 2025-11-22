# ZANTARA RAG Backend - Fly.io Deployment
# Python 3.11 + FastAPI + Qdrant + Sentence Transformers
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first (better caching)
COPY requirements-minimal.txt .

# Install Python dependencies (minimal - no torch/sentence-transformers)
RUN pip install --no-cache-dir -r requirements-minimal.txt

# Copy application code (Fly.io root is already in backend/)
COPY . .

# Set Python path
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run migrations then start uvicorn (matching railway.json)
CMD sh -c "python migrations/001_fix_missing_tables.py && uvicorn app.main_cloud:app --host 0.0.0.0 --port ${PORT}"
