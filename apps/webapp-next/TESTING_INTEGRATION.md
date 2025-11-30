# Test di Integrazione Frontend-Backend

## Panoramica

Questi test verificano il perfetto allineamento tra frontend e backend, garantendo che Zantara funzioni correttamente nella webapp.

## Tipi di Test

### 1. Test di Integrazione API Proxy (`src/app/api/__tests__/integration.test.ts`)

Verificano che le route proxy Next.js chiamino correttamente il backend:

- ✅ **Auth Login Proxy**: Verifica che `/api/auth/login` chiami `identity.teamLoginApiAuthTeamLoginPost`
- ✅ **Chat Proxy**: Verifica che `/api/chat` chiami `oracleV53UltraHybrid.hybridOracleQueryApiOracleQueryPost`
- ✅ **Chat Stream Proxy**: Verifica che `/api/chat/stream` proxy correttamente al backend streaming endpoint
- ✅ **Error Handling**: Verifica che gli errori del backend siano gestiti correttamente
- ✅ **Data Format**: Verifica che i formati di richiesta/risposta corrispondano

### 2. Test di Contratto API (`src/lib/api/__tests__/api-contract.test.ts`)

Verificano che i tipi TypeScript corrispondano ai contratti del backend:

- ✅ **LoginRequest/LoginResponse**: Struttura dati autenticazione
- ✅ **ChatMessage/ChatMetadata**: Struttura dati chat
- ✅ **User**: Struttura dati utente
- ✅ **Generated Client**: Tutti i servizi sono presenti

### 3. Test di Compatibilità Backend (`src/lib/api/__tests__/backend-compatibility.test.ts`)

Verificano la compatibilità con il backend:

- ✅ **Endpoint URLs**: Gli URL degli endpoint sono corretti
- ✅ **Request Formats**: I formati di richiesta corrispondono agli schemi del backend
- ✅ **Response Handling**: La gestione delle risposte corrisponde alle risposte del backend
- ✅ **Error Formats**: Gli errori sono formattati correttamente

### 4. Test E2E Flussi Completi (`e2e/full-flow.spec.ts`)

Test end-to-end che verificano flussi completi:

- ✅ **Authentication Flow**: Login completo con backend
- ✅ **Chat Interaction**: Interazione chat con streaming dal backend
- ✅ **State Persistence**: Persistenza dello stato tra ricaricamenti
- ✅ **RAG Sources Display**: Visualizzazione delle sorgenti RAG dal backend
- ✅ **Error Handling**: Gestione errori del backend nell'UI

## Endpoint Testati

### Autenticazione
- **Frontend**: `POST /api/auth/login`
- **Backend**: `POST /api/auth/team/login` (via `identity.teamLoginApiAuthTeamLoginPost`)
- **Payload**: `{ email: string, pin: string }`
- **Response**: `{ token: string, user: User }`

### Chat
- **Frontend**: `POST /api/chat`
- **Backend**: `POST /api/oracle/query` (via `oracleV53UltraHybrid.hybridOracleQueryApiOracleQueryPost`)
- **Payload**: `{ messages: ChatMessage[], user_id: string }`
- **Response**: `{ message: string, sources: RAGSource[], model_used: string }`

### Chat Streaming
- **Frontend**: `POST /api/chat/stream`
- **Backend**: `GET /bali-zero/chat-stream?query=...&stream=true`
- **Headers**: `X-API-Key`, `Authorization: Bearer <token>`
- **Response**: Streaming SSE

## Esecuzione

```bash
# Test di integrazione API proxy
npm test -- src/app/api/__tests__/integration.test.ts

# Test di contratto API
npm test -- src/lib/api/__tests__/api-contract.test.ts

# Test di compatibilità backend
npm test -- src/lib/api/__tests__/backend-compatibility.test.ts

# Test E2E flussi completi
npm run test:e2e -- e2e/full-flow.spec.ts

# Tutti i test di integrazione
npm test -- --testPathPattern="integration|api-contract|backend-compatibility"
```

## Verifica Allineamento

### Checklist

- [ ] Tutti gli endpoint proxy chiamano il backend corretto
- [ ] I formati di richiesta corrispondono agli schemi del backend
- [ ] I formati di risposta sono gestiti correttamente
- [ ] Gli errori del backend sono mappati correttamente
- [ ] L'autenticazione funziona end-to-end
- [ ] Lo streaming chat funziona correttamente
- [ ] Le sorgenti RAG sono visualizzate correttamente
- [ ] Lo stato persiste tra ricaricamenti

### Verifica Manuale

1. **Avvia backend**: `cd apps/backend-rag && python -m uvicorn backend.app.main:app --reload`
2. **Avvia frontend**: `cd apps/webapp-next && npm run dev`
3. **Esegui test E2E**: `npm run test:e2e:headed`
4. **Verifica flussi**:
   - Login con credenziali reali
   - Chat con query reali
   - Verifica streaming
   - Verifica RAG sources

## Troubleshooting

### Test falliscono con "Cannot find module"
- Verifica che i path alias siano corretti in `jest.config.js`
- Usa path relativi invece di alias `@/` nei test

### Mock non funzionano
- Verifica che i mock siano configurati prima delle importazioni
- Usa `jest.resetModules()` quando necessario

### Backend non raggiungibile
- Verifica che il backend sia in esecuzione
- Controlla `NUZANTARA_API_URL` e `NUZANTARA_API_KEY` nelle env vars

## Prossimi Passi

1. ✅ Test di integrazione API proxy
2. ✅ Test di contratto API
3. ✅ Test di compatibilità backend
4. ✅ Test E2E flussi completi
5. ⏳ Test con backend reale (non mockato)
6. ⏳ Test di performance
7. ⏳ Test di sicurezza

