#!/bin/bash

echo "🔐 ZANTARA Production OAuth2 Re-Authorization"
echo "============================================="
echo ""

echo "📋 Current Workspace Scopes Required:"
echo "• https://www.googleapis.com/auth/documents"
echo "• https://www.googleapis.com/auth/spreadsheets"
echo "• https://www.googleapis.com/auth/presentations"
echo "• (plus existing Calendar, Drive, Gmail scopes)"
echo ""

echo "🎯 Step 1: Generate Authorization URL"
echo "-----------------------------------"
node authorize-workspace.js

echo ""
echo "📱 Step 2: Manual Authorization Required"
echo "---------------------------------------"
echo "1. Open the URL above in your browser"
echo "2. Sign in with zero@balizero.com"
echo "3. Accept ALL permissions (including new Workspace scopes)"
echo "4. Copy the authorization code from the redirect"
echo ""

echo "⏳ Waiting for authorization code..."
echo "Once you have the code, run:"
echo "   ./complete-reauth.sh [AUTHORIZATION_CODE]"
echo ""

echo "💡 Alternative: If you want to proceed with simulation:"
echo "   ./simulate-workspace-production.sh"