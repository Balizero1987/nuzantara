# Frontend Testing Guide

## Setup

I test sono configurati con Jest e React Testing Library per il frontend Next.js.

### Installazione dipendenze

```bash
cd apps/webapp-next
npm install
```

## Eseguire i test

```bash
# Esegui tutti i test
npm test

# Watch mode (sviluppo)
npm run test:watch

# Con coverage report
npm run test:coverage

# Per CI/CD
npm run test:ci
```

## Struttura dei test

I test sono organizzati seguendo la struttura del codice sorgente:

```
src/
├── lib/
│   ├── store/
│   │   └── __tests__/
│   │       ├── auth-store.test.ts
│   │       └── chat-store.test.ts
│   ├── api/
│   │   └── __tests__/
│   │       ├── auth.test.ts
│   │       ├── chat.test.ts
│   │       └── client.test.ts
│   └── __tests__/
│       └── utils.test.ts
└── hooks/
    └── __tests__/
        └── use-mobile.test.ts
```

## Coverage Target

**Target: 90% coverage** (allineato con backend)

- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

### Coverage per modulo

- **Store**: 95%+ (critico per state management)
- **API**: 90%+ (critico per comunicazione backend)
- **Utils**: 100% (funzioni pure)
- **Hooks**: 90%+ (logica riutilizzabile)

## Best Practices

1. **Test isolati**: Ogni test deve essere indipendente
2. **Mock esterni**: Mockare fetch, localStorage, window APIs
3. **Cleanup**: Pulire stato tra i test
4. **Naming**: Usare nomi descrittivi (`should do X when Y`)
5. **Coverage**: Testare edge cases e error handling

## Mock disponibili

- `fetch` - Mock globale per API calls
- `localStorage` - Mock per storage
- `window.matchMedia` - Mock per responsive hooks
- `next/navigation` - Mock per Next.js router
- `next/image` - Mock per Next.js Image component

## Troubleshooting

### Test falliscono con errori di import

Verifica che `jest.config.js` sia configurato correttamente e che `moduleNameMapper` includa gli alias TypeScript.

### Coverage non raggiunge il target

Esegui `npm run test:coverage` e controlla il report HTML in `coverage/index.html` per vedere quali file necessitano più test.

### Errori con zustand persist

I test per gli store con persist middleware potrebbero richiedere mock aggiuntivi. Vedi `auth-store.test.ts` per esempi.

