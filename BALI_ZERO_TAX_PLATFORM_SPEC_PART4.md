# BALI ZERO TAX PLATFORM - Technical Specification (Part 4 - Final)

## 📱 Client Portal (my.balizero.com)

### Architecture
```
┌──────────────────────────────────┐
│   Cloudflare Pages               │
│   (Static Site Hosting)          │
│                                  │
│   - Next.js / React              │
│   - Tailwind CSS                 │
│   - Server-side rendering        │
└──────────┬───────────────────────┘
           │
           ↓ API Calls
┌──────────────────────────────────┐
│   Backend API                    │
│   (backend-ts)                   │
│                                  │
│   GET /api/portal/login          │
│   GET /api/portal/dashboard      │
│   GET /api/portal/calculations   │
│   GET /api/portal/payments       │
│   POST /api/portal/chat          │
└──────────────────────────────────┘
```

### Client Authentication
Email-based login with OTP (no password):

```typescript
// Flow:
1. Client enters email
2. System sends OTP to email
3. Client enters OTP
4. JWT token issued (expires in 1 hour)
5. Access granted to portal

// Implementation
POST /api/portal/request-otp
{
  "email": "contact@ptexample.com"
}

Response:
{
  "ok": true,
  "message": "OTP sent to your email",
  "expires_in": "5 minutes"
}

POST /api/portal/verify-otp
{
  "email": "contact@ptexample.com",
  "otp": "123456"
}

Response:
{
  "ok": true,
  "token": "eyJhbGci...",
  "company": {
    "id": "uuid",
    "company_name": "PT Example Indonesia",
    "email": "contact@ptexample.com"
  }
}
```

### Portal Screens

#### 1. Login
```
┌──────────────────────────────────────┐
│                                      │
│    🏢 BALI ZERO CLIENT PORTAL        │
│         my.balizero.com              │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Your Email                     │ │
│  │ [________________________]     │ │
│  │                                │ │
│  │ [  Send Login Code  ]          │ │
│  │                                │ │
│  │ We'll send a code to your email│ │
│  └────────────────────────────────┘ │
│                                      │
│  Secure. Simple. No password needed. │
└──────────────────────────────────────┘
```

#### 2. Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ 🏠 Dashboard    📊 Tax Reports    💰 Payments    💬 Help│
├─────────────────────────────────────────────────────────┤
│ Welcome, PT Example Indonesia 👋                        │
│ Your Tax Consultant: Angel (angel@balizero.com)        │
│                                                         │
│ ⚠️  UPCOMING PAYMENT                                     │
│ ┌─────────────────────────────────────────────┐       │
│ │ PPh 25 - November 2024                      │       │
│ │ Amount: Rp 3,333,333                        │       │
│ │ Due: November 10, 2024 (5 days)            │       │
│ │ [View Details] [Download e-SPT]            │       │
│ └─────────────────────────────────────────────┘       │
│                                                         │
│ 📊 RECENT TAX REPORTS                                   │
│ ├─ Q4 2024 - Rp 40,000,000 (Filed)                    │
│ ├─ Q3 2024 - Rp 38,500,000 (Paid)                     │
│ └─ Q2 2024 - Rp 36,200,000 (Paid)                     │
│                                                         │
│ 💰 2024 SUMMARY                                         │
│ ├─ Total Tax Paid: Rp 154,700,000                     │
│ ├─ Payments Made: 12/12                                │
│ └─ On-time Rate: 100%                                  │
│                                                         │
│ 💬 Have questions? [Chat with ZANTARA AI]              │
└─────────────────────────────────────────────────────────┘
```

#### 3. Tax Reports List
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Your Tax Reports                                     │
├─────────────────────────────────────────────────────────┤
│ Filter: [2024 ▼] [All Types ▼]                        │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Q4 2024 - PPh 25                                 │   │
│ │ Calculation Date: Nov 5, 2024                    │   │
│ │ Tax Amount: Rp 40,000,000                        │   │
│ │ Status: ✅ Filed                                 │   │
│ │ e-SPT: SPT-2024-Q4-0001                          │   │
│ │ [Download e-SPT PDF] [View Details]             │   │
│ └──────────────────────────────────────────────────┘   │
│                                                         │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Q3 2024 - PPh 25                                 │   │
│ │ Calculation Date: Aug 5, 2024                    │   │
│ │ Tax Amount: Rp 38,500,000                        │   │
│ │ Status: ✅ Paid                                  │   │
│ │ [Download e-SPT PDF] [View Details]             │   │
│ └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 4. ZANTARA Chat
```
┌─────────────────────────────────────────────────────────┐
│ 💬 Chat with ZANTARA AI                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🤖 ZANTARA: Hi PT Example! I'm here to help with       │
│            your tax questions. I have access to your    │
│            tax history and Indonesian tax regulations.  │
│                                                         │
│ 👤 You: When is my next payment due?                    │
│                                                         │
│ 🤖 ZANTARA: Your next PPh 25 payment of Rp 3,333,333   │
│            is due on November 10, 2024 - that's in      │
│            5 days. Would you like me to send you a      │
│            reminder?                                    │
│                                                         │
│ 👤 You: Yes please. Also, can I get a deduction for    │
│         employee training costs?                        │
│                                                         │
│ 🤖 ZANTARA: Yes! Employee training costs are           │
│            deductible as operating expenses under       │
│            Indonesian tax law (UU 36/2008). For your    │
│            company (KBLI 46391), you can also consider  │
│            the super deduction for vocational training  │
│            which provides an additional 200% deduction. │
│            Would you like me to explain the             │
│            requirements?                                │
│                                                         │
│ ┌─────────────────────────────────────────────┐       │
│ │ Type your question...                       │       │
│ │ [_________________________________] [Send]  │       │
│ └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Portal API Endpoints

```typescript
// Client-specific endpoints (authenticated via OTP)

GET /api/portal/dashboard/:company_id
// Returns: summary, upcoming payments, recent reports

GET /api/portal/calculations/:company_id
// Returns: list of calculations with basic info (no detailed breakdown)

GET /api/portal/calculation/:calculation_id
// Returns: single calculation details (public data only)

GET /api/portal/download-espt/:calculation_id
// Returns: Signed URL to download e-SPT PDF (expires in 1 hour)

POST /api/portal/chat
// Chat with ZANTARA with company context

GET /api/portal/payments/:company_id
// Returns: payment history and upcoming
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Setup core infrastructure and team access

#### Week 1
- [ ] Database schema creation
  - [ ] Run all CREATE TABLE statements
  - [ ] Add indexes
  - [ ] Insert tax team members
  - [ ] Insert system configuration
- [ ] Add Monaka to tax team in team.ts
- [ ] Setup database migrations system
- [ ] Create authentication middleware
- [ ] Setup audit trail logging

#### Week 2
- [ ] Company management API endpoints
  - [ ] POST /api/tax/companies
  - [ ] GET /api/tax/companies
  - [ ] GET /api/tax/companies/:id
  - [ ] PUT /api/tax/companies/:id
- [ ] Basic GitHub Spark UI setup
  - [ ] Authentication flow
  - [ ] Dashboard layout
  - [ ] Company list screen
  - [ ] Company profile screen
- [ ] Testing with 2 test companies

**Deliverable:** Team can log in, create companies, view profiles

---

### Phase 2: Jurnal.id Integration (Weeks 3-4)

**Goal:** Connect to Jurnal.id and sync financial data

#### Week 3
- [ ] Research Jurnal.id API
  - [ ] Get API documentation
  - [ ] Request test API keys
  - [ ] Test authentication
- [ ] Jurnal integration service
  - [ ] Connection management
  - [ ] Transaction sync
  - [ ] Data mapping
  - [ ] Error handling
- [ ] API endpoints
  - [ ] POST /api/tax/jurnal/connect
  - [ ] POST /api/tax/jurnal/sync
  - [ ] GET /api/tax/jurnal/sync-status

#### Week 4
- [ ] Financial summaries
  - [ ] Aggregate Jurnal data
  - [ ] Store in financial_summaries
  - [ ] Handle manual adjustments
- [ ] UI for Jurnal integration
  - [ ] Connection setup screen
  - [ ] Sync status display
  - [ ] Financial summary view
- [ ] Test with 1 real client's Jurnal.id account

**Deliverable:** Can connect to Jurnal.id and import financial data

---

### Phase 3: Tax Calculation Engine (Weeks 5-6)

**Goal:** Core tax calculation functionality

#### Week 5
- [ ] Tax calculation logic
  - [ ] PPh 25 calculation
  - [ ] PPh 29 calculation
  - [ ] Tax rate determination
  - [ ] Incentives application
  - [ ] PTKP for PPh 21 (personal)
- [ ] API endpoints
  - [ ] POST /api/tax/calculate
  - [ ] GET /api/tax/calculations
  - [ ] PUT /api/tax/calculations/:id
- [ ] Calculation validation

#### Week 6
- [ ] Tax calculator UI
  - [ ] Multi-step form
  - [ ] Auto-import from Jurnal
  - [ ] Manual data entry
  - [ ] Calculation result display
  - [ ] Detailed breakdown
- [ ] Approval workflow
  - [ ] Submit for review
  - [ ] Manager approval screen
  - [ ] Status tracking
- [ ] Test calculations with real data

**Deliverable:** Can calculate taxes end-to-end

---

### Phase 4: ZANTARA Integration (Week 7)

**Goal:** AI-powered tax insights

- [ ] ZANTARA query service
  - [ ] Integration with RAG backend
  - [ ] Query builder
  - [ ] Response parsing
- [ ] Insights in calculator
  - [ ] Eligible incentives check
  - [ ] Regulation references
  - [ ] Recommendations
- [ ] UI for ZANTARA insights
  - [ ] Insight panel in calculator
  - [ ] Detailed view modal
  - [ ] Reference links
- [ ] Test accuracy of recommendations

**Deliverable:** ZANTARA provides relevant tax insights

---

### Phase 5: Portal & Client Access (Weeks 8-9)

**Goal:** Client portal for self-service

#### Week 8
- [ ] Portal sync system
  - [ ] Data preparation
  - [ ] portal_sync_data table population
  - [ ] Sync API endpoints
- [ ] Client notifications
  - [ ] Email service
  - [ ] Notification templates
  - [ ] Send on portal sync

#### Week 9
- [ ] my.balizero.com frontend
  - [ ] Cloudflare Pages setup
  - [ ] OTP authentication
  - [ ] Dashboard
  - [ ] Tax reports view
  - [ ] e-SPT download
- [ ] Portal API endpoints
- [ ] ZANTARA personalized chat
- [ ] Test with pilot clients

**Deliverable:** Clients can access their tax info online

---

### Phase 6: RAG Intelligence Feed (Week 10)

**Goal:** Feed data back to ZANTARA for learning

- [ ] Intelligence feed system
  - [ ] Data anonymization
  - [ ] rag_intelligence_feed population
  - [ ] Batch sync to ZANTARA
- [ ] Client interaction tracking
  - [ ] Chat topics
  - [ ] Common questions
  - [ ] Preferences
- [ ] Business intelligence extraction
  - [ ] Industry benchmarks
  - [ ] Pattern recognition
- [ ] Test personalization improvements

**Deliverable:** ZANTARA learns from client interactions

---

### Phase 7: Invoicing & Payments (Week 11)

**Goal:** Complete business workflow

- [ ] Invoicing system
  - [ ] Invoice creation
  - [ ] Templates
  - [ ] PDF generation
- [ ] Payment tracking
  - [ ] Record payments
  - [ ] Payment reminders
  - [ ] Overdue alerts
- [ ] UI for invoicing
  - [ ] Create invoice screen
  - [ ] Invoice list
  - [ ] Payment recording
- [ ] Integration with calculations

**Deliverable:** Full client lifecycle management

---

### Phase 8: Polish & Production (Week 12)

**Goal:** Production-ready system

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Training for tax team
- [ ] Production deployment
- [ ] Monitoring setup

**Deliverable:** Live production system

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Example: Tax calculation logic
describe('Corporate Tax Calculation', () => {
  it('should calculate standard 22% rate correctly', () => {
    const result = calculateCorporateTax({
      taxable_income: 100000000,
      company_type: 'PT',
      public_ownership: 0
    });
    expect(result.tax_rate).toBe(22);
    expect(result.gross_tax).toBe(22000000);
  });

  it('should apply MSME rate for small businesses', () => {
    const result = calculateCorporateTax({
      taxable_income: 4000000000, // 4B
      company_type: 'PT',
      annual_revenue: 4500000000 // < 4.8B threshold
    });
    expect(result.tax_rate).toBe(0.5); // Simplified rate
  });

  it('should apply investment allowance incentive', () => {
    const result = calculateCorporateTax({
      taxable_income: 100000000,
      incentives: [{
        type: 'investment_allowance',
        percentage: 30
      }]
    });
    expect(result.gross_tax).toBe(22000000);
    expect(result.tax_after_incentives).toBe(15400000); // 30% reduction
  });
});
```

### Integration Tests

```typescript
// Example: Jurnal.id integration
describe('Jurnal Integration', () => {
  it('should connect to Jurnal.id successfully', async () => {
    const result = await jurnalService.connect(companyId, {
      jurnal_company_id: 'test123',
      api_key: 'test_key'
    });
    expect(result.status).toBe('active');
  });

  it('should sync transactions and aggregate correctly', async () => {
    const result = await jurnalService.syncFinancialData(
      companyId,
      new Date('2024-10-01'),
      new Date('2024-12-31')
    );
    expect(result.revenue_total).toBeGreaterThan(0);
    expect(result.expense_total).toBeGreaterThan(0);
  });
});
```

### End-to-End Tests (Playwright)

```typescript
// Example: Complete tax calculation workflow
test('Complete tax calculation workflow', async ({ page }) => {
  // Login
  await page.goto('https://tax-platform.balizero.com');
  await page.fill('[name="email"]', 'angel@balizero.com');
  await page.fill('[name="password"]', 'test_password');
  await page.click('button[type="submit"]');

  // Select company
  await page.click('text=PT Example Indonesia');

  // Start new calculation
  await page.click('button:has-text("Calculate Tax")');

  // Fill form
  await page.selectOption('[name="calculation_type"]', 'PPH_25');
  await page.selectOption('[name="fiscal_year"]', '2024');
  await page.selectOption('[name="period"]', 'Q4');

  // Import from Jurnal
  await page.check('[name="auto_import_jurnal"]');
  await page.click('button:has-text("Next Step")');

  // Wait for sync
  await page.waitForSelector('text=Sync successful');

  // Review and calculate
  await page.click('button:has-text("Calculate Tax")');

  // Verify result
  await expect(page.locator('text=Net Tax Payable')).toBeVisible();
  await expect(page.locator('[data-testid="net-tax"]')).toContainText('Rp');

  // Save calculation
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Calculation saved')).toBeVisible();
});
```

### Test Data

```sql
-- Create test companies
INSERT INTO companies (company_name, npwp, email, kbli_code, assigned_consultant_id) VALUES
  ('PT Test Company 1', '11.111.111.1-111.000', 'test1@example.com', '46391', (SELECT id FROM tax_consultants WHERE email = 'angel@balizero.com')),
  ('PT Test Company 2', '22.222.222.2-222.000', 'test2@example.com', '62010', (SELECT id FROM tax_consultants WHERE email = 'kadek@balizero.com')),
  ('CV Test Company 3', '33.333.333.3-333.000', 'test3@example.com', '70209', (SELECT id FROM tax_consultants WHERE email = 'dewaayu@balizero.com'));
```

### Testing Checklist

#### Functional Testing
- [ ] User authentication and authorization
- [ ] Company CRUD operations
- [ ] Jurnal.id connection and sync
- [ ] Tax calculation (all types)
- [ ] Incentives application
- [ ] Approval workflow
- [ ] e-SPT generation
- [ ] Portal sync
- [ ] Client portal access
- [ ] ZANTARA integration
- [ ] Invoicing
- [ ] Payment tracking

#### Security Testing
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts
- [ ] Sensitive data exposure
- [ ] Rate limiting
- [ ] Input validation

#### Performance Testing
- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Large dataset handling (1000+ companies)
- [ ] Concurrent user testing (10+ users)
- [ ] Database query optimization

#### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS/Android)

---

## 🚀 Deployment Plan

### Infrastructure

```yaml
# Existing Fly.io setup
apps:
  - name: nuzantara-backend
    region: sin (Singapore)
    instances: 2
    resources:
      memory: 512MB
      cpu: shared-cpu-1x

  - name: nuzantara-postgres
    region: sin
    storage: 10GB
    encrypted: true

  - name: nuzantara-rag
    region: sin
    instances: 1
```

### Database Migration

```bash
# Migration script
# File: migrations/001_create_tax_platform_tables.sql

-- Run on production database
psql $DATABASE_URL -f migrations/001_create_tax_platform_tables.sql

# Verify migration
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'tax_%';"
```

### Deployment Steps

#### 1. Backend Deployment

```bash
# 1. Update code
git checkout main
git pull origin main

# 2. Install dependencies
cd apps/backend-ts
npm install

# 3. Run migrations
npm run migrate

# 4. Build
npm run build

# 5. Deploy to Fly.io
fly deploy --app nuzantara-backend

# 6. Verify deployment
curl https://nuzantara-backend.fly.dev/health
curl https://nuzantara-backend.fly.dev/api/tax/health
```

#### 2. Frontend Deployment (GitHub Spark)

```bash
# GitHub Spark apps are auto-deployed
# Just push to main branch and Spark handles deployment

git add .
git commit -m "Deploy tax platform UI"
git push origin main

# Get Spark app URL from GitHub
```

#### 3. Portal Deployment (my.balizero.com)

```bash
# Cloudflare Pages deployment
cd portal
npm run build

# Deploy to Cloudflare Pages
wrangler pages publish ./out --project-name=balizero-portal

# Configure custom domain
# In Cloudflare Dashboard: Pages → balizero-portal → Custom domains
# Add: my.balizero.com
```

### Environment Variables

```bash
# Production environment variables
# Add to Fly.io secrets

fly secrets set DATABASE_URL="postgresql://..." --app nuzantara-backend
fly secrets set ENCRYPTION_KEY="..." --app nuzantara-backend
fly secrets set JWT_SECRET="..." --app nuzantara-backend
fly secrets set JURNAL_API_BASE_URL="https://api.jurnal.id/v1" --app nuzantara-backend
fly secrets set RAG_BACKEND_URL="https://nuzantara-rag.fly.dev" --app nuzantara-backend
fly secrets set SMTP_HOST="smtp.gmail.com" --app nuzantara-backend
fly secrets set SMTP_USER="..." --app nuzantara-backend
fly secrets set SMTP_PASSWORD="..." --app nuzantara-backend
```

### Monitoring

```typescript
// Setup monitoring with existing Prometheus/Grafana

// Add custom metrics
import { register, Counter, Histogram } from 'prom-client';

const taxCalculationsCounter = new Counter({
  name: 'tax_calculations_total',
  help: 'Total tax calculations performed',
  labelNames: ['calculation_type', 'consultant']
});

const calculationDuration = new Histogram({
  name: 'tax_calculation_duration_seconds',
  help: 'Duration of tax calculations',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Track in code
taxCalculationsCounter.inc({ calculation_type: 'PPH_25', consultant: 'angel' });
```

### Rollback Plan

```bash
# If deployment fails, rollback

# 1. Rollback backend
fly releases --app nuzantara-backend
fly releases rollback v123 --app nuzantara-backend

# 2. Rollback database (if needed)
psql $DATABASE_URL -f migrations/rollback/001_rollback.sql

# 3. Notify team
# Send alert to Slack/email
```

---

## 📊 Success Metrics

### Key Performance Indicators (KPIs)

#### Efficiency Metrics
- **Time to Complete Calculation**
  - Baseline (manual): 2 hours
  - Target: 15 minutes
  - Improvement: 88% reduction

- **Calculations per Consultant per Day**
  - Baseline: 2-3 calculations
  - Target: 8-10 calculations
  - Improvement: 300% increase

- **Approval Turnaround Time**
  - Baseline: 1-2 days
  - Target: 2 hours
  - Improvement: 90% reduction

#### Quality Metrics
- **Calculation Accuracy**
  - Target: 100% (verified by ZANTARA)
  - Measure: Number of corrections needed

- **Compliance Rate**
  - Target: 100% of calculations compliant
  - Measure: Audit findings

- **Client Satisfaction**
  - Target: 4.5/5 stars
  - Measure: Portal feedback ratings

#### Adoption Metrics
- **Active Users**
  - Target: 5/5 tax team members
  - Measure: Daily active users

- **Clients on Portal**
  - Target: 80% of clients (36/45)
  - Measure: Portal registrations

- **Jurnal.id Integrations**
  - Target: 70% of clients (32/45)
  - Measure: Active connections

#### Business Metrics
- **Revenue Impact**
  - Target: +30% tax service revenue
  - Measure: Invoices issued

- **Client Retention**
  - Target: 95% retention
  - Measure: Client churn rate

- **New Client Acquisition**
  - Target: +20% new clients
  - Measure: New company profiles

### Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ BALI ZERO TAX PLATFORM - METRICS DASHBOARD             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ TODAY                                                   │
│ ├─ Calculations Completed: 12                          │
│ ├─ Average Duration: 14 minutes                        │
│ ├─ Approvals Pending: 3                                │
│ └─ Portal Logins: 15                                   │
│                                                         │
│ THIS MONTH                                              │
│ ├─ Total Calculations: 180                             │
│ ├─ Tax Managed: Rp 5,280,000,000                       │
│ ├─ Invoices Issued: 45                                 │
│ ├─ Revenue: Rp 225,000,000                             │
│ └─ ZANTARA Queries: 450                                │
│                                                         │
│ SYSTEM HEALTH                                           │
│ ├─ Uptime: 99.9%                                       │
│ ├─ Avg Response Time: 245ms                            │
│ ├─ Jurnal Sync Success Rate: 98.5%                    │
│ └─ ZANTARA Accuracy: 94%                               │
│                                                         │
│ CLIENT PORTAL                                           │
│ ├─ Active Users: 36/45 (80%)                           │
│ ├─ Satisfaction: 4.7/5 ⭐                              │
│ └─ Support Tickets: 2 (low)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Training & Documentation

### Training Plan

#### Week 1: Team Training
- **Day 1-2:** System overview and demo
- **Day 3:** Hands-on: Company management
- **Day 4:** Hands-on: Tax calculations
- **Day 5:** Hands-on: Portal and client management

#### Week 2: Pilot Phase
- Each consultant tests with 1 real client
- Daily check-ins and feedback
- Bug fixes and improvements

### Documentation

#### For Tax Team
- [ ] User manual with screenshots
- [ ] Video tutorials (5-10 minutes each)
- [ ] Quick reference guide
- [ ] Troubleshooting FAQ
- [ ] Jurnal.id integration guide

#### For Clients
- [ ] Portal user guide
- [ ] How to access your tax reports
- [ ] Understanding your e-SPT
- [ ] Chat with ZANTARA guide

#### Technical Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Monitoring and alerting setup

---

## 🎯 Conclusion

This technical specification provides a complete blueprint for the Bali Zero Tax Platform. The system will:

1. **Streamline Operations:** Reduce tax calculation time by 88%
2. **Ensure Accuracy:** 100% calculation accuracy with ZANTARA validation
3. **Empower Clients:** Self-service portal for 24/7 access
4. **Drive Intelligence:** Feed business intelligence to ZANTARA
5. **Scale Business:** Support 300% increase in client capacity

### Next Steps

1. **Stakeholder Review:** Review this spec with Veronika and team
2. **Approve & Sign-off:** Get formal approval to proceed
3. **Resource Allocation:** Confirm timeline and resources
4. **Kickoff:** Start Phase 1 implementation

### Questions to Resolve

1. Jurnal.id API access - need to contact them?
2. my.balizero.com domain - already registered on Cloudflare?
3. Training schedule - best dates for team?
4. Pilot clients - which 5 clients to start with?
5. Budget - any licensing costs (Jurnal API, etc.)?

---

**Document Status:** READY FOR REVIEW
**Next Action:** Stakeholder review and approval
**Estimated Start Date:** TBD
**Estimated Completion:** 12 weeks from kickoff

---

*End of Technical Specification*
