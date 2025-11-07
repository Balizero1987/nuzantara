#!/bin/bash

# Script di monitoraggio deploy ZANTARA
# Uso: ./monitor-deploy.sh

echo "🚀 ZANTARA Deploy Monitor"
echo "=========================="
echo ""

# Ottieni il run ID più recente
RUN_ID=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null)

if [ -z "$RUN_ID" ]; then
    echo "❌ Nessun workflow trovato"
    exit 1
fi

echo "📝 Run ID: $RUN_ID"
echo ""

# Mostra lo stato generale
echo "📊 Stato Workflow:"
gh run view $RUN_ID --json status,conclusion,displayTitle,startedAt,url --jq '{
    status: .status,
    conclusion: (.conclusion // "N/A"),
    title: .displayTitle,
    started: .startedAt,
    url: .url
} | "  Status: \(.status)\n  Conclusion: \(.conclusion)\n  Title: \(.title)\n  Started: \(.started)\n  URL: \(.url)"' 2>/dev/null

echo ""
echo "📋 Dettaglio Job:"
gh run view $RUN_ID --json jobs --jq '.jobs[] | "  \(.name): \(.status)\(if .conclusion then " (\(.conclusion))" else "" end)"' 2>/dev/null

echo ""
echo "🔍 Per monitorare in tempo reale:"
echo "  gh run watch $RUN_ID"
echo ""
echo "🌐 Per aprire nel browser:"
echo "  gh run view $RUN_ID --web"
echo ""
echo "🔗 Link diretto:"
gh run view $RUN_ID --json url --jq '.url' 2>/dev/null

