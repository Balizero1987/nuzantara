#!/bin/bash
# RAG Test Script - 20 queries across different legal/business domains

API_URL="https://nuzantara-rag.fly.dev/api/v2/bali-zero/chat-stream"
API_KEY="zantara-secret-2024"

queries=(
  "Quali sono i requisiti per ottenere un KITAS lavorativo in Indonesia?"
  "Quanto costa aprire una PT PMA in Indonesia?"
  "Qual è la differenza tra KITAS e KITAP?"
  "Come funziona il sistema fiscale indonesiano per gli stranieri?"
  "Quali documenti servono per il visto B211A?"
  "Quanto dura il processo di costituzione di una società in Indonesia?"
  "Cosa sono i codici KBLI e perché sono importanti?"
  "Quali sono le tasse sul reddito in Indonesia?"
  "Come si rinnova un permesso di soggiorno KITAS?"
  "Quali attività commerciali sono vietate agli stranieri in Indonesia?"
  "Quanto costa un visto turistico per l'Indonesia?"
  "Come funziona la Golden Visa Indonesia?"
  "Quali sono i requisiti minimi di capitale per una PT PMA?"
  "Che differenza c'è tra visto on arrival e visa free?"
  "Come si ottiene un permesso di lavoro IMTA?"
  "Quali sono le sanzioni per overstay in Indonesia?"
  "Come funziona il sistema previdenziale BPJS?"
  "Quali sono i settori aperti agli investimenti stranieri?"
  "Come si registra una proprietà immobiliare in Indonesia?"
  "Quali sono i requisiti per il visto pensionato in Indonesia?"
)

echo "=== RAG TEST RESULTS ===" > /tmp/rag_test_results.txt
echo "Date: $(date)" >> /tmp/rag_test_results.txt
echo "" >> /tmp/rag_test_results.txt

for i in "${!queries[@]}"; do
  query="${queries[$i]}"
  encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")

  echo "Testing query $((i+1))/20: $query"

  echo "=== QUERY $((i+1)): $query ===" >> /tmp/rag_test_results.txt

  response=$(curl -s "$API_URL?query=$encoded_query&user_id=test-user" -H "X-API-Key: $API_KEY" 2>&1)

  # Extract tokens
  tokens=$(echo "$response" | grep '"type": "token"' | sed 's/.*"data": "//g' | sed 's/".*//g' | tr -d '\n')

  # Extract metadata
  rag_used=$(echo "$response" | grep '"used_rag"' | head -1)

  echo "RAG Info: $rag_used" >> /tmp/rag_test_results.txt
  echo "Response: $tokens" >> /tmp/rag_test_results.txt
  echo "" >> /tmp/rag_test_results.txt
  echo "---" >> /tmp/rag_test_results.txt
  echo "" >> /tmp/rag_test_results.txt

  sleep 2  # Rate limiting
done

echo "=== TEST COMPLETE ===" >> /tmp/rag_test_results.txt
cat /tmp/rag_test_results.txt
