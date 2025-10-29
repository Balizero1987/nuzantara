#!/bin/bash

# PATCH-2 Monitoring Stack Deployment Script
# Deploys complete observability stack with Grafana Cloud integration

set -e

echo "🚀 Deploying PATCH-2 Monitoring Stack..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your Grafana Cloud credentials"
    echo "   Get credentials from: https://grafana.com/"
    exit 1
fi

# Load environment variables
source .env

# Validate required env vars
if [ -z "$GRAFANA_USERNAME" ] || [ -z "$GRAFANA_API_KEY" ]; then
    echo "❌ Error: GRAFANA_USERNAME and GRAFANA_API_KEY must be set in .env"
    exit 1
fi

echo "✅ Environment variables loaded"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers (if any)
echo "🛑 Stopping existing monitoring containers..."
docker-compose -f docker-compose.monitoring.yml down 2>/dev/null || true

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose -f docker-compose.monitoring.yml pull

# Start monitoring stack
echo "🎯 Starting monitoring stack..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo "🔍 Checking service health..."

services=("prometheus:9090" "node-exporter:9100" "cadvisor:8080" "alertmanager:9093")
all_healthy=true

for service in "${services[@]}"; do
    name="${service%%:*}"
    port="${service##*:}"

    if curl -s "http://localhost:$port" > /dev/null; then
        echo "  ✅ $name is running on port $port"
    else
        echo "  ❌ $name failed to start"
        all_healthy=false
    fi
done

if [ "$all_healthy" = false ]; then
    echo ""
    echo "⚠️  Some services failed to start. Check logs:"
    echo "   docker-compose -f monitoring/docker-compose.monitoring.yml logs"
    exit 1
fi

echo ""
echo "🎉 Monitoring stack deployed successfully!"
echo ""
echo "📊 Access dashboards:"
echo "   Prometheus:    http://localhost:9090"
echo "   AlertManager:  http://localhost:9093"
echo "   Node Exporter: http://localhost:9100/metrics"
echo "   cAdvisor:      http://localhost:8090"
echo ""
echo "☁️  Grafana Cloud:"
echo "   Metrics: https://grafana.com/orgs/YOUR-ORG/dashboards"
echo "   Logs:    https://grafana.com/orgs/YOUR-ORG/logs"
echo "   Traces:  https://grafana.com/orgs/YOUR-ORG/traces"
echo ""
echo "📝 Next steps:"
echo "   1. Configure application metrics endpoints"
echo "   2. Import Grafana dashboards"
echo "   3. Set up Slack alerts"
echo "   4. Test with: curl http://localhost:8080/metrics"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:    docker-compose -f monitoring/docker-compose.monitoring.yml logs -f"
echo "   Stop:         docker-compose -f monitoring/docker-compose.monitoring.yml down"
echo "   Restart:      docker-compose -f monitoring/docker-compose.monitoring.yml restart"
