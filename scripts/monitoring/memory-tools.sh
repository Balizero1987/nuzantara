#!/bin/bash
case "$1" in
  "save")
    curl -X POST http://localhost:8080/call \
      -H "Content-Type: application/json" \
      -d "{\"key\": \"memory.save\", \"params\": {\"title\": \"$2\", \"content\": \"$3\"}}"
    ;;
  "search")
    curl -X POST http://localhost:8080/call \
      -H "Content-Type: application/json" \
      -d "{\"key\": \"memory.search\", \"params\": {\"query\": \"$2\"}}"
    ;;
  *)
    echo "Usage: $0 {save|search} [params...]"
    echo "  save <title> <content>  - Save memory"
    echo "  search <query>          - Search memories"
    ;;
esac
