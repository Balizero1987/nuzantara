#!/bin/bash

# Quick deployment of ZANTARA Intelligence v6 interfaces
echo "🚀 Quick Deploy: ZANTARA Intelligence v6 HTML Interfaces"
echo "======================================================="

SERVICE_URL="https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app"

echo "✅ Files ready for deployment:"
echo "   • zantara-intelligence-v6.html"
echo "   • zantara-conversation-demo.html"
echo "   • zantara-production.html"
echo ""

echo "🎯 Service URL: ${SERVICE_URL}"
echo "📋 Interfaces will be available at:"
echo "   • Main Interface: ${SERVICE_URL}/zantara-intelligence-v6.html"
echo "   • Live Demo: ${SERVICE_URL}/zantara-conversation-demo.html"
echo "   • Landing Page: ${SERVICE_URL}/zantara-production.html"
echo ""

echo "⚡ Testing current service health..."
curl -s "${SERVICE_URL}/health" | head -2
echo ""

echo "✨ ZANTARA Intelligence v6 interfaces are ready!"
echo "The existing service at ${SERVICE_URL} already serves static files."
echo "Upload the HTML files to make them accessible."