#!/bin/bash

# DevAI Direct Commands
# Comandi diretti per interagire con DevAI

# Funzione per chat
devai_chat() {
    local message="$1"
    echo "🤖 Chiamando DevAI..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.chat\",
            \"params\": {
                \"message\": \"$message\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('🤖 DevAI:', data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Funzione per analisi
devai_analyze() {
    local code="$1"
    echo "🔍 Analizzando codice..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.analyze\",
            \"params\": {
                \"code\": \"$code\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('🔍 Analisi DevAI:')
        print(data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Funzione per fix
devai_fix() {
    local code="$1"
    echo "🔧 Correggendo codice..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.fix\",
            \"params\": {
                \"code\": \"$code\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('🔧 Codice Corretto:')
        print(data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Funzione per test
devai_test() {
    local code="$1"
    echo "🧪 Generando test..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.generate-tests\",
            \"params\": {
                \"code\": \"$code\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('🧪 Test Generati:')
        print(data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Funzione per review
devai_review() {
    local code="$1"
    echo "📝 Reviewing codice..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.review\",
            \"params\": {
                \"code\": \"$code\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('📝 Review DevAI:')
        print(data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Funzione per spiegazione
devai_explain() {
    local code="$1"
    echo "💡 Spiegando codice..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.explain\",
            \"params\": {
                \"code\": \"$code\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('💡 Spiegazione DevAI:')
        print(data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Funzione per refactoring
devai_refactor() {
    local code="$1"
    echo "🔄 Refactoring codice..."
    
    curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.refactor\",
            \"params\": {
                \"code\": \"$code\"
            }
        }" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('ok'):
        print('🔄 Refactoring DevAI:')
        print(data['data']['answer'])
    else:
        print('❌ Errore:', data.get('error', 'Unknown error'))
except:
    print('❌ Errore nel parsing della risposta')
"
}

# Mostra help
show_help() {
    echo "🤖 DevAI Terminal Commands"
    echo "=========================="
    echo ""
    echo "Usage:"
    echo "  source devai-commands.sh"
    echo ""
    echo "Commands:"
    echo "  devai_chat 'messaggio'           - Chatta con DevAI"
    echo "  devai_analyze 'codice'           - Analizza codice"
    echo "  devai_fix 'codice'               - Corregge codice"
    echo "  devai_test 'codice'              - Genera test"
    echo "  devai_review 'codice'            - Review codice"
    echo "  devai_explain 'codice'           - Spiega codice"
    echo "  devai_refactor 'codice'          - Refactoring"
    echo ""
    echo "Examples:"
    echo "  devai_chat 'Ciao DevAI!'"
    echo "  devai_analyze 'function test() { return 5; }'"
    echo "  devai_fix 'const x = 5; console.log(x);'"
    echo ""
}

# Se chiamato direttamente, mostra help
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    show_help
fi
