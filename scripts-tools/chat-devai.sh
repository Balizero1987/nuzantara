#!/bin/bash

# DevAI Chat Terminal Interface
# Permette di chattare con DevAI direttamente dal terminale

echo "🤖 DevAI Chat Terminal Interface"
echo "================================"
echo "Digita 'exit' per uscire"
echo "Digita 'help' per vedere i comandi disponibili"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per chiamare DevAI
call_devai() {
    local message="$1"
    
    echo -e "${BLUE}🤖 DevAI sta pensando...${NC}"
    
    response=$(curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.chat\",
            \"params\": {
                \"message\": \"$message\"
            }
        }")
    
    if [ $? -eq 0 ]; then
        # Estrai la risposta
        answer=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('answer','Errore nella risposta'))" 2>/dev/null)
        
        if [ "$answer" != "Errore nella risposta" ]; then
            echo -e "${GREEN}🤖 DevAI:${NC}"
            echo "$answer"
            echo ""
        else
            echo -e "${RED}❌ Errore: DevAI non ha risposto correttamente${NC}"
            echo "Response: $response"
        fi
    else
        echo -e "${RED}❌ Errore: Impossibile connettersi a DevAI${NC}"
        echo "Assicurati che il server sia in esecuzione (npm run dev)"
    fi
}

# Funzione per analizzare codice
analyze_code() {
    local code="$1"
    
    echo -e "${BLUE}🔍 DevAI sta analizzando il codice...${NC}"
    
    response=$(curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.analyze\",
            \"params\": {
                \"code\": \"$code\"
            }
        }")
    
    if [ $? -eq 0 ]; then
        answer=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('answer','Errore nella risposta'))" 2>/dev/null)
        
        if [ "$answer" != "Errore nella risposta" ]; then
            echo -e "${GREEN}🔍 Analisi DevAI:${NC}"
            echo "$answer"
            echo ""
        else
            echo -e "${RED}❌ Errore: DevAI non ha analizzato correttamente${NC}"
        fi
    else
        echo -e "${RED}❌ Errore: Impossibile connettersi a DevAI${NC}"
    fi
}

# Funzione per fixare codice
fix_code() {
    local code="$1"
    
    echo -e "${BLUE}🔧 DevAI sta correggendo il codice...${NC}"
    
    response=$(curl -s -X POST "http://localhost:8080/call" \
        -H "x-api-key: zantara-internal-dev-key-2025" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"devai.fix\",
            \"params\": {
                \"code\": \"$code\"
            }
        }")
    
    if [ $? -eq 0 ]; then
        answer=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('answer','Errore nella risposta'))" 2>/dev/null)
        
        if [ "$answer" != "Errore nella risposta" ]; then
            echo -e "${GREEN}🔧 Codice Corretto da DevAI:${NC}"
            echo "$answer"
            echo ""
        else
            echo -e "${RED}❌ Errore: DevAI non ha corretto correttamente${NC}"
        fi
    else
        echo -e "${RED}❌ Errore: Impossibile connettersi a DevAI${NC}"
    fi
}

# Funzione per mostrare l'help
show_help() {
    echo -e "${YELLOW}📚 Comandi Disponibili:${NC}"
    echo ""
    echo "  chat <messaggio>     - Chatta con DevAI"
    echo "  analyze <codice>     - Analizza codice"
    echo "  fix <codice>         - Corregge codice"
    echo "  help                 - Mostra questo help"
    echo "  exit                 - Esci dal chat"
    echo ""
    echo -e "${YELLOW}💡 Esempi:${NC}"
    echo "  chat Ciao DevAI!"
    echo "  analyze function test() { return 5; }"
    echo "  fix const x = 5; console.log(x);"
    echo ""
}

# Loop principale
while true; do
    echo -n -e "${BLUE}👤 Tu: ${NC}"
    read -r input
    
    # Gestisci comandi speciali
    case "$input" in
        "exit"|"quit"|"q")
            echo -e "${GREEN}👋 Arrivederci! DevAI è sempre qui per te!${NC}"
            break
            ;;
        "help"|"h")
            show_help
            ;;
        "chat "*)
            message="${input#chat }"
            call_devai "$message"
            ;;
        "analyze "*)
            code="${input#analyze }"
            analyze_code "$code"
            ;;
        "fix "*)
            code="${input#fix }"
            fix_code "$code"
            ;;
        "")
            # Input vuoto, continua
            ;;
        *)
            # Tratta come messaggio normale
            call_devai "$input"
            ;;
    esac
done
