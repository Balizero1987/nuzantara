# 🧪 ZANTARA Draft v1 - Test Checklist

## 🔗 URLs
- **Login**: http://localhost:8001/login-draft/login-v1.html
- **Chat**: http://localhost:8001/chat-draft/chat-v1.html

---

## ✅ LOGIN PAGE TEST

### Visual Design
- [ ] Logo ZANTARA appare con gradient blu-verde
- [ ] Card login è centrata e glassmorphism
- [ ] Background ha animazione pulse
- [ ] Form fields hanno focus states blu
- [ ] Button "Sign In" ha hover effect
- [ ] Link "Demo User" è visibile
- [ ] Footer con versione appare

### Functionality
- [ ] Input email accetta email valide
- [ ] Input password è mascherato
- [ ] Click "Sign In" mostra loading state
- [ ] Login con credenziali valide funziona
- [ ] Error message appare per credenziali invalide
- [ ] Click "Demo User" bypassa login
- [ ] Redirect a chat page dopo login
- [ ] Check auto-redirect se già loggato

### Responsive
- [ ] Mobile view (< 640px) funziona
- [ ] Logo ridimensiona correttamente
- [ ] Card si adatta allo schermo
- [ ] Inputs sono touch-friendly

---

## ✅ CHAT PAGE TEST

### Visual Design
- [ ] Header con logo ZANTARA
- [ ] User email appare nell'header
- [ ] Empty state mostra icona 💬
- [ ] Messages container ha scrollbar custom
- [ ] User messages (blu) a destra
- [ ] AI messages (grigio) a sinistra
- [ ] Avatar circolari (Y per user, Z per AI)
- [ ] Typing indicator con dots animati
- [ ] Input textarea con auto-resize
- [ ] Send button sempre visibile

### Functionality
- [ ] Check auth all'apertura
- [ ] Redirect a login se non autenticato
- [ ] User email mostrato correttamente
- [ ] Input textarea supporta multi-linea
- [ ] Enter invia, Shift+Enter nuova riga
- [ ] Message viene aggiunto subito
- [ ] Typing indicator appare durante fetch
- [ ] Response API viene mostrato
- [ ] Auto-scroll a nuovo messaggio
- [ ] Timestamp corretto per ogni messaggio
- [ ] Logout button funziona
- [ ] Redirect a login dopo logout

### API Integration
- [ ] Fetch a `/api/v3/zantara/unified` funziona
- [ ] Bearer token incluso nell'header
- [ ] Query parametri corretti (domain: all, mode: quick)
- [ ] Response parsing corretto
- [ ] Error handling mostra messaggio fallback
- [ ] Console.log mostra API calls

### Responsive
- [ ] Mobile view adatta layout
- [ ] Messages leggibili su mobile
- [ ] Input area sempre accessibile
- [ ] Header compatto su mobile
- [ ] User email nascosto su schermi piccoli

---

## 🐛 KNOWN ISSUES (da fixare in v2)

### Login
- [ ] Nessuna validazione frontend email
- [ ] Password strength indicator mancante
- [ ] Forgot password link mancante
- [ ] Remember me checkbox mancante

### Chat
- [ ] Message formatting limitato (solo plain text)
- [ ] Nessun syntax highlighting per codice
- [ ] Nessuna history persistence (refresh perde chat)
- [ ] No file upload
- [ ] No voice input
- [ ] No emoji picker
- [ ] No message edit/delete
- [ ] No search in chat history

### General
- [ ] Dark mode only (no light mode toggle)
- [ ] No loading skeleton
- [ ] No offline detection
- [ ] No service worker/PWA
- [ ] No analytics tracking

---

## 📝 NOTES

### Performance
- Initial load time: ____ ms
- API response time: ____ ms
- Animation smoothness: ⭐⭐⭐⭐⭐

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

### Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Color contrast (WCAG AA)

---

## 🎯 NEXT STEPS

Dopo test completato:

**SE OK** ✅
→ Procediamo con v2 (animazioni + SSE streaming)

**SE ISSUES** ❌
→ Correggiamo v1 prima

**FEEDBACK**:
(Scrivi qui i tuoi commenti dopo il test)

---

## 📸 SCREENSHOTS

(Incolla qui screenshot di eventuali bug o cose da migliorare)

---

**Test Date**: 2025-11-04  
**Tester**: Antonello  
**Status**: 🟡 In Testing
