#!/bin/bash
# Railway Helper - Direct API access for Claude

SERVICE_ID="scintillating-kindness"
PROJECT_ID="fulfilling-creativity"
ENVIRONMENT="production"

case "$1" in
  logs)
    # Get deployment logs using Railway JSON API
    DEPLOYMENT_ID="${2:-latest}"
    railway logs --service "$SERVICE_ID" --deployment "$DEPLOYMENT_ID" --json 2>&1
    ;;

  status)
    # Get service status
    railway status --service "$SERVICE_ID" --json 2>&1
    ;;

  deployments)
    # List recent deployments
    railway logs --service "$SERVICE_ID" --json 2>&1 | head -50
    ;;

  vars)
    # List environment variables
    railway variables --service "$SERVICE_ID" 2>&1
    ;;

  *)
    echo "Usage: $0 {logs|status|deployments|vars} [args]"
    exit 1
    ;;
esac
