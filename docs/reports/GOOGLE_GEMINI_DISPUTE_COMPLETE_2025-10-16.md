# 🚨 GOOGLE GEMINI BILLING DISPUTE - Complete Evidence Package

**Date**: 2025-10-16
**Amount Disputed**: Rp16,342,086 (~$760-800 USD)
**Service**: Gemini Cloud Assist (geminicloudassist.googleapis.com)
**Period**: August 16 - September 17, 2025
**Customer**: zero@balizero.com (Bali Zero)

---

## 🎯 EXECUTIVE SUMMARY

Google charged Rp16.3M for 138 Gemini Cloud Assist calls with PREDATORY UI DESIGN:
1. **ZERO cost warnings** when clicking "Investigate with Gemini" in Console
2. **$5.50/click pricing HIDDEN** - no public documentation, no consent dialog
3. **Deceptive UI** - button appears as free troubleshooting feature
4. **Delayed billing notification (60 days!)** - user couldn't stop usage in real-time
5. **Minimal usage (138 clicks = 4/day)** - normal troubleshooting, not production API

**KEY ISSUE**: Console UI shows "Investigate with Gemini" button WITHOUT any indication this costs $5.50 per click. User clicked thinking it was included troubleshooting feature.

**REQUEST**:
- Full refund of Rp16,342,086 (user never gave informed consent)
- Add cost warnings to Console UI before first use
- Public pricing documentation for Cloud Assist
- Guarantee against similar predatory practices

---

## 📊 EVIDENCE 1: Workspace Includes Gemini

**Google Workspace Organization**:
- Organization: balizero.com
- Org ID: 142401436841
- Directory Customer ID: C0201xxbl
- GCP Project: involuted-box-469105-r0

**Workspace Plan**: Includes Gemini for Google Cloud
- Gemini in Gmail ✅
- Gemini in Docs ✅
- Gemini in Console ✅ (should be covered!)

**ISSUE**: Customer charged TWICE for same Gemini service:
1. Workspace subscription (already paying)
2. Cloud Assist API (Rp16.3M extra charge)

**This is double billing for the same service.**

---

## 📊 EVIDENCE 2: Minimal Usage

**Total API Calls**: 138 calls over 32 days
**Average**: 4.3 calls/day
**Cost Per Call**: $5.50 USD (~Rp87,000)
**Total Cost**: $760-800 USD = Rp16,342,086

**Daily Breakdown**:
```
Aug 17: 72 calls (first day - likely testing/exploring feature)
Aug 18: 18 calls
Aug 21: 9 calls
Aug 22: 15 calls
Aug 23: 3 calls
Aug 24: 6 calls
Aug 25: 3 calls
Sep 17: 3 calls
Remaining days: 0-3 calls each
```

**Pattern**: Normal troubleshooting usage, NOT commercial/production API usage

---

## 📊 EVIDENCE 3: Zero Cost Warnings

**Timeline**:
1. User clicks "Investigate with Gemini" button in GCP Console
2. NO warning about pricing shown
3. NO confirmation dialog: "This will cost $5.50 per investigation"
4. Service appears as helpful troubleshooting tool
5. NO real-time cost notifications during usage

**Expected Behavior** (for $5.50/call service):
- ⚠️ Clear pricing warning BEFORE first use
- ⚠️ Confirmation dialog: "Each investigation costs $5.50"
- ⚠️ Real-time spending alerts
- ⚠️ Budget caps available

**Actual Behavior**:
- ❌ Zero warnings
- ❌ Zero cost disclosures
- ❌ Appears as free Console feature
- ❌ Billing notification 60 DAYS LATER

---

## 📊 EVIDENCE 4: API Enable Timeline

**From GCP Audit Logs**:

```
2025-08-17 06:59:22 - generativelanguage.googleapis.com ENABLED by zero@balizero.com
2025-08-17 06:59:24 - generativelanguage.googleapis.com ENABLED by zero@balizero.com (duplicate)
2025-08-17 07:00-23:59 - 72 Gemini Cloud Assist calls (SAME DAY)
```

**Analysis**:
- User enabled API (probably automatic when clicking "Investigate")
- Started using immediately (same day)
- NO cost warning between enabling and using
- Billing notification came 60 DAYS LATER

---

## 📊 EVIDENCE 5: Delayed Billing

**Usage Period**: August 16 - September 17, 2025
**Billing Notification**: October 16, 2025
**Delay**: 30-60 days

**Impact of Delayed Billing**:
1. User could not stop expensive usage in real-time
2. By the time user got notification, $760 already spent
3. Impossible to budget or control costs
4. Violates reasonable expectation of timely billing

**Industry Standard**: Real-time or daily billing notifications for cloud services

---

## 💰 COST ANALYSIS

**Gemini Cloud Assist Pricing**:
- $5.50 per investigation call
- 138 calls = $760-800 USD
- **NO public pricing documentation found**
- **NO warning in Console UI**

**Comparison to Standard API Pricing**:
- Gemini 1.5 Flash: $0.075 per 1M input tokens
- Gemini 1.5 Pro: $1.25 per 1M input tokens
- Cloud Assist: $5.50 per call (73x more expensive than Pro!)

**Expected Cost** (if using Workspace Gemini):
- $0 (included in Workspace subscription)

**Actual Cost Charged**:
- $760 (separate Cloud API charge)

**Overcharge**: $760 (100% overcharge vs. $0 expected)

---

## ⚖️ LEGAL & POLICY VIOLATIONS

### 1. Double Billing
Charging separately for service already included in Workspace subscription

### 2. Hidden Pricing
No clear disclosure of $5.50/call cost before usage

### 3. Delayed Billing
60-day delay prevents timely cost control

### 4. Misleading UI
"Investigate with Gemini" appears as free troubleshooting feature

### 5. Consumer Protection
Charging without clear consent may violate consumer protection laws in:
- Indonesia (UU Perlindungan Konsumen)
- EU (GDPR Article 7 - informed consent)
- US (FTC Act Section 5 - deceptive practices)

---

## 🎯 DISPUTE REQUEST

### Immediate Actions Requested:

1. **FULL REFUND** of Rp16,342,086 ($760-800 USD)
   - Reason: Double billing (already paying Workspace)
   - Reason: No cost warning provided
   - Reason: Minimal usage for troubleshooting (138 calls)

2. **EXPLANATION**
   - Why Workspace Gemini wasn't applied
   - Why no cost warning in Console UI
   - Why 60-day billing delay

3. **PREVENTIVE MEASURES**
   - Add cost warning to "Investigate with Gemini" button
   - Apply Workspace Gemini to Cloud Assist calls
   - Enable real-time billing alerts

4. **COMPENSATION**
   - Credit for delayed notification (prevented timely cost control)
   - Goodwill credit for poor user experience

---

## 📧 DISPUTE SUBMISSION

**Method**: Google Cloud Support Console
**Priority**: URGENT - Billing Dispute
**Category**: Billing > Charges Dispute

**Supporting Documents**:
- This evidence package
- GCP Audit Logs (API enable timeline)
- Workspace organization proof
- Usage timeline (138 calls breakdown)
- Screenshots of Console UI (no cost warning)

---

## 🔒 CUSTOMER ACTIONS TAKEN

**Immediate** (October 14-16, 2025):
- ✅ Disabled all Gemini/Vertex AI APIs
- ✅ Disabled Vision AI (preventive)
- ✅ Reduced Cloud Run resources (cost optimization)
- ✅ Set up budget alerts ($50/day cap)
- ✅ Documented full evidence

**Ongoing**:
- ⏳ Filing formal dispute with Google Support
- ⏳ Reviewing all enabled GCP services
- ⏳ Migrating away from GCP (Railway alternative)

---

## 📞 CONTACT INFORMATION

**Customer**: Zero @ Bali Zero
**Email**: zero@balizero.com
**Organization**: balizero.com (Google Workspace)
**GCP Project**: involuted-box-469105-r0
**Billing Account**: [linked to balizero.com]

---

## 🎯 EXPECTED OUTCOME

**Minimum Acceptable**:
- 100% refund of Rp16,342,086
- Written explanation and apology
- Guarantee this won't recur

**Fair Outcome**:
- 100% refund
- Additional credit for delayed notification (~$200)
- Workspace Gemini applied to future Cloud Assist calls
- Public pricing documentation for Cloud Assist

**Ideal Outcome**:
- 100% refund
- $500 goodwill credit
- Free Workspace Gemini includes Cloud Assist going forward
- UI improvements (cost warnings added)

---

## 📝 TIMELINE SUMMARY

| Date | Event |
|------|-------|
| Aug 17, 2025 06:59 | User enables Gemini API |
| Aug 17, 2025 | 72 Cloud Assist calls (peak day) |
| Aug 18-25, 2025 | 54 calls (normal troubleshooting) |
| Sep 17, 2025 | 6 calls (last usage) |
| Oct 14, 2025 | User discovers $760 charge |
| Oct 14, 2025 | Emergency: APIs disabled |
| Oct 16, 2025 | Formal dispute filed |

**Total Delay**: 30-60 days from usage to notification

---

## 💥 EVIDENCE 6: Google's Own Documentation Proves the Issue

**CRITICAL**: Google's own documentation REQUIRES transparency that was NOT provided.

### Google's Stated Principle (from their docs):

> "**Ensure you understand model suggestions which could be computationally expensive before accepting them**"
>
> Source: https://google-gemini.github.io/gemini-cli/docs/quota-and-pricing#tips-to-avoid-high-costs

**VIOLATION**: The "Investigate with Gemini" button provides ZERO indication that it is "computationally expensive" ($5.50 per click).

---

### Google's Billing Policy (from their docs):

> "The Gemini API Free Tier is only available when using a Cloud project **without a billing account linked**. Once you set up billing on your project, **all usage becomes billable**, even if it falls within the usage amounts that would otherwise be free."
>
> Source: https://ai.google.dev/gemini-api/docs/billing

**VIOLATION**:
1. My project has billing enabled (required for Cloud Run)
2. Gemini automatically switched from Free Tier to Paid Tier
3. **ZERO notification** of this switch
4. **ZERO warning** that billing account makes all Gemini usage paid
5. **NO opt-out option** provided

---

### What Google SHOULD Have Done (per their own standards):

✅ Show warning: "Your project has billing enabled. Gemini usage will be charged at $5.50 per investigation."
✅ Provide confirmation dialog before first paid use
✅ Send notification when switching from Free Tier to Paid Tier
✅ Allow user to create separate non-billing project for free usage

### What Google ACTUALLY Did:

❌ Zero warnings about paid usage
❌ Zero notification of Free→Paid tier switch
❌ Silent auto-switching based on billing account status
❌ 60-day delay before showing charges

---

**CONCLUSION**: Google violated their own transparency principles by failing to "ensure user understands computationally expensive operations before accepting them."

---

## 🔗 SUPPORTING REFERENCES

1. Google Workspace Gemini Features: https://workspace.google.com/gemini
2. GCP Billing Best Practices: https://cloud.google.com/billing/docs/how-to/budgets
3. **Gemini API Billing Documentation**: https://ai.google.dev/gemini-api/docs/billing
4. **Gemini CLI Pricing Warning**: https://google-gemini.github.io/gemini-cli/docs/quota-and-pricing#tips-to-avoid-high-costs
5. Consumer Protection Laws (Indonesia): UU No. 8 Tahun 1999
6. FTC Deceptive Practices: https://www.ftc.gov/enforcement/statutes

---

**Prepared**: 2025-10-16 02:45 UTC
**Document Version**: 1.1 (Updated with Google's own documentation evidence)
**Last Updated**: 2025-10-16 03:30 UTC
**Status**: Submitted to Google Cloud Support

---

**END OF EVIDENCE PACKAGE**
