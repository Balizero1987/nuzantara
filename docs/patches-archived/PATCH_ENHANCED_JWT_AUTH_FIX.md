# PATCH: Fix Enhanced JWT Auth - TypeScript Build Errors

**Data:** 2025-11-02  
**File Modificato:** `apps/backend-ts/src/middleware/enhanced-jwt-auth.ts`  
**Problema:** Errori TypeScript che impediscono il build e il deploy  
**Status:** ✅ Corretto - Build passato con successo

---

## 📋 Sommario

Questo patch risolve 5 errori TypeScript nel file `enhanced-jwt-auth.ts` che impedivano il build:

1. ❌ Import logger errato
2. ❌ Import redis-client errato  
3. ❌ Import AuditTrail errato (classe invece di funzione)
4. ❌ Metodo auditTrail.logEvent() non esiste
5. ❌ Types mancanti per Request (user, token)

---

## 🔧 Modifiche Dettagliate

### 1. Fix Import Logger

**PRIMA:**
```typescript
import { logger } from '../utils/logger.js';
```

**DOPO:**
```typescript
import logger from '../services/logger.js';
```

**Motivo:** Il logger è esportato come default da `services/logger.ts`, non da `utils/logger.js`.

---

### 2. Fix Redis Client (Creazione Lazy)

**PRIMA:**
```typescript
import { redisClient } from '../services/redis-client.js';
```

**DOPO:**
```typescript
import { createClient } from 'redis';

// Redis client instance (lazy initialization)
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
  }
  return redisClient;
}
```

**Motivo:** Non esiste un file `redis-client.js` con export diretto. Creiamo il client Redis direttamente con lazy initialization.

---

### 3. Fix Import AuditTrail

**PRIMA:**
```typescript
import { AuditTrail } from '../services/audit/audit-trail.js';

// Nel constructor:
this.auditTrail = new AuditTrail();
```

**DOPO:**
```typescript
import { getAuditTrail } from '../services/audit/audit-trail.js';

// Nel constructor e type:
private auditTrail: ReturnType<typeof getAuditTrail>;

// Nel constructor:
this.auditTrail = getAuditTrail();
```

**Motivo:** Il file exporta una funzione `getAuditTrail()` che restituisce una singola istanza (singleton), non una classe `AuditTrail`.

---

### 4. Fix Metodo AuditTrail (logEvent → log)

**PRIMA:**
```typescript
await this.auditTrail.logEvent({
  type: 'AUTH_FAILED',
  resource: 'jwt_auth',
  action: 'unauthorized_access_attempt',
  userId: 'anonymous',
  metadata: { ... }
});
```

**DOPO:**
```typescript
await this.auditTrail.log({
  userId: 'anonymous',
  userEmail: undefined,
  ipAddress: req.ip,
  userAgent: req.get('User-Agent'),
  action: 'unauthorized_access_attempt',
  resource: 'jwt_auth',
  status: 'failure',
  metadata: { ... }
});
```

**Motivo:** Il metodo corretto è `log()`, non `logEvent()`, e accetta un oggetto con struttura diversa:
- `type` → rimosso (derivato da `status`)
- Aggiunto: `userEmail`, `ipAddress`, `userAgent`, `status`
- `userId` e `action` rimangono

**Tutte le occorrenze da cambiare:**
- Linea ~127: unauthorized_access_attempt
- Linea ~154: blacklisted_token_used  
- Linea ~202: permission_denied
- Linea ~236: authenticated_access
- Linea ~257: authentication_error
- Linea ~465: token_blacklisted

---

### 5. Fix Request Types (user, token)

**PRIMA:**
```typescript
authenticate(...) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // ...
    req.user = enhancedUser;  // ❌ Property 'user' does not exist
    req.token = token;        // ❌ Property 'token' does not exist
  };
}
```

**DOPO:**
```typescript
export interface RequestWithEnhancedUser extends Request {
  user?: EnhancedUser;
  token?: string;
}

authenticate(...) {
  return async (req: RequestWithEnhancedUser, res: Response, next: NextFunction) => {
    // ...
    req.user = enhancedUser;  // ✅ OK
    req.token = token;        // ✅ OK
  };
}
```

**Motivo:** TypeScript non conosce le proprietà custom `user` e `token` su `Request`. Dobbiamo estendere il tipo.

---

### 6. Fix Redis Methods (setex → setEx)

**PRIMA:**
```typescript
await redisClient.setex(cacheKey, 300, JSON.stringify(userStatus));
await redisClient.setex(`blacklist:${jti}`, 86400, '1');
```

**DOPO:**
```typescript
const client = await getRedisClient();
await client.setEx(cacheKey, 300, JSON.stringify(userStatus));
await client.setEx(`blacklist:${jti}`, 86400, '1');
```

**Motivo:** 
- Il client Redis moderno usa `setEx()` (camelCase) invece di `setex()` (lowercase)
- Usare sempre `getRedisClient()` per ottenere il client

---

## 📝 Diff Completo del File

### Sezione Import (Linee 19-36)

```diff
- import jwt from 'jsonwebtoken';
- import { Request, Response, NextFunction } from 'express';
- import { logger } from '../utils/logger.js';
- import { redisClient } from '../services/redis-client.js';
- import { AuditTrail } from '../services/audit/audit-trail.js';
+ import jwt from 'jsonwebtoken';
+ import { Request, Response, NextFunction } from 'express';
+ import logger from '../services/logger.js';
+ import { getAuditTrail } from '../services/audit/audit-trail.js';
+ import { createClient } from 'redis';
+ 
+ // Redis client instance (lazy initialization)
+ let redisClient: ReturnType<typeof createClient> | null = null;
+ 
+ async function getRedisClient() {
+   if (!redisClient) {
+     redisClient = createClient({
+       url: process.env.REDIS_URL || 'redis://localhost:6379'
+     });
+     await redisClient.connect();
+   }
+   return redisClient;
+ }
```

### Sezione Class (Linee 98-116)

```diff
+ export interface RequestWithEnhancedUser extends Request {
+   user?: EnhancedUser;
+   token?: string;
+ }
+ 
  export class EnhancedJWTAuth {
    private jwtSecret: string;
-   private auditTrail: AuditTrail;
+   private auditTrail: ReturnType<typeof getAuditTrail>;
    private blacklistedTokens = new Set<string>();
    private permissionCache = new Map<string, { permissions: string[]; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
 
    constructor() {
      this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
-     this.auditTrail = new AuditTrail();
+     this.auditTrail = getAuditTrail();
```

### Sezione authenticate() Signature (Linea 121)

```diff
  authenticate(requiredPermissions: PermissionLevel[] = [PermissionLevel.READ]) {
-   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
+   return async (req: RequestWithEnhancedUser, res: Response, next: NextFunction): Promise<void> => {
```

### Tutte le chiamate auditTrail.logEvent() → auditTrail.log()

Vedi sezione 4 per i dettagli completi. Tutte le 6 occorrenze devono essere cambiate.

### Tutti gli usi di redisClient → getRedisClient()

Vedi sezione 6. Tre occorrenze:
- `isTokenBlacklisted()` (linea ~288)
- `checkUserStatus()` (linea ~316)  
- `blacklistToken()` (linea ~442)

---

## ✅ Verifica Post-Patch

Dopo aver applicato tutte le modifiche, verificare:

```bash
cd apps/backend-ts
npm run build
```

**Output atteso:**
```
> nuzantara-ts-backend@5.2.0 build
> tsc

(nessun output = successo)
```

---

## 🚀 Deploy

Una volta verificato che il build passa:

```bash
cd apps/backend-ts
fly deploy -a nuzantara-backend
```

**Nota:** Se il deploy fallisce con errore Fly CLI interno ("pool size must be > 0"), è un bug temporaneo del CLI. Riprovare più tardi o usare GitHub Actions.

---

## 📋 Checklist Applicazione Patch

- [ ] Modificare imports (logger, audit-trail, redis)
- [ ] Aggiungere funzione getRedisClient()
- [ ] Aggiungere interface RequestWithEnhancedUser
- [ ] Cambiare tipo auditTrail nella classe
- [ ] Cambiare constructor (getAuditTrail() invece di new)
- [ ] Cambiare signature authenticate() (RequestWithEnhancedUser)
- [ ] Cambiare tutte le 6 chiamate logEvent() → log()
- [ ] Cambiare tutte le 3 chiamate redisClient → getRedisClient()
- [ ] Cambiare setex() → setEx() (2 occorrenze)
- [ ] Verificare build: `npm run build`
- [ ] Deploy: `fly deploy`

---

## 🔍 File da Modificare

**Solo 1 file:**
- `apps/backend-ts/src/middleware/enhanced-jwt-auth.ts`

**Linee modificate approssimativamente:**
- 19-36: Imports
- 98-116: Interface e Class definition
- 121: Function signature
- 127, 154, 202, 236, 257: Chiamate auditTrail
- 288, 316, 442: Chiamate Redis

---

## 📞 Supporto

Se durante l'applicazione della patch si verificano problemi:

1. Verificare che il file `audit-trail.ts` esista e exporti `getAuditTrail`
2. Verificare che il file `services/logger.ts` esista e exporti default logger
3. Verificare che il package `redis` sia installato: `npm list redis`
4. Eseguire `npm run typecheck` per vedere errori dettagliati

---

**Status:** ✅ Patch pronta per applicazione  
**Build Status:** ✅ Passato  
**Deploy Status:** ⏳ In attesa (problema CLI Fly.io temporaneo)



