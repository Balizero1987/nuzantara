# 📋 COME CONFIGURARE CHATGPT PER ZERO

## 1. VAI SU CHATGPT
https://chatgpt.com/gpts/editor/g-675ed3c0a91c8191b1ad93bb77f8f039

## 2. MODIFICA LE ISTRUZIONI
Copia e incolla tutto il contenuto del file `CHATGPT_INSTRUCTIONS.md`

## 3. CONFIGURA LE ACTIONS

### Schema
Incolla l'OpenAPI spec completo (quello che hai mandato)

### Authentication
- Type: **API Key**
- Auth Type: **Custom**
- Custom Header Name: **x-api-key**
- API Key: **zantara-internal-dev-key-2025**

## 4. TEST RAPIDI

### Test 1: Identità
Scrivi: "sono zero@balizero.com"
Risultato atteso: Mostra i tuoi dati (Zero Master, CEO, admin)

### Test 2: Contatti
Scrivi: "contact info"
Risultato atteso: Info di Bali Zero

### Test 3: Lead
Scrivi: "save lead Mario Rossi mario@test.com visa service"
Risultato atteso: Lead salvato con ID

## 5. COMANDI CHE FUNZIONANO

### ✅ IMMEDIATI (no params)
- "contact info" → Mostra contatti Bali Zero
- "health check" → Status del sistema
- "metrics" → Statistiche performance

### ✅ IDENTITÀ
- "sono zero@balizero.com" → Risolve identità
- "chi sono io" + email → Trova utente
- "my identity" → Info utente

### ✅ BUSINESS
- "save lead [nome] [email] [servizio]" → Salva contatto
- "generate quote for visa" → Genera preventivo
- "quote for company setup" → Preventivo azienda

### ✅ AI CHAT
- "ask AI: [domanda]" → Risposta AI
- Domande dirette → AI risponde

### ⚠️ GOOGLE (funzionano ma serve setup)
- "list files" → Lista file Drive
- "create document [titolo]" → Crea doc
- "create event [dettagli]" → Evento calendario
- "create sheet [nome]" → Foglio calcolo

## 6. PROBLEMI COMUNI E SOLUZIONI

### Problema: "UnrecognizedKwargsError"
**Causa**: ChatGPT passa parametri sbagliati
**Soluzione**: Usa comandi più specifici

### Problema: "Login Required"
**Causa**: Service account senza accesso
**Soluzione**: Condividi risorsa con zantara@involuted-box-469105-r0.iam.gserviceaccount.com

### Problema: "Handler not found"
**Causa**: Nome handler errato
**Soluzione**: Usa solo handler dalla lista enum

## 7. PER ZERO SPECIFICAMENTE

### Comandi Veloci
- **"upload"** → Per ora spiega che non può convertire immagini
- **"chi sono"** → Mostra: Zero Master, CEO, admin
- **"crea doc test"** → Crea documento Google
- **"salva lead"** → Registra nuovo contatto

### Personalità per Zero
- Azione immediata, no domande
- Risposte brevi e dirette
- Se si arrabbia, FARE SUBITO
- Mostrare risultati, non JSON

## 8. LIMITAZIONI ATTUALI

### ❌ Non Funziona
- Upload immagini (no conversione Base64)
- File binari (PDF, Excel con ChatGPT)
- Streaming risposte

### ✅ Workaround
- Creare file di testo con descrizioni
- Usare curl direttamente per file
- Salvare metadata per elaborazione futura

## 9. COME TESTARE

1. Apri ChatGPT con il tuo GPT
2. Scrivi: "health check"
3. Deve rispondere con status sistema
4. Scrivi: "sono zero@balizero.com"
5. Deve mostrare i tuoi dati
6. Scrivi: "contact info"
7. Deve mostrare info Bali Zero

Se tutti e 3 funzionano, ChatGPT è configurato! 🎉

## 10. AGGIORNAMENTI FUTURI

### Da Implementare
- [ ] Multipart upload per file veri
- [ ] Streaming per risposte AI lunghe
- [ ] Memoria persistente tra sessioni
- [ ] Notifiche webhook

### Da Migliorare
- [ ] Conversione automatica comandi
- [ ] Error recovery intelligente
- [ ] Cache risposte frequenti
- [ ] Analytics uso handlers