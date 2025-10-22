# 🧪 Test Plan: Enter Key & ImagineArt Fix

**URL Webapp:** https://zantara.balizero.com  
**Status:** ✅ Deployed (Commit: 55ffdbf)

---

## ✅ Test Checklist

### 1️⃣ Test Tasto Invio - Chat Page

**URL:** https://zantara.balizero.com/chat.html

**Steps:**
1. [ ] Apri la pagina chat.html
2. [ ] Fai login (se richiesto)
3. [ ] Trova il campo di input in basso
4. [ ] Scrivi un messaggio di test (es. "Ciao")
5. [ ] Premi il tasto **Invio** sulla tastiera
6. [ ] Apri la Console del browser (F12)
7. [ ] Cerca il log: `✅ [Enter Key] Detected - sending message`

**Expected Result:**
- ✅ Il messaggio viene inviato immediatamente
- ✅ Il campo di input si svuota
- ✅ Vedi il log nella console
- ✅ La chat mostra il messaggio inviato

**Status:** [ ] ✅ PASS | [ ] ❌ FAIL

---

### 2️⃣ Test Tasto Invio - Dashboard

**URL:** https://zantara.balizero.com/dashboard.html

**Steps:**
1. [ ] Apri la pagina dashboard.html
2. [ ] Fai login
3. [ ] Cerca il pulsante chat in basso a destra (icona 💬)
4. [ ] Clicca per aprire il widget chat
5. [ ] Scrivi un messaggio
6. [ ] Premi **Invio**
7. [ ] Verifica che il messaggio venga inviato

**Expected Result:**
- ✅ Widget chat si apre
- ✅ Messaggio viene inviato con Invio
- ✅ Campo di input si svuota

**Status:** [ ] ✅ PASS | [ ] ❌ FAIL

---

### 3️⃣ Test ImagineArt - Errore Handling

**URL:** https://zantara.balizero.com/chat.html

**Steps:**
1. [ ] Apri chat.html
2. [ ] Cerca il pulsante **🎨** (ImagineArt) tra i pulsanti in basso
3. [ ] Clicca sul pulsante
4. [ ] Si apre un modal per generare immagini
5. [ ] Inserisci un prompt (es. "Beautiful sunset in Bali")
6. [ ] Seleziona uno stile (es. "Realistic")
7. [ ] Clicca "Generate Image"
8. [ ] Apri la Console (F12)
9. [ ] Guarda i log

**Expected Result (se funziona):**
- ✅ Vedi progress bar
- ✅ Log: `🎨 Generating image with Imagine.art...`
- ✅ Log: `✅ Image generation response: {...}`
- ✅ Immagine generata appare nel modal

**Expected Result (se errore):**
- ✅ Log dettagliato: `🔍 Raw response: ...`
- ✅ Box rosso appare con messaggio di errore chiaro
- ✅ Il messaggio spiega cosa è andato storto
- ✅ Box scompare dopo 5 secondi

**Status:** [ ] ✅ PASS | [ ] ❌ FAIL

---

### 4️⃣ Test Browser Compatibility

**Test su diversi browser:**

| Browser | Enter Key (chat.html) | Enter Key (dashboard) | ImagineArt |
|---------|----------------------|----------------------|------------|
| Chrome  | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌ |
| Firefox | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌ |
| Safari  | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌ |
| Edge    | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌       | [ ] ✅ / [ ] ❌ |

---

## 🔍 Debug Guide

### Se il Tasto Invio Non Funziona

1. **Apri Console (F12)**
2. **Cerca errori JavaScript**
3. **Verifica che appaia il log:**
   - `✅ [Enter Key] Detected - sending message`
   - oppure
   - `✅ [Enter Key Fallback] Detected via keypress - sending message`

4. **Se nessun log appare:**
   - Verifica che il file sia stato caricato correttamente
   - Prova a fare hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
   - Controlla Network tab per vedere se ci sono errori di caricamento

### Se ImagineArt Dà Errore

1. **Apri Console (F12)**
2. **Cerca il log:** `🔍 Raw response: ...`
3. **Leggi il messaggio di errore dettagliato**
4. **Possibili cause:**
   - Backend TS non raggiungibile
   - API key scaduta o non valida
   - Quota API esaurita
   - Parametri non validi

---

## 📝 Test Results

**Data Test:** _______________  
**Tester:** _______________

### Summary

- [ ] ✅ Tutti i test passati
- [ ] ⚠️ Alcuni test falliti (specificare sotto)
- [ ] ❌ Molti test falliti

### Notes

```
[Scrivi qui eventuali note, errori riscontrati, o comportamenti strani]





```

---

## 🚀 Quick Test Commands

Se vuoi testare rapidamente dal terminale:

### Test 1: Verifica che il file sia online
```bash
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://zantara.balizero.com/chat.html
```

### Test 2: Verifica che le modifiche siano presenti
```bash
curl -s https://zantara.balizero.com/chat.html | grep -o "stopPropagation" | wc -l
```
**Expected:** Dovrebbe mostrare almeno 4 (due in chat.html, due event listeners)

### Test 3: Test ImagineArt endpoint
```bash
curl -X POST https://ts-backend-production-568d.up.railway.app/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai-services.image.generate",
    "params": {
      "prompt": "test",
      "style": "realistic",
      "aspect_ratio": "1:1"
    }
  }'
```

---

## ✅ Acceptance Criteria

**Il fix è considerato SUCCESS se:**

1. ✅ Il tasto Invio invia messaggi in chat.html
2. ✅ Il tasto Invio invia messaggi in dashboard.html
3. ✅ ImagineArt mostra errori dettagliati (se fallisce)
4. ✅ Non ci sono regressioni (altre funzioni continuano a funzionare)
5. ✅ Console non mostra errori JavaScript critici
6. ✅ Funziona su almeno Chrome, Firefox, Safari

---

**Test Plan Version:** 1.0  
**Created:** October 22, 2025  
**Last Updated:** October 22, 2025
