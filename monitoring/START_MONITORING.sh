#!/bin/bash
# ZANTARA Monitoring Stack - Quick Start Script

echo "🚀 Starting ZANTARA Monitoring Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Navigate to monitoring directory
cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << 'ENVEOF'
# Grafana Configuration
GRAFANA_PASSWORD=zantara2025

# SMTP Configuration (for email alerts)
SMTP_PASSWORD=your-smtp-password

# PagerDuty Integration
PAGERDUTY_SERVICE_KEY=your-pagerduty-key

# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
ENVEOF
    echo "⚠️  Please edit .env file with your credentials before continuing."
    echo "   Edit: monitoring/.env"
    exit 0
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Monitoring stack is running!"
echo ""
echo "📈 Access URLs:"
echo "   • Grafana:       http://localhost:3000 (admin/zantara2025)"
echo "   • Prometheus:    http://localhost:9090"
echo "   • Alertmanager:  http://localhost:9093"
echo ""
echo "📚 Documentation: monitoring/README.md"
echo ""
echo "🔄 To view logs: docker-compose logs -f"
echo "🛑 To stop:      docker-compose down"

