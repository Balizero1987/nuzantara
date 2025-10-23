# Backend TypeScript

Backend TypeScript per NUZANTARA - Gestisce routing, handlers, middleware e servizi.

## Struttura

```
apps/backend-ts/
├── src/
│   ├── index.ts              # Entry point
│   ├── app-gateway/          # Gateway e routing
│   ├── handlers/             # Handler per varie funzionalità
│   ├── services/             # Servizi core
│   ├── middleware/           # Middleware Express
│   ├── routes/               # Definizioni route
│   ├── utils/                # Utility
│   ├── config/               # Configurazioni
│   └── types/                # TypeScript types
└── README.md
```

## Comandi

Dalla root del progetto:

```bash
# Development
npm run dev                    # Watch mode con tsx
npm run start:dev             # Nodemon watch mode

# Build
npm run build                 # Build con TypeScript
npm run typecheck            # Type checking

# Test
npm test                      # Run test suite
npm run test:watch           # Test in watch mode
```

## Configurazione

- **Port**: 8080 (default)
- **TypeScript**: ESNext + strict mode
- **Path aliases**: `@/*`, `@handlers/*`, `@services/*`, `@middleware/*`, `@utils/*`

## Deploy

Railway rileva automaticamente questo workspace e usa le configurazioni in `tsconfig.json` e `package.json`.

## Note

Questo backend è parte di un monorepo. Per info sul backend RAG Python, vedi `apps/backend-rag/`.
# Trigger redeploy
# Force TS-BACKEND rebuild
# Force complete rebuild
