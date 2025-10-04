# 📋 ZANTARA Custom GPT - Formati Corretti per Handlers

## ⚠️ IMPORTANTE: Usare questi formati ESATTI nel Custom GPT

### 📅 **Calendar.create** - Creare Eventi
```json
{
  "key": "calendar.create",
  "params": {
    "event": {
      "summary": "Titolo del meeting",
      "description": "Descrizione dettagliata",
      "start": {
        "dateTime": "2024-12-15T15:00:00+07:00",
        "timeZone": "Asia/Jakarta"
      },
      "end": {
        "dateTime": "2024-12-15T16:00:00+07:00",
        "timeZone": "Asia/Jakarta"
      },
      "attendees": [
        {"email": "ari.firda@balizero.com"},
        {"email": "zero@balizero.com"}
      ],
      "reminders": {
        "useDefault": false,
        "overrides": [
          {"method": "email", "minutes": 30},
          {"method": "popup", "minutes": 10}
        ]
      }
    }
  }
}
```

### 📁 **Drive.upload** - Caricare File
```json
{
  "key": "drive.upload",
  "params": {
    "requestBody": {
      "name": "Nome_del_file.txt",
      "description": "Descrizione opzionale del file",
      "mimeType": "text/plain"
    },
    "media": {
      "body": "BASE64_ENCODED_CONTENT",
      "mimeType": "text/plain"
    }
  }
}
```

#### Tipi MIME Comuni:
- `text/plain` - File di testo
- `text/csv` - File CSV
- `application/pdf` - PDF
- `application/vnd.google-apps.document` - Google Docs
- `application/vnd.google-apps.spreadsheet` - Google Sheets
- `application/json` - JSON
- `image/png` - Immagini PNG
- `image/jpeg` - Immagini JPEG

### 📊 **Sheets.create** - Creare Fogli di Calcolo
```json
{
  "key": "sheets.create",
  "params": {
    "title": "Nuovo Foglio di Calcolo",
    "sheets": [
      {
        "properties": {
          "title": "Foglio 1",
          "gridProperties": {
            "rowCount": 100,
            "columnCount": 10
          }
        }
      }
    ]
  }
}
```

### 📝 **Sheets.append** - Aggiungere Dati a Foglio
```json
{
  "key": "sheets.append",
  "params": {
    "spreadsheetId": "ID_DEL_FOGLIO",
    "range": "Sheet1!A1",
    "values": [
      ["Nome", "Email", "Ruolo"],
      ["Ari", "ari.firda@balizero.com", "Lead Specialist"],
      
    ]
  }
}
```

### 📄 **Docs.create** - Creare Documenti
```json
{
  "key": "docs.create",
  "params": {
    "title": "Nuovo Documento",
    "body": {
      "content": [
        {
          "paragraph": {
            "elements": [
              {
                "textRun": {
                  "content": "Titolo del Documento\n",
                  "textStyle": {
                    "bold": true,
                    "fontSize": {
                      "magnitude": 18,
                      "unit": "PT"
                    }
                  }
                }
              }
            ]
          }
        },
        {
          "paragraph": {
            "elements": [
              {
                "textRun": {
                  "content": "Contenuto del documento qui..."
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

### 📧 **Gmail.send** - Inviare Email
```json
{
  "key": "gmail.send",
  "params": {
    "to": "destinatario@example.com",
    "subject": "Oggetto dell'email",
    "body": "Contenuto dell'email in testo semplice",
    "html": "<h1>Contenuto HTML</h1><p>Con formattazione</p>",
    "cc": "copia@example.com",
    "bcc": "copia-nascosta@example.com"
  }
}
```

### 🤖 **AI.chat** - Chat con AI
```json
{
  "key": "ai.chat",
  "params": {
    "prompt": "La tua domanda o richiesta qui",
    "temperature": 0.7,
    "max_tokens": 1000,
    "model": "gpt-3.5-turbo"
  }
}
```

### 👤 **Identity.resolve** - Risolvere Identità
```json
{
  "key": "identity.resolve",
  "params": {
    "email": "utente@balizero.com",
    "hint": "nome o ruolo opzionale"
  }
}
```

### 💰 **Quote.generate** - Generare Preventivi
```json
{
  "key": "quote.generate",
  "params": {
    "service": "visa",
    "details": "Business visa (B211B) for 6 months",
    "client": "Nome Cliente"
  }
}
```

### 🧠 **ZANTARA Dashboard** - Metriche Sistema
```json
{
  "key": "zantara.dashboard.overview",
  "params": {}
}
```

## 🔴 ERRORI COMUNI DA EVITARE

1. ❌ **NON** mettere i parametri dell'evento calendario direttamente in `params`
   - ✅ **SEMPRE** usare `params.event` per calendar.create

2. ❌ **NON** dimenticare di encodare in base64 il contenuto dei file
   - ✅ **SEMPRE** convertire il contenuto in base64 per drive.upload

3. ❌ **NON** usare date in formato sbagliato
   - ✅ **SEMPRE** usare ISO 8601 con timezone (es: 2024-12-15T15:00:00+07:00)

4. ❌ **NON** dimenticare il mimeType per i file
   - ✅ **SEMPRE** specificare il mimeType corretto

## 📌 NOTE IMPORTANTI

- **API Key**: Sempre includere header `x-api-key`
- **Content-Type**: Sempre `application/json`
- **Base URL**: `https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app`
- **Timezone Bali**: `Asia/Jakarta` (UTC+7) o `Asia/Makassar` (UTC+8)

## 🧪 TEST RAPIDI

### Test Calendar:
```bash
curl -X POST [BASE_URL]/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: [API_KEY]" \
  -d '{"key":"calendar.create","params":{"event":{"summary":"Test","start":{"dateTime":"2024-12-20T10:00:00+07:00"},"end":{"dateTime":"2024-12-20T11:00:00+07:00"}}}}'
```

### Test Drive Upload:
```bash
echo "Test content" | base64
# Usa l'output nel campo media.body
```

---

**Ultimo Aggiornamento**: 26 Settembre 2025
**Versione Sistema**: ZANTARA v5.2.0
