FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies in layers for better caching
# Layer 1: Base dependencies (fast)
COPY requirements-base.txt .
RUN pip install --no-cache-dir -r requirements-base.txt

# Layer 2: ML dependencies (heavy - chromadb + sentence-transformers)
COPY requirements-ml.txt .
RUN pip install --no-cache-dir -r requirements-ml.txt

# Pre-download sentence-transformers models
# Model 1: all-MiniLM-L6-v2 (87MB) - for embeddings
# Model 2: ms-marco-MiniLM-L-6-v2 (400MB) - for re-ranking
RUN python3 -c "from sentence_transformers import SentenceTransformer, CrossEncoder; \
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); \
    print(f' Embedding model cached: {model.get_sentence_embedding_dimension()} dimensions'); \
    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2'); \
    print(' Re-ranker model cached')"

# Copy application code (v5 - Collaborative Intelligence)
COPY . .

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)" || exit 1

# Start server with ChromaDB from GCS
CMD ["uvicorn", "app.main_cloud:app", "--host", "0.0.0.0", "--port", "8000"]
