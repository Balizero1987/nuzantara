# 🚨 FIX FINALE PER CUSTOM GPT - Auth Header Issue

## ❌ PROBLEMA IDENTIFICATO
Il Custom GPT non sta inviando correttamente l'header `x-api-key` su alcuni endpoint, causando "Invalid API key" errors.

## ✅ SOLUZIONE DEFINITIVA

### OPZIONE 1: Rimuovi e Riconfigura Authentication
1. Nelle Actions del Custom GPT, vai su **Authentication**
2. **CANCELLA** completamente la configurazione esistente
3. Riconfigura da zero ESATTAMENTE così:

```
Authentication Type: API Key
Auth Type: Custom
Custom Header Name: x-api-key
API Key: zantara-internal-dev-key-2025
```

### OPZIONE 2: Schema OpenAPI con Security su OGNI Endpoint

Sostituisci TUTTO lo schema con questo che forza l'autenticazione su ogni singolo endpoint:

```yaml
openapi: 3.1.0
info:
  title: ZANTARA API
  version: 5.2.0
servers:
  - url: https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key

security:
  - ApiKeyAuth: []

paths:
  /health:
    get:
      operationId: healthCheck
      summary: Check health
      security: []
      responses:
        '200':
          description: OK

  /contact.info:
    get:
      operationId: getContactInfo
      summary: Get contact info
      security:
        - ApiKeyAuth: []
      responses:
        '200':
          description: OK

  /lead.save:
    post:
      operationId: saveLead
      summary: Save lead
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
                service:
                  type: string
                details:
                  type: string
                nationality:
                  type: string
                urgency:
                  type: string
      responses:
        '200':
          description: OK

  /identity.resolve:
    post:
      operationId: resolveIdentity
      summary: Resolve identity
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
      responses:
        '200':
          description: OK

  /ai.chat:
    post:
      operationId: aiChat
      summary: AI chat
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                prompt:
                  type: string
                model:
                  type: string
      responses:
        '200':
          description: OK

  /call:
    post:
      operationId: callHandler
      summary: Call handler
      security:
        - ApiKeyAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                key:
                  type: string
                params:
                  type: object
      responses:
        '200':
          description: OK

  /metrics:
    get:
      operationId: getMetrics
      summary: Get metrics
      security: []
      responses:
        '200':
          description: OK

  /docs:
    get:
      operationId: getDocs
      summary: Get documentation
      security: []
      responses:
        '200':
          description: OK
```

### PASSAGGI CRITICI:
1. **CANCELLA** completamente le Actions esistenti
2. **CREA NUOVE** Actions da zero
3. **IMPORTA** lo schema sopra
4. **CONFIGURA** Authentication come indicato
5. **SALVA** e testa immediatamente

### TEST IMMEDIATO:
Dopo aver configurato, nel Custom GPT scrivi:
- "Save a lead for John Doe"
- "Chat about visa requirements"
- "Get contact information"

### ⚠️ SE ANCORA NON FUNZIONA:
Prova a creare un **NUOVO Custom GPT** da zero con queste configurazioni. A volte le Actions si "corrompono" e vanno ricreate.

## 🎯 RISULTATO ATTESO
Tutti gli handler dovrebbero funzionare senza errori 500 o "Invalid API key".