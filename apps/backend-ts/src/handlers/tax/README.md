# 🏢 BALI ZERO TAX PLATFORM - API Documentation

**Version:** 1.0.0 (Phase 1)
**Date:** 2025-11-05
**Status:** Development

## 📋 Overview

This is the **Tax Platform API** for Bali Zero - a complete tax management system integrating with Jurnal.id, ZANTARA AI, and client portal (my.balizero.com).

**Phase 1 Endpoints:**
- Authentication (login, me)
- Company Management (CRUD operations)

## 🔐 Authentication

All endpoints (except `/auth/login`) require JWT authentication via header:
```
Authorization: Bearer <your_jwt_token>
```

### POST /api/tax/auth/login

Login and receive JWT token.

**Request:**
```json
{
  "email": "angel@balizero.com",
  "password": "demo123"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "angel-uuid",
      "email": "angel@balizero.com",
      "full_name": "Angel",
      "role": "tax_expert",
      "permissions": {
        "can_view_all_clients": true,
        "can_create_calculations": true,
        "can_approve_calculations": false,
        ...
      }
    },
    "expires_in": "24h"
  }
}
```

**Test Credentials (Development Only):**
- Email: `veronika@balizero.com` | Password: `demo123` (Tax Manager)
- Email: `angel@balizero.com` | Password: `demo123` (Tax Expert)

### GET /api/tax/auth/me

Get current authenticated user info.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "angel-uuid",
      "email": "angel@balizero.com",
      "role": "tax_expert",
      "permissions": {...}
    }
  }
}
```

### POST /api/tax/auth/logout

Logout (mainly client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "message": "Logged out successfully"
}
```

---

## 👥 Company Management

### GET /api/tax/companies

List companies with optional filters.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `consultant_id` (optional): Filter by assigned consultant
- `status` (optional): Filter by status (`active`, `inactive`, `pending`)
- `search` (optional): Search by name, NPWP, or email
- `kbli_code` (optional): Filter by KBLI code
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Example:**
```
GET /api/tax/companies?status=active&page=1&limit=10
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "companies": [
      {
        "id": "company-1",
        "company_name": "PT Example Indonesia",
        "legal_entity_type": "PT",
        "npwp": "12.345.678.9-123.000",
        "email": "contact@ptexample.com",
        "phone": "+62-812-3456-7890",
        "kbli_code": "46391",
        "kbli_description": "Wholesale trade",
        "assigned_consultant_id": "angel-uuid",
        "assigned_consultant_name": "Angel",
        "status": "active",
        "documents_folder_url": "https://drive.google.com/example",
        "client_since": "2023-01-15",
        "created_at": "2023-01-15T10:00:00Z",
        "updated_at": "2024-11-05T10:00:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 10,
    "has_more": false
  }
}
```

### POST /api/tax/companies

Create new company.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "company_name": "PT New Client Indonesia",
  "legal_entity_type": "PT",
  "email": "contact@newclient.com",
  "npwp": "12.345.678.9-999.000",
  "phone": "+62-812-9999-9999",
  "kbli_code": "46391",
  "kbli_description": "Wholesale trade",
  "assigned_consultant_id": "angel-uuid",
  "documents_folder_url": "https://drive.google.com/folder/xyz"
}
```

**Required Fields:**
- `company_name` (string)
- `legal_entity_type` (enum: `PT`, `PT_PMA`, `CV`, `FIRMA`, `UD`, `PERORANGAN`)
- `email` (email)

**Optional Fields:**
- `npwp`, `phone`, `kbli_code`, `kbli_description`, `assigned_consultant_id`, `documents_folder_url`

**Response:**
```json
{
  "ok": true,
  "data": {
    "company": {...},
    "id": "company-new-id"
  }
}
```

### GET /api/tax/companies/:id

Get single company details.

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/tax/companies/company-1
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "company": {
      "id": "company-1",
      "company_name": "PT Example Indonesia",
      ...
    },
    "recent_calculations": [],
    "payment_summary": {
      "total_paid_ytd": 0,
      "outstanding": 0,
      "next_payment_due": null
    },
    "jurnal_connection": {
      "connected": false,
      "last_sync": null
    }
  }
}
```

### PUT /api/tax/companies/:id

Update company.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "phone": "+62-812-8888-8888",
  "status": "active",
  "internal_notes": "Updated phone number"
}
```

**All fields optional**. Only send fields you want to update.

**Response:**
```json
{
  "ok": true,
  "data": {
    "company": {...}
  }
}
```

### DELETE /api/tax/companies/:id

Soft delete company (set status to inactive). **Managers only**.

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
DELETE /api/tax/companies/company-1
```

**Response:**
```json
{
  "ok": true,
  "message": "Company deleted successfully"
}
```

**Note:** Requires `tax_manager` role.

---

## 🔑 Roles & Permissions

### Roles
- `tax_manager` (Veronika) - Full access, approvals, user management
- `tax_expert` (Angel) - All clients, calculations, no approvals
- `tax_consultant` (Kadek, Dewa Ayu, Monaka) - Calculations, no approvals
- `customer_service` (Faisha) - View only, client messaging

### Permissions
- `can_view_all_clients`: View all companies (vs only assigned)
- `can_create_calculations`: Create tax calculations
- `can_approve_calculations`: Approve calculations (manager only)
- `can_manage_users`: User management (manager only)
- `can_send_to_portal`: Sync to client portal
- `can_create_invoices`: Create Bali Zero invoices

---

## 🧪 Testing

### Using curl

**1. Login:**
```bash
curl -X POST http://localhost:8080/api/tax/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"angel@balizero.com","password":"demo123"}'
```

**2. Get companies (with token):**
```bash
curl http://localhost:8080/api/tax/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**3. Create company:**
```bash
curl -X POST http://localhost:8080/api/tax/auth/companies \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "PT Test",
    "legal_entity_type": "PT",
    "email": "test@example.com"
  }'
```

### Using Postman

1. Create a Postman collection
2. Add environment variable `BASE_URL` = `http://localhost:8080`
3. Add environment variable `TOKEN` = (get from login)
4. Use `{{BASE_URL}}/api/tax/...` and `Bearer {{TOKEN}}`

---

## ⚠️ Development Notes

**Current Status:** Mock data (no database yet)

**Mock Users:**
- `veronika@balizero.com` (password: `demo123`)
- `angel@balizero.com` (password: `demo123`)

**Mock Companies:**
- PT Example Indonesia
- CV Test Corporation
- PT Demo Limited

**TODO Before Production:**
- [ ] Connect to PostgreSQL database
- [ ] Replace mock data with actual DB queries
- [ ] Implement bcrypt password hashing
- [ ] Add rate limiting
- [ ] Add audit trail logging
- [ ] Run database migrations
- [ ] Update passwords (remove `demo123`)

---

## 🚀 Next Phase Endpoints (Coming Soon)

**Phase 2: Jurnal.id Integration**
- POST `/api/tax/jurnal/connect`
- POST `/api/tax/jurnal/sync`
- GET `/api/tax/jurnal/sync-status/:id`

**Phase 3: Tax Calculations**
- POST `/api/tax/calculate`
- GET `/api/tax/calculations`
- GET `/api/tax/calculations/:id`
- POST `/api/tax/calculations/:id/approve`
- POST `/api/tax/calculations/:id/generate-espt`

**Phase 4: Portal & RAG**
- POST `/api/tax/portal/sync`
- POST `/api/tax/zantara/query`

---

## 📞 Support

**Developer:** Claude Code
**Documentation:** See `BALI_ZERO_TAX_PLATFORM_COMPLETE_SPEC.md`
**Issues:** Report via GitHub

---

**Last Updated:** 2025-11-05
**API Version:** 1.0.0 (Phase 1)
