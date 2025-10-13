#!/bin/sh
set -e

TARGET="${OAUTH2_TOKENS_FILE:-./oauth2-tokens.json}"

# If the secret is provided via environment variable, materialize it to disk.
if [ -n "$OAUTH2_TOKENS_JSON" ]; then
  DIRNAME=$(dirname "$TARGET")
  if [ ! -d "$DIRNAME" ]; then
    mkdir -p "$DIRNAME"
  fi
  if [ ! -f "$TARGET" ]; then
    printf '%s' "$OAUTH2_TOKENS_JSON" > "$TARGET"
  fi
fi

# Provide legacy path expected by older modules.
if [ "$TARGET" != "./oauth2-tokens.json" ] && [ -f "$TARGET" ] && [ ! -e "./oauth2-tokens.json" ]; then
  ln -s "$TARGET" ./oauth2-tokens.json 2>/dev/null || true
fi

exec "$@"
