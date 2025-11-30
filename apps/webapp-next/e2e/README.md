# E2E Tests with Playwright

Test end-to-end per il frontend Next.js usando Playwright.

## Setup

```bash
# Install Playwright browsers (solo la prima volta)
npx playwright install

# Oppure install solo chromium
npx playwright install chromium
```

## Eseguire i test

```bash
# Esegui tutti i test E2E
npm run test:e2e

# Esegui con UI interattiva
npm run test:e2e:ui

# Esegui in modalità headed (vedi il browser)
npm run test:e2e:headed

# Esegui un test specifico
npx playwright test e2e/auth.spec.ts

# Esegui in debug mode
npx playwright test --debug
```

## Test disponibili

### `auth.spec.ts`
- Display login page
- Error handling su login invalido
- Navigazione dopo login

### `chat.spec.ts`
- Display chat interface
- Input chat funzionante
- Sidebar con chat history

### `navigation.spec.ts`
- Navigazione tra pagine
- Layout responsive

## Configurazione

I test sono configurati in `playwright.config.ts`:
- Base URL: `http://localhost:3000` (o `NEXT_PUBLIC_APP_URL`)
- Browser: Chromium, Firefox, WebKit
- Retry: 2 tentativi su CI
- Screenshot: solo su failure
- Trace: solo su retry

## CI/CD

I test E2E possono essere eseguiti in CI aggiungendo al workflow:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

## Best Practices

1. **Test isolati**: Ogni test deve essere indipendente
2. **Wait for elements**: Usa `waitFor` invece di `sleep`
3. **Selectors**: Preferisci `data-testid` quando possibile
4. **Cleanup**: I test vengono eseguiti in ambiente pulito

## Troubleshooting

### Test falliscono con timeout
- Verifica che il server dev sia in esecuzione (`npm run dev`)
- Controlla che `baseURL` sia corretto

### Browser non si installa
```bash
npx playwright install --force
```

### Screenshot e video
I screenshot vengono salvati in `test-results/` solo su failure.
I video vengono salvati solo se configurati in `playwright.config.ts`.

