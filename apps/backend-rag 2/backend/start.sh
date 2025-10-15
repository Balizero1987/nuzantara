#!/bin/bash
# Railway startup script with proper PORT handling

PORT="${PORT:-8080}"
echo "Starting Uvicorn on port $PORT..."
uvicorn app.main_cloud:app --host 0.0.0.0 --port "$PORT"
