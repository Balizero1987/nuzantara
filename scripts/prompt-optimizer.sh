#!/bin/bash
set -euo pipefail

# ZANTARA Prompt Optimizer
# Transforms natural language → detailed actionable prompts using Claude Haiku
# Usage: ./prompt-optimizer.sh "controlli generali del sistema"

USER_INPUT="$1"

if [ -z "$USER_INPUT" ]; then
  echo "❌ Error: No input provided"
  echo ""
  echo "Usage: zp \"your natural language request\""
  echo ""
  echo "Examples:"
  echo "  zp \"controlli generali\""
  echo "  zp \"deploy backend\""
  echo "  zp \"fix bug in rate limiting\""
  exit 1
fi

# Check if ANTHROPIC_API_KEY is set
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "❌ Error: ANTHROPIC_API_KEY not set"
  echo ""
  echo "Set it in your .zshrc:"
  echo "  export ANTHROPIC_API_KEY='sk-ant-...'"
  echo ""
  echo "Or load from .env:"
  echo "  source .env"
  exit 1
fi

# Project root (assumes script is in NUZANTARA-2/scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATES_FILE="$PROJECT_ROOT/.claude/PROMPT_TEMPLATES.md"

if [ ! -f "$TEMPLATES_FILE" ]; then
  echo "❌ Error: Templates file not found: $TEMPLATES_FILE"
  exit 1
fi

# Load templates
TEMPLATES=$(cat "$TEMPLATES_FILE")

echo "🤖 Analyzing your request..."
echo ""

# Call Haiku API to optimize prompt
OPTIMIZED=$(curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "$(cat <<EOF
{
  "model": "claude-3-5-haiku-20241022",
  "max_tokens": 2048,
  "temperature": 0.3,
  "messages": [{
    "role": "user",
    "content": "You are a prompt optimizer for the ZANTARA system (multi-agent AI platform).\n\nUser's natural language request:\n\"$USER_INPUT\"\n\nYour task:\n1. Analyze the user's intent\n2. Match to the most relevant template from available templates below\n3. Generate a detailed, actionable prompt based on that template\n4. If no exact match, use 'custom_task' template and create detailed steps\n\nAvailable templates:\n$TEMPLATES\n\nIMPORTANT:\n- Return ONLY the optimized prompt text\n- NO explanations, NO meta-commentary\n- Use Italian if user wrote in Italian, English if user wrote in English\n- Be specific with file paths, commands, and URLs from templates\n- Include verification steps\n- Format with clear structure (numbered lists, bullet points)\n\nReturn the optimized prompt now:"
  }]
}
EOF
)" | jq -r '.content[0].text')

# Check if API call succeeded
if [ -z "$OPTIMIZED" ] || [ "$OPTIMIZED" = "null" ]; then
  echo "❌ Error: API call failed or returned empty response"
  echo ""
  echo "Debug info:"
  echo "  - ANTHROPIC_API_KEY set: ${ANTHROPIC_API_KEY:0:10}..."
  echo "  - Templates file exists: $([ -f "$TEMPLATES_FILE" ] && echo "yes" || echo "no")"
  exit 1
fi

# Copy to clipboard (macOS)
echo "$OPTIMIZED" | pbcopy

# Show preview
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Optimized prompt (copied to clipboard):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$OPTIMIZED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Next step: Press Cmd+V in Claude Code to paste"
echo ""
echo "📊 Stats:"
echo "  - Input: $(echo "$USER_INPUT" | wc -c | xargs) chars"
echo "  - Output: $(echo "$OPTIMIZED" | wc -c | xargs) chars"
echo "  - Cost: ~\$0.0001"
