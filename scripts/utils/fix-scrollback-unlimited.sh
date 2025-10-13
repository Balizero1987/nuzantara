#!/bin/bash
# =========================================
# FIX SCROLLBACK ILLIMITATO - iTerm2
# =========================================

echo "🔧 Fixing iTerm2 unlimited scrollback..."

# 1. Force unlimited scrollback globally
defaults write com.googlecode.iterm2 UnlimitedScrollback -bool true

# 2. Set scrollback lines to 0 (unlimited)
defaults write com.googlecode.iterm2 "Scrollback Lines" -int 0

# 3. Force unlimited for all profiles
defaults write com.googlecode.iterm2 "New Bookmarks" -array-add '{
    "Unlimited Scrollback" = 1;
    "Scrollback Lines" = 0;
    "Name" = "ZANTARA Unlimited";
}'

# 4. Clear any existing limits
defaults delete com.googlecode.iterm2 "Scrollback Lines" 2>/dev/null || true

# 5. Force restart iTerm2 preferences
killall cfprefsd 2>/dev/null || true

echo "✅ Scrollback unlimited configurato!"
echo ""
echo "📋 Verifica:"
echo "   1. Chiudi iTerm2 completamente"
echo "   2. Riapri iTerm2"  
echo "   3. Preferences → Profiles → Terminal"
echo "   4. Verifica 'Unlimited scrollback' sia attivo"
echo ""
echo "🔧 Se ancora non funziona:"
echo "   - Vai manualmente in Preferences → Profiles"
echo "   - Seleziona il profilo attivo"
echo "   - Tab 'Terminal' → 'Unlimited scrollback'"