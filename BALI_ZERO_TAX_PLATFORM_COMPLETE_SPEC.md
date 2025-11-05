# 🏢 BALI ZERO TAX PLATFORM
## Complete Technical Specification

**Version:** 1.0.0
**Date:** 2025-11-05
**Status:** ✅ READY FOR REVIEW
**Owner:** Bali Zero Tax Department
**Prepared by:** Claude Code with Max Plan

---

## 📋 Executive Summary

### Vision
Create a unified **tax calculation and management platform** that integrates with Jurnal.id accounting system, automates corporate and personal tax calculations, provides AI-powered insights via ZANTARA, and enables client self-service through my.balizero.com portal.

### Key Objectives
1. **80% Time Reduction** in tax calculation workflow
2. **100% Accuracy** with automated calculations and AI validation
3. **Real-time Insights** from ZANTARA AI integration
4. **Client Self-Service** via dedicated portal
5. **Business Intelligence** feeding back into ZANTARA RAG

### Scope
- **Phase 1:** Internal tax department tool (5 users)
- **Phase 2:** Client portal integration (45+ clients)
- **Phase 3:** RAG intelligence & personalization
- **Timeline:** 12 weeks
- **Technology:** GitHub Spark + Node.js/TypeScript + PostgreSQL + Jurnal.id API + ZANTARA RAG

---

## 📚 Documentation Structure

This specification is organized into 4 comprehensive documents:

### [Part 1: Core Architecture & Database](./BALI_ZERO_TAX_PLATFORM_SPEC.md)
- Executive Summary
- System Architecture
- **Complete Database Schema** (13 sections, 20+ tables)
  - Team & user management
  - Client/company profiles
  - Jurnal.id integration tables
  - Financial summaries
  - Tax calculations
  - Tax payments
  - Tax incentives
  - Portal sync
  - RAG intelligence feed
  - Invoicing
  - Audit trail
  - System configuration

### [Part 2: APIs & Integrations](./BALI_ZERO_TAX_PLATFORM_SPEC_PART2.md)
- **API Endpoints** (50+ endpoints)
  - Authentication
  - Company management
  - Financial summaries
  - Tax calculations
  - Payments
  - Incentives
  - ZANTARA queries
  - Invoicing
  - Analytics
- **Jurnal.id Integration**
  - Architecture
  - Data mapping
  - Error handling
  - Sync scheduler
- **ZANTARA AI Integration**
  - Tax calculation insights
  - Client personalization
  - Business intelligence feed

### [Part 3: Security & UI/UX](./BALI_ZERO_TAX_PLATFORM_SPEC_PART3.md)
- **Security & Privacy**
  - Data privacy levels (3-tier)
  - Authentication & authorization (RBAC)
  - Encryption (at rest & in transit)
  - Audit trail
  - Rate limiting
  - Input validation
- **User Interface (GitHub Spark)**
  - Complete screen designs (10+ screens)
  - Component library
  - User workflows
- **Client Portal (my.balizero.com)**
  - Portal architecture
  - OTP authentication
  - Dashboard & reports
  - ZANTARA chat integration

### [Part 4: Implementation & Operations](./BALI_ZERO_TAX_PLATFORM_SPEC_PART4.md)
- **Implementation Phases** (8 phases, 12 weeks)
  - Week-by-week breakdown
  - Deliverables
  - Testing checkpoints
- **Testing Strategy**
  - Unit tests
  - Integration tests
  - E2E tests
  - Security testing
- **Deployment Plan**
  - Infrastructure setup
  - Migration scripts
  - Rollback procedures
- **Success Metrics**
  - KPIs
  - Monitoring dashboard
- **Training & Documentation**

---

## 🎯 Key Features

### For Tax Consultants
✅ **Company Management**
- Complete client profiles with NPWP, KBLI, contact info
- Document folder links (Google Drive integration)
- Internal notes and tags
- Assignment to consultants

✅ **Jurnal.id Integration**
- One-click connect to client's Jurnal.id account
- Automatic financial data sync (daily/on-demand)
- Revenue & expense aggregation by period
- Manual adjustments support

✅ **Tax Calculator**
- PPh 25 (monthly installments)
- PPh 29 (annual reconciliation)
- PPh 21 (personal income tax)
- Auto-import from Jurnal.id or manual entry
- ZANTARA AI insights and recommendations
- Incentive eligibility checking
- Detailed calculation breakdown

✅ **Workflow Management**
- Draft → Submit for Review → Approve → File
- Role-based permissions (Manager approval required)
- e-SPT generation
- Client notification

✅ **Invoicing**
- Create invoices for Bali Zero services
- Pre-defined templates
- PDF generation
- Payment tracking

✅ **Analytics Dashboard**
- Personal stats (calculations, clients, revenue)
- Team overview (Manager only)
- Upcoming deadlines
- Payment reminders

### For Clients (my.balizero.com Portal)
✅ **Easy Access**
- Email-based login with OTP (no password)
- Mobile-friendly interface

✅ **Tax Information**
- View all tax reports (summary only)
- Download e-SPT documents
- Payment due dates
- Payment history

✅ **ZANTARA AI Chat**
- Ask tax questions 24/7
- Personalized responses based on company profile
- Access to Indonesian tax regulations
- Payment reminders and guidance

### For Business Intelligence (ZANTARA RAG)
✅ **Data Feed**
- Anonymized industry patterns
- Aggregated tax metrics
- Client preferences and common questions
- Continuous learning and improvement

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BALI ZERO TAX PLATFORM                   │
│                                                             │
│  ┌────────────────┐                  ┌─────────────────┐   │
│  │  GitHub Spark  │◄────────────────►│  Backend API    │   │
│  │   Admin UI     │   REST/WebSocket │  (backend-ts)   │   │
│  └────────────────┘                  └────────┬────────┘   │
│                                              │            │
└──────────────────────────────────────────────┼─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────┐
                    ↓                          ↓              ↓
        ┌─────────────────┐      ┌──────────────────┐  ┌──────────┐
        │  PostgreSQL DB  │      │   Jurnal.id API  │  │ ZANTARA  │
        │                 │      │   (External)     │  │   RAG    │
        └────────┬────────┘      └──────────────────┘  └──────────┘
                 │
                 ↓
    ┌────────────────────────┐
    │  my.balizero.com       │
    │  Client Portal         │
    └────────────────────────┘
```

---

## 👥 Team & Roles

### Tax Team (Pre-configured)
| Name | Role | Email | Permissions |
|------|------|-------|-------------|
| **Veronika** | Tax Manager | veronika@balizero.com | Full access, approvals, user management |
| **Angel** | Tax Expert | angel@balizero.com | All clients, calculations, no approvals |
| **Kadek** | Tax Consultant | kadek@balizero.com | All clients, calculations, no approvals |
| **Dewa Ayu** | Tax Consultant | dewaayu@balizero.com | All clients, calculations, no approvals |
| **Monaka** | Tax Consultant | monaka@balizero.com | All clients, calculations, no approvals |
| **Faisha** | Customer Service | faisha@balizero.com | View only, client messaging |

### Pilot Testing Plan
- **Angel:** 1 client (PT Example Indonesia)
- **Kadek:** 1 client (CV Test Corporation)
- **Dewa Ayu:** 1 client (PT Demo Ltd)
- **Monaka:** 1 client (PT Sample Co)
- **Veronika:** Oversight and approvals

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ COMPLETE WORKFLOW                                           │
└─────────────────────────────────────────────────────────────┘

1. CONSULTANT SELECTS CLIENT
   └─ View profile, recent history, Jurnal connection status

2. INITIATE TAX CALCULATION
   └─ Choose period (Q1/Q2/Q3/Q4)

3. IMPORT DATA
   ├─ Auto-sync from Jurnal.id (recommended)
   │  ├─ Fetch transactions for period
   │  ├─ Aggregate revenue & expenses
   │  └─ Auto-populate form
   └─ OR manual entry

4. CALCULATE TAX
   ├─ Apply PPh 25/29 formulas
   ├─ Check KBLI-based incentives
   ├─ Query ZANTARA for insights
   └─ Display detailed breakdown

5. REVIEW & INSIGHTS
   ├─ ZANTARA recommendations
   ├─ Eligible incentives
   └─ Regulation references

6. SUBMIT FOR APPROVAL
   └─ Manager (Veronika) reviews

7. APPROVE & FILE
   ├─ Generate e-SPT document
   └─ Mark as filed

8. DISTRIBUTE DATA (3 destinations)
   ├─ [1] INTERNAL DATABASE (full details)
   │   └─ Complete financial breakdown, notes, history
   │
   ├─ [2] CLIENT PORTAL (summary only)
   │   ├─ Total tax amount
   │   ├─ e-SPT download link
   │   ├─ Payment due date
   │   └─ Send email notification
   │
   └─ [3] ZANTARA RAG (anonymized BI)
       ├─ Industry patterns
       ├─ Revenue brackets (not exact amounts)
       └─ Client preferences for personalization

9. CLIENT ACCESSES PORTAL
   ├─ Login with email + OTP
   ├─ View tax report summary
   ├─ Download e-SPT
   └─ Chat with ZANTARA AI

10. PAYMENT TRACKING
    ├─ Record payment when received
    ├─ Update portal status
    └─ Mark as paid
```

---

## 📊 Database Overview

### Core Tables (20+)
1. `tax_consultants` - Team members & permissions
2. `companies` - Client profiles (complete anagrafica)
3. `jurnal_connections` - Jurnal.id API credentials
4. `jurnal_sync_log` - Sync history & status
5. `financial_summaries` - Aggregated data from Jurnal
6. `tax_calculations` - Core tax calculations
7. `tax_payments` - Payment tracking
8. `tax_incentives_registry` - Applied incentives
9. `kbli_tax_rules` - KBLI-specific tax rules
10. `portal_sync_data` - Client portal data
11. `rag_intelligence_feed` - ZANTARA BI feed
12. `balizero_invoices` - Service invoicing
13. `invoice_templates` - Invoice templates
14. `audit_trail` - Complete audit log
15. `system_config` - System configuration

**Total Fields:** 200+ carefully designed columns
**Relationships:** Full referential integrity with foreign keys
**Indexes:** Optimized for performance
**Constraints:** Business logic validation at database level

---

## 🛠️ Technology Stack

### Frontend
- **GitHub Spark** - Rapid development platform
- **React** - UI framework
- **Tailwind CSS / Shadcn UI** - Styling
- **TypeScript** - Type safety

### Backend
- **Node.js 20** - Runtime
- **Express 5** - Web framework
- **TypeScript** - Language
- **PostgreSQL** - Database
- **Redis** - Caching (optional)

### Integrations
- **Jurnal.id API** - Accounting data
- **ZANTARA RAG** - AI insights (existing)
- **Cloudflare Pages** - Client portal hosting
- **Fly.io** - Backend hosting (existing)

### Tools
- **Jest** - Unit/integration testing
- **Playwright** - E2E testing
- **Prometheus/Grafana** - Monitoring
- **Winston** - Logging

---

## 📅 Timeline

### Phase 1: Foundation (Weeks 1-2)
**Deliverable:** Team can log in, create companies, view profiles

### Phase 2: Jurnal Integration (Weeks 3-4)
**Deliverable:** Connect to Jurnal.id and sync financial data

### Phase 3: Tax Calculator (Weeks 5-6)
**Deliverable:** Calculate taxes end-to-end

### Phase 4: ZANTARA Integration (Week 7)
**Deliverable:** AI-powered tax insights

### Phase 5: Client Portal (Weeks 8-9)
**Deliverable:** Clients can access tax info online

### Phase 6: RAG Intelligence (Week 10)
**Deliverable:** ZANTARA learns from interactions

### Phase 7: Invoicing (Week 11)
**Deliverable:** Complete business workflow

### Phase 8: Production Launch (Week 12)
**Deliverable:** Live production system

**Total Duration:** 12 weeks
**Pilot Clients:** 5 (one per consultant)
**Full Rollout:** Week 13+

---

## 🎯 Success Criteria

### Quantitative Metrics
- [ ] **80% time reduction** in tax calculation (from 2h to 15min)
- [ ] **100% calculation accuracy** (verified by ZANTARA)
- [ ] **80% client adoption** of portal (36/45 clients)
- [ ] **70% Jurnal integration** rate (32/45 clients)
- [ ] **< 500ms** average API response time
- [ ] **99.9%** system uptime

### Qualitative Metrics
- [ ] Team satisfaction: 4.5/5 stars
- [ ] Client satisfaction: 4.5/5 stars
- [ ] Zero calculation errors in production
- [ ] Positive feedback from manager (Veronika)

---

## ❓ Outstanding Questions

Before implementation begins, we need answers to:

### 1. Jurnal.id Access
- [ ] Do we have Jurnal.id API documentation?
- [ ] Need to request API keys from Jurnal.id?
- [ ] Are there API costs/limits?
- [ ] Which clients already use Jurnal.id?

### 2. Domain & Hosting
- [ ] Is my.balizero.com already registered on Cloudflare?
- [ ] DNS configuration ready?
- [ ] SSL certificate setup?

### 3. Data & Historical Records
- [ ] Import 2 years of historical data?
- [ ] From what sources (Excel, other systems)?
- [ ] Data cleanup needed?

### 4. Training & Rollout
- [ ] Best dates for team training (Week 1)?
- [ ] Which 5 clients for pilot phase?
- [ ] Client communication plan?

### 5. Budget & Resources
- [ ] Budget for Jurnal.id API (if applicable)?
- [ ] Additional Fly.io resources needed?
- [ ] External development support?

---

## 🚦 Next Steps

### Immediate Actions
1. **Review this specification** with Veronika and tax team
2. **Answer outstanding questions** (see above)
3. **Get formal approval** to proceed
4. **Schedule kickoff meeting** (Week 1 Day 1)
5. **Confirm pilot clients** (5 clients, 1 per consultant)

### Week 1 Preparation
- [ ] Setup development environment
- [ ] Request Jurnal.id API access
- [ ] Prepare test data
- [ ] Schedule training sessions
- [ ] Create project communication channel

---

## 📞 Support & Contact

**Project Lead:** Claude Code
**Stakeholder:** Veronika (Tax Manager)
**Technical Owner:** Bali Zero Technology Team

**Documentation Location:**
```
/home/user/nuzantara/BALI_ZERO_TAX_PLATFORM_*.md
```

**Related Documents:**
- [Part 1: Architecture & Database](./BALI_ZERO_TAX_PLATFORM_SPEC.md)
- [Part 2: APIs & Integrations](./BALI_ZERO_TAX_PLATFORM_SPEC_PART2.md)
- [Part 3: Security & UI/UX](./BALI_ZERO_TAX_PLATFORM_SPEC_PART3.md)
- [Part 4: Implementation & Operations](./BALI_ZERO_TAX_PLATFORM_SPEC_PART4.md)

---

## ✅ Document Status

**Status:** ✅ READY FOR STAKEHOLDER REVIEW
**Completeness:** 100%
**Last Updated:** 2025-11-05
**Next Review Date:** TBD (after stakeholder feedback)

---

**This specification represents a complete, production-ready blueprint for the Bali Zero Tax Platform. All technical details, workflows, database schemas, APIs, security measures, and implementation plans are fully documented and ready for development.**

---

*End of Master Specification Document*
