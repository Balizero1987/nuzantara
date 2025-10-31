# ZANTARA RAG Backend - Railway Deployment
# Python 3.11 + FastAPI + ChromaDB + Qdrant + Sentence Transformers
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

# Copy application code
COPY backend ./backend
COPY .env.example ./.env
COPY *.py ./

# Set Python path
ENV PYTHONPATH=/app/backend

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start uvicorn
CMD ["uvicorn", "app.main_cloud:app", "--host", "0.0.0.0", "--port", "8000"]
