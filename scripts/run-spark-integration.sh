#!/bin/bash

# ZANTARA Spark Integration Script
# Integrates Apache Spark with existing PostgreSQL + ChromaDB + Redis architecture

set -e

echo "🚀 Starting ZANTARA Spark Integration..."

# Check if Docker network exists
if ! docker network ls | grep -q zantara-network; then
    echo "📡 Creating ZANTARA network..."
    docker network create zantara-network
fi

# Start Spark cluster
echo "🔥 Starting Spark cluster..."
docker-compose -f docker-compose.spark.yml up -d

# Wait for Spark master to be ready
echo "⏳ Waiting for Spark master..."
until curl -s http://localhost:8080 > /dev/null; do
    echo "   Waiting for Spark master UI..."
    sleep 5
done

echo "✅ Spark master is ready!"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install pyspark psycopg2-binary redis requests

# Set environment variables
export DB_HOST=${DB_HOST:-localhost}
export DB_NAME=${DB_NAME:-zantara}
export DB_USER=${DB_USER:-postgres}
export DB_PASSWORD=${DB_PASSWORD:-password}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export CHROMADB_URL=${CHROMADB_URL:-http://localhost:8000}
export RAG_BACKEND_URL=${RAG_BACKEND_URL:-http://localhost:8080}

# Run Spark job
echo "⚡ Running Spark KBLI processor..."
python src/spark/kbli_processor.py

echo "🎉 Spark integration completed successfully!"
echo ""
echo "📊 Access Spark UI at: http://localhost:8080"
echo "📈 Access Spark History at: http://localhost:18080"

# Show cluster status
echo ""
echo "🔍 Spark Cluster Status:"
docker-compose -f docker-compose.spark.yml ps