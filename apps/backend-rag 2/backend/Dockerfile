# Dockerfile for ZANTARA RAG with ChromaDB from Cloud Storage
FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)" || exit 1

# Run with main_cloud.py (ChromaDB from GCS)
# Note: we need to add parent dir to PYTHONPATH for imports to work
CMD ["sh", "-c", "PYTHONPATH=/app:$PYTHONPATH uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000"]
