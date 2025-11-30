# Test Avanzati - Guida Completa

## 🎯 Panoramica

Questi test avanzati coprono:
1. **Test con Backend Reale** - Integrazione con backend non mockato
2. **Test di Performance** - Metriche di performance end-to-end
3. **Test di Sicurezza** - Autenticazione, autorizzazione, input validation
4. **Test di Regressione** - Prevenzione regressioni e bug fixes

## 📋 Test Implementati

### 1. Test con Backend Reale (`e2e/real-backend.spec.ts`)

**Cosa verificano:**
- ✅ Autenticazione con backend reale
- ✅ Chat con backend reale
- ✅ Streaming con backend reale
- ✅ Gestione errori backend
- ✅ Health check backend

**Requisiti:**
- Backend deve essere accessibile
- Credenziali di test nelle variabili d'ambiente:
  - `E2E_TEST_EMAIL`
  - `E2E_TEST_PIN`
  - `NUZANTARA_API_URL`
  - `NUZANTARA_API_KEY`

**Esecuzione:**
```bash
# Con backend reale
NUZANTARA_API_URL=https://nuzantara-rag.fly.dev \
E2E_TEST_EMAIL=test@example.com \
E2E_TEST_PIN=1234 \
npm run test:e2e -- e2e/real-backend.spec.ts
```

### 2. Test di Performance (`e2e/performance.spec.ts`)

**Cosa verificano:**
- ✅ Tempo di caricamento homepage (< 3s)
- ✅ Tempo di risposta API chat (< 2s SLA)
- ✅ Time to first chunk streaming (< 500ms)
- ✅ Gestione richieste concorrenti
- ✅ Performance sotto carico
- ✅ Dimensione bundle JavaScript (< 500KB)

**Metriche monitorate:**
- Load time
- DOM Content Loaded
- API response time
- Time to first chunk
- Bundle size

**Esecuzione:**
```bash
npm run test:e2e:performance
```

### 3. Test di Sicurezza (`e2e/security.spec.ts`)

**Cosa verificano:**
- ✅ Autenticazione richiesta per route protette
- ✅ Validazione formato token
- ✅ Scadenza token
- ✅ Sanitizzazione input (XSS protection)
- ✅ Validazione formato email
- ✅ Limitazione lunghezza input
- ✅ Security headers
- ✅ HTTPS in produzione
- ✅ Protezione CSRF
- ✅ Storage sicuro token
- ✅ Clear token su logout
- ✅ Autorizzazione basata su ruoli

**Esecuzione:**
```bash
npm run test:e2e:security
```

### 4. Test di Regressione (`e2e/regression.spec.ts`)

**Cosa verificano:**
- ✅ Flussi utente critici
- ✅ Bug fixes noti
- ✅ Edge cases
- ✅ Compatibilità browser
- ✅ Gestione errori di rete
- ✅ Persistenza chat history
- ✅ Gestione click rapidi
- ✅ Caratteri speciali
- ✅ Messaggi molto lunghi
- ✅ Caratteri Unicode
- ✅ Interazioni tab concorrenti
- ✅ Diverse dimensioni viewport
- ✅ Navigazione browser back/forward

**Esecuzione:**
```bash
npm run test:e2e:regression
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

Il workflow `.github/workflows/frontend-e2e-real-backend.yml` esegue automaticamente:

1. **Setup ambiente**
   - Checkout code
   - Setup Node.js 20
   - Install dependencies
   - Install Playwright browsers

2. **Esecuzione test**
   - Test E2E con backend reale
   - Test di performance
   - Test di sicurezza
   - Test di regressione

3. **Upload risultati**
   - Playwright report HTML
   - Video dei test falliti
   - Screenshot degli errori

### Configurazione Secrets

Aggiungi questi secrets su GitHub:
- `NUZANTARA_API_KEY` - API key per backend
- `E2E_TEST_EMAIL` - Email per test E2E
- `E2E_TEST_PIN` - PIN per test E2E

### Trigger Workflow

Il workflow si attiva su:
- Push su `main` o `develop`
- Pull request su `main` o `develop`
- Manualmente via `workflow_dispatch`

## 📊 Metriche Performance

### Budget Performance

| Metrica | Target | Test |
|---------|--------|------|
| Homepage Load Time | < 3s | ✅ |
| DOM Content Loaded | < 2s | ✅ |
| API Response Time | < 2s | ✅ |
| Time to First Chunk | < 500ms | ✅ |
| Bundle Size (JS) | < 500KB | ✅ |

### Monitoraggio

I test di performance registrano:
- Tempo di caricamento pagina
- Tempo di risposta API
- Tempo al primo chunk streaming
- Dimensione bundle
- Performance sotto carico

## 🔒 Sicurezza

### Checklist Sicurezza

- [x] Autenticazione richiesta per route protette
- [x] Validazione formato token
- [x] Sanitizzazione input (XSS)
- [x] Validazione formato email
- [x] Limitazione lunghezza input
- [x] Security headers
- [x] HTTPS in produzione
- [x] Protezione CSRF
- [x] Storage sicuro token
- [x] Clear token su logout

### Vulnerabilità Testate

- **XSS**: Input sanitization
- **CSRF**: Request validation
- **Authentication**: Token validation
- **Authorization**: Role-based access
- **Input Validation**: Email, length limits

## 🐛 Regressione

### Bug Fixes Verificati

- Chat history persiste su reload
- Gestione click rapidi (debouncing)
- Caratteri speciali nell'input
- Messaggi molto lunghi
- Caratteri Unicode
- Errori di rete

### Edge Cases Testati

- Input vuoto
- Input molto lungo
- Caratteri speciali
- Unicode
- Tab concorrenti
- Diverse viewport
- Navigazione browser

## 📝 Esecuzione Locale

### Test con Backend Reale

```bash
# Setup variabili d'ambiente
export NUZANTARA_API_URL=https://nuzantara-rag.fly.dev
export NUZANTARA_API_KEY=your-api-key
export E2E_TEST_EMAIL=test@example.com
export E2E_TEST_PIN=1234

# Esegui test
npm run test:e2e -- e2e/real-backend.spec.ts
```

### Test di Performance

```bash
npm run test:e2e:performance
```

### Test di Sicurezza

```bash
npm run test:e2e:security
```

### Test di Regressione

```bash
npm run test:e2e:regression
```

### Tutti i Test E2E

```bash
npm run test:e2e
```

## 🔍 Debugging

### Visualizzare Test Falliti

```bash
# Con UI interattiva
npm run test:e2e:ui

# Modalità headed (vedi browser)
npm run test:e2e:headed
```

### Screenshot e Video

I test falliti generano automaticamente:
- Screenshot: `test-results/`
- Video: `test-results/`
- Report HTML: `playwright-report/`

### Log Dettagliati

```bash
# Con debug
DEBUG=pw:api npm run test:e2e
```

## 📈 Prossimi Passi

1. ✅ Test con backend reale in CI/CD
2. ✅ Test di performance end-to-end
3. ✅ Test di sicurezza
4. ✅ Test di regressione automatici
5. ⏳ Visual regression tests
6. ⏳ Load testing
7. ⏳ Security scanning automatizzato
8. ⏳ Performance monitoring continuo

## 📚 Documentazione Correlata

- `TESTING_INTEGRATION.md` - Test di integrazione
- `TESTING_ALIGNMENT_SUMMARY.md` - Allineamento frontend-backend
- `README_TESTING.md` - Guida generale testing
- `e2e/README.md` - Guida test E2E

