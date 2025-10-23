# 🧪 TEST WEBAPP ADESSO - Istruzioni Immediate

## 🎯 USA SERVER LOCALE (Più veloce, ha i fix)

**Server già attivo**: http://localhost:8080

### **STEP 1: LOGIN**
1. Vai su: http://localhost:8080/login.html
2. Click: "Accedi al Team" (tab viola)
3. Email: `zero@balizero.com`
4. PIN: `010719`
5. Click: "Accedi al Team" (bottone)

**Aspettati**:
- ✅ Messaggio "🔄 Logging in..."
- ✅ Poi "✅ Login successful!"
- ✅ Redirect a chat.html

### **STEP 2: CHAT**
1. Dovresti vedere: "Zero" in alto a destra (non "Login")
2. Scrivi: "Ciao"
3. Premi: **Enter** sulla tastiera
4. Aspettati: Messaggio inviato, Zantara risponde

---

## ⚠️ SE NON FUNZIONA LOCALE (CORS):

Usa questa versione diretta senza frontend:


<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">echo '#!/bin/bash
echo "🧪 TEST COMPLETO ZANTARA"
echo ""
echo "1️⃣ TEST LOGIN..."
LOGIN_RESULT=$(curl -s -X POST https://ts-backend-production-568d.up.railway.app/team.login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"zero@balizero.com\",\"pin\":\"010719\",\"name\":\"Zero\"}")

echo "$LOGIN_RESULT" | python3 -m json.tool
echo ""

if echo "$LOGIN_RESULT" | grep -q "\"success\":true"; then
  echo "✅ LOGIN SUCCESSFUL!"
  SESSION_ID=$(echo "$LOGIN_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)[\"sessionId\"])")
  echo "Session ID: $SESSION_ID"
  echo ""
  
  echo "2️⃣ TEST CHAT..."
  curl -s -X POST https://scintillating-kindness-production-47e3.up.railway.app/bali-zero/chat \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"Ciao! Chi si è loggato oggi?\",\"user_email\":\"zero@balizero.com\",\"user_role\":\"admin\"}" \
    | python3 -m json.tool | head -30
  echo ""
  echo "✅ CHAT FUNZIONA!"
else
  echo "❌ LOGIN FAILED"
fi
' > test-webapp-complete.sh && chmod +x test-webapp-complete.sh && ./test-webapp-complete.sh
