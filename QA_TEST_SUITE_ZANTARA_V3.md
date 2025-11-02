# 🧪 ZANTARA v3 Ω - COMPREHENSIVE QA TEST SUITE
## Agent QA Specialist - 100 Test Cases

**Date:** 2025-11-02  
**Target:** https://zantara.balizero.com  
**Version:** v3 Ω  
**Tester Role:** Agent QA Specialist  

---

## 📋 TEST PARAMETERS & ACCEPTANCE CRITERIA

### Response Quality Standards
- ✅ **Accuracy**: ≥95% factually correct information
- ✅ **Completeness**: All relevant information included
- ✅ **Clarity**: Response understandable by non-experts
- ✅ **Response Time**: ≤3 seconds for simple queries, ≤10s for complex
- ✅ **Source Attribution**: Clear sources cited when applicable
- ✅ **Formatting**: Proper structure (lists, tables, paragraphs)

### Business Focus Areas
1. **KBLI Codes** (Indonesian Business Classification)
2. **Pricing & Costs** (Bali Zero official pricing)
3. **Legal Requirements** (Company setup, permits, licenses)
4. **Immigration/Visa** (KITAS, KITAP, visa types)
5. **Tax Obligations** (Corporate, personal, VAT)
6. **Property/Real Estate** (Ownership, titles, restrictions)
7. **Team/Staff** (Language support, departments)
8. **Collective Memory** (Cross-user learning)
9. **Ecosystem Analysis** (Complete business setup)

### Error Handling Standards
- ✅ Graceful handling of unclear queries
- ✅ Appropriate "I don't know" when needed
- ✅ Suggestions for query refinement
- ✅ No hallucination or invented data

---

## 🎯 TEST CATEGORIES

### Category 1: KBLI Codes & Business Classification (15 tests)

#### TC-001: Direct KBLI Code Lookup
**Query:** "What is KBLI code 56101?"
**Expected:**
- Code number: 56101
- Category: Restaurant/Food Services
- Minimum capital requirement
- Foreign ownership status
- Related requirements
**Pass Criteria:** All information accurate, complete

#### TC-002: Business Type to KBLI
**Query:** "What KBLI codes do I need for a restaurant in Bali?"
**Expected:**
- Multiple relevant codes (56101, 56102, 56104)
- Explanation of differences
- Capital requirements for each
- Recommendation based on business size
**Pass Criteria:** ≥3 codes, clear differentiation

#### TC-003: KBLI for Hotel Business
**Query:** "KBLI codes for hotel business"
**Expected:**
- Hotel codes (55111, 55130)
- Villa/guesthouse codes
- Minimum capital for each
- Foreign ownership restrictions
**Pass Criteria:** Complete hotel category coverage

#### TC-004: KBLI for E-commerce
**Query:** "What KBLI code for online retail business?"
**Expected:**
- E-commerce code (47911)
- High capital requirement (IDR 100B)
- Online retail restrictions
- Comparison with physical retail
**Pass Criteria:** Accurate capital & restrictions

#### TC-005: KBLI Search by Industry
**Query:** "Show me all KBLI codes for technology services"
**Expected:**
- Software development (62010)
- IT consulting (62020)
- Data processing (63110)
- Capital requirements
**Pass Criteria:** ≥5 relevant tech codes

#### TC-006: KBLI Capital Requirements
**Query:** "What is the minimum capital for KBLI 62010?"
**Expected:**
- Exact amount: IDR 10,000,000,000
- Foreign vs local requirements
- Capital verification process
**Pass Criteria:** Accurate amount, clear explanation

#### TC-007: KBLI Foreign Ownership
**Query:** "Can foreigners own 100% with KBLI 56101?"
**Expected:**
- Yes/No answer
- Percentage allowed
- Alternative structures if restricted
- DNI (Negative Investment List) reference
**Pass Criteria:** Clear ownership rules

#### TC-008: Multiple KBLI Codes
**Query:** "Can I have multiple KBLI codes for one company?"
**Expected:**
- Yes, allowed
- Additional capital per code
- Registration process
- Cost implications
**Pass Criteria:** Complete multi-KBLI guidance

#### TC-009: KBLI Category Search
**Query:** "What are all restaurant KBLI codes?"
**Expected:**
- Full list from category 561
- Warung, restaurant, cafe differences
- Capital range
- Special licenses needed
**Pass Criteria:** Complete category 561 list

#### TC-010: KBLI for Specific Activity
**Query:** "KBLI code for yoga studio and wellness center"
**Expected:**
- Relevant wellness codes
- Activity-based classification
- Combined business structure
**Pass Criteria:** Multiple relevant codes

#### TC-011: KBLI Closed to Foreigners
**Query:** "Which KBLI codes are closed to foreign investment?"
**Expected:**
- Retail (closed)
- Traditional markets
- Small-scale businesses
- DNI list reference
**Pass Criteria:** Accurate closed sectors

#### TC-012: KBLI Update/Change Process
**Query:** "How do I add a new KBLI code to existing company?"
**Expected:**
- OSS system process
- Amendment requirements
- Additional capital needed
- Timeline (2-4 weeks)
**Pass Criteria:** Step-by-step process

#### TC-013: KBLI vs NIB Relationship
**Query:** "What's the relationship between KBLI and NIB?"
**Expected:**
- NIB contains KBLI codes
- OSS system integration
- How to register both
**Pass Criteria:** Clear NIB/KBLI connection

#### TC-014: KBLI for Consulting
**Query:** "Business consulting KBLI code and requirements"
**Expected:**
- Code 70209
- Professional qualifications
- 100% foreign ownership allowed
- Lower capital vs other sectors
**Pass Criteria:** Consulting-specific details

#### TC-015: KBLI Verification
**Query:** "How can I verify if my KBLI code is correct?"
**Expected:**
- Official KBLI database reference
- Ministry of Trade resources
- Bali Zero verification service
**Pass Criteria:** Verification methods provided

---

### Category 2: Pricing & Cost Estimation (15 tests)

#### TC-016: KITAS Pricing
**Query:** "How much does a KITAS cost?"
**Expected:**
- Different KITAS types (E23, E28A, E33G)
- Offshore vs onshore pricing
- Processing time
- Renewal costs
**Pass Criteria:** Complete KITAS pricing table

#### TC-017: Company Setup Cost
**Query:** "Total cost to set up PT PMA in Bali?"
**Expected:**
- Notary fees
- Ministry registration
- NIB/KBLI fees
- Minimum capital
- Total estimate: IDR 20-30M
**Pass Criteria:** Itemized breakdown

#### TC-018: Quick Price Lookup
**Query:** "Quick price for B211A visa"
**Expected:**
- Exact price: IDR 2,300,000
- Single entry, 60 days
- Processing time
- Extension possibility
**Pass Criteria:** Fast, accurate response

#### TC-019: Compare Visa Prices
**Query:** "Compare prices between C1 tourist visa and D1 multiple entry"
**Expected:**
- C1: IDR 2,300,000 (single)
- D1: IDR 5,000,000 (1 year)
- Cost per entry comparison
- Recommendation
**Pass Criteria:** Clear comparison table

#### TC-020: Annual Business Costs
**Query:** "What are annual costs for running PT PMA?"
**Expected:**
- Tax reporting
- LKPM quarterly reports
- License renewals
- Accounting costs
- Total estimate
**Pass Criteria:** Complete annual breakdown

#### TC-021: KITAP vs KITAS Cost
**Query:** "Is KITAP more expensive than KITAS?"
**Expected:**
- Initial cost comparison
- Long-term cost analysis
- 5-year validity benefit
- Recommendation
**Pass Criteria:** TCO analysis

#### TC-022: Visa Extension Costs
**Query:** "How much to extend B211A visa?"
**Expected:**
- Extension cost per month
- Maximum extensions (4x)
- Alternative options
**Pass Criteria:** Extension pricing clear

#### TC-023: Work Permit Pricing
**Query:** "Cost for work permit (IMTA) for foreign staff?"
**Expected:**
- IMTA fees
- RPTKA fees
- Processing time
- Validity period
**Pass Criteria:** Complete work permit costs

#### TC-024: Property Purchase Costs
**Query:** "Additional costs when buying property in Bali?"
**Expected:**
- BPHTB tax (5%)
- Notary fees (1%)
- Legal fees
- Total: 7-10% of price
**Pass Criteria:** All hidden costs revealed

#### TC-025: Pricing by Service Type
**Query:** "Show all immigration service prices"
**Expected:**
- Visa types
- KITAS types
- KITAP
- Work permits
- Organized by category
**Pass Criteria:** Complete immigration pricing

#### TC-026: Business License Costs
**Query:** "How much for restaurant licenses in Bali?"
**Expected:**
- SIUP cost
- TDP cost
- HO (Izin Gangguan)
- Health permits
- Total estimate
**Pass Criteria:** Complete license costs

#### TC-027: Bulk Discount Inquiry
**Query:** "Do you offer discounts for multiple staff KITAS?"
**Expected:**
- Package pricing
- Volume discounts
- Corporate rates
- Contact information
**Pass Criteria:** Discount info or escalation

#### TC-028: Hidden Fees
**Query:** "Are there any hidden fees in company setup?"
**Expected:**
- Translation fees
- Legalization
- Rush processing
- Government fees
**Pass Criteria:** All potential fees disclosed

#### TC-029: Payment Methods
**Query:** "How can I pay for services?"
**Expected:**
- Bank transfer
- Credit card
- Installment options
- Payment terms
**Pass Criteria:** All payment options listed

#### TC-030: Price Validity
**Query:** "How long are these prices valid?"
**Expected:**
- Government fee updates
- Exchange rate impact
- Price guarantee period
**Pass Criteria:** Validity timeframe stated

---

### Category 3: Legal & Company Setup (15 tests)

#### TC-031: PT PMA Setup Process
**Query:** "Step by step process to set up PT PMA"
**Expected:**
- Investment plan (LKPM)
- Deed preparation
- Ministry approval
- NIB issuance
- Timeline (4-6 weeks)
**Pass Criteria:** Complete 10+ step process

#### TC-032: Foreign Ownership Limits
**Query:** "Can foreigners own 100% of restaurant business?"
**Expected:**
- Restaurant: Depends on KBLI
- 56101: Check DNI list
- Alternative: Joint venture
- Nominee arrangement risks
**Pass Criteria:** Clear ownership rules

#### TC-033: Required Documents
**Query:** "What documents needed to establish PT PMA?"
**Expected:**
- Passport copies
- Reference letters
- Capital proof
- Business plan
- Complete checklist (15+ docs)
**Pass Criteria:** Exhaustive document list

#### TC-034: Company Name Rules
**Query:** "Rules for choosing PT PMA company name?"
**Expected:**
- Must include "PT"
- No reserved words
- Uniqueness check
- Approval process
**Pass Criteria:** All naming rules

#### TC-035: Director Requirements
**Query:** "Can foreigner be director of PT PMA?"
**Expected:**
- Yes, allowed
- KITAS requirement
- Responsibilities
- Legal implications
**Pass Criteria:** Director eligibility clear

#### TC-036: Shareholder Structure
**Query:** "Minimum number of shareholders for PT PMA?"
**Expected:**
- Minimum: 2 shareholders
- Can be individuals or entities
- Foreign vs local mix
**Pass Criteria:** Shareholder rules complete

#### TC-037: Legal Framework
**Query:** "What Indonesian laws govern PT PMA?"
**Expected:**
- Company Law (UU PT)
- Investment Law
- KBLI regulations
- Tax laws
**Pass Criteria:** Key legal references

#### TC-038: Business Address
**Query:** "Can I use virtual office for PT PMA?"
**Expected:**
- Virtual office: Limited acceptance
- Domicile letter (Surat Keterangan Domisili)
- Physical presence requirements
**Pass Criteria:** Address requirement clarity

#### TC-039: Company Amendment
**Query:** "How to change company directors in PT PMA?"
**Expected:**
- Shareholder meeting
- Deed amendment
- Ministry notification
- Timeline & cost
**Pass Criteria:** Amendment process clear

#### TC-040: Dissolution Process
**Query:** "How to close a PT PMA company?"
**Expected:**
- Shareholder resolution
- Tax clearance
- Debt settlement
- Liquidation process
- Timeline: 6-12 months
**Pass Criteria:** Full dissolution steps

#### TC-041: Annual Obligations
**Query:** "What are annual legal requirements for PT PMA?"
**Expected:**
- Annual financial statements
- Shareholder meeting
- LKPM reports (quarterly)
- Tax filings
**Pass Criteria:** Complete annual checklist

#### TC-042: Permits vs Licenses
**Query:** "What's the difference between permit and license?"
**Expected:**
- Permit: Activity-specific
- License: Business-specific
- Examples of each
**Pass Criteria:** Clear distinction

#### TC-043: Foreign Investment Restrictions
**Query:** "Which sectors are restricted for foreign investment?"
**Expected:**
- DNI (Negative Investment List)
- Closed sectors
- Conditional sectors
- Open sectors
**Pass Criteria:** DNI summary provided

#### TC-044: Joint Venture Structure
**Query:** "How does joint venture PT PMA work?"
**Expected:**
- Foreign-local partnership
- Ownership split options
- Agreement requirements
- Profit sharing
**Pass Criteria:** JV structure explained

#### TC-045: Representative Office
**Query:** "Can I open representative office instead of PT PMA?"
**Expected:**
- Rep office limitations
- Cannot generate revenue
- Setup requirements
- When appropriate
**Pass Criteria:** Rep office vs PT PMA comparison

---

### Category 4: Immigration & Visa Services (15 tests)

#### TC-046: Visa Type Recommendation
**Query:** "I want to retire in Bali, which visa should I get?"
**Expected:**
- Retirement visa options
- Age requirements (55+)
- KITAP for retirees
- Financial requirements
**Pass Criteria:** Retirement-specific guidance

#### TC-047: KITAS for Remote Workers
**Query:** "Can I get KITAS as digital nomad working remotely?"
**Expected:**
- E33G (Second Home visa)
- Requirements
- Cannot work for Indonesian company
- Tax implications
**Pass Criteria:** Remote work visa clear

#### TC-048: Visa Overstay Penalties
**Query:** "What happens if I overstay my visa?"
**Expected:**
- IDR 1,000,000 per day fine
- Deportation risk
- Ban from re-entry
- Legal process
**Pass Criteria:** Penalties clearly stated

#### TC-049: Family Dependent Visa
**Query:** "Can my spouse and children get visa if I have KITAS?"
**Expected:**
- Dependent KITAS (312)
- Spouse requirements
- Children age limits
- Costs per dependent
**Pass Criteria:** Family visa details

#### TC-050: KITAS to KITAP Conversion
**Query:** "How to upgrade from KITAS to KITAP?"
**Expected:**
- 3 consecutive years KITAS required
- Application process
- Benefits of KITAP
- Costs
**Pass Criteria:** Conversion process clear

#### TC-051: Visa on Arrival Extension
**Query:** "Can I extend visa on arrival?"
**Expected:**
- VOA: 1x extension (30 days)
- Cost & process
- Where to extend
- Alternative options
**Pass Criteria:** VOA extension accurate

#### TC-052: Work Permit Requirements
**Query:** "Do I need work permit separate from KITAS?"
**Expected:**
- Yes, IMTA required
- RPTKA (work plan)
- Employer sponsorship
- Processing time
**Pass Criteria:** Work permit vs KITAS distinction

#### TC-053: Sponsor Requirements
**Query:** "Who can sponsor my KITAS application?"
**Expected:**
- Indonesian entity (PT)
- Individual sponsor (spouse)
- Sponsorship letter
- Responsibilities
**Pass Criteria:** Sponsor types explained

#### TC-054: Medical Requirements
**Query:** "What medical checks needed for KITAS?"
**Expected:**
- Health check in Indonesia
- Approved clinics
- Tests required (HIV, TB, drugs)
- Costs
**Pass Criteria:** Medical process detailed

#### TC-055: Police Clearance
**Query:** "Do I need police clearance certificate for visa?"
**Expected:**
- SKCK from home country
- Legalization requirements
- Validity period
- Where to obtain
**Pass Criteria:** Police clearance clear

#### TC-056: Visa Processing Time
**Query:** "How long does KITAS take to process?"
**Expected:**
- Offshore: 4-6 weeks
- Onshore: 6-8 weeks
- Factors affecting timeline
- Rush options
**Pass Criteria:** Timeline expectations set

#### TC-057: Travel During KITAS Process
**Query:** "Can I travel while KITAS application is processing?"
**Expected:**
- Onshore: Limited travel
- MERP required
- Risks of travel
- Recommendations
**Pass Criteria:** Travel restrictions clear

#### TC-058: KITAS Renewal Process
**Query:** "When and how to renew KITAS?"
**Expected:**
- Renew 30 days before expiry
- Documents required
- Costs
- Cannot renew if expired
**Pass Criteria:** Renewal timeline clear

#### TC-059: Visa for Investor
**Query:** "Special visa for property investor?"
**Expected:**
- E28A investor KITAS
- Minimum investment
- Property ownership link
- Benefits
**Pass Criteria:** Investor visa explained

#### TC-060: Emergency Visa Situations
**Query:** "My passport expires before KITAS, what to do?"
**Expected:**
- Passport renewal first
- KITAS transfer to new passport
- Process & timeline
- Costs
**Pass Criteria:** Emergency procedure provided

---

### Category 5: Tax & Financial Obligations (10 tests)

#### TC-061: Corporate Tax Rate
**Query:** "What is corporate tax rate in Indonesia?"
**Expected:**
- 22% standard rate
- Taxable income definition
- Deductions allowed
- Filing deadline
**Pass Criteria:** Accurate tax rate & basics

#### TC-062: Personal Income Tax
**Query:** "How much personal income tax for foreigners?"
**Expected:**
- Progressive rates (5-35%)
- NPWP requirement
- Tax residency rules
- Filing obligations
**Pass Criteria:** PIT structure explained

#### TC-063: VAT Registration
**Query:** "When must company register for VAT?"
**Expected:**
- Revenue threshold: IDR 4.8B/year
- 11% rate
- Monthly filing
- PKP status
**Pass Criteria:** VAT requirements clear

#### TC-064: Tax Deductions
**Query:** "What expenses are tax deductible for PT PMA?"
**Expected:**
- Operating expenses
- Salaries
- Depreciation
- Interest (limitations)
**Pass Criteria:** Deduction list comprehensive

#### TC-065: NPWP Application
**Query:** "How to get NPWP for foreigner?"
**Expected:**
- KITAS required
- Online application
- Documents needed
- 1-2 week timeline
**Pass Criteria:** NPWP process clear

#### TC-066: Tax Treaty Benefits
**Query:** "Does Indonesia have tax treaty with my country?"
**Expected:**
- Request to specify country
- General treaty benefits
- Double taxation avoidance
- Where to check
**Pass Criteria:** Treaty concept explained

#### TC-067: Withholding Tax
**Query:** "What is withholding tax on dividends?"
**Expected:**
- 20% on dividends
- 20% on interest
- 15% on royalties
- Treaty rates may differ
**Pass Criteria:** WHT rates accurate

#### TC-068: Annual Tax Filing
**Query:** "When is deadline for annual corporate tax?"
**Expected:**
- 4 months after year-end
- For calendar year: April 30
- Late filing penalties
- Requirements
**Pass Criteria:** Filing deadline clear

#### TC-069: Tax Amnesty
**Query:** "Are there tax amnesty programs?"
**Expected:**
- Past amnesty programs
- Current status
- Voluntary disclosure
- Penalties
**Pass Criteria:** Current amnesty status

#### TC-070: Transfer Pricing
**Query:** "Transfer pricing rules for PT PMA?"
**Expected:**
- Arm's length principle
- Documentation requirements
- Related party transactions
- Penalties for non-compliance
**Pass Criteria:** TP basics covered

---

### Category 6: Property & Real Estate (10 tests)

#### TC-071: Foreign Property Ownership
**Query:** "Can foreigners buy property in Bali?"
**Expected:**
- Hak Milik: No (citizens only)
- Hak Pakai: Yes (25 years)
- Leasehold: Yes (25-30 years)
- Options explained
**Pass Criteria:** Ownership types clear

#### TC-072: Property Title Types
**Query:** "Explain different property titles in Indonesia"
**Expected:**
- Hak Milik (freehold)
- Hak Guna Bangunan (HGB)
- Hak Pakai
- Hak Sewa
- Comparison table
**Pass Criteria:** All 4 types explained

#### TC-073: Leasehold Agreement
**Query:** "What to include in property leasehold contract?"
**Expected:**
- Lease term (max 25 years)
- Extension options
- Payment terms
- Termination clauses
- Legal requirements
**Pass Criteria:** Contract essentials listed

#### TC-074: Property Purchase Process
**Query:** "Step by step to buy property as foreigner"
**Expected:**
- Due diligence
- Notary selection
- Title check
- BPHTB tax payment
- Registration
- Timeline
**Pass Criteria:** 8+ steps detailed

#### TC-075: Property Taxes
**Query:** "What taxes on property ownership?"
**Expected:**
- PBB (annual property tax)
- BPHTB (transfer tax 5%)
- Rental income tax
- Rates and filing
**Pass Criteria:** All property taxes covered

#### TC-076: Nominee Structure Risks
**Query:** "Is nominee arrangement safe for property?"
**Expected:**
- Legal risks
- Not recommended
- Why it's used
- Safer alternatives
**Pass Criteria:** Risks clearly warned

#### TC-077: Villa Investment ROI
**Query:** "Return on investment for rental villa?"
**Expected:**
- Average occupancy rates
- Rental yields in Bali
- Operating costs
- Break-even timeline
**Pass Criteria:** Realistic ROI estimates

#### TC-078: Property Due Diligence
**Query:** "How to verify property title is legitimate?"
**Expected:**
- Land office (BPN) check
- Certificate verification
- Encumbrance check
- Legal review
**Pass Criteria:** Verification steps listed

#### TC-079: Building Permits
**Query:** "Permits required to build house in Bali?"
**Expected:**
- IMB (building permit)
- Environmental permit
- Neighbor approval
- Timeline & costs
**Pass Criteria:** Building permit process

#### TC-080: Property for Business
**Query:** "Can I use residential property for business?"
**Expected:**
- Zoning restrictions
- HO (business permit) required
- Residential vs commercial
- Penalties
**Pass Criteria:** Zoning rules explained

---

### Category 7: Team & Operations (5 tests)

#### TC-081: Find Italian Speaker
**Query:** "Do you have Italian speaking staff?"
**Expected:**
- Yes, Italian department
- Staff names if public
- Contact method
- Services in Italian
**Pass Criteria:** Italian support confirmed

#### TC-082: Department Structure
**Query:** "What departments does Bali Zero have?"
**Expected:**
- Immigration
- Legal
- Accounting
- IT/Tech
- Customer service
- Team size
**Pass Criteria:** Org structure provided

#### TC-083: Staff Expertise
**Query:** "Who handles property legal matters?"
**Expected:**
- Property department
- Relevant staff
- Expertise areas
- Contact method
**Pass Criteria:** Property team identified

#### TC-084: Language Support
**Query:** "What languages do you support?"
**Expected:**
- Italian
- English
- Indonesian
- Ukrainian
- Others
**Pass Criteria:** Language list complete

#### TC-085: Contact Preference
**Query:** "I prefer WhatsApp, can I contact via WhatsApp?"
**Expected:**
- WhatsApp number
- Business hours
- Response time
- Alternative channels
**Pass Criteria:** Contact options provided

---

### Category 8: Collective Memory & Learning (5 tests)

#### TC-086: Similar Business Setup
**Query:** "Has anyone else set up Italian restaurant recently?"
**Expected:**
- Collective memory search
- Similar cases (if any)
- Lessons learned
- Common challenges
**Pass Criteria:** Past experience surfaced

#### TC-087: Contribute Knowledge
**Query:** "I just completed restaurant setup, can I share my experience?"
**Expected:**
- Yes, contribution welcome
- How to contribute
- Benefits of sharing
- Verification process
**Pass Criteria:** Contribution mechanism clear

#### TC-088: Verify Information
**Query:** "How do I know this information is accurate?"
**Expected:**
- Source attribution
- Verification count
- Confidence score
- Update date
**Pass Criteria:** Credibility indicators shown

#### TC-089: Community Insights
**Query:** "What do other entrepreneurs say about business in Bali?"
**Expected:**
- Collective insights
- Common challenges
- Success factors
- Tips from community
**Pass Criteria:** Community wisdom shared

#### TC-090: Learn from Others
**Query:** "Show me experiences of other hotel owners"
**Expected:**
- Hotel-specific insights
- Common mistakes
- Best practices
- Timelines
**Pass Criteria:** Relevant experiences retrieved

---

### Category 9: Ecosystem Analysis (5 tests)

#### TC-091: Complete Restaurant Analysis
**Query:** "I want to open restaurant, give me complete business analysis"
**Expected:**
- KBLI codes
- Capital requirements
- Licenses needed
- Timeline
- Costs breakdown
- Success probability
- Risks & opportunities
**Pass Criteria:** 360° business analysis

#### TC-092: Compare Business Types
**Query:** "Compare hotel vs restaurant investment in Bali"
**Expected:**
- Capital comparison
- ROI comparison
- Complexity level
- Timeline
- Recommendation
**Pass Criteria:** Side-by-side comparison

#### TC-093: Expansion Analysis
**Query:** "I have 1 restaurant, should I open second location?"
**Expected:**
- Expansion costs
- Additional KBLI fees
- Operational complexity
- Market analysis
- Recommendation
**Pass Criteria:** Expansion feasibility assessed

#### TC-094: Compliance Check
**Query:** "Am I complying with all regulations for my cafe?"
**Expected:**
- License checklist
- Permit verification
- Missing requirements
- Remediation steps
**Pass Criteria:** Compliance audit provided

#### TC-095: Optimization Opportunities
**Query:** "How can I reduce costs for my PT PMA?"
**Expected:**
- Tax optimization
- Operational efficiency
- Cost-cutting opportunities
- Incentive programs
**Pass Criteria:** Actionable optimization tips

---

### Category 10: Edge Cases & Error Handling (5 tests)

#### TC-096: Ambiguous Query
**Query:** "Help me with business"
**Expected:**
- Clarification questions
- Service categories offered
- Suggestions to narrow down
- No assumption/guessing
**Pass Criteria:** Proper clarification requested

#### TC-097: Out of Scope
**Query:** "What's the weather in Bali today?"
**Expected:**
- Polite out-of-scope message
- Redirect to relevant service
- Focus on business services
**Pass Criteria:** Graceful scope boundary

#### TC-098: Unknown Information
**Query:** "What's the KBLI code for quantum computing business?"
**Expected:**
- Honest "I don't know" or
- Closest relevant codes
- Suggestion to verify
- Offer to research
**Pass Criteria:** No hallucination

#### TC-099: Complex Multi-Part Query
**Query:** "I need KITAS for me and wife, setup PT PMA restaurant, buy villa, all costs and timeline"
**Expected:**
- Break down into components
- Address each part
- Integrated timeline
- Total cost estimate
**Pass Criteria:** Multi-part handled systematically

#### TC-100: Contradictory Information
**Query:** "You said foreigners can't own property, but earlier you said Hak Pakai is allowed?"
**Expected:**
- Clarify the distinction
- Freehold vs leasehold
- Apologize for confusion
- Provide clear explanation
**Pass Criteria:** Contradiction resolved clearly

---

## 📊 SCORING RUBRIC

### Individual Test Scoring (0-10 points each)

**10 points - Excellent:**
- All acceptance criteria met
- Exceeds expectations
- Proactive additional info
- Perfect formatting

**8-9 points - Good:**
- All main criteria met
- Minor improvements possible
- Clear and complete

**6-7 points - Acceptable:**
- Core information correct
- Some details missing
- Usable response

**4-5 points - Poor:**
- Partial information
- Significant gaps
- Requires clarification

**0-3 points - Failed:**
- Incorrect information
- Unusable response
- Hallucination present

### Overall Grade Scale

- **900-1000 points (90-100%):** Excellent - Production Ready
- **800-899 points (80-89%):** Good - Minor improvements needed
- **700-799 points (70-79%):** Acceptable - Moderate improvements needed
- **600-699 points (60-69%):** Poor - Major improvements needed
- **Below 600 (< 60%):** Failed - Not production ready

---

## 🎯 TEST EXECUTION PROCEDURE

### Pre-Test Setup
1. Clear browser cache
2. Open https://zantara.balizero.com
3. Note system date/time
4. Record browser/device info
5. Prepare test data collection sheet

### Test Execution
1. Enter query exactly as written
2. Start timer
3. Wait for complete response
4. Stop timer
5. Evaluate against criteria
6. Screenshot response
7. Record score and notes
8. Move to next test

### Post-Test Analysis
1. Calculate total score
2. Identify failure patterns
3. Categorize issues
4. Prioritize fixes
5. Generate report

---

## 📝 TRANSCRIPTION FORMAT

For each test, record:

```
TEST ID: TC-XXX
CATEGORY: [Category Name]
QUERY: "[Exact query text]"
TIMESTAMP: [HH:MM:SS]
RESPONSE TIME: [X.XX seconds]

RESPONSE:
[Full verbatim transcription of response]

EVALUATION:
✅/❌ Accuracy: [Comments]
✅/❌ Completeness: [Comments]
✅/❌ Clarity: [Comments]
✅/❌ Sources: [Comments]
✅/❌ Formatting: [Comments]

SCORE: [X/10]
NOTES: [Additional observations]
SCREENSHOT: [Filename]
---
```

---

## 🚨 CRITICAL ISSUES TO FLAG IMMEDIATELY

1. **Data Accuracy Errors:** Wrong prices, incorrect legal info
2. **Hallucinations:** Invented data, fake sources
3. **Security Issues:** Exposed sensitive data
4. **Performance Issues:** > 30 second response time
5. **System Errors:** Crashes, errors, timeouts

---

## 📅 TEST SCHEDULE

**Phase 1:** TC-001 to TC-050 (Day 1-2)
**Phase 2:** TC-051 to TC-100 (Day 3-4)
**Analysis:** Day 5
**Report:** Day 6

---

## ✅ DELIVERABLES

1. **Complete Test Results:** All 100 tests scored
2. **Transcription Log:** Full responses documented
3. **Screenshot Archive:** Visual evidence
4. **Issues List:** Prioritized defects
5. **Executive Summary:** Overall assessment
6. **Recommendations:** Improvement priorities

---

**Prepared by:** Agent QA Specialist  
**Version:** 1.0  
**Date:** 2025-11-02  
**Status:** Ready for Execution

