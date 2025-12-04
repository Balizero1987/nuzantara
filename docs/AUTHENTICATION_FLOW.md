# Authentication Flow

Documentazione completa del sistema di autenticazione NUZANTARA.

## Overview

NUZANTARA usa un sistema di autenticazione ibrido:
- **JWT (JSON Web Token)** - Per utenti webapp
- **API Key** - Per comunicazione server-to-server

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────>│  Next.js    │────>│  FastAPI    │
│   (User)    │     │  (Proxy)    │     │  (Backend)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │  1. Login Form    │                   │
      │─────────────────->│                   │
      │                   │  2. POST /login   │
      │                   │─────────────────->│
      │                   │                   │
      │                   │  3. JWT Token     │
      │                   │<─────────────────>│
      │  4. Store Token   │                   │
      │<─────────────────>│                   │
      │                   │                   │
      │  5. API Request   │  6. Forward +     │
      │  + Bearer Token   │     X-API-Key     │
      │─────────────────->│─────────────────->│
```

---

## Login Flow

### 1. Frontend Login Request

**File:** `apps/webapp-next/src/lib/api/auth.ts`

```typescript
// User submits email + PIN
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, pin }),
});

// Response: { token, user, message }
```

### 2. Next.js Proxy Route

**File:** `apps/webapp-next/src/app/api/auth/login/route.ts`

```typescript
export async function POST(request: Request) {
  const { email, pin } = await request.json();

  // Usa client OpenAPI generato
  const client = createPublicClient();
  const data = await client.identity.teamLoginApiAuthTeamLoginPost({
    requestBody: { email, pin },
  });

  // Trasforma risposta per frontend
  return NextResponse.json({
    token: data.token,
    user: data.user,
    message: 'Login successful',
  });
}
```

### 3. Backend Authentication

**File:** `apps/backend-rag/backend/app/modules/identity/router.py`

```python
@router.post("/login", response_model=LoginResponse)
async def team_login(request: LoginRequest) -> LoginResponse:
    # 1. Valida formato PIN (4-8 cifre)
    if not request.pin.isdigit() or len(request.pin) < 4:
        raise HTTPException(400, "Invalid PIN format")

    # 2. Autentica utente via IdentityService
    user = await identity_service.authenticate_user(
        email=request.email,
        pin=request.pin
    )

    # 3. Genera JWT token (7 giorni validita)
    token = identity_service.create_access_token(user, session_id)

    # 4. Ritorna risposta
    return LoginResponse(
        success=True,
        sessionId=session_id,
        token=token,
        user={...},
        permissions=[...],
    )
```

### 4. Token Storage (Frontend)

**File:** `apps/webapp-next/src/context/AuthContext.tsx`

```typescript
const login = async (credentials) => {
  const response = await authAPI.login(credentials);

  // Store in localStorage
  localStorage.setItem('zantara_auth_token', response.token);
  localStorage.setItem('zantara_user_data', JSON.stringify(response.user));

  // Update API client
  apiClient.setToken(response.token);
};
```

---

## JWT Token Structure

### Payload

```json
{
  "sub": "user-uuid-12345",
  "email": "user@example.com",
  "role": "member",
  "exp": 1735123456,
  "iat": 1734518656
}
```

### Configuration

**File:** `apps/backend-rag/backend/app/core/config.py`

```python
jwt_secret_key: str       # REQUIRED, min 32 chars
jwt_algorithm: str = "HS256"
jwt_access_token_expire_hours: int = 24  # Default 24h
```

### Validation

**File:** `apps/backend-rag/backend/app/routers/auth.py`

```python
def get_current_user(credentials: HTTPAuthorizationCredentials):
    payload = jwt.decode(
        credentials.credentials,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM]
    )

    user_id = payload.get("sub")
    email = payload.get("email")

    # Verifica utente esiste in DB
    user = await db.fetch_user(user_id, email)
    return user
```

---

## API Key Authentication

Per comunicazione server-to-server (es. servizi interni, webhook).

### Configuration

```bash
# .env
API_KEYS=key1,key2,key3  # Comma-separated list
```

### Usage

```bash
# Header
X-API-Key: your-api-key-here

# Esempio curl
curl http://localhost:8000/api/endpoint \
  -H "X-API-Key: your-api-key-here"
```

### Validation

**File:** `apps/backend-rag/backend/app/main_cloud.py`

```python
async def _validate_api_key(api_key: str) -> dict | None:
    configured_keys = settings.api_keys.split(",")

    if api_key in configured_keys:
        return {
            "id": "api_key_user",
            "email": "api-service@nuzantara.io",
            "role": "service",
            "auth_method": "api_key",
        }
    return None
```

---

## Hybrid Authentication Middleware

Il middleware `HybridAuthMiddleware` supporta entrambi i metodi.

**File:** `apps/backend-rag/backend/middleware/hybrid_auth.py`

### Priority Order

1. `Authorization: Bearer <JWT_TOKEN>` - JWT token
2. `auth_token` query parameter - JWT token (legacy)
3. `X-API-Key` header - API key

### Flow

```python
async def _validate_auth_mixed(authorization, auth_token, x_api_key):
    # 1. Try JWT first
    if authorization or auth_token:
        user = await _validate_auth_token(token)
        if user:
            return user

    # 2. Fallback to API key
    if x_api_key:
        user = await _validate_api_key(x_api_key)
        if user:
            return user

    return None
```

---

## Protected Endpoints

### Requiring Authentication

```python
from fastapi import Depends
from app.routers.auth import get_current_user

@router.get("/protected")
async def protected_endpoint(
    current_user: dict = Depends(get_current_user)
):
    return {"user": current_user}
```

### Public Endpoints (No Auth Required)

```python
@router.get("/public")
async def public_endpoint():
    return {"status": "ok"}
```

### Excluded Paths

Paths che NON richiedono autenticazione:
- `/health` - Health check
- `/docs` - Swagger UI
- `/openapi.json` - OpenAPI spec
- `/api/auth/login` - Login endpoint
- `/api/auth/team/login` - Team login
- `/api/csrf-token` - CSRF token

---

## Frontend Token Management

### Storage Keys

```typescript
// constants.ts
export const AUTH_TOKEN_KEY = 'zantara_auth_token';
export const USER_DATA_KEY = 'zantara_user_data';
```

### API Client Integration

**File:** `apps/webapp-next/src/lib/api/client.ts`

```typescript
// Token provider per client generato
export const tokenProvider = async () => {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
};

// Client con auto-inject token
export const client = new NuzantaraClient({
  BASE: API_BASE_URL,
  TOKEN: tokenProvider,
});
```

### Request Flow

```typescript
// Chat API con token
const response = await fetch('/api/chat/stream', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

---

## Logout Flow

### Frontend

```typescript
const logout = () => {
  // Clear storage
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);

  // Clear API client
  apiClient.clearToken();

  // Redirect
  router.push('/');
};
```

### Backend (Optional)

```python
@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    # Server-side token invalidation (if implemented)
    # Per ora JWT e stateless, quindi logout e solo client-side
    return {"success": True}
```

---

## Security Best Practices

### JWT Secret

```bash
# Genera secret sicuro
openssl rand -hex 32

# .env
JWT_SECRET_KEY=a1b2c3d4e5f6...  # Min 32 caratteri
```

### Token Expiration

```python
# Default: 24 ore
JWT_ACCESS_TOKEN_EXPIRE_HOURS=24

# Per sessioni piu lunghe (es. mobile)
JWT_ACCESS_TOKEN_EXPIRE_HOURS=168  # 7 giorni
```

### HTTPS Only

In produzione, tutti i token devono transitare solo su HTTPS.

```python
# Fly.io gestisce SSL automaticamente
# Per sviluppo locale, usa http://localhost
```

### CORS Configuration

```python
# Origini permesse
ZANTARA_ALLOWED_ORIGINS=https://your-frontend.com

# Default origins
default_origins = [
    "https://zantara.balizero.com",
    "https://nuzantara-webapp.fly.dev",
    "http://localhost:3000",  # Dev only
]
```

---

## Troubleshooting

### "401 Unauthorized"

1. Verifica token presente:
```javascript
console.log(localStorage.getItem('zantara_auth_token'));
```

2. Verifica token non scaduto:
```javascript
const token = localStorage.getItem('zantara_auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
```

3. Verifica JWT_SECRET_KEY uguale tra frontend e backend

### "422 Validation Error" su Login

1. Verifica formato PIN (4-8 cifre, solo numeri)
2. Verifica email valida
3. Controlla body JSON corretto

### Token Non Inviato

```typescript
// Verifica che il token sia nel header
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,  // <-- Verifica questo
  },
});
```

---

## Database Schema

### team_members Table

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  role VARCHAR(50) DEFAULT 'member',
  department VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  active BOOLEAN DEFAULT true,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### user_sessions Table (Optional)

```sql
CREATE TABLE user_sessions (
  id VARCHAR(255) PRIMARY KEY,  -- session_123456_uuid
  user_id UUID REFERENCES team_members(id),
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/team/login` | POST | No | Team login (email + PIN) |
| `/api/auth/login` | POST | No | Alternative login |
| `/api/auth/profile` | GET | JWT | Get current user profile |
| `/api/auth/logout` | POST | JWT | Logout (optional) |
| `/api/auth/check` | GET | JWT | Verify token validity |
| `/api/csrf-token` | GET | No | Get CSRF token |
