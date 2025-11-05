# BALI ZERO TAX PLATFORM - Technical Specification (Part 3)

## 🔐 Security & Privacy

### Data Privacy Levels

```
┌─────────────────────────────────────────────────────────┐
│ LEVEL 1: FULL INTERNAL (Tax Team Only)                 │
├─────────────────────────────────────────────────────────┤
│ • Complete financial details                            │
│ • All transaction data from Jurnal.id                   │
│ • Internal notes and comments                           │
│ • Consultant discussions                                │
│ • Detailed calculation breakdowns                       │
│ • Client-specific strategies                            │
│                                                         │
│ Storage: PostgreSQL (encrypted at rest)                 │
│ Access: JWT auth, role-based permissions                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ LEVEL 2: CLIENT PORTAL (my.balizero.com)               │
├─────────────────────────────────────────────────────────┤
│ • Total tax amount only (no breakdown)                  │
│ • e-SPT download                                        │
│ • Payment due dates                                     │
│ • Payment status                                        │
│ • Public notes from consultant                          │
│ • Invoice amounts                                       │
│                                                         │
│ Storage: Cloudflare Pages + API calls                   │
│ Access: Email-based login, OTP verification             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ LEVEL 3: ZANTARA RAG (Business Intelligence)           │
├─────────────────────────────────────────────────────────┤
│ • Aggregated industry data (NO specific amounts)        │
│ • Pattern recognition                                   │
│ • Anonymized client preferences                         │
│ • Hashed email for identification (not reversible)      │
│ • Revenue brackets (not exact numbers)                  │
│ • Types of incentives used (not amounts)                │
│                                                         │
│ Storage: ChromaDB vector store                          │
│ Access: Internal API only                               │
└─────────────────────────────────────────────────────────┘
```

### Authentication & Authorization

#### JWT Token Structure
```typescript
{
  "sub": "consultant-uuid",
  "email": "angel@balizero.com",
  "role": "tax_consultant",
  "permissions": {
    "can_view_all_clients": true,
    "can_create_calculations": true,
    "can_approve_calculations": false
  },
  "iat": 1699185600,
  "exp": 1699272000
}
```

#### Role-Based Access Control (RBAC)

| Permission | Tax Manager | Tax Consultant | Tax Expert | Customer Service |
|------------|-------------|----------------|------------|------------------|
| View all clients | ✅ | ✅ | ✅ | ✅ |
| View assigned only | - | ✅ | ✅ | - |
| Create calculations | ✅ | ✅ | ✅ | ❌ |
| Edit calculations | ✅ | ✅ (own) | ✅ (own) | ❌ |
| Delete calculations | ✅ | ❌ | ❌ | ❌ |
| Approve calculations | ✅ | ❌ | ❌ | ❌ |
| Send to portal | ✅ | ✅ | ✅ | ❌ |
| Create invoices | ✅ | ✅ | ✅ | ❌ |
| View financial details | ✅ | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View analytics (all) | ✅ | ❌ | ❌ | ❌ |
| View analytics (own) | ✅ | ✅ | ✅ | ✅ |
| Access Jurnal sync | ✅ | ✅ | ✅ | ❌ |
| Client messaging | ✅ | ✅ | ✅ | ✅ |

### Data Encryption

#### At Rest
```typescript
// PostgreSQL encryption
// 1. Database-level encryption (Fly.io PostgreSQL encrypted volumes)
// 2. Application-level encryption for sensitive fields

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Encrypt sensitive fields before storing
await db.jurnal_connections.create({
  api_key: encrypt(plaintextApiKey),
  api_secret: encrypt(plaintextSecret)
});
```

#### In Transit
- All API calls over HTTPS/TLS 1.3
- WSS (WebSocket Secure) for real-time updates
- Certificate pinning for Jurnal.id API calls

### Audit Trail

All sensitive operations are logged:

```typescript
async function auditLog(action: AuditAction) {
  await db.audit_trail.insert({
    table_name: action.table,
    record_id: action.recordId,
    action: action.type, // 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'
    user_id: action.userId,
    user_email: action.userEmail,
    user_role: action.userRole,
    timestamp: new Date(),
    changes: action.changes, // Before/after values
    ip_address: action.ipAddress,
    user_agent: action.userAgent,
    reason: action.reason
  });
}

// Example usage
await auditLog({
  table: 'tax_calculations',
  recordId: calculationId,
  type: 'APPROVE',
  userId: veronika.id,
  userEmail: 'veronika@balizero.com',
  userRole: 'tax_manager',
  changes: { status: { old: 'pending_review', new: 'approved' } },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  reason: 'Approved after review - all documents verified'
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

// Strict limit for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute
  message: 'Rate limit exceeded for sensitive operation'
});

app.use('/api/tax/', generalLimiter);
app.use('/api/tax/calculations/:id/approve', strictLimiter);
app.use('/api/auth/login', strictLimiter);
```

### Input Validation

```typescript
import { z } from 'zod';

// Zod schemas for all inputs
const CreateCalculationSchema = z.object({
  company_id: z.string().uuid(),
  calculation_type: z.enum(['PPH_25', 'PPH_29', 'PPH_21', 'ANNUAL_RECONCILIATION']),
  fiscal_year: z.number().int().min(2020).max(2030),
  period: z.string().regex(/^(Q[1-4]|ANNUAL|JANUARY|FEBRUARY|...)$/),
  gross_revenue: z.number().positive().max(999999999999), // Max 999B
  operating_expenses: z.number().nonnegative(),
  // ... other fields
});

app.post('/api/tax/calculate', async (req, res) => {
  try {
    const validatedData = CreateCalculationSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
});
```

---

## 🎨 User Interface (GitHub Spark)

### Technology
- **Platform:** GitHub Spark
- **Framework:** React (generated by Spark)
- **Styling:** Tailwind CSS / Shadcn UI
- **State Management:** React Context / Zustand
- **API Client:** Fetch API / Axios

### Key Screens

#### 1. Login Screen
```
┌──────────────────────────────────────┐
│                                      │
│         🏢 BALI ZERO TAX            │
│      Tax Management Platform        │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Email                          │ │
│  │ [____________________]         │ │
│  │                                │ │
│  │ Password                       │ │
│  │ [____________________]         │ │
│  │                                │ │
│  │ [  Login  ]                    │ │
│  │                                │ │
│  │ Forgot password?               │ │
│  └────────────────────────────────┘ │
│                                      │
│  Powered by ZANTARA AI              │
└──────────────────────────────────────┘
```

#### 2. Dashboard (Consultant View)
```
┌─────────────────────────────────────────────────────────┐
│ 🏠 Dashboard    👥 Clients    🧮 Calculations    📊     │
├─────────────────────────────────────────────────────────┤
│ Welcome back, Angel! 👋                                 │
│                                                         │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│ │ 12 Clients │ │ 3 Pending  │ │ 5 Upcoming │          │
│ │ Active     │ │ Reports    │ │ Payments   │          │
│ └────────────┘ └────────────┘ └────────────┘          │
│                                                         │
│ 📋 Recent Activity                                      │
│ ├─ PT Example - Q4 tax calculated     2h ago          │
│ ├─ CV Test Corp - Payment recorded    5h ago          │
│ └─ PT Demo Ltd - Needs review         1d ago          │
│                                                         │
│ ⚠️  Alerts                                              │
│ ├─ PT Example: Payment due in 3 days                  │
│ └─ CV Test: Jurnal sync failed                        │
│                                                         │
│ 📅 This Week                                            │
│ Mon: 2 calculations due                                │
│ Wed: Client meeting - PT Example                       │
│ Fri: Monthly report deadline                           │
└─────────────────────────────────────────────────────────┘
```

#### 3. Client List
```
┌─────────────────────────────────────────────────────────┐
│ 👥 My Clients                      [+ New Client]       │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search: [__________]  Filter: [All ▼] [Active ▼]   │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🏢 PT Example Indonesia                          │   │
│ │ NPWP: 12.345.678.9-123.000                       │   │
│ │ KBLI: 46391 - Trade                              │   │
│ │ Last Report: Q3 2024 │ Next Payment: Nov 10      │   │
│ │ [View Profile] [Calculate Tax] [Documents]       │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ 🏢 CV Test Corporation                           │   │
│ │ NPWP: 98.765.432.1-321.000                       │   │
│ │ KBLI: 62010 - IT Services                        │   │
│ │ Last Report: Q2 2024 │ ⚠️  Overdue payment       │   │
│ │ [View Profile] [Calculate Tax] [Documents]       │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ Showing 1-10 of 12 clients                             │
└─────────────────────────────────────────────────────────┘
```

#### 4. Client Profile
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Clients        PT Example Indonesia           │
├─────────────────────────────────────────────────────────┤
│ [📋 Info] [💰 Financials] [🧮 Tax] [📄 Invoices]       │
│                                                         │
│ 📋 COMPANY INFORMATION                                  │
│ ├─ Company Name: PT Example Indonesia                  │
│ ├─ Legal Type: PT (Limited Liability)                  │
│ ├─ NPWP: 12.345.678.9-123.000                          │
│ ├─ NIB: 1234567890123                                  │
│ ├─ Email: contact@ptexample.com                        │
│ ├─ Phone: +62-812-3456-7890                            │
│ ├─ KBLI: 46391 - Wholesale trade                       │
│ └─ Assigned to: Angel (angel@balizero.com)            │
│                                                         │
│ 📁 Documents: [Google Drive Folder →]                  │
│                                                         │
│ 💰 JURNAL.ID CONNECTION                                 │
│ ├─ Status: ✅ Connected                                │
│ ├─ Last Sync: 2 hours ago                              │
│ └─ [Sync Now] [View in Jurnal]                        │
│                                                         │
│ 📊 QUICK STATS                                          │
│ ├─ FY 2024 Revenue: Rp 5,000,000,000                  │
│ ├─ Tax Paid YTD: Rp 440,000,000                       │
│ ├─ Next Payment: Jan 10 - Rp 33,333,333               │
│ └─ Compliance Score: 95%                               │
│                                                         │
│ 📝 INTERNAL NOTES (Private)                             │
│ [Text area for consultant notes...]                    │
│ [Save Notes]                                           │
└─────────────────────────────────────────────────────────┘
```

#### 5. Tax Calculator (Main Screen)
```
┌─────────────────────────────────────────────────────────┐
│ 🧮 New Tax Calculation                                  │
├─────────────────────────────────────────────────────────┤
│ Step 1 of 3: Company & Period                          │
│                                                         │
│ Company: [PT Example Indonesia ▼]                      │
│                                                         │
│ Calculation Type: [PPh 25 ▼]                           │
│ Fiscal Year: [2024 ▼]                                  │
│ Period: [Q4 ▼]                                         │
│                                                         │
│ 💡 Import Financial Data from Jurnal.id?               │
│ ┌─────────────────────────────────────────────┐       │
│ │ ✅ Auto-import from Jurnal.id               │       │
│ │                                             │       │
│ │ Last synced: 2 hours ago                    │       │
│ │ Data available for Oct 1 - Dec 31, 2024    │       │
│ │                                             │       │
│ │ [Sync Latest Data] [Continue with Import]  │       │
│ │                                             │       │
│ │ ─── OR ───                                  │       │
│ │                                             │       │
│ │ ⬜ Enter financial data manually            │       │
│ └─────────────────────────────────────────────┘       │
│                                                         │
│ [Cancel] [Next Step →]                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🧮 New Tax Calculation                                  │
├─────────────────────────────────────────────────────────┤
│ Step 2 of 3: Financial Data                            │
│                                                         │
│ 📊 Financial Summary (from Jurnal.id)                  │
│                                                         │
│ Gross Revenue:        Rp [500,000,000] ✅ Imported     │
│ Cost of Goods Sold:   Rp [200,000,000] ✅ Imported     │
│ Operating Expenses:   Rp [100,000,000] ✅ Imported     │
│ Other Income:         Rp [10,000,000]  ✅ Imported     │
│ Other Expenses:       Rp [5,000,000]   ✅ Imported     │
│                                                         │
│ 💡 Adjustments (if needed)                              │
│ ┌─────────────────────────────────────────────┐       │
│ │ Add fiscal corrections or adjustments:      │       │
│ │ [+ Add Adjustment]                          │       │
│ │                                             │       │
│ │ Example: Non-deductible expense, one-time   │       │
│ │ income, etc.                                │       │
│ └─────────────────────────────────────────────┘       │
│                                                         │
│ Accounting Profit: Rp 205,000,000                      │
│                                                         │
│ [← Back] [Next: Calculate →]                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🧮 Tax Calculation Result                               │
├─────────────────────────────────────────────────────────┤
│ Step 3 of 3: Review & Save                             │
│                                                         │
│ PT Example Indonesia - Q4 2024                         │
│                                                         │
│ ╔════════════════════════════════════════════════════╗ │
│ ║ 💰 TAX CALCULATION                                 ║ │
│ ║────────────────────────────────────────────────────║ │
│ ║ Taxable Income:       Rp 200,000,000              ║ │
│ ║ Tax Rate:             22%                          ║ │
│ ║ Gross Tax:            Rp 44,000,000               ║ │
│ ║                                                    ║ │
│ ║ Tax Incentives:       (Rp 4,000,000)              ║ │
│ ║   • Investment Allow.  30%                         ║ │
│ ║                                                    ║ │
│ ║ Net Tax Payable:      Rp 40,000,000               ║ │
│ ║                                                    ║ │
│ ║ Monthly PPh 25:       Rp 3,333,333                ║ │
│ ╚════════════════════════════════════════════════════╝ │
│                                                         │
│ 🤖 ZANTARA AI INSIGHTS                                  │
│ ┌─────────────────────────────────────────────┐       │
│ │ ✅ Calculation verified against regulations │       │
│ │                                             │       │
│ │ 💡 Recommendations:                         │       │
│ │ • Eligible for PP 55/2022 investment        │       │
│ │   allowance (already applied)               │       │
│ │ • Consider R&D super deduction for 2025     │       │
│ │ • Review transfer pricing documentation     │       │
│ │                                             │       │
│ │ 📚 Relevant Regulations:                    │       │
│ │ • UU 7/2021 - Corporate tax rate 22%        │       │
│ │ • PP 55/2022 - Investment incentives        │       │
│ │                                             │       │
│ │ [View Full ZANTARA Analysis]               │       │
│ └─────────────────────────────────────────────┘       │
│                                                         │
│ 📝 Notes for Client (optional)                         │
│ [Your Q4 tax calculation is ready...]                  │
│                                                         │
│ [← Back] [Save as Draft] [Submit for Review]          │
└─────────────────────────────────────────────────────────┘
```

#### 6. Manager Approval Screen (Veronika)
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Review Tax Calculation                               │
├─────────────────────────────────────────────────────────┤
│ PT Example Indonesia - Q4 2024 PPh 25                  │
│ Calculated by: Angel                                    │
│ Submitted: Nov 5, 2024 11:00 AM                        │
│                                                         │
│ [Summary] [Details] [Documents] [History]              │
│                                                         │
│ TAX SUMMARY                                             │
│ ├─ Taxable Income: Rp 200,000,000                      │
│ ├─ Tax Rate: 22%                                        │
│ ├─ Net Tax: Rp 40,000,000                              │
│ └─ Monthly PPh 25: Rp 3,333,333                        │
│                                                         │
│ CHECKLIST                                               │
│ ☑ Financial data verified                              │
│ ☑ Jurnal.id sync successful                            │
│ ☑ Incentives correctly applied                         │
│ ☑ ZANTARA validation passed                            │
│ ☐ Supporting documents uploaded                         │
│                                                         │
│ 📝 REVIEW NOTES                                         │
│ [Text area for manager notes...]                       │
│                                                         │
│ Actions:                                                │
│ [❌ Reject] [✅ Approve] [💬 Request Changes]          │
└─────────────────────────────────────────────────────────┘
```

### Component Library

```typescript
// Reusable components

// 1. CompanySelector
<CompanySelector
  value={selectedCompany}
  onChange={setSelectedCompany}
  consultantId={currentUser.id}
  includeInactive={false}
/>

// 2. TaxCalculationCard
<TaxCalculationCard
  calculation={calculation}
  onView={() => navigate(`/calculations/${calc.id}`)}
  onEdit={() => navigate(`/calculations/${calc.id}/edit`)}
  showActions={true}
/>

// 3. ZantaraInsightPanel
<ZantaraInsightPanel
  recommendations={zantaraData.recommendations}
  references={zantaraData.references}
  onViewDetails={() => openZantaraModal()}
/>

// 4. JurnalSyncStatus
<JurnalSyncStatus
  companyId={company.id}
  lastSync={connection.last_sync_success}
  onSync={() => triggerSync()}
/>

// 5. PaymentCalendar
<PaymentCalendar
  payments={upcomingPayments}
  onPaymentClick={(payment) => openPaymentModal(payment)}
/>
```

---

*[Document continues in Part 4...]*
