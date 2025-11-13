# PATCH: Fix Login/Chat Redirect Stabilization

## PROBLEMA
Il redirect tra login e chat non è stabile. I file hanno path inconsistenti.

## SOLUZIONE
Standardizzare TUTTI i redirect a `/chat.html` (con estensione esplicita).

---

## FILE DA MODIFICARE

### 1. js/login.js

**CERCA (riga ~182):**
```javascript
window.location.href = '/chat';
```

**SOSTITUISCI CON:**
```javascript
window.location.href = '/chat.html';
```

---

### 2. js/auth-auto-login.js

**CERCA (riga ~57):**
```javascript
window.location.href = '/chat';
```

**SOSTITUISCI CON:**
```javascript
window.location.href = '/chat.html';
```

---

### 3. js/auth-guard.js

**CERCA (riga ~130):**
```javascript
const protectedPages = ['/chat', '/chat.html'];
```

**SOSTITUISCI CON:**
```javascript
const protectedPages = ['/chat.html', '/chat/index.html'];
```

---

### 4. login.html (se presente)

**CERCA:**
```javascript
window.location.href = '/chat.html';
```

**VERIFICA CHE SIA GIÀ CORRETTO** (deve essere `/chat.html` NON `/chat`)

---

## DOPO LE MODIFICHE

1. **Test locale:**
   ```bash
   npm run dev
   # Vai su http://localhost:5173/login.html
   # Fai login
   # VERIFICA: URL deve essere /chat.html
   ```

2. **Commit:**
   ```bash
   git add js/login.js js/auth-auto-login.js js/auth-guard.js
   git commit -m "fix: Standardize all redirects to /chat.html"
   ```

3. **Deploy GitHub Pages:**
   ```bash
   # Checkout gh-pages branch
   git checkout gh-pages
   
   # Copia i file corretti da main
   git checkout main -- js/login.js js/auth-auto-login.js js/auth-guard.js
   
   # Commit e push
   git add js/*.js
   git commit -m "fix: Deploy login/chat redirect fixes"
   git push origin gh-pages
   ```

4. **Attendi 2-3 minuti** per GitHub Pages rebuild

5. **Test produzione:**
   - Vai su https://zantara.balizero.com
   - Cancella localStorage (DevTools → Application → Clear Storage)
   - Fai login
   - Verifica URL finale sia `/chat.html`

---

## VERIFICA RAPIDA

Dopo il deploy, verifica con:

```bash
# Test 1: login.js
curl -s https://zantara.balizero.com/js/login.js | grep "chat.html"

# Test 2: auth-auto-login.js  
curl -s https://zantara.balizero.com/js/auth-auto-login.js | grep "chat.html"

# Test 3: auth-guard.js
curl -s https://zantara.balizero.com/js/auth-guard.js | grep "protectedPages"
```

Tutti e 3 devono ritornare righe con `chat.html`.

---

## NOTE

- ✅ Usa SEMPRE `/chat.html` (con estensione)
- ❌ NON usare `/chat` (senza estensione)
- Il file fisico può essere sia `/chat.html` che `/chat/index.html`
- I redirect devono puntare a `/chat.html` per consistenza

---

## STATUS IMPLEMENTAZIONE

### ✅ File Root (`/js/`)
- [x] `js/login.js` - Linea 182: ✅ Corretto (`/chat.html`)
- [x] `js/auth-auto-login.js` - Linea 57: ✅ Corretto (`/chat.html`)
- [x] `js/auth-guard.js` - Linea 130: ✅ Corretto (`protectedPages = ['/chat.html', '/chat/index.html']`)

### ✅ File Webapp-Dev (`/webapp-dev/js/`)
- [x] `webapp-dev/js/login.js` - Linea 182: ✅ Corretto (`/chat.html`)
- [x] `webapp-dev/js/auth-auto-login.js` - Linea 57: ✅ Corretto (`/chat.html`)
- [x] `webapp-dev/js/auth-guard.js` - Linea 130: ✅ Corretto (`protectedPages = ['/chat.html', '/chat/index.html']`)

### ✅ File HTML
- [x] `webapp-dev/login.html` - Linea 9: ✅ Corretto (`/chat.html`)

### 📝 Note Aggiuntive
- `auth-auto-login.js` contiene ancora controlli per `/chat` senza estensione nella funzione di skip (linea 9), ma questo è **corretto** perché serve a verificare se siamo già su una pagina chat per evitare redirect infiniti
- Tutti i redirect attivi sono stati standardizzati a `/chat.html`

---

## CHECKLIST COMPLETAMENTO

### Pre-Deploy
- [x] Modifiche applicate a tutti i file
- [x] Verifica locale dei redirect
- [ ] Test completo del flusso login → chat
- [ ] Verifica che non ci siano loop di redirect

### Deploy
- [ ] Commit delle modifiche
- [ ] Merge su branch principale
- [ ] Deploy su GitHub Pages (se applicabile)
- [ ] Verifica post-deploy con curl

### Post-Deploy
- [ ] Test manuale su produzione
- [ ] Verifica URL finale dopo login
- [ ] Monitoraggio errori console per 24h
- [ ] Documentazione aggiornata

---

## VERIFICA LOCALE

Prima del deploy, esegui questi controlli:

```bash
# Verifica 1: Controlla tutti i redirect in js/login.js
grep -n "window.location.href.*chat" js/login.js

# Verifica 2: Controlla redirect in js/auth-auto-login.js
grep -n "window.location.href.*chat" js/auth-auto-login.js

# Verifica 3: Controlla protectedPages in js/auth-guard.js
grep -n "protectedPages" js/auth-guard.js

# Verifica 4: Cerca eventuali redirect a /chat (senza .html) rimasti
grep -rn "window.location.href.*['\"]/chat['\"]" js/ webapp-dev/js/ 2>/dev/null | grep -v ".md"
```

**Output atteso:** Tutti i redirect devono contenere `/chat.html`, non `/chat`

---

## TROUBLESHOOTING

### Problema: Redirect loop infinito
**Sintomi:** La pagina continua a reindirizzare tra login e chat
**Soluzione:**
1. Verifica che `auth-guard.js` abbia il circuit breaker attivo
2. Controlla localStorage per `zantara-redirect-attempt`
3. Cancella localStorage e riprova
4. Verifica che `protectedPages` contenga solo `/chat.html` e `/chat/index.html`

### Problema: Redirect non funziona dopo login
**Sintomi:** Login riuscito ma rimane su login.html
**Soluzione:**
1. Verifica console per errori JavaScript
2. Controlla che `localStorage` contenga `zantara-token`
3. Verifica che il redirect in `login.js` sia `/chat.html` (non `/chat`)
4. Controlla che `chat.html` esista nella root del progetto

### Problema: 404 su /chat.html
**Sintomi:** Redirect funziona ma pagina non trovata
**Soluzione:**
1. Verifica che `chat.html` esista nella root del progetto
2. Se esiste solo `/chat/index.html`, aggiorna i redirect o crea symlink
3. Verifica configurazione server (GitHub Pages, nginx, ecc.)

---

**PRIORITÀ:** ALTA
**TESTING:** Obbligatorio in locale prima del deploy
**ROLLBACK:** Se fallisce, revert commit e torna alla versione precedente
**ULTIMO AGGIORNAMENTO:** 2025-01-XX (aggiornare con data corrente)
