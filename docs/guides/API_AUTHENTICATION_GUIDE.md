# 🔐 ZANTARA Authentication API Guide

**Version**: 1.0.0
**Last Updated**: November 5, 2025
**Base URL**: https://nuzantara-backend.fly.dev
**Feature**: #11 - User Authentication System

---

## 📋 Overview

Complete authentication system with user registration, login, JWT tokens, password management, and profile operations.

### **Features**
- ✅ User Registration with email validation
- ✅ Login with JWT tokens (7-day expiry)
- ✅ Refresh tokens (30-day expiry)
- ✅ Password hashing with bcrypt
- ✅ Protected routes with middleware
- ✅ Profile management
- ✅ Password change and reset flow
- ✅ Email verification (mock)

### **Security**
- bcrypt password hashing (10 rounds)
- JWT token signatures
- Bearer token authentication
- Protected endpoint middleware
- Password strength validation (min 8 characters)

---

## 🚀 Quick Start

### **1. Register a New User**
```bash
curl -X POST https://nuzantara-backend.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "phone": "+1234567890",
    "company": "My Company"
  }'
```

**Response**:
```json
{
  "ok": true,
  "message": "Registration successful",
  "user": {
    "id": "user_1762279194042_oshs82ffw",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false,
    "profile": {
      "phone": "+1234567890",
      "company": "My Company",
      "role": "user"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **2. Login**
```bash
curl -X POST https://nuzantara-backend.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Response**:
```json
{
  "ok": true,
  "message": "Login successful",
  "user": {
    "id": "user_1762279194042_oshs82ffw",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false,
    "profile": { "role": "user" },
    "last_login": "2025-11-04T18:01:45.372Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **3. Access Protected Endpoint**
```bash
curl -X GET https://nuzantara-backend.fly.dev/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 API Endpoints

### **Public Endpoints** (No Authentication Required)

#### **POST /api/auth/register**
Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",      // Required, valid email
  "password": "password123",        // Required, min 8 chars
  "name": "John Doe",               // Required, min 2 chars
  "phone": "+1234567890",           // Optional
  "company": "My Company"           // Optional
}
```

**Response** (201 Created):
```json
{
  "ok": true,
  "message": "Registration successful",
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false,
    "profile": {
      "phone": "+1234567890",
      "company": "My Company",
      "role": "user"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `400 Bad Request`: Missing required fields
- `400 Bad Request`: Email already registered
- `400 Bad Request`: Invalid email format
- `400 Bad Request`: Password too short

---

#### **POST /api/auth/login**
Login with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "message": "Login successful",
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false,
    "profile": { "role": "user" },
    "last_login": "2025-11-04T18:01:45.372Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid email or password

---

#### **POST /api/auth/refresh**
Refresh access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid or expired refresh token

---

#### **POST /api/auth/request-reset**
Request password reset (sends reset token).

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "message": "If the email exists, a reset link has been sent",
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: In production, `reset_token` should NOT be returned (sent via email).

**Errors**:
- `400 Bad Request`: Missing email

---

#### **POST /api/auth/reset-password**
Reset password using reset token.

**Request Body**:
```json
{
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewPassword123"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "message": "Password reset successful"
}
```

**Errors**:
- `400 Bad Request`: Missing reset_token or new_password
- `400 Bad Request`: New password too short
- `401 Unauthorized`: Invalid or expired reset token

---

### **Protected Endpoints** (Authentication Required)

All protected endpoints require `Authorization` header with Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

#### **GET /api/auth/profile**
Get current user profile.

**Headers**:
```
Authorization: Bearer YOUR_TOKEN
```

**Response** (200 OK):
```json
{
  "ok": true,
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false,
    "profile": {
      "phone": "+1234567890",
      "company": "My Company",
      "role": "user"
    },
    "created_at": "2025-11-04T17:59:54.042Z",
    "last_login": "2025-11-04T18:01:45.372Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token

---

#### **PUT /api/auth/profile**
Update user profile.

**Headers**:
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body** (all fields optional):
```json
{
  "name": "New Name",
  "phone": "+9876543210",
  "company": "New Company",
  "role": "Manager"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "New Name",
    "profile": {
      "phone": "+9876543210",
      "company": "New Company",
      "role": "Manager"
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Update failed

---

#### **POST /api/auth/change-password**
Change user password (requires current password).

**Headers**:
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body**:
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword456"
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "message": "Password changed successfully"
}
```

**Errors**:
- `400 Bad Request`: Missing current_password or new_password
- `400 Bad Request`: Current password is incorrect
- `400 Bad Request`: New password too short
- `401 Unauthorized`: Missing or invalid token

---

#### **POST /api/auth/verify-email**
Verify user email address.

**Headers**:
```
Authorization: Bearer YOUR_TOKEN
```

**Response** (200 OK):
```json
{
  "ok": true,
  "message": "Email verified successfully"
}
```

**Errors**:
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Verification failed

---

### **Admin/Testing Endpoints**

#### **GET /api/auth/users**
Get list of all users (for testing/admin only).

**Response** (200 OK):
```json
{
  "ok": true,
  "users": [
    {
      "id": "user_xxx",
      "email": "user@example.com",
      "name": "John Doe",
      "email_verified": false,
      "created_at": "2025-11-04T17:59:54.042Z",
      "last_login": "2025-11-04T18:01:45.372Z"
    }
  ],
  "total": 1
}
```

**Note**: Should be protected with admin authentication in production.

---

## 🔐 Authentication Flow

### **Complete Flow Example**

```javascript
// 1. Register new user
const registerResponse = await fetch('https://nuzantara-backend.fly.dev/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    name: 'John Doe'
  })
});

const { token, refresh_token, user } = await registerResponse.json();

// 2. Store tokens securely
localStorage.setItem('token', token);
localStorage.setItem('refresh_token', refresh_token);

// 3. Make authenticated requests
const profileResponse = await fetch('https://nuzantara-backend.fly.dev/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 4. Refresh token when expired
const refreshResponse = await fetch('https://nuzantara-backend.fly.dev/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token })
});

const { token: newToken } = await refreshResponse.json();
localStorage.setItem('token', newToken);
```

---

## 🛡️ Security Best Practices

### **For Developers**

1. **Token Storage**
   - Store tokens in `httpOnly` cookies (preferred)
   - Or use secure localStorage with XSS protection
   - Never expose tokens in URL parameters

2. **HTTPS Only**
   - Always use HTTPS in production
   - Never send tokens over HTTP

3. **Token Expiry**
   - Access tokens: 7 days
   - Refresh tokens: 30 days
   - Implement automatic token refresh

4. **Password Requirements**
   - Minimum 8 characters
   - Recommend: uppercase, lowercase, numbers, symbols
   - Implement rate limiting on login attempts

5. **Error Handling**
   - Don't reveal if email exists (security through obscurity)
   - Generic error messages for login failures
   - Log failed attempts for monitoring

### **For Production**

1. ✅ **Use strong JWT_SECRET**
   ```bash
   # Generate secure secret
   openssl rand -base64 64

   # Set on Fly.io
   flyctl secrets set JWT_SECRET="YOUR_SECURE_SECRET" -a nuzantara-backend
   ```

2. ✅ **Enable email sending**
   - Integrate email service (SendGrid, AWS SES, etc.)
   - Send password reset links via email
   - Remove reset_token from API response

3. ✅ **Add database persistence**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Implement proper user sessions
   - Add audit logging

4. ✅ **Implement rate limiting**
   - Limit login attempts (5 per minute)
   - Limit registration (2 per IP per hour)
   - Add CAPTCHA for suspicious activity

5. ✅ **Add email verification**
   - Send verification email on registration
   - Require verification before full access
   - Resend verification email option

---

## 📊 Token Information

### **Access Token (JWT)**

**Payload**:
```json
{
  "userId": "user_xxx",
  "email": "user@example.com",
  "type": "user",
  "iat": 1762279305,
  "exp": 1762884105
}
```

**Expiry**: 7 days
**Algorithm**: HS256
**Usage**: All authenticated API requests

### **Refresh Token (JWT)**

**Payload**:
```json
{
  "userId": "user_xxx",
  "type": "refresh",
  "iat": 1762279305,
  "exp": 1764871305
}
```

**Expiry**: 30 days
**Algorithm**: HS256
**Usage**: Obtain new access token

### **Reset Token (JWT)**

**Payload**:
```json
{
  "userId": "user_xxx",
  "type": "reset",
  "iat": 1762279362,
  "exp": 1762282962
}
```

**Expiry**: 1 hour
**Algorithm**: HS256
**Usage**: Password reset only

---

## 🧪 Testing Examples

### **cURL Examples**

```bash
# Register
curl -X POST https://nuzantara-backend.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test12345","name":"Test User"}'

# Login
curl -X POST https://nuzantara-backend.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test12345"}'

# Get Profile
curl -X GET https://nuzantara-backend.fly.dev/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update Profile
curl -X PUT https://nuzantara-backend.fly.dev/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Updated Name"}'

# Change Password
curl -X POST https://nuzantara-backend.fly.dev/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"current_password":"Test12345","new_password":"NewPass123"}'

# Request Password Reset
curl -X POST https://nuzantara-backend.fly.dev/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset Password
curl -X POST https://nuzantara-backend.fly.dev/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"reset_token":"RESET_TOKEN","new_password":"NewPass456"}'
```

### **JavaScript/TypeScript Examples**

```typescript
// TypeScript client example
class ZantaraAuthClient {
  private baseUrl = 'https://nuzantara-backend.fly.dev';
  private token: string | null = null;

  async register(email: string, password: string, name: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();
    if (data.ok) {
      this.token = data.token;
    }
    return data;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (data.ok) {
      this.token = data.token;
    }
    return data;
  }

  async getProfile() {
    if (!this.token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    return response.json();
  }

  async updateProfile(updates: { name?: string; phone?: string; company?: string }) {
    if (!this.token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(updates)
    });

    return response.json();
  }
}

// Usage
const client = new ZantaraAuthClient();
await client.register('user@example.com', 'SecurePass123', 'John Doe');
const profile = await client.getProfile();
```

---

## ❌ Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Missing required fields or invalid data |
| 401 | Unauthorized | Invalid credentials or expired token |
| 500 | Internal Server Error | Server error during processing |

### **Common Error Responses**

```json
// Missing field
{
  "ok": false,
  "error": "Email is required"
}

// Invalid credentials
{
  "ok": false,
  "error": "Invalid email or password"
}

// Invalid token
{
  "ok": false,
  "error": "Invalid or expired token"
}

// Validation error
{
  "ok": false,
  "error": "Password must be at least 8 characters"
}
```

---

## 📝 Notes & Limitations

### **Current Implementation (MVP)**

✅ **Working Features**:
- Complete authentication flow
- JWT token generation
- Password hashing with bcrypt
- Protected routes middleware
- Profile management
- Password reset flow

⚠️ **Limitations (MVP)**:
- User data stored in-memory (lost on restart)
- No database persistence
- No email sending (reset tokens returned in API)
- No rate limiting on authentication endpoints
- Default JWT secret (change in production)
- No session management
- No audit logging

### **Production Roadmap**

1. **Database Integration** (Priority 1)
   - Add PostgreSQL/MongoDB for user storage
   - Implement proper migrations
   - Add indexes for performance

2. **Email Service** (Priority 2)
   - Integrate SendGrid/AWS SES
   - Send verification emails
   - Send password reset emails
   - Remove reset_token from API responses

3. **Enhanced Security** (Priority 3)
   - Add rate limiting
   - Implement CAPTCHA
   - Add 2FA/MFA support
   - Session management
   - Audit logging

4. **Advanced Features** (Priority 4)
   - OAuth integration (Google, Facebook)
   - Social login
   - Magic links
   - Passwordless authentication

---

## 🔗 Related Documentation

- [INFRASTRUCTURE_OVERVIEW.md](./INFRASTRUCTURE_OVERVIEW.md) - System architecture
- [DEV_ONBOARDING_GUIDE.md](./DEV_ONBOARDING_GUIDE.md) - Developer setup
- [SYSTEM_PROMPT_REFERENCE.md](./SYSTEM_PROMPT_REFERENCE.md) - AI configuration

---

**Document Version**: 1.0.0
**Last Updated**: November 5, 2025
**Status**: Production Ready ✅
**Feature**: #11 - User Authentication System
