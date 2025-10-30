#!/bin/bash
echo "🚀 Setting up ZANTARA Learning Agent with Qwen 2.5..."

# Environment vars
export QWEN_API_KEY="YOUR_QWEN_API_KEY"
export VECTOR_DB_PATH="./.learning_agent/vector_store"
export GITHUB_REPO="Balizero1987/nuzantara"

# Install deps
pip install qwen-agent==0.0.31 jsonlines eval-type-backport dotenv
npm install chromadb langchain openai @dqbd/tiktoken

# Create vector store directory
mkdir -p $VECTOR_DB_PATH

# Initialize config
cat > learning_agent_config.json <<EOF
{
  "model": "qwen2.5-72b-instruct",
  "vector_store": "$VECTOR_DB_PATH",
  "repository": "$GITHUB_REPO",
  "update_interval": "daily",
  "learning_scope": ["src/", "apps/backend-ts/", "tests/"],
  "output_dir": "./docs/learning_agent_reports",
  "patterns_file": "./learning_patterns.json"
}
EOF

echo "✅ Configuration created: learning_agent_config.json"

