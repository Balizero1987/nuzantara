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
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend ./backend
# .env is not in repo (secrets via Fly.io secrets set)
# COPY .env ./  # Commented: Use Fly.io secrets instead
COPY *.py ./

# Qdrant is hosted externally, no local data directory needed

# Set Python path to include both /app and /app/backend for proper imports
ENV PYTHONPATH=/app:/app/backend

# Set runtime working directory so uvicorn can load main_cloud module directly
WORKDIR /app/backend/app

# Copy .env to the working directory where config.py expects it (from parent directory)
# RUN cp /app/.env .env 2>/dev/null || echo "No .env file found"
# Note: All config via Fly.io environment variables & secrets

# Expose port
EXPOSE 8000

# Health check (model downloads on first request, not at startup)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start uvicorn
CMD ["uvicorn", "main_cloud:app", "--host", "0.0.0.0", "--port", "8000"]
