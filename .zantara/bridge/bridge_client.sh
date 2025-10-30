#!/bin/bash
################################################################################
# ZANTARA BRIDGE CLIENT v1.0
################################################################################
# Purpose: Send tasks from command line to ZANTARA Bridge server
# Usage:
#   ./bridge_client.sh "Task description" "context" "priority"
#
# Examples:
#   ./bridge_client.sh "Implement logging module" "nuzantara" "high"
#   ./bridge_client.sh "Fix authentication bug" "webapp" "critical"
#   ./bridge_client.sh "Update documentation"
################################################################################

set -e

# Configuration
BRIDGE_URL="${BRIDGE_URL:-http://127.0.0.1:5050}"
DEFAULT_CONTEXT="general"
DEFAULT_PRIORITY="medium"
DEFAULT_AUTHOR="local-cli"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_usage() {
    echo ""
    echo "ZANTARA Bridge Client v1.0"
    echo ""
    echo "Usage:"
    echo "  $0 <task> [context] [priority]"
    echo ""
    echo "Arguments:"
    echo "  task       - Task description (required)"
    echo "  context    - Project context (default: general)"
    echo "  priority   - Task priority: critical|high|medium|low (default: medium)"
    echo ""
    echo "Examples:"
    echo "  $0 'Implement logging module' 'nuzantara' 'high'"
    echo "  $0 'Fix authentication bug' 'webapp' 'critical'"
    echo "  $0 'Update documentation'"
    echo ""
    echo "Environment:"
    echo "  BRIDGE_URL - Bridge server URL (default: http://127.0.0.1:5050)"
    echo ""
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Parse arguments
TASK="$1"
CONTEXT="${2:-$DEFAULT_CONTEXT}"
PRIORITY="${3:-$DEFAULT_PRIORITY}"

# Validate required arguments
if [ -z "$TASK" ]; then
    print_error "Task description is required"
    print_usage
    exit 1
fi

# Validate priority
case "$PRIORITY" in
    critical|high|medium|low)
        ;;
    *)
        print_warning "Invalid priority '$PRIORITY', using 'medium'"
        PRIORITY="medium"
        ;;
esac

# Check if bridge server is accessible
print_info "Checking bridge server at $BRIDGE_URL..."
if ! curl -s -f "$BRIDGE_URL/health" > /dev/null 2>&1; then
    print_error "Bridge server is not accessible at $BRIDGE_URL"
    print_info "Start the server with: python bridge_server.py"
    exit 1
fi

print_success "Bridge server is online"

# Create JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "task": "$TASK",
  "context": "$CONTEXT",
  "priority": "$PRIORITY",
  "author": "$DEFAULT_AUTHOR",
  "metadata": {
    "submitted_from": "cli",
    "hostname": "$(hostname)",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
)

# Submit task
print_info "Submitting task..."
echo ""
echo "Task:     $TASK"
echo "Context:  $CONTEXT"
echo "Priority: $PRIORITY"
echo ""

RESPONSE=$(curl -s -X POST "$BRIDGE_URL/commit" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

# Check response
if echo "$RESPONSE" | grep -q '"status":"success"'; then
    TASK_ID=$(echo "$RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    FILENAME=$(echo "$RESPONSE" | grep -o '"file":"[^"]*"' | cut -d'"' -f4)
    SHA1=$(echo "$RESPONSE" | grep -o '"sha1":"[^"]*"' | cut -d'"' -f4 | cut -c1-8)

    print_success "Task committed successfully!"
    echo ""
    echo "Task ID:  $TASK_ID"
    echo "File:     $FILENAME"
    echo "SHA1:     $SHA1"
    echo ""
    print_info "Task is now in the inbox and will be processed automatically"
    print_info "Check status: curl $BRIDGE_URL/status | jq"
else
    print_error "Failed to commit task"
    echo "Response: $RESPONSE"
    exit 1
fi
