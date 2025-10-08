"""
Category-Specific LLAMA Prompts for Intel Scraping
Each category has tailored extraction prompts optimized for actionable business intelligence
"""

from typing import Dict, List

class CategoryPrompts:
    """Centralized prompt management for all intel categories"""

    REGULATORY_CHANGES = """
Extract REGULATORY CHANGE information from this source.

REQUIRED INFORMATION (if present in source):
1. Regulation Number: Full format (e.g., "Perpres No. 10 Tahun 2024", "UU No. 6 Tahun 2023")
2. Effective Date: DD/MM/YYYY format
3. What Changed: Specific changes compared to previous regulation
4. Impact On: Select all that apply:
   - Visa holders (KITAS, KITAP, tourist visas)
   - PT/PT PMA owners (business entities)
   - Property owners (real estate, land)
   - Tax obligations (corporate, personal)
   - Labor/Employment (workers, employers)
   - Banking/Finance (accounts, transfers)
5. Compliance Deadline: When must affected parties take action
6. Penalties: Fines, sanctions, or consequences of non-compliance
7. Transition Period: Grace period for adaptation (if any)
8. Supersedes: Which previous regulation this replaces (if mentioned)

REGULATORY CONTEXT:
- Ministry/Agency issuing the regulation
- Implementation mechanism (automatic, requires application, etc.)
- Related regulations (supporting or amended)

OUTPUT FORMAT:
If source contains regulation affecting foreign businesses/individuals → Extract structured JSON
If regulation is domestic-only or non-relevant → Return {"status": "NOT_RELEVANT", "reason": "..."}
If insufficient data → Return {"status": "INSUFFICIENT_DATA", "extracted": [...]}

DO NOT:
- Invent regulation numbers or dates not explicitly stated
- Interpret legal language (extract verbatim)
- Include promotional content from law firms
- Speculate on future regulations

CRITICAL: Only extract regulations that directly impact expats, foreign investors, or international businesses in Indonesia.
"""

    VISA_IMMIGRATION = """
Extract VISA/IMMIGRATION actionable data from this source.

FOCUS ON CHANGES (not static information):
1. What's NEW compared to last year/quarter/month
2. Cost changes (increases/decreases in IDR)
3. New or removed document requirements
4. Processing time changes (faster/slower)
5. Policy shifts (easier/harder to obtain)
6. Quota changes (annual visa caps)
7. New visa categories launched or discontinued

REQUIRED INFORMATION:
1. Visa Type: {KITAS, KITAP, B211A, E33, E28A, C312, D212, Tourist, etc.}
2. Change Type: {cost, documents, processing_time, policy, quota, new_category}
3. Effective Date: When change takes effect
4. Specific Impact: Who is affected (nationality, occupation, business type)
5. Old vs New: Clear comparison (e.g., "Was 7-14 days, now 21-30 days")

OPTIONAL DETAILS:
- Cost in IDR (government fees, not agency fees)
- Document checklist (what's added/removed)
- Processing timeline (working days)
- Extension procedures (if changed)
- Family visa implications (spouse, children)

OUTPUT FORMAT:
If source describes a CHANGE → Extract structured data with before/after
If source is generic visa guide → Return {"status": "SKIP", "reason": "Static information, not a change"}
If outdated (>2 years old) → Return {"status": "OUTDATED", "date": "..."}

DO NOT:
- Extract promotional content from visa agencies
- Include generic visa requirements we already know
- Speculate on未来 changes or rumors
- Mix multiple visa types in one extraction (separate them)

VALIDATION:
- Verify dates are realistic (not in distant past or far future)
- Cross-check if mentioned in official government sources
- Flag if source is Tier 0/3 (social media, unverified)

CRITICAL: Focus on ACTIONABLE changes that require client communication or service updates.
"""

    TAX_COMPLIANCE = """
Extract TAX COMPLIANCE intelligence from this source.

PRIORITY: Changes that require immediate client action or advisory.

REQUIRED INFORMATION:
1. Tax Type: {PPh_21, PPh_23, PPh_25, PPh_29, PPh_26, PPN, PPnBM, PBB, BPHTB}
2. Change Type: {rate, deadline, filing_requirement, incentive, penalty, system, treaty}
3. Effective Date: When change becomes applicable
4. Who Affected:
   - Individual taxpayers (resident/non-resident)
   - PT (local company)
   - PT PMA (foreign investment company)
   - Specific sectors or industries
5. Action Required: What clients must DO (file, pay, register, etc.)

SPECIFIC DATA TO EXTRACT:
- Rate Changes: Old % → New % (be precise)
- Deadline Shifts: Old date → New date (include monthly/annual)
- New Obligations: What wasn't required before
- Tax Incentives: How to qualify, how much savings
- System Changes: DJP Online, e-Filing, e-Billing updates
- Penalties: Late fees, interest rates (% per month/year)
- Tax Treaties: DTA updates with specific countries

REGULATORY CONTEXT:
- Regulation Number: PMK, UU, PP, SE, etc.
- Ministry: Usually Kemenkeu or DJP
- Background: Why the change (economic policy, harmonization, etc.)

OUTPUT FORMAT:
If actionable tax change → Extract with clear before/after comparison
If generic tax education → Return {"status": "SKIP_EDUCATIONAL"}
If historical data (>1 year old) → Flag as {"recency": "OLD", "date": "..."}

DO NOT:
- Include promotional content from accounting firms (unless pure educational)
- Extract complex tax calculations (just the rules)
- Speculate on tax planning strategies (facts only)
- Confuse personal vs corporate tax rules (separate clearly)

EXAMPLES OF GOOD EXTRACTIONS:
- "PPh 21 bracket for income 50-250 juta: was 15%, now 25%, effective 01/01/2024"
- "Annual SPT deadline moved from 31 March to 30 April for individuals, PMK-18/2024"
- "New e-Filing mandatory for PT PMA >5M revenue, effective Q2 2024, penalty 1 juta"

CRITICAL: Every extraction must answer "What should client do by when to stay compliant?"
"""

    BUSINESS_SETUP = """
Extract BUSINESS SETUP & LICENSING intelligence from this source.

FOCUS: Requirements and costs for foreign entrepreneurs setting up businesses in Indonesia.

REQUIRED INFORMATION:
1. Entity Type: {PT, PT_PMA, CV, Firma, Koperasi, Representative_Office}
2. Change Type: {capital_requirement, ownership_rule, dni_update, licensing, timeline, sector_opening}
3. Effective Date: When new rules apply
4. Sector/Industry: Specific KBLI code or business category

CAPITAL & OWNERSHIP:
- Minimum Capital: IDR amount (authorized + paid-up)
- Foreign Ownership: Percentage allowed (0-100%)
- Local Partner Required: Yes/No, conditions
- Investment Tiers: Small/Medium/Large thresholds

LICENSING REQUIREMENTS:
- OSS (Online Single Submission): NIB, KBLI changes
- Sector-Specific Licenses: Tourism (TDUP), F&B (SIUP-MB), Tech, etc.
- Import Licenses: API, API-P (if applicable)
- Environmental: UKL-UPL, AMDAL requirements

DNI (NEGATIVE INVESTMENT LIST) UPDATES:
- Sectors opened to foreigners (previously closed)
- Sectors restricted (previously open)
- Ownership % changes per sector
- Conditions/requirements for foreign entry

TIMELINE & COSTS:
- Incorporation Timeline: How many days (realistic)
- Government Fees: Official costs (not service fees)
- Required Steps: AHU, NPWP, KITAS director, bank account, etc.

OUTPUT FORMAT:
If impacts foreign business setup → Extract structured data
If promotional law firm content → Validate educational value, flag as {"source_bias": "promotional"}
If sector-specific → Clearly tag sector/KBLI

DO NOT:
- Include service provider pricing (only government fees)
- Extract outdated DNI (verify year/version)
- Mix entity types (PT vs PT PMA have different rules)
- Speculate on "easy" or "difficult" (objective facts only)

VALIDATION RULES:
- Capital amounts must be in IDR (convert if in USD)
- Ownership % must total 100%
- Timeline must be in working days (exclude holidays)
- KBLI codes must be 5 digits

EXAMPLES:
- "PT PMA minimum capital: was 10 miliar, now 2.5 miliar for certain sectors, PP-10/2024"
- "E-commerce sector: foreigners can own 100% (was 49%), DNI Perpres 10/2024, effective immediately"
- "PT incorporation via OSS: now 3-5 days (was 14 days), automation implemented Q1 2024"

CRITICAL: Focus on CHANGES and REQUIREMENTS that affect Bali Zero's service offerings (PT/PT PMA setup).
"""

    REAL_ESTATE_LAW = """
Extract PROPERTY LAW & REAL ESTATE REGULATION intelligence from this source.

FOCUS: Legal and regulatory aspects (NOT market trends or listings).

REQUIRED INFORMATION:
1. Property Type: {land, villa, house, apartment, commercial, industrial}
2. Property Rights: {Hak_Milik, HGB, Hak_Pakai, Hak_Sewa, Strata_Title}
3. Change Type: {ownership_rule, permit, tax, zoning, transfer_process}
4. Location: {Bali-specific, National, Province-specific}
5. Effective Date: When regulation takes effect

OWNERSHIP RULES:
- Foreign Ownership: Allowed/Restricted, conditions
- Leasehold Duration: Years allowed, extension rules
- Nominee Schemes: Legal status, risks
- Spouse Ownership: Rules for foreigners married to Indonesians
- Company Ownership: PT PMA holding property requirements

PERMITS & PROCESS:
- IMB (Building Permit): Requirements, timeline
- SLF (Function Certificate): When required
- PBG (Building Approval): New system updates
- Transfer Process: AJB, PPJB, notary requirements
- BPN Registration: Land certificate procedures

TAX & FEES:
- PBB (Property Tax): Annual rate %, changes
- BPHTB (Transfer Tax): Buyer's tax on acquisition
- Notary Fees: Standard rates or changes
- Tax Exemptions: First-time buyer, certain property types

ZONING & DEVELOPMENT:
- Land Use Zoning: Residential, commercial, mixed-use
- Green Belt Restrictions: Protected areas
- Building Height Limits: By zone
- Tourism Zone Rules: Bali-specific (e.g., Canggu, Ubud)

OUTPUT FORMAT:
If property law/regulation → Extract structured data
If market analysis (prices, trends) → Return {"status": "SKIP_MARKET_DATA"}
If wrong category detected → Return {"status": "WRONG_CATEGORY", "detected": "..."}

VALIDATION - REJECT IF:
- Content about machinery (alat berat, agricultural equipment)
- Shipping/logistics (not property)
- Interior design (not regulatory)
- Property listings (not legal information)

BLACKLIST KEYWORDS (auto-reject):
- "machinery", "alat berat", "equipment"
- "shipping", "logistics", "tug boat"
- "pupuk", "irigasi" (agricultural, not real estate)
- "for sale", "for rent" (unless discussing legal process)

EXAMPLES:
- "HGB duration: was 20 years renewable, now 30 years initial, PMK-5/2024, applies Bali"
- "BPHTB rate: 5% (was 3%) for property >2 miliar, Perda Bali 8/2024, effective 01/07/2024"
- "Foreigners can hold HGB via PT PMA with 100% ownership in tourism zones, Perpres 12/2024"

CRITICAL: Only extract LEGAL/REGULATORY information. Flag and reject market data, listings, or off-topic content.
"""

    BANKING_FINANCE = """
Extract BANKING & FINANCE REGULATION intelligence from this source.

FOCUS: Compliance requirements for foreign residents and businesses.

REQUIRED INFORMATION:
1. Regulation Type: {account_opening, foreign_reporting, forex, aml_kyc, transfer_limits, interest_rates}
2. Change Type: {requirement, limit, rate, deadline, system, penalty}
3. Who Affected: {individuals, PT, PT_PMA, specific_nationalities}
4. Effective Date: Implementation timeline

ACCOUNT OPENING & MAINTENANCE:
- KYC Requirements: Documents needed (KITAS, NPWP, etc.)
- Minimum Balance: IDR amount, per account type
- Foreigner Restrictions: Specific bank policies
- NPWP Requirement: When mandatory for accounts
- Corporate Accounts: PT PMA requirements

FOREIGN REPORTING (LHDN):
- Reporting Obligations: What to declare
- Deadlines: Filing dates (annual, specific months)
- Thresholds: Income/asset amounts triggering reporting
- Penalties: Late filing, non-compliance fines
- Tax Treaty Benefits: How to claim

FOREX & TRANSFERS:
- Transfer Limits: IDR/USD, in/out of Indonesia
- Documentation Required: For transfers >$X
- Currency Regulations: IDR restrictions
- Offshore Account Rules: Declaration requirements
- Repatriation: Dividend/profit transfer rules for PT PMA

KYC/AML UPDATES:
- Enhanced Due Diligence: When required
- Beneficial Owner: Disclosure requirements
- Suspicious Transaction: Reporting thresholds
- PPATK Regulations: Anti-money laundering
- Sanctions Lists: Compliance requirements

INTEREST RATES & FEES:
- BI Rate: Central bank benchmark
- Deposit Rates: Foreign currency accounts
- Loan Rates: For businesses
- Transaction Fees: Changes in bank charges

OUTPUT FORMAT:
If regulatory compliance requirement → Extract with clear action items
If economic analysis only → Return {"status": "SKIP_ANALYSIS"}
If historical data (>6 months for rates) → Flag {"recency": "CHECK_CURRENT"}

DO NOT:
- Include bank promotional offers
- Extract stock market analysis (unless regulatory)
- Speculate on future rate changes
- Mix individual vs corporate requirements

EXAMPLES:
- "LHDN deadline: 31 March annually for individuals, penalties 1 juta + 2%/month, SE-DJP-43/2024"
- "Transfer limit without docs: was $10k, now $5k, BI Regulation 25/2024, effective Q2"
- "NPWP mandatory for account opening: all foreigners with KITAS, previously optional, OJK-12/2024"

CRITICAL: Every extraction must guide clients on "What to do by when to avoid penalties or account issues."
"""

    EMPLOYMENT_LAW = """
Extract EMPLOYMENT & LABOR LAW intelligence from this source.

FOCUS: Employer obligations and costs for businesses hiring in Indonesia.

REQUIRED INFORMATION:
1. Regulation Type: {minimum_wage, bpjs, severance, foreign_workers, contracts, overtime}
2. Location: {Bali, Jakarta, National, Province-specific}
3. Effective Date: Usually January 1st annually for wages
4. Numeric Values: IDR amounts, percentages, days/months

MINIMUM WAGE (UMK/UMP):
- Province/City: Specific location (e.g., Denpasar, Badung)
- Amount: IDR per month
- Increase %: vs previous year
- Sector Variations: If different by industry
- Implementation: January 1 (verify year)

BPJS CONTRIBUTIONS:
- BPJS Ketenagakerjaan (Employment):
  * JHT (Old Age): Employer %, Employee %
  * JKK (Work Accident): Employer % (varies by risk)
  * JKM (Death): Employer %
  * JP (Pension): Employer %, Employee %
- BPJS Kesehatan (Health):
  * Employer contribution %
  * Employee contribution %
  * Coverage class (1, 2, 3)

SEVERANCE & TERMINATION (PHK):
- Severance Formula: Months of salary
- Service Compensation: Long-service bonus
- Rights Compensation: Unused leave, etc.
- Calculation Base: Gross or net salary
- Contract Type: PKWT vs PKWTT differences

FOREIGN WORKERS (IMTA/RPTKA):
- IMTA Quota: Per sector/company
- RPTKA Requirements: Application process
- Processing Time: Days/weeks
- Costs: Government fees (USD)
- Local Worker Ratio: Indonesian:foreign required
- Restricted Positions: Jobs foreigners cannot hold

EMPLOYMENT CONTRACTS:
- PKWT (Fixed-term): Max duration, renewals
- PKWTT (Permanent): Probation period
- Outsourcing Rules: When allowed
- Working Hours: Standard, overtime limits
- Annual Leave: Minimum days

OVERTIME & HOLIDAYS:
- Overtime Rate: First hour, subsequent hours
- Holiday Pay: National holidays, Sundays
- Religious Holiday: Paid leave requirements

OUTPUT FORMAT:
If employer compliance requirement → Extract with costs/obligations
If labor union news → Return {"status": "SKIP_UNION_NEWS"} unless regulation
If strike/dispute → Skip unless regulatory impact

DO NOT:
- Extract employee rights advocacy (focus on employer obligations)
- Include HR best practices (only legal requirements)
- Speculate on wage increases (only official announcements)
- Mix locations (Bali vs Jakarta wages are different)

EXAMPLES:
- "UMK Bali 2024: Denpasar 2,880,000 IDR (+6.5%), Badung 2,930,000 IDR (+7%), Perpres Bali 98/2023"
- "BPJS Kesehatan: employer 4% (was 3%), employee 1%, effective 01/01/2024, PP-45/2023"
- "IMTA cost: $100/month per foreigner (was $1200/year), quarterly payment, Kemnaker Reg 8/2024"

VALIDATION:
- Wage amounts must be ≥ UMR minimum (verify not typo)
- BPJS % total (employer + employee) should be reasonable
- Dates usually January 1 for wages, verify year

CRITICAL: Focus on COSTS and COMPLIANCE deadlines. Clients need to budget payroll accurately.
"""

    COWORKING_ECOSYSTEM = """
Extract BUSINESS ECOSYSTEM intelligence from this source.

FOCUS: Practical resources for digital nomads and entrepreneurs in Bali.

REQUIRED INFORMATION:
1. Item Type: {coworking_space, networking_event, service_provider, community_initiative}
2. Location: Specific Bali area (Canggu, Seminyak, Ubud, Sanur, Denpasar, etc.)
3. Name: Business/event name
4. Contact: Website, Instagram, WhatsApp, email
5. Date: For events, opening dates, or publication date

COWORKING SPACES:
- Name & Location: Exact address or area
- Pricing: IDR per day/month/year
- Facilities: WiFi speed, meeting rooms, cafe, etc.
- Membership Types: Hot desk, dedicated desk, private office
- Opening Hours: 24/7 or limited
- Community: Events hosted, networking opportunities

NETWORKING EVENTS:
- Event Name & Topic: Clear description
- Date & Time: Specific schedule
- Location: Venue name and area
- Cost: Free or ticket price (IDR)
- Target Audience: Entrepreneurs, developers, digital nomads, etc.
- Organizer: Who's hosting

SERVICE PROVIDERS:
- Service Type: Lawyer, accountant, notary, visa agent, etc.
- Specialization: What they focus on (e.g., "foreigner tax specialist")
- Contact: How to reach them
- Pricing: Indicative rates (if mentioned)
- Location: Office or service area

COMMUNITY INITIATIVES:
- Initiative Type: Visa run groups, expat meetups, co-living, etc.
- How to Join: Requirements, contact
- Benefits: What participants get
- Cost: Membership fees (if any)

OUTPUT FORMAT:
If Bali-specific resource → Extract with full contact details
If Jakarta/Surabaya content → Return {"status": "WRONG_LOCATION", "detected": "..."}
If promotional spam → Flag {"quality": "PROMOTIONAL", "assess": true}

VALIDATION - MUST BE BALI:
- Reject if location is Jakarta, Surabaya, Bandung, etc.
- Accept if: Bali, Denpasar, Canggu, Seminyak, Ubud, Sanur, Uluwatu, etc.
- Flag if unclear location

CONTACT INFO EXTRACTION:
- Website: Full URL
- Instagram: @handle
- WhatsApp: +62 number (format properly)
- Email: full address
- Google Maps: Link if available

EXAMPLES:
- "Outpost Canggu: coworking, 150k IDR/day, 2M/month, high-speed WiFi, rooftop, @outpostcanggu"
- "Bali Entrepreneurs Meetup: every 1st Thursday, 7PM, Finns Canggu, free, RSVP via IG @balibizmeetup"
- "Visa Agent: Rizki Pratama, specializes KITAS for PT PMA, WA +62812-3456-7890, office Denpasar"

DO NOT:
- Extract unverified social media rumors
- Include outdated pricing (verify recency)
- List closed businesses (check if still operating)
- Extract purely lifestyle content (focus on business utility)

CRITICAL: Information must be ACTIONABLE - clients should be able to contact/visit/join immediately.
"""

    COMPETITOR_INTEL = """
Extract COMPETITOR INTELLIGENCE from this source.

⚠️ INTERNAL USE ONLY - DO NOT PUBLISH ⚠️

FOCUS: Competitor services, pricing, and market positioning.

REQUIRED INFORMATION:
1. Competitor Name: Company/brand name
2. Service Type: {pt_setup, pt_pma_setup, visa_kitas, tax_compliance, accounting, legal, other}
3. Observation Date: When info was captured
4. Source URL: Where found

PRICING INTELLIGENCE:
- Service: Specific offering (e.g., "PT PMA setup - standard package")
- Price: IDR or USD (specify currency)
- What's Included: Scope of service
- Timeline: Delivery promise (days/weeks)
- Payment Terms: Upfront, installments, etc.

SERVICE OFFERINGS:
- Core Services: Main business lines
- New Services: Recently launched
- Service Gaps: What they DON'T offer (our opportunity)
- Bundles: Package deals, discounts

UNIQUE SELLING POINTS (USP):
- Marketing Claims: What they emphasize
- Differentiators: "Fast", "cheap", "expat-focused", etc.
- Guarantees: Money-back, success guarantee, etc.
- Client Testimonials: Claims of success

PROMOTIONS & OFFERS:
- Discount: % off or IDR reduction
- Conditions: Time-limited, first-time client, etc.
- Referral Program: Incentives mentioned

MARKET POSITIONING:
- Target Audience: Who they serve (digital nomads, investors, corporates)
- Tone: Professional, casual, aggressive, consultative
- Brand Message: Key themes in their marketing

OUTPUT FORMAT:
Structured comparison table format:
{
  "competitor": "Name",
  "service": "PT PMA Setup",
  "price_idr": 60000000,
  "price_usd": 4000,
  "timeline_days": 30,
  "usp": ["Fast processing", "Government connections"],
  "date_observed": "2024-10-08",
  "source": "https://..."
}

DO NOT:
- Make subjective quality judgments ("they're bad")
- Speculate on their costs/margins
- Extract client private data (GDPR/privacy)
- Include unverified rumors

ANALYSIS QUESTIONS TO ANSWER:
1. Are we more expensive or cheaper? (by how much?)
2. Are we faster or slower? (timeline comparison)
3. What do they offer that we don't?
4. What's their main marketing angle?
5. Are they running promotions that undercut us?

EXAMPLES:
- "Cekindo: PT PMA setup, 65 juta IDR (we charge 70 juta), 25 days (we do 21 days), emphasizes 'expat-friendly English service'"
- "Paul Hype Page: KITAS renewal, $850 USD (we charge $900), 14 days, premium positioning, targets expats in Bali/Jakarta"
- "Competitor X: Launched accounting package 15 juta/year (we don't offer), targets small PT, pricing aggressive"

STRATEGIC USE:
- Pricing Review: Quarterly check if we're competitive
- Service Development: Identify gaps we should fill
- Marketing Response: Counter their USPs

⚠️ CONFIDENTIALITY: This data is for internal strategy only. Never share publicly or with clients.
"""

    MACRO_POLICY = """
Extract MACROECONOMIC POLICY intelligence from this source.

FOCUS: Economic changes that impact business decisions for expats/investors.

REQUIRED INFORMATION:
1. Indicator Type: {interest_rate, inflation, gdp_growth, exchange_rate, government_spending, subsidies}
2. Value: Specific number (%, IDR, growth rate)
3. Date: When announced/effective
4. Previous Value: For comparison (old → new)
5. Forecast: If future projection

MONETARY POLICY:
- BI Rate: Central bank interest rate (%)
- Impact: Borrowing costs for businesses
- Direction: Hike, cut, hold
- Rationale: Why BI made this decision
- Future Guidance: BI's outlook

INFLATION:
- CPI: Consumer Price Index (% YoY, MoM)
- Core Inflation: Excluding volatile items
- Impact: Cost of living, operational costs
- Sectors Most Affected: F&B, transport, etc.

EXCHANGE RATE:
- IDR/USD: Current rate and trend
- IDR Volatility: Stability analysis
- Impact: Import costs, remittances, PT PMA capital
- Central Bank Intervention: If mentioned

GDP GROWTH:
- Growth Rate: % (QoQ, YoY)
- Sectors Driving Growth: Tourism, manufacturing, etc.
- Forecast: Government/IMF/World Bank projections
- Investment Climate: Improving/deteriorating

GOVERNMENT SPENDING:
- Budget Allocation: Infrastructure, subsidies, social
- Priority Sectors: Where gov is investing
- Impact on Business: New tenders, opportunities
- Regional Focus: Java vs outer islands, Bali-specific

SUBSIDIES & INCENTIVES:
- Fuel Subsidies: Impact on transport/logistics costs
- Electricity: Price changes for businesses
- Tax Holidays: Investment incentives
- Export Incentives: For certain sectors

OUTPUT FORMAT:
If actionable economic change → Extract with business impact analysis
If academic theory → Return {"status": "SKIP_THEORY"}
If outdated (>3 months for rates) → Flag {"recency": "OLD", "verify": true}

DO NOT:
- Include stock market tips (not our focus)
- Extract complex econometric models
- Speculate on political implications (facts only)
- Confuse correlation with causation

IMPACT ANALYSIS (include):
- How This Affects: Foreign businesses, expats, investors
- Action Consideration: Should clients hedge currency? Lock in loans?
- Timing: When to act (if time-sensitive)

EXAMPLES:
- "BI Rate cut: 6.0% → 5.75% (25 bps), effective immediately, aim: stimulate growth, impact: cheaper business loans, consider refinancing"
- "Inflation: 2.8% YoY (target 2-4%), food prices +4.2%, impact: restaurant costs up, consider menu pricing review"
- "IDR weakened: 15,200 → 15,800 per USD (4% depreciation QTD), impact: imported goods costlier, exporters benefit, hedge USD exposure"
- "Govt infrastructure: 500T IDR Bali projects 2024, focus: new airport terminal, roads, impact: construction boom, consider related services"

STRATEGIC USE:
- Advisory: Help clients make informed financial decisions
- Content: "What BI Rate Cut Means for Your Business Loan"
- Positioning: Thought leadership, economic insights

CRITICAL: Translate macro data into MICRO business decisions. Clients need to know "So what should I do?"
"""

    @classmethod
    def get_prompt(cls, category_id: str) -> str:
        """Get prompt for specific category"""
        prompt_map = {
            'regulatory_changes': cls.REGULATORY_CHANGES,
            'visa_immigration': cls.VISA_IMMIGRATION,
            'tax_compliance': cls.TAX_COMPLIANCE,
            'business_setup': cls.BUSINESS_SETUP,
            'real_estate_law': cls.REAL_ESTATE_LAW,
            'banking_finance': cls.BANKING_FINANCE,
            'employment_law': cls.EMPLOYMENT_LAW,
            'coworking_ecosystem': cls.COWORKING_ECOSYSTEM,
            'competitor_intel': cls.COMPETITOR_INTEL,
            'macro_policy': cls.MACRO_POLICY,
        }
        return prompt_map.get(category_id, cls.REGULATORY_CHANGES)

    @classmethod
    def get_all_prompts(cls) -> Dict[str, str]:
        """Get all prompts as dictionary"""
        return {
            'regulatory_changes': cls.REGULATORY_CHANGES,
            'visa_immigration': cls.VISA_IMMIGRATION,
            'tax_compliance': cls.TAX_COMPLIANCE,
            'business_setup': cls.BUSINESS_SETUP,
            'real_estate_law': cls.REAL_ESTATE_LAW,
            'banking_finance': cls.BANKING_FINANCE,
            'employment_law': cls.EMPLOYMENT_LAW,
            'coworking_ecosystem': cls.COWORKING_ECOSYSTEM,
            'competitor_intel': cls.COMPETITOR_INTEL,
            'macro_policy': cls.MACRO_POLICY,
        }
