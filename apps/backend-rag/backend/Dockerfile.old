# Dockerfile for ZANTARA RAG with ChromaDB from Cloud Storage
FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only first (required for sentence-transformers)
# This fixes deployment failures caused by missing PyTorch dependency
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download embedding model to avoid startup delays and rate limits
RUN python -c "from sentence_transformers import SentenceTransformer; print('Downloading embedding model...'); SentenceTransformer('all-MiniLM-L6-v2'); print('Model cached successfully')"

# Copy application code
COPY . .

# Environment
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose port
EXPOSE 8000

# Note: Health check handled by Railway via railway.toml healthcheckPath="/health"
# Docker HEALTHCHECK removed to avoid dependency issues (requests/curl not in slim image)

# Run migrations then start server
# Note: we need to add parent dir to PYTHONPATH for imports to work
CMD ["sh", "-c", "python migrations/001_fix_missing_tables.py && PYTHONPATH=/app:$PYTHONPATH uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000"]
