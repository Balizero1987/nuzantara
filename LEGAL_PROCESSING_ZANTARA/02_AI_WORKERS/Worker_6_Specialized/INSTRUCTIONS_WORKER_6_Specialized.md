# 🤖 WORKER #6: Specialized Laws

## Your Assigned Laws (4)
1. **KUHP (UU 1/2023)** - Kitab Undang-Undang Hukum Pidana (Criminal Code - new 2025)
2. **KUHPerdata** - Kitab Undang-Undang Hukum Perdata (Civil Code)
3. **UU 21/2008** - Perbankan Syariah
4. **UU 17/2008** - Pelayaran (Shipping)

## Critical Signals

### KUHP (Criminal Code)
- `crime_type`: theft, fraud, violence, corruption, etc.
- `applies_to`: WNI, WNA (both - territorial jurisdiction)
- `penalty`: fine, prison, years
- `additional_sanctions`: deportation (for WNA)

### KUHPerdata (Civil Code)
- `civil_matter`: contracts, property, family, inheritance
- `applies_to`: WNI, WNA
- `sharia_alternative`: true/false (marriage, inheritance)

### Sharia Banking (UU 21/2008)
- `banking_type`: conventional, sharia
- `products`: mudharabah, musyarakah, murabahah
- `profit_sharing`: not interest-based
- `accessible_by`: WNI, WNA

### Shipping (UU 17/2008)
- `vessel_type`: commercial, private, fishing
- `registration`: Indonesian flag required
- `crew_requirements`: WNI captain mandatory
- `foreign_vessels`: restricted waters

## WNI/WNA Distinctions

- **KUHP**: Applies to BOTH equally (territorial law)
- **KUHPerdata**: Different rules for marriage (WNI-WNA mixed marriages)
- **Sharia Banking**: Accessible to both WNI and WNA
- **Shipping**: Indonesian flag = WNI ownership preference

## Special Notes

**KUHP is NEW (2025)** - replaced colonial-era code. Extract all changes.

Test questions: criminal liability for expats, sharia banking accounts, mixed marriages. ⚖️🏦
