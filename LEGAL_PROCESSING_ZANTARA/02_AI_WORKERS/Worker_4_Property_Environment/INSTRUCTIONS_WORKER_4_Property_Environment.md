# 🤖 WORKER #4: Property & Environment Laws

## Your Assigned Laws (5)
1. **UU 5/1960** - UUPA (Agraria - Land Law)
2. **PP 18/2021** - Hak Pengelolaan, Hak Atas Tanah
3. **UU 32/2009** - Lingkungan Hidup
4. **PP 22/2021** - Perlindungan Lingkungan Hidup
5. **UU 1/2011** - Perumahan dan Kawasan Permukiman

## Critical Signals

### For Land Law (UU 5/1960, PP 18/2021)
- `land_right_type`: Hak Milik, Hak Guna Usaha, Hak Guna Bangunan, Hak Pakai
- `citizenship_requirement`: WNI_only, WNA_allowed
- `duration`: 20yr, 30yr, 80yr, indefinite
- `renewable`: true/false
- `transferable`: true/false
- `location_restrictions`: which provinces/zones

### For Environment (UU 32/2009, PP 22/2021)
- `environmental_permit`: AMDAL, UKL-UPL
- `business_impact`: low, medium, high
- `monitoring_required`: true/false
- `sanctions`: administrative, criminal

### For Housing (UU 1/2011)
- `housing_type`: rumah tinggal, apartemen, rusunawa
- `ownership_by_WNA`: allowed/restricted
- `minimum_price`: IDR (for WNA purchases)

## Key WNI/WNA Distinctions

**Hak Milik** = WNI ONLY (permanent ownership)
**Hak Pakai** = WNA allowed (leasehold, 30-80 years)
**Hak Guna Bangunan** = Both WNI and WNA

Test questions must cover property purchase scenarios for both groups. 🏡
