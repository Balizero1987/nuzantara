#!/bin/bash

# Setup DevAI Aliases
# Aggiunge alias per DevAI al tuo shell profile

echo "🔧 Configurando alias DevAI..."

# Determina il file di configurazione dello shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_FILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_FILE="$HOME/.bashrc"
else
    SHELL_FILE="$HOME/.bashrc"
fi

# Crea gli alias
cat >> "$SHELL_FILE" << 'EOF'

# DevAI Aliases
alias devai='./chat-devai.sh'
alias devai-chat='source ./devai-commands.sh && devai_chat'
alias devai-analyze='source ./devai-commands.sh && devai_analyze'
alias devai-fix='source ./devai-commands.sh && devai_fix'
alias devai-test='source ./devai-commands.sh && devai_test'
alias devai-review='source ./devai-commands.sh && devai_review'
alias devai-explain='source ./devai-commands.sh && devai_explain'
alias devai-refactor='source ./devai-commands.sh && devai_refactor'

# Funzione per chat rapida
devai() {
    if [ $# -eq 0 ]; then
        ./chat-devai.sh
    else
        source ./devai-commands.sh
        devai_chat "$*"
    fi
}

# Funzione per analisi rapida
devai-analyze() {
    if [ $# -eq 0 ]; then
        echo "Usage: devai-analyze 'codice'"
        return 1
    fi
    source ./devai-commands.sh
    devai_analyze "$*"
}

# Funzione per fix rapido
devai-fix() {
    if [ $# -eq 0 ]; then
        echo "Usage: devai-fix 'codice'"
        return 1
    fi
    source ./devai-commands.sh
    devai_fix "$*"
}

# Funzione per test rapidi
devai-test() {
    if [ $# -eq 0 ]; then
        echo "Usage: devai-test 'codice'"
        return 1
    fi
    source ./devai-commands.sh
    devai_test "$*"
}

# Funzione per review rapida
devai-review() {
    if [ $# -eq 0 ]; then
        echo "Usage: devai-review 'codice'"
        return 1
    fi
    source ./devai-commands.sh
    devai_review "$*"
}

# Funzione per spiegazione rapida
devai-explain() {
    if [ $# -eq 0 ]; then
        echo "Usage: devai-explain 'codice'"
        return 1
    fi
    source ./devai-commands.sh
    devai_explain "$*"
}

# Funzione per refactoring rapido
devai-refactor() {
    if [ $# -eq 0 ]; then
        echo "Usage: devai-refactor 'codice'"
        return 1
    fi
    source ./devai-commands.sh
    devai_refactor "$*"
}

echo "🤖 DevAI aliases loaded! Use 'devai' to start chatting"
EOF

echo "✅ Alias aggiunti a $SHELL_FILE"
echo ""
echo "🔄 Per applicare gli alias, esegui:"
echo "  source $SHELL_FILE"
echo ""
echo "🎯 Oppure riavvia il terminale"
echo ""
echo "📚 Comandi disponibili:"
echo "  devai                    - Chat interattivo"
echo "  devai 'messaggio'        - Chat rapido"
echo "  devai-analyze 'codice'   - Analizza codice"
echo "  devai-fix 'codice'       - Corregge codice"
echo "  devai-test 'codice'      - Genera test"
echo "  devai-review 'codice'    - Review codice"
echo "  devai-explain 'codice'   - Spiega codice"
echo "  devai-refactor 'codice'  - Refactoring"
