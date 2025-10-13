#!/usr/bin/env bash
set -euo pipefail
API=${API:-https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app}
KEY=${KEY:-}

say() { printf "\n== %s ==\n" "$*"; }

slp() { sleep 0.15; }

say "Health checks"
curl -s "$API/health" | jq '.status,.version' || true
curl -s https://zantara-rag-backend-himaadsxua-ew.a.run.app/health | jq '.status,.version' || true

say "Flags"
curl -s "$API/config/flags" | jq '.data'

say "Handlers count"
curl -s -X POST "$API/call" \
  -H 'Content-Type: application/json' -H "x-api-key: $KEY" \
  -d '{"key":"system.handlers.list"}' | jq '.data.total'

say "Tools (tool-use) count"
curl -s -X POST "$API/call" \
  -H 'Content-Type: application/json' -H "x-api-key: $KEY" \
  -d '{"key":"system.handlers.tools"}' | jq '.data.tools | length'

slp

say "team.list (>0 members)"
slp
curl -s -X POST "$API/call" \
  -H 'Content-Type: application/json' -H "x-api-key: $KEY" \
  -d '{"key":"team.list"}' | jq '.ok,.data.members|length'

slp
say "pricing.official"
curl -s -X POST "$API/call" \
  -H 'Content-Type: application/json' -H "x-api-key: $KEY" \
  -d '{"key":"pricing.official","params":{"service_type":"visa","include_details":true}}' | jq '.ok'

slp
say "memory.save/retrieve"
curl -s -X POST "$API/call" -H 'Content-Type: application/json' -H "x-api-key: $KEY" \
  -d '{"key":"memory.save","params":{"userId":"onboarding_smoke","content":"Prefers async comms"}}' | jq '.ok'
curl -s -X POST "$API/call" -H 'Content-Type: application/json' -H "x-api-key: $KEY" \
  -d '{"key":"memory.retrieve","params":{"userId":"onboarding_smoke"}}' | jq '.ok,.data'

slp
say "RAG chat (bali-zero/chat)"
curl -s -X POST https://zantara-rag-backend-himaadsxua-ew.a.run.app/bali-zero/chat \
  -H 'Content-Type: application/json' \
  -d '{"query":"What is Bali Zero team size?","user_id":"smoke"}' | jq '.response'

# App-Gateway (optional)
if curl -s "$API/config/flags" | jq -e '.data.ENABLE_APP_GATEWAY == true' >/dev/null; then
  say "App-Gateway bootstrap"
  BOOT=$(curl -s -X POST "$API/app/bootstrap" -H 'Content-Type: application/json' -H "Origin: https://zantara.balizero.com")
  echo "$BOOT" | jq '.data.flags'
  SID=$(echo "$BOOT" | jq -r '.data.sessionId')
  CSRF=$(echo "$BOOT" | jq -r '.data.csrfToken')
  say "App-Gateway event chat_send"
  curl -s -X POST "$API/app/event" -H 'Content-Type: application/json' -H "Origin: https://zantara.balizero.com" -H "x-csrf-token: $CSRF" \
    -d "{\"action\":\"chat_send\",\"sessionId\":\"$SID\",\"payload\":{\"text\":\"hello from smoke\"}}" | jq
else
  say "App-Gateway disabled (skip)"
fi

echo "\nSmoke test done."
