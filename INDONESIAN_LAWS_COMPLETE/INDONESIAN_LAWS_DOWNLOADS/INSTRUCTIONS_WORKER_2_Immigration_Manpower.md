# 🤖 WORKER #2: Immigration & Manpower Laws

## Your Assigned Laws (4)
1. **UU 6/2011** - Keimigrasian
2. **PP 31/2013** - KITAS/KITAP
3. **UU 13/2003** - Ketenagakerjaan  
4. **Perpres 20/2018** - TKA (Tenaga Kerja Asing)

## Critical Signals to Extract

- `visa_type`: tourist, business, KITAS, KITAP
- `duration`: 30d, 60d, 1yr, 2yr, 5yr, permanent
- `applies_to`: WNI, WNA
- `sponsorship_required`: true/false
- `work_permit_required`: true/false
- `eligible_sectors`: which KBLI codes
- `quota_limits`: TKA quotas per sector
- `minimum_salary`: IDR amount for TKA
- `local_worker_ratio`: Indonesian vs foreign workers
- `renewal_process`: automatic, manual, requirements

## Test Question Examples

**WNI**: "Saya kerja di luar negeri, bagaimana status imigrasi saya?"
**WNA**: "Can I work in Indonesia with tourist visa?"
**Mixed**: "PT PMA needs 5 TKA - what's the process and local worker requirement?"

Follow same methodology as Worker #1. Good luck! 🛂
