# 🔧 PATCH: Enhanced JWT Auth - Applica Queste Modifiche

**File:** `apps/backend-ts/src/middleware/enhanced-jwt-auth.ts`  
**Tempo stimato:** 10 minuti  
**Difficoltà:** Facile

---

## 📌 MODIFICHE DA FARE (in ordine)

### 1️⃣ CAMBIA GLI IMPORT (linea 19-23)

**Sostituisci:**
```typescript
import { logger } from '../utils/logger.js';
import { redisClient } from '../services/redis-client.js';
import { AuditTrail } from '../services/audit/audit-trail.js';
```

**Con:**
```typescript
import logger from '../services/logger.js';
import { getAuditTrail } from '../services/audit/audit-trail.js';
import { createClient } from 'redis';
```

**Poi aggiungi DOPO gli import (dopo linea 23):**
```typescript
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

---

### 2️⃣ AGGIUNGI INTERFACE (prima della classe EnhancedJWTAuth)

**Aggiungi PRIMA di `export class EnhancedJWTAuth {` (circa linea 98):**
```typescript
export interface RequestWithEnhancedUser extends Request {
  user?: EnhancedUser;
  token?: string;
}
```

---

### 3️⃣ CAMBIA CLASSE (linea ~103-112)

**Trova:**
```typescript
export class EnhancedJWTAuth {
  private jwtSecret: string;
  private auditTrail: AuditTrail;
  ...
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.auditTrail = new AuditTrail();
```

**Cambia in:**
```typescript
export class EnhancedJWTAuth {
  private jwtSecret: string;
  private auditTrail: ReturnType<typeof getAuditTrail>;
  ...
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.auditTrail = getAuditTrail();
```

---

### 4️⃣ CAMBIA SIGNATURE FUNZIONE (linea ~121)

**Trova:**
```typescript
  authenticate(requiredPermissions: PermissionLevel[] = [PermissionLevel.READ]) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
```

**Cambia in:**
```typescript
  authenticate(requiredPermissions: PermissionLevel[] = [PermissionLevel.READ]) {
    return async (req: RequestWithEnhancedUser, res: Response, next: NextFunction): Promise<void> => {
```

---

### 5️⃣ CAMBIA TUTTE LE CHIAMATE auditTrail.logEvent() → log()

**Cerca nel file tutte le occorrenze di:**
```typescript
await this.auditTrail.logEvent({
```

**E sostituisci con il formato corretto:**

**FORMATO VECCHIO:**
```typescript
await this.auditTrail.logEvent({
  type: 'AUTH_FAILED',
  resource: 'jwt_auth',
  action: 'unauthorized_access_attempt',
  userId: 'anonymous',
  metadata: { ... }
});
```

**FORMATO NUOVO:**
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

**Ci sono 6 occorrenze da cambiare:**
1. Linea ~127: `unauthorized_access_attempt` → status: 'failure'
2. Linea ~154: `blacklisted_token_used` → status: 'failure'
3. Linea ~202: `permission_denied` → status: 'failure'
4. Linea ~236: `authenticated_access` → status: 'success'
5. Linea ~257: `authentication_error` → status: 'failure'
6. Linea ~465: `token_blacklisted` → status: 'success'

**Importante:** 
- Rimuovi `type: '...'`
- Aggiungi `status: 'success' | 'failure'`
- Aggiungi `ipAddress: req.ip`
- Aggiungi `userAgent: req.get('User-Agent')`
- Aggiungi `userEmail` quando disponibile

---

### 6️⃣ CAMBIA USO DI redisClient → getRedisClient()

**Ci sono 3 posti dove usare `redisClient`:**

**A) In `isTokenBlacklisted()` (circa linea 288):**

**PRIMA:**
```typescript
const isBlacklisted = await redisClient.get(`blacklist:${jti}`);
```

**DOPO:**
```typescript
const client = await getRedisClient();
const isBlacklisted = await client.get(`blacklist:${jti}`);
```

**B) In `checkUserStatus()` (circa linea 316):**

**PRIMA:**
```typescript
const cacheKey = `user_status:${userId}`;
const cached = await redisClient.get(cacheKey);
...
await redisClient.setex(cacheKey, 300, JSON.stringify(userStatus));
```

**DOPO:**
```typescript
const client = await getRedisClient();
const cacheKey = `user_status:${userId}`;
const cached = await client.get(cacheKey);
...
await client.setEx(cacheKey, 300, JSON.stringify(userStatus));  // Nota: setEx (non setex)
```

**C) In `blacklistToken()` (circa linea 442):**

**PRIMA:**
```typescript
await redisClient.setex(`blacklist:${jti}`, 86400, '1');
```

**DOPO:**
```typescript
const client = await getRedisClient();
await client.setEx(`blacklist:${jti}`, 86400, '1');  // Nota: setEx (non setex)
```

---

### 7️⃣ CAMBIA ERROR HANDLING (linea ~254)

**Trova:**
```typescript
} catch (error) {
  logger.error('Enhanced JWT authentication error:', error);
  ...
  error: error.message,
```

**Cambia in:**
```typescript
} catch (error: any) {
  logger.error('Enhanced JWT authentication error:', error);
  ...
  error: error?.message || 'Unknown error',
```

---

## ✅ VERIFICA

Dopo aver fatto tutte le modifiche:

```bash
cd apps/backend-ts
npm run build
```

**Dovrebbe compilare senza errori!** ✅

---

## 📋 CHECKLIST RAPIDA

- [ ] Cambiato import logger
- [ ] Cambiato import AuditTrail → getAuditTrail
- [ ] Aggiunto import redis + funzione getRedisClient()
- [ ] Aggiunta interface RequestWithEnhancedUser
- [ ] Cambiato tipo auditTrail nella classe
- [ ] Cambiato constructor (getAuditTrail invece di new AuditTrail)
- [ ] Cambiata signature authenticate (RequestWithEnhancedUser)
- [ ] Cambiate tutte le 6 chiamate logEvent() → log() con formato corretto
- [ ] Cambiati tutti i 3 usi redisClient → getRedisClient()
- [ ] Cambiato setex → setEx (2 volte)
- [ ] Aggiunto : any a catch error
- [ ] Build passa: `npm run build` ✅

---

## 🚀 DEPLOY

```bash
cd apps/backend-ts
fly deploy -a nuzantara-backend
```

---

**Tempo totale:** ~10-15 minuti  
**File modificati:** 1 (`enhanced-jwt-auth.ts`)  
**Righe modificate:** ~20-30



