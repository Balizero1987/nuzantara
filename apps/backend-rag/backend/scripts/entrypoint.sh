#!/bin/bash
echo "🚀 Starting ZANTARA RAG on port $PORT..."
echo "📂 PWD: $(pwd)"
echo "🐍 PYTHONPATH: $PYTHONPATH"

# Run uvicorn in background
python -m uvicorn app.main_cloud:app --host 0.0.0.0 --port $PORT --log-level info &
PID=$!

echo "⏳ Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:$PORT/healthz > /dev/null; then
    echo "✅ Server is UP and responding to health check internally!"
    break
  fi
  echo "zzZ... ($i/30)"
  sleep 2
done

# Check if process is still alive
if ! kill -0 $PID > /dev/null 2>&1; then
  echo "❌ Server crashed during startup!"
  # Try to read log file if exists, or just exit
  exit 1
fi

echo "🎉 Server ready. Keeping foreground process alive."
wait $PID
