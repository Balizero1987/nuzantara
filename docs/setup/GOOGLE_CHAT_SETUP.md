# 🚀 Google Chat Setup per ZANTARA

## ✨ Due Metodi Disponibili

### **Metodo 1: Webhook (FACILE - Consigliato)**

1. **Crea uno spazio in Google Chat**
   - Apri Google Chat
   - Crea nuovo spazio o usa esistente

2. **Aggiungi Webhook**
   - Nel tuo spazio → clicca nome spazio → "Apps & integrations"
   - Clicca "Add webhooks"
   - Nome: "ZANTARA Bot"
   - Copia l'URL webhook generato

3. **Configura .env**
   ```bash
   GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/AAAA/messages?key=XXX&token=YYY
   ```

4. **Test Immediato**
   ```bash
   curl -X POST http://localhost:8080/call \
     -H "Content-Type: application/json" \
     -d '{
       "key": "googlechat.notify",
       "params": {
         "text": "🚀 ZANTARA è connesso a Google Chat!",
         "space": "dummy-for-webhook"
       }
     }'
   ```

### **Metodo 2: Bot API (Avanzato)**

1. **Google Cloud Console Setup**
   - Vai a https://console.cloud.google.com
   - Abilita Google Chat API
   - Crea Service Account con ruolo "Chat Bot"

2. **Configura Bot**
   - In Google Chat API → Configuration
   - Bot name: "ZANTARA"
   - Avatar URL: (opzionale)
   - Functionality: Enable for spaces

3. **Usa API direttamente**
   ```bash
   curl -X POST http://localhost:8080/call \
     -H "Content-Type: application/json" \
     -d '{
       "key": "googlechat.notify",
       "params": {
         "text": "Messaggio dal bot ZANTARA",
         "space": "spaces/SPACE_ID"
       }
     }'
   ```

## 📊 Esempi d'Uso

### Messaggio Semplice
```json
{
  "key": "googlechat.notify",
  "params": {
    "text": "✅ Sistema operativo",
    "space": "dummy"
  }
}
```

### Card Interattiva
```json
{
  "key": "googlechat.notify",
  "params": {
    "space": "dummy",
    "cards": [{
      "header": {
        "title": "ZANTARA Status",
        "subtitle": "Real-time monitoring"
      },
      "sections": [{
        "widgets": [{
          "keyValue": {
            "topLabel": "Status",
            "content": "🟢 Online"
          }
        }]
      }]
    }]
  }
}
```

## 🎯 Vantaggi vs Altri Sistemi

| Feature | Google Chat | Slack | Discord |
|---------|------------|--------|----------|
| **Setup** | ⭐ Facile (hai già Workspace) | Medio | Facile |
| **Costo** | ✅ Gratis (incluso) | Freemium | Gratis |
| **Integrazione** | ✅ Nativa con Drive/Calendar | Esterna | Esterna |
| **Sicurezza** | ⭐⭐⭐ Enterprise | ⭐⭐ | ⭐ |
| **Rich Messages** | ✅ Cards | ✅ Blocks | ✅ Embeds |

## 💡 Use Cases per Bali Zero

1. **Alert Sistema**: Notifiche critiche immediate
2. **Report Giornalieri**: Statistiche automatiche
3. **Integrazione Drive**: Alert su nuovi file
4. **Calendar Events**: Promemoria meeting
5. **Team Updates**: Comunicazioni team

## 🔧 Troubleshooting

- **Error "SPACE_REQUIRED"**: Aggiungi space ID o usa webhook
- **403 Forbidden**: Controlla permessi bot/webhook
- **Webhook non funziona**: Verifica che l'URL sia completo con key e token

---
*Handler implementato: `googlechat.notify` - Pronto all'uso!*