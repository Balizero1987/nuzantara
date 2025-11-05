# BALI ZERO TAX PLATFORM - Technical Specification (Part 2)

## 📡 API Endpoints

### Base URL
```
Production:  https://nuzantara-backend.fly.dev
Development: http://localhost:8080
```

### Authentication
All endpoints require JWT authentication via header:
```
Authorization: Bearer <jwt_token>
```

User authentication based on `tax_consultants` table email.

---

### 🔐 Authentication Endpoints

#### POST /api/auth/login
```typescript
Request:
{
  "email": "veronika@balizero.com",
  "password": "secure_password"
}

Response:
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "veronika@balizero.com",
      "full_name": "Veronika",
      "role": "tax_manager",
      "permissions": {
        "can_view_all_clients": true,
        "can_approve_calculations": true,
        ...
      }
    },
    "expires_in": "24h"
  }
}
```

---

### 👥 Client/Company Management

#### GET /api/tax/companies
List all companies (with filters)

```typescript
Query Params:
  ?consultant_id=uuid   // Filter by assigned consultant
  ?status=active        // Filter by status
  ?search=PT%20Example  // Search by name
  ?kbli_code=46391     // Filter by KBLI
  ?page=1&limit=20     // Pagination

Response:
{
  "ok": true,
  "data": {
    "companies": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
}
```

#### POST /api/tax/companies
Create new company profile

```typescript
Request:
{
  "company_name": "PT Example Indonesia",
  "legal_entity_type": "PT",
  "npwp": "12.345.678.9-123.000",
  "email": "contact@ptexample.com",
  "phone": "+62-812-3456-7890",
  "kbli_code": "46391",
  "assigned_consultant_id": "consultant-uuid",
  "address_city": "Denpasar",
  "documents_folder_url": "https://drive.google.com/...",
  ...
}

Response:
{
  "ok": true,
  "data": {
    "company": {...},
    "id": "company-uuid"
  }
}
```

#### GET /api/tax/companies/:id
Get single company profile

```typescript
Response:
{
  "ok": true,
  "data": {
    "company": {
      "id": "uuid",
      "company_name": "PT Example",
      "npwp": "12.345.678.9-123.000",
      ...
      "assigned_consultant": {
        "id": "uuid",
        "full_name": "Angel",
        "email": "angel@balizero.com"
      },
      "recent_calculations": [...], // Last 5 calculations
      "payment_summary": {
        "total_paid_ytd": 440000000,
        "outstanding": 33000000,
        "next_payment_due": "2024-01-10"
      }
    }
  }
}
```

#### PUT /api/tax/companies/:id
Update company profile

#### DELETE /api/tax/companies/:id
Soft delete (set status='inactive')

---

### 💰 Financial Summaries (Jurnal Integration)

#### POST /api/tax/jurnal/connect
Connect company to Jurnal.id

```typescript
Request:
{
  "company_id": "company-uuid",
  "jurnal_company_id": "abc123",
  "api_key": "encrypted_key",
  "auto_sync_enabled": true
}

Response:
{
  "ok": true,
  "data": {
    "connection_id": "uuid",
    "status": "active",
    "test_connection": "success"
  }
}
```

#### POST /api/tax/jurnal/sync
Manually trigger sync for a company

```typescript
Request:
{
  "company_id": "company-uuid",
  "period_start": "2024-10-01",
  "period_end": "2024-12-31"
}

Response:
{
  "ok": true,
  "data": {
    "sync_id": "uuid",
    "status": "in_progress",
    "estimated_duration": "30s"
  }
}
```

#### GET /api/tax/jurnal/sync-status/:sync_id
Check sync status

```typescript
Response:
{
  "ok": true,
  "data": {
    "status": "success",
    "records_synced": 245,
    "revenue_total": 500000000,
    "expense_total": 300000000,
    "duration_seconds": 28,
    "financial_summary_id": "uuid"
  }
}
```

#### GET /api/tax/financial-summaries/:company_id
Get financial summaries for a company

```typescript
Query Params:
  ?fiscal_year=2024
  ?period_type=Q1

Response:
{
  "ok": true,
  "data": {
    "summaries": [
      {
        "id": "uuid",
        "fiscal_year": 2024,
        "period_type": "Q4",
        "total_revenue": 500000000,
        "total_expenses": 300000000,
        "gross_profit": 200000000,
        "source": "jurnal",
        "last_synced": "2024-11-05T10:30:00Z"
      }
    ]
  }
}
```

---

### 🧮 Tax Calculations

#### POST /api/tax/calculate
Create new tax calculation (main endpoint)

```typescript
Request:
{
  "company_id": "company-uuid",
  "calculation_type": "PPH_25",
  "fiscal_year": 2024,
  "period": "Q4",

  // Option 1: Link to financial summary (from Jurnal)
  "financial_summary_id": "uuid",

  // Option 2: Manual input
  "manual_data": {
    "gross_revenue": 500000000,
    "operating_expenses": 300000000,
    ...
  },

  // Additional params
  "apply_zantara_insights": true
}

Response:
{
  "ok": true,
  "data": {
    "calculation_id": "uuid",
    "calculation": {
      "taxable_income": 200000000,
      "applicable_tax_rate": 22,
      "gross_tax": 44000000,
      "tax_after_incentives": 40000000,
      "net_tax_payable": 40000000,
      "monthly_installment_pph25": 3333333,

      // ZANTARA insights
      "zantara_insights": {
        "recommendations": [
          "Eligible for PP 55/2022 investment allowance",
          "Consider R&D super deduction for innovation expenses"
        ],
        "relevant_regulations": [...],
        "confidence_score": 0.92
      },

      // Detailed breakdown
      "breakdown": {
        "revenue": 500000000,
        "deductible_expenses": 300000000,
        "fiscal_corrections": [...],
        "incentives_applied": [...]
      }
    },
    "status": "draft"
  }
}
```

#### GET /api/tax/calculations/:id
Get calculation details

#### PUT /api/tax/calculations/:id
Update calculation

#### POST /api/tax/calculations/:id/submit-review
Submit for manager review

```typescript
Request:
{
  "notes": "Ready for review. All documents verified."
}

Response:
{
  "ok": true,
  "data": {
    "status": "pending_review",
    "submitted_at": "2024-11-05T11:00:00Z"
  }
}
```

#### POST /api/tax/calculations/:id/approve
Approve calculation (Manager only)

```typescript
Request:
{
  "approved_by": "veronika-uuid",
  "notes": "Approved. Ready for filing."
}

Response:
{
  "ok": true,
  "data": {
    "status": "approved",
    "approved_at": "2024-11-05T11:30:00Z"
  }
}
```

#### POST /api/tax/calculations/:id/generate-espt
Generate e-SPT document

```typescript
Response:
{
  "ok": true,
  "data": {
    "espt_number": "SPT-2024-Q4-0001",
    "espt_file_url": "https://storage.../espt.pdf",
    "generated_at": "2024-11-05T12:00:00Z"
  }
}
```

#### POST /api/tax/calculations/:id/send-to-portal
Sync to client portal

```typescript
Request:
{
  "client_message": "Your Q4 tax calculation is ready. Please review."
}

Response:
{
  "ok": true,
  "data": {
    "portal_sync_id": "uuid",
    "synced_at": "2024-11-05T12:05:00Z",
    "client_notified": true
  }
}
```

#### GET /api/tax/calculations
List calculations with filters

```typescript
Query Params:
  ?company_id=uuid
  ?fiscal_year=2024
  ?period=Q4
  ?status=approved
  ?consultant_id=uuid

Response:
{
  "ok": true,
  "data": {
    "calculations": [...],
    "total": 120,
    "summary": {
      "total_tax_collected": 5280000000,
      "pending_approvals": 5
    }
  }
}
```

---

### 💸 Tax Payments

#### POST /api/tax/payments
Record tax payment

```typescript
Request:
{
  "company_id": "company-uuid",
  "calculation_id": "calc-uuid",
  "payment_type": "PPH_25",
  "amount_due": 3333333,
  "amount_paid": 3333333,
  "payment_date": "2024-11-10",
  "payment_method": "bank_transfer",
  "payment_reference": "TRX123456"
}

Response:
{
  "ok": true,
  "data": {
    "payment_id": "uuid",
    "payment_status": "paid"
  }
}
```

#### GET /api/tax/payments/:company_id
Get payment history

#### GET /api/tax/payments/upcoming
Get upcoming payments (all clients or by consultant)

```typescript
Query Params:
  ?consultant_id=uuid
  ?days_ahead=30

Response:
{
  "ok": true,
  "data": {
    "upcoming_payments": [
      {
        "company_name": "PT Example",
        "payment_type": "PPH_25",
        "amount_due": 3333333,
        "due_date": "2024-11-10",
        "days_until_due": 5
      }
    ],
    "total_amount": 150000000
  }
}
```

---

### 🎁 Tax Incentives

#### GET /api/tax/incentives/check
Check eligible incentives for a company

```typescript
Query Params:
  ?company_id=uuid
  ?calculation_id=uuid

Response:
{
  "ok": true,
  "data": {
    "eligible_incentives": [
      {
        "type": "investment_allowance",
        "name": "PP 55/2022 - Investment Allowance",
        "reduction_percentage": 30,
        "estimated_savings": 5000000,
        "requirements": [...],
        "zantara_reference": {...}
      }
    ]
  }
}
```

#### POST /api/tax/incentives/apply
Apply incentive to company

---

### 🤖 ZANTARA Integration

#### POST /api/tax/zantara/query
Query ZANTARA for tax insights

```typescript
Request:
{
  "query": "What are the tax incentives for KBLI 46391?",
  "company_id": "company-uuid", // Optional, for context
  "context": {
    "kbli_code": "46391",
    "revenue": "50B-500B"
  }
}

Response:
{
  "ok": true,
  "data": {
    "response": "Based on KBLI 46391 (Trade), companies are eligible for...",
    "references": [
      {
        "doc_id": "pp-55-2022",
        "title": "PP 55/2022 - Tax Incentives",
        "relevance_score": 0.95,
        "snippet": "..."
      }
    ],
    "model_used": "claude-3-sonnet",
    "confidence": 0.92
  }
}
```

#### POST /api/tax/zantara/personalized-chat
Chat with ZANTARA (client-specific context)

```typescript
Request:
{
  "company_id": "company-uuid",
  "message": "When is my next tax payment due?",
  "user_email": "contact@ptexample.com" // For personalization
}

Response:
{
  "ok": true,
  "data": {
    "response": "Hi PT Example! Your next PPh 25 payment of Rp 3,333,333 is due on November 10, 2024...",
    "personalized": true,
    "context_used": ["recent_calculations", "payment_history"]
  }
}
```

---

### 📄 Invoicing

#### POST /api/tax/invoices
Create invoice for Bali Zero services

```typescript
Request:
{
  "company_id": "company-uuid",
  "invoice_date": "2024-11-05",
  "due_date": "2024-11-20",
  "line_items": [
    {
      "description": "Q4 2024 Tax Calculation & Filing",
      "quantity": 1,
      "unit_price": 5000000
    }
  ],
  "related_calculation_ids": ["calc-uuid-1", "calc-uuid-2"]
}

Response:
{
  "ok": true,
  "data": {
    "invoice_id": "uuid",
    "invoice_number": "BZ-2024-0145",
    "total": 5550000, // Including 11% VAT
    "pdf_url": "https://storage.../invoice.pdf"
  }
}
```

#### GET /api/tax/invoices
List invoices

#### POST /api/tax/invoices/:id/record-payment
Record payment received

---

### 📊 Analytics & Reports

#### GET /api/tax/analytics/dashboard
Get consultant dashboard stats

```typescript
Query Params:
  ?consultant_id=uuid

Response:
{
  "ok": true,
  "data": {
    "overview": {
      "total_clients": 12,
      "active_clients": 10,
      "pending_calculations": 3,
      "pending_approvals": 1
    },
    "this_month": {
      "calculations_completed": 10,
      "total_tax_calculated": 440000000,
      "invoices_issued": 12,
      "revenue_billed": 60000000
    },
    "upcoming": {
      "payment_deadlines": 5,
      "client_meetings": 2
    },
    "alerts": [
      {
        "type": "overdue_payment",
        "company_name": "PT Example",
        "message": "Payment overdue by 5 days"
      }
    ]
  }
}
```

#### GET /api/tax/analytics/team
Team-wide analytics (Manager only)

```typescript
Response:
{
  "ok": true,
  "data": {
    "team_performance": {
      "total_clients": 45,
      "total_calculations_ytd": 180,
      "total_tax_managed": 5280000000,
      "total_revenue_billed": 225000000
    },
    "by_consultant": [
      {
        "consultant_name": "Angel",
        "clients": 12,
        "calculations_completed": 48,
        "avg_turnaround_days": 2.5
      }
    ]
  }
}
```

---

## 🔌 Jurnal.id Integration

### API Documentation
- **Base URL:** `https://api.jurnal.id/v1`
- **Authentication:** API Key in header `Authorization: Bearer {api_key}`
- **Documentation:** https://api-docs.jurnal.id

### Key Endpoints to Use

#### 1. Get Transactions
```
GET /transactions
  ?company_id={jurnal_company_id}
  &start_date=2024-10-01
  &end_date=2024-12-31
  &account_type=revenue,expense
```

#### 2. Get Chart of Accounts
```
GET /chart_of_accounts?company_id={jurnal_company_id}
```

#### 3. Get Account Balance
```
GET /accounts/{account_id}/balance
  ?company_id={jurnal_company_id}
  &as_of_date=2024-12-31
```

### Integration Architecture

```typescript
// Service: src/services/jurnal-integration.ts

export class JurnalIntegrationService {

  async connect(companyId: string, credentials: JurnalCredentials) {
    // 1. Validate credentials with Jurnal.id
    // 2. Store encrypted in jurnal_connections table
    // 3. Run initial test sync
  }

  async syncFinancialData(companyId: string, periodStart: Date, periodEnd: Date) {
    // 1. Fetch connection details
    // 2. Call Jurnal.id API for transactions
    // 3. Aggregate by account type (revenue/expense)
    // 4. Store in financial_summaries table
    // 5. Log in jurnal_sync_log
    // 6. Return summary
  }

  async mapJurnalAccountsToTaxCategories(accounts: JurnalAccount[]) {
    // Map Jurnal's chart of accounts to our tax categories
    // Revenue accounts → gross_revenue
    // COGS accounts → cost_of_goods_sold
    // Operating expense accounts → operating_expenses
  }

  async handleSyncErrors(error: any, connectionId: string) {
    // Log errors, notify consultant, update connection status
  }
}
```

### Data Mapping

```typescript
// Jurnal.id Transaction → Our Financial Summary
{
  // Jurnal.id data
  "transaction_id": "123",
  "date": "2024-10-15",
  "account_name": "Sales Revenue",
  "account_type": "revenue",
  "amount": 50000000,
  "memo": "Product sales"
}

↓ Aggregate by period ↓

{
  // Our financial_summaries record
  "company_id": "uuid",
  "fiscal_year": 2024,
  "period_type": "Q4",
  "total_revenue": 500000000, // Sum of all revenue accounts
  "total_expenses": 300000000, // Sum of all expense accounts
  "revenue_breakdown": {
    "sales": 450000000,
    "services": 50000000
  },
  "source": "jurnal",
  "jurnal_sync_id": "sync-log-uuid"
}
```

### Error Handling

```typescript
// Common Jurnal.id errors and handling
enum JurnalErrorType {
  INVALID_API_KEY = 401,
  RATE_LIMIT = 429,
  COMPANY_NOT_FOUND = 404,
  NETWORK_ERROR = 'NETWORK',
}

async function handleJurnalError(error: any) {
  switch(error.status) {
    case 401:
      // Invalid API key - notify consultant, disable auto-sync
      await disableConnection(connectionId);
      await notifyConsultant('API key invalid, please reconnect');
      break;

    case 429:
      // Rate limit - retry with exponential backoff
      await scheduleRetry(syncId, delaySeconds);
      break;

    case 404:
      // Company not found - check company_id
      await logError('Jurnal company_id not found');
      break;

    default:
      // Generic error
      await logError(error.message);
  }
}
```

### Sync Scheduler

```typescript
// Automatic sync scheduling
// Run daily at 2 AM for all companies with auto_sync_enabled

import { CronJob } from 'cron';

new CronJob('0 2 * * *', async () => {
  const companies = await getCompaniesWithAutoSync();

  for (const company of companies) {
    try {
      await jurnalService.syncFinancialData(
        company.id,
        getStartOfMonth(),
        getCurrentDate()
      );
    } catch (error) {
      await logSyncError(company.id, error);
    }
  }
}, null, true, 'Asia/Jakarta');
```

---

## 🤖 ZANTARA AI Integration

### Architecture

```
┌─────────────────────────┐
│  Tax Calculator         │
│  (Backend API)          │
└──────────┬──────────────┘
           │
           ↓ Query ZANTARA
┌─────────────────────────┐
│  ZANTARA RAG Backend    │
│  (Python FastAPI)       │
└──────────┬──────────────┘
           │
           ↓ Search
┌─────────────────────────┐
│  ChromaDB               │
│  • tax_genius collection│
│  • Client profiles      │
└─────────────────────────┘
```

### Integration Points

#### 1. Tax Calculation Insights
When calculating taxes, query ZANTARA for:
- Eligible incentives based on KBLI code
- Recent regulation changes
- Industry-specific considerations
- Compliance recommendations

```typescript
async function enrichCalculationWithZantara(calculation: TaxCalculation) {
  const company = await getCompany(calculation.company_id);

  const queries = [
    `Tax incentives for KBLI ${company.kbli_code}`,
    `PPh ${calculation.calculation_type} regulations ${calculation.fiscal_year}`,
    `Special considerations for ${company.legal_entity_type} companies`
  ];

  const insights = await Promise.all(
    queries.map(q => queryZantara(q, {
      collection: 'tax_genius',
      limit: 3,
      min_confidence: 0.7
    }))
  );

  return {
    recommendations: extractRecommendations(insights),
    relevant_regulations: extractRegulations(insights),
    zantara_references: insights.flatMap(i => i.references)
  };
}
```

#### 2. Client Personalization
When client logs into portal and chats:

```typescript
async function handleClientChat(message: string, clientEmail: string) {
  // Get client context
  const company = await getCompanyByEmail(clientEmail);
  const recentCalculations = await getRecentCalculations(company.id, 3);
  const upcomingPayments = await getUpcomingPayments(company.id);

  // Build context for ZANTARA
  const context = {
    company_name: company.company_name,
    kbli_code: company.kbli_code,
    recent_tax_amount: recentCalculations[0]?.net_tax_payable,
    next_payment_due: upcomingPayments[0]?.due_date,
    common_topics: company.client_preferences?.frequent_topics || []
  };

  // Query ZANTARA with personalization
  const response = await fetch(`${RAG_URL}/bali-zero/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': clientEmail
    },
    body: JSON.stringify({
      query: message,
      context: context,
      personalize: true
    })
  });

  return response.json();
}
```

#### 3. Business Intelligence Feed
Periodically feed aggregated data to ZANTARA:

```typescript
async function feedIntelligenceToZantara(calculation: TaxCalculation) {
  const company = await getCompany(calculation.company_id);

  // Create anonymized intelligence entry
  const intelligence = {
    company_size_bracket: determineCompanySizeBracket(calculation.gross_revenue),
    legal_entity_type: company.legal_entity_type,
    kbli_code: company.kbli_code,
    industry_sector: company.industry_sector,
    revenue_bracket: determineRevenueBracket(calculation.gross_revenue),
    tax_rate_applied: calculation.applicable_tax_rate,
    incentives_used: calculation.tax_incentives?.map(i => i.type) || [],
    fiscal_year: calculation.fiscal_year,
    client_email_hash: sha256(company.email)
  };

  // Store in rag_intelligence_feed table
  await insertRagIntelligence(intelligence);

  // Sync to ZANTARA periodically (batch process)
  // await syncToZantaraRAG(intelligence);
}
```

### ZANTARA API Endpoints Used

```typescript
// Existing ZANTARA endpoints we'll leverage:

// 1. Unified Knowledge Hub
POST https://nuzantara-rag.fly.dev/api/v3/zantara/unified
{
  "query": "tax incentives for trading companies",
  "user_id": "tax-calculator",
  "collection": "tax_genius"
}

// 2. Collective Intelligence
POST https://nuzantara-rag.fly.dev/api/v3/zantara/collective
{
  "query": "common tax issues for PT PMA",
  "user_id": "tax-calculator"
}

// 3. Semantic Search
POST https://nuzantara-rag.fly.dev/api/agent/semantic_search
{
  "agent_type": "semantic_search",
  "task": "find latest PPh 25 regulations",
  "input_data": {
    "collection": "tax_genius",
    "limit": 5
  }
}
```

---

*[Document continues in Part 3...]*
